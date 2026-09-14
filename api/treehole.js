// 匿名树洞 API
// GET  /api/treehole       - 获取留言列表（分页）+ 统计
// POST /api/treehole       - 提交留言
import { getSql, initDatabase } from '../../lib/db.js'
import {
  validateTreeholeMessage,
  checkRateLimit,
  getClientIp,
  hashIp,
  jsonResponse,
} from '../../lib/validate.js'

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

  try {
    await ensureDb()
  } catch (err) {
    jsonResponse(res, 503, { error: '数据库连接失败，请稍后重试', detail: err.message })
    return
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
 * GET: 获取留言列表 + 统计
 */
async function handleGet(req, res) {
  const sql = getSql()
  const url = new URL(req.url, 'http://localhost')
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  // 并行查询：总数、今日新增、分页数据
  const [countResult, todayResult, messages] = await Promise.all([
    sql`SELECT COUNT(*)::int as total FROM treehole_messages WHERE is_deleted = FALSE`,
    sql`SELECT COUNT(*)::int as today_count FROM treehole_messages WHERE is_deleted = FALSE AND created_at >= CURRENT_DATE`,
    sql`SELECT id, nickname, content, created_at
         FROM treehole_messages
         WHERE is_deleted = FALSE
         ORDER BY created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
  ])

  const total = countResult[0]?.total || 0
  const todayCount = todayResult[0]?.today_count || 0

  jsonResponse(res, 200, {
    data: messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      total,
      todayCount,
    },
  })
}

/**
 * POST: 提交留言
 */
async function handlePost(req, res) {
  const sql = getSql()

  // 频率限制
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(ip, 60000, 3)
  if (!rateLimit.allowed) {
    jsonResponse(res, 429, {
      error: '提交太频繁，请稍后再试',
      retryAfter: 60,
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

  // 哈希IP
  const ipHash = await hashIp(ip)

  // 存入数据库
  const result = await sql`
    INSERT INTO treehole_messages (nickname, content, ip_hash)
    VALUES (${data.nickname}, ${data.content}, ${ipHash})
    RETURNING id, nickname, content, created_at
  `

  jsonResponse(res, 201, {
    message: '留言提交成功',
    data: result[0],
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
