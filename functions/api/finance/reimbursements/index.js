// 报销提交 v2 - /api/finance/reimbursements
// POST：全体登录成员提交报销单；凭证按金额分级必传（未传齐不可提交）
//   body: { proposalId?, activityId?, expenseDate, amount, category, description, vouchers:[{type,url,name}], endorsement? }
//   endorsement（≥500 无发票场景必填）：{ committee: { name } } 经办人本人 + 1 名班委签字背书
// PUT /:id：待补正（need_revision）状态下由本人修改凭证/信息后重新提交
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, isMissingTableError, ensureTables, isViewerOnly, VIEWER_ONLY_MSG } from '../../../_utils.js'
import { COMMITTEE_ROLES } from '../../../_utils.js'
import { getFinanceConfig, VOUCHER_TYPES, newId } from '../../../_finance.js'
import { purgePublicCache } from '../../../_cache.js'

function voucherOk(url) {
  return /^https:\/\/files\.mint4\.cn\//.test(url || '') || /^\/files\//.test(url || '')
}

// 校验凭证与签字背书（按 v2 分级规则）；返回 { ok, missing[], needEndorsement }
function checkVouchers(vouchers, amount, config, endorsement) {
  const have = new Set(vouchers.map(v => v.type))
  const large = amount >= config.largeAmount
  const required = large ? [...config.largeVouchers] : [...config.smallVouchers]
  const missing = required.filter(t => !have.has(t))

  // 大额无发票：可改用「付款凭证 + 盖章收据/小票 + 经办人+1 班委签字背书」
  if (large && !have.has('invoice')) {
    const altMissing = ['payment', 'receipt'].filter(t => !have.has(t))
    const endorserName = endorsement?.committee?.name
    const endorserOk = endorserName && String(endorserName).trim()
    if (altMissing.length > 0) return { ok: false, missing: altMissing, needEndorsement: true }
    if (!endorserOk) return { ok: false, missing: [], needEndorsement: true, error: '大额支出无法提供发票时，需付款凭证 + 盖章收据/小票，并由经办人与 1 名班委签字背书' }
    return { ok: true, missing: [], needEndorsement: true }
  }
  if (missing.length > 0) return { ok: false, missing, needEndorsement: false }
  return { ok: true, missing: [], needEndorsement: false }
}

// 校验报销关联的预算公示：必须已通过（passed），且金额不超过公示预算上限（超预算部分不予支付，制度第五章）
async function verifyProposal(sql, proposalId, amount, env) {
  if (!proposalId || !String(proposalId).trim()) {
    return { ok: false, error: '报销必须关联一个已通过的预算公示（先公示后花钱，制度第十八条）' }
  }
  let rows
  try { rows = await sql`SELECT * FROM budget_proposals WHERE id = ${String(proposalId).trim()} LIMIT 1` }
  catch (e) {
    if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM budget_proposals WHERE id = ${String(proposalId).trim()} LIMIT 1` }
    else throw e
  }
  const p = rows[0]
  if (!p) return { ok: false, error: '未找到关联的预算公示' }
  if (p.status !== 'passed') return { ok: false, error: `只能关联「已通过」的预算公示（当前状态：${p.status}）` }
  const cap = Number(p.amount) || 0
  if (amount > cap * 1.000001) {
    return { ok: false, error: `报销金额 ¥${amount.toFixed(2)} 超过公示预算上限 ¥${cap.toFixed(2)}，超出部分不予支付（需重新公示并通过）` }
  }
  return { ok: true, proposal: p }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  // 班主任 / 传承人仅可查看，不能提交/修改报销单
  if (isViewerOnly(auth.user)) return corsResponse({ error: VIEWER_ONLY_MSG }, 403)
  if (request.method !== 'POST' && request.method !== 'PUT') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const config = await getFinanceConfig(env)
    const body = await parseBody(request)

    if (request.method === 'PUT') {
      const id = String(body.id || '')
      if (!id) return corsResponse({ error: '缺少报销单编号' }, 400)
      let rows
      try { rows = await sql`SELECT * FROM reimbursements WHERE id = ${id} LIMIT 1` }
      catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM reimbursements WHERE id = ${id} LIMIT 1` }
        else throw e
      }
      const rb = rows[0]
      if (!rb) return corsResponse({ error: '未找到该报销单' }, 404)
      if (rb.applicant_id !== auth.user.id) return corsResponse({ error: '只能补正自己提交的报销单' }, 403)
      if (rb.status !== 'need_revision') return corsResponse({ error: '仅待补正的报销单可修改重新提交' }, 400)

      const amount = Number(body.amount)
      if (!amount || amount <= 0) return corsResponse({ error: '报销金额需大于 0' }, 400)
      if (!body.description || !String(body.description).trim()) return corsResponse({ error: '请填写报销事项' }, 400)
      if (!body.expenseDate) return corsResponse({ error: '请选择消费日期' }, 400)
      const vp = await verifyProposal(sql, body.proposalId, amount, env)
      if (!vp.ok) return corsResponse({ error: vp.error }, 400)
      const vouchers = Array.isArray(body.vouchers) ? body.vouchers : []
      if (vouchers.length === 0) return corsResponse({ error: '请上传报销凭证' }, 400)
      for (const v of vouchers) {
        if (!v.type || !VOUCHER_TYPES.includes(v.type)) return corsResponse({ error: '存在无效的凭证类型' }, 400)
        if (!voucherOk(v.url)) return corsResponse({ error: '凭证必须上传到班级文件空间' }, 400)
      }
      const endorsement = body.endorsement && typeof body.endorsement === 'object' ? body.endorsement : null
      const chk = checkVouchers(vouchers, amount, config, endorsement)
      if (!chk.ok) {
        if (chk.missing.length > 0) return corsResponse({ error: '凭证不齐，还缺：' + chk.missing.join('、') }, 400)
        return corsResponse({ error: chk.error || '签字背书未完成' }, 400)
      }

      await sql`
        UPDATE reimbursements
        SET proposal_id = ${body.proposalId || null}, activity_id = ${body.activityId || null},
            expense_date = ${body.expenseDate}, amount = ${amount}, category = ${body.category || 'other'},
            description = ${String(body.description).trim()}, vouchers = ${JSON.stringify(vouchers)},
            endorsement = ${endorsement ? JSON.stringify(endorsement) : ''},
            status = 'submitted', audit_note = ''
        WHERE id = ${id}
      `
    await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '已补正并重新提交，等待会计审核', status: 'submitted' })
    }

    // POST 新提交
    const amount = Number(body.amount)
    if (!amount || amount <= 0) return corsResponse({ error: '报销金额需大于 0' }, 400)
    if (!body.description || !String(body.description).trim()) return corsResponse({ error: '请填写报销事项' }, 400)
    if (!body.expenseDate) return corsResponse({ error: '请选择消费日期' }, 400)
    const vp = await verifyProposal(sql, body.proposalId, amount, env)
    if (!vp.ok) return corsResponse({ error: vp.error }, 400)

    const vouchers = Array.isArray(body.vouchers) ? body.vouchers : []
    if (vouchers.length === 0) return corsResponse({ error: '请上传报销凭证' }, 400)
    for (const v of vouchers) {
      if (!v.type || !VOUCHER_TYPES.includes(v.type)) return corsResponse({ error: '存在无效的凭证类型' }, 400)
      if (!voucherOk(v.url)) return corsResponse({ error: '凭证必须上传到班级文件空间' }, 400)
    }
    const endorsement = body.endorsement && typeof body.endorsement === 'object' ? body.endorsement : null
    const chk = checkVouchers(vouchers, amount, config, endorsement)
    if (!chk.ok) {
      if (chk.missing.length > 0) return corsResponse({ error: '凭证不齐，还缺：' + chk.missing.join('、') }, 400)
      return corsResponse({ error: chk.error || '签字背书未完成' }, 400)
    }
    // 签字背书人须为班委且不同于经办人本人
    if (chk.needEndorsement) {
      const endorserName = String(endorsement?.committee?.name || '').trim()
      if (!endorserName) return corsResponse({ error: '请填写签字背书的班委姓名' }, 400)
      if (endorserName === auth.user.name) return corsResponse({ error: '背书班委不能与经办人本人相同（至少 2 人）' }, 400)
      if (!COMMITTEE_ROLES[endorserName]) return corsResponse({ error: '背书人须为班委成员' }, 400)
    }

    const id = newId('rb')
    try {
      await sql`
        INSERT INTO reimbursements (id, proposal_id, activity_id, applicant, applicant_id, expense_date, amount, category, description, vouchers, endorsement, status)
        VALUES (${id}, ${body.proposalId || null}, ${body.activityId || null}, ${auth.user.name}, ${auth.user.id}, ${body.expenseDate}, ${amount}, ${body.category || 'other'}, ${String(body.description).trim()}, ${JSON.stringify(vouchers)}, ${endorsement ? JSON.stringify(endorsement) : ''}, 'submitted')
      `
    } catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); await sql`
        INSERT INTO reimbursements (id, proposal_id, activity_id, applicant, applicant_id, expense_date, amount, category, description, vouchers, endorsement, status)
        VALUES (${id}, ${body.proposalId || null}, ${body.activityId || null}, ${auth.user.name}, ${auth.user.id}, ${body.expenseDate}, ${amount}, ${body.category || 'other'}, ${String(body.description).trim()}, ${JSON.stringify(vouchers)}, ${endorsement ? JSON.stringify(endorsement) : ''}, 'submitted')
      ` }
      else throw e
    }

    await purgePublicCache('finance-v2-public')
    return corsResponse({ message: '报销已提交，等待会计审核', id }, 201)
  } catch (err) {
    console.error('finance reimbursements 错误:', err)
    await purgePublicCache('finance-v2-public')
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
