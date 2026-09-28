// 薄荷4班 · 生日预热定时 Worker
// Pages Functions 不支持 Cron Triggers，故用独立 Worker：
// 每天北京时间 00:10 计算当天寿星并写入 birthday_today，
// 首页全天读缓存，零实时计算。
import { getSql } from '../../functions/_utils.js'
import { getShanghaiDateParts, computeBirthday } from '../../functions/_birthday.js'

async function preheat(env) {
  const sql = getSql(env)
  const parts = getShanghaiDateParts()
  const result = await computeBirthday(sql, parts)
  await sql`
    INSERT INTO birthday_today (day_key, data)
    VALUES (${parts.iso}, ${result})
    ON CONFLICT (day_key) DO UPDATE SET
      data = excluded.data,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `
  return { day: parts.iso, ...result }
}

export default {
  // 定时触发：每天一次
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      preheat(env)
        .then((r) =>
          console.log('[birthday-cron] preheat', r.day, 'celebrate=', r.celebrate, r.displayNames)
        )
        .catch((e) => console.error('[birthday-cron] failed', (e && e.stack) || e))
    )
  },
  // 手动触发 / 健康检查：GET 立即跑一次预热
  async fetch(request, env, ctx) {
    try {
      const r = await preheat(env)
      return new Response(JSON.stringify(r), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: String((e && e.message) || e) }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }
  },
}
