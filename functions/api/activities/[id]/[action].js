// 活动报名 API（EdgeOne Pages Functions 版本）
// GET  /api/activities/:id/signups - 获取活动报名列表
// POST /api/activities/:id/signup  - 报名
// POST /api/activities/:id/cancel  - 取消报名
import {
  getSql, initDatabase, getAuthUser,
  corsResponse, optionsResponse,
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

export async function onRequest(context) {
  const { request, env, params } = context

  if (request.method === 'OPTIONS') return optionsResponse()

  try {
    await ensureDb(env)
  } catch (err) {
    return corsResponse({ error: '数据库连接失败', detail: err.message }, 503)
  }

  const activityId = params.id
  const action = params.action

  try {
    if (request.method === 'GET' && action === 'signups') return handleGetSignups(env, activityId)
    if (request.method === 'POST' && action === 'signup') return handleSignup(request, env, activityId)
    if (request.method === 'POST' && action === 'cancel') return handleCancel(request, env, activityId)
    return corsResponse({ error: '接口不存在' }, 404)
  } catch (err) {
    console.error('活动报名API错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: err.message }, 500)
  }
}

async function handleGetSignups(env, activityId) {
  const sql = getSql(env)
  const result = await sql`
    SELECT id, username, created_at FROM activity_signups
    WHERE activity_id = ${activityId}
    ORDER BY created_at ASC
  `
  return corsResponse({ data: result, count: result.length })
}

async function handleSignup(request, env, activityId) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return corsResponse({ error: '请先登录' }, 401)

  try {
    await sql`
      INSERT INTO activity_signups (activity_id, user_id, username)
      VALUES (${activityId}, ${user.id}, ${user.username})
    `
    return corsResponse({ message: '报名成功' }, 201)
  } catch (err) {
    if (err.code === '23505') return corsResponse({ error: '您已报名此活动' }, 409)
    throw err
  }
}

async function handleCancel(request, env, activityId) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return corsResponse({ error: '请先登录' }, 401)

  await sql`DELETE FROM activity_signups WHERE activity_id = ${activityId} AND user_id = ${user.id}`
  return corsResponse({ message: '已取消报名' })
}
