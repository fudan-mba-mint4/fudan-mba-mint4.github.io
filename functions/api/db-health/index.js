// 数据库保活/健康检查 - GET /api/db-health
// 供外部 cron 每 4 分钟访问，执行一次 SELECT 1，防止 Neon 免费版闲置休眠。
// 轻量、零建表；no-store 不缓存。
import { getSql, corsResponse, optionsResponse } from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  try {
    const sql = getSql(env)
    await sql`SELECT 1`
    return corsResponse({ ok: true, ts: Date.now() })
  } catch (e) {
    return corsResponse({ ok: false, error: String(e?.message || e) }, 500)
  }
}
