// 城市足迹 API（EdgeOne Pages Functions 版本）
import {
  getSql, initDatabase, hashIp, getClientIp,
  corsResponse, optionsResponse,
} from '../../_utils.js'

let dbReady = false
let initPromise = null
async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => { try { await initDatabase(env); dbReady = true } catch (e) { initPromise = null; throw e } })()
  return initPromise
}

// 从请求头尝试获取地理位置
function getLocationFromHeaders(request) {
  const headers = request.headers
  const country = headers.get('x-edgeone-ip-country') || headers.get('x-geoip-country') || headers.get('x-tencent-ip-country') || ''
  const city = headers.get('x-edgeone-ip-city') || headers.get('x-geoip-city') || headers.get('x-tencent-ip-city') || ''
  const lat = parseFloat(headers.get('x-edgeone-ip-lat') || headers.get('x-geoip-lat') || '0')
  const lng = parseFloat(headers.get('x-edgeone-ip-lng') || headers.get('x-geoip-lng') || '0')
  if (country || city) return { country: country || 'Unknown', city: city || 'Unknown', lat, lng }
  return null
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  try {
    await ensureDb(env)
  } catch {
    return corsResponse({ error: '数据库连接失败' }, 503)
  }

  const sql = getSql(env)

  if (request.method === 'POST') {
    try {
      // 调试：返回所有 headers
      const headersObj = {}
      for (const [k, v] of request.headers.entries()) {
        if (k.includes('geo') || k.includes('ip') || k.includes('country') || k.includes('city') || k.includes('edgeone') || k.includes('tencent')) {
          headersObj[k] = v
        }
      }
      return corsResponse({ debug: true, headers: headersObj, ip: getClientIp(request) }, 200)
    } catch (e) {
      return corsResponse({ error: String(e) }, 500)
    }
  }

  // GET: 统计
  const totalResult = await sql`
    SELECT COUNT(DISTINCT ip_hash)::int as total
    FROM city_visits
    WHERE visited_at >= DATE_TRUNC('month', NOW())
  `
  const citiesResult = await sql`
    SELECT COUNT(DISTINCT city)::int as count
    FROM city_visits
    WHERE city != 'Unknown' AND city != ''
  `
  const topCities = await sql`
    SELECT city, country, lat, lng, COUNT(DISTINCT ip_hash)::int as visits
    FROM city_visits
    WHERE city != 'Unknown' AND city != ''
    GROUP BY city, country, lat, lng
    ORDER BY visits DESC
    LIMIT 20
  `
  const allCities = await sql`
    SELECT city, country, lat, lng, COUNT(DISTINCT ip_hash)::int as visits
    FROM city_visits
    WHERE city != 'Unknown' AND city != '' AND lat != 0
    GROUP BY city, country, lat, lng
  `

  return corsResponse({
    total: totalResult[0]?.total || 0,
    cityCount: citiesResult[0]?.count || 0,
    topCities,
    allCities,
  })
}
