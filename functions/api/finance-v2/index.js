// 财务公开 API V2 - GET /api/finance-v2
// 返回结构化班费数据（供 /finance/ 新版四 Tab + 财务工作台）：
// {
//   transactions: finance_tx 全量（公开，含凭证编号/凭证/经手人/复核人/余额由前端累计）,
//   budgets: 预算公示列表（公开；赞成数/反对数/未表态/反对率/红线 + 匿名反对留言，不含票向）,
//   reimbursements: 登录用户=本人；财务角色=全部；未登录=[],
//   reconcilations: 对账记录（公开）,
//   myVotes: 当前用户投票记录 {proposalId: choice},
//   workbench: 财务角色的待办队列计数（待审/待付款）,
//   isAccountant / isCashier / isFinanceStaff / isSupervisor：当前登录人财务身份,
//   config: 参数（分母/红线/阈值/预警线/时限/期初）, now: 服务端时间
// }
import { getSql, corsResponse, optionsResponse, getAuthUser, ensureTables, isMissingTableError } from '../../_utils.js'
import { getFinanceConfig, getFinanceRoles, isAccountant, isCashier, isFinanceSupervisor, isFinanceStaff, voteStats, anonymousReasons } from '../../_finance.js'

function mapBudget(row) {
  let items = []
  try { items = JSON.parse(row.detail_items || '[]') } catch (e) {}
  return {
    id: row.id, activityId: row.activity_id, title: row.title,
    description: row.description || '', detailItems: items,
    amount: row.amount, proposer: row.proposer || '',
    exposeType: row.expose_type || 'normal',
    status: row.status, exposeStart: row.expose_start, exposeEnd: row.expose_end,
    createdAt: row.created_at, settledAt: row.settled_at,
  }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)
  try {
    const sql = getSql(env)
    let tx, budgets, reimb, votes, reconciles
    try {
      tx = await sql`SELECT * FROM finance_tx ORDER BY date DESC, id DESC`
      budgets = await sql`SELECT * FROM budget_proposals ORDER BY created_at DESC`
      reimb = await sql`SELECT * FROM reimbursements ORDER BY created_at DESC`
      votes = await sql`SELECT proposal_id, user_id, choice, reason, created_at FROM budget_votes`
      reconciles = await sql`SELECT * FROM reconcilations ORDER BY date DESC, created_at DESC`
    } catch (e) {
      if (isMissingTableError(e)) {
        await ensureTables(env)
        tx = await sql`SELECT * FROM finance_tx ORDER BY date DESC, id DESC`
        budgets = await sql`SELECT * FROM budget_proposals ORDER BY created_at DESC`
        reimb = await sql`SELECT * FROM reimbursements ORDER BY created_at DESC`
        votes = await sql`SELECT proposal_id, user_id, choice, reason, created_at FROM budget_votes`
        reconciles = await sql`SELECT * FROM reconcilations ORDER BY date DESC, created_at DESC`
      } else throw e
    }

    const config = await getFinanceConfig(env)
    const roles = await getFinanceRoles(env)

    const transactions = tx.map(r => ({
      id: r.id, voucherNo: r.voucher_no || '', date: r.date, type: r.type, category: r.category, amount: r.amount,
      description: r.description, activityId: r.activity_id,
      proposalId: r.proposal_id, reimbursementId: r.reimbursement_id,
      items: (() => { try { return JSON.parse(r.items || '[]') } catch (e) { return [] } })(),
      vouchers: (() => { try { return JSON.parse(r.vouchers || '[]') } catch (e) { return [] } })(),
      handler: r.handler || '', checker: r.checker || '', createdAt: r.created_at,
    }))

    // 预算聚合：赞成/反对/未表态 + 匿名反对留言（公开不含投票人）
    const voteMap = {}
    votes.forEach(v => {
      if (!voteMap[v.proposal_id]) voteMap[v.proposal_id] = []
      voteMap[v.proposal_id].push(v)
    })
    const budgetsOut = budgets.map(b => {
      const p = mapBudget(b)
      const vlist = voteMap[b.id] || []
      const stats = voteStats(vlist, config)
      p.forCount = stats.forCount
      p.againstCount = stats.againstCount
      p.uncommitted = stats.uncommitted
      p.total = stats.total
      p.ratio = stats.ratio
      p.vetoed = stats.vetoed
      p.vetoCount = config.vetoCount
      p.reasons = anonymousReasons(vlist)   // 匿名反对留言 [{reason, createdAt}]
      return p
    })

    const auth = await getAuthUser(request, sql)
    let myVotes = {}
    let reimbursements = []
    if (auth) {
      const mv = await sql`SELECT proposal_id, choice FROM budget_votes WHERE user_id = ${auth.id}`
      myVotes = {}
      mv.forEach(r => { myVotes[r.proposal_id] = r.choice })
      if (isFinanceStaff(auth, roles)) {
        reimbursements = reimb
      } else {
        reimbursements = reimb.filter(r => r.applicant_id === auth.id)
      }
    }
    const parseVouchers = (v) => { try { return JSON.parse(v || '[]') } catch (e) { return [] } }
    const reimbursementsOut = reimbursements.map(r => ({
      id: r.id, proposalId: r.proposal_id, activityId: r.activity_id,
      applicant: r.applicant, expenseDate: r.expense_date, amount: r.amount,
      category: r.category, description: r.description || '',
      vouchers: parseVouchers(r.vouchers),
      endorsement: (() => { try { return JSON.parse(r.endorsement || 'null') } catch (e) { return null } })(),
      status: r.status,
      auditBy: r.audit_by || '', auditAt: r.audit_at || '', auditNote: r.audit_note || '',
      paidBy: r.paid_by || '', paidAt: r.paid_at || '', createdAt: r.created_at,
    }))

    const reconcilationsOut = reconciles.map(r => ({
      id: r.id, date: r.date, actualBalance: r.actual_balance,
      note: r.note || '', proposalId: r.proposal_id, reimbursementId: r.reimbursement_id,
      createdBy: r.created_by || '', createdAt: r.created_at,
    }))

    // 财务工作台队列计数（按当前登录人角色）
    const pendingAudit = reimbursementsOut.filter(r => r.status === 'submitted').length
    const pendingPay = reimbursementsOut.filter(r => r.status === 'approved').length

    return corsResponse({
      transactions,
      budgets: budgetsOut,
      reimbursements: reimbursementsOut,
      reconcilations: reconcilationsOut,
      canViewAllReimb: !!(auth && isFinanceStaff(auth, roles)),
      myVotes,
      workbench: {
        pendingAudit, pendingPay,
        isAccountant: !!(auth && isAccountant(auth, roles)),
        isCashier: !!(auth && isCashier(auth, roles)),
        isSupervisor: !!(auth && isFinanceSupervisor(auth, roles)),
        isFinanceStaff: !!(auth && isFinanceStaff(auth, roles)),
      },
      config,
      now: new Date().toISOString(),
    })
  } catch (err) {
    console.error('finance-v2 API 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
