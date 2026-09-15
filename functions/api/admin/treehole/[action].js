// 树洞管理员 - 批量删除/恢复（POST /api/admin/treehole/:action）
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
  return token && token === env.ADMIN_TOKEN
}

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权，需要管理员Token' }, 401)

  try { await ensureDb(env) } catch (e) {
    return corsResponse({ error: '数据库连接失败' }, 503)
  }

  const sql = getSql(env)
  const action = params.action
  const { ids } = await parseBody(request)

  if (!Array.isArray(ids) || ids.length === 0) {
    return corsResponse({ error: '请提供留言ID数组' }, 400)
  }
  const validIds = ids.filter(id => Number.isInteger(id) && id > 0)
  if (validIds.length === 0) return corsResponse({ error: '无效的ID列表' }, 400)

  if (action === 'delete') {
    const result = await sql`
      UPDATE treehole_messages SET is_deleted = TRUE
      WHERE id IN (${validIds}) AND is_deleted = FALSE RETURNING id`
    return corsResponse({ message: `成功删除 ${result.length} 条`, deletedCount: result.length, deletedIds: result.map(r => r.id) })
  }

  if (action === 'restore') {
    const result = await sql`
      UPDATE treehole_messages SET is_deleted = FALSE
      WHERE id IN (${validIds}) AND is_deleted = TRUE RETURNING id`
    return corsResponse({ message: `成功恢复 ${result.length} 条`, restoredCount: result.length, restoredIds: result.map(r => r.id) })
  }

  return corsResponse({ error: '接口不存在' }, 404)
}
