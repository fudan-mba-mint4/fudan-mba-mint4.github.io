// 薄荷币 · 申报列表 - GET /api/admin/coins/claims（审批仅限财务激励官：高晓梅 / 叶宏颖）
// 默认返回待审核（pending）申报；?all=1 返回全部。
import {
  getSql, corsResponse, optionsResponse, requireCoinsAdmin,
  ensureTables, isMissingTableError,
} from '../../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)
  const auth = await requireCoinsAdmin(request, env, { auditOnly: true })
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  try {
    const sql = getSql(env)
    const url = new URL(request.url)
    const all = url.searchParams.get('all') === '1'
    const rows = all
      ? await sql`SELECT * FROM coin_claims ORDER BY created_at DESC LIMIT 100`
      : await sql`SELECT * FROM coin_claims WHERE status='pending' ORDER BY created_at ASC LIMIT 100`
    return corsResponse({
      claims: rows.map(c => {
        let proofs = [], recipients = []
        try { proofs = JSON.parse(c.proofs || '[]') } catch {}
        try { recipients = JSON.parse(c.recipients || '[]') } catch {}
        return {
          id: c.id, userId: c.user_id, applicant: c.applicant, ruleId: c.rule_id,
          title: c.title, description: c.description, activityId: c.activity_id,
          proofs, recipients, total: c.total, status: c.status,
          auditor: c.auditor, auditNote: c.audit_note, createdAt: c.created_at,
        }
      }),
    })
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        const sql = getSql(env)
        const all = new URL(request.url).searchParams.get('all') === '1'
        const rows = all
          ? await sql`SELECT * FROM coin_claims ORDER BY created_at DESC LIMIT 100`
          : await sql`SELECT * FROM coin_claims WHERE status='pending' ORDER BY created_at ASC LIMIT 100`
        return corsResponse({ claims: rows })
      } catch (e2) { console.error('coins admin claims 懒建表后重试失败:', e2) }
    }
    console.error('coins admin claims 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
