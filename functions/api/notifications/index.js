// 公开通知读取 - GET /api/notifications
// 返回最近 30 条发布通知（首页弹窗使用）。表缺失/出错时返回空列表，不打扰用户。
import { getSql, corsResponse, optionsResponse } from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的方法' }, 405)
  try {
    const sql = getSql(env)
    const rows = await sql`
      SELECT id, type, title, body, module_path, operator, created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 30
    `
    return corsResponse({ notifications: rows })
  } catch (e) {
    return corsResponse({ notifications: [] })
  }
}
