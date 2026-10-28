// 薄荷币 · 规则操作 - POST /api/admin/coins/rules/:id（高晓梅 / 叶宏颖 + leader/deputy/supervisor 兜底）
// action=toggle（启停）/ update（更新字段）/ delete（删除）。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireCoinsAdmin,
  logHistory, ensureTables, isMissingTableError,
} from '../../../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireCoinsAdmin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  const id = String(params?.id || '')
  if (!id) return corsResponse({ error: '缺少规则 ID' }, 400)
  try {
    return await handleRule(request, env, id, auth.user)
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        return await handleRule(request, env, id, auth.user)
      } catch (e2) { console.error('coins rule 懒建表后重试失败:', e2) }
    }
    console.error('coins rule 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleRule(request, env, id, user) {
  const sql = getSql(env)
  const body = await parseBody(request)
  const action = body.action
  const rule = (await sql`SELECT * FROM coin_rules WHERE id=${id} LIMIT 1`)[0]
  if (!rule) return corsResponse({ error: '规则不存在' }, 404)

  if (action === 'toggle') {
    const next = rule.status ? 0 : 1
    await sql`UPDATE coin_rules SET status=${next} WHERE id=${id}`
    await logHistory(sql, {
      type: 'coins', action: `${next ? '启用' : '停用'}薄荷币规则：${rule.name_zh}`,
      refId: id, description: '', operator: user.name,
    })
    return corsResponse({ message: next ? '已启用' : '已停用', status: next })
  }

  if (action === 'delete') {
    await sql`DELETE FROM coin_rules WHERE id=${id}`
    await logHistory(sql, {
      type: 'coins', action: `删除薄荷币规则：${rule.name_zh}`, refId: id, description: '', operator: user.name,
    })
    return corsResponse({ message: '已删除' })
  }

  if (action === 'update') {
    const nameZh = String(body.nameZh ?? rule.name_zh).trim()
    if (!nameZh) return corsResponse({ error: '规则名称（中文）必填' }, 400)
    const amount = Math.max(0, Math.floor(Number(body.amount ?? rule.amount) || 0))
    if (!amount) return corsResponse({ error: '奖励币数必须为正整数' }, 400)
    await sql`
      UPDATE coin_rules SET name_zh=${nameZh}, name_en=${String(body.nameEn ?? rule.name_en).trim()},
        name_th=${String(body.nameTh ?? rule.name_th).trim()}, amount=${amount},
        unit=${body.unit === 'per_activity' ? 'per_activity' : (body.unit || rule.unit)},
        category=${body.category || rule.category}, is_routine=${body.isRoutine === undefined ? rule.is_routine : (body.isRoutine ? 1 : 0)},
        note=${String(body.note ?? rule.note).trim()} WHERE id=${id}`
    await logHistory(sql, {
      type: 'coins', action: `更新薄荷币规则：${nameZh}`, refId: id, description: '', operator: user.name,
    })
    return corsResponse({ message: '已更新' })
  }

  return corsResponse({ error: '无效操作' }, 400)
}
