// 提交历史 API（Cloudflare Pages Functions + D1）
// GET  /api/admin/history - 列出所有提交记录（新到旧）
// POST /api/admin/history - 追加一条提交记录
// 鉴权：登录班委（任意角色）。operator 由服务端按登录真名写入，防止前端伪造。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireCommittee,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireCommittee(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)

    if (request.method === 'POST') {
      const b = await parseBody(request)
      if (!b.id || !b.type) return corsResponse({ error: '缺少 id 或 type' }, 400)
      await sql`
        INSERT INTO admin_history (id, type, action, ref_id, description, operator, status)
        VALUES (${b.id}, ${b.type}, ${b.action || 'create'}, ${b.ref_id || null},
                ${b.description || ''}, ${auth.user.name}, ${b.status || 'success'})
        ON CONFLICT (id) DO NOTHING
      `
      return corsResponse({ message: '已记录' })
    }

    // GET
    const rows = await sql`
      SELECT id, type, action, ref_id, description, operator, status,
             created_at as time
      FROM admin_history
      ORDER BY created_at DESC
      LIMIT 200
    `
    return corsResponse({ records: rows })
  } catch (e) {
    return corsResponse({ error: '服务器内部错误', detail: String(e?.message || e) }, 500)
  }
}
