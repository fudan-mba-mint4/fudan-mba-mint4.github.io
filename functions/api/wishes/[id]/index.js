// 删除许愿 - DELETE /api/wishes/:id（本人或班委）
// 同时清理该许愿的点赞与评论。
import {
  getSql, corsResponse, optionsResponse, requireLogin,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'DELETE') return corsResponse({ error: '不支持的请求方法' }, 405)
  try {
    const auth = await requireLogin(request, env)
    if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
    const wishId = params.id
    const sql = getSql(env)
    const rows = await sql`SELECT user_id FROM activity_wishes WHERE id = ${wishId} LIMIT 1`
    if (!rows.length) return corsResponse({ error: '许愿不存在' }, 404)
    const isOwner = rows[0].user_id === auth.user.id
    const isCommittee = !!auth.user.role
    if (!isOwner && !isCommittee) return corsResponse({ error: '只能删除自己的许愿' }, 403)
    await sql`DELETE FROM activity_wish_likes WHERE wish_id = ${wishId}`
    await sql`DELETE FROM activity_wish_comments WHERE wish_id = ${wishId}`
    await sql`DELETE FROM activity_wishes WHERE id = ${wishId}`
    return corsResponse({ message: '许愿已删除' })
  } catch (err) {
    console.error('wishes delete 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
