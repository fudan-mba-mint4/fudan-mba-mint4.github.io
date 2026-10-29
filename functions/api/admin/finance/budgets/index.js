// 预算公示管理 v2 - /api/admin/finance/budgets
// POST：发布预算公示（仅会计程枭；支持紧急·事后补公示）
//   body: { title, description?, amount, detailItems?, activityId?, category?, exposeDays?, exposeType?('normal'|'emergency'), approvalNote? }
// GET：全部公示 + v2 投票聚合（赞成/反对/未表态/红线 + 匿名反对留言；票向明细仅监督视图提供）
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, notify, isMissingTableError, ensureTables } from '../../../../_utils.js'
import { getFinanceRoles, isAccountant, getFinanceConfig, FINANCE_CATEGORIES, newId, voteStats, anonymousReasons } from '../../../../_finance.js'
import { purgePublicCache } from '../../../../_cache.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    const roles = await getFinanceRoles(env)
    const config = await getFinanceConfig(env)

    if (request.method === 'GET') {
      let budgets, votes
      try {
        budgets = await sql`SELECT * FROM budget_proposals ORDER BY created_at DESC`
        votes = await sql`SELECT proposal_id, user_id, choice, reason, created_at FROM budget_votes`
      } catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); budgets = await sql`SELECT * FROM budget_proposals ORDER BY created_at DESC`; votes = await sql`SELECT proposal_id, user_id, choice, reason, created_at FROM budget_votes` }
        else throw e
      }
      const voteMap = {}
      votes.forEach(v => {
        if (!voteMap[v.proposal_id]) voteMap[v.proposal_id] = []
        voteMap[v.proposal_id].push(v)
      })
      const out = budgets.filter(b => b.status !== 'draft').map(b => {
        let items = []
        try { items = JSON.parse(b.detail_items || '[]') } catch (e) {}
        let redlines = {}
        try { redlines = JSON.parse(b.redlines || '{}') } catch (e) {}
        const vlist = voteMap[b.id] || []
        const stats = voteStats(vlist, config)
        return {
          id: b.id, proposalNo: b.proposal_no || '', activityId: b.activity_id, title: b.title,
          description: b.description || '', detailItems: items, amount: b.amount,
          proposer: b.proposer || '', groupName: b.group_name || '', contact: b.contact || '',
          eventType: b.event_type || '', activityType: b.activity_type || '', payTarget: b.pay_target || '',
          redlines, returnedReason: b.returned_reason || '',
          applicantId: b.applicant_id || '', createdBy: b.created_by || '',
          exposeType: b.expose_type || 'normal',
          status: b.status, exposeStart: b.expose_start, exposeEnd: b.expose_end,
          createdAt: b.created_at, settledAt: b.settled_at,
          forCount: stats.forCount, againstCount: stats.againstCount,
          uncommitted: stats.uncommitted, total: stats.total,
          ratio: stats.ratio, vetoed: stats.vetoed,
          vetoCount: config.vetoCount, classSize: config.classSize,
          reasons: anonymousReasons(vlist),
        }
      })
      return corsResponse({ budgets: out, config })
    }

    if (request.method === 'POST') {
      if (!isAccountant(auth.user, roles)) return corsResponse({ error: '仅会计可发布紧急补公示' }, 403)
      const body = await parseBody(request)
      // v2 流程：常规公示由前台任何注册同学发起 → 会计审核后公开；此处仅保留「紧急·事后补公示」能力
      if (body.exposeType !== 'emergency') {
        return corsResponse({ error: '常规预算公示请在「预算公示」页由同学发起提交，会计审核资料后公开；此处仅用于紧急·事后补公示' }, 400)
      }
      if (!body.title || !String(body.title).trim()) return corsResponse({ error: '请填写公示标题（事项）' }, 400)
      const amount = Number(body.amount)
      if (!amount || amount <= 0) return corsResponse({ error: '预算上限需大于 0' }, 400)
      let items = Array.isArray(body.detailItems) ? body.detailItems : []
      items = items.filter(i => i && (i.item || i.amount)).map(i => ({ item: String(i.item || '').slice(0, 100), amount: Number(i.amount) || 0 }))
      if (body.category && !FINANCE_CATEGORIES.includes(body.category)) return corsResponse({ error: '无效的支出大类' }, 400)

      const exposeType = body.exposeType === 'emergency' ? 'emergency' : 'normal'
      const days = Math.max(1, Number(body.exposeDays) || config.exposeDays)
      const id = newId('bp')
      const now = new Date()
      const exposeStart = now.toISOString()
      const exposeEnd = new Date(now.getTime() + days * 86400000).toISOString()
      // 紧急补公示：记录班委会 2/3 同意结果（线下过程，仅记录结果）
      const approvalNote = exposeType === 'emergency' ? String(body.approvalNote || '').slice(0, 200) : ''

      try {
        await sql`
          INSERT INTO budget_proposals (id, activity_id, title, description, detail_items, amount, proposer, proposer_id, expose_type, status, expose_start, expose_end, created_by)
          VALUES (${id}, ${body.activityId || null}, ${String(body.title).trim()}, ${String(body.description || '')}, ${JSON.stringify(items)}, ${amount}, ${String(body.proposer || auth.user.name)}, ${auth.user.id}, ${exposeType}, 'open', ${exposeStart}, ${exposeEnd}, ${auth.user.name})
        `
      } catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); await sql`
          INSERT INTO budget_proposals (id, activity_id, title, description, detail_items, amount, proposer, proposer_id, expose_type, status, expose_start, expose_end, created_by)
          VALUES (${id}, ${body.activityId || null}, ${String(body.title).trim()}, ${String(body.description || '')}, ${JSON.stringify(items)}, ${amount}, ${String(body.proposer || auth.user.name)}, ${auth.user.id}, ${exposeType}, 'open', ${exposeStart}, ${exposeEnd}, ${auth.user.name})
        ` }
        else throw e
      }

      await logHistory(sql, { type: 'finance', action: 'publish', refId: id,
        description: `发布预算公示${exposeType === 'emergency' ? '（紧急·事后补公示）' : ''}：${String(body.title).trim()}`, operator: auth.user.name })
      await notify(sql, { type: 'finance', title: exposeType === 'emergency' ? '紧急支出补公示' : '班费预算公示',
        body: `${String(body.title).trim()}（预算上限 ¥${amount}）${exposeType === 'emergency' ? '【紧急·事后补公示】' : ''}公示 ${days} 日，请到财务页登录投票`, modulePath: '/finance/', operator: auth.user.name })
    await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '预算公示已发布', id, exposeEnd, exposeType }, 201)
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/finance/budgets 错误:', err)
    await purgePublicCache('finance-v2-public')
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
