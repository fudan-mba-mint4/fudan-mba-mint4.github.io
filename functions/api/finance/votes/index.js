// 预算投票 v2 - POST /api/finance/votes
// 全体登录同学对公示中预算投票：赞成 / 反对（二选一），不可撤回、不可改投
// body: { proposalId, choice: 'for' | 'against', reason? }  reason 仅反对时可填（匿名公开）
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, isMissingTableError, ensureTables } from '../../../_utils.js'
import { exposeOpen } from '../../../_finance.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const body = await parseBody(request)
    const proposalId = String(body.proposalId || '')
    if (!proposalId) return corsResponse({ error: '缺少公示编号' }, 400)
    const choice = String(body.choice || '')
    if (choice !== 'for' && choice !== 'against') return corsResponse({ error: '投票选择无效' }, 400)

    let rows
    try {
      rows = await sql`SELECT * FROM budget_proposals WHERE id = ${proposalId} LIMIT 1`
    } catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM budget_proposals WHERE id = ${proposalId} LIMIT 1` }
      else throw e
    }
    const proposal = rows[0]
    if (!proposal) return corsResponse({ error: '未找到该预算公示' }, 404)
    if (!exposeOpen(proposal)) return corsResponse({ error: '该公示不在投票期内' }, 400)

    const reason = choice === 'against' ? String(body.reason || '').slice(0, 200) : ''

    try {
      await sql`
        INSERT INTO budget_votes (proposal_id, user_id, choice, reason)
        VALUES (${proposalId}, ${auth.user.id}, ${choice}, ${reason})
      `
    } catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); await sql`
        INSERT INTO budget_votes (proposal_id, user_id, choice, reason)
        VALUES (${proposalId}, ${auth.user.id}, ${choice}, ${reason})
      ` }
      else if (/UNIQUE|unique/i.test(String(e?.message || e))) {
        return corsResponse({ error: '投票一经提交不可撤回，你已投过票' }, 400)
      } else throw e
    }

    return corsResponse({ message: choice === 'for' ? '已投赞成票' : '已投反对票（理由将匿名公开）', choice }, 201)
  } catch (err) {
    console.error('finance votes 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
