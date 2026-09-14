// 树洞管理员 API（EdgeOne Pages Functions 版本）
// GET    /api/admin/treehole          - 获取所有留言（含已删除）+ 统计
// POST   /api/admin/treehole/delete   - 批量删除
// POST   /api/admin/treehole/restore  - 批量恢复
import {
  getSql, initDatabase, corsResponse, optionsResponse, parseBody,
} from '../../../_utils.js'

let dbReady = false
let initPromise = null

async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      await initDatabase(env)
      dbReady = true
      return true
    } catch (err) {
      console.error('数据库初始化失败:', err)
      initPromise = null
      throw err
    }
  })()
  return initPromise
}

function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  return token && token === env.ADMIN_TOKEN
}

export async function onRequest(context) {
  const { request, env, params } = context

  if (request.method === 'OPTIONS') return optionsResponse()

  if (!verifyAdminToken(request, env)) {
    return corsResponse({ error: '未授权，需要管理员Token' }, 401)
  }

  try {
    await ensureDb(env)
  } catch (err) {
    return corsResponse({ error: '数据库连接失败', detail: err.message }, 503)
  }

  const action = params.action // 'delete' | 'restore' | undefined

  try {
    if (request.method === 'GET' && !action) return handleGetAll(request, env)
    if (request.method === 'POST' && action === 'delete') return handleBatchDelete(request, env)
    if (request.method === 'POST' && action === 'restore') return handleBatchRestore(request, env)
    return corsResponse({ error: '接口不存在' }, 404)
  } catch (err) {
    console.error('管理员API错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: err.message }, 500)
  }
}

async function handleGetAll(request, env) {
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
    sql`SELECT
        COUNT(*)::int as total,
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
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  return corsResponse({
    data: messages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: statsResult[0] || { total: 0, active_count: 0, deleted_count: 0, today_count: 0 },
  })
}

async function handleBatchDelete(request, env) {
  const sql = getSql(env)
  const { ids } = await parseBody(request)

  if (!Array.isArray(ids) || ids.length === 0) {
    return corsResponse({ error: '请提供要删除的留言ID数组' }, 400)
  }

  const validIds = ids.filter(id => Number.isInteger(id) && id > 0)
  if (validIds.length === 0) {
    return corsResponse({ error: '无效的ID列表' }, 400)
  }

  const result = await sql`
    UPDATE treehole_messages SET is_deleted = TRUE
    WHERE id IN (${validIds}) AND is_deleted = FALSE
    RETURNING id
  `

  return corsResponse({
    message: `成功删除 ${result.length} 条留言`,
    deletedCount: result.length,
    deletedIds: result.map(r => r.id),
  })
}

async function handleBatchRestore(request, env) {
  const sql = getSql(env)
  const { ids } = await parseBody(request)

  if (!Array.isArray(ids) || ids.length === 0) {
    return corsResponse({ error: '请提供要恢复的留言ID数组' }, 400)
  }

  const validIds = ids.filter(id => Number.isInteger(id) && id > 0)
  if (validIds.length === 0) {
    return corsResponse({ error: '无效的ID列表' }, 400)
  }

  const result = await sql`
    UPDATE treehole_messages SET is_deleted = FALSE
    WHERE id IN (${validIds}) AND is_deleted = TRUE
    RETURNING id
  `

  return corsResponse({
    message: `成功恢复 ${result.length} 条留言`,
    restoredCount: result.length,
    restoredIds: result.map(r => r.id),
  })
}
