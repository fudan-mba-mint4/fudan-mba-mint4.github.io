// 薄荷币 · 贡献申报 - POST /api/coins/claims（登录全员）
// 默认本人按规则奖励币；班委（role 非空）可带获币名单批量申报（活动奖励由组织者统一提交，不重复计）。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireLogin,
  ensureTables, isMissingTableError, isViewerOnly, VIEWER_ONLY_MSG,
} from '../../_utils.js'
import { newId, COIN_CONFIG } from '../../_coins.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  // 班主任 / 传承人仅可查看，不能参与薄荷币申报
  if (isViewerOnly(auth.user)) return corsResponse({ error: VIEWER_ONLY_MSG }, 403)
  try {
    return await handleCreate(request, env, auth.user)
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        return await handleCreate(request, env, auth.user)
      } catch (e2) { console.error('coins claims 懒建表后重试失败:', e2) }
    }
    console.error('coins claims 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleCreate(request, env, user) {
  const sql = getSql(env)
  const body = await parseBody(request)

  const ruleId = String(body.ruleId || '').trim()
  const rule = (await sql`SELECT * FROM coin_rules WHERE id=${ruleId} AND status=1 LIMIT 1`)[0]
  if (!rule) return corsResponse({ error: '请选择有效的奖励规则' }, 400)

  const title = String(body.title || '').trim()
  if (!title) return corsResponse({ error: '请填写申报标题' }, 400)
  if (title.length > COIN_CONFIG.titleLimit)
    return corsResponse({ error: `标题过长（最多 ${COIN_CONFIG.titleLimit} 字）` }, 400)
  const description = String(body.description || '').trim().slice(0, COIN_CONFIG.descLimit)
  const activityId = body.activityId ? String(body.activityId) : null
  const proofs = Array.isArray(body.proofs)
    ? body.proofs
        .filter(u => typeof u === 'string' && /^https:\/\/files\.mint4\.cn\//.test(u))
        .slice(0, COIN_CONFIG.maxProofs)
    : []

  // 获币名单：默认本人（规则单次奖励）；班委可带名单批量申报
  let recipients
  if (Array.isArray(body.recipients) && body.recipients.length) {
    if (!user.role) return corsResponse({ error: '批量申报需班委账号（活动奖励由组织者统一提交）' }, 403)
    const list = body.recipients.slice(0, 20)
    const userIds = list.map(r => Number(r.userId)).filter(n => Number.isInteger(n) && n > 0)
    if (!userIds.length) return corsResponse({ error: '获币名单无效' }, 400)
    const rows = await sql.unsafe(
      `SELECT id, name FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`, userIds)
    const byId = Object.fromEntries(rows.map(r => [r.id, r]))
    recipients = list.map(r => {
      const u = byId[Number(r.userId)]
      if (!u) return null
      const amount = Math.max(0, Math.floor(Number(r.amount) || 0))
      if (!amount) return null
      return { userId: u.id, name: u.name, amount }
    }).filter(Boolean)
    if (!recipients.length) return corsResponse({ error: '名单中无人可入账（用户不存在或币数无效）' }, 400)
  } else {
    recipients = [{ userId: user.id, name: user.name, amount: rule.amount }]
  }

  const total = recipients.reduce((s, r) => s + r.amount, 0)
  const id = newId('claim')
  await sql`
    INSERT INTO coin_claims (id, user_id, applicant, rule_id, title, description, activity_id, proofs, recipients, total, status)
    VALUES (${id}, ${user.id}, ${user.name}, ${rule.id}, ${title}, ${description}, ${activityId},
      ${JSON.stringify(proofs)}, ${JSON.stringify(recipients)}, ${total}, 'pending')`
  return corsResponse({ message: '申报已提交，等待班委审核', id, total }, 201)
}
