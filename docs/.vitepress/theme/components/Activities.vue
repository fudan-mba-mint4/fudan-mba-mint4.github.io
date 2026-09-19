<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vitepress'
import { useLang, formatDate, formatRelative } from '../composables/useLang'
import { useNow } from '../composables/useNow.js'
import { parseDate } from '../utils/dateUtils.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { currentUser, isAuthenticated, authToken } = useAuth()

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    nextEvent: '下一场活动',
    countdownLabel: '距离开始',
    ongoing: '进行中',
    statusLabel: '活动状态',
    days: '天',
    hours: '小时',
    spotsLeft: '剩余名额',
    full: '已满员',
    noUpcoming: '近期无活动 · 关注公告',
    todayDivider: '今天',
    register: '报名',
    ended: '已结束',
    noActivities: '暂无活动',
    people: '人',
    album: '相册',
    involvesFinance: '涉及班费',
  },
  en: {
    nextEvent: 'Next event',
    countdownLabel: 'Starts in',
    ongoing: 'Ongoing',
    statusLabel: 'Status',
    days: 'd',
    hours: 'h',
    spotsLeft: 'Spots left',
    full: 'Full',
    noUpcoming: 'No upcoming events · Check announcements',
    todayDivider: 'Today',
    register: 'Register',
    ended: 'Ended',
    noActivities: 'No activities',
    people: 'people',
    album: 'Photo album',
    involvesFinance: 'Class fund involved',
  },
  th: {
    nextEvent: 'กิจกรรมถัดไป',
    countdownLabel: 'เริ่มใน',
    ongoing: 'กำลังดำเนินการ',
    statusLabel: 'สถานะ',
    days: 'วัน',
    hours: 'ชม.',
    spotsLeft: 'ที่ว่าง',
    full: 'เต็มแล้ว',
    noUpcoming: 'ไม่มีกิจกรรมที่จะมาถึง · ดูประกาศ',
    todayDivider: 'วันนี้',
    register: 'ลงทะเบียน',
    ended: 'จบแล้ว',
    noActivities: 'ไม่มีกิจกรรม',
    people: 'คน',
    album: 'อัลบั้มภาพ',
    involvesFinance: 'เกี่ยวกองทุนชั้นเรียน',
  },
}
const { lang, t } = useLang(i18n)

/* ========== 活动数据：数据库优先，失败/空则静默回退静态 JSON ========== */
// 先 GET /api/activities-db；成功且 activities 非空才用 DB，否则回退 /data/activities.json。
// 所有网络访问都在 onMounted（浏览器端）内，异常静默回退不白屏。
async function fetchActivitiesData() {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3000)
    const res = await fetchWithRetry('/api/activities-db', { signal: ctrl.signal })
    clearTimeout(timer)
    if (res.ok) {
      const json = await res.json()
      if (Array.isArray(json?.activities) && json.activities.length > 0) return json
    }
  } catch (e) {
    /* DB 不可达/超时，静默回退 */
  }
  try {
    const res = await fetchWithRetry('/data/activities.json')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.json()
  } catch (e) {
    console.error(`[Activities] 静态 JSON 加载失败:`, e)
    return null
  }
}

const activitiesData = ref(null)
const activities = computed(() => activitiesData.value?.activities || [])

onMounted(async () => {
  if (typeof window === 'undefined') return
  activitiesData.value = await fetchActivitiesData()
})

/* ========== 时钟（每分钟刷新一次，倒计时不秒跳） ========== */
const { now } = useNow()

/* ========== 活动报名（数据库存储，通过API操作） ========== */
const API_PREFIX = import.meta.env.DEV ? 'https://fudan-mba-mint4.vercel.app' : ''
const signupCounts = ref({}) // activityId -> count
const userSignedUpIds = ref([]) // 当前用户已报名的活动ID列表

// 加载所有活动的报名数据
async function loadAllSignups() {
  if (!activities.value.length) return
  try {
    const counts = {}
    const userIds = []
    for (const act of activities.value) {
      const res = await fetchWithRetry(`${API_PREFIX}/api/activities/${act.id}/signups`)
      if (res.ok) {
        const result = await res.json()
        counts[act.id] = result.count || 0
        if (currentUser.value && result.data?.some(s => s.username === currentUser.value.username)) {
          userIds.push(act.id)
        }
      }
    }
    signupCounts.value = counts
    userSignedUpIds.value = userIds
  } catch (e) {
    console.warn('加载报名数据失败:', e.message)
  }
}

// 当前用户是否已报名某活动
function isSignedUp(actId) {
  return userSignedUpIds.value.includes(actId)
}

// 活动实际报名人数
function getRegisteredCount(act) {
  return signupCounts.value[act.id] ?? (act.registered || 0)
}

// 活动是否已满
function isFull(act) {
  if (!act.capacity || act.capacity <= 0) return false
  return getRegisteredCount(act) >= act.capacity
}

// 报名
async function doSignup(actId) {
  if (!currentUser.value) { goToAuth(); return }
  const act = activities.value.find(a => a.id === actId)
  if (!act) return
  if (isFull(act)) { alert('名额已满'); return }
  if (isSignedUp(actId)) return

  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/activities/${actId}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.value}`,
      },
    })
    if (res.ok) {
      signupCounts.value[actId] = (signupCounts.value[actId] || 0) + 1
      userSignedUpIds.value.push(actId)
    } else if (res.status === 409) {
      alert('您已报名此活动')
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || '报名失败，请重试')
    }
  } catch (e) {
    alert('网络错误，请稍后重试')
  }
}

// 取消报名
async function cancelSignup(actId) {
  if (!currentUser.value) return
  if (!confirm('确定取消报名这个活动吗？')) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/activities/${actId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.value}`,
      },
    })
    if (res.ok) {
      signupCounts.value[actId] = Math.max(0, (signupCounts.value[actId] || 0) - 1)
      userSignedUpIds.value = userSignedUpIds.value.filter(id => id !== actId)
    }
  } catch (e) {
    alert('网络错误，请稍后重试')
  }
}

// 跳转到登录页
function goToAuth() {
  router.go('/auth/')
}

// 活动数据加载完成后，加载报名数据
watch(activities, (newVal) => {
  if (newVal.length) loadAllSignups()
}, { immediate: true })

/* ========== 日期+开始时间解析：从 time 字段提取开始时间（如 "17:00 - 18:00" → 17:00） ========== */
const parseEventDateTime = (act) => {
  const date = parseDate(act.date)
  // 提取开始时间：匹配 "HH:MM" 格式
  const timeMatch = act.time && act.time.match(/(\d{1,2}):(\d{2})/)
  if (timeMatch) {
    date.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0)
  }
  return date
}

/* ========== 结束时间解析：从 time 字段提取第二个时间（如 "17:00 - 18:00" → 18:00），只有一个时间则默认+2小时 ========== */
const parseEventEndDateTime = (act) => {
  const date = parseDate(act.date)
  const timeMatches = act.time && act.time.match(/(\d{1,2}):(\d{2})/g)
  if (timeMatches && timeMatches.length >= 2) {
    const endMatch = timeMatches[1].match(/(\d{1,2}):(\d{2})/)
    date.setHours(parseInt(endMatch[1], 10), parseInt(endMatch[2], 10), 0, 0)
  } else if (timeMatches && timeMatches.length === 1) {
    const startMatch = timeMatches[0].match(/(\d{1,2}):(\d{2})/)
    date.setHours(parseInt(startMatch[1], 10) + 2, parseInt(startMatch[2], 10), 0, 0)
  }
  return date
}

/* 是否正在进行中 */
const isOngoing = (act) => {
  const start = parseEventDateTime(act)
  const end = parseEventEndDateTime(act)
  return now.value >= start && now.value <= end
}

const isUpcoming = (act) =>
  parseEventDateTime(act) > now.value && act.status !== 'ended'

/* ========== 方案4.3：下一场活动 Hero 巨幕倒计时 ========== */
const nextEvent = computed(() => {
  const upcoming = activities.value
    .filter(a => (isUpcoming(a) || isOngoing(a)) && a.status !== 'ended')
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
  return upcoming[0] || null
})

/* 30 天内才升级为 Hero，否则占位 */
const heroEvent = computed(() => {
  if (!nextEvent.value) return null
  const diff = parseEventDateTime(nextEvent.value) - now.value
  if (diff > 30 * 24 * 60 * 60 * 1000) return null
  return nextEvent.value
})

const heroCountdown = computed(() => {
  if (!heroEvent.value) return { days: 0, hours: 0, ongoing: false }
  if (isOngoing(heroEvent.value)) return { days: 0, hours: 0, ongoing: true }
  const diff = parseEventDateTime(heroEvent.value) - now.value
  if (diff <= 0) return { days: 0, hours: 0, ongoing: false }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    ongoing: false,
  }
})

/* Hero 报名进度环（capacity 为 0/undefined 时兜底为 1，避免 NaN） */
const RING_R = 26
const RING_C = 2 * Math.PI * RING_R
const ringOffset = computed(() => {
  if (!heroEvent.value) return RING_C
  const cap = heroEvent.value.capacity || 1
  const p = Math.min(1, getRegisteredCount(heroEvent.value) / cap)
  return RING_C * (1 - p)
})
const heroFull = computed(
  () => !!heroEvent.value && getRegisteredCount(heroEvent.value) >= (heroEvent.value.capacity || 0)
)

/* ========== 方案4.1：垂直脊柱时间线（按日期倒序） ========== */
const sortedEvents = computed(() =>
  [...activities.value].sort((a, b) => parseDate(b.date) - parseDate(a.date))
)

const registrationProgress = (act) => {
  const cap = act.capacity || 1
  return Math.min(100, Math.round((act.registered / cap) * 100))
}

/* 是否为"今天"分割点：当前未来活动，且下一个已非未来活动 */
const isTodayDivider = (idx) => {
  const cur = sortedEvents.value[idx]
  const nxt = sortedEvents.value[idx + 1]
  return isUpcoming(cur) && (!nxt || !isUpcoming(nxt))
}

// 按当前语言构造相册链接（避免从 en/th 页跳到中文 /gallery/）
const galleryLink = computed(() => (lang.value === 'zh' ? '/gallery/' : `/${lang.value}/gallery/`))
</script>

<template>
  <div class="activities-page">
    <!-- ===== Hero 巨幕倒计时 ===== -->
    <section
      class="hero"
      :class="{ 'hero--cover': heroEvent && heroEvent.tags && heroEvent.tags.cover }"
    >
      <div
        v-if="heroEvent && heroEvent.tags && heroEvent.tags.cover"
        class="hero-bg"
        :style="{ backgroundImage: `url(${heroEvent.tags.cover})` }"
      ></div>
      <div class="hero-scrim"></div>

      <div v-if="heroEvent" class="hero-body">
        <!-- 左：倒计时 -->
        <div class="hero-left">
          <span class="hero-eyebrow">{{ t.nextEvent }}</span>
          <div class="hero-countdown" :class="{ ongoing: heroCountdown.ongoing }">
            <template v-if="heroCountdown.ongoing">
              <span class="hero-cd-ongoing">{{ t.ongoing }}</span>
            </template>
            <template v-else>
              <span class="hero-cd-block">
                <span class="hero-cd-num">{{ heroCountdown.days }}</span>
                <span class="hero-cd-unit">{{ t.days }}</span>
              </span>
              <span class="hero-cd-block">
                <span class="hero-cd-num">{{ heroCountdown.hours }}</span>
                <span class="hero-cd-unit">{{ t.hours }}</span>
              </span>
            </template>
          </div>
          <span class="hero-countdown-label">{{ heroCountdown.ongoing ? t.statusLabel : t.countdownLabel }}</span>
        </div>

        <!-- 中：标题与地点 -->
        <div class="hero-main">
          <h2 class="hero-title">{{ heroEvent.title[lang] }}</h2>
          <div class="hero-meta">
            <span class="hero-meta-item">🕒 {{ heroEvent.time }}</span>
            <span class="hero-meta-item">📍 {{ heroEvent.location[lang] }}</span>
          </div>
        </div>

        <!-- 右：剩余名额进度环 -->
        <div class="hero-right">
          <div class="hero-ring-wrap">
            <svg class="hero-ring" viewBox="0 0 60 60" width="64" height="64">
              <circle cx="30" cy="30" :r="RING_R" fill="none" class="hero-ring-track"
                stroke="currentColor" stroke-width="5" />
              <circle cx="30" cy="30" :r="RING_R" fill="none" class="hero-ring-progress"
                stroke="currentColor" stroke-width="5" stroke-linecap="round"
                :stroke-dasharray="RING_C" :stroke-dashoffset="ringOffset"
                transform="rotate(-90 30 30)" />
            </svg>
            <span class="hero-ring-text" v-if="heroFull">✓</span>
            <span class="hero-ring-text hero-ring-count" v-else>{{ getRegisteredCount(heroEvent) }}/{{ heroEvent.capacity }}</span>
          </div>
          <span class="hero-ring-label" v-if="heroFull">{{ t.full }}</span>
          <span class="hero-ring-label" v-else>{{ t.spotsLeft }}</span>
        </div>
      </div>

      <!-- Hero 报名按钮 -->
      <div class="hero-signup-row" v-if="heroEvent && heroEvent.capacity > 0">
        <template v-if="!isAuthenticated">
          <button class="hero-signup-btn" @click="goToAuth">登录后报名</button>
        </template>
        <template v-else-if="isSignedUp(heroEvent.id)">
          <button class="hero-signup-btn signed" @click="cancelSignup(heroEvent.id)">✓ 已报名 · 点击取消</button>
        </template>
        <template v-else-if="heroFull">
          <button class="hero-signup-btn full" disabled>名额已满</button>
        </template>
        <template v-else>
          <button class="hero-signup-btn" @click="doSignup(heroEvent.id)">立即报名</button>
        </template>
      </div>

      <!-- 无未来活动兜底 -->
      <div v-else class="hero-body hero-body--empty">
        <p class="hero-empty-text">{{ t.noUpcoming }}</p>
      </div>
    </section>

    <!-- ===== 垂直脊柱时间线 ===== -->
    <div class="timeline" v-if="sortedEvents.length">
      <template v-for="(act, idx) in sortedEvents" :key="act.id">
        <div class="timeline-item" :class="{ future: isUpcoming(act), past: !isUpcoming(act) }">
          <article class="tl-card">
            <div class="tl-card-head">
              <!-- 日期块 -->
              <div class="tl-date-block">
                <span class="tl-date-dot"></span>
                <span class="tl-month">{{ formatDate(act.date, { year: undefined, month: 'long', day: 'numeric' }) }}</span>
              </div>

              <div class="tl-main">
                <div class="tl-title-row">
                  <h3 class="tl-title">{{ act.title[lang] }}</h3>
                  <!-- 活动关联链接：相册/班费，放在标题右边 -->
                  <div class="tl-title-links">
                    <a
                      v-if="act.tags && act.tags.hasMedia"
                      class="tl-title-link"
                      :href="galleryLink"
                      :aria-label="t.album"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      {{ t.album }}
                    </a>
                    <a
                      v-if="act.tags && act.tags.involvesFinance"
                      class="tl-title-link tl-title-link--finance"
                      :href="`${langPrefix}/finance/`"
                      :aria-label="t.involvesFinance"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      {{ t.involvesFinance }}
                    </a>
                  </div>
                </div>

                <div class="tl-meta">
                  <span class="tl-meta-item">🕒 {{ act.time }}</span>
                  <span class="tl-meta-item">📍 {{ act.location[lang] }}</span>
                  <span class="tl-meta-item">👤 {{ act.organizer[lang] }}</span>
                </div>

                <p class="tl-desc">{{ act.description[lang] }}</p>

                <!-- 报名进度（未来活动） -->
                <div class="tl-progress" v-if="isUpcoming(act)">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: registrationProgress(act) + '%' }"></div>
                  </div>
                  <span class="progress-count">{{ getRegisteredCount(act) }}/{{ act.capacity }} {{ t.people }}</span>
                </div>
              </div>

              <!-- 右侧栏：状态 + 报名按钮 -->
              <div class="tl-side">
                <span v-if="isUpcoming(act)" class="tl-soon">{{ formatRelative(act.date) }}</span>
                <span v-else class="tl-ended">{{ t.ended }}</span>
                <!-- 报名按钮（未来活动） -->
                <div class="tl-signup" v-if="isUpcoming(act) && act.capacity > 0">
                  <template v-if="!isAuthenticated">
                    <button class="signup-btn" @click="goToAuth">
                      登录后报名
                    </button>
                  </template>
                  <template v-else-if="isSignedUp(act.id)">
                    <button class="signup-btn signed" @click="cancelSignup(act.id)">
                      ✓ 已报名
                    </button>
                  </template>
                  <template v-else-if="isFull(act)">
                    <button class="signup-btn full" disabled>
                      名额已满
                    </button>
                  </template>
                  <template v-else>
                    <button class="signup-btn" @click="doSignup(act.id)">
                      立即报名
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- 今天分割线（固定在未来/过去分界） -->
        <div v-if="isTodayDivider(idx)" class="today-divider">
          <span class="today-divider-label">{{ t.todayDivider }}</span>
        </div>
      </template>
    </div>

    <!-- 无任何活动空态 -->
    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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

/* ================= Hero 巨幕 ================= */
.hero {
  position: relative;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  margin-bottom: 44px;
  min-height: 220px;
  display: flex;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}
.hero-scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--c-card-accent-bg);
}
.hero--cover .hero-scrim {
  background: linear-gradient(135deg, rgba(31, 90, 79, 0.94), rgba(45, 122, 108, 0.80));
}
.hero-body {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 36px;
  width: 100%;
  padding: 36px 40px;
  color: var(--c-card-accent-text);
}
/* 有封面图时保持白字（深色遮罩上） */
.hero--cover .hero-body {
  color: #ffffff;
}
.hero-left { flex-shrink: 0; }
.hero-eyebrow {
  display: block;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  opacity: 0.85;
  margin-bottom: 10px;
}
.hero-countdown { display: flex; align-items: baseline; gap: 8px; }
.hero-countdown.ongoing { align-items: center; }
.hero-cd-ongoing {
  font-size: 36px;
  font-weight: 800;
  color: var(--c-accent);
  letter-spacing: -0.5px;
}
.hero-cd-block { display: flex; align-items: baseline; gap: 4px; }
.hero-cd-num {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}
.hero-cd-unit { font-size: 18px; font-weight: 600; opacity: 0.85; }
.hero-countdown-label {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.8;
}
.hero-main { flex: 1; min-width: 0; }
.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.hero-meta { display: flex; flex-wrap: wrap; gap: 16px; }
.hero-meta-item { font-size: 14px; opacity: 0.9; }
.hero-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.hero-ring-wrap { position: relative; width: 64px; height: 64px; }
.hero-ring { width: 100%; height: 100%; }
.hero-ring-track { opacity: 0.28; }
.hero-ring-progress { opacity: 1; }
.hero-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}
.hero-ring-count { font-size: 11px; font-weight: 600; }
.hero-ring-label { font-size: 12px; opacity: 0.85; }
.hero-body--empty { justify-content: center; min-height: 160px; }
.hero-empty-text { font-size: 18px; font-weight: 600; margin: 0; }

/* ================= 脊柱时间线 ================= */
.timeline {
  position: relative;
  padding-left: 44px;
}
/* 薄荷脊柱 */
.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  border-radius: 1px;
  background: var(--c-accent);
  opacity: 0.55;
}
.timeline-item {
  position: relative;
  padding-bottom: 22px;
}

/* 今天分割线 */
.today-divider {
  position: relative;
  margin-left: -44px;
  margin-bottom: 22px;
  border-top: 2px dashed var(--c-text-quaternary);
}
.today-divider-label {
  position: absolute;
  top: -9px;
  left: 30px;
  background: var(--c-bg-primary);
  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--c-text-tertiary);
}

/* 活动卡片 */
.tl-card {
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  transition: border-color var(--transition-fast), transform var(--transition-fast);
}
.tl-card:hover { border-color: var(--c-accent-light); }
.timeline-item.past .tl-card {
  background: var(--c-bg-tertiary);
  opacity: 0.88;
}
.tl-card-head { display: flex; gap: 16px; align-items: stretch; }

/* 日期块 */
.tl-date-block {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 88px;
  padding: 14px 18px;
  background: var(--c-accent);
  border-radius: var(--radius-lg);
}
.tl-date-dot {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--c-bg-primary);
  border: 3px solid var(--c-accent);
  z-index: 2;
}
.timeline-item.future .tl-date-dot {
  box-shadow: 0 0 0 4px var(--c-accent-glow), 0 0 10px var(--c-accent);
}
.timeline-item.past .tl-date-dot {
  border-color: var(--c-text-quaternary);
  box-shadow: none;
}
.timeline-item.past .tl-date-block { background: var(--c-bg-elevated); }
.tl-month {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.timeline-item.past .tl-month { color: var(--c-text-tertiary); }

/* 深色模式：未来活动用深绿背景配白字，保证对比度 */
html.dark .timeline-item.future .tl-date-block {
  background: var(--c-accent-dark);
}
html.dark .timeline-item.future .tl-month {
  color: #fff;
}
html.dark .timeline-item.past .tl-month {
  color: var(--c-text-tertiary);
}

.tl-main { flex: 1; min-width: 0; }
.tl-side {
  flex-shrink: 0;
  width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 2px;
}
.tl-side .tl-soon,
.tl-side .tl-ended {
  width: 100%;
  text-align: center;
}
.tl-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.tl-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0;
  line-height: 1.4;
}
.tl-title-links {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
  flex-shrink: 0;
}
.tl-title-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--c-text-secondary);
  text-decoration: none;
  white-space: nowrap;
  padding: 3px 9px;
  border-radius: 20px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  transition: all 0.2s ease;
  cursor: pointer;
}
.tl-title-link:hover {
  color: var(--c-accent);
  border-color: var(--c-accent);
  background: var(--c-accent-light);
}
.tl-title-link--finance:hover {
  color: var(--c-finance-expense, #34c759);
  border-color: var(--c-finance-expense, #34c759);
  background: rgba(52, 199, 89, 0.08);
}
.tl-soon {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-accent);
  background: var(--c-accent-light);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.tl-ended {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-tertiary);
  background: var(--c-bg-elevated);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.tl-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}
.tl-meta-item { font-size: 13px; color: var(--c-text-secondary); }
.tl-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--c-text-secondary);
  margin: 0 0 12px 0;
}

/* 报名进度 */
.tl-progress { display: flex; align-items: center; gap: 10px; }
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
.progress-count {
  font-size: 12px;
  color: var(--c-text-tertiary);
  white-space: nowrap;
}

/* 回顾摘要条 */
.tl-review {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--c-border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}
.tl-review-item { font-size: 13px; color: var(--c-text-secondary); }
.tl-review-link {
  color: var(--c-accent);
  text-decoration: none;
  font-weight: 600;
}
.tl-review-link:hover { text-decoration: underline; }
.tl-review-summary {
  width: 100%;
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--c-text-tertiary);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--c-text-tertiary);
}
.empty-state svg { margin-bottom: 16px; opacity: 0.5; }
.empty-state p { font-size: 15px; margin: 0; }

/* 尊重减少动效偏好：仅在允许时做节点脉冲发光 */
@media (prefers-reduced-motion: no-preference) {
  .timeline-item.future .timeline-dot {
    animation: dot-pulse 2.4s ease-in-out infinite;
  }
}
@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 0 3px var(--c-accent-glow), 0 0 6px var(--c-accent); }
  50% { box-shadow: 0 0 0 6px var(--c-accent-glow), 0 0 14px var(--c-accent); }
}

/* ================= 响应式 ================= */
@media (max-width: 640px) {
  .activities-page { padding: 0 16px 80px; }
  .hero { min-height: 0; }
  .hero-body {
    position: relative;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 24px 22px;
    padding-right: 90px;
  }
  .hero-left { order: 1; }
  .hero-main { order: 2; }
  .hero-right {
    position: absolute;
    top: 20px;
    right: 20px;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .hero-ring-wrap { width: 52px; height: 52px; }
  .hero-ring-label { font-size: 10px; }
  .hero-cd-num { font-size: 40px; }
  .hero-title { font-size: 20px; }

  .timeline { padding-left: 36px; }
  .timeline::before { left: 15px; }
  .timeline-dot { left: 16px; }
  .today-divider { margin-left: -36px; }

  .tl-card-head { flex-direction: column; gap: 12px; }
  .tl-date-block {
    width: 100%;
    padding: 10px 14px;
  }
  .tl-month { font-size: 15px; }
}

/* ========== 报名按钮 ========== */
.hero-signup-row {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
.hero-signup-btn {
  padding: 14px 48px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
}
.hero-signup-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.hero-signup-btn.signed {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  border: 1.5px solid #34c759;
}
.hero-signup-btn.signed:hover { background: rgba(52, 199, 89, 0.25); }
.hero-signup-btn.full {
  background: var(--c-bg-secondary);
  color: var(--c-text-tertiary);
  cursor: not-allowed;
  border: 1px solid var(--c-border);
}

.tl-signup {
  width: 100%;
  display: flex;
}
.signup-btn {
  width: 100%;
  padding: 9px 12px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.signup-btn:hover:not(:disabled) { opacity: 0.9; }
.signup-btn.signed {
  background: rgba(52, 199, 89, 0.12);
  color: #34c759;
  border: 1px solid #34c759;
}
.signup-btn.signed:hover { background: rgba(52, 199, 89, 0.2); }
.signup-btn.full {
  background: var(--c-bg-secondary);
  color: var(--c-text-tertiary);
  cursor: not-allowed;
  border: 1px solid var(--c-border);
}

@media (max-width: 640px) {
  .hero-signup-btn { width: 100%; padding: 14px 24px; }
  .tl-signup { width: 100%; }
  .signup-btn { width: 100%; padding: 11px; }
}
</style>
