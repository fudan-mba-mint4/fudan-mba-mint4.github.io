// 投票 API
// GET  /api/polls           - 获取所有投票（含票数统计）
// GET  /api/polls/:id       - 获取单个投票详情
// POST /api/polls/:id/vote  - 提交投票
import { getSql, initDatabase } from '../../lib/db.js'
import { getClientIp, hashIp, jsonResponse } from '../../lib/validate.js'

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

  // 解析路径：/api/polls 或 /api/polls/:id 或 /api/polls/:id/vote
  const url = new URL(req.url, 'http://localhost')
  const parts = url.pathname.replace(/^\/api\/polls\/?/, '').split('/').filter(Boolean)

  try {
    if (req.method === 'GET' && parts.length === 0) {
      await handleGetAll(req, res)
    } else if (req.method === 'GET' && parts.length === 1) {
      await handleGetOne(req, res, parts[0])
    } else if (req.method === 'POST' && parts.length === 2 && parts[1] === 'vote') {
      await handleVote(req, res, parts[0])
    } else {
      jsonResponse(res, 404, { error: '接口不存在' })
    }
  } catch (err) {
    console.error('投票API错误:', err)
    jsonResponse(res, 500, { error: '服务器内部错误', detail: err.message })
  }
}

/**
 * 获取所有投票的票数统计
 */
async function getVoteCounts(sql, pollIds) {
  if (!pollIds.length) return {}
  const result = await sql`
    SELECT poll_id, option_id, COUNT(*)::int as votes
    FROM poll_votes
    WHERE poll_id = ANY(${pollIds})
    GROUP BY poll_id, option_id
  `
  const counts = {}
  for (const row of result) {
    if (!counts[row.poll_id]) counts[row.poll_id] = {}
    counts[row.poll_id][row.option_id] = row.votes
  }
  return counts
}

/**
 * GET: 获取所有投票列表
 */
async function handleGetAll(req, res) {
  // 投票元数据从 polls.json 读取（由 Admin 维护）
  // 这里只返回数据库中的票数统计
  const sql = getSql()
  const result = await sql`
    SELECT poll_id, option_id, COUNT(*)::int as votes
    FROM poll_votes
    GROUP BY poll_id, option_id
  `
  const counts = {}
  for (const row of result) {
    if (!counts[row.poll_id]) counts[row.poll_id] = {}
    counts[row.poll_id][row.option_id] = row.votes
  }
  jsonResponse(res, 200, { data: counts })
}

/**
 * GET: 获取单个投票详情（含用户是否已投票）
 */
async function handleGetOne(req, res, pollId) {
  const sql = getSql()
  const url = new URL(req.url, 'http://localhost')
  const userId = url.searchParams.get('user_id') || null

  // 获取票数
  const counts = await getVoteCounts(sql, [pollId])

  // 检查用户是否已投票
  let userVoted = []
  if (userId) {
    const voted = await sql`
      SELECT option_id FROM poll_votes
      WHERE poll_id = ${pollId} AND user_id = ${userId}
    `
    userVoted = voted.map(r => r.option_id)
  }

  jsonResponse(res, 200, {
    data: {
      pollId,
      votes: counts[pollId] || {},
      userVoted,
    },
  })
}

/**
 * POST: 提交投票
 */
async function handleVote(req, res, pollId) {
  const sql = getSql()

  let body
  try {
    body = await parseBody(req)
  } catch {
    jsonResponse(res, 400, { error: '请求体格式错误' })
    return
  }

  const { optionIds, userId, anonymous } = body
  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    jsonResponse(res, 400, { error: '请选择投票选项' })
    return
  }
  if (!userId) {
    jsonResponse(res, 400, { error: '请先登录' })
    return
  }

  const ip = getClientIp(req)
  const ipHash = await hashIp(ip)

  try {
    // 检查是否已投票（实名用user_id，匿名用ip_hash+poll_id）
    if (anonymous) {
      const existing = await sql`
        SELECT id FROM poll_votes
        WHERE poll_id = ${pollId} AND ip_hash = ${ipHash}
        LIMIT 1
      `
      if (existing.length > 0) {
        jsonResponse(res, 409, { error: '您已投过票了' })
        return
      }
    } else {
      const existing = await sql`
        SELECT id FROM poll_votes
        WHERE poll_id = ${pollId} AND user_id = ${userId}
        LIMIT 1
      `
      if (existing.length > 0) {
        jsonResponse(res, 409, { error: '您已投过票了' })
        return
      }
    }

    // 批量插入投票记录
    for (const oid of optionIds) {
      await sql`
        INSERT INTO poll_votes (poll_id, option_id, user_id, anonymous, ip_hash)
        VALUES (${pollId}, ${oid}, ${anonymous ? null : userId}, ${anonymous}, ${ipHash})
      `
    }

    // 返回最新票数
    const counts = await getVoteCounts(sql, [pollId])
    jsonResponse(res, 201, {
      message: '投票成功',
      data: { votes: counts[pollId] || {}, userVoted: optionIds },
    })
  } catch (err) {
    if (err.code === '23505') {
      jsonResponse(res, 409, { error: '您已投过票了' })
    } else {
      throw err
    }
  }
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
