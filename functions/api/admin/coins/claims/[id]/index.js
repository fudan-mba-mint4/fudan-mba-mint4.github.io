// 薄荷币 · 申报审核 - POST /api/admin/coins/claims/:id（审批仅限财务激励官：高晓梅 / 叶宏颖）
// action=approve → 按获币名单批量入账（coin_ledger + 账户余额）；action=reject → 驳回（必填原因）。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireCoinsAdmin,
  logHistory, ensureTables, isMissingTableError,
} from '../../../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireCoinsAdmin(request, env, { auditOnly: true })
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  const id = String(params?.id || '')
  if (!id) return corsResponse({ error: '缺少申报单 ID' }, 400)
  try {
    return await handleAudit(request, env, id, auth.user)
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        return await handleAudit(request, env, id, auth.user)
      } catch (e2) { console.error('coins audit 懒建表后重试失败:', e2) }
    }
    console.error('coins audit 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleAudit(request, env, id, auditor) {
  const sql = getSql(env)
  const body = await parseBody(request)
  const action = body.action
  if (!['approve', 'reject'].includes(action)) return corsResponse({ error: '无效操作' }, 400)

  const claim = (await sql`SELECT * FROM coin_claims WHERE id=${id} LIMIT 1`)[0]
  if (!claim) return corsResponse({ error: '申报单不存在' }, 404)
  if (claim.status !== 'pending') return corsResponse({ error: '该申报单已处理' }, 409)

  if (action === 'reject') {
    const note = String(body.note || '').trim()
    if (!note) return corsResponse({ error: '驳回必须填写原因' }, 400)
    await sql`
      UPDATE coin_claims SET status='rejected', auditor=${auditor.name}, audit_note=${note},
        audited_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=${id}`
    await logHistory(sql, {
      type: 'coins', action: `驳回薄荷币申报：${claim.title}`,
      refId: id, description: `原因：${note}`, operator: auditor.name,
    })
    return corsResponse({ message: '已驳回' })
  }

  // approve：解析获币名单，逐人入账
  let recipients = []
  try { recipients = JSON.parse(claim.recipients || '[]') } catch {}
  if (!recipients.length) return corsResponse({ error: '申报单无获币名单，无法入账' }, 400)

  let total = 0
  const okRecipients = []
  for (const r of recipients) {
    const uid = Number(r.userId)
    const amount = Math.floor(Number(r.amount) || 0)
    if (!uid || !amount) continue
    await sql`INSERT OR IGNORE INTO coin_accounts (user_id, balance) VALUES (${uid}, 1)`
    const acc = (await sql`SELECT balance FROM coin_accounts WHERE user_id=${uid}`)[0]
    const newBal = (Number(acc?.balance) || 0) + amount
    await sql`
      UPDATE coin_accounts SET balance=${newBal}, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE user_id=${uid}`
    const lid = `cl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    await sql`
      INSERT INTO coin_ledger (id, user_id, delta, type, rule_id, ref_id, ref_type, balance_after, operator, note, created_at)
      VALUES (${lid}, ${uid}, ${amount}, 'earn', ${claim.rule_id}, ${claim.id}, 'claim', ${newBal},
        ${auditor.name}, ${claim.title}, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
    total += amount
    okRecipients.push({ userId: uid, name: r.name, amount })
  }
  if (!total) return corsResponse({ error: '入账金额为 0，未执行入账' }, 400)

  await sql`
    UPDATE coin_claims SET status='approved', auditor=${auditor.name}, audit_note='',
      audited_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=${id}`
  await logHistory(sql, {
    type: 'coins', action: `审核通过薄荷币申报：${claim.title}`,
    refId: id, description: `发放 ${total} 币 · ${okRecipients.length} 人`, operator: auditor.name,
  })
  return corsResponse({ message: `已通过并发放 ${total} 币`, total, recipients: okRecipients })
}
