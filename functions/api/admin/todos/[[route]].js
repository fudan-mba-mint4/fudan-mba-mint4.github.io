// 后台待办红点计数
// GET /api/admin/todos：按当前班委可见模块返回各模块「未处理事项」计数（口径=凡需班委处理的事项）
//  - activities: 待排期活动数（status=planning）
//  - finance: 待审批报销（submitted）＋ 待打款报销（approved）＋ 待审批公示（budget_proposals.submitted）＋ 公示将到期数（open 且 24h 内到期）
//  - coins: 待审核申报数（coin_claims.pending），仅薄荷币可见角色
// 仅登录且是班委可读；可见范围与前端 MODULE_ROLE_MAP / _utils.js MODULE_ROLES 保持一致
import { getSql, corsResponse, optionsResponse, requireCommittee, COMMITTEE_ROLES, MODULE_ROLES, COIN_AUDITORS } from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireCommittee(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    const { role, name } = auth.user

    // 1. 可见模块（与前端 visibleTypes 同规则）
    let visible = new Set()
    if (role === 'leader' || role === 'deputy' || role === 'supervisor') {
      visible = new Set(Object.keys(MODULE_ROLES))
    } else {
      for (const [mod, roles] of Object.entries(MODULE_ROLES)) {
        if (roles.includes(role)) visible.add(mod)
      }
      if (COIN_AUDITORS.includes(name)) visible.add('coins')
    }

    const todos = { activities: 0, finance: 0, coins: 0 }

    if (visible.has('activities')) {
      const rows = await sql`SELECT COUNT(*) AS c FROM activities WHERE status='planning'`
      todos.activities = Number(rows[0]?.c || 0)
    }

    if (visible.has('finance')) {
      // 待审批报销（会计程枭）+ 待打款报销（出纳李浩鹏）
      const reimb = await sql`
        SELECT COUNT(*) AS c FROM reimbursements
        WHERE status IN ('submitted','approved')
      `
      // 待审批公示（会计程枭审批公开）
      const budgetsPending = await sql`
        SELECT COUNT(*) AS c FROM budget_proposals WHERE status='submitted'
      `
      // 公示将到期（open 且 24h 内，需投票/结算）
      const expiring = await sql`
        SELECT COUNT(*) AS c FROM budget_proposals
        WHERE status='open' AND expose_end IS NOT NULL
          AND expose_end >= strftime('%Y-%m-%dT%H:%M:%fZ','now')
          AND expose_end <= strftime('%Y-%m-%dT%H:%M:%fZ','now','+1 day')
      `
      todos.finance = Number(reimb[0]?.c || 0) + Number(budgetsPending[0]?.c || 0) + Number(expiring[0]?.c || 0)
    }

    if (visible.has('coins')) {
      const claims = await sql`SELECT COUNT(*) AS c FROM coin_claims WHERE status='pending'`
      todos.coins = Number(claims[0]?.c || 0)
    }

    return corsResponse({ todos }, 200)
  } catch (e) {
    return corsResponse({ error: '加载待办计数失败: ' + e.message }, 500)
  }
}
