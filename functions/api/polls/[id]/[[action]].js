// 投票详情/提交 API（EdgeOne Pages Functions 版本）
// GET  /api/polls/:id       - 获取单个投票详情（含用户是否已投票）
// POST /api/polls/:id/vote  - 提交投票
import {
  getSql, initDatabase, getAuthUser, hashIp, getClientIp,
  corsResponse, optionsResponse, parseBody,
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

export async function onRequest(context) {
  const { request, env, params } = context

  if (request.method === 'OPTIONS') return optionsResponse()

  try {
    await ensureDb(env)
  } catch (err) {
    return corsResponse({ error: '数据库连接失败', detail: err.message }, 503)
  }

  const pollId = params.id
  const action = params.action // 'vote' 或 undefined

  try {
    if (request.method === 'GET' && !action) return handleGetOne(request, env, pollId)
    if (request.method === 'POST' && action === 'vote') return handleVote(request, env, pollId)
    return corsResponse({ error: '接口不存在' }, 404)
  } catch (err) {
    console.error('投票API错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: err.message }, 500)
  }
}

async function handleGetOne(request, env, pollId) {
  const sql = getSql(env)
  const url = new URL(request.url)
  const userId = url.searchParams.get('user_id') || null

  const counts = await getVoteCounts(sql, [pollId])

  let userVoted = []
  if (userId) {
    const voted = await sql`
      SELECT option_id FROM poll_votes
      WHERE poll_id = ${pollId} AND user_id = ${userId}
    `
    userVoted = voted.map(r => r.option_id)
  }

  return corsResponse({
    data: { pollId, votes: counts[pollId] || {}, userVoted },
  })
}

async function handleVote(request, env, pollId) {
  const sql = getSql(env)
  const body = await parseBody(request)
  const { optionIds, userId, anonymous } = body

  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    return corsResponse({ error: '请选择投票选项' }, 400)
  }
  if (!userId) return corsResponse({ error: '请先登录' }, 401)

  const ip = getClientIp(request)
  const ipHash = await hashIp(ip)

  try {
    // 检查是否已投票
    if (anonymous) {
      const existing = await sql`
        SELECT id FROM poll_votes
        WHERE poll_id = ${pollId} AND ip_hash = ${ipHash}
        LIMIT 1
      `
      if (existing.length > 0) return corsResponse({ error: '您已投过票了' }, 409)
    } else {
      const existing = await sql`
        SELECT id FROM poll_votes
        WHERE poll_id = ${pollId} AND user_id = ${userId}
        LIMIT 1
      `
      if (existing.length > 0) return corsResponse({ error: '您已投过票了' }, 409)
    }

    // 批量插入
    for (const oid of optionIds) {
      await sql`
        INSERT INTO poll_votes (poll_id, option_id, user_id, anonymous, ip_hash)
        VALUES (${pollId}, ${oid}, ${anonymous ? null : userId}, ${anonymous}, ${ipHash})
      `
    }

    const counts = await getVoteCounts(sql, [pollId])
    return corsResponse({
      message: '投票成功',
      data: { votes: counts[pollId] || {}, userVoted: optionIds },
    }, 201)
  } catch (err) {
    if (err.code === '23505') return corsResponse({ error: '您已投过票了' }, 409)
    throw err
  }
}
