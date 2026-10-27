// 报销出纳付款 v2 - POST /api/admin/finance/reimbursements/[id]/pay
// 仅出纳（李浩鹏）可操作：小荷包实际打款后确认，生成支出流水入账公示
// 硬约束：审核人与付款人不得为同一人（钱账分离）
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, notify, isMissingTableError, ensureTables } from '../../../../../../_utils.js'
import { getFinanceRoles, isCashier, newId, nextVoucherNo } from '../../../../../../_finance.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const roles = await getFinanceRoles(env)
    if (!isCashier(auth.user, roles)) return corsResponse({ error: '仅出纳可确认付款' }, 403)

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
    if (rb.status !== 'approved') return corsResponse({ error: '请先由会计审核通过，再确认打款' }, 400)
    if (rb.audit_by === auth.user.name) return corsResponse({ error: '钱账分离：审核人不能同时执行付款' }, 403)

    const nowIso = new Date().toISOString()
    let vouchers = []
    try { vouchers = JSON.parse(rb.vouchers || '[]') } catch (e) {}
    let endorsement = null
    try { endorsement = JSON.parse(rb.endorsement || 'null') } catch (e) {}

    // 生成支出流水（自动分配可读凭证编号 FT-YYYY-NNN，入账公示）
    const txId = newId('ft')
    const voucherNo = await nextVoucherNo(sql)
    const txDate = rb.expense_date || nowIso.slice(0, 10)
    await sql`
      INSERT INTO finance_tx (id, voucher_no, date, type, category, amount, description, activity_id, proposal_id, reimbursement_id, vouchers, handler, checker)
      VALUES (${txId}, ${voucherNo}, ${txDate}, 'expense', ${rb.category || 'other'}, ${rb.amount}, ${String(rb.description || '报销支出')}, ${rb.activity_id || null}, ${rb.proposal_id || null}, ${rb.id}, ${JSON.stringify(vouchers)}, ${rb.applicant}, ${rb.audit_by || '财务'})
    `
    await sql`UPDATE reimbursements SET status = 'paid', paid_by = ${auth.user.name}, paid_at = ${nowIso} WHERE id = ${id}`
    await logHistory(sql, { type: 'finance', action: 'pay', refId: id,
      description: `确认支付报销：${rb.description || rb.id}（¥${rb.amount}，凭证号 ${voucherNo}）`, operator: auth.user.name })
    await notify(sql, { type: 'finance', title: '报销已支付',
      body: `${rb.description || rb.id}（¥${rb.amount}）已由出纳确认打款，流水凭证号 ${voucherNo}`, modulePath: '/finance/', operator: auth.user.name })
    return corsResponse({ message: '已确认打款并生成支出流水', status: 'paid', txId, voucherNo })
  } catch (err) {
    console.error('admin/finance/reimbursements/pay 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
