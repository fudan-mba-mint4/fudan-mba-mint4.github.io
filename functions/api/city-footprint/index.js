// 城市足迹 API
import { getSql, initDatabase, corsResponse, optionsResponse } from '../../_utils.js'

let dbReady = false
let initPromise = null
async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => { try { await initDatabase(env); dbReady = true } catch (e) { initPromise = null; throw e } })()
  return initPromise
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  try { await ensureDb(env) } catch { return corsResponse({ error: 'db fail' }, 503) }
  const sql = getSql(env)

  if (request.method === 'POST') {
    return corsResponse({ ok: true }, 200)
  }

  const totalResult = await sql`SELECT COUNT(DISTINCT ip_hash)::int as total FROM city_visits WHERE visited_at >= DATE_TRUNC('month', NOW())`
  const citiesResult = await sql`SELECT COUNT(DISTINCT city)::int as count FROM city_visits WHERE city != 'Unknown' AND city != ''`
  const topCities = await sql`SELECT city, country, lat, lng, COUNT(DISTINCT ip_hash)::int as visits FROM city_visits WHERE city != 'Unknown' AND city != '' GROUP BY city, country, lat, lng ORDER BY visits DESC LIMIT 20`
  const allCities = await sql`SELECT city, country, lat, lng, COUNT(DISTINCT ip_hash)::int as visits FROM city_visits WHERE city != 'Unknown' AND city != '' AND lat != 0 GROUP BY city, country, lat, lng`
  return corsResponse({ total: totalResult[0]?.total || 0, cityCount: citiesResult[0]?.count || 0, topCities, allCities })
}
