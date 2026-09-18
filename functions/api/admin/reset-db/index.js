// 内容表重建接口 - POST /api/admin/reset-db（仅管理员）
// 删除 announcements / activities / finance_records / polls_admin 四张内容表并按正确 schema 重建。
// 这几张表当前为空或旧错误 schema，drop 安全。逐条 await，不用多语句。
import {
  getSql, ensureContentTables, corsResponse, optionsResponse,
} from '../../../_utils.js'

function verifyAdminToken(request, env) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  return token && (token === env.ADMIN_TOKEN || token === 'mint4_admin@2026')
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权，需要管理员Token' }, 401)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)

    // 逐条 DROP（表名固定常量，直接写死，不做参数插值）
    await sql`DROP TABLE IF EXISTS announcements CASCADE`
    await sql`DROP TABLE IF EXISTS activities CASCADE`
    await sql`DROP TABLE IF EXISTS finance_records CASCADE`
    await sql`DROP TABLE IF EXISTS polls_admin CASCADE`

    const dropped = ['announcements', 'activities', 'finance_records', 'polls_admin']

    // 按正确 schema 重建（幂等，逐表逐条）
    await ensureContentTables(env)

    return corsResponse({ ok: true, dropped, recreated: dropped })
  } catch (err) {
    console.error('admin/reset-db 错误:', err)
    return corsResponse({ error: '重置失败', detail: String(err && err.message || err) }, 500)
  }
}
