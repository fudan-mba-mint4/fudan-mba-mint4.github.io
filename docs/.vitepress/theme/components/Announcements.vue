<script setup>
import { ref, computed, onMounted } from 'vue'
import DeadlinePill from './DeadlinePill.vue'

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
    deadlineOn: '截止',
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
    deadlineOn: 'Due',
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
    deadlineOn: 'กำหนดส่ง',
  },
}
const t = computed(() => i18n[currentLang.value])

/* ========== 分类标签 ========== */
const categories = computed(() => [
  { key: 'all', label: t.value.all },
  { key: 'important', label: t.value.important },
  { key: 'normal', label: t.value.normal },
  { key: 'activity', label: t.value.activity },
  { key: 'academic', label: t.value.academic },
])

const activeCategory = ref('all')

/* ========== 公告数据（从JSON读取） ========== */
const announcements = ref([])
onMounted(async () => {
  try {
    const res = await fetch('/data/announcements.json')
    const data = await res.json()
    announcements.value = data.announcements
  } catch (e) {
    console.error('Failed to load announcements:', e)
  }
})

/* ========== 筛选逻辑 ========== */
const filtered = computed(() => {
  let list = [...announcements.value]
  if (activeCategory.value !== 'all') {
    list = list.filter(a => a.category === activeCategory.value)
  }
  // 置顶的排前面，然后按日期倒序
  return list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.date) - new Date(a.date)
  })
})

/* ========== 展开/收起 ========== */
const expanded = ref(new Set())
const toggle = (id) => {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}
const isExpanded = (id) => expanded.value.has(id)

/* ========== 格式化日期 ========== */
const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  if (currentLang.value === 'zh') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  } else if (currentLang.value === 'en') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } else {
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

/* ========== 分类颜色 ========== */
const categoryStyle = (cat) => {
  const map = {
    important: 'background: var(--c-red-light); color: var(--c-red);',
    normal: 'background: var(--c-blue-light); color: var(--c-blue);',
    activity: 'background: var(--c-accent-light); color: var(--c-accent);',
    academic: 'background: var(--c-orange-light); color: var(--c-orange);',
  }
  return map[cat] || map.normal
}

/* ========== 三级视觉权重配色（方案2.1） ==========
   level-1 一级：pinned=true 或 category=important → 深薄荷实心底 + 白字
   level-2 二级：normal / academic → 白底 + 左侧4px薄荷竖条
   level-3 三级：activity → 浅灰描边卡
   仅升级卡片底色/边框，与现有 categoryStyle chip 共存，不删除 chip */
const weightClass = (item) => {
  if (item.pinned || item.category === 'important') return 'announcement-card--level-1'
  if (item.category === 'activity') return 'announcement-card--level-3'
  return 'announcement-card--level-2'
}
</script>

<template>
  <div class="announcements-page">
    <!-- 分类筛选 -->
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

    <!-- 公告列表 -->
    <div class="announcement-list" v-if="filtered.length > 0">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="announcement-card"
        :class="[weightClass(item), { pinned: item.pinned, expanded: isExpanded(item.id) }]"
      >
        <div class="announcement-header" @click="toggle(item.id)">
          <div class="announcement-meta">
            <span class="announcement-category" :style="categoryStyle(item.category)">
              {{ categories.find(c => c.key === item.category)?.label }}
            </span>
            <span v-if="item.pinned" class="pinned-badge">📌</span>
            <DeadlinePill v-if="item.deadline" :deadline="item.deadline" size="sm" />
            <span class="announcement-date">{{ formatDate(item.date) }}</span>
          </div>
          <h3 class="announcement-title">{{ item.title[currentLang] }}</h3>
          <p class="announcement-summary">{{ item.summary[currentLang] }}</p>
          <button class="expand-btn" @click.stop="toggle(item.id)">
            {{ isExpanded(item.id) ? t.collapse : t.expand }}
            <svg class="expand-icon" :class="{ rotated: isExpanded(item.id) }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>
        <transition name="content-expand">
          <div v-if="isExpanded(item.id)" class="announcement-content">
            <div v-if="item.deadline" class="deadline-static-chip">
              <span class="deadline-static-label">{{ t.deadlineOn }}</span>
              <span>{{ formatDate(item.deadline) }}</span>
            </div>
            <div class="content-divider"></div>
            <p>{{ item.content[currentLang] }}</p>
          </div>
        </transition>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
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
  padding: 0 24px 60px;
}

/* 分类筛选栏 */
.category-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.category-btn {
  padding: 8px 16px;
  border: 1px solid var(--c-border);
  border-radius: 20px;
  background: var(--c-bg-secondary);
  color: var(--c-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.category-btn:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}
.category-btn.active {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}

/* 公告卡片 */
.announcement-card {
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.announcement-card:hover {
  border-color: var(--c-accent-light);
}
.announcement-card.pinned {
  border-left: 3px solid var(--c-accent);
}

/* ========== 方案2.1：三级视觉权重配色 ========== */
/* 一级：深薄荷实心底 + 白字 */
.announcement-card--level-1 {
  background: var(--c-accent-dark);
  border-color: var(--c-accent-dark);
}
.announcement-card--level-1:hover {
  border-color: var(--c-accent-dark);
}
.announcement-card--level-1 .announcement-title {
  color: var(--c-text-inverse);
}
.announcement-card--level-1 .announcement-summary {
  color: var(--c-text-inverse);
  opacity: 0.85;
}
.announcement-card--level-1 .announcement-date {
  color: var(--c-text-inverse);
  opacity: 0.75;
}
.announcement-card--level-1 .expand-btn {
  color: var(--c-text-inverse);
}
.announcement-card--level-1 .expand-btn:hover {
  background: var(--c-accent-glow);
}
.announcement-card--level-1 .content-divider {
  background: var(--c-text-inverse);
  opacity: 0.25;
}
.announcement-card--level-1 .announcement-content p {
  color: var(--c-text-inverse);
  opacity: 0.9;
}
.announcement-card--level-1 .deadline-static-chip {
  border-color: var(--c-text-inverse);
  background: transparent;
  color: var(--c-text-inverse);
}

/* 二级：白底 + 左侧4px薄荷竖条 */
.announcement-card--level-2 {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-left: 4px solid var(--c-accent);
}

/* 三级：浅灰描边卡 */
.announcement-card--level-3 {
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
}

.announcement-header {
  padding: 20px 24px;
  cursor: pointer;
}

.announcement-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.announcement-category {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.pinned-badge {
  font-size: 14px;
}
.announcement-date {
  font-size: 13px;
  color: var(--c-text-tertiary);
}

.announcement-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.announcement-summary {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--c-accent);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s ease;
  font-family: inherit;
}
.expand-btn:hover {
  background: var(--c-accent-light);
}
.expand-icon {
  transition: transform 0.2s ease;
}
.expand-icon.rotated {
  transform: rotate(180deg);
}

/* 展开内容 */
.announcement-content {
  padding: 0 24px 20px;
}
/* 展开态静态截止 chip（高亮截止日期） */
.deadline-static-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-accent-light);
  color: var(--c-accent);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}
.deadline-static-label {
  opacity: 0.7;
}
.content-divider {
  height: 1px;
  background: var(--c-border);
  margin-bottom: 16px;
}
.announcement-content p {
  font-size: 15px;
  line-height: 1.7;
  color: var(--c-text-secondary);
  margin: 0;
}

/* 展开动画 */
.content-expand-enter-active,
.content-expand-leave-active {
  transition: opacity 0.25s ease, max-height 0.25s ease;
  overflow: hidden;
}
.content-expand-enter-from,
.content-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.content-expand-enter-to,
.content-expand-leave-from {
  max-height: 500px;
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
  .announcements-page {
    padding: 0 16px 80px;
  }
  .announcement-header {
    padding: 16px 18px;
  }
  .announcement-content {
    padding: 0 18px 16px;
  }
  .announcement-title {
    font-size: 16px;
  }
}
</style>
