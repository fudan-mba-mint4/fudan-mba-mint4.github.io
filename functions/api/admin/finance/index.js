// 财务管理员 API
// POST/PUT /api/admin/finance：整包 upsert（并发布更新通知）
// DELETE  /api/admin/finance body { txId }：删除单条顶层流水
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory, notify,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'finance')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)

    if (request.method === 'DELETE') {
      const body = await parseBody(request)
      const txId = body.txId
      if (!txId) return corsResponse({ error: '缺少 txId' }, 400)
      const rows = await sql`SELECT data FROM finance_records WHERE id='default'`
      const data = rows[0]?.data || { transactions: [], activityFinances: [] }
      const target = (data.transactions || []).find(t => String(t.id) === String(txId))
      if (!target) return corsResponse({ error: '未找到该流水', removed: false }, 404)
      data.transactions = (data.transactions || []).filter(t => String(t.id) !== String(txId))
      await sql`
        INSERT INTO finance_records (id, data)
        VALUES ('default', ${JSON.stringify(data)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
      `
      await logHistory(sql, { type: 'finance', action: 'delete',
        description: `删除流水：${target.description || txId}`, operator: auth.user.name })
      return corsResponse({ message: '已删除', removed: true })
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      const body = await parseBody(request)
      body.updated_by = auth.user.name
      body.updated_by_id = auth.user.id

      const prevRows = await sql`SELECT data FROM finance_records WHERE id='default'`
      const prevTx = new Set((prevRows[0]?.data?.transactions || []).map(t => String(t.id)))

      const result = await sql`
        INSERT INTO finance_records (id, data)
        VALUES ('default', ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
        RETURNING id
      `
      const added = (body.transactions || []).filter(t => !prevTx.has(String(t.id))).length
      await logHistory(sql, { type: 'finance', action: 'update',
        description: `更新班费明细`, operator: auth.user.name })
      await notify(sql, { type: 'finance', title: '班费明细已更新',
        body: added > 0 ? `新增 ${added} 条流水` : '流水已调整',
        modulePath: '/finance/', operator: auth.user.name })
      return corsResponse({ message: '财务数据保存成功', id: result[0]?.id }, 200)
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/finance 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err?.message || err) }, 500)
  }
}
