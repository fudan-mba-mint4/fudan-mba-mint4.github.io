// 知识库管理员 API
// POST/PUT /api/admin/knowledge：整包 upsert 到 knowledge_base id='default'
// DELETE  /api/admin/knowledge  body { docId }：删除单条资料（DB 记录 + R2 文件）
// 鉴权：登录班委 + 模块角色（智库研究员 / 主理人 / 副主理人 / 独立董事会）。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory,
} from '../../../_utils.js'

// 从资料 url 解析 R2 对象 key（仅处理本站 R2 公开域或站内 /files 路径）
function r2KeyFromUrl(url, env) {
  if (!url || typeof url !== 'string') return null
  if (env.R2_PUBLIC_DOMAIN) {
    const pre = `https://${env.R2_PUBLIC_DOMAIN}/`
    if (url.startsWith(pre)) return url.slice(pre.length)
    try {
      const uo = new URL(url)
      if (uo.hostname === env.R2_PUBLIC_DOMAIN)
        return uo.pathname.slice(1) + (uo.search || '')
    } catch {}
  }
  if (url.startsWith('/files/')) return url.slice(1)
  return null
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'knowledge')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)

    if (request.method === 'DELETE') {
      const body = await parseBody(request)
      const docId = body.docId
      if (docId === undefined || docId === null)
        return corsResponse({ error: '缺少 docId' }, 400)

      const rows = await sql`SELECT data FROM knowledge_base WHERE id='default' LIMIT 1`
      const data = rows[0]?.data || { courses: [], documents: [] }
      const docs = Array.isArray(data.documents) ? data.documents : []
      const target = docs.find(d => String(d.id) === String(docId))
      if (!target) return corsResponse({ error: '未找到该资料', removed: false }, 404)

      data.documents = docs.filter(d => String(d.id) !== String(docId))
      await sql`
        INSERT INTO knowledge_base (id, data)
        VALUES ('default', ${JSON.stringify(data)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
      `

      let r2Deleted = false
      const key = r2KeyFromUrl(target.url, env)
      if (key && env.R2 && typeof env.R2.delete === 'function') {
        await env.R2.delete(key)
        r2Deleted = true
      }

      const titleText = (typeof target.title === 'object' ? target.title?.zh : target.title) || '资料'
      await logHistory(sql, {
        type: 'knowledge', action: 'delete', refId: String(target.id),
        description: `删除资料：${titleText}`, operator: auth.user.name,
      })
      return corsResponse({ message: '已删除', removed: true, r2Deleted, r2Key: key })
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      const body = await parseBody(request)
      body.updated_by = auth.user.name
      body.updated_by_id = auth.user.id
      const result = await sql`
        INSERT INTO knowledge_base (id, data)
        VALUES ('default', ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
        RETURNING id
      `
      await logHistory(sql, {
        type: 'knowledge', action: 'update',
        description: `更新知识库（${body.documents?.length || 0} 份资料）`,
        operator: auth.user.name,
      })
      return corsResponse({ message: '知识库保存成功', id: result[0]?.id }, 200)
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/knowledge 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err?.message || err) }, 500)
  }
}
