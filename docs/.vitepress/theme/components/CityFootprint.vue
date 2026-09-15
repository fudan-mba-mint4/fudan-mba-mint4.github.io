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
            <span class="cf-top-name">{{ city.city }}</span>
            <span class="cf-top-country">{{ city.country }}</span>
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

const API_PREFIX = import.meta.env.DEV ? 'https://mint4.cn' : ''

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
      const res = await fetch('/data/world.json')
      worldGeo.value = await res.json()
    } catch (e) {
      console.warn('map load failed', e)
      loading.value = false
      return
    }
  }
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

onMounted(async () => {
  // 记录本次访问
  try {
    await fetch(`${API_PREFIX}/api/city-footprint`, { method: 'POST' })
  } catch (e) { /* 静默 */ }

  // 获取统计
  try {
    const res = await fetch(`${API_PREFIX}/api/city-footprint`)
    if (res.ok) {
      const data = await res.json()
      stats.value = data.data || data
    }
  } catch (e) { /* 静默 */ }

  await drawMap()

  // 响应式
  resizeObserver = new ResizeObserver(() => drawMap())
  resizeObserver.observe(mapCanvas.value)

  // 监听 VitePress 深色模式切换（html.dark class）
  htmlObserver = new MutationObserver(() => drawMap())
  htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
    if (htmlObserver) htmlObserver.disconnect()
    if (animFrame) cancelAnimationFrame(animFrame)
  })
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
