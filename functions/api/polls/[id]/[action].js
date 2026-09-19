// 投票提交（POST /api/polls/:id/vote）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, hashIp, getClientIp,
  corsResponse, optionsResponse, parseBody,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  const sql = getSql(env)
  const pollId = params.id
  const action = params.action
  if (action !== 'vote') return corsResponse({ error: '接口不存在' }, 404)

  const body = await parseBody(request)
  const { optionIds, userId, anonymous } = body
  if (!optionIds?.length) return corsResponse({ error: '请选择投票选项' }, 400)
  if (!userId) return corsResponse({ error: '请先登录' }, 401)

  const ipHash = await hashIp(getClientIp(request))

  try {
    if (anonymous) {
      const existing = await sql`SELECT id FROM poll_votes WHERE poll_id = ${pollId} AND ip_hash = ${ipHash} LIMIT 1`
      if (existing.length) return corsResponse({ error: '您已投过票了' }, 409)
    } else {
      const existing = await sql`SELECT id FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${userId} LIMIT 1`
      if (existing.length) return corsResponse({ error: '您已投过票了' }, 409)
    }

    for (const oid of optionIds) {
      await sql`INSERT INTO poll_votes (poll_id, option_id, user_id, anonymous, ip_hash) VALUES (${pollId}, ${oid}, ${anonymous ? null : userId}, ${anonymous}, ${ipHash})`
    }

    const result = await sql`SELECT option_id, COUNT(*)::int as votes FROM poll_votes WHERE poll_id = ${pollId} GROUP BY option_id`
    const votes = {}
    for (const row of result) votes[row.option_id] = row.votes

    return corsResponse({ message: '投票成功', data: { votes, userVoted: optionIds } }, 201)
  } catch (err) {
    if (err.code === '23505') return corsResponse({ error: '您已投过票了' }, 409)
    throw err
  }
}
