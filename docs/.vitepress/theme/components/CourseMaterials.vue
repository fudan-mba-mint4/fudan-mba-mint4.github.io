<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLang } from '../composables/useLang.js'

const materialsData = ref(null)
const loading = ref(true)
const activeCourse = ref(0)

onMounted(() => {
  loadData()
})

const loadData = async () => {
  try {
    const res = await fetch('/data/course-materials.json')
    materialsData.value = await res.json()
    const courses = (materialsData.value && materialsData.value.courses) || []
    // 默认选中第一个有课件的课程
    const idx = courses.findIndex(c => (c.sessions || []).length > 0)
    activeCourse.value = idx >= 0 ? idx : 0
  } catch (e) {
    console.error('加载课件数据失败', e)
  } finally {
    loading.value = false
  }
}

const i18n = {
  zh: {
    label: '智库资源',
    title: '课程资料',
    subtitle: '按课程分类 · 含课件与作业',
    loading: '加载课程资料中...',
    noMaterials: '该课程资料尚未上传，敬请期待',
    session: '第',
    sessionUnit: '讲',
    slides: '课件',
    references: '推荐阅读 / 参考资料',
    homework: '课后作业',
    deadline: '截止日期',
    download: '下载',
    fileSize: '文件大小',
    teacher: '主讲',
    location: '教室',
    time: '时间',
    updated: '数据更新',
    tip: '文件较大，建议右键「另存为」下载',
    externalSource: '教务网站',
    sessionsShort: '讲'
  },
  en: {
    label: 'Knowledge Base',
    title: 'Course Materials',
    subtitle: 'By course · By session',
    loading: 'Loading materials...',
    noMaterials: 'Materials for this course have not been uploaded yet.',
    session: 'Session',
    sessionUnit: '',
    slides: 'Slides',
    references: 'Recommended Reading',
    homework: 'Homework',
    deadline: 'Deadline',
    download: 'Download',
    fileSize: 'Size',
    teacher: 'Instructor',
    location: 'Room',
    time: 'Time',
    updated: 'Updated',
    tip: 'Large files — right-click and "Save As" to download',
    externalSource: 'School Portal',
    sessionsShort: 'sessions'
  },
  th: {
    label: 'คลังความรู้',
    title: 'เอกสารรายวิชา',
    subtitle: 'แยกตามรายวิชา · รวมสื่อการสอนและการบ้าน',
    loading: 'กำลังโหลดสื่อการสอน...',
    noMaterials: 'สื่อการสอนสำหรับรายวิชานี้ยังไม่ได้อัปโหลด',
    session: 'คาบที่',
    sessionUnit: '',
    slides: 'สไลด์',
    references: 'หนังสือแนะนำ',
    homework: 'การบ้าน',
    deadline: 'กำหนดส่ง',
    download: 'ดาวน์โหลด',
    fileSize: 'ขนาด',
    teacher: 'ผู้สอน',
    location: 'ห้อง',
    time: 'เวลา',
    updated: 'อัปเดต',
    tip: 'ไฟล์ขนาดใหญ่ แนะนำให้คลิกขวาแล้วบันทึกเป็น',
    externalSource: 'เว็บไซต์วิชาการ',
    sessionsShort: 'คาบ'
  }
}

const { lang: currentLang, t } = useLang(i18n)
const currentCourse = computed(() => (materialsData.value?.courses || [])[activeCourse.value] || null)

const courseName = computed(() => {
  if (!currentCourse.value) return ''
  if (currentLang.value === 'en' && currentCourse.value.name_en) return currentCourse.value.name_en
  return currentCourse.value.name || currentCourse.value.name_en || ''
})

const courseNameOf = (course) => {
  if (currentLang.value === 'en' && course.name_en) return course.name_en
  return course.name || course.name_en || ''
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (currentLang.value === 'zh') return `${d.getMonth() + 1}月${d.getDate()}日`
  if (currentLang.value === 'en') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="materials-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="label">{{ t.label }}</span>
      <h1>{{ t.title }}</h1>
      <p class="page-subtitle">{{ t.subtitle }}</p>
      <p class="page-tip" v-if="materialsData">{{ t.tip }}</p>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>{{ t.loading }}</p>
    </div>

    <template v-else-if="materialsData">
      <!-- 课程标签 -->
      <div class="course-tabs">
        <button
          v-for="(course, idx) in (materialsData.courses || [])"
          :key="course.id"
          class="course-tab"
          :class="{ active: activeCourse === idx, empty: (course.sessions || []).length === 0 }"
          @click="activeCourse = idx"
        >
          <span class="tab-name">{{ courseNameOf(course) }}</span>
          <span class="tab-count" v-if="(course.sessions || []).length > 0">{{ (course.sessions || []).length }} {{ t.sessionsShort }}</span>
          <span class="tab-count tab-count--empty" v-else>—</span>
        </button>
      </div>

      <!-- 课程信息 -->
      <div v-if="currentCourse" class="course-info">
        <div class="course-info-item">
          <span class="info-label">{{ t.teacher }}</span>
          <span class="info-value">{{ currentCourse.teacher }}</span>
        </div>
        <div class="course-info-item">
          <span class="info-label">{{ t.location }}</span>
          <span class="info-value">{{ currentCourse.location }}</span>
        </div>
        <div class="course-info-item">
          <span class="info-label">{{ t.time }}</span>
          <span class="info-value">{{ currentCourse.weekday }}</span>
        </div>
      </div>

      <!-- 无课件提示 -->
      <div v-if="currentCourse && (currentCourse.sessions || []).length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <p>{{ t.noMaterials }}</p>
      </div>

      <!-- 节次列表 -->
      <div v-else class="sessions-list">
        <div
          v-for="session in (currentCourse.sessions || [])"
          :key="session.session"
          class="session-block"
        >
          <!-- 节次头 -->
          <div class="session-header">
            <div class="session-badge">{{ session.session }}</div>
            <div class="session-info">
              <h3 class="session-title">{{ session.title }}</h3>
              <span class="session-date">{{ formatDate(session.date) }}</span>
            </div>
          </div>

          <!-- 课件 + 参考资料 并排 -->
          <div class="materials-row" v-if="(session.files && session.files.length > 0) || (session.references && session.references.length > 0)">
          <!-- 课件 -->
          <div v-if="session.files && session.files.length > 0" class="files-section">
            <h4 class="files-label">{{ t.slides }}</h4>
            <div class="files-grid">
              <template v-for="file in session.files" :key="file.filename">
                <!-- 下载型课件 -->
                <a
                  v-if="file.url"
                  :href="file.url"
                  class="file-card"
                  :target="file.external ? '_blank' : undefined"
                  :rel="file.external ? 'noopener noreferrer' : undefined"
                  :download="file.external ? undefined : ''"
                >
                  <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-meta">{{ file.external ? t.externalSource : (file.size ? (file.size + ' · PDF') : 'PDF') }}</span>
                  </div>
                  <div class="file-download">
                    <svg v-if="file.external" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                </a>
                <!-- 说明型课件（无下载链接，大文件等） -->
                <div v-else class="file-card file-card--note">
                  <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-meta" v-if="file.desc">{{ file.desc }}</span>
                    <span class="file-meta" v-else-if="file.size">{{ file.size }} · PDF</span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 参考资料 -->
          <div v-if="session.references && session.references.length > 0" class="refs-section">
            <h4 class="files-label">{{ t.references }}</h4>
            <div class="files-grid">
              <template v-for="ref in session.references" :key="ref.filename">
                <!-- 下载型参考资料 -->
                <a
                  v-if="ref.url"
                  :href="ref.url"
                  class="file-card file-card--ref"
                  download
                >
                  <div class="file-icon file-icon--ref">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ ref.name }}</span>
                    <span class="file-meta" v-if="ref.desc">{{ ref.desc }}</span>
                    <span class="file-meta" v-if="ref.size">{{ ref.size }} · PDF</span>
                  </div>
                  <div class="file-download">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                </a>
                <!-- 说明型参考资料（无下载链接） -->
                <div v-else class="file-card file-card--ref file-card--note">
                  <div class="file-icon file-icon--ref">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ ref.name }}</span>
                    <span class="file-meta" v-if="ref.desc">{{ ref.desc }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
          </div><!-- /materials-row -->

          <!-- 作业 -->
          <div v-if="session.homework" class="homework-section">
            <h4 class="files-label">{{ t.homework }}</h4>
            <a :href="session.homework.url" class="homework-card" download>
              <div class="homework-card-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div class="homework-card-info">
                <span class="homework-card-title">{{ session.homework.name }}</span>
                <span class="homework-card-desc" v-if="session.homework.description">{{ session.homework.description }}</span>
                <div class="homework-card-meta">
                  <span class="homework-meta-item homework-meta-item--deadline">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ t.deadline }}: {{ session.homework.deadline }}
                  </span>
                  <span class="homework-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    {{ session.homework.submission }}
                  </span>
                  <span class="homework-meta-item" v-if="session.homework.size">{{ session.homework.size }}</span>
                </div>
              </div>
              <div class="homework-card-download">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="materials-footer">
        <span>{{ t.updated }}：{{ materialsData.last_updated || '—' }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.materials-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

.page-header {
  margin-bottom: 32px;
}

.label {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-accent);
  background: var(--c-accent-light);
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 15px;
  color: var(--c-text-secondary);
  margin: 0 0 8px 0;
}

.page-tip {
  font-size: 13px;
  color: var(--c-text-tertiary);
  margin: 0;
}

.loading {
  text-align: center;
  padding: 60px 0;
  color: var(--c-text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 课程标签 */
.course-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.course-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border: 1.5px solid var(--c-accent-light);
  border-radius: 16px;
  background: var(--c-accent-light);
  color: var(--c-accent);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.course-tab:hover {
  border-color: var(--c-accent);
  background: var(--c-accent);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 122, 108, 0.2);
}

.course-tab.active {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
  box-shadow: 0 4px 16px rgba(45, 122, 108, 0.3);
}

.course-tab.empty {
  opacity: 0.5;
}

.tab-count {
  font-size: 12px;
  font-weight: 600;
  background: rgba(255,255,255,0.25);
  padding: 3px 10px;
  border-radius: 12px;
}

.course-tab:not(.active) .tab-count {
  background: var(--c-accent);
  color: #fff;
}

.tab-count--empty {
  background: transparent !important;
}

/* 课程信息 */
.course-info {
  display: flex;
  gap: 24px;
  margin-bottom: 28px;
  padding: 16px 20px;
  background: var(--c-bg-secondary);
  border-radius: 12px;
  flex-wrap: wrap;
}

.course-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: var(--c-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-primary);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--c-text-tertiary);
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state p {
  font-size: 15px;
  margin: 0;
}

/* 节次列表 */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.session-block {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 24px;
}

.session-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--c-border);
}

.session-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--c-accent-light);
  color: var(--c-accent);
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.session-info {
  flex: 1;
}

.session-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0 0 4px 0;
}

.session-date {
  font-size: 13px;
  color: var(--c-text-tertiary);
}

.files-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-secondary);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.materials-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  align-items: stretch;
}

.files-section,
.refs-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

.files-section .files-grid,
.refs-section .files-grid {
  flex: 1;
  align-content: start;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.file-card:hover {
  border-color: var(--c-accent);
  background: var(--c-accent-light);
  transform: translateY(-1px);
}

.file-card--note {
  cursor: default;
}
.file-card--note:hover {
  border-color: var(--c-border);
  background: var(--c-bg-secondary);
  transform: none;
}

/* ========== 作业卡片 ========== */
.homework-section {
  margin-top: 16px;
}

.homework-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: linear-gradient(135deg, var(--c-accent-light) 0%, var(--c-bg-secondary) 100%);
  border: 1px solid var(--c-accent-light);
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.25s ease;
}

.homework-card:hover {
  border-color: var(--c-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.homework-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--c-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.homework-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.homework-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.homework-card-desc {
  font-size: 13px;
  color: var(--c-text-secondary);
  line-height: 1.5;
}

.homework-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 4px;
}

.homework-meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--c-text-secondary);
}

.homework-meta-item svg {
  flex-shrink: 0;
}

.homework-meta-item--deadline {
  color: var(--c-accent);
  font-weight: 600;
}

.homework-card-download {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  color: var(--c-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.homework-card:hover .homework-card-download {
  background: var(--c-accent);
  color: #fff;
}

@media (max-width: 640px) {
  .materials-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .homework-card {
    padding: 14px 16px;
    gap: 12px;
  }
  .homework-card-icon {
    width: 44px;
    height: 44px;
  }
  .homework-card-title {
    font-size: 15px;
  }
  .homework-card-meta {
    gap: 10px;
  }
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--c-accent-light);
  color: var(--c-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon--ref {
  background: rgba(212, 175, 55, 0.1);
  color: #d4af37;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 12px;
  color: var(--c-text-tertiary);
}

.file-download {
  color: var(--c-text-tertiary);
  flex-shrink: 0;
  transition: color 0.2s;
}

.file-card:hover .file-download {
  color: var(--c-accent);
}

.materials-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--c-border);
  font-size: 12px;
  color: var(--c-text-tertiary);
  text-align: center;
}

/* 响应式 */
@media (max-width: 768px) {
  .materials-page {
    padding: 24px 16px 40px;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .course-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }

  .course-tab {
    flex-shrink: 0;
  }

  .course-info {
    gap: 16px;
  }

  .session-block {
    padding: 18px;
  }

  .files-grid {
    grid-template-columns: 1fr;
  }
}
</style>
