// 认证 API（EdgeOne Pages Functions 版本）
// POST /api/auth/register       - 注册
// POST /api/auth/login          - 登录
// POST /api/auth/change-password - 修改密码
// PUT  /api/auth/profile        - 更新个人信息
// GET  /api/auth/me             - 获取当前用户信息
import {
  getSql, initDatabase, hashPassword, generateToken,
  getAuthUser, corsResponse, optionsResponse, parseBody,
} from '../../_utils.js'

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
  const { request, env } = context

  if (request.method === 'OPTIONS') return optionsResponse()

  try {
    await ensureDb(env)
  } catch (err) {
    return corsResponse({ error: '数据库连接失败', detail: err.message }, 503)
  }

  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/auth\/?/, '')

  try {
    if (request.method === 'POST' && path === 'register') return handleRegister(request, env)
    if (request.method === 'POST' && path === 'login') return handleLogin(request, env)
    if (request.method === 'POST' && path === 'change-password') return handleChangePassword(request, env)
    if (request.method === 'PUT' && path === 'profile') return handleUpdateProfile(request, env)
    if (request.method === 'GET' && path === 'me') return handleMe(request, env)
    return corsResponse({ error: '接口不存在' }, 404)
  } catch (err) {
    console.error('认证API错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: err.message }, 500)
  }
}

async function handleRegister(request, env) {
  const sql = getSql(env)
  const body = await parseBody(request)
  const { username, password, name, nickname } = body

  if (!username || username.trim().length < 2) return corsResponse({ error: '用户名至少2个字符' }, 400)
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return corsResponse({ error: '用户名只能包含字母、数字和下划线' }, 400)
  if (!password || password.length < 6) return corsResponse({ error: '密码至少6位' }, 400)
  if (!name || name.trim().length < 2) return corsResponse({ error: '请输入真实姓名' }, 400)

  const existing = await sql`SELECT id FROM users WHERE username = ${username.trim()} LIMIT 1`
  if (existing.length > 0) return corsResponse({ error: '该用户名已被注册' }, 409)

  const token = generateToken()
  const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const result = await sql`
    INSERT INTO users (username, password_hash, name, nickname, token, token_expires_at)
    VALUES (${username.trim()}, ${await hashPassword(password)}, ${name.trim()}, ${nickname?.trim() || ''}, ${token}, ${tokenExpires})
    RETURNING id, username, name, nickname, group_no, created_at
  `

  return corsResponse({
    message: '注册成功',
    data: { user: result[0], token, expiresAt: tokenExpires.toISOString() },
  }, 201)
}

async function handleLogin(request, env) {
  const sql = getSql(env)
  const body = await parseBody(request)
  const { username, password } = body

  if (!username || !password) return corsResponse({ error: '请输入用户名和密码' }, 400)

  const result = await sql`
    SELECT id, username, password_hash, name, nickname, group_no, created_at
    FROM users WHERE username = ${username.trim()} LIMIT 1
  `

  if (result.length === 0 || result[0].password_hash !== await hashPassword(password)) {
    return corsResponse({ error: '用户名或密码错误' }, 401)
  }

  const token = generateToken()
  const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const user = result[0]

  await sql`UPDATE users SET token = ${token}, token_expires_at = ${tokenExpires} WHERE id = ${user.id}`

  const { password_hash, ...safeUser } = user
  return corsResponse({
    message: '登录成功',
    data: { user: safeUser, token, expiresAt: tokenExpires.toISOString() },
  })
}

async function handleChangePassword(request, env) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return corsResponse({ error: '未登录或登录已过期' }, 401)

  const body = await parseBody(request)
  const { oldPassword, newPassword } = body

  if (!newPassword || newPassword.length < 6) return corsResponse({ error: '新密码至少6位' }, 400)

  const result = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`
  if (result[0].password_hash !== await hashPassword(oldPassword)) {
    return corsResponse({ error: '旧密码错误' }, 400)
  }

  await sql`UPDATE users SET password_hash = ${await hashPassword(newPassword)} WHERE id = ${user.id}`
  return corsResponse({ message: '密码修改成功' })
}

async function handleUpdateProfile(request, env) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return corsResponse({ error: '未登录或登录已过期' }, 401)

  const body = await parseBody(request)
  const { name, nickname, group_no } = body

  if (name !== undefined) {
    await sql`UPDATE users SET name = ${String(name).trim()} WHERE id = ${user.id}`
  }
  if (nickname !== undefined) {
    await sql`UPDATE users SET nickname = ${String(nickname).trim()} WHERE id = ${user.id}`
  }
  if (group_no !== undefined) {
    const gno = group_no === '' || group_no === null ? null : parseInt(group_no, 10)
    await sql`UPDATE users SET group_no = ${gno} WHERE id = ${user.id}`
  }

  const result = await sql`SELECT id, username, name, nickname, group_no, created_at FROM users WHERE id = ${user.id}`
  return corsResponse({ message: '更新成功', data: result[0] })
}

async function handleMe(request, env) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return corsResponse({ error: '未登录或登录已过期' }, 401)
  return corsResponse({ data: user })
}
