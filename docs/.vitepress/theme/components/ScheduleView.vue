<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useData } from '../composables/useData.js'
import NextUpPill from './NextUpPill.vue'
import SemesterHighway from './SemesterHighway.vue'

/* ========== i18n ========== */
const i18n = {
  zh: {
    label: '课程安排',
    title: '本学期课表',
    coursesUnit: '门课程',
    sessionsUnit: '节课',
    loading: '加载课表中...',
    tabWeek: '按日期查看',
    tabCourse: '按课程查看',
    tabCalendar: '月历',
    sessionsCount: '节课',
    timesCount: '次课',
    lecturer: '主讲',
    today: '今天',
    ended: '已结束',
    exam: '期末考试',
    pastDates: '已过去的日期',
    exportCalendar: '导入日历',
    exportTitle: '把课表装进手机日历',
    scanHint: '用手机相机或支付宝扫一扫，自动跳转到日历添加',
    subscribeCalendar: '导入到日历',
    saveQr: '保存二维码',
    longPressHint: '手机长按二维码可保存图片',
    copyLink: '复制 iCal 链接',
    copied: '已复制',
    deviceHint: 'iPhone / 安卓 / 鸿蒙：扫码或下载文件后，打开并选择「添加到日历」即可',
    alipayHint: '支付宝大学课表：复制链接后，在「课表 → 导入 → 链接导入」粘贴即可',
    footerNote: '课表数据来源于复旦管院校历系统，如有调整请以学校通知为准',
    updatedAt: '数据更新时间',
  },
  en: {
    label: 'Schedule',
    title: 'This Term',
    coursesUnit: 'courses',
    sessionsUnit: 'sessions',
    loading: 'Loading schedule…',
    tabWeek: 'By date',
    tabCourse: 'By course',
    tabCalendar: 'Calendar',
    sessionsCount: 'classes',
    timesCount: 'sessions',
    lecturer: 'Lecturer',
    today: 'Today',
    ended: 'Ended',
    exam: 'Final Exam',
    pastDates: 'Past dates',
    exportCalendar: 'Add to Calendar',
    exportTitle: 'Add your schedule to your phone calendar',
    scanHint: 'Scan with your phone camera or Alipay to add to your calendar automatically',
    subscribeCalendar: 'Add to Calendar',
    saveQr: 'Save QR code',
    longPressHint: 'On a phone, long-press the QR code to save the image',
    copyLink: 'Copy iCal link',
    copied: 'Copied',
    deviceHint: 'iPhone / Android / HarmonyOS: scan or download the file, then open and tap "Add to Calendar"',
    alipayHint: 'Alipay Campus schedule: copy the link, paste it in Class Schedule → Import → Link Import',
    footerNote: 'Schedule data from Fudan GSM academic calendar. Changes follow official notices.',
    updatedAt: 'Updated',
  },
  th: {
    label: 'ตารางเรียน',
    title: 'ตารางเรียนภาคนี้',
    coursesUnit: 'วิชา',
    sessionsUnit: 'คาบ',
    loading: 'กำลังโหลดตารางเรียน…',
    tabWeek: 'ตามวัน',
    tabCourse: 'ตามรายวิชา',
    tabCalendar: 'ปฏิทิน',
    sessionsCount: 'คาบ',
    timesCount: 'ครั้ง',
    lecturer: 'อาจารย์ผู้สอน',
    today: 'วันนี้',
    ended: 'จบแล้ว',
    exam: 'สอบปลายภาค',
    pastDates: 'วันที่ผ่านมา',
    exportCalendar: 'เพิ่มลงปฏิทิน',
    exportTitle: 'เพิ่มตารางเรียนลงปฏิทินมือถือ',
    scanHint: 'สแกนด้วยกล้องมือถือหรือ Alipay เพื่อเพิ่มลงปฏิทินอัตโนมัติ',
    subscribeCalendar: 'เพิ่มลงปฏิทิน',
    saveQr: 'บันทึก QR code',
    longPressHint: 'บนมือถือ กดค้างที่ QR เพื่อบันทึกรูปภาพ',
    copyLink: 'คัดลอกลิงก์ iCal',
    copied: 'คัดลอกแล้ว',
    deviceHint: 'iPhone / Android / HarmonyOS: สแกนหรือดาวน์โหลด แล้วเปิดและเลือก "เพิ่มในปฏิทิน"',
    alipayHint: 'ตารางเรียน Alipay Campus: คัดลอกลิงก์ วางใน ตารางเรียน → นำเข้า → ลิงก์',
    footerNote: 'ข้อมูลตารางเรียนมาจากปฏิทินการศึกษา Fudan GSM หากมีการเปลี่ยนแปลงให้ถือตามประกาศอย่างเป็นทางการ',
    updatedAt: 'อัปเดตเมื่อ',
  },
}
const { lang, t } = useLang(i18n)

/* 当前 locale（Intl 用） */
const locale = computed(() =>
  lang.value === 'th' ? 'th-TH-u-ca-buddhist' : lang.value === 'en' ? 'en-US' : 'zh-CN'
)

/* ========== 数据加载 ========== */
const { data: scheduleData, loading } = useData('/data/schedule.json')
const activeTab = ref('week') // 'week' | 'course' | 'calendar'
const showCalendar = ref(false)
/* ===== 导入日历（ICS 文件 + 二维码） ===== */
const showExport = ref(false)
const copiedIcs = ref(false)
const ICS_URL = 'https://mint4.cn/data/schedule.ics' // 与 scripts/generate-schedule-calendar.mjs 的二维码内容一致
const WEB_CAL_URL = 'https://mint4.cn/data/schedule.ics' // https 直链：iOS/安卓/鸿蒙 打开 .ics 直接「添加到日历」；webcal:// 会被 iOS 按非加密通道处理而弹「不安全连接」，故不用
const copyIcsLink = async () => {
  try {
    await navigator.clipboard.writeText(ICS_URL)
  } catch (e) {
    const ta = document.createElement('textarea')
    ta.value = ICS_URL
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch (_) { /* 忽略 */ }
    document.body.removeChild(ta)
  }
  copiedIcs.value = true
  setTimeout(() => { copiedIcs.value = false }, 2000)
}

/* ========== 课程颜色：用稳定索引而非中文名 ========== */
const courseIndexMap = computed(() => {
  const m = new Map()
  if (scheduleData.value) {
    scheduleData.value.courses.forEach((c, i) => m.set(c.name, i))
  }
  return m
})
const colorClassFor = (name) => `course-${courseIndexMap.value.get(name) ?? 0}`

/* ========== 月历视图逻辑 ========== */
const currentMonth = ref(new Date())

const calendarYear = computed(() => currentMonth.value.getFullYear())
const calendarMonth = computed(() => currentMonth.value.getMonth()) // 0-11

/* 月名 / 星期头：Intl 格式化 */
const monthTitle = computed(() =>
  new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long' }).format(
    new Date(calendarYear.value, calendarMonth.value, 1)
  )
)
const weekdayHeaders = computed(() => {
  // 以周日为一周起始
  const base = new Date(2023, 0, 1) // 2023-01-01 是周日
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(new Date(base))
  )
})

// 构建月历日期网格（6行×7列）
const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay() // 0=周日
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []
  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
      day: daysInPrevMonth - i,
      inMonth: false,
      isToday: false,
      courses: []
    })
  }
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

const getCoursesByDate = (dateStr) => {
  if (!scheduleData.value) return []
  const day = scheduleData.value.schedule.find(d => d.date === dateStr)
  return day ? day.courses : []
}

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
  if (canGoPrev.value) currentMonth.value = new Date(calendarYear.value, calendarMonth.value - 1, 1)
}
const nextMonth = () => {
  if (canGoNext.value) currentMonth.value = new Date(calendarYear.value, calendarMonth.value + 1, 1)
}

const selectedDate = ref(null)
const toggleDate = (dateStr) => {
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}
const selectedDayCourses = computed(() => {
  if (!selectedDate.value) return []
  return getCoursesByDate(selectedDate.value)
})

/* 强制点亮所有未显示的 .reveal（异步数据 / 折叠展开共用） */
const forceReveal = () => {
  document.querySelectorAll('.schedule-page .reveal:not(.is-visible)').forEach(el => {
    el.classList.add('is-visible')
  })
}

watch(activeTab, async () => {
  await nextTick()
  setTimeout(forceReveal, 50)
})

/* 修复：schedule.json 异步加载，晚于 IntersectionObserver 初始化的列表元素
   永远不会被观察到（线上复现：14 个 day-block 全部停在 opacity:0）。
   数据就绪后再强制点亮所有 .reveal，保证内容一定可见。 */
watch(scheduleData, async (val) => {
  if (!val) return
  await nextTick()
  setTimeout(forceReveal, 50)
})

/* ========== 日期/时间工具 ========== */
/* 按日期视图列表：正序（日期早的在上） */
const dayList = computed(() => {
  if (!scheduleData.value) return []
  return [...scheduleData.value.schedule].sort((a, b) => a.date.localeCompare(b.date))
})

/* 已过去日期默认折叠，只展示今天及之后的日期（正序） */
const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})
const visibleDays = computed(() => dayList.value.filter(d => d.date >= todayStr.value))
const pastDays = computed(() => dayList.value.filter(d => d.date < todayStr.value))
const showPast = ref(false)
const togglePast = () => {
  showPast.value = !showPast.value
  if (showPast.value) {
    nextTick().then(() => setTimeout(forceReveal, 50))
  }
}
/* 列表渲染模型：折叠条 + 过去日期 + 今天及未来（整体正序） */
const weekItems = computed(() => {
  const items = []
  if (pastDays.value.length) items.push({ type: 'past-fold' })
  if (showPast.value) pastDays.value.forEach((d, i) => items.push({ type: 'day', day: d, idx: i }))
  visibleDays.value.forEach((d, i) => items.push({ type: 'day', day: d, idx: i }))
  return items
})

const formatDate = (dateStr) =>
  new Intl.DateTimeFormat(locale.value, { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(dateStr))

const formatShortDay = (dateStr) => new Date(dateStr).getDate()
const formatShortMonth = (dateStr) =>
  new Intl.DateTimeFormat(locale.value, { month: 'short' }).format(new Date(dateStr))

const isPast = (dateStr, timeStart) => new Date(`${dateStr}T${timeStart}:00`) < new Date()
const isToday = (dateStr) => {
  const today = new Date()
  return today.toDateString() === new Date(dateStr).toDateString()
}
</script>

<template>
  <div class="schedule-page">
    <!-- 页面标题 -->
    <div class="page-header reveal">
      <span class="label">{{ t.label }}</span>
      <h1>{{ t.title }}</h1>
      <p v-if="scheduleData">
        {{ scheduleData.total_courses }} {{ t.coursesUnit }} ·
        {{ scheduleData.total_sessions }} {{ t.sessionsUnit }} ·
        {{ scheduleData.semester }}
      </p>
      <button class="calendar-btn" @click="showCalendar = true">
        <span class="calendar-icon">📅</span>
        <span>{{ t.viewCalendar || '查看校历' }}</span>
      </button>
      <button class="calendar-btn" @click="showExport = true">
        <span class="calendar-icon">📆</span>
        <span>{{ t.exportCalendar }}</span>
      </button>
    </div>

    <!-- 校历弹窗 -->
    <div v-if="showCalendar" class="calendar-modal" @click.self="showCalendar = false">
      <div class="calendar-modal-content">
        <button class="calendar-close" @click="showCalendar = false">✕</button>
        <h3>复旦大学 2026—2027 学年校历</h3>
        <img src="/images/fudan-academic-calendar-2026-2027.jpg" alt="复旦大学校历" class="calendar-img" />
        <a href="/images/fudan-academic-calendar-2026-2027.jpg" target="_blank" class="calendar-download">在新标签页打开</a>
      </div>
    </div>

    <!-- 导入日历弹窗 -->
    <div v-if="showExport" class="calendar-modal" @click.self="showExport = false">
      <div class="calendar-modal-content export-content">
        <button class="calendar-close" @click="showExport = false">✕</button>
        <h3>{{ t.exportTitle }}</h3>
        <img src="/data/schedule-qr.png" :alt="t.exportCalendar" class="export-qr" />
        <p class="export-hint">{{ t.scanHint }}</p>
        <div class="export-actions">
          <a class="export-btn" :href="WEB_CAL_URL">{{ t.subscribeCalendar }}</a>
          <button class="export-btn" @click="copyIcsLink">{{ copiedIcs ? t.copied : t.copyLink }}</button>
          <a class="export-btn" href="/data/schedule-qr.png" download="mint4-schedule-qr.png">{{ t.saveQr }}</a>
        </div>
        <div class="export-tips">
          <p>📱 {{ t.longPressHint }} · {{ t.deviceHint }}</p>
          <p>💳 {{ t.alipayHint }}</p>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>{{ t.loading }}</p>
    </div>

    <template v-else-if="scheduleData">
      <!-- 下节课胶囊 + 学期高速公路 -->
      <NextUpPill :data="scheduleData" />
      <SemesterHighway :courses="scheduleData.courses" :data="scheduleData" />

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
          {{ t.tabWeek }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'course' }"
          @click="activeTab = 'course'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {{ t.tabCourse }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'calendar' }"
          @click="activeTab = 'calendar'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          {{ t.tabCalendar }}
        </button>
      </div>

      <!-- 按日期视图（正序；已过去日期折叠） -->
      <div v-if="activeTab === 'week'" class="week-view">
        <template
          v-for="(it, idx) in weekItems"
          :key="it.type === 'past-fold' ? 'past-fold' : it.day.date"
        >
          <!-- 已过去日期折叠条（正序下位于列表最前） -->
          <div v-if="it.type === 'past-fold'" class="past-fold">
            <button class="past-toggle" :aria-expanded="showPast" @click="togglePast">
              <svg class="past-chev" :class="{ open: showPast }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              <span>{{ t.pastDates }}（{{ pastDays.length }}）</span>
            </button>
          </div>
          <!-- 日期块 -->
          <div v-else class="day-block reveal" :class="`reveal-delay-${Math.min(it.idx + 1, 6)}`">
            <div class="day-header" :class="{ today: isToday(it.day.date) }">
              <div class="day-date">
                <span class="day-num">{{ formatShortDay(it.day.date) }}</span>
                <span class="day-month">{{ formatShortMonth(it.day.date) }}</span>
              </div>
              <div class="day-info">
                <h3>{{ formatDate(it.day.date) }}</h3>
                <span class="course-count">{{ it.day.courses.length }} {{ t.sessionsCount }}</span>
              </div>
              <span v-if="isToday(it.day.date)" class="today-badge">{{ t.today }}</span>
            </div>

            <div class="day-courses">
              <div
                v-for="course in it.day.courses"
                :key="course.course + course.time_start"
                class="course-item"
                :class="[colorClassFor(course.course), { past: isPast(course.date, course.time_start) }]"
              >
                <div class="course-time">
                  <span class="time-start">{{ course.time_start }}</span>
                  <span class="time-divider"></span>
                  <span class="time-end">{{ course.time_end }}</span>
                </div>
                <div class="course-detail">
                  <h4>{{ course.course }}<span v-if="course.exam" class="exam-tag">{{ t.exam }}</span></h4>
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
                <span v-if="isPast(course.date, course.time_start)" class="past-tag">{{ t.ended }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 按课程视图 -->
      <div v-else-if="activeTab === 'course'" class="course-view">
        <div
          v-for="(course, index) in scheduleData.courses"
          :key="course.name"
          class="course-block reveal"
          :class="[colorClassFor(course.name), `reveal-delay-${Math.min(index + 1, 4)}`]"
        >
          <div class="course-header">
            <div class="course-icon">
              <span>📖</span>
            </div>
            <div class="course-title-info">
              <h3>{{ course.name }}</h3>
              <p>{{ t.lecturer }}：{{ course.teacher }} · {{ course.location }}</p>
            </div>
            <span class="session-count">{{ course.sessions.length }} {{ t.timesCount }}</span>
          </div>

          <div class="session-list">
            <div
              v-for="session in course.sessions"
              :key="session.date"
              class="session-item"
              :class="{ past: isPast(session.date, session.time_start) }"
            >
              <div class="session-date">
                <span class="session-day">{{ formatShortDay(session.date) }}</span>
                <span class="session-month">{{ formatShortMonth(session.date) }}</span>
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
        <div class="calendar-header">
          <button class="cal-nav-btn" :disabled="!canGoPrev" @click="prevMonth">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 class="calendar-title">{{ monthTitle }}</h2>
          <button class="cal-nav-btn" :disabled="!canGoNext" @click="nextMonth">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="calendar-legend">
          <span v-for="c in scheduleData.courses" :key="c.name" class="legend-item">
            <span class="legend-dot" :class="colorClassFor(c.name)"></span>{{ c.name }}
          </span>
        </div>

        <div class="calendar-grid">
          <div v-for="(w, wi) in weekdayHeaders" :key="wi" class="cal-weekday">{{ w }}</div>
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
            <div v-if="day.courses.length > 0" class="cal-dots">
              <span
                v-for="c in day.courses.slice(0, 3)"
                :key="c.course"
                class="cal-dot"
                :class="colorClassFor(c.course)"
              ></span>
            </div>
          </div>
        </div>

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
                :class="colorClassFor(course.course)"
              >
                <div class="cal-course-time">{{ course.time_start }} - {{ course.time_end }}</div>
                <div class="cal-course-name">{{ course.course }}</div>
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
          <span>{{ t.footerNote }}</span>
        </div>
        <p class="update-time">{{ t.updatedAt }}：{{ scheduleData.last_updated }}</p>
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

.calendar-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 20px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.calendar-btn:hover { opacity: 0.85; }
.calendar-btn + .calendar-btn { margin-left: 24px; }
.calendar-icon { font-size: 16px; }

/* 校历弹窗 */
.calendar-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.calendar-modal-content {
  background: var(--c-bg-card);
  border-radius: 20px;
  padding: 24px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.calendar-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--c-bg-secondary);
  color: var(--c-text-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.calendar-close:hover { background: var(--c-border); }
.calendar-modal-content h3 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  padding-right: 40px;
}
.calendar-img {
  width: 100%;
  border-radius: 12px;
  display: block;
}
.calendar-download {
  display: inline-block;
  margin-top: 16px;
  color: var(--c-accent);
  font-size: 13px;
  text-decoration: none;
}
.calendar-download:hover { text-decoration: underline; }

/* 导入日历弹窗 */
.export-content { max-width: 380px; text-align: center; }
.export-qr {
  width: 200px;
  height: 200px;
  margin: 8px auto 16px;
  display: block;
  background: #fff;
  padding: 8px;
  border-radius: 12px;
}
.export-hint {
  font-size: 13px;
  color: var(--c-text-secondary);
  margin: 0 0 16px;
}
.export-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}
.export-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid var(--c-border-accent);
  border-radius: 999px;
  color: var(--c-accent);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.export-btn:hover { background: var(--c-accent); color: #fff; }
.export-tips {
  text-align: left;
  font-size: 12px;
  color: var(--c-text-tertiary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.export-tips p { margin: 0; }

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
  flex-wrap: wrap;
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

.tab-btn:hover { border-color: var(--c-border-accent); color: var(--c-text-primary); }
.tab-btn.active { background: var(--c-accent); color: var(--c-text-inverse); border-color: transparent; }

/* ========== 课程色板（稳定索引，CSS变量，深色模式自动适配） ========== */
.course-0 { --course-text: #8b9cf0; --course-bg: rgba(139, 156, 240, 0.10); --course-border: rgba(139, 156, 240, 0.45); }
.course-1 { --course-text: #3d9a85; --course-bg: rgba(61, 154, 133, 0.10);  --course-border: rgba(61, 154, 133, 0.45); }
.course-2 { --course-text: #d4a017; --course-bg: rgba(212, 160, 23, 0.10);  --course-border: rgba(212, 160, 23, 0.45); }
:global(html.dark) .course-0 { --course-text: #aab4f5; --course-bg: rgba(170, 180, 245, 0.12); --course-border: rgba(170, 180, 245, 0.40); }
:global(html.dark) .course-1 { --course-text: #5ec4ac; --course-bg: rgba(94, 196, 172, 0.12);  --course-border: rgba(94, 196, 172, 0.40); }
:global(html.dark) .course-2 { --course-text: #e8b93b; --course-bg: rgba(232, 185, 59, 0.12);  --course-border: rgba(232, 185, 59, 0.40); }

/* 按日期视图 */
.day-block { margin-bottom: var(--space-2xl); }

/* ===== 已过去日期折叠条 ===== */
.past-fold { margin-bottom: var(--space-2xl); }
.past-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--c-bg-secondary);
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-full);
  color: var(--c-text-secondary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: border-color var(--transition-base), color var(--transition-base);
}
.past-toggle:hover { border-color: var(--c-border-accent); color: var(--c-text-primary); }
.past-chev { transition: transform var(--transition-base); }
.past-chev.open { transform: rotate(180deg); }

/* ===== 期末考试徽标 ===== */
.exam-tag {
  display: inline-block;
  margin-left: var(--space-2);
  padding: 1px var(--space-2);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.6;
  color: #fff;
  background: var(--c-accent);
  border-radius: var(--radius-full);
  vertical-align: middle;
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

.day-header.today { border: 1px solid var(--c-accent); background: var(--c-accent-light); }

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

.day-num { font-size: var(--text-2xl); font-weight: 800; color: var(--c-accent); line-height: 1; }
.day-month { font-size: var(--text-xs); color: var(--c-text-tertiary); }
.day-info { flex: 1; }
.day-info h3 { font-size: var(--text-lg); font-weight: 700; color: var(--c-text-primary); margin-bottom: 2px; }
.course-count { font-size: var(--text-xs); color: var(--c-text-tertiary); }

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
  border-left: 3px solid var(--course-border, var(--c-border));
  border-bottom: 1px solid var(--c-border-light);
  background: var(--course-bg, transparent);
  transition: all var(--transition-fast);
  position: relative;
}
.course-item:last-child { border-bottom: none; }
.course-item:hover { background: var(--c-bg-secondary); }
.course-item.past { opacity: 0.5; }

.course-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  flex-shrink: 0;
}
.time-start { font-size: var(--text-base); font-weight: 700; color: var(--c-text-primary); font-family: var(--font-mono); }
.time-divider { width: 20px; height: 1px; background: var(--c-border); margin: 4px 0; }
.time-end { font-size: var(--text-sm); color: var(--c-text-tertiary); font-family: var(--font-mono); }

.course-detail { flex: 1; min-width: 0; }
.course-detail h4 { font-size: var(--text-base); font-weight: 700; margin-bottom: var(--space-xs); color: var(--course-text, inherit); }
.course-meta { display: flex; gap: var(--space-lg); flex-wrap: wrap; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: var(--text-xs); color: var(--c-text-tertiary); }

.past-tag {
  padding: 2px var(--space-sm);
  background: var(--c-bg-tertiary);
  color: var(--c-text-tertiary);
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* 按课程视图 */
.course-block { margin-bottom: var(--space-2xl); }

.course-header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--c-bg-card);
  border: 1px solid var(--course-border, var(--c-border));
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
  background: var(--course-bg, var(--c-bg-secondary));
}

.course-title-info { flex: 1; }
.course-title-info h3 { font-size: var(--text-xl); font-weight: 700; margin-bottom: 4px; color: var(--course-text, inherit); }
.course-title-info p { font-size: var(--text-sm); color: var(--c-text-tertiary); margin: 0; }

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
.session-item:hover { border-color: var(--c-border-accent); }
.session-item.past { opacity: 0.5; }

.session-date { display: flex; flex-direction: column; align-items: center; min-width: 36px; }
.session-day { font-size: var(--text-lg); font-weight: 700; color: var(--c-text-primary); line-height: 1; }
.session-month { font-size: 10px; color: var(--c-text-tertiary); }
.session-time { font-size: var(--text-xs); color: var(--c-text-tertiary); font-family: var(--font-mono); flex: 1; }

.past-dot, .upcoming-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.past-dot { background: var(--c-text-tertiary); }
.upcoming-dot { background: var(--c-accent); }

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
.update-time { font-size: var(--text-xs); color: var(--c-text-tertiary); opacity: 0.7; }

/* ========== 月历视图样式 ========== */
.calendar-view { margin-top: 24px; }
.calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.calendar-title { font-size: 20px; font-weight: 600; color: var(--c-text-primary); margin: 0; letter-spacing: -0.3px; }
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
.cal-nav-btn:hover:not(:disabled) { border-color: var(--c-accent); color: var(--c-accent); background: var(--c-accent-light); }
.cal-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.calendar-legend { display: flex; gap: 20px; margin-bottom: 16px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--c-text-secondary); }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--course-text, var(--c-accent)); }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  background: var(--c-bg-secondary);
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--c-border);
}
.cal-weekday { text-align: center; font-size: 12px; font-weight: 600; color: var(--c-text-tertiary); padding: 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
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
.cal-day.out-of-month { background: transparent; opacity: 0.3; }
.cal-day.past:not(.has-class) { opacity: 0.5; }
.cal-day.today { border-color: var(--c-accent); background: var(--c-accent-light); }
.cal-day.today .cal-day-num { color: var(--c-accent); font-weight: 700; }
.cal-day.has-class { cursor: pointer; border-color: var(--c-border-accent); }
.cal-day.has-class:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-color: var(--c-accent); }
.cal-day.selected { border-color: var(--c-accent); background: var(--c-accent-light); box-shadow: 0 0 0 2px var(--c-accent); }
.cal-day-num { font-size: 14px; font-weight: 500; color: var(--c-text-primary); line-height: 1.2; }
.cal-dots { display: flex; gap: 3px; margin-top: auto; padding-top: 4px; }
.cal-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--course-text, var(--c-accent)); }

/* 详情面板 */
.cal-detail {
  margin-top: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 20px;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.cal-detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.cal-detail-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--c-text-primary); }
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
.cal-close-btn:hover { background: var(--c-border); color: var(--c-text-primary); }
.cal-detail-courses { display: flex; flex-direction: column; gap: 10px; }
.cal-course-item { padding: 12px 16px; border-radius: 10px; border-left: 3px solid var(--course-border, var(--c-border)); background: var(--course-bg, transparent); }
.cal-course-time { font-size: 12px; color: var(--c-text-secondary); font-weight: 500; margin-bottom: 2px; }
.cal-course-name { font-size: 15px; font-weight: 600; margin-bottom: 2px; color: var(--course-text, inherit); }
.cal-course-meta { font-size: 12px; color: var(--c-text-tertiary); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }

/* 动效尊重系统偏好 */
@media (prefers-reduced-motion: reduce) {
  .cal-day.has-class:hover { transform: none; }
}

/* 移动端 */
@media (max-width: 640px) {
  .course-item { flex-wrap: wrap; }
  .course-time { flex-direction: row; width: 100%; justify-content: flex-start; gap: var(--space-sm); }
  .time-divider { display: none; }
  .session-list { grid-template-columns: 1fr; }
  .calendar-grid { gap: 4px; }
  .cal-day { min-height: 52px; padding: 6px 4px; }
  .cal-day-num { font-size: 13px; }
  .cal-dots { gap: 2px; }
  .cal-dot { width: 5px; height: 5px; }
  .calendar-legend { flex-wrap: wrap; gap: 8px 16px; }
}
</style>
