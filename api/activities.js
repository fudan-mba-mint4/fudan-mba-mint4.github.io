// 活动报名 API
// GET  /api/activities/:id/signups       - 获取活动报名列表
// POST /api/activities/:id/signup        - 报名
// POST /api/activities/:id/cancel        - 取消报名
import { getSql, initDatabase } from '../../lib/db.js'
import { jsonResponse } from '../../lib/validate.js'

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

async function getAuthUser(req, sql) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null
  const result = await sql`
    SELECT id, username, name FROM users
    WHERE token = ${token} AND (token_expires_at IS NULL OR token_expires_at > NOW())
    LIMIT 1
  `
  return result[0] || null
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
    jsonResponse(res, 503, { error: '数据库连接失败', detail: err.message })
    return
  }

  const url = new URL(req.url, 'http://localhost')
  const parts = url.pathname.replace(/^\/api\/activities\/?/, '').split('/').filter(Boolean)
  const activityId = parts[0]
  const action = parts[1]

  try {
    if (req.method === 'GET' && action === 'signups') {
      await handleGetSignups(req, res, activityId)
    } else if (req.method === 'POST' && action === 'signup') {
      await handleSignup(req, res, activityId)
    } else if (req.method === 'POST' && action === 'cancel') {
      await handleCancel(req, res, activityId)
    } else {
      jsonResponse(res, 404, { error: '接口不存在' })
    }
  } catch (err) {
    console.error('活动报名API错误:', err)
    jsonResponse(res, 500, { error: '服务器内部错误', detail: err.message })
  }
}

async function handleGetSignups(req, res, activityId) {
  const sql = getSql()
  const result = await sql`
    SELECT id, username, created_at FROM activity_signups
    WHERE activity_id = ${activityId}
    ORDER BY created_at ASC
  `
  jsonResponse(res, 200, { data: result, count: result.length })
}

async function handleSignup(req, res, activityId) {
  const sql = getSql()
  const user = await getAuthUser(req, sql)
  if (!user) {
    return jsonResponse(res, 401, { error: '请先登录' })
  }

  try {
    await sql`
      INSERT INTO activity_signups (activity_id, user_id, username)
      VALUES (${activityId}, ${user.id}, ${user.username})
    `
    jsonResponse(res, 201, { message: '报名成功' })
  } catch (err) {
    if (err.code === '23505') {
      jsonResponse(res, 409, { error: '您已报名此活动' })
    } else {
      throw err
    }
  }
}

async function handleCancel(req, res, activityId) {
  const sql = getSql()
  const user = await getAuthUser(req, sql)
  if (!user) {
    return jsonResponse(res, 401, { error: '请先登录' })
  }

  await sql`
    DELETE FROM activity_signups
    WHERE activity_id = ${activityId} AND user_id = ${user.id}
  `
  jsonResponse(res, 200, { message: '已取消报名' })
}
