// 许愿池 API
// GET  /api/wishes         许愿列表（含点赞/评论聚合，可匿名浏览）
// POST /api/wishes         发布许愿（登录即可，全员）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireLogin, getAuthUser,
  ensureTables, isMissingTableError,
} from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  try {
    if (request.method === 'GET') return await handleList(request, env)
    if (request.method === 'POST') return await handleCreate(request, env)
    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    // 首次部署、表缺失时懒建表（GET 无 body，可安全重试）
    if (isMissingTableError(err) && request.method === 'GET') {
      try {
        await ensureTables(env)
        return await handleList(request, env)
      } catch (e2) {
        console.error('wishes 懒建表后重试失败:', e2)
      }
    }
    console.error('wishes API 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleList(request, env) {
  const sql = getSql(env)
  const me = await getAuthUser(request, sql)
  const wishRows = await sql`
    SELECT id, user_id, author, content, images, activity_id, status, created_at
    FROM activity_wishes
    ORDER BY created_at DESC
  `
  const likeRows = await sql`
    SELECT wish_id, user_id, author
    FROM activity_wish_likes
    ORDER BY created_at ASC
  `
  const commentRows = await sql`
    SELECT id, wish_id, user_id, author, content, created_at
    FROM activity_wish_comments
    ORDER BY created_at ASC
  `
  const likesBy = {}
  for (const l of likeRows) (likesBy[l.wish_id] = likesBy[l.wish_id] || []).push(l)
  const commentsBy = {}
  for (const c of commentRows) (commentsBy[c.wish_id] = commentsBy[c.wish_id] || []).push(c)

  const wishes = wishRows.map(w => {
    let images = []
    try { images = JSON.parse(w.images || '[]') } catch {}
    const likes = likesBy[w.id] || []
    const comments = commentsBy[w.id] || []
    return {
      id: w.id,
      userId: w.user_id,
      author: w.author,
      content: w.content,
      images,
      activityId: w.activity_id,
      status: w.status,
      createdAt: w.created_at,
      likeCount: likes.length,
      likedByMe: me ? likes.some(l => l.user_id === me.id) : false,
      likes: likes.map(l => ({ userId: l.user_id, author: l.author })),
      comments: comments.map(c => ({
        id: c.id, author: c.author, content: c.content,
        createdAt: c.created_at, mine: me ? c.user_id === me.id : false,
      })),
    }
  })
  return corsResponse({
    wishes,
    me: me ? { id: me.id, name: me.name, role: me.role } : null,
  })
}

async function handleCreate(request, env) {
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  const body = await parseBody(request)
  const content = String(body.content || '').trim()
  if (!content) return corsResponse({ error: '请写点内容' }, 400)
  if (content.length > 1000) return corsResponse({ error: '内容过长（最多 1000 字）' }, 400)
  let images = Array.isArray(body.images) ? body.images.slice(0, 3) : []
  // 只接受本站 R2 图片（files.mint4.cn），防止外链/注入
  images = images.filter(u => typeof u === 'string' && /^https:\/\/files\.mint4\.cn\//.test(u))
  const id = body.id || `wish-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const sql = getSql(env)
  await sql`
    INSERT INTO activity_wishes (id, user_id, author, content, images, status)
    VALUES (${id}, ${auth.user.id}, ${auth.user.name}, ${content}, ${JSON.stringify(images)}, 'open')
    ON CONFLICT (id) DO NOTHING
  `
  return corsResponse({ message: '已发布', id }, 201)
}
