// 报销会计审核 v2 - POST /api/admin/finance/reimbursements/[id]/audit
// 仅会计（程枭）可操作：
//   action: approve 审核通过 → approved（进入出纳待付款）
//         | revision 退回补正 → need_revision（申请人可修改重提）
//         | reject 驳回 → rejected（终止）
// body: { action, note? }
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, isMissingTableError, ensureTables } from '../../../../../../_utils.js'
import { getFinanceRoles, isAccountant } from '../../../../../../_finance.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const roles = await getFinanceRoles(env)
    if (!isAccountant(auth.user, roles)) return corsResponse({ error: '仅会计可审核报销' }, 403)

    const id = params.id
    let rows
    try {
      rows = await sql`SELECT * FROM reimbursements WHERE id = ${id} LIMIT 1`
    } catch (e) {
      if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM reimbursements WHERE id = ${id} LIMIT 1` }
      else throw e
    }
    const rb = rows[0]
    if (!rb) return corsResponse({ error: '未找到该报销单' }, 404)

    const { action, note = '' } = await parseBody(request)
    const nowIso = new Date().toISOString()

    if (action === 'reject') {
      if (rb.status !== 'submitted') return corsResponse({ error: '仅待审核的报销可驳回' }, 400)
      await sql`UPDATE reimbursements SET status = 'rejected', audit_by = ${auth.user.name}, audit_at = ${nowIso}, audit_note = ${String(note).slice(0, 300)} WHERE id = ${id}`
      await logHistory(sql, { type: 'finance', action: 'reject', refId: id,
        description: `驳回报销：${rb.description || rb.id}${note ? '（' + String(note).slice(0, 100) + '）' : ''}`, operator: auth.user.name })
      return corsResponse({ message: '已驳回该报销', status: 'rejected' })
    }

    if (action === 'revision') {
      if (rb.status !== 'submitted') return corsResponse({ error: '仅待审核的报销可退回补正' }, 400)
      await sql`UPDATE reimbursements SET status = 'need_revision', audit_by = ${auth.user.name}, audit_at = ${nowIso}, audit_note = ${String(note).slice(0, 300)} WHERE id = ${id}`
      await logHistory(sql, { type: 'finance', action: 'revision', refId: id,
        description: `退回补正报销：${rb.description || rb.id}${note ? '（' + String(note).slice(0, 100) + '）' : ''}`, operator: auth.user.name })
      return corsResponse({ message: '已退回补正，等待申请人修改重提', status: 'need_revision' })
    }

    if (action === 'approve') {
      if (rb.status !== 'submitted') return corsResponse({ error: '仅待审核的报销可通过' }, 400)
      await sql`UPDATE reimbursements SET status = 'approved', audit_by = ${auth.user.name}, audit_at = ${nowIso}, audit_note = ${String(note).slice(0, 300)} WHERE id = ${id}`
      await logHistory(sql, { type: 'finance', action: 'approve', refId: id,
        description: `审核通过报销：${rb.description || rb.id}`, operator: auth.user.name })
      return corsResponse({ message: '已审核通过，等待出纳打款', status: 'approved' })
    }

    return corsResponse({ error: '未知操作' }, 400)
  } catch (err) {
    console.error('admin/finance/reimbursements/audit 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
