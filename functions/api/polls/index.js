// 投票列表 API（EdgeOne Pages Functions 版本）
// GET /api/polls - 获取所有投票的票数统计
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import { getSql, corsResponse, optionsResponse } from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)

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
