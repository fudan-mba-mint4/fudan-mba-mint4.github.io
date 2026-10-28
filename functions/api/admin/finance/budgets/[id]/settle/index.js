// 预算公示结算 v2 - POST /api/admin/finance/budgets/[id]/settle
// 仅会计（程枭）：公示期满后结算；反对 ≥ 23 票 → rejected（不得动用），< 23 → passed
// body: { action: 'settle' | 'cancel' }
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, notify, isMissingTableError, ensureTables } from '../../../../../../_utils.js'
import { getFinanceRoles, isAccountant, getFinanceConfig, voteStats } from '../../../../../../_finance.js'
import { purgePublicCache } from '../../../../../../_cache.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const roles = await getFinanceRoles(env)
    if (!isAccountant(auth.user, roles)) return corsResponse({ error: '仅会计可结算预算公示' }, 403)
    const config = await getFinanceConfig(env)

    const id = params.id
    let rows
    try {
      rows = await sql`SELECT * FROM budget_proposals WHERE id = ${id} LIMIT 1`
    } catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM budget_proposals WHERE id = ${id} LIMIT 1` }
      else throw e
    }
    const proposal = rows[0]
    if (!proposal) return corsResponse({ error: '未找到该预算公示' }, 404)

    const body = await parseBody(request)
    if (body.action === 'cancel') {
      if (proposal.status !== 'open') return corsResponse({ error: '仅公示中的预算可取消' }, 400)
      await sql`UPDATE budget_proposals SET status = 'cancelled', settled_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ${id}`
      await logHistory(sql, { type: 'finance', action: 'cancel', refId: id,
        description: `取消预算公示：${proposal.title}`, operator: auth.user.name })
    await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '已取消该预算公示', status: 'cancelled' })
    }

    if (proposal.status !== 'open') return corsResponse({ error: '该预算已结算或已取消' }, 400)
    const now = Date.now()
    const end = proposal.expose_end ? new Date(proposal.expose_end).getTime() : 0
    if (end && now < end) return corsResponse({ error: '公示期尚未结束，不能提前结算' }, 400)

    const voteRows = await sql`SELECT choice FROM budget_votes WHERE proposal_id = ${id}`
    const stats = voteStats(voteRows, config)
    const status = stats.vetoed ? 'rejected' : 'passed'
    await sql`UPDATE budget_proposals SET status = ${status}, settled_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ${id}`

    await logHistory(sql, { type: 'finance', action: 'settle', refId: id,
      description: `结算预算公示：${proposal.title}（反对 ${stats.againstCount}/${config.classSize}，${stats.vetoed ? '否决' : '通过'}）`, operator: auth.user.name })
    await notify(sql, { type: 'finance', title: stats.vetoed ? '预算被否决' : '预算已通过',
      body: `${proposal.title}：赞成 ${stats.forCount}、反对 ${stats.againstCount} 人（${(stats.ratio * 100).toFixed(1)}%），${stats.vetoed ? '反对达 ' + config.vetoCount + ' 票，不可动用班费' : '可按预算执行'}`,
      modulePath: '/finance/', operator: auth.user.name })
    await purgePublicCache('finance-v2-public')
    return corsResponse({ message: stats.vetoed ? `反对达 ${config.vetoCount} 票，已否决该预算` : '预算通过，可按预算执行', status })
  } catch (err) {
    console.error('admin/finance/budgets/settle 错误:', err)
    await purgePublicCache('finance-v2-public')
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
