// 薄荷币 · 规则管理 - GET/POST /api/admin/coins/rules（班委：finance/leader/deputy）
// GET：全部规则（含停用，供后台列表）；POST：创建规则。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole,
  ensureTables, isMissingTableError,
} from '../../../../_utils.js'
import { newId } from '../../../../_coins.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'coins')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  try {
    if (request.method === 'GET') return await handleList(env)
    if (request.method === 'POST') return await handleCreate(request, env, auth.user)
    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        if (request.method === 'GET') return await handleList(env)
        return await handleCreate(request, env, auth.user)
      } catch (e2) { console.error('coins rules 懒建表后重试失败:', e2) }
    }
    console.error('coins rules 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

async function handleList(env) {
  const sql = getSql(env)
  const rows = await sql`
    SELECT id, name_zh, name_en, name_th, amount, unit, category, is_routine, status, note, created_at
    FROM coin_rules ORDER BY amount ASC, created_at DESC`
  return corsResponse({ rules: rows.map(r => ({ ...r })) })
}

async function handleCreate(request, env, user) {
  const sql = getSql(env)
  const body = await parseBody(request)
  const nameZh = String(body.nameZh || '').trim()
  if (!nameZh) return corsResponse({ error: '规则名称（中文）必填' }, 400)
  const amount = Math.max(0, Math.floor(Number(body.amount) || 0))
  if (!amount) return corsResponse({ error: '奖励币数必须为正整数' }, 400)
  const id = newId('rule')
  await sql`
    INSERT INTO coin_rules (id, name_zh, name_en, name_th, amount, unit, category, is_routine, status, note)
    VALUES (${id}, ${nameZh}, ${String(body.nameEn || '').trim()}, ${String(body.nameTh || '').trim()},
      ${amount}, ${body.unit === 'per_activity' ? 'per_activity' : 'fixed'},
      ${body.category || 'contribution'}, ${body.isRoutine ? 1 : 0}, ${body.enable ? 1 : 1}, ${String(body.note || '').trim()})`
  return corsResponse({ message: '规则已创建', id }, 201)
}
