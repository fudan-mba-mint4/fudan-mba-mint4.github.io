// 树洞管理员 - 列表查询（GET /api/admin/treehole）
import {
  getSql, initDatabase, corsResponse, optionsResponse,
} from '../../../_utils.js'

let dbReady = false
let initPromise = null

async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    try { await initDatabase(env); dbReady = true } catch (e) { initPromise = null; throw e }
  })()
  return initPromise
}

function verifyAdminToken(request, env) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  return token && token === env.ADMIN_TOKEN
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权，需要管理员Token' }, 401)

  try { await ensureDb(env) } catch (e) {
    return corsResponse({ error: '数据库连接失败' }, 503)
  }

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
