<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLang, formatDate } from '../composables/useLang'

const i18n = {
  zh: {
    today: '今天',
    toClass: '距下节课',
    days: '天',
    hours: '小时',
    holiday: '放假中 · 下学期见',
    viewSchedule: '查看课表',
  },
  en: {
    today: 'Today',
    toClass: 'Next class in',
    days: 'd',
    hours: 'h',
    holiday: 'On break · See you next semester',
    viewSchedule: 'View schedule',
  },
  th: {
    today: 'วันนี้',
    toClass: 'คาบเรียนถัดไปใน',
    days: 'วัน',
    hours: 'ชม.',
    holiday: 'อยู่ในช่วงพัก · เจอกันภาคเรียนหน้า',
    viewSchedule: 'ดูตารางเรียน',
  },
}

const { lang, t } = useLang(i18n)

const scheduleData = ref(null)
const now = ref(new Date())
let timer = null

onMounted(async () => {
  try {
    const res = await fetch('/data/schedule.json')
    scheduleData.value = await res.json()
  } catch (e) {
    scheduleData.value = null
  }
  timer = setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 课程主题色
const courseTheme = {
  '数据、模型与决策': '#8b9cf0',
  '管理经济学': '#4fd1c5',
  '会计学': '#d4af37',
}

// 找下一节课
const nextUp = computed(() => {
  if (!scheduleData.value?.courses) return null
  const all = []
  for (const course of scheduleData.value.courses) {
    for (const s of course.sessions) {
      const start = new Date(`${s.date}T${s.time_start}:00`)
      const end = new Date(`${s.date}T${s.time_end}:00`)
      all.push({
        courseName: course.name,
        teacher: course.teacher,
        location: course.location,
        date: s.date,
        startDateTime: start,
        endDateTime: end,
      })
    }
  }
  all.sort((a, b) => a.startDateTime - b.startDateTime)
  return all.find(s => s.endDateTime > now.value) || null
})

// 倒计时
const countdown = computed(() => {
  if (!nextUp.value) return null
  const diff = nextUp.value.startDateTime - now.value
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  return { days, hours }
})

const todayLabel = computed(() => {
  return formatDate(now.value, { month: 'short', day: 'numeric', weekday: 'short' })
})

const courseColor = computed(() => {
  if (!nextUp.value) return 'var(--c-accent)'
  return courseTheme[nextUp.value.courseName] || 'var(--c-accent)'
})

function goSchedule() {
  const prefix = lang.value === 'en' ? '/en' : lang.value === 'th' ? '/th' : ''
  window.location.href = `${prefix}/schedule/`
}
</script>

<template>
  <div class="today-footer-pill" @click="goSchedule" :title="t.viewSchedule">
    <span class="tfp-dot" :style="{ background: courseColor }"></span>
    <span class="tfp-today">{{ t.today }} · {{ todayLabel }}</span>
    <template v-if="nextUp && countdown">
      <span class="tfp-sep">·</span>
      <span class="tfp-next">{{ t.toClass }}
        <strong>{{ countdown.days }}{{ t.days }}</strong>
        <template v-if="countdown.hours > 0"> {{ countdown.hours }}{{ t.hours }}</template>
      </span>
    </template>
    <template v-else>
      <span class="tfp-sep">·</span>
      <span class="tfp-holiday">{{ t.holiday }}</span>
    </template>
    <span class="tfp-arrow">→</span>
  </div>
</template>

<style scoped>
.today-footer-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 8px 20px;
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
  background: var(--c-bg-secondary);
  border-top: 1px solid var(--c-border-light);
  cursor: pointer;
  transition: background var(--transition-fast);
  user-select: none;
}

.today-footer-pill:hover {
  background: var(--c-accent-light);
}

.tfp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tfp-today {
  font-weight: var(--font-medium);
  color: var(--c-text-primary);
  white-space: nowrap;
}

.tfp-sep {
  color: var(--c-text-quaternary);
}

.tfp-next {
  white-space: nowrap;
}

.tfp-next strong {
  color: var(--c-accent);
  font-weight: var(--font-semibold);
}

.tfp-holiday {
  color: var(--c-text-tertiary);
  font-style: italic;
}

.tfp-arrow {
  margin-left: auto;
  color: var(--c-text-quaternary);
  font-size: var(--text-base);
}

@media (max-width: 640px) {
  .today-footer-pill {
    padding: 6px 16px;
    font-size: var(--text-xs);
    gap: 6px;
  }
  .tfp-holiday {
    display: none;
  }
}
</style>
