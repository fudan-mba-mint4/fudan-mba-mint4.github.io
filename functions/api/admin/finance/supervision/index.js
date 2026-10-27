// 财务监督视图 - GET /api/admin/finance/supervision
// 仅监督人（雷振宇）可见：每条公示的票向明细（谁投赞成/反对）与每条反对留言的留言人身份
import { getSql, corsResponse, optionsResponse, requireLogin, isMissingTableError, ensureTables } from '../../../../_utils.js'
import { getFinanceRoles, isFinanceSupervisor, getFinanceConfig } from '../../../../_finance.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const roles = await getFinanceRoles(env)
    if (!isFinanceSupervisor(auth.user, roles)) return corsResponse({ error: '无权查看监督视图' }, 403)

    let budgets, votes, users
    try {
      budgets = await sql`SELECT * FROM budget_proposals ORDER BY created_at DESC`
      votes = await sql`SELECT v.*, u.name AS user_name FROM budget_votes v LEFT JOIN users u ON u.id = v.user_id ORDER BY v.created_at ASC`
      users = await sql`SELECT id, name FROM users`
    } catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); budgets = await sql`SELECT * FROM budget_proposals ORDER BY created_at DESC`; votes = await sql`SELECT v.*, u.name AS user_name FROM budget_votes v LEFT JOIN users u ON u.id = v.user_id ORDER BY v.created_at ASC`; users = await sql`SELECT id, name FROM users` }
      else throw e
    }

    const config = await getFinanceConfig(env)
    const userMap = {}
    users.forEach(u => { userMap[u.id] = u.name })

    const out = budgets.map(b => {
      const list = votes.filter(v => v.proposal_id === b.id)
      const forVotes = list.filter(v => v.choice === 'for').map(v => ({ userId: v.user_id, name: v.user_name || userMap[v.user_id] || '未关联', createdAt: v.created_at }))
      const againstVotes = list.filter(v => v.choice === 'against').map(v => ({ userId: v.user_id, name: v.user_name || userMap[v.user_id] || '未关联', reason: v.reason || '', createdAt: v.created_at }))
      const forCount = forVotes.length
      const againstCount = againstVotes.length
      return {
        id: b.id, title: b.title, status: b.status, exposeStart: b.expose_start, exposeEnd: b.expose_end,
        exposeType: b.expose_type || 'normal', amount: b.amount,
        forCount, againstCount,
        vetoed: againstCount >= (config.vetoCount || 23),
        totalVoters: list.length,
        uncommitted: Math.max(0, (config.classSize || 0) - forCount - againstCount),
        forVotes, againstVotes,   // 票向 + 留言人身份（仅监督人可见）
      }
    })

    return corsResponse({
      supervision: out,
      config: { classSize: config.classSize, vetoCount: config.vetoCount },
    })
  } catch (err) {
    console.error('admin/finance/supervision 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
