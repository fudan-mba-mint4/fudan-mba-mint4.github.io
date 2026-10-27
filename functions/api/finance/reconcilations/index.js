// 小荷包对账记录 - /api/finance/reconcilations
// GET：公开返回对账记录列表（账实比对的阳光公示内容）
// POST：仅出纳（李浩鹏）登记对账/收款，可关联预算公示与报销单
// body: { date, actualBalance, note?, proposalId?, reimbursementId? }
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, isMissingTableError, ensureTables, logHistory } from '../../../_utils.js'
import { getFinanceRoles, isCashier, newId } from '../../../_finance.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  try {
    const sql = getSql(env)
    const auth = await requireLogin(request, env)
    if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

    if (request.method === 'GET') {
      let rows
      try {
        rows = await sql`SELECT * FROM reconcilations ORDER BY date DESC, created_at DESC`
      } catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM reconcilations ORDER BY date DESC, created_at DESC` }
        else throw e
      }
      const out = rows.map(r => ({
        id: r.id, date: r.date, actualBalance: r.actual_balance,
        note: r.note || '', proposalId: r.proposal_id, reimbursementId: r.reimbursement_id,
        createdBy: r.created_by || '', createdAt: r.created_at,
      }))
      return corsResponse({ reconcilations: out })
    }

    if (request.method === 'POST') {
      const roles = await getFinanceRoles(env)
      if (!isCashier(auth.user, roles)) return corsResponse({ error: '仅出纳可登记对账' }, 403)
      const body = await parseBody(request)
      if (!body.date) return corsResponse({ error: '请选择对账日期' }, 400)
      const bal = Number(body.actualBalance)
      if (Number.isNaN(bal)) return corsResponse({ error: '请填写小荷包实际余额' }, 400)

      const proposalId = body.proposalId ? String(body.proposalId) : null
      const reimbursementId = body.reimbursementId ? String(body.reimbursementId) : null
      // 关联校验：必须真实存在
      if (proposalId) {
        const p = await sql`SELECT id FROM budget_proposals WHERE id = ${proposalId} LIMIT 1`
        if (!p[0]) return corsResponse({ error: '关联的预算公示不存在' }, 400)
      }
      if (reimbursementId) {
        const r = await sql`SELECT id FROM reimbursements WHERE id = ${reimbursementId} LIMIT 1`
        if (!r[0]) return corsResponse({ error: '关联的报销单不存在' }, 400)
      }

      const id = newId('rc')
      try {
        await sql`
          INSERT INTO reconcilations (id, date, actual_balance, note, proposal_id, reimbursement_id, created_by)
          VALUES (${id}, ${body.date}, ${bal}, ${String(body.note || '').slice(0, 300)}, ${proposalId}, ${reimbursementId}, ${auth.user.name})
        `
      } catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); await sql`
          INSERT INTO reconcilations (id, date, actual_balance, note, proposal_id, reimbursement_id, created_by)
          VALUES (${id}, ${body.date}, ${bal}, ${String(body.note || '').slice(0, 300)}, ${proposalId}, ${reimbursementId}, ${auth.user.name})
        ` }
        else throw e
      }
      await logHistory(sql, { type: 'finance', action: 'reconcile', refId: id,
        description: `登记小荷包对账：余额 ¥${bal}${proposalId ? '，关联公示' + proposalId : ''}${reimbursementId ? '，关联报销' + reimbursementId : ''}`, operator: auth.user.name })
      return corsResponse({ message: '对账记录已登记', id }, 201)
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('finance reconcilations 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
