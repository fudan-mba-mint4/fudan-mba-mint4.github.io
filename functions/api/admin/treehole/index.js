// 树洞管理员 - 列表查询（GET /api/admin/treehole）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse, requireRead,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRead(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  const sql = getSql(env)
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)))
  const search = url.searchParams.get('search') || ''
  const includeDeleted = url.searchParams.get('includeDeleted') !== 'false'
  const offset = (page - 1) * limit

  const conditions = []
  const params = []
  if (!includeDeleted) conditions.push('is_deleted = FALSE')
  if (search) {
    conditions.push('(content ILIKE $' + (params.length + 1) + ' OR COALESCE(nickname, \'\') ILIKE $' + (params.length + 1) + ')')
    params.push(`%${search}%`)
  }
  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const [statsResult, countResult] = await Promise.all([
    sql`SELECT COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE is_deleted = FALSE)::int as active_count,
      COUNT(*) FILTER (WHERE is_deleted = TRUE)::int as deleted_count,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int as today_count
      FROM treehole_messages`,
    sql.unsafe(`SELECT COUNT(*)::int as total FROM treehole_messages ${whereClause}`, params),
  ])

  const total = countResult[0]?.total || 0
  params.push(limit, offset)
  const messages = await sql.unsafe(
    `SELECT id, nickname, content, created_at, is_deleted, ip_hash
     FROM treehole_messages ${whereClause}
     ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  return corsResponse({
    data: messages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: statsResult[0] || { total: 0, active_count: 0, deleted_count: 0, today_count: 0 },
  })
}
