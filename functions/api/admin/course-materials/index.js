// 课程资料管理员写 API - POST/PUT /api/admin/course-materials
// 整个 body（{courses:[...]}）upsert 到 course_materials id='default'
// 鉴权：登录班委 + 模块角色（智库研究员 / 主理人 / 副主理人）。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'courseMaterials')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    const body = await parseBody(request)

    if (request.method === 'POST' || request.method === 'PUT') {
      // 记录整包最后维护人
      body.updated_by = auth.user.name
      body.updated_by_id = auth.user.id

      const result = await sql`
        INSERT INTO course_materials (id, data)
        VALUES ('default', ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
        RETURNING id
      `
      await logHistory(sql, {
        type: 'courseMaterials', action: 'update',
        description: `更新课程资料（${body.courses?.length || 0} 门课）`,
        operator: auth.user.name,
      })
      return corsResponse({ message: '课程资料保存成功', id: result[0]?.id }, 200)
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/course-materials 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err?.message || err) }, 500)
  }
}
