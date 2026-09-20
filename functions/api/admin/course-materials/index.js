// 课程资料管理员 API
// POST/PUT /api/admin/course-materials：整包 upsert（并发布更新通知）
// DELETE  /api/admin/course-materials body { fileUrl }：删除单个文件（DB 记录 + R2 文件）
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory, notify, r2KeyFromUrl, fileNameFromUrl,
} from '../../../_utils.js'

// 收集整包内所有文件 URL（课件 files / 作业 homework / 参考 references）
function collectFileUrls(pack) {
  const s = new Set()
  for (const c of pack?.courses || [])
    for (const sess of c.sessions || []) {
      for (const f of sess.files || []) if (f.url) s.add(f.url)
      if (sess.homework?.url) s.add(sess.homework.url)
      for (const r of sess.references || []) if (r.url) s.add(r.url)
    }
  return s
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'courseMaterials')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)

    if (request.method === 'DELETE') {
      const body = await parseBody(request)
      const fileUrl = body.fileUrl
      if (!fileUrl) return corsResponse({ error: '缺少 fileUrl' }, 400)

      const rows = await sql`SELECT data FROM course_materials WHERE id='default'`
      const data = rows[0]?.data || { courses: [] }
      let foundName = ''
      for (const c of data.courses || []) {
        for (const sess of c.sessions || []) {
          if (Array.isArray(sess.files)) {
            const hit = sess.files.find(f => f.url === fileUrl)
            if (hit) { foundName = hit.name; sess.files = sess.files.filter(f => f.url !== fileUrl) }
          }
          if (Array.isArray(sess.references)) {
            const hit = sess.references.find(r => r.url === fileUrl)
            if (hit) { foundName = hit.name; sess.references = sess.references.filter(r => r.url !== fileUrl) }
          }
          if (sess.homework && sess.homework.url === fileUrl) {
            foundName = sess.homework.name
            delete sess.homework
          }
        }
      }
      if (!foundName) return corsResponse({ error: '未找到该文件', removed: false }, 404)

      await sql`
        INSERT INTO course_materials (id, data)
        VALUES ('default', ${JSON.stringify(data)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
      `
      const key = r2KeyFromUrl(fileUrl, env)
      if (key && env.R2 && typeof env.R2.delete === 'function') await env.R2.delete(key)

      const delName = fileNameFromUrl(fileUrl) || foundName
      await logHistory(sql, { type: 'courseMaterials', action: 'delete',
        description: `删除课件：${delName}`, operator: auth.user.name })
      return corsResponse({ message: '已删除', removed: true })
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      const body = await parseBody(request)
      body.updated_by = auth.user.name
      body.updated_by_id = auth.user.id

      const prevRows = await sql`SELECT data FROM course_materials WHERE id='default'`
      const prevUrls = collectFileUrls(prevRows[0]?.data || {})

      const result = await sql`
        INSERT INTO course_materials (id, data)
        VALUES ('default', ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
        RETURNING id
      `
      const addedNames = [...collectFileUrls(body)]
        .filter(u => !prevUrls.has(u)).map(u => fileNameFromUrl(u)).filter(Boolean)
      const cmDesc = addedNames.length === 1 ? `上传课件：${addedNames[0]}`
        : addedNames.length > 1 ? `上传课程资料 ${addedNames.length} 份：${addedNames.join('、')}`
        : '更新课程资料'
      await logHistory(sql, { type: 'courseMaterials', action: addedNames.length ? 'upload' : 'update',
        description: cmDesc, operator: auth.user.name })
      await notify(sql, { type: 'course', title: '课程资料已更新',
        body: addedNames.length > 0 ? `新增 ${addedNames.length} 份课件/资料` : '资料已调整',
        modulePath: '/slides/', operator: auth.user.name })
      return corsResponse({ message: '课程资料保存成功', id: result[0]?.id }, 200)
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/course-materials 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err?.message || err) }, 500)
  }
}
