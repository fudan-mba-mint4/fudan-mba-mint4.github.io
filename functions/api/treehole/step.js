// 树洞「踩一踩」API（QQ空间早期风格）
// POST /api/treehole/step - 登录用户踩一下（每人每天限 1 次，次数累计，更新"最近踩过"）
// 表已建好，热路径不建表；表缺失时由 /api/admin/migrate 重建。
import {
  getSql, corsResponse, optionsResponse, requireLogin,
} from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const sql = getSql(env)
    const auth = await requireLogin(request, env)
    if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

    const now = new Date().toISOString()
    // 中国日期（UTC+8）：用于"今天是否已踩过"判断
    const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)

    const existing = await sql`SELECT id, step_count, last_stepped_at FROM treehole_steps WHERE user_id = ${auth.user.id} LIMIT 1`

    if (existing.length) {
      const row = existing[0]
      const lastDate = row.last_stepped_at ? new Date(new Date(row.last_stepped_at).getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10) : ''
      if (lastDate === today) {
        return corsResponse({ error: '今天已经踩过啦，明天再来吧', stepped: false, alreadyToday: true }, 409)
      }
      await sql`
        UPDATE treehole_steps
        SET step_count = step_count + 1, last_stepped_at = ${now}
        WHERE user_id = ${auth.user.id}
      `
    } else {
      await sql`
        INSERT INTO treehole_steps (user_id, user_name, step_count, last_stepped_at)
        VALUES (${auth.user.id}, ${auth.user.name}, 1, ${now})
      `
    }

    const stepAgg = await sql`SELECT COALESCE(SUM(step_count), 0) AS total FROM treehole_steps`
    const recent = await sql`SELECT user_name FROM treehole_steps ORDER BY last_stepped_at DESC LIMIT 8`
    return corsResponse({
      message: '踩一踩成功',
      stepped: true,
      stepsTotal: stepAgg[0]?.total || 0,
      recentSteps: recent.map(r => r.user_name),
    }, 201)
  } catch (err) {
    console.error('踩一踩API错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
