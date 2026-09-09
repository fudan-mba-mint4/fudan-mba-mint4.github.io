<script setup>
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import classData from '../../../public/data/class-members.json'

const { page } = useData()
const searchQuery = ref('')

// 当前语言（SSR默认中文，客户端mount后根据URL路径判断）
const currentLang = ref('zh')

onMounted(() => {
  const path = window.location.pathname
  if (path.startsWith('/en/')) currentLang.value = 'en'
  else if (path.startsWith('/th/')) currentLang.value = 'th'
  else currentLang.value = 'zh'
})

// 多语言文案
const i18n = {
  zh: {
    title: '同学名录',
    subtitle: '薄荷4班全体成员',
    searchPlaceholder: '搜索同学姓名...',
    stats: { total: '总人数', female: '女生', male: '男生', mentors: '传承人' },
    classGuides: '班级导师',
    mentors: '传承人 · 感谢付出',
    mentorsSubtitle: '往届学长学姐带领我们完成 Orientation，感谢每一位的付出与陪伴',
    students: '本班同学',
    studentsSubtitle: '按 Orientation 初次见面分组展示',
    group: '组',
    mentorOf: '传承人',
    members: '人',
    noResults: '未找到匹配的同学'
  },
  en: {
    title: 'Class Directory',
    subtitle: 'All Members of Mint 4',
    searchPlaceholder: 'Search classmate name...',
    stats: { total: 'Total', female: 'Female', male: 'Male', mentors: 'Mentors' },
    classGuides: 'Class Guides',
    mentors: 'Mentors · With Gratitude',
    mentorsSubtitle: 'Senior students who guided us through Orientation. Thank you for your dedication.',
    students: 'Classmates',
    studentsSubtitle: 'Grouped by Orientation first-meeting groups',
    group: 'Group',
    mentorOf: 'Mentors',
    members: 'members',
    noResults: 'No matching classmates found'
  },
  th: {
    title: 'สารบัญชั้นเรียน',
    subtitle: 'สมาชิกทุกคนของ Mint 4',
    searchPlaceholder: 'ค้นหาชื่อเพื่อนร่วมชั้น...',
    stats: { total: 'ทั้งหมด', female: 'หญิง', male: 'ชาย', mentors: 'ผู้ให้คำปรึกษา' },
    classGuides: 'ผู้แนะนำชั้นเรียน',
    mentors: 'ผู้ให้คำปรึกษา · ขอขอบคุณ',
    mentorsSubtitle: 'นักศึกษารุ่นเก่าที่แนะนำเราผ่าน Orientation ขอบคุณสำหรับความอุทิศตน',
    students: 'เพื่อนร่วมชั้น',
    studentsSubtitle: 'จัดกลุ่มตามกลุ่มพบปะครั้งแรก Orientation',
    group: 'กลุ่ม',
    mentorOf: 'ผู้ให้คำปรึกษา',
    members: 'คน',
    noResults: 'ไม่พบเพื่อนร่วมชั้นที่ตรงกัน'
  }
}

const t = computed(() => i18n[currentLang.value])

// 过滤掉退学的同学
const activeMembers = computed(() =>
  classData.members.filter(m => m.status !== 'withdrawn')
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
        return m.name.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
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

// 性别颜色
const genderColor = (gender) => gender === 'female' ? '#e8a0b4' : '#7ab8e8'
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
      <div class="stat-card">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">{{ t.stats.total }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #e8a0b4">{{ stats.female }}</div>
        <div class="stat-label">{{ t.stats.female }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #7ab8e8">{{ stats.male }}</div>
        <div class="stat-label">{{ t.stats.male }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: var(--c-accent)">{{ stats.mentors }}</div>
        <div class="stat-label">{{ t.stats.mentors }}</div>
      </div>
    </div>

    <!-- 班主任 -->
    <div class="section section-sm">
      <h2 class="section-title-sm">{{ t.classGuides }}</h2>
      <div class="teacher-single" v-if="headTeacher">
        <span class="name-dot" :style="{ background: genderColor(headTeacher.gender) }"></span>
        <span class="name-uniform">{{ headTeacher.name }}</span>
        <span class="role-tag">{{ currentLang === 'zh' ? '班主任' : currentLang === 'en' ? 'Head Teacher' : 'ครูประจำชั้น' }}</span>
      </div>
    </div>

    <!-- 传承人（含Leader） -->
    <div class="section">
      <h2 class="section-title">{{ t.mentors }}</h2>
      <p class="section-subtitle">{{ t.mentorsSubtitle }}</p>

      <!-- 传承人Leader -->
      <div class="mentor-leader-row" v-if="mentorLeader">
        <span class="name-dot" :style="{ background: genderColor(mentorLeader.gender) }"></span>
        <span class="name-uniform">{{ mentorLeader.name }}</span>
        <span class="role-tag accent">{{ currentLang === 'zh' ? '传承人 Leader' : currentLang === 'en' ? 'Mentor Leader' : 'หัวหน้าผู้ให้คำปรึกษา' }}</span>
      </div>

      <div class="mentors-grid">
        <div class="mentor-group-card" v-for="i in 6" :key="i">
          <div class="mentor-group-header">
            <span class="group-number">{{ i }}</span>
            <span class="group-label">{{ t.group }} · {{ t.mentorOf }}</span>
          </div>
          <div class="mentor-names">
            <div class="mentor-name" v-for="m in mentorsByGroup[i]" :key="m.id">
              <span class="name-dot" :style="{ background: genderColor(m.gender) }"></span>
              <span class="name-uniform">{{ m.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="section">
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
      </div>
    </div>

    <!-- 同学按组展示 -->
    <div class="section">
      <h2 class="section-title">{{ t.students }}</h2>
      <p class="section-subtitle">{{ t.studentsSubtitle }}</p>

      <!-- 无搜索结果提示 -->
      <div v-if="searchQuery.trim() && groupsWithResults.length === 0" class="no-results">
        {{ t.noResults }}
      </div>

      <div class="students-grid">
        <div class="student-group-card" v-for="i in groupsWithResults" :key="i">
          <div class="student-group-header">
            <span class="group-badge">{{ i }}</span>
            <span class="group-title">{{ t.group }} {{ i }}</span>
            <span class="group-count">{{ studentsByGroup[i].length }} {{ t.members }}</span>
          </div>
          <div class="student-names">
            <div
              class="student-name-item"
              v-for="m in studentsByGroup[i]"
              :key="m.id"
            >
              <span class="name-dot" :style="{ background: genderColor(m.gender) }"></span>
              <span class="name-uniform">{{ m.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.classmates-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 24px 40px;
}

/* 统一名字大小 */
.name-uniform {
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-primary);
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0 0 4px 0;
  color: var(--c-text-primary);
}

.page-subtitle {
  font-size: 13px;
  color: var(--c-text-secondary);
  margin: 0;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--c-bg-secondary);
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
}

.stat-number {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--c-text-primary);
  margin-bottom: 2px;
}

.stat-label {
  font-size: 11px;
  color: var(--c-text-tertiary);
}

/* 区块 */
.section {
  margin-bottom: 20px;
}

.section-sm {
  margin-bottom: 16px;
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--c-text-primary);
}

.section-title-sm {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: var(--c-text-secondary);
}

.section-subtitle {
  font-size: 12px;
  color: var(--c-text-secondary);
  margin: 0 0 10px 0;
  line-height: 1.5;
}

/* 班主任 - 单行 */
.teacher-single {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--c-bg-secondary);
  border-radius: 8px;
  max-width: 280px;
}

.role-tag {
  font-size: 11px;
  color: var(--c-text-tertiary);
  background: var(--c-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.role-tag.accent {
  color: var(--c-accent);
  background: var(--c-accent-light);
}

/* 传承人Leader - 单行 */
.mentor-leader-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--c-accent-light);
  border-radius: 8px;
  margin-bottom: 10px;
  max-width: 280px;
}

/* 传承人网格 */
.mentors-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.mentor-group-card {
  background: var(--c-bg-secondary);
  border-radius: 10px;
  padding: 10px;
}

.mentor-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.group-number {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background: var(--c-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.group-label {
  font-size: 11px;
  color: var(--c-text-tertiary);
}

.mentor-names {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mentor-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--c-bg-secondary);
  border-radius: 8px;
  padding: 8px 12px;
  max-width: 360px;
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
  color: var(--c-text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--c-text-tertiary);
}

/* 无搜索结果 */
.no-results {
  text-align: center;
  padding: 24px;
  color: var(--c-text-tertiary);
  font-size: 14px;
}

/* 同学网格 */
.students-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.student-group-card {
  background: var(--c-bg-secondary);
  border-radius: 10px;
  padding: 10px;
}

.student-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--c-border);
}

.group-badge {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background: var(--c-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-primary);
  flex: 1;
}

.group-count {
  font-size: 11px;
  color: var(--c-text-tertiary);
}

.student-names {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 1px 0;
}

/* 响应式 */
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
  .mentors-grid {
    grid-template-columns: 1fr;
  }
  .students-grid {
    grid-template-columns: 1fr;
  }
  .stat-number {
    font-size: 20px;
  }
}
</style>
