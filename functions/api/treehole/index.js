// 匿名树洞 API（Cloudflare Pages Functions）
// GET  /api/treehole - 获取留言列表（分页）+ 统计 + 踩一踩聚合
// POST /api/treehole - 提交留言（强制登录，可选实名/匿名）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, hashIp, anonHashOf, getClientIp, checkRateLimit,
  corsResponse, optionsResponse, parseBody, requireLogin,
  isViewerOnly, VIEWER_ONLY_MSG,
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

  // 评论聚合：每条留言带最近3条评论 + 总数（匿名评论不回传 user_id，保护隐私；实名评论返回 user_id 供本人删除）
  // 注意：tagged template 会把数组参数 JSON 序列化，IN 子句必须用 sql.unsafe 动态占位
  let commentsMap = {}
  let commentCountMap = {}
  const ids = messages.map(m => m.id)
  if (ids.length) {
    try {
      const placeholders = ids.map(() => '?').join(',')
      const comments = await sql.unsafe(
        `SELECT id, message_id, user_name, anonymous, content, created_at,
                CASE WHEN anonymous = 1 THEN NULL ELSE user_id END AS user_id
         FROM treehole_comments
         WHERE message_id IN (${placeholders}) AND is_deleted = 0
         ORDER BY created_at ASC`,
        ids
      )
      for (const c of comments) {
        if (!commentsMap[c.message_id]) commentsMap[c.message_id] = []
        commentsMap[c.message_id].push(c)
      }
      const counts = await sql.unsafe(
        `SELECT message_id, COUNT(*) AS total FROM treehole_comments
         WHERE message_id IN (${placeholders}) AND is_deleted = 0
         GROUP BY message_id`,
        ids
      )
      for (const row of counts) commentCountMap[row.message_id] = row.total
    } catch (e) {
      // treehole_comments 表尚未创建（旧库未迁移）时静默降级，不阻断留言浏览
      console.warn('树洞评论聚合失败:', e?.message || e)
    }
  }
  const data = messages.map(m => ({
    ...m,
    comments: (commentsMap[m.id] || []).slice(-3),
    commentTotal: commentCountMap[m.id] || 0,
  }))

  // 踩一踩聚合：总踩数 + 最近踩过的人（公开只显示真名，不涉及匿名信息）
  let stepsTotal = 0
  let recentSteps = []
  try {
    const stepAgg = await sql`SELECT COALESCE(SUM(step_count), 0) AS total FROM treehole_steps`
    const recent = await sql`SELECT user_name FROM treehole_steps ORDER BY last_stepped_at DESC LIMIT 8`
    stepsTotal = stepAgg[0]?.total || 0
    recentSteps = recent.map(r => r.user_name)
  } catch (e) {
    // treehole_steps 表尚未创建（旧库未迁移）时静默降级，不阻断留言浏览
    console.warn('树洞踩一踩聚合失败:', e?.message || e)
  }

  return corsResponse({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: { total, todayCount, stepsTotal, recentSteps },
  })
}

async function handlePost(request, env) {
  const sql = getSql(env)

  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(ip, 60000, 3)
  if (!rateLimit.allowed) {
    return corsResponse({ error: '提交太频繁，请稍后再试', retryAfter: 60 }, 429)
  }

  // 强制登录：防止非本班同学随意留言
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  // 班主任/传承人仅可查看，不能参与留言
  if (isViewerOnly(auth.user)) return corsResponse({ error: VIEWER_ONLY_MSG }, 403)

  const body = await parseBody(request)
  const { content, realname } = body

  if (!content || !content.trim()) return corsResponse({ error: '留言内容不能为空' }, 400)
  if (content.length > 500) return corsResponse({ error: '留言不能超过500字' }, 400)

  const ipHash = await hashIp(ip)
  const isReal = realname === true
  const nickname = isReal ? auth.user.name : '匿名'
  const anonHash = isReal ? null : await anonHashOf(auth.user.id)

  const result = await sql`
    INSERT INTO treehole_messages (nickname, content, ip_hash, user_id, anonymous, anon_hash)
    VALUES (${nickname}, ${content.trim()}, ${ipHash}, ${auth.user.id}, ${isReal ? 0 : 1}, ${anonHash})
    RETURNING id, nickname, content, created_at
  `

  return corsResponse({
    message: '留言提交成功',
    data: { ...result[0], anonymous: isReal ? 0 : 1 },
  }, 201)
}
