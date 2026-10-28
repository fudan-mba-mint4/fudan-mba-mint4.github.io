// 预算异议（反对意见）- POST /api/finance/objections
// 全体登录成员可在公示期内提交/更新反对意见（一人一条，实名，upsert）
// body: { proposalId, reason }
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, isMissingTableError, ensureTables, isViewerOnly, VIEWER_ONLY_MSG } from '../../../_utils.js'
import { exposeOpen } from '../../../_finance.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  // 班主任 / 传承人仅可查看，不能提交公示异议
  if (isViewerOnly(auth.user)) return corsResponse({ error: VIEWER_ONLY_MSG }, 403)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const { proposalId, reason = '' } = await parseBody(request)
    if (!proposalId) return corsResponse({ error: '缺少 proposalId' }, 400)
    if (reason.length > 500) return corsResponse({ error: '反对理由过长（≤500字）' }, 400)

    let rows
    try {
      rows = await sql`SELECT * FROM budget_proposals WHERE id = ${proposalId} LIMIT 1`
    } catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM budget_proposals WHERE id = ${proposalId} LIMIT 1` }
      else throw e
    }
    const proposal = rows[0]
    if (!proposal) return corsResponse({ error: '未找到该预算公示' }, 404)
    if (!exposeOpen(proposal)) return corsResponse({ error: '当前不在公示异议期内，无法提交' }, 400)

    await sql`
      INSERT INTO budget_objections (proposal_id, user_id, reason)
      VALUES (${proposal.id}, ${auth.user.id}, ${reason})
      ON CONFLICT (proposal_id, user_id) DO UPDATE SET reason = excluded.reason
    `
    return corsResponse({ message: '已提交反对意见', ok: true })
  } catch (err) {
    console.error('finance objections 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
