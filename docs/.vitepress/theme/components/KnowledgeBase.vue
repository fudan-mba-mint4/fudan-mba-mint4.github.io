<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLang } from '../composables/useLang.js'

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    search: '搜索笔记、总结、考题…',
    allCourses: '全部课程',
    lastUpdated: '更新于',
    noResults: '未找到相关内容',
    view: '查看',
    noLink: '暂无下载链接',
    clearHistory: '清除阅读记录',
    localOnly: '仅本机保存',
    typeLabels: { note: '课程笔记', summary: '重点总结', exam: '考题参考', resource: '学习资源' },
  },
  en: {
    search: 'Search notes, summaries, exams…',
    allCourses: 'All Courses',
    lastUpdated: 'Updated',
    noResults: 'No results found',
    view: 'View',
    noLink: 'No download link yet',
    clearHistory: 'Clear history',
    localOnly: 'Stored on this device only',
    typeLabels: { note: 'Course Notes', summary: 'Key Summary', exam: 'Past Exam', resource: 'Resource' },
  },
  th: {
    search: 'ค้นหาโน้ต สรุป ข้อสอบ…',
    allCourses: 'ทุกวิชา',
    lastUpdated: 'อัปเดต',
    noResults: 'ไม่พบผลลัพธ์',
    view: 'ดู',
    noLink: 'ยังไม่มีลิงก์ดาวน์โหลด',
    clearHistory: 'ล้างประวัติการอ่าน',
    localOnly: 'บันทึกเฉพาะเครื่องนี้',
    typeLabels: { note: 'โน้ตวิชา', summary: 'สรุปสำคัญ', exam: 'ข้อสอบเก่า', resource: 'ทรัพยากร' },
  },
}
const { lang, t } = useLang(i18n)

/* ========== 数据（JSON 驱动） ========== */
const courses = ref([])
const documents = ref([])

/* ========== 阅读进度（localStorage） ========== */
const STORAGE_KEY = 'mint4:kb:v1'
const readIds = ref([])
const toast = ref('')
let toastTimer = null

const loadReadIds = () => {
  try {
    readIds.value = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    readIds.value = []
  }
}
const saveReadIds = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds.value)) } catch {}
}
const isRead = (id) => readIds.value.includes(id)

const showToast = (msg) => {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

const openDoc = (doc) => {
  if (!isRead(doc.id)) {
    readIds.value.push(doc.id)
    saveReadIds()
  }
  if (doc.url) {
    window.open(doc.url, '_blank', 'noopener')
  } else {
    showToast(t.value.noLink)
  }
}

const clearHistory = () => {
  readIds.value = []
  saveReadIds()
}

/* ========== 搜索与筛选 ========== */
const searchQuery = ref('')
const activeCourse = ref('all')

const filteredDocs = computed(() => {
  let list = [...documents.value]
  if (activeCourse.value !== 'all') {
    list = list.filter(d => d.courseId === activeCourse.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(d =>
      ((d.title[lang.value] || '').toLowerCase().includes(q)) ||
      ((d.title.zh || '').toLowerCase().includes(q)) ||
      ((d.title.en || '').toLowerCase().includes(q))
    )
  }
  return list.sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'))
})

const courseDocCount = (courseId) => documents.value.filter(d => d.courseId === courseId).length
const courseById = (id) => courses.value.find(c => c.id === id)

/* ========== 格式化 ========== */
const formatDate = (dateStr) => {
  const d = new Date((dateStr || '1970-01-01') + 'T00:00:00')
  if (lang.value === 'zh') return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
  return d.toLocaleDateString(lang.value === 'en' ? 'en-US' : 'th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const typeIcon = (type) => {
  const map = { note: '📝', summary: '📋', exam: '📄', resource: '📦' }
  return map[type] || '📄'
}

onMounted(async () => {
  loadReadIds()
  try {
    const res = await fetch('/data/knowledge-base.json')
    const data = await res.json()
    courses.value = data.courses || []
    documents.value = data.documents || []
  } catch (e) {
    console.warn('knowledge base data load failed', e)
  }
})

onUnmounted(() => {
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="knowledge-page">
    <!-- 工具行：清除阅读记录 -->
    <div class="kb-toolbar">
      <span class="local-note">🔒 {{ t.localOnly }}</span>
      <button class="clear-btn" @click="clearHistory">{{ t.clearHistory }}</button>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t.search"
        class="search-input"
      />
    </div>

    <!-- 课程分类标签（横向滚动 chip） -->
    <div class="course-tabs">
      <button
        class="course-tab"
        :class="{ active: activeCourse === 'all' }"
        @click="activeCourse = 'all'"
      >
        {{ t.allCourses }}
      </button>
      <button
        v-for="course in courses"
        :key="course.id"
        class="course-tab"
        :class="{ active: activeCourse === course.id }"
        @click="activeCourse = course.id"
      >
        <span class="tab-icon">{{ course.icon }}</span>
        <span class="tab-name">{{ course.name[lang] }}</span>
        <span class="tab-count">{{ courseDocCount(course.id) }}</span>
      </button>
    </div>

    <!-- 文档卡片网格 -->
    <div class="doc-list" v-if="filteredDocs.length > 0">
      <article
        v-for="doc in filteredDocs"
        :key="doc.id"
        class="doc-card"
        :class="{ read: isRead(doc.id) }"
        @click="openDoc(doc)"
      >
        <div class="doc-icon">{{ typeIcon(doc.type) }}</div>
        <div class="doc-info">
          <span class="doc-type">{{ t.typeLabels[doc.type] }}</span>
          <h4 class="doc-title">{{ doc.title[lang] }}</h4>
          <div class="doc-meta">
            <span v-if="courseById(doc.courseId)" class="doc-course" :style="{ '--chip-color': courseById(doc.courseId).color }">
              {{ courseById(doc.courseId).name[lang] }}
            </span>
            <span>{{ doc.author }}</span>
            <span class="meta-dot">·</span>
            <span>{{ formatDate(doc.date) }}</span>
            <span v-if="doc.size !== '—'" class="meta-dot">·</span>
            <span v-if="doc.size !== '—'">{{ doc.size }}</span>
          </div>
        </div>
        <!-- 阅读进度环 -->
        <svg class="read-ring" width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="none" stroke="var(--c-border)" stroke-width="2"
            :class="{ filled: isRead(doc.id) }" />
        </svg>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <p>{{ t.noResults }}</p>
    </div>

    <!-- 轻提示 -->
    <transition name="kb-toast">
      <div v-if="toast" class="kb-toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<style scoped>
.knowledge-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 工具行 */
.kb-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}
.local-note {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}
.clear-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  cursor: pointer;
  font-family: inherit;
  transition: color var(--transition-fast);
}
.clear-btn:hover { color: var(--c-coral); }

/* 搜索框 */
.search-box {
  position: relative;
  margin-bottom: 16px;
}
.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--c-text-tertiary);
}
.search-input {
  width: 100%;
  padding: 14px 16px 14px 46px;
  border: 1px solid var(--c-border);
  border-radius: 14px;
  background: var(--c-bg-secondary);
  color: var(--c-text-primary);
  font-size: 15px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}
.search-input:focus {
  outline: none;
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px var(--c-accent-light);
}
.search-input::placeholder {
  color: var(--c-text-tertiary);
}

/* 课程分类标签（chip 横向滚动） */
.course-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  flex-wrap: nowrap;
}
.course-tabs::-webkit-scrollbar { display: none; }
.course-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  background: var(--c-bg-card);
  color: var(--c-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: inherit;
  flex-shrink: 0;
}
.course-tab:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}
.course-tab.active {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: var(--c-text-inverse);
}
.tab-icon { font-size: 14px; }
.tab-name { font-weight: 500; }
.tab-count {
  background: rgba(255,255,255,0.2);
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.course-tab:not(.active) .tab-count {
  background: var(--c-bg-elevated);
  color: var(--c-text-tertiary);
}

/* 文档卡片 */
.doc-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.doc-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.doc-card:hover {
  border-color: var(--c-border-accent);
  transform: translateY(-2px);
}
.doc-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--c-accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.doc-info {
  flex: 1;
  min-width: 0;
}
.doc-type {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-accent);
  background: var(--c-accent-light);
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}
.doc-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0 0 6px 0;
  line-height: 1.4;
  transition: color var(--transition-base);
}
.doc-card.read .doc-title {
  color: var(--c-text-tertiary);
}
.doc-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--c-text-tertiary);
  flex-wrap: wrap;
}
.meta-dot { opacity: 0.5; }
.doc-course {
  color: var(--chip-color, var(--c-accent));
  font-weight: 500;
}

/* 阅读进度环 */
.read-ring {
  flex-shrink: 0;
}
.read-ring circle {
  transition: stroke-dashoffset var(--transition-base), stroke var(--transition-base);
  stroke: var(--c-border);
}
.read-ring circle.filled {
  stroke: var(--c-accent);
  /* 整圆填满：dasharray = 周长 ≈ 50.27 */
  stroke-dasharray: 50.27;
  stroke-dashoffset: 0;
}

/* 轻提示 */
.kb-toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--c-bg-glass-strong);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--c-text-primary);
  font-size: var(--text-sm);
  padding: 10px 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-float);
  z-index: var(--z-toast);
}
.kb-toast-enter-active,
.kb-toast-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}
.kb-toast-enter-from,
.kb-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
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
@media (max-width: 768px) {
  .doc-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .knowledge-page {
    padding: 0 16px 80px;
  }
  .doc-card {
    padding: 14px 16px;
    gap: 12px;
  }
  .doc-icon {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }
}
</style>
