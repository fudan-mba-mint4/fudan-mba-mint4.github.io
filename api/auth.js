// 认证 API
// POST /api/auth/register       - 注册
// POST /api/auth/login          - 登录
// POST /api/auth/change-password - 修改密码
// GET  /api/auth/me             - 获取当前用户信息
import { getSql, initDatabase, query } from '../../lib/db.js'
import { jsonResponse } from '../../lib/validate.js'
import crypto from 'crypto'

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

// 密码哈希（和前端一致）
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'mint4_salt_2026').digest('hex')
}

// 生成随机token
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// 从Authorization头获取用户
async function getAuthUser(req, sql) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null
  const result = await sql`
    SELECT id, username, name, nickname, group_no, created_at
    FROM users
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
    jsonResponse(res, 503, { error: '数据库连接失败，请稍后重试', detail: err.message })
    return
  }

  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname.replace(/^\/api\/auth\/?/, '')

  try {
    if (req.method === 'POST' && path === 'register') {
      await handleRegister(req, res)
    } else if (req.method === 'POST' && path === 'login') {
      await handleLogin(req, res)
    } else if (req.method === 'POST' && path === 'change-password') {
      await handleChangePassword(req, res)
    } else if (req.method === 'PUT' && path === 'profile') {
      await handleUpdateProfile(req, res)
    } else if (req.method === 'GET' && path === 'me') {
      await handleMe(req, res)
    } else {
      jsonResponse(res, 404, { error: '接口不存在' })
    }
  } catch (err) {
    console.error('认证API错误:', err)
    jsonResponse(res, 500, { error: '服务器内部错误', detail: err.message })
  }
}

async function handleRegister(req, res) {
  const sql = getSql()
  const body = await parseBody(req)
  const { username, password, name, nickname } = body

  if (!username || username.trim().length < 2) {
    return jsonResponse(res, 400, { error: '用户名至少2个字符' })
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return jsonResponse(res, 400, { error: '用户名只能包含字母、数字和下划线' })
  }
  if (!password || password.length < 6) {
    return jsonResponse(res, 400, { error: '密码至少6位' })
  }
  if (!name || name.trim().length < 2) {
    return jsonResponse(res, 400, { error: '请输入真实姓名' })
  }

  // 检查用户名是否已存在
  const existing = await sql`SELECT id FROM users WHERE username = ${username.trim()} LIMIT 1`
  if (existing.length > 0) {
    return jsonResponse(res, 409, { error: '该用户名已被注册' })
  }

  const token = generateToken()
  const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const result = await sql`
    INSERT INTO users (username, password_hash, name, nickname, token, token_expires_at)
    VALUES (${username.trim()}, ${hashPassword(password)}, ${name.trim()}, ${nickname?.trim() || ''}, ${token}, ${tokenExpires})
    RETURNING id, username, name, nickname, group_no, created_at
  `

  jsonResponse(res, 201, {
    message: '注册成功',
    data: { user: result[0], token, expiresAt: tokenExpires.toISOString() },
  })
}

async function handleLogin(req, res) {
  const sql = getSql()
  const body = await parseBody(req)
  const { username, password } = body

  if (!username || !password) {
    return jsonResponse(res, 400, { error: '请输入用户名和密码' })
  }

  const result = await sql`
    SELECT id, username, password_hash, name, nickname, group_no, created_at
    FROM users
    WHERE username = ${username.trim()}
    LIMIT 1
  `

  if (result.length === 0 || result[0].password_hash !== hashPassword(password)) {
    return jsonResponse(res, 401, { error: '用户名或密码错误' })
  }

  const token = generateToken()
  const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const user = result[0]

  await sql`
    UPDATE users SET token = ${token}, token_expires_at = ${tokenExpires}
    WHERE id = ${user.id}
  `

  const { password_hash, ...safeUser } = user
  jsonResponse(res, 200, {
    message: '登录成功',
    data: { user: safeUser, token, expiresAt: tokenExpires.toISOString() },
  })
}

async function handleChangePassword(req, res) {
  const sql = getSql()
  const user = await getAuthUser(req, sql)
  if (!user) {
    return jsonResponse(res, 401, { error: '未登录或登录已过期' })
  }

  const body = await parseBody(req)
  const { oldPassword, newPassword } = body

  if (!newPassword || newPassword.length < 6) {
    return jsonResponse(res, 400, { error: '新密码至少6位' })
  }

  // 验证旧密码
  const result = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`
  if (result[0].password_hash !== hashPassword(oldPassword)) {
    return jsonResponse(res, 400, { error: '旧密码错误' })
  }

  await sql`UPDATE users SET password_hash = ${hashPassword(newPassword)} WHERE id = ${user.id}`
  jsonResponse(res, 200, { message: '密码修改成功' })
}

async function handleMe(req, res) {
  const sql = getSql()
  const user = await getAuthUser(req, sql)
  if (!user) {
    return jsonResponse(res, 401, { error: '未登录或登录已过期' })
  }
  jsonResponse(res, 200, { data: user })
}

async function handleUpdateProfile(req, res) {
  const sql = getSql()
  const user = await getAuthUser(req, sql)
  if (!user) {
    return jsonResponse(res, 401, { error: '未登录或登录已过期' })
  }

  const body = await parseBody(req)
  const allowedFields = ['name', 'nickname', 'group_no']
  const updates = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return jsonResponse(res, 400, { error: '没有可更新的字段' })
  }

  // 手动构建SET子句
  const setClauses = []
  const params = []
  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = $${params.length + 1}`)
    params.push(value)
  }
  params.push(user.id)

  await query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
    params
  )

  const result = await sql`
    SELECT id, username, name, nickname, group_no, created_at FROM users WHERE id = ${user.id}
  `
  jsonResponse(res, 200, { message: '更新成功', data: result[0] })
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
