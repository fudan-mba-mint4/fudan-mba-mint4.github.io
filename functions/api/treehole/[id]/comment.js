// 树洞评论 API（发布/删除）
// POST   /api/treehole/:id/comment - 发布评论（强制登录，可选实名/匿名，≤200字）
// DELETE /api/treehole/:id/comment - 删除评论（评论者本人 或 班委）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, hashIp, getClientIp, checkRateLimit,
  corsResponse, optionsResponse, parseBody, requireLogin,
  isViewerOnly, VIEWER_ONLY_MSG,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  const messageId = parseInt(params.id, 10)
  if (!messageId || Number.isNaN(messageId)) {
    return corsResponse({ error: '无效的留言ID' }, 400)
  }

  try {
    if (request.method === 'POST') return handlePost(request, env, messageId)
    if (request.method === 'DELETE') return handleDelete(request, env, messageId)
    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('树洞评论API错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handlePost(request, env, messageId) {
  const sql = getSql(env)

  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(ip, 60000, 5)
  if (!rateLimit.allowed) {
    return corsResponse({ error: '评论太频繁，请稍后再试', retryAfter: 60 }, 429)
  }

  // 强制登录：防止非本班同学评论
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (isViewerOnly(auth.user)) return corsResponse({ error: VIEWER_ONLY_MSG }, 403)

  const body = await parseBody(request)
  const { content, realname } = body

  if (!content || !content.trim()) return corsResponse({ error: '评论内容不能为空' }, 400)
  if (content.length > 200) return corsResponse({ error: '评论不能超过200字' }, 400)

  // 校验留言存在且未删除
  const msg = await sql`SELECT id FROM treehole_messages WHERE id = ${messageId} AND is_deleted = 0 LIMIT 1`
  if (!msg.length) return corsResponse({ error: '留言不存在或已删除' }, 404)

  const ipHash = await hashIp(ip)
  const isReal = realname === true
  const user_name = isReal ? auth.user.name : null

  const result = await sql`
    INSERT INTO treehole_comments (message_id, user_id, user_name, anonymous, content, ip_hash)
    VALUES (${messageId}, ${auth.user.id}, ${user_name}, ${isReal ? 0 : 1}, ${content.trim()}, ${ipHash})
    RETURNING id, message_id, user_id, user_name, anonymous, content, created_at
  `

  return corsResponse({
    message: '评论成功',
    data: { ...result[0], canDelete: true },
  }, 201)
}

async function handleDelete(request, env, messageId) {
  const sql = getSql(env)
  const url = new URL(request.url)
  const commentId = parseInt(url.searchParams.get('commentId') || '0', 10)
  if (!commentId) return corsResponse({ error: '缺少 commentId 参数' }, 400)

  // 班委可删任何评论；普通用户仅可删自己的（均需登录）
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  const comment = await sql`SELECT id, user_id, is_deleted FROM treehole_comments WHERE id = ${commentId} AND message_id = ${messageId} LIMIT 1`
  if (!comment.length) return corsResponse({ error: '评论不存在' }, 404)
  if (comment[0].is_deleted) return corsResponse({ error: '评论已删除' }, 400)

  const isOwner = comment[0].user_id === auth.user.id
  const isCommittee = !!auth.user.role
  if (!isOwner && !isCommittee) return corsResponse({ error: '没有权限删除该评论' }, 403)

  await sql`UPDATE treehole_comments SET is_deleted = 1 WHERE id = ${commentId}`
  return corsResponse({ message: '评论已删除', ok: true })
}
