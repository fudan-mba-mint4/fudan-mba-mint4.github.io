// 树洞全部评论查询
// GET /api/treehole/:id/comments - 该留言的全部评论（公开可看；匿名评论不回传 user_id）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)

  const messageId = parseInt(params.id, 10)
  if (!messageId || Number.isNaN(messageId)) {
    return corsResponse({ error: '无效的留言ID' }, 400)
  }

  try {
    const sql = getSql(env)
    const comments = await sql`
      SELECT id, message_id, user_name, anonymous, content, created_at,
             CASE WHEN anonymous = 1 THEN NULL ELSE user_id END AS user_id
      FROM treehole_comments
      WHERE message_id = ${messageId} AND is_deleted = 0
      ORDER BY created_at ASC
    `
    return corsResponse({ data: comments })
  } catch (err) {
    console.error('树洞评论查询API错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
