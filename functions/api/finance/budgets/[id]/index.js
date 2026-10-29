// 预算公示 v2（前台）重交 - PUT /api/finance/budgets/[id]
// 仅发起人本人：被程枭退回（status=returned）后修改资料重新提交 → 回到 submitted（待审批）
// body: 与 POST 发起相同字段（title/amount/groupName/eventType/activityType/payTarget/detailItems/redlines/contact/description/activityId）
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, isMissingTableError, ensureTables, isViewerOnly, VIEWER_ONLY_MSG } from '../../../../_utils.js'
import { getFinanceConfig } from '../../../../_finance.js'
import { GROUP_OPTIONS, EVENT_TYPE_OPTIONS, ACTIVITY_TYPE_OPTIONS, PAY_TARGET_OPTIONS } from '../index.js'
import { purgePublicCache } from '../../../../_cache.js'

function parseItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter(i => i && ((i.item && String(i.item).trim()) || Number(i.amount) > 0))
    .map(i => ({
      item: String(i.item || '').trim().slice(0, 100),
      qty: Number(i.qty) || 1,
      unitPrice: Number(i.unitPrice) || 0,
      amount: Number(i.amount) || 0,
      category: String(i.category || '').slice(0, 50),
      note: String(i.note || '').slice(0, 200),
    }))
}

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (isViewerOnly(auth.user)) return corsResponse({ error: VIEWER_ONLY_MSG }, 403)
  if (request.method !== 'PUT') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const config = await getFinanceConfig(env)
    const id = params.id
    let rows
    try { rows = await sql`SELECT * FROM budget_proposals WHERE id = ${id} LIMIT 1` }
    catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM budget_proposals WHERE id = ${id} LIMIT 1` }
      else throw e
    }
    const p = rows[0]
    if (!p) return corsResponse({ error: '未找到该预算公示' }, 404)
    if (String(p.applicant_id || '') !== String(auth.user.id)) return corsResponse({ error: '只能修改自己提交的预算公示' }, 403)
    if (p.status !== 'returned') return corsResponse({ error: '仅被退回的预算公示可修改重新提交' }, 400)

    const body = await parseBody(request)
    if (!body.title || !String(body.title).trim()) return corsResponse({ error: '请填写活动/事项名称' }, 400)
    const amount = Number(body.amount)
    if (!amount || amount <= 0) return corsResponse({ error: '预算总上限金额需大于 0' }, 400)
    if (!GROUP_OPTIONS.includes(body.groupName)) return corsResponse({ error: '请选择申请小组/部门' }, 400)
    if (!EVENT_TYPE_OPTIONS.includes(body.eventType)) return corsResponse({ error: '请选择事项性质' }, 400)
    if (!ACTIVITY_TYPE_OPTIONS.includes(body.activityType)) return corsResponse({ error: '请选择活动类型' }, 400)
    if (!PAY_TARGET_OPTIONS.includes(body.payTarget)) return corsResponse({ error: '请选择资金支付对象' }, 400)

    const redlines = {
      r1: body.redlines?.r1 === true, r2: body.redlines?.r2 === true, r3: body.redlines?.r3 === true,
    }
    if (!redlines.r1 || !redlines.r2 || !redlines.r3) {
      return corsResponse({ error: '请逐项确认财务红线核对（3 项均为「已确认」才能提交）' }, 400)
    }
    const items = parseItems(body.detailItems)
    if (items.length === 0) return corsResponse({ error: '请填写至少一条预算明细' }, 400)
    const bannedCat = items.find(i => /餐饮与茶歇|住宿费/.test(i.category || ''))
    if (bannedCat) {
      return corsResponse({ error: `明细分类「${bannedCat.category}」属于聚餐/旅行类费用，由参加人 AA，严禁使用班费，请删除该行或改分类` }, 400)
    }
    const itemsTotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    if (itemsTotal > amount * 1.000001) {
      return corsResponse({ error: `明细合计 ¥${itemsTotal.toFixed(2)} 超过预算上限 ¥${amount.toFixed(2)}，请调整` }, 400)
    }

    await sql`
      UPDATE budget_proposals
      SET activity_id = ${body.activityId || null}, title = ${String(body.title).trim()},
          description = ${String(body.description || '')}, detail_items = ${JSON.stringify(items)},
          amount = ${amount}, group_name = ${body.groupName}, contact = ${String(body.contact || '')},
          event_type = ${body.eventType}, activity_type = ${body.activityType}, pay_target = ${body.payTarget},
          redlines = ${JSON.stringify(redlines)}, returned_reason = '', status = 'submitted'
      WHERE id = ${id}
    `
    await logHistory(sql, { type: 'finance', action: 'resubmit', refId: id,
      description: `重新提交预算公示（已修改）：${String(body.title).trim()}`, operator: auth.user.name })
    await purgePublicCache('finance-v2-public')
    return corsResponse({ message: '已修改并重新提交，等待会计审核', status: 'submitted' })
  } catch (err) {
    console.error('finance/budgets/[id] 错误:', err)
    await purgePublicCache('finance-v2-public')
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
