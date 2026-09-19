// 活动公开只读 API - GET /api/activities-db
// 返回 { activities: [...] }，原样返回存储的 data 对象
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import { getSql, corsResponse, optionsResponse } from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const rows = await sql`
      SELECT data FROM activities
      ORDER BY date DESC
    `
    return corsResponse({ activities: rows.map(r => r.data) })
  } catch (err) {
    console.error('activities-db API 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
