// 知识库公开读取 - GET /api/knowledge-db
import { getSql, corsResponse, optionsResponse } from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  try {
    const sql = getSql(env)
    const rows = await sql`SELECT data FROM knowledge_base WHERE id = 'default' LIMIT 1`
    return corsResponse(rows[0]?.data || { courses: [], documents: [] })
  } catch (e) {
    return corsResponse({ error: String(e?.message || e) }, 500)
  }
}
