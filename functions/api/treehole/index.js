// 匿名树洞 API（Cloudflare Pages Functions）
// GET  /api/treehole - 获取留言列表（分页）+ 统计
// POST /api/treehole - 提交留言
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, hashIp, getClientIp, checkRateLimit,
  corsResponse, optionsResponse, parseBody,
} from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  try {
    if (request.method === 'GET') return handleGet(request, env)
    if (request.method === 'POST') return handlePost(request, env)
    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('树洞API错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleGet(request, env) {
  const sql = getSql(env)
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  const countResult = await sql`SELECT COUNT(*) as total FROM treehole_messages WHERE is_deleted = 0`
  const todayResult = await sql`SELECT COUNT(*) as today_count FROM treehole_messages WHERE is_deleted = 0 AND created_at >= CURRENT_DATE`
  const messages = await sql`SELECT id, nickname, content, created_at FROM treehole_messages WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const total = countResult[0]?.total || 0
  const todayCount = todayResult[0]?.today_count || 0

  return corsResponse({
    data: messages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: { total, todayCount },
  })
}

async function handlePost(request, env) {
  const sql = getSql(env)

  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(ip, 60000, 3)
  if (!rateLimit.allowed) {
    return corsResponse({ error: '提交太频繁，请稍后再试', retryAfter: 60 }, 429)
  }

  const body = await parseBody(request)
  const { nickname, content } = body

  if (!content || !content.trim()) return corsResponse({ error: '留言内容不能为空' }, 400)
  if (content.length > 500) return corsResponse({ error: '留言不能超过500字' }, 400)

  const ipHash = await hashIp(ip)

  const result = await sql`
    INSERT INTO treehole_messages (nickname, content, ip_hash)
    VALUES (${nickname?.trim() || '匿名'}, ${content.trim()}, ${ipHash})
    RETURNING id, nickname, content, created_at
  `

  return corsResponse({ message: '留言提交成功', data: result[0] }, 201)
}
