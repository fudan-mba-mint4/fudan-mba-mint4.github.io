// 数据库健康检查 - GET /api/db-health
// 执行一次 SELECT 1 验证 D1 连接；轻量、零建表；no-store 不缓存。
// （D1 为 Cloudflare 内部边缘库，无冷启动，无需外部 cron 保活。）
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
