// 树洞管理员 - 批量删除/恢复（POST /api/admin/treehole/:action）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse, parseBody, requireRole, logHistory,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env, params } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireRole(request, env, 'treehole')
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

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
      WHERE id = ANY(${validIds}::int[]) AND is_deleted = FALSE RETURNING id`
    if (result.length) {
      await logHistory(sql, {
        type: 'treehole', action: 'delete',
        description: `删除 ${result.length} 条树洞留言`,
        operator: auth.user.name,
      })
    }
    return corsResponse({ message: `成功删除 ${result.length} 条`, deletedCount: result.length, deletedIds: result.map(r => r.id) })
  }

  if (action === 'restore') {
    const result = await sql`
      UPDATE treehole_messages SET is_deleted = FALSE
      WHERE id = ANY(${validIds}::int[]) AND is_deleted = TRUE RETURNING id`
    if (result.length) {
      await logHistory(sql, {
        type: 'treehole', action: 'restore',
        description: `恢复 ${result.length} 条树洞留言`,
        operator: auth.user.name,
      })
    }
    return corsResponse({ message: `成功恢复 ${result.length} 条`, restoredCount: result.length, restoredIds: result.map(r => r.id) })
  }

  return corsResponse({ error: '接口不存在' }, 404)
}
