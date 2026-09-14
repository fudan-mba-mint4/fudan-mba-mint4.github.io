// 树洞管理员 API
// GET    /api/admin/treehole          - 获取所有留言（含已删除）+ 统计
// POST   /api/admin/treehole/delete   - 批量删除
// POST   /api/admin/treehole/restore  - 批量恢复
import { getSql, initDatabase } from '../../lib/db.js'
import { verifyAdminToken, jsonResponse } from '../../lib/validate.js'

let dbReady = false
let initPromise = null

async function ensureDb() {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      await initDatabase()
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  // 管理员验证
  if (!verifyAdminToken(req)) {
    jsonResponse(res, 401, { error: '未授权，需要管理员Token' })
    return
  }

  try {
    await ensureDb()
  } catch (err) {
    jsonResponse(res, 503, { error: '数据库连接失败', detail: err.message })
    return
  }

  try {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname

    if (req.method === 'GET' && path.endsWith('/treehole')) {
      await handleGetAll(req, res)
    } else if (req.method === 'POST' && path.endsWith('/delete')) {
      await handleBatchDelete(req, res)
    } else if (req.method === 'POST' && path.endsWith('/restore')) {
      await handleBatchRestore(req, res)
    } else {
      jsonResponse(res, 404, { error: '接口不存在', path })
    }
  } catch (err) {
    console.error('管理员API错误:', err)
    jsonResponse(res, 500, { error: '服务器内部错误', detail: err.message })
  }
}

/**
 * GET: 获取所有留言 + 统计
 */
async function handleGetAll(req, res) {
  const sql = getSql()
  const url = new URL(req.url, 'http://localhost')
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)))
  const search = url.searchParams.get('search') || ''
  const includeDeleted = url.searchParams.get('includeDeleted') !== 'false'
  const offset = (page - 1) * limit

  const conditions = []
  const params = []

  if (!includeDeleted) {
    conditions.push('is_deleted = FALSE')
  }
  if (search) {
    conditions.push('(content ILIKE $' + (params.length + 1) + ' OR COALESCE(nickname, \'\') ILIKE $' + (params.length + 1) + ')')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  // 并行查询统计和数据
  const [statsResult, countResult] = await Promise.all([
    sql`SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE is_deleted = FALSE)::int as active_count,
        COUNT(*) FILTER (WHERE is_deleted = TRUE)::int as deleted_count,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int as today_count
       FROM treehole_messages`,
    sql(`SELECT COUNT(*)::int as total FROM treehole_messages ${whereClause}`, params),
  ])

  const total = countResult[0]?.total || 0

  // 分页数据
  params.push(limit, offset)
  const messages = await sql(
    `SELECT id, nickname, content, created_at, is_deleted, ip_hash
     FROM treehole_messages
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  jsonResponse(res, 200, {
    data: messages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: statsResult[0] || { total: 0, active_count: 0, deleted_count: 0, today_count: 0 },
  })
}

/**
 * POST: 批量删除
 */
async function handleBatchDelete(req, res) {
  const sql = getSql()
  const { ids } = await parseBody(req)

  if (!Array.isArray(ids) || ids.length === 0) {
    jsonResponse(res, 400, { error: '请提供要删除的留言ID数组' })
    return
  }

  const validIds = ids.filter(id => Number.isInteger(id) && id > 0)
  if (validIds.length === 0) {
    jsonResponse(res, 400, { error: '无效的ID列表' })
    return
  }

  const result = await sql`
    UPDATE treehole_messages
    SET is_deleted = TRUE
    WHERE id IN (${validIds}) AND is_deleted = FALSE
    RETURNING id
  `

  jsonResponse(res, 200, {
    message: `成功删除 ${result.length} 条留言`,
    deletedCount: result.length,
    deletedIds: result.map(r => r.id),
  })
}

/**
 * POST: 批量恢复
 */
async function handleBatchRestore(req, res) {
  const sql = getSql()
  const { ids } = await parseBody(req)

  if (!Array.isArray(ids) || ids.length === 0) {
    jsonResponse(res, 400, { error: '请提供要恢复的留言ID数组' })
    return
  }

  const validIds = ids.filter(id => Number.isInteger(id) && id > 0)
  if (validIds.length === 0) {
    jsonResponse(res, 400, { error: '无效的ID列表' })
    return
  }

  const result = await sql`
    UPDATE treehole_messages
    SET is_deleted = FALSE
    WHERE id IN (${validIds}) AND is_deleted = TRUE
    RETURNING id
  `

  jsonResponse(res, 200, {
    message: `成功恢复 ${result.length} 条留言`,
    restoredCount: result.length,
    restoredIds: result.map(r => r.id),
  })
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}
