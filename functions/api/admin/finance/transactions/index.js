// 收支流水登记 v2（财务后台，结构化）
// POST   /api/admin/finance/transactions：新增一笔收支（income/expense，自动分配凭证编号）
// DELETE /api/admin/finance/transactions：删除一笔（body { id }）
// 鉴权：仅会计（管账）或出纳（管钱）可登记/删除
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, notify, isMissingTableError, ensureTables } from '../../../../_utils.js'
import { getFinanceRoles, isAccountant, isCashier, FINANCE_CATEGORIES, INCOME_CATEGORIES, newId, nextVoucherNo } from '../../../../_finance.js'
import { purgePublicCache } from '../../../../_cache.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    const roles = await getFinanceRoles(env)
    if (!isAccountant(auth.user, roles) && !isCashier(auth.user, roles)) {
      return corsResponse({ error: '仅会计或出纳可登记流水' }, 403)
    }

    if (request.method === 'POST') {
      const body = await parseBody(request)
      if (!['income', 'expense'].includes(body.type)) return corsResponse({ error: '无效的收支类型' }, 400)
      if (!body.description || !String(body.description).trim()) return corsResponse({ error: '请填写摘要' }, 400)
      if (!body.date) return corsResponse({ error: '请选择日期' }, 400)
      const allowedCats = body.type === 'income' ? INCOME_CATEGORIES : FINANCE_CATEGORIES
      if (body.category && !allowedCats.includes(body.category)) return corsResponse({ error: '无效的收支大类' }, 400)

      // 多行明细（分类-金额）：items 非空时金额以明细合计为准，主分类取 items[0] 或 body.category
      let items = []
      if (Array.isArray(body.items) && body.items.length) {
        for (const it of body.items) {
          const cat = String(it.category || '').trim()
          const amt = Number(it.amount)
          if (!allowedCats.includes(cat)) return corsResponse({ error: `明细含无效分类：${cat || '空'}` }, 400)
          if (!amt || amt <= 0) return corsResponse({ error: '明细金额需大于 0' }, 400)
          items.push({ category: cat, amount: amt, description: String(it.description || '').trim() })
        }
      }
      const finalAmount = items.length ? Number(items.reduce((s, i) => s + i.amount, 0).toFixed(2)) : Number(body.amount)
      if (!finalAmount || finalAmount <= 0) return corsResponse({ error: '金额需大于 0' }, 400)
      const finalCategory = items.length ? (body.category || items[0].category) : body.category
      if (!allowedCats.includes(finalCategory)) return corsResponse({ error: '无效的收支大类' }, 400)

      const id = newId('ft')
      const voucherNo = await nextVoucherNo(sql)
      const vouchers = Array.isArray(body.vouchers) ? body.vouchers.filter(v => v && v.url) : []
      const doInsert = () => sql`
          INSERT INTO finance_tx (id, voucher_no, date, type, category, amount, description, items, activity_id, proposal_id, reimbursement_id, vouchers, handler, checker)
          VALUES (${id}, ${voucherNo}, ${body.date}, ${body.type}, ${finalCategory}, ${finalAmount}, ${String(body.description).trim()}, ${JSON.stringify(items)}, ${body.activityId || null}, ${body.proposalId || null}, ${body.reimbursementId || null}, ${JSON.stringify(vouchers)}, ${String(body.handler || auth.user.name)}, ${auth.user.name})
        `
      try {
        await doInsert()
      } catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); await doInsert() }
        else throw e
      }
      await logHistory(sql, { type: 'finance', action: 'create', refId: id,
        description: `登记${body.type === 'income' ? '收入' : '支出'}：${String(body.description).trim()}（¥${finalAmount}，凭证号 ${voucherNo}${items.length ? `，${items.length} 项明细` : ''}）`, operator: auth.user.name })
      await notify(sql, { type: 'finance', title: '班费明细已更新',
        body: `${body.type === 'income' ? '收入' : '支出'}：${String(body.description).trim()} ¥${finalAmount}（${voucherNo}）`, modulePath: '/finance/', operator: auth.user.name })
    await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '流水已登记', id, voucherNo, amount: finalAmount, items }, 201)
    }

    if (request.method === 'DELETE') {
      const body = await parseBody(request)
      if (!body.id) return corsResponse({ error: '缺少 id' }, 400)
      let rows
      try {
        rows = await sql`SELECT * FROM finance_tx WHERE id = ${body.id} LIMIT 1`
      } catch (e) {
        if (isMissingTableError(e)) { await ensureTables(env); rows = await sql`SELECT * FROM finance_tx WHERE id = ${body.id} LIMIT 1` }
        else throw e
      }
      if (!rows[0]) return corsResponse({ error: '未找到该流水' }, 404)
      await sql`DELETE FROM finance_tx WHERE id = ${body.id}`
      await logHistory(sql, { type: 'finance', action: 'delete', refId: body.id,
        description: `删除流水：${rows[0].description || body.id}`, operator: auth.user.name })
    await purgePublicCache('finance-v2-public')
      return corsResponse({ message: '已删除' })
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/finance/transactions 错误:', err)
    await purgePublicCache('finance-v2-public')
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
