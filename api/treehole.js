// 匿名树洞 API
// GET  /api/treehole       - 获取留言列表（分页）
// POST /api/treehole       - 提交留言
import { initDatabase, query } from '../../lib/db.js'
import {
  validateTreeholeMessage,
  checkRateLimit,
  getClientIp,
  hashIp,
  jsonResponse,
} from '../../lib/validate.js'

let dbInitialized = false

export default async function handler(req, res) {
  // CORS 头（允许前端跨域调用，同域名下其实不需要，但加上更安全）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  // 初始化数据库（幂等，只执行一次）
  if (!dbInitialized) {
    try {
      await initDatabase()
      dbInitialized = true
    } catch (err) {
      console.error('数据库初始化失败:', err)
      jsonResponse(res, 500, { error: '数据库初始化失败', detail: err.message })
      return
    }
  }

  try {
    if (req.method === 'GET') {
      await handleGet(req, res)
    } else if (req.method === 'POST') {
      await handlePost(req, res)
    } else {
      jsonResponse(res, 405, { error: '不支持的请求方法' })
    }
  } catch (err) {
    console.error('API错误:', err)
    jsonResponse(res, 500, { error: '服务器内部错误', detail: err.message })
  }
}

/**
 * GET: 获取留言列表
 * Query参数: page(默认1), limit(默认20, 最大50)
 */
async function handleGet(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  // 获取总数
  const countResult = await query(
    'SELECT COUNT(*)::int as total FROM treehole_messages WHERE is_deleted = FALSE'
  )
  const total = countResult[0]?.total || 0

  // 获取分页数据
  const messages = await query(
    `SELECT id, nickname, content, created_at
     FROM treehole_messages
     WHERE is_deleted = FALSE
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )

  jsonResponse(res, 200, {
    data: messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

/**
 * POST: 提交留言
 * Body: { nickname?: string, content: string }
 */
async function handlePost(req, res) {
  // 频率限制：同一IP 1分钟内最多3条
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(ip, 60000, 3)
  if (!rateLimit.allowed) {
    jsonResponse(res, 429, {
      error: '提交太频繁，请稍后再试',
      remaining: rateLimit.remaining,
    })
    return
  }

  // 解析请求体
  let body
  try {
    body = await parseBody(req)
  } catch {
    jsonResponse(res, 400, { error: '请求体格式错误' })
    return
  }

  // 参数校验
  const { valid, errors, data } = validateTreeholeMessage(body)
  if (!valid) {
    jsonResponse(res, 400, { error: '参数校验失败', errors })
    return
  }

  // 哈希IP（保护隐私，不存原始IP）
  const ipHash = await hashIp(ip)

  // 存入数据库
  const result = await query(
    `INSERT INTO treehole_messages (nickname, content, ip_hash)
     VALUES ($1, $2, $3)
     RETURNING id, nickname, content, created_at`,
    [data.nickname, data.content, ipHash]
  )

  jsonResponse(res, 201, {
    message: '留言提交成功',
    data: result[0],
  })
}

/**
 * 解析JSON请求体
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}
