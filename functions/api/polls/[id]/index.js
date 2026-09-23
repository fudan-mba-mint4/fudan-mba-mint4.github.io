// 投票详情（GET /api/polls/:id）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import { getSql, corsResponse, optionsResponse } from '../../../_utils.js'

async function getVoteCounts(sql, pollId) {
  const result = await sql`SELECT option_id, COUNT(*) as votes FROM poll_votes WHERE poll_id = ${pollId} GROUP BY option_id`
  const counts = {}
  for (const row of result) counts[row.option_id] = row.votes
  return counts
}

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  const sql = getSql(env)
  const pollId = params.id
  const url = new URL(request.url)
  const userId = url.searchParams.get('user_id') || null
  const votes = await getVoteCounts(sql, pollId)
  let userVoted = []
  if (userId) {
    const voted = await sql`SELECT option_id FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${userId}`
    userVoted = voted.map(r => r.option_id)
  }
  return corsResponse({ data: { pollId, votes, userVoted } })
}
