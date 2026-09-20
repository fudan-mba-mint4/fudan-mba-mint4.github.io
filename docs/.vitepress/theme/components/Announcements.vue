<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useNow } from '../composables/useNow.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

/* ========== i18n ========== */
const i18n = {
  zh: {
    all: '全部',
    important: '重要',
    normal: '通知',
    activity: '活动',
    academic: '教学',
    expand: '展开',
    collapse: '收起',
    noAnnouncements: '暂无公告',
    postedOn: '发布于',
    new: '新',
    searchPlaceholder: '搜索公告标题或内容…',
    pinnedTitle: '置顶公告',
    dueIn: '截止',
    expired: '已截止',
    daysUnit: '天',
    hoursUnit: '小时',
  },
  en: {
    all: 'All',
    important: 'Important',
    normal: 'Notice',
    activity: 'Activity',
    academic: 'Academic',
    expand: 'Read more',
    collapse: 'Collapse',
    noAnnouncements: 'No announcements',
    postedOn: 'Posted',
    new: 'New',
    searchPlaceholder: 'Search announcements…',
    pinnedTitle: 'Pinned',
    dueIn: 'Due',
    expired: 'Closed',
    daysUnit: 'd',
    hoursUnit: 'h',
  },
  th: {
    all: 'ทั้งหมด',
    important: 'สำคัญ',
    normal: 'แจ้งเตือน',
    activity: 'กิจกรรม',
    academic: 'การเรียน',
    expand: 'อ่านเพิ่ม',
    collapse: 'ย่อ',
    noAnnouncements: 'ไม่มีประกาศ',
    postedOn: 'เผยแพร่',
    new: 'ใหม่',
    searchPlaceholder: 'ค้นหาประกาศ…',
    pinnedTitle: 'ปักหมุด',
    dueIn: 'กำหนดส่ง',
    expired: 'ปิดรับแล้ว',
    daysUnit: 'วัน',
    hoursUnit: 'ชม.',
  },
}
const { lang, t } = useLang(i18n)

const locale = computed(() =>
  lang.value === 'th' ? 'th-TH-u-ca-buddhist' : lang.value === 'en' ? 'en-US' : 'zh-CN'
)

/* ========== 分类 ========== */
const categories = computed(() => [
  { key: 'all', label: t.value.all },
  { key: 'important', label: t.value.important },
  { key: 'normal', label: t.value.normal },
  { key: 'activity', label: t.value.activity },
  { key: 'academic', label: t.value.academic },
])
const activeCategory = ref('all')
const searchQuery = ref('')

/* ========== 数据：数据库优先，失败/空则静默回退静态 JSON ========== */
// 先 GET 数据库 API；仅当请求成功且目标数组非空才用 DB，否则回退静态 JSON。
// 任何 DB 异常都静默回退，绝不白屏。所有网络访问都在 onMounted（浏览器端）内。
async function fetchWithDbFallback(dbUrl, staticUrl, isUsable) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3000)
    const res = await fetchWithRetry(dbUrl, { signal: ctrl.signal })
    clearTimeout(timer)
    if (res.ok) {
      const json = await res.json()
      if (isUsable(json)) return json
    }
  } catch (e) {
    /* DB 不可达/超时，静默回退静态 JSON */
  }
  try {
    const res = await fetchWithRetry(staticUrl)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.json()
  } catch (e) {
    console.error(`[Announcements] 静态 JSON 加载失败 ${staticUrl}:`, e)
    return null
  }
}

const announcementsData = ref(null)
const announcements = computed(() => announcementsData.value?.announcements || [])

onMounted(async () => {
  if (typeof window === 'undefined') return
  announcementsData.value = await fetchWithDbFallback(
    '/api/announcements',
    '/data/announcements.json',
    (json) => Array.isArray(json?.announcements) && json.announcements.length > 0
  )
})

/* ========== 实时时钟（倒计时用，每分钟刷新） ========== */
const { now } = useNow()

/* ========== 筛选：分类 + 搜索 ========== */
const filtered = computed(() => {
  let list = [...announcements.value]
  if (activeCategory.value !== 'all') {
    list = list.filter(a => a.category === activeCategory.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(a => {
      const hay = [a.title, a.summary, a.content]
        .filter(Boolean)
        .map(o => (typeof o === 'object' ? o[lang.value] : o))
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }
  return list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.date) - new Date(a.date)
  })
})

/* 置顶巨幕：最多 2 条 */
const pinnedHero = computed(() => filtered.value.filter(a => a.pinned).slice(0, 2))
/* 时间线：非置顶，按日期倒序 */
const timeline = computed(() =>
  filtered.value.filter(a => !a.pinned).sort((a, b) => new Date(b.date) - new Date(a.date))
)

/* ========== 展开/收起 ========== */
const expanded = ref(new Set())
const toggle = (id) => {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}
const isExpanded = (id) => expanded.value.has(id)

/* ========== 日期格式化 ========== */
const formatDate = (dateStr) =>
  new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr))
const formatNodeDate = (dateStr) =>
  new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(new Date(dateStr))
const isTodayNode = (dateStr) => {
  const today = now.value
  return today.toDateString() === new Date(dateStr).toDateString()
}

/* ========== 截止倒计时药丸 ========== */
const deadlineState = (item) => {
  if (!item.deadline) return null
  const dl = new Date(item.deadline)
  const diff = dl - now.value
  if (diff <= 0) return { tier: 'expired', label: t.value.expired }

  const days = diff / (1000 * 60 * 60 * 24)
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const daysInt = Math.floor(days)

  if (diff < 24 * 60 * 60 * 1000) {
    // <24h 珊瑚色
    return { tier: 'urgent', label: `${t.value.dueIn} ${hours}${t.value.hoursUnit}` }
  }
  if (days <= 3) {
    // 1-3 天 琥珀色
    return { tier: 'warn', label: `${t.value.dueIn} ${daysInt}${t.value.daysUnit}` }
  }
  // >3 天 灰色
  return { tier: 'calm', label: `${t.value.dueIn} ${daysInt}${t.value.daysUnit}` }
}

/* ========== 分类颜色 ========== */
const categoryStyle = (cat) => {
  const map = {
    important: 'background: var(--c-coral-light); color: var(--c-coral);',
    normal: 'background: var(--c-blue); color: #fff; opacity: 0.9;',
    activity: 'background: var(--c-accent-light); color: var(--c-accent);',
    academic: 'background: var(--c-amber-light); color: var(--c-amber);',
  }
  return map[cat] || map.normal
}
const categoryLabel = (cat) => categories.value.find(c => c.key === cat)?.label || cat
</script>

<template>
  <div class="announcements-page">
    <!-- 分类筛选 + 搜索 -->
    <div class="toolbar">
      <div class="category-bar">
        <button
          v-for="cat in categories"
          :key="cat.key"
          class="category-btn"
          :class="{ active: activeCategory === cat.key }"
          @click="activeCategory = cat.key"
        >
          {{ cat.label }}
        </button>
      </div>
      <div class="search-box">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="searchQuery" type="search" :placeholder="t.searchPlaceholder" />
      </div>
    </div>

    <!-- 置顶巨幕卡（最多 2 条） -->
    <section v-if="pinnedHero.length" class="pinned-hero">
      <div class="pinned-grid">
        <article
          v-for="item in pinnedHero"
          :key="item.id"
          class="hero-card"
          :class="`hero-${item.category}`"
        >
          <div class="hero-meta">
            <span class="announcement-category" :style="categoryStyle(item.category)">
              {{ categoryLabel(item.category) }}
            </span>
            <span class="pinned-badge">📌 {{ t.pinnedTitle }}</span>
            <span
              v-if="deadlineState(item)"
              class="deadline-pill"
              :class="deadlineState(item).tier"
            >{{ deadlineState(item).label }}</span>
          </div>
          <h3 class="hero-title">{{ item.title[lang] }}</h3>
          <p class="hero-summary">{{ item.summary[lang] }}</p>
          <div class="hero-foot">
            <span class="announcement-date">{{ t.postedOn }} {{ formatDate(item.date) }}</span>
            <span v-if="item.created_by" class="announcement-author">· {{ item.created_by }} 发布</span>
          </div>
        </article>
      </div>
    </section>

    <!-- 非置顶时间线 -->
    <div v-if="timeline.length" class="timeline">
      <article
        v-for="item in timeline"
        :key="item.id"
        class="tl-item"
      >
        <!-- 左侧日期节点 -->
        <div class="tl-node-col">
          <div class="tl-node" :class="{ today: isTodayNode(item.date) }">
            <span class="tl-node-day">{{ new Date(item.date).getDate() }}</span>
            <span class="tl-node-month">{{ new Date(item.date).getMonth() + 1 }}月</span>
          </div>
          <div class="tl-line"></div>
        </div>

        <!-- 右侧公告卡片 -->
        <div
          class="announcement-card"
          :class="{ expanded: isExpanded(item.id) }"
          @click="toggle(item.id)"
        >
          <div class="announcement-meta">
            <span class="announcement-category" :style="categoryStyle(item.category)">
              {{ categoryLabel(item.category) }}
            </span>
            <span
              v-if="deadlineState(item)"
              class="deadline-pill"
              :class="deadlineState(item).tier"
            >{{ deadlineState(item).label }}</span>
            <span class="announcement-date">{{ formatDate(item.date) }}</span>
            <span v-if="item.created_by" class="announcement-author">· {{ item.created_by }} 发布</span>
          </div>
          <h3 class="announcement-title">{{ item.title[lang] }}</h3>
          <p class="announcement-summary">{{ item.summary[lang] }}</p>
          <button class="expand-btn" @click.stop="toggle(item.id)">
            {{ isExpanded(item.id) ? t.collapse : t.expand }}
            <svg class="expand-icon" :class="{ rotated: isExpanded(item.id) }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <transition name="content-expand">
            <div v-if="isExpanded(item.id)" class="announcement-content" @click.stop>
              <div class="content-divider"></div>
              <p>{{ item.content[lang] }}</p>
            </div>
          </transition>
        </div>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!pinnedHero.length" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <p>{{ t.noAnnouncements }}</p>
    </div>
  </div>
</template>

<style scoped>
.announcements-page {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-xl) var(--space-2xl);
}

/* ========== 工具栏：分类 + 搜索 ========== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  flex-wrap: wrap;
}
.category-bar {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.category-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  background: var(--c-bg-secondary);
  color: var(--c-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
}
.category-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }
.category-btn.active { background: var(--c-accent); border-color: var(--c-accent); color: var(--c-text-inverse); }

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  color: var(--c-text-tertiary);
  transition: border-color var(--transition-fast);
}
.search-box:focus-within { border-color: var(--c-accent); }
.search-box input {
  border: none;
  outline: none;
  background: transparent;
  padding: var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--c-text-primary);
  width: 200px;
  font-family: inherit;
}
.search-box input::placeholder { color: var(--c-text-quaternary); }

/* ========== 置顶巨幕 ========== */
.pinned-hero { margin-bottom: var(--space-10); }
.pinned-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
}
.hero-card {
  position: relative;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-left: 4px solid var(--c-accent);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  overflow: hidden;
}
.hero-card.hero-important { border-left-color: var(--c-coral); }
.hero-card.hero-activity { border-left-color: var(--c-accent); }
.hero-card.hero-academic { border-left-color: var(--c-amber); }

.hero-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}
.pinned-badge {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}
.hero-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 var(--space-2);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}
.hero-summary {
  font-size: var(--text-base);
  color: var(--c-text-secondary);
  margin: 0 0 var(--space-4);
  line-height: var(--line-height-relaxed);
}
.hero-foot {
  display: flex;
  align-items: center;
}

/* ========== 时间线 ========== */
.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
}
.tl-item {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: var(--space-4);
}
.tl-node-col {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tl-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  z-index: 1;
}
.tl-node.today {
  border-color: var(--c-accent);
  background: var(--c-accent-light);
}
.tl-node-day {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--c-text-primary);
  line-height: 1;
}
.tl-node.today .tl-node-day { color: var(--c-accent); }
.tl-node-month {
  font-size: 9px;
  color: var(--c-text-tertiary);
  text-transform: lowercase;
}
.tl-line {
  flex: 1;
  width: 2px;
  background: var(--c-border);
  margin: var(--space-1) 0;
}

/* ========== 公告卡片 ========== */
.announcement-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.announcement-card:hover { border-color: var(--c-border-accent); }

.announcement-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}
.announcement-category {
  padding: 3px var(--space-2);
  border-radius: var(--radius-xs);
  font-size: var(--text-xs);
  font-weight: 500;
}
.announcement-author { font-size: 12px; color: var(--c-text-tertiary); font-weight: 400; }
.announcement-date {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}
.announcement-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0 0 var(--space-2);
  line-height: var(--line-height-tight);
}
.announcement-summary {
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
  margin: 0 0 var(--space-3);
  line-height: var(--line-height-relaxed);
}

.expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-1) var(--space-3);
  border: none;
  background: transparent;
  color: var(--c-accent);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  font-family: inherit;
}
.expand-btn:hover { background: var(--c-accent-light); }
.expand-icon { transition: transform var(--transition-fast); }
.expand-icon.rotated { transform: rotate(180deg); }

.announcement-content { padding-top: var(--space-3); }
.content-divider { height: 1px; background: var(--c-border); margin-bottom: var(--space-3); }
.announcement-content p {
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--c-text-secondary);
  margin: 0;
}

.content-expand-enter-active, .content-expand-leave-active {
  transition: opacity var(--transition-fast), max-height var(--transition-fast);
  overflow: hidden;
}
.content-expand-enter-from, .content-expand-leave-to { opacity: 0; max-height: 0; }
.content-expand-enter-to, .content-expand-leave-from { max-height: 600px; }

/* ========== 截止倒计时药丸 ========== */
.deadline-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.deadline-pill.calm {
  background: var(--c-bg-tertiary);
  color: var(--c-text-tertiary);
}
.deadline-pill.warn {
  background: var(--c-amber-light);
  color: var(--c-amber);
}
.deadline-pill.urgent {
  background: var(--c-coral-light);
  color: var(--c-coral);
  animation: coralPulse 2s ease-in-out infinite;
}
.deadline-pill.expired {
  background: var(--c-bg-tertiary);
  color: var(--c-text-quaternary);
  text-decoration: line-through;
}
@keyframes coralPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--c-coral-light); }
  50%      { box-shadow: 0 0 0 6px transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .deadline-pill.urgent { animation: none; }
}

/* ========== 空状态 ========== */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-5);
  color: var(--c-text-tertiary);
}
.empty-state svg { margin-bottom: var(--space-4); opacity: 0.5; }
.empty-state p { font-size: var(--text-base); margin: 0; }

/* ========== 移动端 ========== */
@media (max-width: 640px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-box input { width: 100%; }
  .pinned-grid { grid-template-columns: 1fr; }
  .hero-card { padding: var(--space-4); }
  .hero-title { font-size: var(--text-lg); }
  .tl-item { grid-template-columns: 44px 1fr; gap: var(--space-3); }
  .tl-node { width: 40px; height: 40px; }
  .announcement-card { padding: var(--space-4); margin-bottom: var(--space-4); }
}
</style>
