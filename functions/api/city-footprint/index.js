// 城市足迹 API（Cloudflare Pages Functions）
// GET  /api/city-footprint - 统计 + 城市光点
// POST /api/city-footprint - 记录一次访问（静默，30 分钟去重）
//
// 部署架构：浏览器 -> Cloudflare 边缘（橙云代理）-> Pages Function -> Neon Postgres
// 橙云代理不影响定位：cf-connecting-ip 与 request.cf 均基于【真实访客 IP】解析。
// 访客自身挂 VPN 时只能看到 VPN 出口，故通过 ASN 黑名单 + ip-api 风险字段过滤机房/代理。
import { getSql, hashIp, getClientIp, corsResponse, optionsResponse } from '../../_utils.js'

// ── 机房 / 云主机 / 常见 VPN 服务商 ASN 黑名单（命中即判定为非真实访客，不记录）──
const HOSTING_ASN = new Set([
  // Amazon AWS
  16509, 14618, 16511, 10205, 19062, 38895, 9059, 13321, 19061, 140503,
  // Google
  15169, 396982, 36384, 16591, 19527, 22859, 36492, 13949, 19528, 26616,
  // Microsoft / Azure
  8075, 8068, 8069, 58593, 3598, 12076, 200530,
  // DigitalOcean
  14061,
  // Linode / Akamai
  63947, 63949, 20940, 16625, 35916, 35913, 35994, 36183, 36351, 46185, 23454, 43639,
  // OVH
  16276, 35540, 198406, 62540, 50093,
  // Hetzner
  24940, 213230, 212317, 214587, 215311, 216357,
  // Choopa / Vultr
  20473, 397213,
  // M247（大量 VPN 使用）
  9009, 62904, 62831, 62873, 62900, 62908,
  // 阿里云国际 / 腾讯云国际
  45102, 37963, 134963, 140063, 132203, 45090,
  // Oracle Cloud
  31898, 7160, 11391, 61429,
  // Scaleway
  12876, 29169, 203220, 204162, 211282, 215018, 215553,
  // IBM / Salesforce
  13888, 30083, 14340, 43247,
  // ColoCrossing / DataCamp(CDN77) / FranTech / Clouvider / Webzilla / Hostwinds
  36352, 60068, 212238, 53667, 62282, 35415, 55286,
  // Leaseweb / GoDaddy / Namecheap / Unified Layer
  60781, 7203, 206787, 206758, 206488, 203020,
  26496, 20013, 398101, 40044, 32557, 22612, 35186, 46606, 46562,
  // Fastly / Cloudflare / GitHub
  54113, 13335, 209242, 36459,
])

// ASN 未覆盖时，用 asOrganization 英文名称兜底（仅匹配明确云厂商，避免误杀真实企业）
const HOSTING_ORG = /amazon\.com|amazon technologies|google llc|microsoft corporation|digitalocean|linode|ovh sas|hetzner|choopa|vultr|m247|scaleway|colocrossing|datacamp|cloudvider|frantech|oracle cloud|leaseweb|tencent cloud|alibaba ?\(us\)|alibaba llc/i

function isDatacenter(request) {
  const cf = request.cf || {}
  const asn = parseInt(cf.asn || 0, 10)
  if (asn && HOSTING_ASN.has(asn)) return true
  const org = String(cf.asOrganization || cf.organization || '')
  if (org && HOSTING_ORG.test(org)) return true
  return false
}

// ── 直辖市的区 / 镇归并到市（写入前归一，避免同一城市分裂）──
const SH_AREAS = new Set([
  'Pudong', 'Minhang', 'Jiading', 'Songjiang', 'Baoshan', 'Jiangchuanlu', 'Pujiang',
  'Kangqiao', 'Changqiao', 'Qingpu', 'Fengxian', 'Jinshan', 'Chongming', 'Xuhui',
  "Jing'an", 'Huangpu', 'Putuo', 'Changning', 'Hongkou', 'Yangpu', 'Zhabei', 'Jingan',
])
const BJ_AREAS = new Set([
  'Haidian', 'Chaoyang', 'Dongcheng', 'Xicheng', 'Fengtai', 'Shijingshan', 'Mentougou',
  'Fangshan', 'Tongzhou', 'Shunyi', 'Daxing', 'Changping', 'Pinggu', 'Huairou',
  'Miyun', 'Yanqing',
])
function normalizeCity(city) {
  if (!city) return city
  if (SH_AREAS.has(city)) return 'Shanghai'
  if (BJ_AREAS.has(city)) return 'Beijing'
  return city
}

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

// 内网 / 本机地址
const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|::1|0\.0\.0\.0)/

// best-effort 外部 IP 归属地 + 风险检测，仅在 CF geo 缺失时兜底
// DB 统一存英文规范名（用于聚合），中文由前端映射；此处只取 proxy/hosting 风险标记
async function lookupIpGeo(ip) {
  if (!ip || PRIVATE_IP.test(ip)) return null
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 1800)
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,city,lat,lon,proxy,hosting,mobile`,
      { signal: ctrl.signal, headers: { 'User-Agent': 'mint4-city-footprint/1.0' } },
    )
    clearTimeout(timer)
    if (!res.ok) return null
    const j = await res.json()
    if (j.status !== 'success') return null
    return {
      city: j.city || '',
      country: j.countryCode || '',
      lat: parseFloat(j.lat) || 0,
      lng: parseFloat(j.lon) || 0,
      isProxy: !!j.proxy,
      isHosting: !!j.hosting,
    }
  } catch (e) {
    return null
  }
}

// 解析访客地理位置：优先 CF 原生 request.cf，缺失用真实 IP 外部查询；写入前归并区镇
async function resolveGeo(request, realIp) {
  const cf = request.cf || {}
  let country = (cf.country || '').toUpperCase()
  if (country === 'XX' || country === 'T1') country = ''
  let city = cf.city || ''
  let lat = parseFloat(cf.latitude || cf.lat || '0') || 0
  let lng = parseFloat(cf.longitude || cf.lon || '0') || 0
  let isProxy = false
  let isHosting = false

  const cfCityOk = city && city !== 'Unknown' && (lat || lng)
  if (!cfCityOk) {
    const ext = await lookupIpGeo(realIp)
    if (ext) {
      city = ext.city || city
      lat = ext.lat || lat
      lng = ext.lng || lng
      isProxy = ext.isProxy
      isHosting = ext.isHosting
      if (!country && ext.country) country = ext.country
    }
  }

  city = normalizeCity(city)
  return {
    country: country || 'Unknown',
    city: city || 'Unknown',
    lat, lng, isProxy, isHosting,
  }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  const sql = getSql(env)

  try {
    if (request.method === 'POST') {
      // 本地 / 手动开关：CITY_TRACK=off 时不写入（GET 不受影响），避免本地测试污染生产库
      if (env.CITY_TRACK === 'off')
        return apiResponse({ message: 'tracking disabled', skipped: true })

      const ip = getClientIp(request)

      // 机房 / 云主机 / VPN ASN 直接跳过（不记录）
      if (isDatacenter(request))
        return apiResponse({ message: 'datacenter/proxy ip skipped', skipped: true, reason: 'datacenter' })

      const ipHash = await hashIp(ip)

      // 30 分钟去重窗口
      const recent = await runSqlWithRetry(() => sql`
        SELECT id, city FROM city_visits
        WHERE ip_hash = ${ipHash} AND visited_at > NOW() - INTERVAL '30 minutes'
        ORDER BY visited_at DESC LIMIT 1
      `, 'dedup')
      if (recent.length > 0 && recent[0].city && recent[0].city !== 'Unknown')
        return apiResponse({ message: 'already tracked', skipped: true })

      const loc = await resolveGeo(request, ip)

      // ip-api 兜底识别出代理 / 机房则跳过
      if (loc.isProxy || loc.isHosting)
        return apiResponse({ message: 'proxy/hosting ip skipped', skipped: true, reason: 'proxy' })

      if (recent.length > 0) {
        await runSqlWithRetry(() => sql`
          UPDATE city_visits SET country=${loc.country}, city=${loc.city}, lat=${loc.lat}, lng=${loc.lng}, visited_at=NOW()
          WHERE id=${recent[0].id}
        `, 'update')
      } else {
        await runSqlWithRetry(() => sql`
          INSERT INTO city_visits (ip_hash, country, city, lat, lng)
          VALUES (${ipHash}, ${loc.country}, ${loc.city}, ${loc.lat}, ${loc.lng})
        `, 'insert')
      }
      return apiResponse({ message: 'tracked', city: loc.city }, 201)
    }

    // GET 统计
    const totalResult = await runSqlWithRetry(() => sql`
      SELECT COUNT(DISTINCT ip_hash)::int as total
      FROM city_visits WHERE visited_at >= DATE_TRUNC('month', NOW())
    `, 'total')
    const citiesResult = await runSqlWithRetry(() => sql`
      SELECT COUNT(DISTINCT city)::int as count
      FROM city_visits WHERE city != 'Unknown' AND city != ''
    `, 'citycount')
    // 按 city+country 聚合，经纬度取均值，避免同一城市分裂成多个光点
    const topCities = await runSqlWithRetry(() => sql`
      SELECT city, country, ROUND(AVG(lat)::numeric, 4)::float as lat, ROUND(AVG(lng)::numeric, 4)::float as lng,
             COUNT(DISTINCT ip_hash)::int as visits
      FROM city_visits WHERE city != 'Unknown' AND city != ''
      GROUP BY city, country ORDER BY visits DESC LIMIT 20
    `, 'top')
    const allCities = await runSqlWithRetry(() => sql`
      SELECT city, country, ROUND(AVG(lat)::numeric, 4)::float as lat, ROUND(AVG(lng)::numeric, 4)::float as lng,
             COUNT(DISTINCT ip_hash)::int as visits
      FROM city_visits WHERE city != 'Unknown' AND city != '' AND lat != 0
      GROUP BY city, country
    `, 'all')
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
