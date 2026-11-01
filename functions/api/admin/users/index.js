// 用户管理 - GET /api/admin/users（当前所有注册用户列表，仅主理人/副主理人可用）
// 返回脱敏字段：不含 password_hash / token，仅后台管理所需展示信息。
import {
  getSql, corsResponse, optionsResponse, requireUsersAdmin,
  ensureTables, isMissingTableError,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireUsersAdmin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  try {
    if (request.method === 'GET') return await handleList(env)
    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        return await handleList(env)
      } catch (e2) { console.error('users 懒建表后重试失败:', e2) }
    }
    console.error('users 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleList(env) {
  const sql = getSql(env)
  const rows = await sql`
    SELECT id, username, name, nickname, group_no, role, created_at
    FROM users
    ORDER BY created_at DESC, id DESC`
  return corsResponse({ users: rows })
}
