// 投票列表 API（EdgeOne Pages Functions 版本）
// GET /api/polls - 获取所有投票的票数统计
import { getSql, initDatabase, corsResponse, optionsResponse } from '../../_utils.js'

let dbReady = false
let initPromise = null

async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      await initDatabase(env)
      dbReady = true
      return true
    } catch (err) {
      console.error('数据库初始化失败:', err)
      initPromise = null
      throw err
    }
  })()
  return initPromise
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    await ensureDb(env)
  } catch (err) {
    return corsResponse({ error: '数据库连接失败', detail: err.message }, 503)
  }

  const sql = getSql(env)
  const result = await sql`
    SELECT poll_id, option_id, COUNT(*)::int as votes
    FROM poll_votes
    GROUP BY poll_id, option_id
  `
  const counts = {}
  for (const row of result) {
    if (!counts[row.poll_id]) counts[row.poll_id] = {}
    counts[row.poll_id][row.option_id] = row.votes
  }
  return corsResponse({ data: counts })
}
