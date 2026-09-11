<script setup>
import { ref, computed, onMounted } from 'vue'

/* ========== 语言检测 ========== */
const currentLang = ref('zh')
onMounted(() => {
  const path = window.location.pathname
  if (path.startsWith('/en/')) currentLang.value = 'en'
  else if (path.startsWith('/th/')) currentLang.value = 'th'
  else currentLang.value = 'zh'
})

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    upcoming: '即将到来',
    past: '往期活动',
    all: '全部',
    register: '报名',
    registered: '已报名',
    ended: '已结束',
    location: '地点',
    organizer: '主办',
    noActivities: '暂无活动',
    daysLeft: '天后',
    today: '今天',
    tomorrow: '明天',
    people: '人',
  },
  en: {
    upcoming: 'Upcoming',
    past: 'Past Events',
    all: 'All',
    register: 'Register',
    registered: 'Registered',
    ended: 'Ended',
    location: 'Location',
    organizer: 'Organizer',
    noActivities: 'No activities',
    daysLeft: 'days left',
    today: 'Today',
    tomorrow: 'Tomorrow',
    people: 'people',
  },
  th: {
    upcoming: 'กิจกรรมที่กำลังจะมาถึง',
    past: 'กิจกรรมที่ผ่านมา',
    all: 'ทั้งหมด',
    register: 'ลงทะเบียน',
    registered: 'ลงทะเบียนแล้ว',
    ended: 'จบแล้ว',
    location: 'สถานที่',
    organizer: 'ผู้จัด',
    noActivities: 'ไม่มีกิจกรรม',
    daysLeft: 'วัน',
    today: 'วันนี้',
    tomorrow: 'พรุ่งนี้',
    people: 'คน',
  },
}
const t = computed(() => i18n[currentLang.value])

/* ========== 活动数据（从JSON读取） ========== */
const activities = ref([])
onMounted(async () => {
  try {
    const res = await fetch('/data/activities.json')
    const data = await res.json()
    activities.value = data.activities
  } catch (e) {
    console.error('Failed to load activities:', e)
  }
})

/* ========== 筛选 ========== */
const filter = ref('upcoming')
const today = new Date()
today.setHours(0, 0, 0, 0)

const isUpcoming = (act) => new Date(act.date) >= today
const filtered = computed(() => {
  let list = [...activities.value]
  if (filter.value === 'upcoming') list = list.filter(isUpcoming)
  if (filter.value === 'past') list = list.filter(a => !isUpcoming(a))
  return list.sort((a, b) => {
    if (filter.value === 'past') return new Date(b.date) - new Date(a.date)
    return new Date(a.date) - new Date(b.date)
  })
})

/* ========== 格式化 ========== */
const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  const weekdays = currentLang.value === 'zh'
    ? ['周日','周一','周二','周三','周四','周五','周六']
    : currentLang.value === 'en'
    ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    : ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.']
  if (currentLang.value === 'zh') return `${d.getMonth()+1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
  if (currentLang.value === 'en') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
  return d.toLocaleDateString('th-TH', { month: 'short', day: 'numeric', weekday: 'short' })
}

const daysUntil = (dateStr) => {
  const diff = Math.ceil((new Date(dateStr) - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return t.value.today
  if (diff === 1) return t.value.tomorrow
  return `${diff} ${t.value.daysLeft}`
}

const registrationProgress = (act) => Math.min(100, Math.round((act.registered / act.capacity) * 100))
</script>

<template>
  <div class="activities-page">
    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <button
        v-for="opt in [{key:'upcoming',label:t.upcoming},{key:'past',label:t.past}]"
        :key="opt.key"
        class="filter-tab"
        :class="{ active: filter === opt.key }"
        @click="filter = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 活动列表 -->
    <div class="activity-list" v-if="filtered.length > 0">
      <article
        v-for="act in filtered"
        :key="act.id"
        class="activity-card"
        :class="{ ended: act.status === 'ended' }"
      >
        <!-- 左侧日期块 -->
        <div class="activity-date-block">
          <span class="date-month">{{ new Date(act.date).toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : currentLang === 'en' ? 'en-US' : 'th-TH', { month: 'short' }) }}</span>
          <span class="date-day">{{ new Date(act.date).getDate() }}</span>
          <span class="date-badge" v-if="isUpcoming(act) && act.status === 'open'">{{ daysUntil(act.date) }}</span>
        </div>

        <!-- 右侧内容 -->
        <div class="activity-content">
          <div class="activity-header">
            <h3 class="activity-title">{{ act.title[currentLang] }}</h3>
            <span class="activity-status" :class="act.status">
              {{ act.status === 'open' ? t.register : act.status === 'ended' ? t.ended : t.registered }}
            </span>
          </div>

          <div class="activity-meta">
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ act.time }}
            </span>
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ act.location[currentLang] }}
            </span>
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {{ act.organizer[currentLang] }}
            </span>
          </div>

          <p class="activity-desc">{{ act.description[currentLang] }}</p>

          <!-- 报名进度（信息展示，无交互按钮） -->
          <div class="signup-section" v-if="act.status !== 'ended'">
            <div class="signup-progress">
              <div class="progress-bar"><div class="progress-fill" :style="{ width: registrationProgress(act) + '%' }"></div></div>
              <span class="signup-count">{{ act.registered }}/{{ act.capacity }} {{ t.people }}</span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p>{{ t.noActivities }}</p>
    </div>
  </div>
</template>

<style scoped>
.activities-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.filter-tab {
  padding: 8px 20px;
  border: 1px solid var(--c-border);
  border-radius: 20px;
  background: var(--c-bg-secondary);
  color: var(--c-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.filter-tab:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}
.filter-tab.active {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}

/* 活动卡片 */
.activity-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 18px;
  margin-bottom: 14px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.activity-card:hover {
  border-color: var(--c-accent-light);
  transform: translateY(-2px);
}
.activity-card.ended {
  opacity: 0.7;
}

/* 日期块 */
.activity-date-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 80px;
  background: var(--c-accent-light);
  border-radius: 14px;
  flex-shrink: 0;
  position: relative;
}
.activity-card.ended .activity-date-block {
  background: var(--c-bg-elevated);
}
.date-month {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-accent);
  text-transform: uppercase;
}
.activity-card.ended .date-month {
  color: var(--c-text-tertiary);
}
.date-day {
  font-size: 28px;
  font-weight: 700;
  color: var(--c-text-primary);
  line-height: 1.1;
}
.date-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--c-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

/* 内容区 */
.activity-content {
  flex: 1;
  min-width: 0;
}
.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}
.activity-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0;
  line-height: 1.4;
}
.activity-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.activity-status.open {
  background: rgba(52, 199, 89, 0.12);
  color: #34C759;
}
.activity-status.ended {
  background: var(--c-bg-elevated);
  color: var(--c-text-tertiary);
}

/* 元信息 */
.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 10px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--c-text-secondary);
}
.meta-item svg {
  color: var(--c-text-tertiary);
  flex-shrink: 0;
}

/* 描述 */
.activity-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--c-text-secondary);
  margin: 0 0 14px 0;
}

/* 报名区 */
.signup-section {
  display: flex;
  align-items: center;
  gap: 16px;
}
.signup-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--c-bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--c-accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.signup-count {
  font-size: 12px;
  color: var(--c-text-tertiary);
  white-space: nowrap;
}
.signup-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  background: var(--c-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  font-family: inherit;
}
.signup-btn:hover:not(:disabled) {
  opacity: 0.9;
}
.signup-btn:disabled {
  background: var(--c-bg-elevated);
  color: var(--c-text-tertiary);
  cursor: default;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--c-text-tertiary);
}
.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}
.empty-state p {
  font-size: 15px;
  margin: 0;
}

/* 响应式 */
@media (max-width: 640px) {
  .activities-page {
    padding: 0 16px 80px;
  }
  .activity-card {
    flex-direction: column;
    gap: 16px;
    padding: 18px;
  }
  .activity-date-block {
    width: 100%;
    height: auto;
    flex-direction: row;
    gap: 8px;
    padding: 10px;
  }
  .date-day { font-size: 22px; }
  .activity-header {
    flex-direction: column;
  }
  .signup-section {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
