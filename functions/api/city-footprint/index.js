// 城市足迹 API（EdgeOne Pages Functions 版本）
// POST /api/city-footprint - 记录一次访问（30分钟内同IP去重）
// GET  /api/city-footprint - 获取统计数据
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

// 从请求头尝试获取地理位置（EdgeOne 可能注入）
function getLocationFromHeaders(request) {
  const headers = request.headers
  // 尝试 EdgeOne / 腾讯云常见 header
  const country = headers.get('x-edgeone-ip-country') || headers.get('x-geoip-country') || ''
  const city = headers.get('x-edgeone-ip-city') || headers.get('x-geoip-city') || ''
  const region = headers.get('x-edgeone-ip-region') || headers.get('x-geoip-region') || ''
  const lat = parseFloat(headers.get('x-edgeone-ip-lat') || headers.get('x-geoip-lat') || '0')
  const lng = parseFloat(headers.get('x-edgeone-ip-lng') || headers.get('x-geoip-lng') || '0')
  if (country || city) return { country, city, lat, lng }
  return null
}

// 用 ipapi.co 定位（免费版 HTTPS，1000次/天）
async function locateByApi(ip) {
  try {
    const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'
    const res = await fetch(url, {
      headers: { 'User-Agent': 'mint4-class/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown',
      lat: data.latitude || 0,
      lng: data.longitude || 0,
    }
  } catch { return null }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  try { await ensureDb(env) } catch { return corsResponse({ error: '数据库连接失败' }, 503) }

  const sql = getSql(env)

  if (request.method === 'POST') {
    const ip = getClientIp(request)
    const ipHash = await hashIp(ip)

    // 30分钟内同IP不重复记录
    const recent = await sql`
      SELECT id FROM city_visits
      WHERE ip_hash = ${ipHash} AND visited_at > NOW() - INTERVAL '30 minutes'
      LIMIT 1
    `
    if (recent.length > 0) return corsResponse({ message: 'already tracked', skipped: true })

    // 获取地理位置
    let loc = getLocationFromHeaders(request)
    if (!loc || !loc.city) {
      loc = await locateByApi(ip)
    }
    if (!loc) loc = { country: 'Unknown', city: 'Unknown', lat: 0, lng: 0 }

    await sql`
      INSERT INTO city_visits (ip_hash, country, city, lat, lng)
      VALUES (${ipHash}, ${loc.country}, ${loc.city}, ${loc.lat}, ${loc.lng})
    `
    return corsResponse({ message: 'tracked', city: loc.city }, 201)
  }

  // GET: 统计
  // 本月访问次数（按 ip_hash 去重，30分钟窗口）
  const totalResult = await sql`
    SELECT COUNT(DISTINCT ip_hash)::int as total
    FROM city_visits
    WHERE visited_at >= DATE_TRUNC('month', NOW())
  `

  // 已点亮城市数
  const citiesResult = await sql`
    SELECT COUNT(DISTINCT city)::int as count
    FROM city_visits
    WHERE city != 'Unknown' AND city != ''
  `

  // TOP 城市列表
  const topCities = await sql`
    SELECT city, country, lat, lng, COUNT(DISTINCT ip_hash)::int as visits
    FROM city_visits
    WHERE city != 'Unknown' AND city != ''
    GROUP BY city, country, lat, lng
    ORDER BY visits DESC
    LIMIT 20
  `

  // 所有点亮的城市（用于地图标点）
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
