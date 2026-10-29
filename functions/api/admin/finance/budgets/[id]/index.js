// 预算公示 v2 审批 - PATCH /api/admin/finance/budgets/[id]
// 仅会计（程枭）：
//   { action: 'approve' }             → 资料齐全，公开公示：submitted/returned → open，
//                                       自动生成公示编号 MF4-BM-YYYYMMDD-XX、公示期 3 天、微信群同步时间=当天；通知全员投票
//   { action: 'return', reason }      → 资料不全退回：submitted → returned，填退回原因；通知发起人
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, notify, isMissingTableError, ensureTables } from '../../../../../_utils.js'
import { getFinanceRoles, isAccountant, getFinanceConfig, nextProposalNo, BUDGET_STATUS } from '../../../../../_finance.js'
import { purgePublicCache } from '../../../../../_cache.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'PATCH') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const roles = await getFinanceRoles(env)
    if (!isAccountant(auth.user, roles)) return corsResponse({ error: '仅会计（程枭）可审批预算公示' }, 403)
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

    const body = await parseBody(request)
    const action = body.action

    if (action === 'return') {
      if (p.status !== 'submitted') return corsResponse({ error: '仅待审批的公示可退回' }, 400)
      const reason = String(body.reason || '').trim().slice(0, 200)
      if (!reason) return corsResponse({ error: '请填写退回原因（告知发起人缺什么资料）' }, 400)
      await sql`UPDATE budget_proposals SET status = 'returned', returned_reason = ${reason} WHERE id = ${id}`
      await logHistory(sql, { type: 'finance', action: 'return', refId: id,
        description: `退回预算公示：${p.title}（原因：${reason}）`, operator: auth.user.name })
      await notify(sql, { type: 'finance', title: '你的预算公示被退回',
        body: `「${p.title}」被退回：${reason}。请到「我提交的公示」修改后重新提交`, modulePath: '/finance/budgets/', operator: auth.user.name })
      await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '已退回，发起人可修改后重新提交', status: 'returned' })
    }

    if (action === 'approve') {
      if (!['submitted', 'returned'].includes(p.status)) return corsResponse({ error: '仅待审批/已退回的公示可公开' }, 400)
      const proposalNo = await nextProposalNo(sql)
      const days = Math.max(1, Number(config.exposeDays) || 3)
      const now = new Date()
      const exposeStart = now.toISOString()
      const exposeEnd = new Date(now.getTime() + days * 86400000).toISOString()
      const syncTime = now.toISOString()
      await sql`
        UPDATE budget_proposals
        SET status = 'open', proposal_no = ${proposalNo}, expose_start = ${exposeStart},
            expose_end = ${exposeEnd}, sync_time = ${syncTime}, returned_reason = '',
            settled_at = NULL
        WHERE id = ${id}
      `
      await logHistory(sql, { type: 'finance', action: 'approve', refId: id,
        description: `公开预算公示 ${proposalNo}：${p.title}（公示 ${days} 日，${exposeEnd.slice(0, 10)} 截止）`, operator: auth.user.name })
      await notify(sql, { type: 'finance', title: '预算公示已公开',
        body: `${proposalNo}「${p.title}」（预算上限 ¥${p.amount}）已公开，公示 ${days} 日，请到财务页投票。请会计在微信群同步公示链接`, modulePath: '/finance/budgets/', operator: auth.user.name })
      await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '已公开，进入 3 天投票期', proposalNo, exposeStart, exposeEnd, syncTime, status: 'open' })
    }

    return corsResponse({ error: '未知操作' }, 400)
  } catch (err) {
    console.error('admin/finance/budgets/[id] 错误:', err)
    await purgePublicCache('finance-v2-public')
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
