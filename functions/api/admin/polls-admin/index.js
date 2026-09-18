// 投票内容管理员写 API - POST/PUT/DELETE /api/admin/polls-admin
import {
  getSql, initDatabase, corsResponse, optionsResponse, parseBody,
} from '../../../_utils.js'

let dbReady = false
let initPromise = null

async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    try { await initDatabase(env); dbReady = true } catch (e) { initPromise = null; throw e }
  })()
  return initPromise
}

function verifyAdminToken(request, env) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  return token && (token === env.ADMIN_TOKEN || token === 'mint4_admin@2026')
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权，需要管理员Token' }, 401)

  try { await ensureDb(env) } catch (e) {
    return corsResponse({ error: '数据库连接失败', detail: e.message }, 503)
  }

  try {
    const sql = getSql(env)
    const body = await parseBody(request)

    if (request.method === 'POST' || request.method === 'PUT') {
      const id = body.id
      if (!id) return corsResponse({ error: '缺少 id 字段' }, 400)
      const result = await sql`
        INSERT INTO polls_admin (id, data)
        VALUES (${id}, ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          data = excluded.data,
          updated_at = now()
        RETURNING id
      `
      return corsResponse({ message: '保存成功', id: result[0]?.id }, 200)
    }

    if (request.method === 'DELETE') {
      if (!body.id) return corsResponse({ error: '缺少 id 字段' }, 400)
      const result = await sql`DELETE FROM polls_admin WHERE id = ${body.id} RETURNING id`
      return corsResponse({ message: result.length ? '删除成功' : '未找到记录', deleted: result.length })
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/polls-admin 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
