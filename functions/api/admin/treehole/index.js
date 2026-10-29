// 树洞管理员 - 列表查询（GET /api/admin/treehole）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
// 权限说明：
// - 登录班委（含 supervisor）均可查看/搜索/导出；
// - 匿名留言对普通班委仅展示不可逆匿名标识（anon_hash）；
// - 仅网站最高权限者（雷振宇）一人（"上帝视角"）可见每条留言的真实发布者真名，
//   主理人/副主理人/独立董事会等其他任何人一律只见匿名标识。
import {
  getSql, corsResponse, optionsResponse, requireRead,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRead(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  const isGod = auth.user.name === '雷振宇'

  const sql = getSql(env)
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)))
  const search = url.searchParams.get('search') || ''
  const includeDeleted = url.searchParams.get('includeDeleted') !== 'false'
  const offset = (page - 1) * limit

  const conditions = []
  const params = []
  if (!includeDeleted) conditions.push('m.is_deleted = 0')
  if (search) {
    conditions.push('(m.content LIKE $' + (params.length + 1) + ' OR COALESCE(m.nickname, \'\') LIKE $' + (params.length + 1) + ')')
    params.push(`%${search}%`)
  }
  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const [statsResult, countResult] = await Promise.all([
    sql`SELECT COUNT(*) as total,
      SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) as active_count,
      SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted_count,
      SUM(CASE WHEN created_at >= CURRENT_DATE THEN 1 ELSE 0 END) as today_count
      FROM treehole_messages`,
    sql.unsafe(`SELECT COUNT(*) as total FROM treehole_messages m ${whereClause}`, params),
  ])

  const total = countResult[0]?.total || 0
  params.push(limit, offset)
  // 上帝视角（leader/deputy）额外 JOIN users 取真实发布者；普通班委不返回 user_id/user_name
  const selectCols = isGod
    ? `m.id, m.nickname, m.content, m.created_at, m.is_deleted, m.ip_hash, m.anonymous, m.anon_hash, m.user_id, u.name AS user_name`
    : `m.id, m.nickname, m.content, m.created_at, m.is_deleted, m.ip_hash, m.anonymous, m.anon_hash`
  const joinClause = isGod ? `LEFT JOIN users u ON u.id = m.user_id` : ''
  const messages = await sql.unsafe(
    `SELECT ${selectCols}
     FROM treehole_messages m ${joinClause} ${whereClause}
     ORDER BY m.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  return corsResponse({
    data: messages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: statsResult[0] || { total: 0, active_count: 0, deleted_count: 0, today_count: 0 },
    god: isGod,
  })
}
