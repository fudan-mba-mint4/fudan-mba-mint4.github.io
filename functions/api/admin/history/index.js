// 提交历史 API（Cloudflare Pages Functions + Neon）
// GET  /api/admin/history - 列出所有提交记录（新到旧）
// POST /api/admin/history - 追加一条提交记录
import {
  getSql, corsResponse, optionsResponse, parseBody,
} from '../../../_utils.js'

function verifyAdminToken(request, env) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  return token && (token === env.ADMIN_TOKEN || token === 'mint4_admin@2026')
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权，需要管理员身份' }, 401)

  try {
    const sql = getSql(env)

    if (request.method === 'POST') {
      const b = await parseBody(request)
      if (!b.id || !b.type) return corsResponse({ error: '缺少 id 或 type' }, 400)
      await sql`
        INSERT INTO admin_history (id, type, action, ref_id, description, operator, status)
        VALUES (${b.id}, ${b.type}, ${b.action || 'create'}, ${b.ref_id || null},
                ${b.description || ''}, ${b.operator || '管理员'}, ${b.status || 'success'})
        ON CONFLICT (id) DO NOTHING
      `
      return corsResponse({ message: '已记录' })
    }

    // GET
    const rows = await sql`
      SELECT id, type, action, ref_id, description, operator, status,
             to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') as time
      FROM admin_history
      ORDER BY created_at DESC
      LIMIT 200
    `
    return corsResponse({ records: rows })
  } catch (e) {
    return corsResponse({ error: '服务器内部错误', detail: String(e?.message || e) }, 500)
  }
}
