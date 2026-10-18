// 许愿互动 API
// POST   /api/wishes/:id/like     点赞 / 取消（切换）
// POST   /api/wishes/:id/comment  发表评论
// DELETE /api/wishes/:id/comment  删除评论（本人或班委）
import {
  getSql, corsResponse, optionsResponse, parseBody, requireLogin,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const wishId = params.id
  const action = params.action
  try {
    if (request.method === 'POST' && action === 'like') return toggleLike(request, env, wishId)
    if (request.method === 'POST' && action === 'comment') return addComment(request, env, wishId)
    if (request.method === 'DELETE' && action === 'comment') return deleteComment(request, env, wishId)
    return corsResponse({ error: '接口不存在' }, 404)
  } catch (err) {
    console.error('wishes/[id] 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function wishExists(sql, id) {
  const r = await sql`SELECT id FROM activity_wishes WHERE id = ${id} LIMIT 1`
  return r.length > 0
}

async function countLikes(sql, wishId) {
  const c = await sql`SELECT COUNT(*) AS n FROM activity_wish_likes WHERE wish_id = ${wishId}`
  return c[0]?.n ?? 0
}

async function toggleLike(request, env, wishId) {
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  const sql = getSql(env)
  if (!await wishExists(sql, wishId)) return corsResponse({ error: '许愿不存在' }, 404)
  const existing = await sql`
    SELECT id FROM activity_wish_likes WHERE wish_id = ${wishId} AND user_id = ${auth.user.id} LIMIT 1
  `
  if (existing.length) {
    await sql`DELETE FROM activity_wish_likes WHERE wish_id = ${wishId} AND user_id = ${auth.user.id}`
    return corsResponse({ message: '已取消点赞', liked: false, likeCount: await countLikes(sql, wishId) })
  }
  await sql`
    INSERT INTO activity_wish_likes (wish_id, user_id, author)
    VALUES (${wishId}, ${auth.user.id}, ${auth.user.name})
  `
  return corsResponse({ message: '已点赞', liked: true, likeCount: await countLikes(sql, wishId) }, 201)
}

async function addComment(request, env, wishId) {
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  const body = await parseBody(request)
  const content = String(body.content || '').trim()
  if (!content) return corsResponse({ error: '评论不能为空' }, 400)
  if (content.length > 300) return corsResponse({ error: '评论过长（最多 300 字）' }, 400)
  const sql = getSql(env)
  if (!await wishExists(sql, wishId)) return corsResponse({ error: '许愿不存在' }, 404)
  const result = await sql`
    INSERT INTO activity_wish_comments (wish_id, user_id, author, content)
    VALUES (${wishId}, ${auth.user.id}, ${auth.user.name}, ${content})
    RETURNING id, created_at
  `
  const row = result[0]
  return corsResponse({
    message: '评论已发布',
    comment: { id: row.id, author: auth.user.name, content, createdAt: row.created_at, mine: true },
  }, 201)
}

async function deleteComment(request, env, wishId) {
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  const body = await parseBody(request)
  const commentId = body.commentId
  if (!commentId) return corsResponse({ error: '缺少 commentId' }, 400)
  const sql = getSql(env)
  const rows = await sql`
    SELECT user_id FROM activity_wish_comments WHERE id = ${commentId} AND wish_id = ${wishId} LIMIT 1
  `
  if (!rows.length) return corsResponse({ error: '评论不存在' }, 404)
  const isOwner = rows[0].user_id === auth.user.id
  const isCommittee = !!auth.user.role
  if (!isOwner && !isCommittee) return corsResponse({ error: '只能删除自己的评论' }, 403)
  await sql`DELETE FROM activity_wish_comments WHERE id = ${commentId} AND wish_id = ${wishId}`
  return corsResponse({ message: '评论已删除' })
}
