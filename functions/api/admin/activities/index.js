// 活动管理员写 API - POST/PUT/DELETE /api/admin/activities
// 鉴权：登录班委 + 模块角色（体验运营官 / 主理人 / 副主理人）。
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'activities')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    const body = await parseBody(request)

    if (request.method === 'POST' || request.method === 'PUT') {
      const id = body.id
      if (!id) return corsResponse({ error: '缺少 id 字段' }, 400)
      // 发布人：新建记当前用户；编辑保留原创建者、记最后更新者
      const prevRows = await sql`SELECT data FROM activities WHERE id = ${id}`
      const prev = prevRows[0]?.data
      body.created_by = prev?.created_by || auth.user.name
      body.created_by_id = prev?.created_by_id || auth.user.id
      if (prev?.created_by) body.updated_by = auth.user.name

      const result = await sql`
        INSERT INTO activities (id, date, status, data)
        VALUES (${id}, ${body.date ?? null}, ${body.status ?? null}, ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          date = excluded.date,
          status = excluded.status,
          data = excluded.data,
          updated_at = now()
        RETURNING id
      `
      const titleText = typeof body.title === 'string'
        ? body.title
        : (body.title?.zh || body.name || id)
      await logHistory(sql, {
        type: 'activities',
        action: prev?.created_by ? 'update' : 'create',
        refId: id,
        description: titleText,
        operator: auth.user.name,
      })
      return corsResponse({ message: '保存成功', id: result[0]?.id }, 200)
    }

    if (request.method === 'DELETE') {
      if (!body.id) return corsResponse({ error: '缺少 id 字段' }, 400)
      const result = await sql`DELETE FROM activities WHERE id = ${body.id} RETURNING id, data`
      if (result.length) {
        const d = result[0].data || {}
        const titleText = typeof d.title === 'string'
          ? d.title
          : (d.title?.zh || d.name || body.id)
        await logHistory(sql, {
          type: 'activities', action: 'delete', refId: body.id,
          description: titleText, operator: auth.user.name,
        })
      }
      return corsResponse({ message: result.length ? '删除成功' : '未找到记录', deleted: result.length })
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/activities 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
