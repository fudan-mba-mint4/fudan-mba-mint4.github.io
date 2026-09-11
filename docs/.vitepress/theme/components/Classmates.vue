<script setup>
import { ref, computed } from 'vue'
import classData from '../../../public/data/class-members.json'
import { useLang } from '../composables/useLang'

const searchQuery = ref('')

// 多语言文案
const i18n = {
  zh: {
    title: '同学名录',
    subtitle: '薄荷 4 班全体成员',
    searchPlaceholder: '搜索同学姓名...',
    stats: { total: '总人数', female: '女生', male: '男生', mentors: '传承人' },
    classGuides: '班级导师',
    mentors: '传承人 · 感谢付出',
    mentorsSubtitle: '感谢每一位的付出与陪伴',
    students: '本班同学',
    studentsSubtitle: '按 Orientation 初次见面分组展示',
    group: '组',
    members: '人',
    headTeacherRole: '班主任',
    mentorRole: '传承人',
    noResults: '未找到匹配的同学',
    noResultsHint: '请尝试其他关键词',
    clearSearch: '清除搜索'
  },
  en: {
    title: 'Class Directory',
    subtitle: 'All Members of Mint 4',
    searchPlaceholder: 'Search classmate name...',
    stats: { total: 'Total', female: 'Female', male: 'Male', mentors: 'Mentors' },
    classGuides: 'Class Guides',
    mentors: 'Mentors · With Gratitude',
    mentorsSubtitle: 'Thank you for your dedication.',
    students: 'Classmates',
    studentsSubtitle: 'Grouped by Orientation first-meeting groups',
    group: 'Group',
    members: 'members',
    headTeacherRole: 'Head Teacher',
    mentorRole: 'Mentor',
    noResults: 'No matching classmates found',
    noResultsHint: 'Try a different keyword',
    clearSearch: 'Clear search'
  },
  th: {
    title: 'สารบัญชั้นเรียน',
    subtitle: 'สมาชิกทุกคนของ Mint 4',
    searchPlaceholder: 'ค้นหาชื่อเพื่อนร่วมชั้น...',
    stats: { total: 'ทั้งหมด', female: 'หญิง', male: 'ชาย', mentors: 'ผู้ให้คำปรึกษา' },
    classGuides: 'ผู้แนะนำชั้นเรียน',
    mentors: 'ผู้ให้คำปรึกษา · ขอขอบคุณ',
    mentorsSubtitle: 'ขอบคุณสำหรับความอุทิศตน',
    students: 'เพื่อนร่วมชั้น',
    studentsSubtitle: 'จัดกลุ่มตามกลุ่มพบปะครั้งแรก Orientation',
    group: 'กลุ่ม',
    members: 'คน',
    headTeacherRole: 'ครูประจำชั้น',
    mentorRole: 'ผู้ให้คำปรึกษา',
    noResults: 'ไม่พบเพื่อนร่วมชั้นที่ตรงกัน',
    noResultsHint: 'ลองค้นหาคำอื่น',
    clearSearch: 'ล้างการค้นหา'
  }
}

const { t } = useLang(i18n)

// 过滤掉退学/休学的同学
const activeMembers = computed(() =>
  (classData.members || []).filter(m => m.status !== 'withdrawn' && m.status !== 'suspended')
)

// 按角色分类
const headTeacher = computed(() =>
  activeMembers.value.find(m => m.role === 'headTeacher')
)

const mentorLeader = computed(() =>
  activeMembers.value.find(m => m.role === 'mentorLeader')
)

const mentors = computed(() =>
  activeMembers.value.filter(m => m.role === 'mentor')
)

const students = computed(() =>
  activeMembers.value.filter(m => m.role === 'student')
)

// 按组分类传承人
const mentorsByGroup = computed(() => {
  const groups = {}
  for (let i = 1; i <= 6; i++) {
    groups[i] = mentors.value.filter(m => m.mentorGroup === String(i))
  }
  return groups
})

// 按组分类同学（搜索过滤）
const studentsByGroup = computed(() => {
  const groups = {}
  for (let i = 1; i <= 6; i++) {
    groups[i] = students.value
      .filter(m => m.orientationGroup === String(i))
      .filter(m => {
        if (!searchQuery.value.trim()) return true
        const q = searchQuery.value.toLowerCase().trim()
        return m.name.toLowerCase().includes(q) ||
               (m.nickname && m.nickname.toLowerCase().includes(q))
      })
  }
  return groups
})

// 有搜索结果的组（用于隐藏空组）
const groupsWithResults = computed(() => {
  if (!searchQuery.value.trim()) return [1, 2, 3, 4, 5, 6]
  return [1, 2, 3, 4, 5, 6].filter(i => studentsByGroup.value[i].length > 0)
})

// 统计数据
const stats = computed(() => {
  const active = activeMembers.value
  const female = active.filter(m => m.gender === 'female').length
  const male = active.filter(m => m.gender === 'male').length
  return {
    total: active.length,
    female,
    male,
    mentors: mentors.value.length + (mentorLeader.value ? 1 : 0)
  }
})

// 性别圆点 class
const dotClass = (gender) => gender === 'female' ? 'dot-female' : 'dot-male'
</script>

<template>
  <div class="classmates-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">{{ t.title }}</h1>
      <p class="page-subtitle">{{ t.subtitle }}</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-card--total">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">{{ t.stats.total }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.female }}</div>
        <div class="stat-label">{{ t.stats.female }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.male }}</div>
        <div class="stat-label">{{ t.stats.male }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.mentors }}</div>
        <div class="stat-label">{{ t.stats.mentors }}</div>
      </div>
    </div>

    <!-- 班级导师与传承人 -->
    <div class="directory-section">
      <h2 class="section-title-sm">{{ t.classGuides }}</h2>
      <div class="person-row" v-if="headTeacher">
        <span class="name-dot" :class="dotClass(headTeacher.gender)"></span>
        <span class="name-uniform">{{ headTeacher.name }}</span>
        <span class="name-nickname" v-if="headTeacher.nickname">{{ headTeacher.nickname }}</span>
        <span class="role-tag role-tag--accent">{{ t.headTeacherRole }}</span>
      </div>

      <h2 class="section-title section-title--spaced">{{ t.mentors }}</h2>
      <p class="section-subtitle">{{ t.mentorsSubtitle }}</p>

      <!-- 张志鹏（传承人，不突出Leader） -->
      <div class="person-row person-row--spaced" v-if="mentorLeader">
        <span class="name-dot" :class="dotClass(mentorLeader.gender)"></span>
        <span class="name-uniform">{{ mentorLeader.name }}</span>
        <span class="name-nickname" v-if="mentorLeader.nickname">{{ mentorLeader.nickname }}</span>
        <span class="role-tag role-tag--accent">{{ t.mentorRole }}</span>
      </div>

      <div class="mentors-grid">
        <div class="group-card" v-for="i in 6" :key="i">
          <div class="group-card-header">
            <span class="group-badge">{{ i }}</span>
            <span class="group-card-title">{{ t.group }} {{ i }}</span>
            <span class="group-card-count">{{ mentorsByGroup[i].length }} {{ t.members }}</span>
          </div>
          <ul class="group-card-names">
            <li class="group-name-item" v-for="m in mentorsByGroup[i]" :key="m.id">
              <span class="name-dot" :class="dotClass(m.gender)"></span>
              <span class="name-uniform">{{ m.name }}</span>
              <span class="name-nickname" v-if="m.nickname">{{ m.nickname }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 同学按组展示（搜索框移入本区，关联内容组） -->
    <div class="directory-section">
      <h2 class="section-title">{{ t.students }}</h2>
      <p class="section-subtitle">{{ t.studentsSubtitle }}</p>

      <!-- 搜索框 -->
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t.searchPlaceholder"
          class="search-input"
        />
        <button
          v-if="searchQuery"
          class="search-clear"
          @click="searchQuery = ''"
          :aria-label="t.clearSearch"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="m15 9-6 6M9 9l6 6"/>
          </svg>
        </button>
      </div>

      <!-- 无搜索结果空状态 -->
      <Transition name="empty-fade">
        <div v-if="searchQuery.trim() && groupsWithResults.length === 0" class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
            <path d="m8 8 6 6M14 8l-6 6"/>
          </svg>
          <h3 class="empty-state-title">{{ t.noResults }}</h3>
          <p class="empty-state-hint">{{ t.noResultsHint }}</p>
        </div>
      </Transition>

      <!-- 同学组卡片（搜索过滤时过渡） -->
      <TransitionGroup name="group-filter" tag="div" class="students-grid">
        <div class="group-card" v-for="i in groupsWithResults" :key="i">
          <div class="group-card-header">
            <span class="group-badge">{{ i }}</span>
            <span class="group-card-title">{{ t.group }} {{ i }}</span>
            <span class="group-card-count">{{ studentsByGroup[i].length }} {{ t.members }}</span>
          </div>
          <ul class="group-card-names">
            <li class="group-name-item" v-for="m in studentsByGroup[i]" :key="m.id">
              <span class="name-dot" :class="dotClass(m.gender)"></span>
              <span class="name-uniform">{{ m.name }}</span>
              <span class="name-nickname" v-if="m.nickname">{{ m.nickname }}</span>
            </li>
          </ul>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* ========== 页面容器 ========== */
.classmates-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 24px 40px;
}

/* ========== 页面加载渐入动画 ========== */
@keyframes fadeInUpSubtle {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.page-header {
  animation: fadeInUpSubtle 300ms ease-out both;
  animation-delay: 0ms;
}

.stats-grid {
  animation: fadeInUpSubtle 300ms ease-out both;
  animation-delay: 50ms;
}

.directory-section {
  animation: fadeInUpSubtle 300ms ease-out both;
  animation-delay: 100ms;
}

.directory-section + .directory-section {
  animation-delay: 150ms;
}

/* ========== 统一名字样式 ========== */
.name-uniform {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.1px;
  color: var(--c-text-primary);
  min-width: 0;
}

/* 花名 */
.name-nickname {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--c-text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}

/* 性别圆点 */
.name-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.name-dot.dot-female { background: var(--c-gender-female); }
.name-dot.dot-male   { background: var(--c-gender-male); }

/* ========== 页面标题 ========== */
.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.2;
  margin: 0 0 4px 0;
  color: var(--c-text-primary);
}

.page-subtitle {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--c-text-secondary);
  margin: 0;
}

/* ========== 统计卡片 ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--c-bg-secondary);
  border: 0.5px solid var(--c-separator);
  border-radius: var(--radius-md);
  padding: 16px 12px;
  text-align: center;
  transition: background-color var(--transition-base),
              border-color var(--transition-base);
}

/* 总人数卡高亮态 —— 唯一视觉焦点 */
.stat-card--total {
  background: var(--c-accent-light);
  border-color: var(--c-border-accent);
}

.stat-card--total .stat-number {
  color: var(--c-accent);
}

.stat-card--total .stat-label {
  color: var(--c-text-secondary);
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1.2;
  color: var(--c-text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--c-text-tertiary);
}

/* ========== 区块 ========== */
.directory-section {
  padding: 0;
  margin-bottom: 32px;
}

.directory-section:last-of-type {
  margin-bottom: 0;
}

/* 分区标题（带薄荷绿竖条） */
.section-title {
  display: flex;
  align-items: center;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 1.3;
  margin: 0 0 8px 0;
  color: var(--c-text-primary);
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  background: var(--c-accent);
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
}

/* 传承人标题：与班主任之间增加呼吸感 */
.section-title--spaced {
  margin-top: 28px;
}

/* 子区块标签（班级导师） */
.section-title-sm {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  margin: 0 0 8px 0;
  color: var(--c-text-secondary);
}

.section-subtitle {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--c-text-secondary);
  margin: 0 0 16px 0;
}

/* ========== 单行人物行（班主任 / 张志鹏） ========== */
.person-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--c-bg-secondary);
  border: 0.5px solid var(--c-separator);
  border-radius: var(--radius-sm);
  max-width: 320px;
  transition: background-color var(--transition-base),
              border-color var(--transition-base);
}

.person-row--spaced {
  margin-bottom: 12px;
}

/* 角色标签 */
.role-tag {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  background: var(--c-bg-secondary);
  color: var(--c-text-secondary);
  margin-left: auto;
  white-space: nowrap;
  flex-shrink: 0;
}

.role-tag--accent {
  background: var(--c-accent-light);
  color: var(--c-accent);
}

/* ========== 统一组卡片（传承人 / 同学共用） ========== */
.mentors-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.group-card {
  background: var(--c-bg-card);
  border: 0.5px solid var(--c-separator);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: background-color var(--transition-base),
              border-color var(--transition-base);
}

.group-card:hover {
  background-color: var(--c-bg-secondary);
  border-color: var(--c-border);
}

.group-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.group-badge {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-xs);
  background: var(--c-accent);
  color: var(--c-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.group-card-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--c-text-primary);
  flex: 1;
}

.group-card-count {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--c-text-tertiary);
  flex-shrink: 0;
}

/* 名字列表（语义化 ul/li） */
.group-card-names {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.group-name-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

/* ========== 搜索框 ========== */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--c-bg-secondary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  max-width: 420px;
  margin-bottom: 16px;
  transition: background-color var(--transition-base),
              border-color var(--transition-base),
              box-shadow var(--transition-base);
}

.search-box:hover {
  background-color: var(--c-bg-tertiary);
}

.search-box:focus-within {
  background-color: var(--c-bg-primary);
  border-color: var(--c-border-accent);
  box-shadow: 0 0 0 3px var(--c-accent-glow);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--c-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--c-text-primary);
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--c-text-tertiary);
}

/* 搜索清除按钮 */
.search-clear {
  width: 18px;
  height: 18px;
  border: none;
  background: var(--c-bg-tertiary);
  border-radius: 50%;
  color: var(--c-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  transition: background-color var(--transition-fast),
              color var(--transition-fast),
              transform var(--transition-fast);
}

.search-clear svg {
  width: 10px;
  height: 10px;
}

.search-clear:hover {
  background: var(--c-border);
  color: var(--c-text-primary);
}

.search-clear:active {
  transform: scale(0.92);
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 24px;
}

.empty-state-icon {
  width: 32px;
  height: 32px;
  color: var(--c-text-tertiary);
  opacity: 0.4;
  margin-bottom: 12px;
}

.empty-state-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--c-text-primary);
  margin: 0 0 4px 0;
}

.empty-state-hint {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--c-text-tertiary);
  margin: 0;
}

/* 空状态过渡 */
.empty-fade-enter-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.empty-fade-leave-active {
  transition: opacity var(--transition-fast);
}

.empty-fade-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

.empty-fade-leave-to {
  opacity: 0;
}

/* ========== 搜索过滤组卡片过渡 ========== */
.group-filter-enter-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.group-filter-leave-active {
  transition: none;
}

.group-filter-move {
  transition: transform var(--transition-base);
}

.group-filter-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.group-filter-leave-to {
  opacity: 0;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .mentors-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .classmates-page {
    padding: 24px 16px 40px;
  }

  .page-title {
    font-size: 22px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-number {
    font-size: 18px;
  }

  .mentors-grid {
    grid-template-columns: 1fr;
  }

  .students-grid {
    grid-template-columns: 1fr;
  }

  .group-card-names {
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
  }

  .search-box {
    max-width: 100%;
  }

  .person-row {
    max-width: 100%;
  }
}
</style>
