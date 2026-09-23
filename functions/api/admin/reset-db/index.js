// 内容表重建接口 - POST /api/admin/reset-db（仅班级主理人 leader）
// 删除 announcements / activities / finance_records / polls_admin 四张内容表并按正确 schema 重建。
// 破坏性操作，权限最严：即使副主理人也不可执行。逐条 await，不用多语句。
import {
  getSql, ensureContentTables, corsResponse, optionsResponse, getAuthUser,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return corsResponse({ error: '请先登录' }, 401)
  if (user.role !== 'leader') return corsResponse({ error: '该破坏性操作仅班级主理人可执行' }, 403)

  try {
    // 逐条 DROP（表名固定常量，直接写死，不做参数插值；SQLite 无 CASCADE 关键字）
    await sql`DROP TABLE IF EXISTS announcements`
    await sql`DROP TABLE IF EXISTS activities`
    await sql`DROP TABLE IF EXISTS finance_records`
    await sql`DROP TABLE IF EXISTS polls_admin`

    const dropped = ['announcements', 'activities', 'finance_records', 'polls_admin']

    // 按正确 schema 重建（幂等，逐表逐条）
    await ensureContentTables(env)

    return corsResponse({ ok: true, dropped, recreated: dropped })
  } catch (err) {
    console.error('admin/reset-db 错误:', err)
    return corsResponse({ error: '重置失败', detail: String(err && err.message || err) }, 500)
  }
}
