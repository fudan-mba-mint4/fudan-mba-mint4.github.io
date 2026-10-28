// 薄荷币 · 个人中心 - GET /api/coins/me（登录）
// 返回：账户（余额/累计/成长标识）+ 本人明细 + 我的申报 + 可用规则。
// 首次访问懒建账户（老用户注册可得初始 1 币，幂等）。
import {
  getSql, corsResponse, optionsResponse, requireLogin,
  ensureTables, isMissingTableError,
} from '../../_utils.js'
import { COIN_CONFIG, growthTierOf, GROWTH_TIERS } from '../../_coins.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  try {
    return await handleMe(env, auth.user)
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        return await handleMe(env, auth.user)
      } catch (e2) { console.error('coins me 懒建表后重试失败:', e2) }
    }
    console.error('coins me 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleMe(env, user) {
  const sql = getSql(env)
  // 懒建账户（幂等）
  await sql`INSERT OR IGNORE INTO coin_accounts (user_id, balance) VALUES (${user.id}, ${COIN_CONFIG.initialBalance})`
  const acc = (await sql`SELECT balance FROM coin_accounts WHERE user_id = ${user.id}`)[0]
  const earnedRow = (await sql`SELECT COALESCE(SUM(delta),0) AS v FROM coin_ledger WHERE user_id=${user.id} AND delta>0`)[0]
  const spentRow = (await sql`SELECT COALESCE(SUM(-delta),0) AS v FROM coin_ledger WHERE user_id=${user.id} AND delta<0`)[0]
  const ledgers = await sql`
    SELECT id, delta, type, note, ref_id, ref_type, operator, is_demo, created_at
    FROM coin_ledger WHERE user_id=${user.id} ORDER BY created_at DESC LIMIT 30`
  const claims = await sql`
    SELECT id, rule_id, title, description, activity_id, proofs, recipients, total, status, auditor, audit_note, is_demo, created_at
    FROM coin_claims WHERE user_id=${user.id} ORDER BY created_at DESC LIMIT 30`
  const rules = await sql`
    SELECT id, name_zh, name_en, name_th, amount, unit, category, is_routine, status, note
    FROM coin_rules WHERE status=1 ORDER BY amount ASC`

  const earned = Number(earnedRow?.v || 0)
  return corsResponse({
    account: {
      balance: Number(acc?.balance ?? COIN_CONFIG.initialBalance),
      earned,
      spent: Number(spentRow?.v || 0),
      tier: growthTierOf(earned),
    },
    tierList: GROWTH_TIERS.map(t => ({ key: t.key, zh: t.zh, en: t.en, th: t.th, min: t.min, max: t.max === Infinity ? null : t.max })),
    ledgers: ledgers.map(l => ({
      id: l.id, delta: l.delta, type: l.type, note: l.note,
      refId: l.ref_id, refType: l.ref_type, operator: l.operator,
      isDemo: l.is_demo || 0, createdAt: l.created_at,
    })),
    claims: claims.map(c => {
      let proofs = [], recipients = []
      try { proofs = JSON.parse(c.proofs || '[]') } catch {}
      try { recipients = JSON.parse(c.recipients || '[]') } catch {}
      return {
        id: c.id, ruleId: c.rule_id, title: c.title, description: c.description,
        activityId: c.activity_id, proofs, recipients, total: c.total,
        isDemo: c.is_demo || 0,
        status: c.status, auditor: c.auditor, auditNote: c.audit_note, createdAt: c.created_at,
      }
    }),
    rules: rules.map(r => ({
      id: r.id,
      name: { zh: r.name_zh, en: r.name_en, th: r.name_th },
      amount: r.amount, unit: r.unit, category: r.category,
      isRoutine: r.is_routine, status: r.status, note: r.note,
    })),
  })
}
