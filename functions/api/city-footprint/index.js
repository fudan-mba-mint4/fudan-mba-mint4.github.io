// 城市足迹 API
// GET  /api/city-footprint - 统计 + 城市光点
// POST /api/city-footprint - 记录一次访问（静默，30 分钟去重）
//
// 关键设计：
// 1. 部署架构：浏览器 -> Cloudflare CDN(橙云) -> EdgeOne Pages Functions -> Neon Postgres
//    - 当 Cloudflare 代理时，EdgeOne 看到的 TCP 来源是 Cloudflare 边缘 IP，
//      因此 request.eo.geo 解析到的是 Cloudflare 机房位置，而非真实访客位置。
//    - 真实访客 IP 在 cf-connecting-ip / x-forwarded-for 中。
//    - Cloudflare 免费版提供 cf-ipcountry（仅国家），不提供城市。
// 2. geo 解析优先级：
//    a) 未走 CF 代理（无 cf-connecting-ip）：直接用 request.eo.geo（EdgeOne 原生，含城市/经纬度）。
//    b) 走了 CF 代理：国家用 cf-ipcountry；城市/经纬度用真实 IP 做一次 best-effort
//       的免费 IP 归属地查询（ip-api.com），失败则降级为 country-only（city=Unknown, lat/lng=0）。
//    c) 若 request.eo.geo.cityName 本身为空/Unknown（EdgeOne 免费 geo 经常如此，
//       官方 demo 中深圳 IP 也返回 cityName=Unknown），同样触发外部查询兜底。
// 3. Neon 免费版 ~5 分钟空闲休眠，冷启动 ~0.4~1.2s（偶发数秒）。
//    - @neondatabase/serverless HTTP 驱动每次查询都是一次 fetch，无连接复用问题。
//    - 对每条 SQL 加 8s 超时 + 一次重试，避免冷启动偶发失败被静默吞掉。
// 4. 所有响应带 Cache-Control: no-store，防止 CDN（Cloudflare/EdgeOne）把 API 当静态资源缓存。
import { getSql, initDatabase, hashIp, getClientIp, corsResponse, optionsResponse } from '../../_utils.js'

let dbReady = false
let initPromise = null
async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    await initDatabase(env)
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
      await sql`CREATE INDEX IF NOT EXISTS idx_city_visits_ip_time ON city_visits (ip_hash, visited_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS idx_city_visits_city ON city_visits (city)`
    } catch (e) { /* 表/索引已存在则忽略 */ }
    dbReady = true
  })()
  return initPromise
}

// 统一 API 响应：在 CORS 基础上加 no-store，避免 CDN 缓存 API
function apiResponse(data, status = 200) {
  const res = corsResponse(data, status)
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  res.headers.set('CDN-Cache-Control', 'no-store')
  res.headers.set('Surrogate-Control', 'no-store')
  return res
}

// 带超时 + 一次重试的 SQL 执行（应对 Neon 冷启动偶发慢/失败）
// queryFn 是一个 thunk，调用时返回 Promise（因 neon sql 是 tagged template，
// 必须以 () => sql`...` 形式传入，才能支持超时后重新执行）
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
    // 冷启动首次偶发失败，等 400ms 重试一次
    await new Promise(r => setTimeout(r, 400))
    return await runSql(queryFn, tag, 1)
  }
}

// best-effort 外部 IP 归属地查询（免费，无 key，非商用 45 次/分钟足够班级站使用）
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
      region: j.regionName || '',
      lat: parseFloat(j.lat) || 0,
      lng: parseFloat(j.lon) || 0,
    }
  } catch (e) {
    return null
  }
}

// 解析访客地理位置（见文件头注释）
async function resolveGeo(request, realIp) {
  const headers = request.headers
  const cfProxy = !!(headers.get('cf-connecting-ip') || headers.get('cf-ipcountry'))
  const eoGeo = (request.eo && request.eo.geo) || {}

  // 国家：CF 代理时 cf-ipcountry 才是访客国家；否则用 EdgeOne 原生
  let country = ''
  if (cfProxy) {
    country = headers.get('cf-ipcountry') || ''
    if (country === 'XX' || country === 'T1') country = ''
  }
  if (!country) country = eoGeo.countryCodeAlpha2 || ''

  // 城市/经纬度：
  // - 非 CF 代理：直接信任 EdgeOne 原生
  // - CF 代理 或 EdgeOne 原生 cityName 缺失：用真实 IP 外部查询兜底
  let city = ''
  let lat = parseFloat(eoGeo.latitude || '0') || 0
  let lng = parseFloat(eoGeo.longitude || '0') || 0

  const eoCity = eoGeo.cityName && eoGeo.cityName !== 'Unknown' ? eoGeo.cityName : ''

  if (!cfProxy && eoCity) {
    city = eoCity
  } else {
    const ext = await lookupIpGeo(realIp)
    if (ext) {
      city = ext.city || ''
      lat = ext.lat || 0
      lng = ext.lng || 0
      if (!country && ext.country) country = ext.country
    } else if (!cfProxy && eoCity) {
      city = eoCity
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

  try {
    await ensureDb(env)
  } catch (e) {
    return apiResponse({ error: 'db init fail', detail: String(e) }, 503)
  }
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
      // 30 分钟内已有有效城市记录 → 直接跳过，不重复写入
      if (recent.length > 0 && recent[0].city && recent[0].city !== 'Unknown') {
        return apiResponse({ message: 'already tracked', skipped: true })
      }

      const loc = await resolveGeo(request, ip)

      if (recent.length > 0) {
        // 上次是 Unknown（geo 失败），现在补全
        await runSqlWithRetry(() => sql`UPDATE city_visits SET country=${loc.country}, city=${loc.city}, lat=${loc.lat}, lng=${loc.lng}, visited_at=NOW() WHERE id=${recent[0].id}`, 'update')
      } else {
        await runSqlWithRetry(() => sql`INSERT INTO city_visits (ip_hash, country, city, lat, lng) VALUES (${ipHash}, ${loc.country}, ${loc.city}, ${loc.lat}, ${loc.lng})`, 'insert')
      }
      return apiResponse({ message: 'tracked', city: loc.city }, 201)
    }

    // GET 统计
    const totalResult = await runSqlWithRetry(() => sql`SELECT COUNT(DISTINCT ip_hash)::int as total FROM city_visits WHERE visited_at >= DATE_TRUNC('month', NOW())`, 'total')
    const citiesResult = await runSqlWithRetry(() => sql`SELECT COUNT(DISTINCT city)::int as count FROM city_visits WHERE city != 'Unknown' AND city != ''`, 'citycount')
    // 按 city+country 聚合（同一城市不同次写入的经纬度可能略有偏差，取均值避免分裂成多个光点）
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
