// 城市足迹 API
import { getSql, initDatabase, hashIp, getClientIp, corsResponse, optionsResponse } from '../../_utils.js'

let dbReady = false
let initPromise = null
async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    await initDatabase(env)
    // 只在本函数里建表，失败不影响其他API
    try {
      const sql = getSql(env)
      await sql`CREATE TABLE IF NOT EXISTS city_visits (
        id SERIAL PRIMARY KEY,
        ip_hash TEXT NOT NULL,
        country TEXT,
        city TEXT,
        lat FLOAT DEFAULT 0,
        lng FLOAT DEFAULT 0,
        visited_at TIMESTAMPTZ DEFAULT NOW()
      )`
    } catch (e) { /* 表可能已存在 */ }
    dbReady = true
  })()
  return initPromise
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  try { await ensureDb(env) } catch { return corsResponse({ error: 'db fail' }, 503) }
  const sql = getSql(env)

  if (request.method === 'POST') {
    const ip = getClientIp(request)
    const ipHash = await hashIp(ip)

    const recent = await sql`
      SELECT id, city FROM city_visits
      WHERE ip_hash = ${ipHash} AND visited_at > NOW() - INTERVAL '30 minutes'
      ORDER BY visited_at DESC LIMIT 1
    `
    if (recent.length > 0 && recent[0].city && recent[0].city !== 'Unknown') {
      return corsResponse({ message: 'already tracked', skipped: true })
    }

    const h = request.headers
    let geo = {}
    try { geo = context.request?.cf?.geo || context.request?.eo?.geo || {} } catch (e) {}
    if (geo && !geo.cityName) {
      try { geo = request.cf?.geo || request.eo?.geo || {} } catch (e) {}
    }

    let city = geo.cityName || h.get('x-edgeone-ip-city') || ''
    let country = geo.countryCodeAlpha2 || h.get('x-edgeone-ip-country') || ''
    let lat = parseFloat(geo.latitude || '0')
    let lng = parseFloat(geo.longitude || '0')

    const loc = { country: country || 'Unknown', city: city || 'Unknown', lat, lng }

    if (recent.length > 0) {
      await sql`UPDATE city_visits SET country=${loc.country}, city=${loc.city}, lat=${loc.lat}, lng=${loc.lng} WHERE id=${recent[0].id}`
    } else {
      await sql`INSERT INTO city_visits (ip_hash, country, city, lat, lng) VALUES (${ipHash}, ${loc.country}, ${loc.city}, ${loc.lat}, ${loc.lng})`
    }
    return corsResponse({ message: 'tracked', city: loc.city }, 201)
  }

  const totalResult = await sql`SELECT COUNT(DISTINCT ip_hash)::int as total FROM city_visits WHERE visited_at >= DATE_TRUNC('month', NOW())`
  const citiesResult = await sql`SELECT COUNT(DISTINCT city)::int as count FROM city_visits WHERE city != 'Unknown' AND city != ''`
  const topCities = await sql`SELECT city, country, lat, lng, COUNT(DISTINCT ip_hash)::int as visits FROM city_visits WHERE city != 'Unknown' AND city != '' GROUP BY city, country, lat, lng ORDER BY visits DESC LIMIT 20`
  const allCities = await sql`SELECT city, country, lat, lng, COUNT(DISTINCT ip_hash)::int as visits FROM city_visits WHERE city != 'Unknown' AND city != '' AND lat != 0 GROUP BY city, country, lat, lng`
  return corsResponse({ total: totalResult[0]?.total || 0, cityCount: citiesResult[0]?.count || 0, topCities, allCities })
}
