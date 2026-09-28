// 当天寿星 - GET /api/birthday/today
// 返回 { day, celebrate, names[], displayNames, viewed }。
// 优先读 birthday_today 预计算结果（Cron 预热 / 上次访问回填），缺失才即时计算并缓存。
// 任何异常都降级为「不庆祝」，绝不因生日功能影响首页。
import {
  getSql, corsResponse, optionsResponse, getAuthUser,
  ensureTables, isMissingTableError,
} from '../../_utils.js'
import { getShanghaiDateParts, computeBirthday } from '../../_birthday.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的方法' }, 405)

  const parts = getShanghaiDateParts()
  try {
    const sql = getSql(env)
    const me = await getAuthUser(request, sql)

    // 1. 读当天预计算缓存
    const cached = await sql`SELECT data FROM birthday_today WHERE day_key = ${parts.iso}`
    let result
    if (cached[0] && cached[0].data) {
      result = typeof cached[0].data === 'string'
        ? JSON.parse(cached[0].data)
        : cached[0].data
    } else {
      // 2. 缓存缺失：即时计算并回填（Cron 没跑 / 新部署兜底）
      result = await computeBirthday(sql, parts)
      await sql`
        INSERT INTO birthday_today (day_key, data)
        VALUES (${parts.iso}, ${result})
        ON CONFLICT (day_key) DO UPDATE SET
          data = excluded.data,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      `
    }

    // 3. 登录用户：返回当天是否已看
    let viewed = false
    if (me) {
      const v = await sql`
        SELECT id FROM birthday_views
        WHERE user_id = ${me.id} AND view_date = ${parts.iso}
        LIMIT 1
      `
      viewed = v.length > 0
    }

    return corsResponse({ day: parts.iso, viewed, ...result })
  } catch (e) {
    if (isMissingTableError(e)) {
      try { await ensureTables(env) } catch {}
    }
    return corsResponse({ day: parts.iso, celebrate: false, names: [], displayNames: '', viewed: false })
  }
}
