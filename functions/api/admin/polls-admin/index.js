// 投票内容 API
// GET    /api/admin/polls-admin - 公开只读，返回 { polls: [...] }（前台投票列表用此端点）
// POST/PUT/DELETE - 班委写入，需登录且具备模块角色（体验运营官 / 主理人 / 副主理人）。
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory, notify,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  // ===== GET：公开只读 =====
  if (request.method === 'GET') {
    try {
      const sql = getSql(env)
      const rows = await sql`SELECT data FROM polls_admin ORDER BY updated_at DESC`
      return corsResponse({ polls: rows.map(r => r.data) })
    } catch (err) {
      console.error('polls-admin GET 错误:', err)
      return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
    }
  }

  // ===== 写操作：鉴权 =====
  const auth = await requireRole(request, env, 'polls')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    const body = await parseBody(request)

    if (request.method === 'POST' || request.method === 'PUT') {
      const id = body.id
      if (!id) return corsResponse({ error: '缺少 id 字段' }, 400)
      // 发布人：新建记当前用户；编辑保留原创建者、记最后更新者
      const prevRows = await sql`SELECT data FROM polls_admin WHERE id = ${id}`
      const prev = prevRows[0]?.data
      body.created_by = prev?.created_by || auth.user.name
      body.created_by_id = prev?.created_by_id || auth.user.id
      if (prev?.created_by) body.updated_by = auth.user.name

      const result = await sql`
        INSERT INTO polls_admin (id, data)
        VALUES (${id}, ${JSON.stringify(body)})
        ON CONFLICT (id) DO UPDATE SET
          data = excluded.data,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        RETURNING id
      `
      const titleText = typeof body.title === 'string' ? body.title : (body.title?.zh || id)
      const isCreate = !prev?.created_by
      await logHistory(sql, {
        type: 'polls',
        action: isCreate ? 'create' : 'update',
        refId: id,
        description: `${isCreate ? '发起投票' : '编辑投票'}：${titleText}`,
        operator: auth.user.name,
      })
      if (isCreate) {
        await notify(sql, { type: 'poll', title: titleText, body: '请参与投票',
          modulePath: '/polls/', operator: auth.user.name })
      }
      return corsResponse({ message: '保存成功', id: result[0]?.id }, 200)
    }

    if (request.method === 'DELETE') {
      if (!body.id) return corsResponse({ error: '缺少 id 字段' }, 400)
      const result = await sql`DELETE FROM polls_admin WHERE id = ${body.id} RETURNING id, data`
      if (result.length) {
        const d = result[0].data || {}
        const titleText = typeof d.title === 'string' ? d.title : (d.title?.zh || body.id)
        await logHistory(sql, {
          type: 'polls', action: 'delete', refId: body.id,
          description: `删除投票：${titleText}`, operator: auth.user.name,
        })
      }
      return corsResponse({ message: result.length ? '删除成功' : '未找到记录', deleted: result.length })
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/polls-admin 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
