// 删除树洞留言（管理员）
// DELETE /api/treehole/[id] - 软删除指定留言
import { initDatabase, query } from '../../lib/db.js'
import { verifyAdminToken, jsonResponse } from '../../lib/validate.js'

let dbInitialized = false

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'DELETE') {
    jsonResponse(res, 405, { error: '不支持的请求方法' })
    return
  }

  // 管理员验证
  if (!verifyAdminToken(req)) {
    jsonResponse(res, 401, { error: '未授权，需要管理员Token' })
    return
  }

  // 初始化数据库
  if (!dbInitialized) {
    try {
      await initDatabase()
      dbInitialized = true
    } catch (err) {
      console.error('数据库初始化失败:', err)
      jsonResponse(res, 500, { error: '数据库初始化失败' })
      return
    }
  }

  try {
    // 从URL路径中提取id
    const url = new URL(req.url, 'http://localhost')
    const pathParts = url.pathname.split('/').filter(Boolean)
    const idStr = pathParts[pathParts.length - 1]
    const id = parseInt(idStr, 10)

    if (isNaN(id) || id <= 0) {
      jsonResponse(res, 400, { error: '无效的留言ID' })
      return
    }

    // 软删除
    const result = await query(
      `UPDATE treehole_messages
       SET is_deleted = TRUE
       WHERE id = $1 AND is_deleted = FALSE
       RETURNING id`,
      [id]
    )

    if (result.length === 0) {
      jsonResponse(res, 404, { error: '留言不存在或已被删除' })
      return
    }

    jsonResponse(res, 200, { message: '留言已删除', id })
  } catch (err) {
    console.error('删除留言失败:', err)
    jsonResponse(res, 500, { error: '删除失败', detail: err.message })
  }
}
