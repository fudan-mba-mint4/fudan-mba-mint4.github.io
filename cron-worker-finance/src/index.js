// 薄荷4班 · 财务时限提醒定时 Worker
// Pages Functions 不支持 Cron Triggers，故用独立 Worker：
// 每天北京时间 08:30 扫描财务各时限，超时/临近写站内提醒（notifications），
// finance_reminders 表做去重（同一单据同一类型只提醒一次，直到状态变化）。
import { getSql } from '../../functions/_utils.js'
import { DEFAULT_FINANCE_CONFIG, getFinanceConfig } from '../../functions/_finance.js'

// 跳过周末的"工作日"天数
function elapsedWorkDays(startIso, endIso) {
  const s = new Date(startIso + 'T00:00:00Z')
  const e = new Date(endIso + 'T00:00:00Z')
  if (e <= s) return 0
  let days = 0
  const cur = new Date(s)
  cur.setUTCDate(cur.getUTCDate() + 1) // 从次日开始计
  while (cur <= e) {
    const dow = cur.getUTCDay()
    if (dow !== 0 && dow !== 6) days++
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return days
}

function shanghaiTodayIso() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

async function ensureReminderTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS finance_reminders (
      key TEXT PRIMARY KEY,
      type TEXT,
      ref_id TEXT,
      sent_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `
}

// 写一条去重提醒（已发过同 key 则跳过）
async function remindOnce(sql, { key, type, title, body, modulePath, operator }) {
  const dup = await sql`SELECT 1 FROM finance_reminders WHERE key = ${key} LIMIT 1`
  if (dup.length) return { skipped: true }
  await sql`
    INSERT INTO notifications (id, type, title, body, module_path, operator)
    VALUES (${'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)}, ${type}, ${title}, ${body}, ${modulePath}, ${operator})
  `
  await sql`INSERT INTO finance_reminders (key, type, ref_id) VALUES (${key}, ${type}, ${key})`
  return { skipped: false }
}

async function scan(env) {
  const sql = getSql(env)
  await ensureReminderTable(sql)
  const config = await getFinanceConfig(env)
  const reimbDays = config.reimbDays || DEFAULT_FINANCE_CONFIG.reimbDays
  const auditDays = config.auditDays || DEFAULT_FINANCE_CONFIG.auditDays
  const payDays = config.payDays || DEFAULT_FINANCE_CONFIG.payDays
  const today = shanghaiTodayIso()
  const sent = []

  // 1) 预算公示期满（open 且已过 expose_end）→ 提醒会计结算
  const budgets = await sql`SELECT id, title, expose_end FROM budget_proposals WHERE status = 'open'`
  for (const b of budgets) {
    const endIso = (b.expose_end || '').slice(0, 10)
    if (endIso && endIso < today) {
      const r = await remindOnce(sql, {
        key: `budget-settle-${b.id}`,
        type: 'finance_remind', ref_id: b.id,
        title: '预算公示已期满，待结算',
        body: `「${b.title}」公示已结束，请会计尽快按投票结果结算。`,
        modulePath: '/finance/', operator: '会计',
      })
      if (!r.skipped) sent.push(`budget-settle:${b.id}`)
    }
  }

  // 2) 报销：提交时限（消费日后 7 工作日）/ 审核时限（提交后 3 工作日）/ 付款时限（审核通过后 3 工作日）
  const reimbs = await sql`
    SELECT id, description, applicant, amount, expense_date, created_at, audit_at, status
    FROM reimbursements
    WHERE status IN ('submitted', 'approved', 'need_revision')
  `
  for (const r of reimbs) {
    const expIso = (r.expense_date || '').slice(0, 10)
    const createdIso = (r.created_at || '').slice(0, 10)
    const approvedIso = (r.audit_at || '').slice(0, 10)
    const amt = Number(r.amount || 0).toFixed(2)
    // 2a 提交时限：消费后超过 reimbDays 工作日仍在流转 → 提醒提交人
    if (expIso && elapsedWorkDays(expIso, today) > reimbDays) {
      const rr = await remindOnce(sql, {
        key: `reimb-submit-${r.id}`,
        type: 'finance_remind', ref_id: r.id,
        title: '报销提交时限已超期',
        body: `「${r.description || '报销单'}」（¥${amt}）消费于 ${expIso}，已超过 ${reimbDays} 个工作日提交时限，请尽快处理。`,
        modulePath: '/finance/', operator: r.applicant,
      })
      if (!rr.skipped) sent.push(`reimb-submit:${r.id}`)
    }
    // 2b 审核时限：submitted 超过 auditDays 工作日 → 提醒会计
    if (r.status === 'submitted' && createdIso && elapsedWorkDays(createdIso, today) > auditDays) {
      const rr = await remindOnce(sql, {
        key: `reimb-audit-${r.id}`,
        type: 'finance_remind', ref_id: r.id,
        title: '报销待审核已超时',
        body: `「${r.description || '报销单'}」（¥${amt}）由 ${r.applicant} 提交已超过 ${auditDays} 个工作日，请会计尽快审核。`,
        modulePath: '/finance/', operator: '会计',
      })
      if (!rr.skipped) sent.push(`reimb-audit:${r.id}`)
    }
    // 2c 付款时限：approved 超过 payDays 工作日 → 提醒出纳
    if (r.status === 'approved' && approvedIso && elapsedWorkDays(approvedIso, today) > payDays) {
      const rr = await remindOnce(sql, {
        key: `reimb-pay-${r.id}`,
        type: 'finance_remind', ref_id: r.id,
        title: '报销待付款已超时',
        body: `「${r.description || '报销单'}」（¥${amt}）审核通过已超过 ${payDays} 个工作日，请出纳尽快完成打款并确认。`,
        modulePath: '/finance/', operator: '出纳',
      })
      if (!rr.skipped) sent.push(`reimb-pay:${r.id}`)
    }
  }

  return { today, sent, config: { reimbDays, auditDays, payDays } }
}

export default {
  // 定时触发：每天一次（北京 08:30）
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      scan(env)
        .then((r) => console.log('[finance-cron]', r.today, 'sent=', r.sent.length, JSON.stringify(r.sent)))
        .catch((e) => console.error('[finance-cron] failed', (e && e.stack) || e))
    )
  },
  // 手动触发 / 健康检查：GET 立即跑一次
  async fetch(request, env, ctx) {
    try {
      const r = await scan(env)
      return new Response(JSON.stringify(r), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: String((e && e.message) || e) }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }
  },
}
