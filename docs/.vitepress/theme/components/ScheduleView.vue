<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import NextUpPill from './NextUpPill.vue'
import SemesterHighway from './SemesterHighway.vue'

const scheduleData = ref(null)
const loading = ref(true)
const activeTab = ref('week') // 'week' | 'course' | 'calendar'

// ========== 月历视图逻辑 ==========
const currentMonth = ref(new Date())

const calendarYear = computed(() => currentMonth.value.getFullYear())
const calendarMonth = computed(() => currentMonth.value.getMonth()) // 0-11

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const weekdayHeaders = ['日', '一', '二', '三', '四', '五', '六']

// 构建月历日期网格（6行×7列）
const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay() // 0=周日
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []
  // 上月填充
  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
      day: daysInPrevMonth - i,
      inMonth: false,
      isToday: false,
      courses: []
    })
  }
  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      date: dateStr,
      day: d,
      inMonth: true,
      isToday: isToday(dateStr),
      courses: getCoursesByDate(dateStr)
    })
  }
  // 下月填充到42格
  let nextDay = 1
  while (days.length < 42) {
    days.push({
      date: `${year}-${String(month + 2).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`,
      day: nextDay,
      inMonth: false,
      isToday: false,
      courses: []
    })
    nextDay++
  }
  return days
})

// 按日期查课程
const getCoursesByDate = (dateStr) => {
  if (!scheduleData.value) return []
  const day = scheduleData.value.schedule.find(d => d.date === dateStr)
  return day ? day.courses : []
}

// 月历中有课的月份列表（用于限制切换范围）
const availableMonths = computed(() => {
  if (!scheduleData.value) return []
  const months = new Set()
  scheduleData.value.schedule.forEach(d => {
    const dt = new Date(d.date)
    months.add(`${dt.getFullYear()}-${dt.getMonth()}`)
  })
  return Array.from(months).sort()
})

const canGoPrev = computed(() => {
  if (availableMonths.value.length === 0) return true
  const current = `${calendarYear.value}-${calendarMonth.value}`
  return current > availableMonths.value[0]
})

const canGoNext = computed(() => {
  if (availableMonths.value.length === 0) return true
  const current = `${calendarYear.value}-${calendarMonth.value}`
  return current < availableMonths.value[availableMonths.value.length - 1]
})

const prevMonth = () => {
  if (canGoPrev.value) {
    currentMonth.value = new Date(calendarYear.value, calendarMonth.value - 1, 1)
  }
}

const nextMonth = () => {
  if (canGoNext.value) {
    currentMonth.value = new Date(calendarYear.value, calendarMonth.value + 1, 1)
  }
}

// 选中的日期（用于展开详情）
const selectedDate = ref(null)

const toggleDate = (dateStr) => {
  if (selectedDate.value === dateStr) {
    selectedDate.value = null
  } else {
    selectedDate.value = dateStr
  }
}

const selectedDayCourses = computed(() => {
  if (!selectedDate.value) return []
  return getCoursesByDate(selectedDate.value)
})

// 切换标签时，手动触发滚动动画（因为新显示的元素需要重新观察）
watch(activeTab, async () => {
  await nextTick()
  setTimeout(() => {
    document.querySelectorAll('.schedule-page .reveal:not(.is-visible)').forEach(el => {
      el.classList.add('is-visible')
    })
  }, 50)
})

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

// 学期高速公路节点点击：切换到按日期视图并尝试滚动到对应日期
const handleJumpDate = (dateStr) => {
  console.log('[SemesterHighway] jump to date:', dateStr)
  activeTab.value = 'week'
  // 尝试滚动到对应日期块（day-block 无 date 标识，先尽力定位）
  nextTick(() => {
    setTimeout(() => {
      const blocks = document.querySelectorAll('.schedule-page .day-block')
      blocks.forEach(el => {
        if (el.textContent.includes(dateStr)) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }, 80)
  })
}
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
      <!-- P0打磨区：桌面端胶囊(40%) + 高速公路(60%) 并排，移动端上下堆叠 -->
      <div class="schedule-polish-row">
        <!-- 方案1.1：下节课悬浮胶囊 -->
        <NextUpPill :schedule-data="scheduleData" class="spr-pill" />
        <!-- 方案1.2：学期高速公路 -->
        <SemesterHighway :schedule-data="scheduleData" @jump-date="handleJumpDate" class="spr-highway" />
      </div>

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
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'calendar' }"
          @click="activeTab = 'calendar'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          月历
        </button>
      </div>

      <!-- 按日期视图 -->
      <div v-if="activeTab === 'week'" class="week-view">        <div
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
      <div v-else-if="activeTab === 'course'" class="course-view">
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

      <!-- 月历视图 -->
      <div v-else class="calendar-view reveal">
        <!-- 月份切换 -->
        <div class="calendar-header">
          <button class="cal-nav-btn" :disabled="!canGoPrev" @click="prevMonth">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 class="calendar-title">{{ calendarYear }}年 {{ monthNames[calendarMonth] }}</h2>
          <button class="cal-nav-btn" :disabled="!canGoNext" @click="nextMonth">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- 图例 -->
        <div class="calendar-legend">
          <span class="legend-item"><span class="legend-dot" style="background: #4fd1c5"></span>管理经济学</span>
          <span class="legend-item"><span class="legend-dot" style="background: #d4af37"></span>会计学</span>
          <span class="legend-item"><span class="legend-dot" style="background: #8b9cf0"></span>数据模型与决策</span>
        </div>

        <!-- 月历网格 -->
        <div class="calendar-grid">
          <!-- 星期头 -->
          <div v-for="w in weekdayHeaders" :key="w" class="cal-weekday">{{ w }}</div>
          <!-- 日期 -->
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="cal-day"
            :class="{
              'out-of-month': !day.inMonth,
              'today': day.isToday,
              'has-class': day.courses.length > 0,
              'selected': selectedDate === day.date,
              'past': day.inMonth && isPast(day.date, '23:59')
            }"
            @click="day.courses.length > 0 && toggleDate(day.date)"
          >
            <span class="cal-day-num">{{ day.day }}</span>
            <!-- 课程标记点 -->
            <div v-if="day.courses.length > 0" class="cal-dots">
              <span
                v-for="c in day.courses.slice(0, 3)"
                :key="c.course"
                class="cal-dot"
                :style="{ background: getCourseColor(c.course).text }"
              ></span>
            </div>
          </div>
        </div>

        <!-- 选中日期的课程详情 -->
        <transition name="fade">
          <div v-if="selectedDate && selectedDayCourses.length > 0" class="cal-detail">
            <div class="cal-detail-header">
              <h3>{{ formatDate(selectedDate) }}</h3>
              <button class="cal-close-btn" @click="selectedDate = null">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="cal-detail-courses">
              <div
                v-for="course in selectedDayCourses"
                :key="course.course + course.time_start"
                class="cal-course-item"
                :style="{
                  background: getCourseColor(course.course).bg,
                  borderLeftColor: getCourseColor(course.course).border,
                }"
              >
                <div class="cal-course-time">{{ course.time_start }} - {{ course.time_end }}</div>
                <div class="cal-course-name" :style="{ color: getCourseColor(course.course).text }">{{ course.course }}</div>
                <div class="cal-course-meta">{{ course.teacher }} · {{ course.location }}</div>
              </div>
            </div>
          </div>
        </transition>
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
  background: var(--c-accent);
  color: var(--c-text-inverse);
  border-color: transparent;
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
  border: 1px solid var(--c-accent);
  background: var(--c-accent-light);
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
  background: var(--c-accent);
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
  background: var(--c-bg-secondary);
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
  background: var(--c-accent);
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

  /* 月历移动端 */
  .calendar-grid {
    gap: 4px;
  }

  .cal-day {
    min-height: 52px;
    padding: 6px 4px;
  }

  .cal-day-num {
    font-size: 13px;
  }

  .cal-dots {
    gap: 2px;
  }

  .cal-dot {
    width: 5px;
    height: 5px;
  }

  .calendar-legend {
    flex-wrap: wrap;
    gap: 8px 16px;
  }
}

/* ========== 月历视图样式 ========== */
.calendar-view {
  margin-top: 24px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.calendar-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.cal-nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cal-nav-btn:hover:not(:disabled) {
  border-color: var(--c-accent);
  color: var(--c-accent);
  background: var(--c-accent-light);
}

.cal-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.calendar-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--c-text-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  background: var(--c-bg-secondary);
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--c-border);
}

.cal-weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-tertiary);
  padding: 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cal-day {
  position: relative;
  min-height: 64px;
  border-radius: 10px;
  background: var(--c-bg-card);
  border: 1px solid transparent;
  padding: 8px 6px;
  cursor: default;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cal-day.out-of-month {
  background: transparent;
  opacity: 0.3;
}

.cal-day.past:not(.has-class) {
  opacity: 0.5;
}

.cal-day.today {
  border-color: var(--c-accent);
  background: var(--c-accent-light);
}

.cal-day.today .cal-day-num {
  color: var(--c-accent);
  font-weight: 700;
}

.cal-day.has-class {
  cursor: pointer;
  border-color: var(--c-border-accent);
}

.cal-day.has-class:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--c-accent);
}

.cal-day.selected {
  border-color: var(--c-accent);
  background: var(--c-accent-light);
  box-shadow: 0 0 0 2px var(--c-accent);
}

.cal-day-num {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-primary);
  line-height: 1.2;
}

.cal-dots {
  display: flex;
  gap: 3px;
  margin-top: auto;
  padding-top: 4px;
}

.cal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* 详情面板 */
.cal-detail {
  margin-top: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 20px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.cal-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cal-detail-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-primary);
}

.cal-close-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: var(--c-bg-secondary);
  color: var(--c-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cal-close-btn:hover {
  background: var(--c-border);
  color: var(--c-text-primary);
}

.cal-detail-courses {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cal-course-item {
  padding: 12px 16px;
  border-radius: 10px;
  border-left: 3px solid;
}

.cal-course-time {
  font-size: 12px;
  color: var(--c-text-secondary);
  font-weight: 500;
  margin-bottom: 2px;
}

.cal-course-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

.cal-course-meta {
  font-size: 12px;
  color: var(--c-text-tertiary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ========== P0打磨区：胶囊 + 高速公路 并排 ========== */
.schedule-polish-row {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
  align-items: stretch;
}
.schedule-polish-row .spr-pill {
  flex: 0 0 40%;
  margin-bottom: 0 !important;
  min-width: 0;
}
.schedule-polish-row .spr-highway {
  flex: 1 1 60%;
  min-width: 0;
}

@media (max-width: 768px) {
  .schedule-polish-row {
    flex-direction: column;
    gap: 12px;
  }
  .schedule-polish-row .spr-pill {
    flex: none;
    width: 100%;
  }
  .schedule-polish-row .spr-highway {
    flex: none;
    width: 100%;
  }
}
</style>
