// 财务管理员写 API - POST/PUT /api/admin/finance
// 把整个 body（{transactions:[...], activityFinances:[...]}）作为一行 upsert 到 finance_records id='default'
// 鉴权：登录班委 + 模块角色（财务激励官 / 主理人 / 副主理人）。
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'finance')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    const body = await parseBody(request)

    if (request.method === 'POST' || request.method === 'PUT') {
      // 记录整包最后维护人（前端可显示“最后由 XXX 更新”）
      body.updated_by = auth.user.name
      body.updated_by_id = auth.user.id

      const result = await sql`
        INSERT INTO finance_records (id, data)
        VALUES ('default', ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          data = excluded.data,
          updated_at = now()
        RETURNING id
      `
      await logHistory(sql, {
        type: 'finance', action: 'update',
        description: `更新班费数据（${body.transactions?.length || 0} 条流水）`,
        operator: auth.user.name,
      })
      return corsResponse({ message: '财务数据保存成功', id: result[0]?.id }, 200)
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/finance 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
