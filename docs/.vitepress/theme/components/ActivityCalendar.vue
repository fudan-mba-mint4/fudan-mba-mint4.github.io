<template>
  <div class="cal-wrap">
    <div class="cal-grid-pane">
    <!-- 月份切换 -->
    <div class="cal-toolbar">
      <button class="cal-nav" @click="shiftMonth(-1)" aria-label="上个月">‹</button>
      <div class="cal-title">{{ monthTitle }}</div>
      <button class="cal-nav" @click="shiftMonth(1)" aria-label="下个月">›</button>
      <button class="cal-today" @click="goToday">{{ t.today }}</button>
      <button class="cal-export" @click="exportICS">{{ t.exportIcs }}</button>
      <button class="cal-export" @click="openPlan">{{ t.plan }}</button>
    </div>
    <div class="cal-summary">{{ monthSummary }}</div>

    <!-- 星期表头（周一起点） -->
    <div class="cal-weekdays">
      <span v-for="(w, i) in weekdays" :key="i" :class="{ weekend: i >= 5 }">{{ w }}</span>
    </div>

    <!-- 月历网格 -->
    <div class="cal-grid">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        class="cal-cell"
        :class="{
          muted: !cell.inMonth,
          today: cell.isToday,
          selected: cell.iso === selectedIso,
          weekend: cell.inMonth && cell.isWeekend,
        }"
        @click="selectCell(cell)"
      >
        <span class="cell-num">{{ cell.d.getDate() }}</span>
        <div class="cell-events">
          <button
            v-for="(ev, idx) in cell.events.slice(0, 3)"
            :key="ev.a.id + idx"
            class="ev-chip"
            :class="catClass(ev.a)"
            :title="titleOf(ev.a)"
            @click.stop="selectCell(cell)"
          >
            <span class="ev-dot" :style="{ background: catColor(ev.a) }"></span>
            <span class="ev-name">{{ evLabel(ev) }}</span>
          </button>
          <span v-if="cell.events.length > 3" class="ev-more">+{{ cell.events.length - 3 }}</span>
        </div>
      </div>
    </div>
    </div><!-- /cal-grid-pane -->

    <div class="cal-detail-pane">
    <!-- 选中日期详情 -->
    <div v-if="selectedCell" class="day-detail">
      <h4 class="day-detail-title">{{ selectedTitle }}</h4>
      <div v-if="!selectedCell.events.length" class="day-detail-empty">{{ t.noEvent }}</div>
      <div v-for="(ev, idx) in selectedCell.events" :key="ev.a.id + '-d' + idx" class="detail-item">
        <div class="detail-main">
          <span class="cat-tag" :style="{ background: catColor(ev.a) + '22', color: catColor(ev.a) }">
            {{ ev.a.category || '活动' }}
          </span>
          <strong class="detail-name">{{ titleOf(ev.a) }}</strong>
          <div class="detail-meta">
            <span v-if="evTime(ev)">🕒 {{ evTime(ev) }}</span>
            <span v-if="locOf(ev.a) && locOf(ev.a) !== '—'">📍 {{ locOf(ev.a) }}</span>
          </div>
          <p v-if="descOf(ev.a)" class="detail-desc">{{ descOf(ev.a) }}</p>
        </div>
        <!-- 已定活动：报名 -->
        <div v-if="ev.kind === 'dated' && hasCapacity(ev.a)" class="detail-side">
          <template v-if="!isAuthenticated">
            <button class="mini-signup" @click="actions.goToAuth">{{ t.loginSignup }}</button>
          </template>
          <template v-else-if="actions.isSignedUp(ev.a.id)">
            <button class="mini-signup signed" @click="actions.cancelSignup(ev.a.id)">{{ t.signed }}</button>
          </template>
          <template v-else-if="actions.isFull(ev.a)">
            <button class="mini-signup full" disabled>{{ t.full }}</button>
          </template>
          <template v-else>
            <button class="mini-signup" @click="actions.doSignup(ev.a.id)">{{ t.signup }}</button>
          </template>
          <span class="detail-count">{{ actions.getRegisteredCount(ev.a) }}/{{ ev.a.capacity }}</span>
        </div>
      </div>
    </div>

    <!-- 待排期 -->
    <div v-if="planningList.length" class="planning-section">
      <h4 class="section-title">{{ t.planning(planningList.length) }}</h4>
      <div class="planning-list">
        <div v-for="a in planningList" :key="a.id" class="planning-card">
          <span class="cat-tag" :style="{ background: catColor(a) + '22', color: catColor(a) }">{{ a.category }}</span>
          <div class="planning-body">
            <strong>{{ titleOf(a) }}</strong>
            <small v-if="a.cadence">{{ a.cadence }}</small>
            <small v-if="a.scale">{{ t.scaleLabel }}{{ a.scale }}</small>
          </div>
        </div>
      </div>
    </div>
    </div><!-- /cal-detail-pane -->

    <!-- 文字计划弹窗 -->
    <div v-if="showPlan" class="plan-modal" @click.self="showPlan = false">
      <div class="plan-modal-card">
        <div class="plan-modal-head">
          <strong>{{ t.planTitle }}</strong>
          <button class="plan-close" @click="showPlan = false" aria-label="close">✕</button>
        </div>
        <textarea class="plan-textarea" v-model="planText" readonly></textarea>
        <div class="plan-modal-foot">
          <span class="plan-tip">{{ t.planTip }}</span>
          <button class="plan-copy" @click="copyPlan">{{ copied ? t.copied : t.copy }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLang } from '../composables/useLang'

const i18n = {
  zh: {
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    today: '今天', exportIcs: '📄 导出日历', plan: '📋 文字计划',
    summary: (d, w, h) => `${d} 个已定活动 · ${w} 项固定节奏${h ? ` · ${h} 个节日提醒` : ''}`,
    planning: (n) => `🗓️ 待排期（${n}）`,
    holidayPrefix: '节日 · ', recurringDefault: '固定',
    holidayLabel: '节日提醒', recurringLabel: '固定活动',
    day1: '第 1 天', day2: '第 2 天', allDay: '全天',
    noEvent: '这一天没有安排',
    loginSignup: '登录后报名', signed: '✓ 已报名', full: '名额已满', signup: '立即报名',
    planTitle: '可转发文字计划', planTip: '可直接复制转发到微信群，切换月份可生成对应月份计划',
    copy: '复制全文', copied: '✓ 已复制',
    planHeader: '活动计划',
    header: (m) => `【薄荷4班 · ${m}活动计划】`,
    tbd: '待定',
    dayOf: (d) => `${d} 日`,
    weekSep: '、',
    secDated: '◆ 已定活动', secHoliday: '◆ 节日提醒', secWeekly: '◆ 固定运动', secPlanning: '◆ 待排期（欢迎在许愿池提议）',
    weekPrefix: '每周', cap: (n) => `（全员可报名 ${n} 人）`,
    scale: (s) => `（${s}）`, scaleLabel: '规模：',
  },
  en: {
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    today: 'Today', exportIcs: '📄 Export ICS', plan: '📋 Text plan',
    summary: (d, w, h) => `${d} scheduled · ${w} recurring${h ? ` · ${h} holidays` : ''}`,
    planning: (n) => `🗓️ To be scheduled (${n})`,
    holidayPrefix: 'Holiday · ', recurringDefault: 'Recurring',
    holidayLabel: 'Holiday', recurringLabel: 'Recurring',
    day1: 'Day 1', day2: 'Day 2', allDay: 'All day',
    noEvent: 'Nothing scheduled',
    loginSignup: 'Login to register', signed: '✓ Registered', full: 'Full', signup: 'Register',
    planTitle: 'Shareable text plan', planTip: 'Copy to share in group chats. Switch months to regenerate.',
    copy: 'Copy all', copied: '✓ Copied',
    planHeader: 'Activity plan',
    header: (m) => `[Mint4 · ${m} Activity Plan]`,
    tbd: 'TBD',
    dayOf: (d) => `${d}`,
    weekSep: ', ',
    secDated: '◆ Scheduled', secHoliday: '◆ Holidays', secWeekly: '◆ Recurring sports', secPlanning: '◆ To be scheduled (post in Wish Wall)',
    weekPrefix: 'Every ', cap: (n) => ` (open to all, ${n} slots)`,
    scale: (s) => ` (${s})`, scaleLabel: 'Scale: ',
  },
  th: {
    weekdays: ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
    today: 'วันนี้', exportIcs: '📄 ส่งออก ICS', plan: '📋 แผนข้อความ',
    summary: (d, w, h) => `${d} รายการที่กำหนด · ${w} รายการประจำ${h ? ` · ${h} วันหยุด` : ''}`,
    planning: (n) => `🗓️ รอกำหนด (${n})`,
    holidayPrefix: 'วันหยุด · ', recurringDefault: 'ประจำ',
    holidayLabel: 'วันหยุด', recurringLabel: 'รายการประจำ',
    day1: 'วันที่ 1', day2: 'วันที่ 2', allDay: 'ทั้งวัน',
    noEvent: 'ไม่มีรายการ',
    loginSignup: 'เข้าสู่ระบบเพื่อลงทะเบียน', signed: '✓ ลงทะเบียนแล้ว', full: 'เต็ม', signup: 'ลงทะเบียน',
    planTitle: 'แผนข้อความที่แชร์ได้', planTip: 'คัดลอกเพื่อแชร์ในแชตกลุ่ม เปลี่ยนเดือนเพื่อสร้างใหม่',
    copy: 'คัดลอกทั้งหมด', copied: '✓ คัดลอกแล้ว',
    planHeader: 'แผนกิจกรรม',
    header: (m) => `[Mint4 · แผนกิจกรรม ${m}]`,
    tbd: 'รอกำหนด',
    dayOf: (d) => `${d}`,
    weekSep: ' ',
    secDated: '◆ กำหนดแล้ว', secHoliday: '◆ วันหยุด', secWeekly: '◆ กีฬาประจำ', secPlanning: '◆ รอกำหนด (เสนอได้ในหน้าคำขอ)',
    weekPrefix: 'ทุก', cap: (n) => ` (เปิดทุกคน ${n} ที่)`,
    scale: (s) => ` (${s})`, scaleLabel: 'ขนาด: ',
  },
}
const { lang, t } = useLang(i18n)

const props = defineProps({
  activities: { type: Array, default: () => [] },
  isAuthenticated: { type: Boolean, default: false },
  actions: { type: Object, default: () => ({}) },
})

const weekdays = computed(() => t.value.weekdays)
const cursor = ref(null)
const selectedIso = ref(null)
const ready = ref(false)

const CAT_COLORS = {
  '运动': '#007aff',
  '社交': '#ff9500',
  '分享': '#af52de',
  '综合': '#2d7a6c',
  '节日': '#ff3b30',
}
function catColor(a) {
  return CAT_COLORS[a.category] || 'var(--c-accent)'
}
function catClass(a) {
  return 'cat-' + (a.category || 'other')
}

function titleOf(a) {
  if (!a) return ''
  if (typeof a.title === 'string') return a.title
  return a.title?.zh || a.title?.en || a.title?.th || ''
}
function locOf(a) {
  if (!a) return ''
  if (typeof a.location === 'string') return a.location
  return a.location?.zh || a.location?.en || a.location?.th || ''
}
function descOf(a) {
  if (!a) return ''
  if (typeof a.description === 'string') return a.description
  return a.description?.zh || a.description?.en || ''
}

function pad(n) { return String(n).padStart(2, '0') }
function isoOf(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function sameDay(a, b) { return isoOf(a) === isoOf(b) }

// ===== 农历 / 节日换算（移植自体验组日历） =====
let lunarFormatter = null
function getLunarFormatter() {
  if (!lunarFormatter) {
    lunarFormatter = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric' })
  }
  return lunarFormatter
}
function lunarParts(date) {
  const parts = getLunarFormatter().formatToParts(date)
  const monthText = parts.find(p => p.type === 'month')?.value || ''
  const dayText = parts.find(p => p.type === 'day')?.value || ''
  return {
    month: Number.parseInt(monthText, 10),
    day: Number.parseInt(dayText, 10),
    leap: /bis|闰/i.test(monthText),
  }
}
function holidayOccursOn(e, date) {
  if (e.annual) {
    return date.getMonth() + 1 === e.annual.month && date.getDate() === e.annual.day
  }
  if (e.floating) {
    if (date.getMonth() + 1 !== e.floating.month || date.getDay() !== e.floating.weekday) return false
    return Math.floor((date.getDate() - 1) / 7) + 1 === e.floating.ordinal
  }
  if (e.calculated === 'qingming') {
    const y = date.getFullYear() % 100
    const day = Math.floor(y * 0.2422 + 4.81) - Math.floor(y / 4)
    return date.getMonth() === 3 && date.getDate() === day
  }
  if (e.lunar) {
    const l = lunarParts(date)
    return !l.leap && l.month === e.lunar.month && l.day === e.lunar.day
  }
  if (e.lunarEve) {
    const t = new Date(date)
    t.setDate(t.getDate() + 1)
    const l = lunarParts(t)
    return !l.leap && l.month === 1 && l.day === 1
  }
  return false
}
function occursOn(a, iso) {
  return Boolean(a.date && a.date <= iso && (a.endDate || a.date) >= iso)
}

// ===== 当月数据 =====
const year = computed(() => cursor.value?.getFullYear())
const month = computed(() => cursor.value?.getMonth())

const monthTitle = computed(() => {
  if (!cursor.value) return ''
  return new Intl.DateTimeFormat(dateLocale.value, { year: 'numeric', month: 'long' }).format(cursor.value)
})

const exactEvents = computed(() => {
  if (!ready.value) return []
  const y = year.value, m = month.value
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const monthStart = `${y}-${pad(m + 1)}-01`
  const monthEnd = `${y}-${pad(m + 1)}-${pad(daysInMonth)}`
  return props.activities.filter(a => a.date && a.date <= monthEnd && (a.endDate || a.date) >= monthStart)
})
const weeklyEvents = computed(() =>
  props.activities.filter(a => Array.isArray(a.recurrence?.days) && a.recurrence.days.length)
)
const holidayEvents = computed(() =>
  props.activities.filter(a => a.stage === 'reminder' || a.category === '节日')
)
const planningList = computed(() =>
  props.activities.filter(a => a.stage === 'planning')
)

const cells = computed(() => {
  if (!ready.value) return []
  const y = year.value, m = month.value
  const first = new Date(y, m, 1)
  const gridStart = new Date(y, m, 1 - ((first.getDay() + 6) % 7))
  const today = new Date()
  const arr = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const iso = isoOf(d)
    const inMonth = d.getMonth() === m
    const evs = []
    // 已定活动（含跨月跨天）
    exactEvents.value.filter(a => occursOn(a, iso)).forEach(a => evs.push({ a, kind: 'dated' }))
    if (inMonth) {
      // 固定每周活动
      weeklyEvents.value
        .filter(a => a.recurrence.days.includes(d.getDay()))
        .forEach(a => evs.push({ a, kind: 'recurring' }))
      // 节日
      holidayEvents.value.forEach(a => {
        if (holidayOccursOn(a, d)) evs.push({ a, kind: 'holiday' })
      })
    }
    arr.push({
      d,
      iso,
      inMonth,
      isToday: sameDay(d, today),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      events: evs,
    })
  }
  return arr
})

const selectedCell = computed(() => cells.value.find(c => c.iso === selectedIso.value) || null)

const monthSummary = computed(() => {
  if (!ready.value) return ''
  const weekly = weeklyEvents.value.length
  const holidayCount = cells.value.reduce((n, c) => n + c.events.filter(e => e.kind === 'holiday').length, 0)
  return t.value.summary(exactEvents.value.length, weekly, holidayCount)
})

const dateLocale = computed(() => (lang.value === 'zh' ? 'zh-CN' : lang.value === 'th' ? 'th-TH' : 'en-US'))
const selectedTitle = computed(() => {
  if (!selectedCell.value) return ''
  return new Intl.DateTimeFormat(dateLocale.value, {
    month: 'long', day: 'numeric', weekday: 'long',
  }).format(selectedCell.value.d)
})

// ===== 标签文案 =====
function evLabel(ev) {
  const a = ev.a
  if (ev.kind === 'holiday') return t.value.holidayPrefix + titleOf(a)
  if (ev.kind === 'recurring') return (a.recurrence?.time ? a.recurrence.time : t.value.recurringDefault) + ' ' + titleOf(a)
  return titleOf(a)
}
function evTime(ev) {
  const a = ev.a
  if (ev.kind === 'holiday') return t.value.holidayLabel
  if (ev.kind === 'recurring') return a.recurrence?.time || t.value.recurringLabel
  if (a.endDate && selectedCell.value) {
    if (selectedCell.value.iso === a.date) return t.value.day1 + (a.time ? ' · ' + a.time : '')
    if (selectedCell.value.iso === a.endDate) return t.value.day2 + (a.time ? ' · ' + a.time : '')
  }
  return a.time || t.value.allDay
}

function hasCapacity(a) {
  return typeof a.capacity === 'number' && a.capacity > 0
}

// ===== 交互 =====
function shiftMonth(delta) {
  if (!cursor.value) return
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1)
  // 选中同月同日（若存在）
  const y = cursor.value.getFullYear(), m = cursor.value.getMonth()
  const day = Number(selectedIso.value?.slice(8) || new Date().getDate())
  const dim = new Date(y, m + 1, 0).getDate()
  selectedIso.value = `${y}-${pad(m + 1)}-${pad(Math.min(day, dim))}`
}
function goToday() {
  const t = new Date()
  cursor.value = new Date(t.getFullYear(), t.getMonth(), 1)
  selectedIso.value = isoOf(t)
}
function selectCell(cell) {
  selectedIso.value = cell.iso
  if (!cell.inMonth) {
    cursor.value = new Date(cell.d.getFullYear(), cell.d.getMonth(), 1)
  }
}

// ===== 导出 ICS 日历 =====
const WEEK_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
function icsEscape(v) {
  return String(v || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}
function compact(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}
function buildICS() {
  const y = cursor.value.getFullYear()
  const nowUTC = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Mint4//Class Activity Calendar//ZH-CN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  ]
  // 1) 已定日期活动（全天，跨天按 endDate+1）
  props.activities.filter(a => a.date).forEach(a => {
    const startD = new Date(`${a.date}T12:00:00`)
    const endD = new Date(`${a.endDate || a.date}T12:00:00`)
    endD.setDate(endD.getDate() + 1)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${a.id}-${a.date}@mint4`,
      `DTSTAMP:${nowUTC}`,
      `DTSTART;VALUE=DATE:${compact(startD)}`,
      `DTEND;VALUE=DATE:${compact(endD)}`,
      `SUMMARY:${icsEscape(titleOf(a))}`,
      `DESCRIPTION:${icsEscape(descOf(a))}`,
      `LOCATION:${icsEscape(locOf(a))}`,
      'END:VEVENT',
    )
  })
  // 2) 公历固定节日（每年重复）
  props.activities.filter(a => a.annual).forEach(a => {
    const d = new Date(y, a.annual.month - 1, a.annual.day)
    const e = new Date(d); e.setDate(e.getDate() + 1)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${a.id}@mint4`,
      `DTSTAMP:${nowUTC}`,
      `DTSTART;VALUE=DATE:${compact(d)}`,
      `DTEND;VALUE=DATE:${compact(e)}`,
      'RRULE:FREQ=YEARLY',
      `SUMMARY:${icsEscape(titleOf(a))}`,
      'END:VEVENT',
    )
  })
  // 3) 浮动/农历/清明等节日：按当年展开为具体日期
  const otherHolidays = props.activities.filter(a => (a.stage === 'reminder' || a.category === '节日') && !a.annual)
  for (let mm = 0; mm < 12; mm++) {
    const days = new Date(y, mm + 1, 0).getDate()
    for (let dd = 1; dd <= days; dd++) {
      const d = new Date(y, mm, dd, 12)
      otherHolidays.forEach(a => {
        if (holidayOccursOn(a, d)) {
          const e = new Date(d); e.setDate(e.getDate() + 1)
          lines.push(
            'BEGIN:VEVENT',
            `UID:${a.id}-${y}@mint4`,
            `DTSTAMP:${nowUTC}`,
            `DTSTART;VALUE=DATE:${compact(d)}`,
            `DTEND;VALUE=DATE:${compact(e)}`,
            `SUMMARY:${icsEscape(titleOf(a))}`,
            'END:VEVENT',
          )
        }
      })
    }
  }
  // 4) 固定每周运动（每周重复，全天，标题带时间）
  props.activities
    .filter(a => Array.isArray(a.recurrence?.days) && a.recurrence.days.length)
    .forEach(a => {
      const byday = a.recurrence.days.map(d => WEEK_CODES[d]).join(',')
      const label = `${a.recurrence?.time ? a.recurrence.time + ' ' : ''}${titleOf(a)}`
      lines.push(
        'BEGIN:VEVENT',
        `UID:${a.id}@mint4`,
        `DTSTAMP:${nowUTC}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
        `SUMMARY:${icsEscape(label)}`,
        `DESCRIPTION:${icsEscape(descOf(a))}`,
        `LOCATION:${icsEscape(locOf(a))}`,
        'END:VEVENT',
      )
    })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
function downloadFile(name, type, content) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function exportICS() {
  downloadFile('薄荷4班活动日历.ics', 'text/calendar;charset=utf-8', buildICS())
}

// ===== 文字版计划（当月，可转发） =====
const showPlan = ref(false)
const planText = ref('')
const copied = ref(false)
function buildPlanText() {
  const L = t.value
  const mName = new Intl.DateTimeFormat(dateLocale.value, { year: 'numeric', month: 'long' }).format(cursor.value)
  const out = [L.header(mName), '']

  // 已定活动
  const dated = exactEvents.value
  if (dated.length) {
    out.push(L.secDated)
    dated.forEach(a => {
      const range = a.endDate ? `${a.date} ~ ${a.endDate}` : a.date
      const cap = a.capacity ? L.cap(a.capacity) : ''
      const loc = locOf(a) && locOf(a) !== L.tbd ? ` @${locOf(a)}` : ''
      out.push(`· ${range} ${titleOf(a)}${cap}${loc}`)
    })
    out.push('')
  }

  // 本月节日（按日期去重）
  const seen = new Set()
  const holidays = []
  cells.value.forEach(c => {
    if (!c.inMonth) return
    c.events.filter(e => e.kind === 'holiday').forEach(e => {
      if (!seen.has(e.a.id)) {
        seen.add(e.a.id)
        holidays.push({ day: c.d.getDate(), a: e.a })
      }
    })
  })
  if (holidays.length) {
    out.push(L.secHoliday)
    holidays.sort((x, z) => x.day - z.day).forEach(h => out.push(`· ${L.dayOf(h.day)} ${titleOf(h.a)}`))
    out.push('')
  }

  // 固定节奏
  const weekly = weeklyEvents.value
  if (weekly.length) {
    out.push(L.secWeekly)
    weekly.forEach(a => {
      const days = (a.recurrence?.days || []).map(d => L.weekdays[d]).join(L.weekSep)
      out.push(`· ${L.weekPrefix}${days} ${a.recurrence?.time ? a.recurrence.time + ' ' : ''}${titleOf(a)}${locOf(a) ? ' @' + locOf(a) : ''}`)
    })
    out.push('')
  }

  // 待排期
  const planning = planningList.value
  if (planning.length) {
    out.push(L.secPlanning)
    planning.forEach(a => out.push(`· ${titleOf(a)}${a.scale ? L.scale(a.scale) : ''}`))
  }
  return out.join('\n')
}
function openPlan() {
  planText.value = buildPlanText()
  showPlan.value = true
  copied.value = false
}
async function copyPlan() {
  try {
    await navigator.clipboard.writeText(planText.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch (e) {
    // 兜底：选中文字
    const ta = document.querySelector('.plan-textarea')
    if (ta) { ta.select(); document.execCommand('copy') }
  }
}

onMounted(() => {
  const t = new Date()
  cursor.value = new Date(t.getFullYear(), t.getMonth(), 1)
  selectedIso.value = isoOf(t)
  ready.value = true
})
</script>

<style scoped>
.cal-wrap {
  margin-bottom: 40px;
}
/* 两个分区：月历本体 / 详情+待排期（在活动页由外层网格决定列宽，此处只留间距） */
.cal-detail-pane { margin-bottom: 40px; }

/* 工具栏 */
.cal-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.cal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--c-text-primary);
  min-width: 130px;
  text-align: center;
}
.cal-nav {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: 1px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-text-primary);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal-nav:hover { background: var(--c-bg-secondary); }
.cal-today {
  margin-left: auto;
  background: var(--c-accent-light);
  color: var(--c-accent);
  border: none;
  border-radius: var(--radius-full);
  padding: 7px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.cal-export {
  background: var(--c-bg-card);
  color: var(--c-text-secondary);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.cal-export:hover { border-color: var(--c-accent); color: var(--c-accent); }
.cal-summary {
  font-size: 13px;
  color: var(--c-text-tertiary);
  margin: 6px 2px 14px;
}

/* 星期表头 */
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.cal-weekdays span {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-tertiary);
  padding: 6px 0;
}
.cal-weekdays span.weekend { color: var(--c-red); }

/* 网格 */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-cell {
  min-height: 72px;
  min-width: 0;
  border: 1px solid var(--c-border-light);
  border-radius: var(--radius-md);
  padding: 5px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cal-cell:hover { border-color: var(--c-border-accent); }
.cal-cell.muted { background: var(--c-bg-tertiary); opacity: 0.55; }
.cal-cell.weekend { background: var(--c-red-light); }
.cal-cell.muted.weekend { background: var(--c-bg-tertiary); }
.cal-cell.today {
  border-color: var(--c-accent);
  box-shadow: inset 0 0 0 1px var(--c-accent);
}
.cal-cell.selected {
  border-color: var(--c-accent);
  background: var(--c-accent-light);
}
.cell-num {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-secondary);
  margin-bottom: 4px;
  align-self: flex-start;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}
.cal-cell.today .cell-num {
  background: var(--c-accent);
  color: #fff;
}

/* 当日活动 chips */
.cell-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.ev-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 1px 3px;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.3;
}
.ev-chip:hover { background: var(--c-bg-secondary); }
.ev-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ev-name {
  flex: 1;
  min-width: 0;
  color: var(--c-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ev-chip[class*="cat-节日"] .ev-name { color: var(--c-red); }
.ev-more {
  font-size: 10px;
  color: var(--c-text-quaternary);
  padding: 0 3px;
}

/* 选中日详情 */
.day-detail {
  margin-top: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: 18px 20px;
}
.day-detail-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 14px;
  color: var(--c-text-primary);
}
.day-detail-empty {
  color: var(--c-text-tertiary);
  font-size: 14px;
  text-align: center;
  padding: 16px 0;
}
.detail-item {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--c-border-light);
}
.detail-item:last-child { border-bottom: none; }
.detail-main { flex: 1; min-width: 0; }
.cat-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  margin-bottom: 6px;
}
.detail-name {
  display: block;
  font-size: 15px;
  color: var(--c-text-primary);
  margin-bottom: 4px;
}
.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 13px;
  color: var(--c-text-tertiary);
  margin-bottom: 4px;
}
.detail-desc {
  font-size: 13px;
  color: var(--c-text-secondary);
  margin: 4px 0 0;
  line-height: 1.5;
}
.detail-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.mini-signup {
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-full);
  padding: 7px 18px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.mini-signup.signed { background: var(--c-bg-secondary); color: var(--c-accent); }
.mini-signup.full { background: var(--c-bg-secondary); color: var(--c-text-quaternary); cursor: not-allowed; }
.detail-count {
  font-size: 12px;
  color: var(--c-text-quaternary);
}

/* 待排期 */
.planning-section { margin-top: 24px; }
.section-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--c-text-primary);
}
.planning-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}
.planning-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: var(--c-bg-card);
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
}
.planning-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.planning-body strong {
  font-size: 14px;
  color: var(--c-text-primary);
}
.planning-body small {
  font-size: 12px;
  color: var(--c-text-tertiary);
}

/* 文字计划弹窗 */
.plan-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.plan-modal-card {
  background: var(--c-bg-card);
  border-radius: var(--radius-xl);
  width: min(640px, 100%);
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-float);
}
.plan-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--c-border);
  font-size: 16px;
  color: var(--c-text-primary);
}
.plan-close {
  border: none;
  background: transparent;
  color: var(--c-text-tertiary);
  font-size: 16px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
}
.plan-close:hover { background: var(--c-bg-secondary); }
.plan-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  padding: 18px 20px;
  font: 13px/1.9 ui-monospace, SFMono-Regular, Menlo, Consolas, "PingFang SC", monospace;
  color: var(--c-text-primary);
  background: var(--c-bg-card);
  min-height: 320px;
  white-space: pre-wrap;
}
.plan-modal-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--c-border);
}
.plan-tip { font-size: 12px; color: var(--c-text-tertiary); }
.plan-copy {
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-full);
  padding: 9px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .cal-cell { min-height: 64px; padding: 3px; }
  .ev-name { font-size: 10px; }
  .ev-chip { padding: 0 2px; }
  .cal-cell .ev-chip:nth-child(n+3) { display: none; }
  .cal-toolbar { flex-wrap: wrap; gap: 8px; }
  .cal-today { margin-left: auto; }
  .cal-export { padding: 7px 12px; font-size: 12px; }
  .plan-modal-foot { flex-direction: column; align-items: stretch; }
  .plan-copy { width: 100%; }
}
</style>
