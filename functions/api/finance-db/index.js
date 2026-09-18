// 财务公开只读 API - GET /api/finance-db
// 返回 { transactions: [...], activityFinances: [...] }
// 从 finance_records 取 id='default' 的 data，无记录则空数组
import {
  getSql, ensureContentTables, corsResponse, optionsResponse,
} from '../../_utils.js'

let dbReady = false
let initPromise = null

async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    try { await ensureContentTables(env); dbReady = true } catch (e) { initPromise = null; throw e }
  })()
  return initPromise
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)

  try { await ensureDb(env) } catch (e) {
    return corsResponse({ error: '数据库连接失败', detail: e.message }, 503)
  }

  try {
    const sql = getSql(env)
    const rows = await sql`
      SELECT data FROM finance_records WHERE id = 'default' LIMIT 1
    `
    const data = rows[0]?.data || {}
    return corsResponse({
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      activityFinances: Array.isArray(data.activityFinances) ? data.activityFinances : [],
    })
  } catch (err) {
    console.error('finance-db API 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
