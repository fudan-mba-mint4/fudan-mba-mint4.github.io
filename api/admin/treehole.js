// 树洞管理员 API
// GET  /api/admin/treehole     - 获取所有留言（含已删除），支持搜索/分页
// POST /api/admin/treehole/delete - 批量删除
import { initDatabase, query } from '../../lib/db.js'
import { verifyAdminToken, jsonResponse } from '../../lib/validate.js'

let dbInitialized = false

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  // 所有操作都需要管理员验证
  if (!verifyAdminToken(req)) {
    jsonResponse(res, 401, { error: '未授权，需要管理员Token' })
    return
  }

  if (!dbInitialized) {
    try {
      await initDatabase()
      dbInitialized = true
    } catch (err) {
      console.error('数据库初始化失败:', err)
      jsonResponse(res, 500, { error: '数据库初始化失败' })
      return
    }
  }

  try {
    const url = new URL(req.url, 'http://localhost')

    if (req.method === 'GET' && url.pathname.endsWith('/treehole')) {
      await handleGetAll(req, res)
    } else if (req.method === 'POST' && url.pathname.endsWith('/delete')) {
      await handleBatchDelete(req, res)
    } else {
      jsonResponse(res, 404, { error: '接口不存在' })
    }
  } catch (err) {
    console.error('管理员API错误:', err)
    jsonResponse(res, 500, { error: '服务器内部错误', detail: err.message })
  }
}

/**
 * GET: 获取所有留言（含已删除）
 * Query: page, limit, search, includeDeleted
 */
async function handleGetAll(req, res) {
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
    conditions.push('(content ILIKE $' + (params.length + 1) + ' OR nickname ILIKE $' + (params.length + 1) + ')')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  // 总数
  const countResult = await query(
    `SELECT COUNT(*)::int as total FROM treehole_messages ${whereClause}`,
    params
  )
  const total = countResult[0]?.total || 0

  // 数据
  params.push(limit, offset)
  const messages = await query(
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
  })
}

/**
 * POST: 批量删除
 * Body: { ids: [1, 2, 3] }
 */
async function handleBatchDelete(req, res) {
  let body
  try {
    body = await parseBody(req)
  } catch {
    jsonResponse(res, 400, { error: '请求体格式错误' })
    return
  }

  const ids = body.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    jsonResponse(res, 400, { error: '请提供要删除的留言ID数组' })
    return
  }

  // 验证ID都是正整数
  const validIds = ids.filter(id => Number.isInteger(id) && id > 0)
  if (validIds.length === 0) {
    jsonResponse(res, 400, { error: '无效的ID列表' })
    return
  }

  // 构建参数化查询
  const placeholders = validIds.map((_, i) => `$${i + 1}`).join(', ')
  const result = await query(
    `UPDATE treehole_messages
     SET is_deleted = TRUE
     WHERE id IN (${placeholders}) AND is_deleted = FALSE
     RETURNING id`,
    validIds
  )

  jsonResponse(res, 200, {
    message: `成功删除 ${result.length} 条留言`,
    deletedCount: result.length,
    deletedIds: result.map(r => r.id),
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
