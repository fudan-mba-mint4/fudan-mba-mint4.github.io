// 城市足迹 API（Cloudflare Pages Functions）
// GET  /api/city-footprint - 统计 + 城市光点
// POST /api/city-footprint - 记录一次访问（静默，30 分钟去重）
//
// 部署架构：浏览器 -> Cloudflare 边缘 -> Pages Function -> Neon Postgres
// 函数就跑在 CF 边缘，context.request.cf 由 CF 直接解析出真实访客的
// country / city / latitude / longitude（cf-connecting-ip 为真实访客 IP），
// 无需任何外部 IP 归属地查询服务。
import { getSql, hashIp, getClientIp, corsResponse, optionsResponse } from '../../_utils.js'

// 统一 API 响应：no-store，避免 CDN 缓存 API
function apiResponse(data, status = 200) {
  const res = corsResponse(data, status)
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  res.headers.set('CDN-Cache-Control', 'no-store')
  return res
}

// 带超时的 SQL 执行（应对 Neon 冷启动）；queryFn 为返回 Promise 的 thunk
async function runSql(queryFn, tag, attempt = 0) {
  const timeoutMs = attempt === 0 ? 8000 : 12000
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`sql timeout (${tag})`)), timeoutMs)
  })
  try {
    return await Promise.race([Promise.resolve(queryFn()), timeout])
  } finally {
    clearTimeout(timer)
  }
}
async function runSqlWithRetry(queryFn, tag) {
  try {
    return await runSql(queryFn, tag, 0)
  } catch (e) {
    await new Promise(r => setTimeout(r, 400))
    return await runSql(queryFn, tag, 1)
  }
}

// best-effort 外部 IP 归属地查询，仅在 CF geo 缺失时兜底
async function lookupIpGeo(ip) {
  if (!ip || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|::1|0\.0\.0\.0)/.test(ip)) {
    return null
  }
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 1500)
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,regionName,city,lat,lon`, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'mint4-city-footprint/1.0' },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const j = await res.json()
    if (j.status !== 'success') return null
    return {
      city: j.city || '',
      country: j.countryCode || '',
      lat: parseFloat(j.lat) || 0,
      lng: parseFloat(j.lon) || 0,
    }
  } catch (e) {
    return null
  }
}

// 解析访客地理位置：优先 CF 原生 request.cf，缺失时用真实 IP 外部查询兜底
async function resolveGeo(request, realIp) {
  const cf = request.cf || {}
  let country = (cf.country || '').toUpperCase()
  if (country === 'XX' || country === 'T1') country = ''
  let city = cf.city || ''
  let lat = parseFloat(cf.latitude || cf.lat || '0') || 0
  let lng = parseFloat(cf.longitude || cf.lon || '0') || 0

  const cfCityOk = city && city !== 'Unknown' && (lat || lng)
  if (!cfCityOk) {
    const ext = await lookupIpGeo(realIp)
    if (ext) {
      city = ext.city || city
      lat = ext.lat || lat
      lng = ext.lng || lng
      if (!country && ext.country) country = ext.country
    }
  }

  return {
    country: country || 'Unknown',
    city: city || 'Unknown',
    lat, lng,
  }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  const sql = getSql(env)

  try {
    if (request.method === 'POST') {
      const ip = getClientIp(request)
      const ipHash = await hashIp(ip)

      // 30 分钟去重窗口
      const recent = await runSqlWithRetry(() => sql`
        SELECT id, city FROM city_visits
        WHERE ip_hash = ${ipHash} AND visited_at > NOW() - INTERVAL '30 minutes'
        ORDER BY visited_at DESC LIMIT 1
      `, 'dedup')
      if (recent.length > 0 && recent[0].city && recent[0].city !== 'Unknown') {
        return apiResponse({ message: 'already tracked', skipped: true })
      }

      const loc = await resolveGeo(request, ip)

      if (recent.length > 0) {
        await runSqlWithRetry(() => sql`UPDATE city_visits SET country=${loc.country}, city=${loc.city}, lat=${loc.lat}, lng=${loc.lng}, visited_at=NOW() WHERE id=${recent[0].id}`, 'update')
      } else {
        await runSqlWithRetry(() => sql`INSERT INTO city_visits (ip_hash, country, city, lat, lng) VALUES (${ipHash}, ${loc.country}, ${loc.city}, ${loc.lat}, ${loc.lng})`, 'insert')
      }
      return apiResponse({ message: 'tracked', city: loc.city }, 201)
    }

    // GET 统计
    const totalResult = await runSqlWithRetry(() => sql`SELECT COUNT(DISTINCT ip_hash)::int as total FROM city_visits WHERE visited_at >= DATE_TRUNC('month', NOW())`, 'total')
    const citiesResult = await runSqlWithRetry(() => sql`SELECT COUNT(DISTINCT city)::int as count FROM city_visits WHERE city != 'Unknown' AND city != ''`, 'citycount')
    // 按 city+country 聚合，经纬度取均值，避免同一城市分裂成多个光点
    const topCities = await runSqlWithRetry(() => sql`SELECT city, country, ROUND(AVG(lat)::numeric, 4)::float as lat, ROUND(AVG(lng)::numeric, 4)::float as lng, COUNT(DISTINCT ip_hash)::int as visits FROM city_visits WHERE city != 'Unknown' AND city != '' GROUP BY city, country ORDER BY visits DESC LIMIT 20`, 'top')
    const allCities = await runSqlWithRetry(() => sql`SELECT city, country, ROUND(AVG(lat)::numeric, 4)::float as lat, ROUND(AVG(lng)::numeric, 4)::float as lng, COUNT(DISTINCT ip_hash)::int as visits FROM city_visits WHERE city != 'Unknown' AND city != '' AND lat != 0 GROUP BY city, country`, 'all')
    return apiResponse({
      total: totalResult[0]?.total || 0,
      cityCount: citiesResult[0]?.count || 0,
      topCities,
      allCities,
    })
  } catch (e) {
    return apiResponse({ error: 'internal', detail: String(e) }, 500)
  }
}
