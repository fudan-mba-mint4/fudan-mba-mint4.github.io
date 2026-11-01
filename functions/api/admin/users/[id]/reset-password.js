// 用户管理 - POST /api/admin/users/:id/reset-password（一键重置密码为 123456，仅主理人/副主理人）
// 重置同时清空该用户 token（当前会话立即失效，需用新密码重新登录）；全程 admin_history 留痕。
import {
  getSql, corsResponse, optionsResponse, requireUsersAdmin, hashPassword,
  logHistory, ensureTables, isMissingTableError,
} from '../../../../_utils.js'

const DEFAULT_PASSWORD = '123456'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireUsersAdmin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  try {
    if (request.method === 'POST') return await handleReset(request, env, auth.user, params)
    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        return await handleReset(request, env, auth.user, params)
      } catch (e2) { console.error('users reset 懒建表后重试失败:', e2) }
    }
    console.error('users reset 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleReset(request, env, operator, params) {
  const sql = getSql(env)
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) return corsResponse({ error: '用户 ID 无效' }, 400)
  const rows = await sql`SELECT id, username, name FROM users WHERE id = ${id} LIMIT 1`
  if (!rows.length) return corsResponse({ error: '用户不存在' }, 404)
  const u = rows[0]
  await sql`
    UPDATE users
    SET password_hash = ${await hashPassword(DEFAULT_PASSWORD)}, token = NULL, token_expires_at = NULL
    WHERE id = ${id}`
  await logHistory(sql, {
    type: 'users', action: 'reset-password', refId: String(id),
    description: `重置用户「${u.name}」（${u.username}）的密码为 ${DEFAULT_PASSWORD}，并已登出其当前会话`,
    operator: operator.name,
  })
  return corsResponse({ message: `已重置「${u.name}」的密码为 ${DEFAULT_PASSWORD}（该用户已登出，需用新密码重新登录）` })
}
