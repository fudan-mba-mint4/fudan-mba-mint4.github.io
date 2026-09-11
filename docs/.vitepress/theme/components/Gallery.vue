<script setup>
import { ref, computed, onMounted } from 'vue'

const currentLang = ref('zh')
onMounted(() => {
  const path = window.location.pathname
  if (path.startsWith('/en/')) currentLang.value = 'en'
  else if (path.startsWith('/th/')) currentLang.value = 'th'
})

const i18n = {
  zh: {
    loading: '加载相册中...',
    empty: '暂无活动相册',
    emptyDesc: '活动照片将在每次活动后更新，敬请期待',
    viewAlbum: '查看图片直播',
    totalPhotos: '场活动',
    dateFormat: (dateStr) => {
      const d = new Date(dateStr)
      return `${d.getMonth() + 1}月${d.getDate()}日`
    },
    yearFormat: (dateStr) => {
      const d = new Date(dateStr)
      return `${d.getFullYear()}`
    },
  },
  en: {
    loading: 'Loading albums...',
    empty: 'No albums yet',
    emptyDesc: 'Event photos will be updated after each activity. Stay tuned!',
    viewAlbum: 'View Photo Album',
    totalPhotos: 'events',
    dateFormat: (dateStr) => {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    },
    yearFormat: (dateStr) => {
      const d = new Date(dateStr)
      return `${d.getFullYear()}`
    },
  },
  th: {
    loading: 'กำลังโหลดอัลบั้ม...',
    empty: 'ยังไม่มีอัลบั้ม',
    emptyDesc: 'รูปภาพกิจกรรมจะถูกอัปเดตหลังกิจกรรมแต่ละครั้ง',
    viewAlbum: 'ดูอัลบั้มรูป',
    totalPhotos: 'กิจกรรม',
    dateFormat: (dateStr) => {
      const d = new Date(dateStr)
      return `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'short' })}`
    },
    yearFormat: (dateStr) => {
      const d = new Date(dateStr)
      return `${d.getFullYear() + 543}`
    },
  },
}

const t = computed(() => i18n[currentLang.value])

const albums = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/data/activities.json')
    const data = await res.json()
    // 从统一活动数据中筛选有照片/媒介记录的活动，按日期倒序
    albums.value = (data.activities || [])
      .filter(a => a.tags && a.tags.hasMedia)
      .map(a => ({
        id: a.id,
        title: a.title,
        date: a.date,
        endDate: a.endDate,
        cover: a.tags.cover,
        url: a.tags.mediaUrl,
        description: a.description,
        location: a.location,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (e) {
    console.error('加载相册数据失败', e)
    albums.value = []
  } finally {
    loading.value = false
  }
})

// 按年份分组
const albumsByYear = computed(() => {
  const groups = {}
  albums.value.forEach(album => {
    const year = new Date(album.date).getFullYear()
    if (!groups[year]) groups[year] = []
    groups[year].push(album)
  })
  return Object.entries(groups).sort((a, b) => b[0] - a[0])
})
</script>

<template>
  <div class="gallery-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="gallery-loading">
      <div class="loading-spinner"></div>
      <p>{{ t.loading }}</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="albums.length === 0" class="gallery-empty">
      <div class="empty-icon">📷</div>
      <h3>{{ t.empty }}</h3>
      <p>{{ t.emptyDesc }}</p>
    </div>

    <!-- 相册列表（按年份分组） -->
    <div v-else class="gallery-content">
      <div v-for="[year, yearAlbums] in albumsByYear" :key="year" class="year-group">
        <div class="year-header">
          <span class="year-text">{{ year }}</span>
          <span class="year-count">{{ yearAlbums.length }} {{ t.totalPhotos }}</span>
        </div>
        <div class="albums-grid">
          <a
            v-for="album in yearAlbums"
            :key="album.id"
            :href="album.url"
            target="_blank"
            rel="noopener noreferrer"
            class="album-card"
          >
            <div class="album-cover">
              <img v-if="album.cover" :src="album.cover" :alt="album.title" class="album-cover-img" loading="lazy" />
              <div v-else class="album-cover-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
              <div class="album-cover-overlay">
                <span class="album-cover-cta">{{ t.viewAlbum }}</span>
                <svg class="album-cover-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </div>
            </div>
            <div class="album-info">
              <div class="album-date">{{ t.dateFormat(album.date) }}</div>
              <h3 class="album-title">{{ album.title }}</h3>
              <p v-if="album.description" class="album-desc">{{ album.description }}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-page {
  max-width: 960px;
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

@keyframes spin {
  to { transform: rotate(360deg); }
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

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.gallery-empty h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0 0 8px 0;
}

.gallery-empty p {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin: 0;
}

/* 年份分组 */
.year-group {
  margin-bottom: 40px;
}

.year-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--c-border);
}

.year-text {
  font-size: 22px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.year-count {
  font-size: 13px;
  color: var(--c-text-tertiary);
}

/* 相册卡片网格 */
.albums-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.album-card {
  display: flex;
  flex-direction: column;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.25s ease;
}

.album-card:hover {
  border-color: var(--c-accent-light);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* 封面区域 */
.album-cover {
  position: relative;
  aspect-ratio: 16 / 10;
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

.album-card:hover .album-cover-img {
  transform: scale(1.05);
}

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

.album-cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.album-card:hover .album-cover-overlay {
  opacity: 1;
}

.album-cover-cta {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.album-cover-arrow {
  width: 16px;
  height: 16px;
  color: #fff;
}

/* 信息区域 */
.album-info {
  padding: 16px 18px 18px;
}

.album-date {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-accent);
  margin-bottom: 6px;
}

.album-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.album-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 响应式 */
@media (max-width: 768px) {
  .albums-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .albums-grid {
    grid-template-columns: 1fr;
  }
}
</style>
