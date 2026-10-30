// 认证 API（Cloudflare Pages Functions）
// POST /api/auth/register       - 注册
// POST /api/auth/login          - 登录
// POST /api/auth/change-password - 修改密码
// PUT  /api/auth/profile        - 更新个人信息
// GET  /api/auth/me             - 获取当前用户信息
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, hashPassword, generateToken,
  getAuthUser, corsResponse, optionsResponse, parseBody, COMMITTEE_ROLES, isViewerOnly,
} from '../../_utils.js'
import { isInRoster, normalizeName, orientationGroupOf } from '../../_roster.js'

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') return optionsResponse()

  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/auth\/?/, '')

  try {
    if (request.method === 'POST' && path === 'register') return handleRegister(request, env)
    if (request.method === 'POST' && path === 'login') return handleLogin(request, env)
    if (request.method === 'POST' && path === 'change-password') return handleChangePassword(request, env)
    if (request.method === 'PUT' && path === 'profile') return handleUpdateProfile(request, env)
    if (request.method === 'GET' && path === 'me') return handleMe(request, env)
    if (request.method === 'GET' && path === 'check-name') return handleCheckName(request, env)
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
  // 规范化真名（去空白/异体归一），后续白名单、查重、入库、角色识别全部使用它
  const cleanName = normalizeName(name)
  if (cleanName.length < 2) return corsResponse({ error: '请输入真实姓名' }, 400)

  // 只有同学名录（84 人，含班主任、传承人）内的真名可注册
  if (!isInRoster(cleanName)) {
    return corsResponse({ error: '非本班同学，请联系4班副主理人雷振宇注册', code: 'NOT_IN_ROSTER' }, 403)
  }

  // 真名唯一：已被注册的真名不能再被他人使用
  const nameTaken = await sql`SELECT id FROM users WHERE name = ${cleanName} LIMIT 1`
  if (nameTaken.length > 0) {
    return corsResponse({ error: '该真名已被注册，如为本人请直接登录', code: 'NAME_TAKEN' }, 409)
  }

  const existing = await sql`SELECT id FROM users WHERE username = ${username.trim()} LIMIT 1`
  if (existing.length > 0) return corsResponse({ error: '该用户名已被注册' }, 409)

  const token = generateToken()
  const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  // 按真名自动识别班委角色（非班委为 null）
  const role = COMMITTEE_ROLES[cleanName] || null
  // 按真名自动分配 Orientation 分组（1-6）；班主任/传承人组长等无分组为 null
  const groupNo = orientationGroupOf(cleanName)

  const result = await sql`
    INSERT INTO users (username, password_hash, name, nickname, role, group_no, token, token_expires_at)
    VALUES (${username.trim()}, ${await hashPassword(password)}, ${cleanName}, ${nickname?.trim() || ''}, ${role}, ${groupNo}, ${token}, ${tokenExpires})
    RETURNING id, username, name, nickname, role, group_no, created_at
  `

  return corsResponse({
    message: role ? '注册成功，已识别为班委' : '注册成功',
    data: { user: result[0], token, expiresAt: tokenExpires.toISOString() },
  }, 201)
}

// GET /api/auth/check-name?name=xxx —— 注册页“真实姓名”框失焦时校验（公开、无需登录）
// 返回 state：empty（未填，不提示）| too_short（只输了一个字，提示填完整）| not_in_roster（非本班）| name_taken（真名已被注册）| ok（可注册）
async function handleCheckName(request, env) {
  const sql = getSql(env)
  const url = new URL(request.url)
  const cleanName = normalizeName(url.searchParams.get('name'))

  if (cleanName.length === 0) return corsResponse({ data: { state: 'empty' } })
  if (cleanName.length < 2) return corsResponse({ data: { state: 'too_short' } })
  if (!isInRoster(cleanName)) return corsResponse({ data: { state: 'not_in_roster' } })

  const taken = await sql`SELECT id FROM users WHERE name = ${cleanName} LIMIT 1`
  if (taken.length > 0) return corsResponse({ data: { state: 'name_taken' } })

  return corsResponse({ data: { state: 'ok' } })
}

async function handleLogin(request, env) {
  const sql = getSql(env)
  const body = await parseBody(request)
  const { username, password } = body

  if (!username || !password) return corsResponse({ error: '请输入用户名和密码' }, 400)

  const result = await sql`
    SELECT id, username, password_hash, name, nickname, role, group_no, created_at
    FROM users WHERE username = ${username.trim()} LIMIT 1
  `

  if (result.length === 0 || result[0].password_hash !== await hashPassword(password)) {
    return corsResponse({ error: '用户名或密码错误' }, 401)
  }

  const token = generateToken()
  const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const user = result[0]
  // 每次登录按最新班委名单刷新角色：映射配置前注册的班委也能自动获得权限
  user.role = COMMITTEE_ROLES[user.name] || null
  // 同时按名录刷新分组：分组规则调整后，老账号登录即自动同步
  user.group_no = orientationGroupOf(user.name)

  await sql`UPDATE users SET token = ${token}, token_expires_at = ${tokenExpires}, role = ${user.role}, group_no = ${user.group_no} WHERE id = ${user.id}`

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
  const { name, nickname } = body // group_no 由系统按真名自动分配，不可自行修改

  if (name !== undefined) {
    const cleanName = normalizeName(name)
    if (cleanName.length < 2) return corsResponse({ error: '请输入真实姓名' }, 400)
    // 改名同样必须本班同学、且不能与他人重名（排除自己），防止绕过注册校验
    if (!isInRoster(cleanName)) {
      return corsResponse({ error: '非本班同学，请联系4班副主理人雷振宇注册', code: 'NOT_IN_ROSTER' }, 403)
    }
    const dup = await sql`SELECT id FROM users WHERE name = ${cleanName} AND id != ${user.id} LIMIT 1`
    if (dup.length > 0) {
      return corsResponse({ error: '该真名已被注册', code: 'NAME_TAKEN' }, 409)
    }
    // 同步按新真名重算班委角色与分组，避免改名后身份不一致
    const newRole = COMMITTEE_ROLES[cleanName] || null
    const newGroupNo = orientationGroupOf(cleanName)
    await sql`UPDATE users SET name = ${cleanName}, role = ${newRole}, group_no = ${newGroupNo} WHERE id = ${user.id}`
  }
  if (nickname !== undefined) {
    await sql`UPDATE users SET nickname = ${String(nickname).trim()} WHERE id = ${user.id}`
  }
  // 分组由系统按真名自动分配，此处忽略任何 group_no 传参

  const result = await sql`SELECT id, username, name, nickname, role, group_no, created_at FROM users WHERE id = ${user.id}`
  return corsResponse({ message: '更新成功', data: result[0] })
}

async function handleMe(request, env) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return corsResponse({ error: '未登录或登录已过期' }, 401)
  // 按最新名单刷新角色并回写（覆盖 token 仍有效、未重新登录的班委）
  const freshRole = COMMITTEE_ROLES[user.name] || null
  // 同时按名录刷新分组并回写（分组规则调整后，在线会话自动同步）
  const freshGroupNo = orientationGroupOf(user.name)
  if (freshRole !== user.role || freshGroupNo !== user.group_no) {
    await sql`UPDATE users SET role = ${freshRole}, group_no = ${freshGroupNo} WHERE id = ${user.id}`
    user.role = freshRole
    user.group_no = freshGroupNo
  }
  // viewerOnly：班主任 / 传承人仅可查看，不能参与投票、申报、报销、报名等活动（前端据此隐藏参与按钮）
  return corsResponse({ data: { ...user, viewerOnly: isViewerOnly(user) } })
}
