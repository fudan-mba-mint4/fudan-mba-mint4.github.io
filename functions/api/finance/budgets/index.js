// 预算公示 v2（前台） - /api/finance/budgets
// GET：公开公示列表（open/passed/rejected/spent/cancelled）+ 投票聚合；
//      ?mine=1 额外返回当前登录人自己提交的 submitted/returned（未公开的只本人可见）。
//      GET 时惰性自动结算：open 且超过公示结束时间 → 自动出结果（反对≥1/3 → rejected，否则 passed）并通知程枭。
// POST：全体登录同学发起预算公示（提交后进入「待审批」，程枭审核后公开）
//   body: { title, amount, groupName, eventType, activityType, payTarget, detailItems[], redlines{r1,r2,r3},
//           contact?, description?, activityId? }
//   预算控制（按《班费管理制度 v7》）：金额>0；红线三项必须确认；明细分类带 ⚠️ 提示（餐饮/住宿类严禁班费）
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, notify, isMissingTableError, ensureTables, isViewerOnly, VIEWER_ONLY_MSG } from '../../../_utils.js'
import { getFinanceRoles, getFinanceConfig, newId, voteStats, anonymousReasons, nextProposalNo, BUDGET_STATUS } from '../../../_finance.js'
import { purgePublicCache } from '../../../_cache.js'

export const GROUP_OPTIONS = ['体验组', '记忆组', '学术组', '生活组', '财务组', '其他项目组']
export const EVENT_TYPE_OPTIONS = ['常规事项（例行性、可预见）', '非常规事项（临时发生、额外增加）']
export const ACTIVITY_TYPE_OPTIONS = [
  '纯会务/赋能类（讲座、分享、企业参访等）',
  '联谊/凝聚类（聚餐、旅行、团建、聚劲周等）',
  '日常运营类（常规宣传物料、班级公共用品、教师慰问等，无需填写具体活动）',
]
export const PAY_TARGET_OPTIONS = ['淘宝商家', '场地租赁方', '个人垫付报销', '其他']
export const FEE_CATEGORY_OPTIONS = [
  '宣传与文化建设', '场地与设备租赁', '交通与差旅', '餐饮与茶歇（⚠️聚餐正餐严禁填入）',
  '住宿费（⚠️聚餐旅行严禁填入）', '门票与报名费', '纪念品与奖品', '班级关怀与慰问',
  '嘉宾接待与讲师费', '学习资料与打印', '活动道具与物料', '公共设备与图书',
  '软件与工具订阅', '保险与医疗物资', '其他额外支出',
]

// 惰性自动结算：open 且已过 expose_end → 结算出结果（反对≥1/3 → rejected 否则 passed），通知程枭
export async function autoSettleExpired(sql, env, config) {
  let settled = []
  try {
    const rows = await sql`SELECT * FROM budget_proposals WHERE status = 'open'`
    const now = Date.now()
    for (const p of rows) {
      const end = p.expose_end ? new Date(p.expose_end).getTime() : 0
      if (!end || now < end) continue
      const votes = await sql`SELECT choice FROM budget_votes WHERE proposal_id = ${p.id}`
      const stats = voteStats(votes, config)
      const status = stats.vetoed ? BUDGET_STATUS.REJECTED : BUDGET_STATUS.PASSED
      await sql`UPDATE budget_proposals SET status = ${status}, settled_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ${p.id}`
      await logHistory(sql, { type: 'finance', action: 'settle', refId: p.id,
        description: `结算预算公示：${p.title}（反对 ${stats.againstCount}/${config.classSize}，${stats.vetoed ? '否决' : '通过'}）`, operator: 'system' })
      await notify(sql, { type: 'finance', title: stats.vetoed ? '预算被否决' : '预算已通过',
        body: `${p.title}：赞成 ${stats.forCount}、反对 ${stats.againstCount} 人（${(stats.ratio * 100).toFixed(1)}%），${stats.vetoed ? '反对达 ' + config.vetoCount + ' 票，不可动用班费' : '可按预算执行，报销时可关联本公示'}`,
        modulePath: '/finance/budgets/', operator: 'system' })
      settled.push({ id: p.id, status })
    }
  } catch (e) {
    console.warn('autoSettleExpired 失败:', e?.message || e)
  }
  return settled
}

function parseItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter(i => i && ((i.item && String(i.item).trim()) || Number(i.amount) > 0))
    .map(i => ({
      item: String(i.item || '').trim().slice(0, 100),
      qty: Number(i.qty) || 1,
      unitPrice: Number(i.unitPrice) || 0,
      amount: Number(i.amount) || 0,
      category: String(i.category || '').slice(0, 50),
      note: String(i.note || '').slice(0, 200),
    }))
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (isViewerOnly(auth.user)) return corsResponse({ error: VIEWER_ONLY_MSG }, 403)

  try {
    const sql = getSql(env)
    const config = await getFinanceConfig(env)
    const roles = await getFinanceRoles(env)

    if (request.method === 'GET') {
      const url = new URL(request.url)
      const mineOnly = url.searchParams.get('mine') === '1'
      await autoSettleExpired(sql, env, config)
      await purgePublicCache('finance-v2-public')

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

      const list = budgets.filter(b => {
        if (mineOnly) return String(b.applicant_id || '') === String(auth.user.id) || String(b.created_by || '') === auth.user.name
        return !['submitted', 'returned'].includes(b.status)
      })
      const out = list.map(b => {
        let items = []
        try { items = JSON.parse(b.detail_items || '[]') } catch (e) {}
        const vlist = voteMap[b.id] || []
        const stats = voteStats(vlist, config)
        let redlines = {}
        try { redlines = JSON.parse(b.redlines || '{}') } catch (e) {}
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
      return corsResponse({ budgets: out })
    }

    if (request.method === 'POST') {
      const body = await parseBody(request)
      if (!body.title || !String(body.title).trim()) return corsResponse({ error: '请填写活动/事项名称' }, 400)
      const amount = Number(body.amount)
      if (!amount || amount <= 0) return corsResponse({ error: '预算总上限金额需大于 0' }, 400)
      if (!GROUP_OPTIONS.includes(body.groupName)) return corsResponse({ error: '请选择申请小组/部门' }, 400)
      if (!EVENT_TYPE_OPTIONS.includes(body.eventType)) return corsResponse({ error: '请选择事项性质' }, 400)
      if (!ACTIVITY_TYPE_OPTIONS.includes(body.activityType)) return corsResponse({ error: '请选择活动类型' }, 400)
      if (!PAY_TARGET_OPTIONS.includes(body.payTarget)) return corsResponse({ error: '请选择资金支付对象' }, 400)

      // 财务红线核对：三项必须全部确认
      const redlines = {
        r1: body.redlines?.r1 === true, r2: body.redlines?.r2 === true, r3: body.redlines?.r3 === true,
      }
      if (!redlines.r1 || !redlines.r2 || !redlines.r3) {
        return corsResponse({ error: '请逐项确认财务红线核对（3 项均为「已确认」才能提交）' }, 400)
      }
      // 明细中若出现聚餐正餐/旅行住宿类费用分类 → 硬性拦截（班费管理制度：此类费用由参加人 AA，严禁使用班费）
      const items = parseItems(body.detailItems)
      if (items.length === 0) return corsResponse({ error: '请填写至少一条预算明细' }, 400)
      const bannedCat = items.find(i => /餐饮与茶歇|住宿费/.test(i.category || ''))
      if (bannedCat) {
        return corsResponse({ error: `明细分类「${bannedCat.category}」属于聚餐/旅行类费用，由参加人 AA，严禁使用班费，请删除该行或改分类` }, 400)
      }
      const itemsTotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
      if (itemsTotal > amount * 1.000001) {
        return corsResponse({ error: `明细合计 ¥${itemsTotal.toFixed(2)} 超过预算上限 ¥${amount.toFixed(2)}，请调整` }, 400)
      }

      const id = newId('bp')
      try {
        await sql`
          INSERT INTO budget_proposals (id, activity_id, title, description, detail_items, amount, proposer, proposer_id, applicant_id, group_name, contact, event_type, activity_type, pay_target, redlines, status, created_by)
          VALUES (${id}, ${body.activityId || null}, ${String(body.title).trim()}, ${String(body.description || '')}, ${JSON.stringify(items)}, ${amount}, ${String(body.proposer || auth.user.name)}, ${auth.user.id}, ${String(auth.user.id)}, ${body.groupName}, ${String(body.contact || '')}, ${body.eventType}, ${body.activityType}, ${body.payTarget}, ${JSON.stringify(redlines)}, 'submitted', ${auth.user.name})
        `
      } catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); await sql`
          INSERT INTO budget_proposals (id, activity_id, title, description, detail_items, amount, proposer, proposer_id, applicant_id, group_name, contact, event_type, activity_type, pay_target, redlines, status, created_by)
          VALUES (${id}, ${body.activityId || null}, ${String(body.title).trim()}, ${String(body.description || '')}, ${JSON.stringify(items)}, ${amount}, ${String(body.proposer || auth.user.name)}, ${auth.user.id}, ${String(auth.user.id)}, ${body.groupName}, ${body.eventType}, ${body.activityType}, ${body.payTarget}, ${JSON.stringify(redlines)}, 'submitted', ${auth.user.name})
        ` }
        else throw e
      }

      await logHistory(sql, { type: 'finance', action: 'submit', refId: id,
        description: `提交预算公示（待审批）：${String(body.title).trim()}`, operator: auth.user.name })
      await notify(sql, { type: 'finance', title: '新的预算公示待审批',
        body: `${auth.user.name} 提交了预算公示「${String(body.title).trim()}」（¥${amount}），请到财务后台审核资料并公开`, modulePath: '/admin/', operator: auth.user.name })
      await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '预算公示已提交，待会计（程枭）审核', id }, 201)
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('finance/budgets 错误:', err)
    await purgePublicCache('finance-v2-public')
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
