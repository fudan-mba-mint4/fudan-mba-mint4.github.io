// 记录生日已看 - POST /api/birthday/view
// 登录用户：写 birthday_views（跨设备只看一次，user_id+date 唯一，重复上报忽略）。
// 未登录用户：服务端不记录，由前端 localStorage 按设备控制。
import {
  getSql, corsResponse, optionsResponse, getAuthUser,
  ensureTables, isMissingTableError,
} from '../../_utils.js'
import { getShanghaiDateParts } from '../../_birthday.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'POST') return corsResponse({ error: '不支持的方法' }, 405)

  const parts = getShanghaiDateParts()
  try {
    const sql = getSql(env)
    const me = await getAuthUser(request, sql)
    if (me) {
      await sql`
        INSERT INTO birthday_views (user_id, view_date)
        VALUES (${me.id}, ${parts.iso})
        ON CONFLICT DO NOTHING
      `
    }
    return corsResponse({ ok: true })
  } catch (e) {
    if (isMissingTableError(e)) {
      try { await ensureTables(env) } catch {}
    }
    return corsResponse({ ok: false })
  }
}
