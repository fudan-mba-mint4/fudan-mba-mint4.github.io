// 活动报名 API（EdgeOne Pages Functions 版本）
// GET  /api/activities/:id/signups - 获取活动报名列表
// POST /api/activities/:id/signup  - 报名
// POST /api/activities/:id/cancel  - 取消报名
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, getAuthUser,
  corsResponse, optionsResponse,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context

  if (request.method === 'OPTIONS') return optionsResponse()

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
    SELECT s.id, s.username, u.name, u.nickname, s.created_at
    FROM activity_signups s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.activity_id = ${activityId}
    ORDER BY s.created_at ASC
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
