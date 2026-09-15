// 投票详情（GET /api/polls/:id）
import { getSql, initDatabase, corsResponse, optionsResponse } from '../../../_utils.js'

let dbReady = false, initPromise = null
async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => { try { await initDatabase(env); dbReady = true } catch (e) { initPromise = null; throw e } })()
  return initPromise
}

async function getVoteCounts(sql, pollId) {
  const result = await sql`SELECT option_id, COUNT(*)::int as votes FROM poll_votes WHERE poll_id = ${pollId} GROUP BY option_id`
  const counts = {}
  for (const row of result) counts[row.option_id] = row.votes
  return counts
}

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  try { await ensureDb(env) } catch { return corsResponse({ error: '数据库连接失败' }, 503) }

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
