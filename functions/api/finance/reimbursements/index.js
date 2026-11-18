// 报销提交 v2 - /api/finance/reimbursements
// POST：全体登录成员提交报销单；付款凭证必传（至少 1 张，可多张），发票/收据/小票/订单截图合并区选传
//   body: { id?(客户端预生成 rb 单号), proposalId?, activityId?, amount, category, description,
//           items:[{item,category,amount,note,date?}], vouchers:[{type,url,name}], endorsement? }
//   明细行日期选填；顶部 expense_date 由服务端取行内最早日期派生（无则空）
// PUT /:id：待补正（need_revision）状态下由本人修改凭证/信息后重新提交
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, isMissingTableError, ensureTables, isViewerOnly, VIEWER_ONLY_MSG } from '../../../_utils.js'
import { VOUCHER_TYPES, FINANCE_CATEGORIES, MAX_VOUCHERS_PER_REIMB, newId } from '../../../_finance.js'
import { purgePublicCache } from '../../../_cache.js'

function voucherOk(url) {
  return /^https:\/\/files\.mint4\.cn\//.test(url || '') || /^\/files\//.test(url || '')
}

// 校验凭证：仅要求至少 1 张付款凭证（payment）；proof 合并区及其他类型均为选传
function checkVouchers(vouchers) {
  const have = new Set(vouchers.map(v => v.type))
  if (!have.has('payment')) return { ok: false, missing: ['payment'] }
  return { ok: true, missing: [] }
}

// 统一校验凭证列表：类型白名单、文件空间归属、数量上限、付款凭证必传
function validateVoucherList(raw) {
  const vouchers = Array.isArray(raw) ? raw : []
  if (vouchers.length === 0) return { ok: false, error: '请上传报销凭证' }
  if (vouchers.length > MAX_VOUCHERS_PER_REIMB)
    return { ok: false, error: `凭证文件过多（每张报销单最多 ${MAX_VOUCHERS_PER_REIMB} 个）` }
  for (const v of vouchers) {
    if (!v.type || !VOUCHER_TYPES.includes(v.type)) return { ok: false, error: '存在无效的凭证类型' }
    if (!voucherOk(v.url)) return { ok: false, error: '凭证必须上传到班级文件空间' }
  }
  const chk = checkVouchers(vouchers)
  if (!chk.ok) return { ok: false, error: '凭证不齐，还缺：付款凭证（至少 1 张）' }
  return { ok: true, vouchers }
}

// 日期格式 YYYY-MM-DD（选填；空值放行）
function validDate(d) {
  return !d || /^\d{4}-\d{2}-\d{2}$/.test(d)
}

// 从明细行日期派生顶部消费日期：取最早的一个；全部为空则返回空串
function deriveExpenseDate(items) {
  const dates = items.map(it => it.date).filter(Boolean).sort()
  return dates[0] || ''
}


// 校验并规范化报销明细行：每行须有支出项目 + 费用性质 + 金额>0（备注、日期选填）；金额由服务端汇总，不信任客户端 amount
function normalizeItems(raw) {
  const list = Array.isArray(raw) ? raw : []
  if (list.length === 0) return { ok: false, error: '请至少填写一行报销明细', items: [], total: 0 }
  if (list.length > 30) return { ok: false, error: '明细行数过多（最多 30 行）', items: [], total: 0 }
  const items = []
  for (let i = 0; i < list.length; i++) {
    const it = list[i] || {}
    const name = String(it.item || it.name || '').trim()
    if (!name) return { ok: false, error: `第 ${i + 1} 行明细缺少支出项目`, items: [], total: 0 }
    const amount = Math.round((Number(it.amount) || 0) * 100) / 100
    if (!(amount > 0)) return { ok: false, error: `第 ${i + 1} 行明细金额需大于 0`, items: [], total: 0 }
    const category = String(it.category || '').trim()
    if (!FINANCE_CATEGORIES.includes(category)) return { ok: false, error: `第 ${i + 1} 行明细的费用性质无效`, items: [], total: 0 }
    const date = String(it.date || '').trim()
    if (!validDate(date)) return { ok: false, error: `第 ${i + 1} 行明细日期格式无效`, items: [], total: 0 }
    items.push({ item: name.slice(0, 60), category, amount, note: String(it.note || '').trim().slice(0, 120), date })
  }
  const total = Math.round(items.reduce((s, it) => s + it.amount, 0) * 100) / 100
  if (!(total > 0)) return { ok: false, error: '报销合计需大于 0', items: [], total: 0 }
  const cats = new Set(items.map(it => it.category))
  return { ok: true, items, total, category: cats.size === 1 ? items[0].category : 'other' }
}

// 草稿用宽松规范化：不强制项目/金额/分类，保留已填内容（金额可为 0、分类缺省回退 dining）；
// 过滤整行空白，但若全部为空则保留一个空行，避免草稿无明细
function normalizeDraftItems(raw) {
  const list = Array.isArray(raw) ? raw : []
  let items = []
  for (const it of list) {
    const name = String(it.item || it.name || '').trim().slice(0, 60)
    const amount = Math.round((Number(it.amount) || 0) * 100) / 100
    const category = FINANCE_CATEGORIES.includes(it.category) ? it.category : 'dining'
    const note = String(it.note || '').trim().slice(0, 120)
    const date = validDate(it.date) ? String(it.date).trim() : ''
    if (name || amount > 0 || note || date) items.push({ item: name, category, amount, note, date })
  }
  if (items.length === 0) items = [{ item: '', category: 'dining', amount: 0, note: '', date: '' }]
  const total = Math.round(items.reduce((s, it) => s + it.amount, 0) * 100) / 100
  const cats = new Set(items.map(it => it.category))
  return { items, total, category: cats.size === 1 ? items[0].category : 'other' }
}

// 草稿凭证：仅做类型/归属/数量上限的安全清洗，不要求付款凭证、允许为空
function sanitizeDraftVouchers(raw) {
  const list = Array.isArray(raw) ? raw : []
  return list
    .filter(v => v && v.type && VOUCHER_TYPES.includes(v.type) && voucherOk(v.url))
    .slice(0, MAX_VOUCHERS_PER_REIMB)
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
      if (rb.applicant_id !== auth.user.id) return corsResponse({ error: '只能修改自己提交的报销单' }, 403)
      if (!['need_revision', 'draft'].includes(rb.status)) return corsResponse({ error: '仅草稿或待补正的报销单可修改' }, 400)

      const saveDraft = body.saveDraft === true
      const endorsement = body.endorsement && typeof body.endorsement === 'object' ? body.endorsement : null

      if (saveDraft) {
        const nd = normalizeDraftItems(body.items)
        const vouchers = sanitizeDraftVouchers(body.vouchers)
        await sql`
          UPDATE reimbursements
          SET proposal_id = ${body.proposalId || null}, activity_id = ${body.activityId || null},
              expense_date = ${deriveExpenseDate(nd.items)}, amount = ${nd.total}, category = ${nd.category},
              description = ${String(body.description || '').trim()}, items = ${JSON.stringify(nd.items)},
              vouchers = ${JSON.stringify(vouchers)}, endorsement = ${endorsement ? JSON.stringify(endorsement) : ''},
              status = 'draft'
          WHERE id = ${id}
        `
        await purgePublicCache('finance-v2-public')
        return corsResponse({ message: '草稿已更新，可随时继续填写', status: 'draft' })
      }

      const ni = normalizeItems(body.items)
      if (!ni.ok) return corsResponse({ error: ni.error }, 400)
      const amount = ni.total
      if (!body.description || !String(body.description).trim()) return corsResponse({ error: '请填写报销事项' }, 400)
      const vp = await verifyProposal(sql, body.proposalId, amount, env)
      if (!vp.ok) return corsResponse({ error: vp.error }, 400)
      const vcheck = validateVoucherList(body.vouchers)
      if (!vcheck.ok) return corsResponse({ error: vcheck.error }, 400)
      const vouchers = vcheck.vouchers
      const expenseDate = deriveExpenseDate(ni.items)

      await sql`
        UPDATE reimbursements
        SET proposal_id = ${body.proposalId || null}, activity_id = ${body.activityId || null},
            expense_date = ${expenseDate}, amount = ${amount}, category = ${ni.category},
            description = ${String(body.description).trim()}, items = ${JSON.stringify(ni.items)}, vouchers = ${JSON.stringify(vouchers)},
            endorsement = ${endorsement ? JSON.stringify(endorsement) : ''},
            status = 'submitted', audit_note = ''
        WHERE id = ${id}
      `
    await purgePublicCache('finance-v2-public')
      return corsResponse({ message: rb.status === 'draft' ? '已提交，等待会计审核' : '已补正并重新提交，等待会计审核', status: 'submitted' })
    }

    // POST 新单（草稿或正式提交）
    const saveDraft = body.saveDraft === true
    const endorsement = body.endorsement && typeof body.endorsement === 'object' ? body.endorsement : null

    // 单号优先使用客户端预生成 id（用于凭证文件命名）；格式非法或已存在则服务端重生成
    let id = ''
    const clientId = String(body.id || '').trim()
    if (/^rb-[a-z0-9]+(-[a-z0-9]+)?$/.test(clientId)) {
      const dup = await sql`SELECT id FROM reimbursements WHERE id = ${clientId} LIMIT 1`
      if (dup.length === 0) id = clientId
    }
    if (!id) id = newId('rb')

    if (saveDraft) {
      const nd = normalizeDraftItems(body.items)
      const vouchers = sanitizeDraftVouchers(body.vouchers)
      const draftInsert = () => sql`
        INSERT INTO reimbursements (id, proposal_id, activity_id, applicant, applicant_id, expense_date, amount, category, description, items, vouchers, endorsement, status)
        VALUES (${id}, ${body.proposalId || null}, ${body.activityId || null}, ${auth.user.name}, ${auth.user.id}, ${deriveExpenseDate(nd.items)}, ${nd.total}, ${nd.category}, ${String(body.description || '').trim()}, ${JSON.stringify(nd.items)}, ${JSON.stringify(vouchers)}, ${endorsement ? JSON.stringify(endorsement) : ''}, 'draft')
      `
      try { await draftInsert() }
      catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); await draftInsert() }
        else throw e
      }
      await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '草稿已保存，可随时继续填写', id, status: 'draft' })
    }

    // 正式提交
    const ni = normalizeItems(body.items)
    if (!ni.ok) return corsResponse({ error: ni.error }, 400)
    const amount = ni.total
    if (!body.description || !String(body.description).trim()) return corsResponse({ error: '请填写报销事项' }, 400)
    const vp = await verifyProposal(sql, body.proposalId, amount, env)
    if (!vp.ok) return corsResponse({ error: vp.error }, 400)

    const vcheck = validateVoucherList(body.vouchers)
    if (!vcheck.ok) return corsResponse({ error: vcheck.error }, 400)
    const vouchers = vcheck.vouchers
    const expenseDate = deriveExpenseDate(ni.items)

    const insertSql = () => sql`
        INSERT INTO reimbursements (id, proposal_id, activity_id, applicant, applicant_id, expense_date, amount, category, description, items, vouchers, endorsement, status)
        VALUES (${id}, ${body.proposalId || null}, ${body.activityId || null}, ${auth.user.name}, ${auth.user.id}, ${expenseDate}, ${amount}, ${ni.category}, ${String(body.description).trim()}, ${JSON.stringify(ni.items)}, ${JSON.stringify(vouchers)}, ${endorsement ? JSON.stringify(endorsement) : ''}, 'submitted')
      `
    try {
      await insertSql()
    } catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); await insertSql() }
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
