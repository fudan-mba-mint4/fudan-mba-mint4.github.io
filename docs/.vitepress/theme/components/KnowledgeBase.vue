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
    search: '搜索笔记、总结、考题…',
    allCourses: '全部课程',
    notes: '笔记',
    summaries: '总结',
    exams: '考题参考',
    lastUpdated: '更新于',
    noResults: '未找到相关内容',
    view: '查看',
    download: '下载',
    typeLabels: { note: '课程笔记', summary: '重点总结', exam: '考题参考', resource: '学习资源' },
  },
  en: {
    search: 'Search notes, summaries, exams…',
    allCourses: 'All Courses',
    notes: 'Notes',
    summaries: 'Summaries',
    exams: 'Past Exams',
    lastUpdated: 'Updated',
    noResults: 'No results found',
    view: 'View',
    download: 'Download',
    typeLabels: { note: 'Course Notes', summary: 'Key Summary', exam: 'Past Exam', resource: 'Resource' },
  },
  th: {
    search: 'ค้นหาโน้ต สรุป ข้อสอบ…',
    allCourses: 'ทุกวิชา',
    notes: 'โน้ต',
    summaries: 'สรุป',
    exams: 'ข้อสอบเก่า',
    lastUpdated: 'อัปเดต',
    noResults: 'ไม่พบผลลัพธ์',
    view: 'ดู',
    download: 'ดาวน์โหลด',
    typeLabels: { note: 'โน้ตวิชา', summary: 'สรุปสำคัญ', exam: 'ข้อสอบเก่า', resource: 'ทรัพยากร' },
  },
}
const t = computed(() => i18n[currentLang.value])

/* ========== Demo数据（待替换为真实数据） ========== */
const courses = ref([
  {
    id: 'dmd',
    name: { zh: '数据模型与决策', en: 'Data Modeling & Decision', th: 'การสร้างแบบจำลองข้อมูลและการตัดสินใจ' },
    teacher: { zh: '黄达', en: 'Huang Da', th: 'หวง ต้า' },
    color: '#5EC4AC',
    icon: '📊',
  },
  {
    id: 'mgmt-econ',
    name: { zh: '管理经济学', en: 'Managerial Economics', th: 'เศรษฐศาสตร์การบริหาร' },
    teacher: { zh: '罗云辉', en: 'Luo Yunhui', th: 'หลัว หยุนฮุย' },
    color: '#007AFF',
    icon: '📈',
  },
  {
    id: 'accounting',
    name: { zh: '会计学', en: 'Accounting', th: 'การบัญชี' },
    teacher: { zh: '钟覃琳', en: 'Zhong Qinlin', th: 'จง ชินหลิน' },
    color: '#FF9500',
    icon: '📒',
  },
  {
    id: 'marketing',
    name: { zh: '营销管理', en: 'Marketing Management', th: 'การจัดการการตลาด' },
    teacher: { zh: '待定', en: 'TBD', th: 'ยังไม่ระบุ' },
    color: '#AF52DE',
    icon: '🎯',
  },
  {
    id: 'strategy',
    name: { zh: '战略管理', en: 'Strategic Management', th: 'การบริหารเชิงกลยุทธ์' },
    teacher: { zh: '待定', en: 'TBD', th: 'ยังไม่ระบุ' },
    color: '#FF3B30',
    icon: '♟️',
  },
  {
    id: 'org-behavior',
    name: { zh: '组织行为学', en: 'Organizational Behavior', th: 'พฤติกรรมองค์กร' },
    teacher: { zh: '待定', en: 'TBD', th: 'ยังไม่ระบุ' },
    color: '#5856D6',
    icon: '🏢',
  },
  {
    id: 'general',
    name: { zh: '通用资料', en: 'General Resources', th: 'เอกสารทั่วไป' },
    teacher: { zh: '学院', en: 'School', th: 'โรงเรียน' },
    color: '#8E8E93',
    icon: '📋',
  },
])

const documents = ref([
  { id: 1, courseId: 'dmd', type: 'note', title: { zh: '第1讲：决策分析基础', en: 'Lecture 1: Decision Analysis Basics', th: 'บทที่ 1: พื้นฐานการวิเคราะห์การตัดสินใจ' }, author: '智库研究员', date: '2026-09-10', size: '2.3 MB' },
  { id: 2, courseId: 'dmd', type: 'summary', title: { zh: 'DMD核心公式速查表', en: 'DMD Formula Cheat Sheet', th: 'ตารางสูตรสำคัญ DMD' }, author: '智库研究员', date: '2026-09-10', size: '0.8 MB' },
  { id: 3, courseId: 'dmd', type: 'resource', title: { zh: '黄达老师推荐数学读物（3本）', en: 'Recommended Math Readings (3 books)', th: 'หนังสือคณิตศาสตร์ที่แนะนำ (3 เล่ม)' }, author: '黄达', date: '2026-09-10', size: '—' },
  { id: 4, courseId: 'mgmt-econ', type: 'note', title: { zh: '第1讲：供需理论与市场均衡', en: 'Lecture 1: Supply-Demand & Market Equilibrium', th: 'บทที่ 1: อุปสงค์-อุปทานและความสมดุลตลาด' }, author: '智库研究员', date: '2026-09-13', size: '1.8 MB' },
  { id: 5, courseId: 'accounting', type: 'note', title: { zh: '第1讲：财务会计基础', en: 'Lecture 1: Financial Accounting Basics', th: 'บทที่ 1: พื้นฐานการบัญชีการเงิน' }, author: '智库研究员', date: '2026-09-13', size: '2.1 MB' },
  { id: 6, courseId: 'general', type: 'resource', title: { zh: '复旦大学MBA学生手册', en: 'Fudan MBA Student Handbook', th: 'คู่มือนักศึกษา MBA ม.ฝูด่าน' }, author: '学院', date: '2026-09-01', size: '5.2 MB' },
  { id: 7, courseId: 'general', type: 'resource', title: { zh: '课程考勤与请假制度', en: 'Course Attendance & Leave Policy', th: 'ระเบียบการเข้าเรียนและการลา' }, author: '学院', date: '2026-09-01', size: '1.1 MB' },
  { id: 8, courseId: 'general', type: 'resource', title: { zh: '管理学院图书馆使用指南', en: 'School of Management Library Guide', th: 'คู่มือการใช้ห้องสมุดโรงเรียนบริหาร' }, author: '学院', date: '2026-09-01', size: '0.9 MB' },
  { id: 9, courseId: 'general', type: 'resource', title: { zh: '政立院区设施使用说明', en: 'Zhengli Campus Facilities Guide', th: 'คู่มือสิ่งอำนวยความสะดวก วิทยาเขตเจิ้งหลี่' }, author: '学院', date: '2026-09-01', size: '1.5 MB' },
])

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
      d.title.zh.toLowerCase().includes(q) ||
      d.title.en.toLowerCase().includes(q)
    )
  }
  return list.sort((a, b) => new Date(b.date) - new Date(a.date))
})

const courseDocCount = (courseId) => documents.value.filter(d => d.courseId === courseId).length

/* ========== 格式化 ========== */
const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  if (currentLang.value === 'zh') return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
  return d.toLocaleDateString(currentLang.value === 'en' ? 'en-US' : 'th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const typeIcon = (type) => {
  const map = { note: '📝', summary: '📋', exam: '📄', resource: '📚' }
  return map[type] || '📄'
}
</script>

<template>
  <div class="knowledge-page">
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

    <!-- 课程分类标签 -->
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
        <span class="tab-name">{{ course.name[currentLang] }}</span>
        <span class="tab-count">{{ courseDocCount(course.id) }}</span>
      </button>
    </div>

    <!-- 文档列表 -->
    <div class="doc-list" v-if="filteredDocs.length > 0">
      <div
        v-for="doc in filteredDocs"
        :key="doc.id"
        class="doc-card"
      >
        <div class="doc-icon">{{ typeIcon(doc.type) }}</div>
        <div class="doc-info">
          <span class="doc-type">{{ t.typeLabels[doc.type] }}</span>
          <h4 class="doc-title">{{ doc.title[currentLang] }}</h4>
          <div class="doc-meta">
            <span>{{ doc.author }}</span>
            <span class="meta-dot">·</span>
            <span>{{ t.lastUpdated }} {{ formatDate(doc.date) }}</span>
            <span v-if="doc.size !== '—'" class="meta-dot">·</span>
            <span v-if="doc.size !== '—'">{{ doc.size }}</span>
          </div>
        </div>
        <button class="doc-action">
          {{ t.view }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <p>{{ t.noResults }}</p>
    </div>
  </div>
</template>

<style scoped>
.knowledge-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 搜索框 */
.search-box {
  position: relative;
  margin-bottom: 24px;
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

/* 课程分类标签 */
.course-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.course-tabs::-webkit-scrollbar { display: none; }
.course-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--c-border);
  border-radius: 20px;
  background: var(--c-bg-secondary);
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
  color: #fff;
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
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.doc-card:hover {
  border-color: var(--c-accent-light);
  transform: translateY(-1px);
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

.doc-action {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: transparent;
  color: var(--c-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-family: inherit;
}
.doc-action:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
  background: var(--c-accent-light);
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
  .doc-action {
    padding: 6px 10px;
    font-size: 12px;
  }
  .doc-action svg { display: none; }
}
</style>
