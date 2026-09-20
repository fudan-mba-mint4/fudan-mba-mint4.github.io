// 公告管理员写 API - POST/PUT/DELETE /api/admin/announcements
// 鉴权：登录班委 + 模块角色（主理人 / 副主理人）。
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory, notify,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'announcements')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    const body = await parseBody(request)

    if (request.method === 'POST' || request.method === 'PUT') {
      const id = body.id
      if (!id) return corsResponse({ error: '缺少 id 字段' }, 400)
      // 发布人：新建记当前用户；编辑保留原创建者、记最后更新者
      const prevRows = await sql`SELECT data FROM announcements WHERE id = ${id}`
      const prev = prevRows[0]?.data
      body.created_by = prev?.created_by || auth.user.name
      body.created_by_id = prev?.created_by_id || auth.user.id
      if (prev?.created_by) body.updated_by = auth.user.name

      const result = await sql`
        INSERT INTO announcements (id, date, category, pinned, data)
        VALUES (${id}, ${body.date ?? null}, ${body.category ?? null}, ${body.pinned === true}, ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          date = excluded.date,
          category = excluded.category,
          pinned = excluded.pinned,
          data = excluded.data,
          updated_at = now()
        RETURNING id
      `
      const titleText = typeof body.title === 'string' ? body.title : (body.title?.zh || id)
      const isCreate = !prev?.created_by
      await logHistory(sql, {
        type: 'announcements',
        action: isCreate ? 'create' : 'update',
        refId: id,
        description: titleText,
        operator: auth.user.name,
      })
      if (isCreate) {
        const catLabel = { important: '重要', academic: '教学', normal: '通知', event: '活动' }[body.category] || '通知'
        await notify(sql, { type: 'announcement', title: titleText, body: catLabel,
          modulePath: '/announcements/', operator: auth.user.name })
      }
      return corsResponse({ message: '保存成功', id: result[0]?.id }, 200)
    }

    if (request.method === 'DELETE') {
      if (!body.id) return corsResponse({ error: '缺少 id 字段' }, 400)
      const result = await sql`DELETE FROM announcements WHERE id = ${body.id} RETURNING id, data`
      if (result.length) {
        const d = result[0].data || {}
        const titleText = typeof d.title === 'string' ? d.title : (d.title?.zh || body.id)
        await logHistory(sql, {
          type: 'announcements', action: 'delete', refId: body.id,
          description: titleText, operator: auth.user.name,
        })
      }
      return corsResponse({ message: result.length ? '删除成功' : '未找到记录', deleted: result.length })
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/announcements 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
