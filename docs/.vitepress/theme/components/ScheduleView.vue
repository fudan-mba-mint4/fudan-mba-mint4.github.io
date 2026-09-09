<script setup>
import { ref, onMounted, computed } from 'vue'

const scheduleData = ref(null)
const loading = ref(true)
const activeTab = ref('week') // 'week' or 'course'

onMounted(async () => {
  try {
    const res = await fetch('/data/schedule.json')
    scheduleData.value = await res.json()
  } catch (e) {
    console.error('加载课表失败', e)
  } finally {
    loading.value = false
  }
})

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${day}日 ${weekdays[date.getDay()]}`
}

// 判断是否已过
const isPast = (dateStr, timeStart) => {
  const now = new Date()
  const classTime = new Date(`${dateStr}T${timeStart}:00`)
  return classTime < now
}

// 判断是否是今天
const isToday = (dateStr) => {
  const today = new Date()
  const date = new Date(dateStr)
  return today.toDateString() === date.toDateString()
}

// 课程颜色映射
const courseColors = {
  '会计学': { bg: 'rgba(212, 175, 55, 0.1)', border: 'rgba(212, 175, 55, 0.4)', text: '#d4af37' },
  '管理经济学': { bg: 'rgba(79, 209, 197, 0.1)', border: 'rgba(79, 209, 197, 0.4)', text: '#4fd1c5' },
  '数据、模型与决策': { bg: 'rgba(120, 140, 220, 0.1)', border: 'rgba(120, 140, 220, 0.4)', text: '#8b9cf0' },
}

const getCourseColor = (name) => courseColors[name] || courseColors['会计学']
</script>

<template>
  <div class="schedule-page">
    <!-- 页面标题 -->
    <div class="page-header reveal">
      <span class="label">课程安排</span>
      <h1>本学期课表</h1>
      <p v-if="scheduleData">共 {{ scheduleData.total_courses }} 门课程 · {{ scheduleData.total_sessions }} 节课 · {{ scheduleData.semester }}</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载课表中...</p>
    </div>

    <template v-else-if="scheduleData">
      <!-- 切换标签 -->
      <div class="tab-switcher reveal">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'week' }"
          @click="activeTab = 'week'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          按日期查看
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'course' }"
          @click="activeTab = 'course'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          按课程查看
        </button>
      </div>

      <!-- 按日期视图 -->
      <div v-if="activeTab === 'week'" class="week-view">
        <div
          v-for="(day, dayIndex) in scheduleData.schedule"
          :key="day.date"
          class="day-block reveal"
          :class="`reveal-delay-${Math.min(dayIndex + 1, 6)}`"
        >
          <!-- 日期头 -->
          <div class="day-header" :class="{ today: isToday(day.date) }">
            <div class="day-date">
              <span class="day-num">{{ new Date(day.date).getDate() }}</span>
              <span class="day-month">{{ new Date(day.date).getMonth() + 1 }}月</span>
            </div>
            <div class="day-info">
              <h3>{{ formatDate(day.date) }}</h3>
              <span class="course-count">{{ day.courses.length }} 节课</span>
            </div>
            <span v-if="isToday(day.date)" class="today-badge">今天</span>
          </div>

          <!-- 课程列表 -->
          <div class="day-courses">
            <div
              v-for="course in day.courses"
              :key="course.course + course.time_start"
              class="course-item"
              :class="{ past: isPast(course.date, course.time_start) }"
              :style="{
                background: getCourseColor(course.course).bg,
                borderLeftColor: getCourseColor(course.course).border,
              }"
            >
              <div class="course-time">
                <span class="time-start">{{ course.time_start }}</span>
                <span class="time-divider"></span>
                <span class="time-end">{{ course.time_end }}</span>
              </div>
              <div class="course-detail">
                <h4 :style="{ color: getCourseColor(course.course).text }">{{ course.course }}</h4>
                <div class="course-meta">
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    {{ course.teacher }}
                  </span>
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {{ course.location }}
                  </span>
                </div>
              </div>
              <span v-if="isPast(course.date, course.time_start)" class="past-tag">已结束</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 按课程视图 -->
      <div v-else class="course-view">
        <div
          v-for="(course, index) in scheduleData.courses"
          :key="course.name"
          class="course-block reveal"
          :class="`reveal-delay-${Math.min(index + 1, 4)}`"
        >
          <!-- 课程头 -->
          <div class="course-header" :style="{ borderColor: getCourseColor(course.name).border }">
            <div class="course-icon" :style="{ background: getCourseColor(course.name).bg }">
              <span :style="{ color: getCourseColor(course.name).text }">📖</span>
            </div>
            <div class="course-title-info">
              <h3 :style="{ color: getCourseColor(course.name).text }">{{ course.name }}</h3>
              <p>主讲：{{ course.teacher }} · {{ course.location }}</p>
            </div>
            <span class="session-count">{{ course.sessions.length }} 次课</span>
          </div>

          <!-- 上课日期列表 -->
          <div class="session-list">
            <div
              v-for="session in course.sessions"
              :key="session.date"
              class="session-item"
              :class="{ past: isPast(session.date, session.time_start) }"
            >
              <div class="session-date">
                <span class="session-day">{{ new Date(session.date).getDate() }}</span>
                <span class="session-month">{{ new Date(session.date).getMonth() + 1 }}月</span>
              </div>
              <div class="session-time">
                {{ session.time_start }} - {{ session.time_end }}
              </div>
              <span v-if="isPast(session.date, session.time_start)" class="past-dot"></span>
              <span v-else class="upcoming-dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部说明 -->
      <div class="schedule-footer reveal">
        <div class="footer-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>课表数据来源于复旦管院校历系统，如有调整请以学校通知为准</span>
        </div>
        <p class="update-time">数据更新时间：{{ scheduleData.last_updated }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.schedule-page {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-xl);
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.page-header .label {
  display: inline-block;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-accent);
  margin-bottom: var(--space-md);
  padding: var(--space-xs) var(--space-lg);
  border: 1px solid var(--c-border-accent);
  border-radius: var(--radius-full);
  background: var(--c-bg-card);
}

.page-header h1 {
  font-size: var(--text-4xl);
  font-weight: 800;
  color: var(--c-text-primary);
  margin-bottom: var(--space-md);
  background: var(--c-accent-gradient);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}

.page-header p {
  color: var(--c-text-tertiary);
  font-size: var(--text-base);
}

.loading {
  text-align: center;
  padding: var(--space-4xl);
  color: var(--c-text-tertiary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  margin: 0 auto var(--space-lg);
  animation: rotateSlow 1s linear infinite;
}

/* 标签切换 */
.tab-switcher {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-3xl);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-xl);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  color: var(--c-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab-btn:hover {
  border-color: var(--c-border-accent);
  color: var(--c-text-primary);
}

.tab-btn.active {
  background: var(--c-accent-gradient);
  background-size: 200% auto;
  color: var(--c-text-inverse);
  border-color: transparent;
  box-shadow: 0 4px 20px var(--c-accent-glow);
}

/* 按日期视图 */
.day-block {
  margin-bottom: var(--space-2xl);
}

.day-header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  position: relative;
}

.day-header.today {
  border-color: var(--c-border-accent);
  box-shadow: 0 0 30px var(--c-accent-glow);
}

.day-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: var(--c-bg-tertiary);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.day-num {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--c-accent);
  line-height: 1;
}

.day-month {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.day-info {
  flex: 1;
}

.day-info h3 {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--c-text-primary);
  margin-bottom: 2px;
}

.course-count {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.today-badge {
  padding: var(--space-xs) var(--space-md);
  background: var(--c-accent-gradient);
  color: var(--c-text-inverse);
  font-size: var(--text-xs);
  font-weight: 700;
  border-radius: var(--radius-full);
}

.day-courses {
  border: 1px solid var(--c-border);
  border-top: none;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  overflow: hidden;
}

.course-item {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-lg) var(--space-xl);
  border-left: 3px solid;
  border-bottom: 1px solid var(--c-border-light);
  transition: all var(--transition-fast);
  position: relative;
}

.course-item:last-child {
  border-bottom: none;
}

.course-item:hover {
  background: rgba(255, 255, 255, 0.02);
  transform: translateX(4px);
}

.course-item.past {
  opacity: 0.5;
}

.course-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  flex-shrink: 0;
}

.time-start {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--c-text-primary);
  font-family: var(--font-mono);
}

.time-divider {
  width: 20px;
  height: 1px;
  background: var(--c-border);
  margin: 4px 0;
}

.time-end {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
  font-family: var(--font-mono);
}

.course-detail {
  flex: 1;
  min-width: 0;
}

.course-detail h4 {
  font-size: var(--text-base);
  font-weight: 700;
  margin-bottom: var(--space-xs);
}

.course-meta {
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.past-tag {
  padding: 2px var(--space-sm);
  background: var(--c-bg-tertiary);
  color: var(--c-text-tertiary);
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* 按课程视图 */
.course-block {
  margin-bottom: var(--space-2xl);
}

.course-header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--c-bg-card);
  border: 1px solid;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.course-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.course-title-info {
  flex: 1;
}

.course-title-info h3 {
  font-size: var(--text-xl);
  font-weight: 700;
  margin-bottom: 4px;
}

.course-title-info p {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
  margin: 0;
}

.session-count {
  padding: var(--space-xs) var(--space-md);
  background: var(--c-bg-tertiary);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--c-text-secondary);
  flex-shrink: 0;
}

.session-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-sm);
  padding: var(--space-xl);
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-top: none;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

.session-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.session-item:hover {
  border-color: var(--c-border-accent);
  transform: translateY(-2px);
}

.session-item.past {
  opacity: 0.5;
}

.session-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 36px;
}

.session-day {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--c-text-primary);
  line-height: 1;
}

.session-month {
  font-size: 10px;
  color: var(--c-text-tertiary);
}

.session-time {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  font-family: var(--font-mono);
  flex: 1;
}

.past-dot,
.upcoming-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.past-dot {
  background: var(--c-text-tertiary);
}

.upcoming-dot {
  background: var(--c-mint);
  box-shadow: 0 0 8px var(--c-mint-glow);
}

/* 底部 */
.schedule-footer {
  margin-top: var(--space-3xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--c-border);
  text-align: center;
}

.footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--c-text-tertiary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-sm);
}

.update-time {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  opacity: 0.7;
}

@media (max-width: 640px) {
  .course-item {
    flex-wrap: wrap;
  }

  .course-time {
    flex-direction: row;
    width: 100%;
    justify-content: flex-start;
    gap: var(--space-sm);
  }

  .time-divider {
    display: none;
  }

  .session-list {
    grid-template-columns: 1fr;
  }
}
</style>
