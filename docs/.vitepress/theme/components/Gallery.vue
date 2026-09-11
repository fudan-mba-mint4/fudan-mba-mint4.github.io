<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useLang, formatRelative } from '../composables/useLang'

const i18n = {
  zh: {
    loading: '加载相册中...',
    empty: '暂无活动相册',
    emptyDesc: '活动照片将在每次活动后更新，敬请期待',
    events: '场活动',
    photos: '张照片',
    latest: '最新活动',
    tapPreview: '点击预览',
    close: '关闭',
    viewFullAlbum: '查看完整相册',
    photosUnit: '张',
    // Bento 统计
    statEvents: '活动场数',
    statPlatforms: '直播平台',
    statLatest: '最近记录',
    statTop: '最热门活动',
    monthsSpan: '个月跨度',
  },
  en: {
    loading: 'Loading albums...',
    empty: 'No albums yet',
    emptyDesc: 'Event photos will be updated after each activity. Stay tuned!',
    events: 'events',
    photos: 'photos',
    latest: 'Latest',
    tapPreview: 'Tap to preview',
    close: 'Close',
    viewFullAlbum: 'View full album',
    photosUnit: '',
    statEvents: 'Events with media',
    statPlatforms: 'Photo platforms',
    statLatest: 'Latest record',
    statTop: 'Most attended',
    monthsSpan: 'month span',
  },
  th: {
    loading: 'กำลังโหลดอัลบั้ม...',
    empty: 'ยังไม่มีอัลบั้ม',
    emptyDesc: 'รูปภาพกิจกรรมจะถูกอัปเดตหลังกิจกรรมแต่ละครั้ง',
    events: 'กิจกรรม',
    photos: 'รูปภาพ',
    latest: 'ล่าสุด',
    tapPreview: 'แตะเพื่อดูตัวอย่าง',
    close: 'ปิด',
    viewFullAlbum: 'ดูอัลบั้มเต็ม',
    photosUnit: 'รูป',
    statEvents: 'กิจกรรมที่มีภาพ',
    statPlatforms: 'แพลตฟอร์มภาพ',
    statLatest: 'บันทึกล่าสุด',
    statTop: 'กิจกรรมที่มีผู้เข้าร่วมมากที่สุด',
    monthsSpan: 'ช่วงเวลาเดือน',
  },
}

const { lang, t } = useLang(i18n)

const albums = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/data/activities.json')
    const data = await res.json()
    albums.value = (data.activities || [])
      .filter(a => a.tags && a.tags.hasMedia)
      .map(a => ({
        id: a.id,
        title: a.title,
        date: a.date,
        cover: a.tags.cover,
        url: a.tags.mediaUrl,
        location: a.location,
        photoCount: a.tags.photoCount || 0,
        registered: typeof a.registered === 'number' ? a.registered : 0,
        mediaType: a.tags.mediaType || null,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (e) {
    console.error('加载相册数据失败', e)
    albums.value = []
  } finally {
    loading.value = false
  }
  // 数据就绪后挂载 Bento 进入视口监听
  if (albums.value.length > 0) {
    await nextTick()
    setupBentoObserver()
  }
})

/* 按年份分组 */
const albumsByYear = computed(() => {
  const groups = {}
  albums.value.forEach(album => {
    const y = new Date(album.date).getFullYear()
    const year = lang.value === 'th' ? y + 543 : y
    if (!groups[year]) groups[year] = []
    groups[year].push(album)
  })
  return Object.entries(groups).sort((a, b) => b[0] - a[0])
})

/* ============ Bento 统计聚合（全部由 activities.json 派生） ============ */

// 1. 累计有影像活动场数
const statCount = computed(() => albums.value.length)

// 2. 来自 N 个直播平台（按 mediaType 去重）
const statPlatforms = computed(() => {
  const set = new Set(albums.value.map(a => a.mediaType).filter(Boolean))
  return set.size
})

// 3. 最近一次记录（取最大 date，交给 formatRelative 用 Intl.RelativeTimeFormat 输出）
const statLatest = computed(() => {
  if (!albums.value.length) return null
  return albums.value.reduce((max, a) =>
    new Date(a.date) > new Date(max.date) ? a : max
  )
})

// 4. 人数最多活动（registered 都为 0 / 不可靠时退化为日期跨度月数）
const statTop = computed(() => {
  if (!albums.value.length) return null
  const withReg = albums.value.filter(a => typeof a.registered === 'number' && a.registered > 0)
  if (withReg.length) {
    const top = withReg.reduce((max, a) => a.registered > max.registered ? a : max)
    return { type: 'event', count: top.registered, title: top.title }
  }
  // fallback：跨 X 个月
  const dates = albums.value.map(a => new Date(a.date)).sort((a, b) => a - b)
  const first = dates[0]
  const last = dates[dates.length - 1]
  const months = (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth()) + 1
  return { type: 'span', months }
})

/* ============ Bento 数字滚动计数动画（仅首次进入视口跑一次） ============ */
const bentoRef = ref(null)
const animated = ref({ count: 0, platforms: 0, top: 0 })
let bentoObserver = null

function getTargets() {
  return {
    count: statCount.value,
    platforms: statPlatforms.value,
    top: statTop.value
      ? (statTop.value.type === 'event' ? statTop.value.count : statTop.value.months)
      : 0,
  }
}

function applyFinal() {
  animated.value = getTargets()
}

function animateNumbers() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    applyFinal()
    return
  }
  const target = getTargets()
  const start = performance.now()
  const duration = 800
  const from = { count: 0, platforms: 0, top: 0 }
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
    animated.value = {
      count: Math.round(from.count + (target.count - from.count) * eased),
      platforms: Math.round(from.platforms + (target.platforms - from.platforms) * eased),
      top: Math.round(from.top + (target.top - from.top) * eased),
    }
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function setupBentoObserver() {
  const el = bentoRef.value
  if (!el) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion || !('IntersectionObserver' in window)) {
    applyFinal()
    return
  }
  bentoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateNumbers()
        if (bentoObserver) bentoObserver.disconnect()
      }
    })
  }, { threshold: 0.3 })
  bentoObserver.observe(el)
}

/* ============ 卡片展示态 ============ */
// 卡片3：直接由 Intl.RelativeTimeFormat 输出（如"3天前" / "3 days ago" / "3 วันที่แล้ว"）
const card3Value = computed(() => {
  if (!statLatest.value) return ''
  return formatRelative(statLatest.value.date)
})

// 卡片4：最热门活动（标题截断 + 人数）或 跨 X 个月
const card4Value = computed(() => {
  if (!statTop.value) return { numeric: 0, title: '', suffix: '' }
  if (statTop.value.type === 'event') {
    return { numeric: animated.value.top, title: statTop.value.title[lang.value] || '', suffix: '' }
  }
  return { numeric: animated.value.top, title: '', suffix: t.value.monthsSpan }
})

const dateFmt = (dateStr) => {
  const d = new Date(dateStr)
  const locale = lang.value === 'th' ? 'th-TH-u-ca-buddhist' : lang.value === 'en' ? 'en-US' : 'zh-CN'
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(d)
}

/* ========== 灯箱 ========== */
const activeAlbum = ref(null)
const lightboxLoading = ref(false)
const lightboxFailed = ref(false)

const openLightbox = (album) => {
  activeAlbum.value = album
  lightboxLoading.value = true
  lightboxFailed.value = false
  document.body.style.overflow = 'hidden'
}
const closeLightbox = () => {
  activeAlbum.value = null
  document.body.style.overflow = ''
}
const onLightboxImgLoad = () => { lightboxLoading.value = false }
const onLightboxImgError = () => { lightboxLoading.value = false; lightboxFailed.value = true }

const onKeydown = (e) => { if (e.key === 'Escape') closeLightbox() }
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  if (bentoObserver) {
    bentoObserver.disconnect()
    bentoObserver = null
  }
})
</script>

<template>
  <div class="gallery-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="gallery-loading">
      <div class="loading-spinner"></div>
      <p>{{ t.loading }}</p>
    </div>

    <template v-else>
      <!-- Bento 统计仪表盘（仅在有影像活动时渲染） -->
      <div v-if="albums.length > 0" ref="bentoRef" class="bento-grid">
        <!-- 1. 累计有影像活动场数 -->
        <div class="bento-card">
          <div class="bento-icon">📸</div>
          <div class="bento-value">{{ animated.count }}</div>
          <div class="bento-label">{{ t.statEvents }}</div>
        </div>

        <!-- 2. 来自 N 个直播平台 -->
        <div class="bento-card">
          <div class="bento-icon">🎙️</div>
          <div class="bento-value">{{ animated.platforms }}</div>
          <div class="bento-label">{{ t.statPlatforms }}</div>
        </div>

        <!-- 3. 最近一次记录（Intl.RelativeTimeFormat） -->
        <div class="bento-card">
          <div class="bento-icon">⏰</div>
          <div class="bento-value bento-value-text">{{ card3Value }}</div>
          <div class="bento-label">{{ t.statLatest }}</div>
        </div>

        <!-- 4. 人数最多活动 / 跨 X 个月 -->
        <div class="bento-card">
          <div class="bento-icon">👥</div>
          <div class="bento-value">{{ card4Value.numeric }}</div>
          <div v-if="card4Value.title" class="bento-sub" :title="card4Value.title">{{ card4Value.title }}</div>
          <div v-else class="bento-suffix">{{ card4Value.suffix }}</div>
          <div class="bento-label">{{ t.statTop }}</div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="albums.length === 0" class="gallery-empty">
        <div class="empty-icon">📷</div>
        <h3>{{ t.empty }}</h3>
        <p>{{ t.emptyDesc }}</p>
      </div>

      <!-- 相册列表（按年份分组） -->
      <div v-else class="gallery-content">
        <div v-for="[year, yearAlbums] in albumsByYear" :key="year" class="year-group">
          <div class="year-header">
            <span class="year-text">{{ year }}</span>
            <span class="year-count">{{ yearAlbums.length }} {{ t.events }}</span>
          </div>
          <div class="albums-grid">
            <div
              v-for="album in yearAlbums"
              :id="album.id"
              :key="album.id"
              class="album-card"
              @click="openLightbox(album)"
              @mouseenter="album.hover = true"
              @mouseleave="album.hover = false"
            >
              <div class="album-cover">
                <img
                  v-if="album.cover"
                  :src="album.cover"
                  :alt="album.title[lang]"
                  class="album-cover-img"
                  loading="lazy"
                  @error="album.cover = null"
                />
                <div v-else class="album-cover-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>

                <!-- 照片数量角标 -->
                <span v-if="album.photoCount" class="photo-badge">📷 {{ album.photoCount }} {{ t.photosUnit }}</span>

                <!-- hover 提示 -->
                <div class="cover-hint">
                  <span>{{ t.tapPreview }}</span>
                </div>

                <!-- 底部渐变遮罩 -->
                <div class="cover-gradient">
                  <span class="cover-title">{{ album.title[lang] }}</span>
                  <span class="cover-date">{{ dateFmt(album.date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 灯箱 -->
    <Transition name="lightbox">
      <div v-if="activeAlbum" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" :aria-label="t.close" @click="closeLightbox">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div class="lightbox-title">{{ activeAlbum.title[lang] }}</div>

        <div class="lightbox-body">
          <div class="lightbox-stage">
            <div v-if="lightboxLoading" class="lightbox-loading">
              <div class="loading-spinner lightbox-spinner"></div>
            </div>
            <img
              v-if="!lightboxFailed"
              :src="activeAlbum.cover"
              :alt="activeAlbum.title[lang]"
              class="lightbox-img"
              @load="onLightboxImgLoad"
              @error="onLightboxImgError"
            />
            <div v-else class="lightbox-fallback">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          </div>
          <div class="lightbox-meta">
            <div class="lb-meta-row"><span class="lb-label">{{ t.latest }}</span><span>{{ dateFmt(activeAlbum.date) }}</span></div>
            <div class="lb-meta-row" v-if="activeAlbum.location"><span class="lb-label">{{ t.events }}</span><span>{{ activeAlbum.location[lang] }}</span></div>
            <a :href="activeAlbum.url" target="_blank" rel="noopener noreferrer" class="lb-cta">{{ t.viewFullAlbum }} →</a>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.gallery-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 加载状态 */
.gallery-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--c-text-secondary);
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== Bento 统计仪表盘 ========== */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 36px;
}

.bento-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.bento-icon {
  font-size: 22px;
  line-height: 1;
}

.bento-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  color: var(--c-accent);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}

/* 卡片3：相对时间短语（如"8天前"），允许换行 */
.bento-value-text {
  white-space: normal;
  word-break: break-word;
}

.bento-suffix {
  font-size: var(--text-sm);
  font-weight: var(--font-regular);
  color: var(--c-text-secondary);
}

.bento-sub {
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bento-label {
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
  margin-top: auto;
}

/* 空状态 */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.gallery-empty h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  margin: 0 0 8px 0;
}
.gallery-empty p { font-size: var(--text-sm); color: var(--c-text-secondary); margin: 0; }

/* 年份分组 */
.year-group { margin-bottom: 40px; }
.year-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--c-border);
}
.year-text {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--c-text-primary);
}
.year-count { font-size: var(--text-sm); color: var(--c-text-tertiary); }

/* 相册卡片网格 */
.albums-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.album-card {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-subtle);
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.album-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-float);
}

/* 封面 16:9 */
.album-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, var(--c-accent-light) 0%, var(--c-bg-secondary) 100%);
  overflow: hidden;
}
.album-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.album-card:hover .album-cover-img { transform: scale(1.03); }

.album-cover-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.album-cover-placeholder svg {
  width: 48px;
  height: 48px;
  color: var(--c-accent);
  opacity: 0.6;
}

/* 照片数量角标 */
.photo-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

/* hover 提示 */
.cover-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  padding: 8px 18px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  opacity: 0;
  transition: opacity var(--transition-base);
  pointer-events: none;
}
.album-card:hover .cover-hint { opacity: 1; }

/* 底部渐变遮罩 */
.cover-gradient {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 32px 16px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent);
}
.cover-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: #fff;
  line-height: 1.3;
}
.cover-date {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.8);
}

/* ========== 灯箱 ========== */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
}
.lightbox-close {
  position: absolute;
  top: 20px;
  right: 24px;
  z-index: 2;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.lightbox-close:hover { background: rgba(255, 255, 255, 0.28); }
.lightbox-title {
  position: absolute;
  top: 26px;
  left: 32px;
  z-index: 2;
  color: #fff;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  max-width: 60%;
}
.lightbox-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 80px 32px 40px;
  overflow: auto;
}
.lightbox-stage {
  position: relative;
  max-width: min(900px, 90vw);
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.lightbox-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox-spinner {
  border-color: rgba(255,255,255,0.2);
  border-top-color: #fff;
  margin: 0;
}
.lightbox-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}
.lightbox-fallback svg { width: 64px; height: 64px; }

.lightbox-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}
.lb-meta-row {
  display: flex;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: var(--text-sm);
}
.lb-label { color: rgba(255, 255, 255, 0.5); }
.lb-cta {
  display: inline-block;
  padding: 10px 22px;
  border-radius: var(--radius-full);
  background: var(--c-accent);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: opacity var(--transition-fast);
}
.lb-cta:hover { opacity: 0.9; }

/* 灯箱过渡 */
.lightbox-enter-active, .lightbox-leave-active {
  transition: opacity var(--transition-base);
}
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }

/* 响应式 */
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .albums-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
}
@media (max-width: 640px) {
  .gallery-page { padding: 0 16px 80px; }
  .albums-grid { grid-template-columns: 1fr; }
  .lightbox-body { padding: 72px 16px 24px; }
  .lightbox-title { left: 20px; right: 70px; max-width: none; font-size: var(--text-base); }
}
</style>
