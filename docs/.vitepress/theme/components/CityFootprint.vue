<template>
  <div class="city-footprint-page">
    <div class="cf-container">
      <!-- 左侧面板 -->
      <div class="cf-panel">
        <h1 class="cf-title">城市足迹</h1>
        <p class="cf-subtitle">从复旦出发，被更多地方看见。</p>

        <div class="cf-stats">
          <div class="cf-stat">
            <div class="cf-stat-num">{{ stats.total }}</div>
            <div class="cf-stat-label">本月访问次数</div>
          </div>
          <div class="cf-stat">
            <div class="cf-stat-num">{{ stats.cityCount }}</div>
            <div class="cf-stat-label">已点亮地区</div>
          </div>
        </div>

        <div class="cf-top-list">
          <div
            v-for="(city, i) in stats.topCities"
            :key="city.city"
            class="cf-top-item"
          >
            <span class="cf-top-rank">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="cf-top-name">{{ zhCity(city.city) }}</span>
            <span class="cf-top-count">{{ city.visits }}</span>
          </div>
          <div v-if="!stats.topCities.length" class="cf-empty">
            暂无数据，等待第一位访客点亮
          </div>
        </div>

        <p class="cf-note">同一浏览器30分钟内计为一次访问；不公开或保存原始IP。</p>
      </div>

      <!-- 右侧地图 -->
      <div class="cf-map-area">
        <canvas ref="mapCanvas" class="cf-map"></canvas>
        <div v-if="loading" class="cf-loading">加载地图中...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

import { API_PREFIX } from '../composables/apiConfig.js'

const stats = ref({
  total: 0,
  cityCount: 0,
  topCities: [],
  allCities: [],
})
const loading = ref(true)
const mapCanvas = ref(null)
const worldGeo = ref(null)
let resizeObserver = null
let animFrame = null
let htmlObserver = null
let lastDark = null
let mounted = false

// 带超时的 fetch（8s），避免 Neon 冷启动时挂起
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetchWithRetry(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

// 城市名/国家名中英文映射
// 中国城市拼音→中文（ip-api.com返回的都是拼音）
const CITY_ZH = {
  // 直辖市
  'Beijing': '北京', 'Shanghai': '上海', 'Tianjin': '天津', 'Chongqing': '重庆',
  // 华北
  'Shijiazhuang': '石家庄', 'Tangshan': '唐山', 'Qinhuangdao': '秦皇岛', 'Handan': '邯郸',
  'Taiyuan': '太原', 'Datong': '大同', 'Hohhot': '呼和浩特', 'Baotou': '包头', 'Ordos': '鄂尔多斯',
  // 东北
  'Shenyang': '沈阳', 'Dalian': '大连', 'Anshan': '鞍山',
  'Changchun': '长春', 'Jilin': '吉林市', 'Harbin': '哈尔滨', 'Daqing': '大庆',
  // 华东
  'Nanjing': '南京', 'Suzhou': '苏州', 'Wuxi': '无锡', 'Changzhou': '常州', 'Nantong': '南通',
  'Xuzhou': '徐州', 'Yangzhou': '扬州', 'Yancheng': '盐城', 'Zhenjiang': '镇江', 'Huai\'an': '淮安',
  'Hangzhou': '杭州', 'Ningbo': '宁波', 'Wenzhou': '温州', 'Jiaxing': '嘉兴', 'Huzhou': '湖州',
  'Shaoxing': '绍兴', 'Jinhua': '金华', 'Yiwu': '义乌', 'Taizhou': '台州', 'Quzhou': '衢州', 'Zhoushan': '舟山',
  'Hefei': '合肥', 'Wuhu': '芜湖', 'Maanshan': '马鞍山', 'Bengbu': '蚌埠',
  'Fuzhou': '福州', 'Xiamen': '厦门', 'Quanzhou': '泉州', 'Putian': '莆田',
  'Nanchang': '南昌', 'Jiujiang': '九江', 'Ganzhou': '赣州',
  'Jinan': '济南', 'Qingdao': '青岛', 'Yantai': '烟台', 'Zibo': '淄博', 'Weifang': '潍坊',
  'Dongying': '东营', 'Linyi': '临沂', 'Taian': '泰安', 'Weihai': '威海',
  // 华中
  'Zhengzhou': '郑州', 'Luoyang': '洛阳', 'Kaifeng': '开封',
  'Wuhan': '武汉', 'Yichang': '宜昌', 'Xiangyang': '襄阳',
  'Changsha': '长沙', 'Zhuzhou': '株洲', 'Xiangtan': '湘潭',
  // 华南
  'Guangzhou': '广州', 'Shenzhen': '深圳', 'Dongguan': '东莞', 'Foshan': '佛山',
  'Zhuhai': '珠海', 'Zhongshan': '中山', 'Huizhou': '惠州',
  'Nanning': '南宁', 'Guilin': '桂林',
  'Haikou': '海口', 'Sanya': '三亚',
  // 西南
  'Chengdu': '成都', 'Mianyang': '绵阳',
  'Chongqing': '重庆',
  'Kunming': '昆明', 'Dali': '大理', 'Lijiang': '丽江',
  'Guiyang': '贵阳',
  'Lhasa': '拉萨',
  // 西北
  "Xi'an": '西安', 'Xian': '西安', 'Baoji': '宝鸡',
  'Lanzhou': '兰州', 'Xining': '西宁', 'Yinchuan': '银川',
  'Urumqi': '乌鲁木齐',
  // 港澳台
  'Hong Kong': '香港', 'Macau': '澳门',
  'Taipei': '台北', 'New Taipei': '新北', 'Taichung': '台中', 'Kaohsiung': '高雄', 'Tainan': '台南',
  // 上海辖区
  'Pudong': '上海·浦东', 'Minhang': '上海·闵行', 'Jiangchuanlu': '上海·江川路',
  'Jiading': '上海·嘉定', 'Songjiang': '上海·松江', 'Baoshan': '上海·宝山',
  // 外国常见
  'Singapore': '新加坡', 'Tokyo': '东京', 'Osaka': '大阪',
  'Seoul': '首尔', 'Busan': '釜山',
  'Bangkok': '曼谷', 'Chiang Mai': '清迈',
  'London': '伦敦', 'Paris': '巴黎', 'Berlin': '柏林',
  'New York': '纽约', 'Los Angeles': '洛杉矶', 'San Francisco': '旧金山',
  'Sydney': '悉尼', 'Melbourne': '墨尔本', 'Toronto': '多伦多', 'Vancouver': '温哥华',
  // 日本
  'Yokohama': '横滨', 'Nagoya': '名古屋', 'Sapporo': '札幌', 'Kobe': '神户', 'Kyoto': '京都',
  'Fukuoka': '福冈', 'Kawasaki': '川崎', 'Saitama': '埼玉', 'Hiroshima': '广岛', 'Sendai': '仙台',
  'Chiba': '千叶', 'Kitakyushu': '北九州', 'Sakai': '堺市', 'Niigata': '新潟', 'Hamamatsu': '滨松',
  'Shizuoka': '静冈', 'Sagamihara': '相模原', 'Okayama': '冈山', 'Kumamoto': '熊本',
  'Sasayama': '篠山',
  // 韩国
  'Incheon': '仁川', 'Daegu': '大邱', 'Daejeon': '大田', 'Gwangju': '光州', 'Ulsan': '蔚山',
  'Suwon': '水原', 'Changwon': '昌原', 'Seongnam': '城南', 'Goyang': '高阳', 'Yongin': '龙仁',
  'Cheongju': '清州', 'Jeonju': '全州', 'Cheonan': '天安',
  // 东南亚
  'Kuala Lumpur': '吉隆坡', 'George Town': '乔治市', 'Johor Bahru': '新山', 'Ipoh': '怡保',
  'Manila': '马尼拉', 'Cebu': '宿务', 'Davao': '达沃', 'Jakarta': '雅加达', 'Surabaya': '泗水',
  'Bandung': '万隆', 'Medan': '棉兰', 'Hanoi': '河内', 'Ho Chi Minh City': '胡志明市',
  'Da Nang': '岘港', 'Haiphong': '海防', 'Phnom Penh': '金边', 'Siem Reap': '暹粒',
  'Vientiane': '万象', 'Yangon': '仰光', 'Naypyidaw': '内比都',
  // 南亚
  'Mumbai': '孟买', 'Delhi': '德里', 'Bangalore': '班加罗尔', 'Chennai': '金奈',
  'Kolkata': '加尔各答', 'Hyderabad': '海得拉巴', 'Ahmedabad': '艾哈迈达巴德',
  'Pune': '浦那', 'Jaipur': '斋浦尔', 'Lahore': '拉合尔', 'Karachi': '卡拉奇',
  'Dhaka': '达卡', 'Colombo': '科伦坡', 'Kathmandu': '加德满都',
  // 中东
  'Dubai': '迪拜', 'Abu Dhabi': '阿布扎比', 'Riyadh': '利雅得', 'Jeddah': '吉达',
  'Doha': '多哈', 'Kuwait City': '科威特城', 'Muscat': '马斯喀特', 'Amman': '安曼',
  'Beirut': '贝鲁特', 'Tel Aviv': '特拉维夫', 'Jerusalem': '耶路撒冷', 'Istanbul': '伊斯坦布尔',
  'Ankara': '安卡拉',
  // 欧洲
  'Manchester': '曼彻斯特', 'Birmingham': '伯明翰', 'Liverpool': '利物浦', 'Edinburgh': '爱丁堡',
  'Glasgow': '格拉斯哥', 'Dublin': '都柏林', 'Marseille': '马赛', 'Lyon': '里昂',
  'Nice': '尼斯', 'Bordeaux': '波尔多', 'Munich': '慕尼黑', 'Frankfurt': '法兰克福',
  'Hamburg': '汉堡', 'Cologne': '科隆', 'Düsseldorf': '杜塞尔多夫', 'Stuttgart': '斯图加特',
  'Madrid': '马德里', 'Barcelona': '巴塞罗那', 'Valencia': '瓦伦西亚', 'Seville': '塞维利亚',
  'Milan': '米兰', 'Rome': '罗马', 'Naples': '那不勒斯', 'Turin': '都灵', 'Florence': '佛罗伦萨',
  'Venice': '威尼斯', 'Amsterdam': '阿姆斯特丹', 'Rotterdam': '鹿特丹', 'Brussels': '布鲁塞尔',
  'Zurich': '苏黎世', 'Geneva': '日内瓦', 'Vienna': '维也纳', 'Salzburg': '萨尔茨堡',
  'Stockholm': '斯德哥尔摩', 'Gothenburg': '哥德堡', 'Oslo': '奥斯陆', 'Bergen': '卑尔根',
  'Copenhagen': '哥本哈根', 'Helsinki': '赫尔辛基', 'Reykjavik': '雷克雅未克',
  'Warsaw': '华沙', 'Krakow': '克拉科夫', 'Prague': '布拉格', 'Budapest': '布达佩斯',
  'Bucharest': '布加勒斯特', 'Sofia': '索非亚', 'Athens': '雅典', 'Lisbon': '里斯本',
  'Porto': '波尔图', 'Moscow': '莫斯科', 'St Petersburg': '圣彼得堡', 'Kiev': '基辅',
  // 北美
  'Chicago': '芝加哥', 'Houston': '休斯顿', 'Phoenix': '凤凰城', 'Philadelphia': '费城',
  'San Antonio': '圣安东尼奥', 'San Diego': '圣地亚哥', 'Dallas': '达拉斯', 'San Jose': '圣何塞',
  'Austin': '奥斯汀', 'Jacksonville': '杰克逊维尔', 'Fort Worth': '沃斯堡', 'Columbus': '哥伦布',
  'Charlotte': '夏洛特', 'Indianapolis': '印第安纳波利斯', 'San Francisco': '旧金山',
  'Seattle': '西雅图', 'Denver': '丹佛', 'Boston': '波士顿', 'Nashville': '纳什维尔',
  'Portland': '波特兰', 'Las Vegas': '拉斯维加斯', 'Detroit': '底特律', 'Atlanta': '亚特兰大',
  'Miami': '迈阿密', 'Orlando': '奥兰多', 'Tampa': '坦帕', 'New Orleans': '新奥尔良',
  'Minneapolis': '明尼阿波利斯', 'Salt Lake City': '盐湖城', 'Honolulu': '檀香山',
  'Mexico City': '墨西哥城', 'Guadalajara': '瓜达拉哈拉', 'Monterrey': '蒙特雷',
  // 南美
  'São Paulo': '圣保罗', 'Rio de Janeiro': '里约热内卢', 'Brasilia': '巴西利亚',
  'Buenos Aires': '布宜诺斯艾利斯', 'Santiago': '圣地亚哥', 'Lima': '利马',
  'Bogota': '波哥大', 'Caracas': '加拉加斯', 'Montevideo': '蒙得维的亚', 'Asuncion': '亚松森',
  'La Paz': '拉巴斯', 'Quito': '基多', 'Guayaquil': '瓜亚基尔',
  // 大洋洲
  'Brisbane': '布里斯班', 'Perth': '珀斯', 'Adelaide': '阿德莱德', 'Gold Coast': '黄金海岸',
  'Auckland': '奥克兰', 'Wellington': '惠灵顿', 'Christchurch': '基督城',
  // 非洲
  'Cairo': '开罗', 'Alexandria': '亚历山大', 'Cape Town': '开普敦', 'Johannesburg': '约翰内斯堡',
  'Lagos': '拉各斯', 'Nairobi': '内罗毕', 'Casablanca': '卡萨布兰卡', 'Tunis': '突尼斯',
  'Addis Ababa': '亚的斯亚贝巴',
}

// 国家代码→中文
const COUNTRY_ZH = {
  'CN': '中国', 'China': '中国',
  'TW': '中国台湾', 'Taiwan': '中国台湾',
  'HK': '中国香港', 'Hong Kong': '中国香港',
  'MO': '中国澳门', 'Macau': '中国澳门',
  'JP': '日本', 'Japan': '日本',
  'KR': '韩国', 'South Korea': '韩国', 'Korea, Republic of': '韩国',
  'KP': '朝鲜',
  'SG': '新加坡', 'Singapore': '新加坡',
  'MY': '马来西亚', 'Malaysia': '马来西亚',
  'TH': '泰国', 'Thailand': '泰国',
  'VN': '越南', 'Vietnam': '越南',
  'ID': '印度尼西亚', 'Indonesia': '印度尼西亚',
  'PH': '菲律宾', 'Philippines': '菲律宾',
  'IN': '印度', 'India': '印度',
  'PK': '巴基斯坦',
  'BD': '孟加拉国',
  'LK': '斯里兰卡',
  'NP': '尼泊尔',
  'US': '美国', 'United States': '美国',
  'CA': '加拿大', 'Canada': '加拿大',
  'MX': '墨西哥',
  'BR': '巴西',
  'AR': '阿根廷',
  'CL': '智利',
  'CO': '哥伦比亚',
  'PE': '秘鲁',
  'GB': '英国', 'United Kingdom': '英国',
  'IE': '爱尔兰',
  'FR': '法国', 'France': '法国',
  'DE': '德国', 'Germany': '德国',
  'IT': '意大利',
  'ES': '西班牙',
  'PT': '葡萄牙',
  'NL': '荷兰',
  'BE': '比利时',
  'CH': '瑞士',
  'AT': '奥地利',
  'SE': '瑞典',
  'NO': '挪威',
  'DK': '丹麦',
  'FI': '芬兰',
  'PL': '波兰',
  'CZ': '捷克',
  'RU': '俄罗斯',
  'UA': '乌克兰',
  'GR': '希腊',
  'TR': '土耳其',
  'AU': '澳大利亚', 'Australia': '澳大利亚',
  'NZ': '新西兰',
  'EG': '埃及',
  'ZA': '南非',
  'AE': '阿联酋',
  'SA': '沙特阿拉伯',
  'IL': '以色列',
}
function zhCity(name) { return CITY_ZH[name] || name }
function zhCountry(name) { return COUNTRY_ZH[name] || name }

// 经纬度 → canvas坐标（以中国为中心的等距圆柱投影，中央经线110°E）
const CENTER_LNG = 110
function project(lng, lat, w, h) {
  let x = ((lng - CENTER_LNG + 180) / 360) * w
  if (x < 0) x += w
  if (x >= w) x -= w
  return { x, y: ((90 - lat) / 180) * h }
}

function getColors() {
  const isDark = document.documentElement.classList.contains('dark')
  return isDark ? {
    land: 'rgba(94, 196, 172, 0.08)',
    line: 'rgba(94, 196, 172, 0.25)',
    bg: '#111820',
    dot: '#5ec4ac',
    dotGlow: 'rgba(94, 196, 172, 0.6)',
  } : {
    land: 'rgba(45, 122, 108, 0.05)',
    line: 'rgba(45, 122, 108, 0.18)',
    bg: '#f0f4f5',
    dot: '#1ab890',
    dotGlow: 'rgba(26, 184, 144, 0.45)',
  }
}

async function drawMap() {
  if (!mounted) return
  const canvas = mapCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (w === 0 || h === 0) { loading.value = false; return }
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.scale(dpr, dpr)

  const colors = getColors()

  // 背景
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, w, h)

  // 加载 GeoJSON 画大陆轮廓（缓存避免重复 fetch）
  if (!worldGeo.value) {
    try {
      const res = await fetchWithRetry('/data/world.json')
      worldGeo.value = await res.json()
    } catch (e) {
      console.warn('map load failed', e)
      loading.value = false
      return
    }
  }
  if (!mounted) return
  const geo = worldGeo.value

    ctx.fillStyle = colors.land
    ctx.strokeStyle = colors.line
    ctx.lineWidth = 0.5

    for (const feature of geo.features) {
      // 跳过南极洲（跨边缘检测会把它断开），手动画
      const name = (feature.properties?.name || '').toLowerCase()
      if (name.includes('antarctic')) continue

      const coords = feature.geometry.coordinates
      const type = feature.geometry.type

      if (type === 'Polygon') {
        drawPolygon(ctx, coords, w, h)
      } else if (type === 'MultiPolygon') {
        for (const polygon of coords) {
          drawPolygon(ctx, polygon, w, h)
        }
      }
    }

  // 画城市圆点：简单圆点 + 扩散圆环
  const cities = [...stats.value.allCities].filter(c => c.lat && c.lng)
  const dots = cities.map(c => {
    const p = project(parseFloat(c.lng), parseFloat(c.lat), w, h)
    return { ...p, visits: c.visits, name: c.city }
  })

  // 静态部分：背景 + 大陆（animate 里每帧重画，这里只做一次数据准备）
  loading.value = false

  // 动画循环：扩散圆环
  if (animFrame) cancelAnimationFrame(animFrame)
  let t = 0
  const animate = () => {
    if (!mounted) return
    const colors = getColors()
    // 重画背景和大陆
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = colors.land
    ctx.strokeStyle = colors.line
    for (const feature of geo.features) {
      const name = (feature.properties?.name || '').toLowerCase()
      if (name.includes('antarctic')) continue
      const coords = feature.geometry.coordinates
      if (coords[0][0][0] === undefined) continue
      if (feature.geometry.type === 'Polygon') drawPolygon(ctx, coords, w, h)
      else if (feature.geometry.type === 'MultiPolygon') for (const polygon of coords) drawPolygon(ctx, polygon, w, h)
    }

    for (const dot of dots) {
      // 扩散圆环
      const progress = (t % 60) / 60
      const ringR = 4 + progress * 16
      const alpha = (1 - progress) * 0.5
      ctx.strokeStyle = hexToRgba(colors.dot, alpha)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, ringR, 0, Math.PI * 2)
      ctx.stroke()

      // 中心圆点
      ctx.fillStyle = colors.dot
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    t++
    animFrame = requestAnimationFrame(animate)
  }
  animate()
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function drawPolygon(ctx, rings, w, h) {
  for (const ring of rings) {
    if (ring.length < 3) continue
    ctx.beginPath()
    let prevX = null
    let prevY = null
    for (let i = 0; i < ring.length; i++) {
      const p = project(ring[i][0], ring[i][1], w, h)
      if (i === 0) {
        ctx.moveTo(p.x, p.y)
      } else if (prevX !== null && Math.abs(p.x - prevX) > w * 0.5) {
        // 跨越地图左右边缘，断开
        ctx.moveTo(p.x, p.y)
      } else {
        ctx.lineTo(p.x, p.y)
      }
      prevX = p.x
      prevY = p.y
    }
    // 手动闭合，检测首尾是否跨越
    const start = project(ring[0][0], ring[0][1], w, h)
    if (Math.abs(start.x - prevX) <= w * 0.5) {
      ctx.lineTo(start.x, start.y)
    }
    ctx.fill()
    ctx.stroke()
  }
}

// 卸载清理：必须在 setup 顶层注册，否则在 async onMounted 内注册会失效
onUnmounted(() => {
  mounted = false
  if (resizeObserver) resizeObserver.disconnect()
  if (htmlObserver) htmlObserver.disconnect()
  if (animFrame) cancelAnimationFrame(animFrame)
  resizeObserver = null
  htmlObserver = null
  animFrame = null
})

onMounted(async () => {
  mounted = true

  // 1) 记录本次访问（fire-and-forget，不阻塞统计拉取）
  fetchWithTimeout(`${API_PREFIX}/api/city-footprint`, { method: 'POST', keepalive: true }, 8000).catch(() => {})

  // 2) 拉取统计（独立于 POST，避免 Neon 冷启动时 POST 慢拖累 GET）
  try {
    const res = await fetchWithTimeout(`${API_PREFIX}/api/city-footprint`, {}, 8000)
    if (res.ok) {
      const data = await res.json()
      stats.value = data.data || data
    }
  } catch (e) { /* 静默 */ }

  if (!mounted) return
  await drawMap()
  if (!mounted) return

  // 3) 响应式
  resizeObserver = new ResizeObserver(() => { if (mounted) drawMap() })
  resizeObserver.observe(mapCanvas.value)

  // 4) 监听 VitePress 深色模式切换（仅在 dark class 实际变化时重绘）
  lastDark = document.documentElement.classList.contains('dark')
  htmlObserver = new MutationObserver(() => {
    if (!mounted) return
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark !== lastDark) {
      lastDark = isDark
      drawMap()
    }
  })
  htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
</script>

<style scoped>
.city-footprint-page {
  min-height: calc(100vh - 64px);
  padding: 24px 0;
}

.cf-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 360px 1fr;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

/* 左侧面板 */
.cf-panel {
  padding: 36px 32px;
  background: var(--vp-c-bg-soft);
  border-right: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
}

.cf-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
  color: var(--vp-c-text-1);
}

.cf-subtitle {
  font-size: 14px;
  color: var(--vp-c-text-2);
  margin: 0 0 28px;
}

.cf-stats {
  display: flex;
  gap: 36px;
  margin-bottom: 28px;
}

.cf-stat-num {
  font-size: 32px;
  font-weight: 700;
  color: var(--mint, #2d7a6c);
  line-height: 1.1;
}

.dark .cf-stat-num {
  color: #5ec4ac;
}

.cf-stat-label {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-top: 4px;
}

.cf-top-list {
  flex: 1;
}

.cf-top-item {
  display: flex;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 14px;
}

.cf-top-rank {
  width: 26px;
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.cf-top-name {
  flex: 1;
  color: var(--vp-c-text-1);
}

.cf-top-country {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-right: 12px;
}

.cf-top-count {
  color: var(--mint, #2d7a6c);
  font-weight: 600;
  font-size: 13px;
}

.dark .cf-top-count {
  color: #5ec4ac;
}

.cf-empty {
  color: var(--vp-c-text-3);
  font-size: 14px;
  padding: 20px 0;
}

.cf-note {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-top: 16px;
}

/* 右侧地图 */
.cf-map-area {
  position: relative;
  min-height: 500px;
}

.cf-map {
  width: 100%;
  height: 100%;
  display: block;
}

.cf-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--vp-c-text-3);
  font-size: 14px;
}

/* 移动端 */
@media (max-width: 768px) {
  .cf-container {
    grid-template-columns: 1fr;
    margin: 0 16px;
  }
  .cf-panel {
    border-right: none;
    border-bottom: 1px solid var(--vp-c-divider);
    padding: 24px 20px;
  }
  .cf-title { font-size: 22px; }
  .cf-stat-num { font-size: 26px; }
  .cf-map-area { min-height: 280px; }
}
</style>
