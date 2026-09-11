<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLang, formatDate } from '../composables/useLang'

const props = defineProps({
  scheduleData: { type: Object, default: null }
})

// 课程主题色（按课程中文名映射；内联 style 使用）
const courseTheme = {
  '数据、模型与决策': '#8b9cf0',
  '管理经济学': '#4fd1c5',
  '会计学': '#d4af37'
}
const fallbackColor = 'var(--c-accent)'

function themeColor(name) {
  return courseTheme[name] || fallbackColor
}

// ============ i18n ============
const i18n = {
  zh: {
    nextUp: '下节课',
    days: '天',
    hours: '小时',
    at: '在',
    in: '还有',
    live: '进行中'
  },
  en: {
    nextUp: 'Next class',
    days: 'd',
    hours: 'h',
    at: 'at',
    in: 'in',
    live: 'In progress'
  },
  th: {
    nextUp: 'คาบเรียนถัดไป',
    days: 'วัน',
    hours: 'ชม.',
    at: 'ที่',
    in: 'อีก',
    live: 'กำลังเรียน'
  }
}
const { t } = useLang(i18n)

// ============ 倒计时时钟 ============
const now = ref(new Date())
let timer = null

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 60000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// ============ 数据：扫描所有 session，找下一节未结束的课 ============
const nextUp = computed(() => {
  const data = props.scheduleData
  if (!data || !Array.isArray(data.courses) || data.courses.length === 0) return null

  const all = []
  for (const course of data.courses) {
    if (!Array.isArray(course.sessions)) continue
    for (const s of course.sessions) {
      if (!s || !s.date || !s.time_start) continue
      const startDateTime = new Date(`${s.date}T${s.time_start}:00`)
      const endDateTime = new Date(`${s.date}T${s.time_end}:00`)
      if (isNaN(startDateTime) || isNaN(endDateTime)) continue
      all.push({
        courseName: course.name,
        teacher: course.teacher,
        location: course.location,
        date: s.date,
        timeStart: s.time_start,
        timeEnd: s.time_end,
        startDateTime,
        endDateTime,
        color: themeColor(course.name)
      })
    }
  }
  if (all.length === 0) return null
  all.sort((a, b) => a.startDateTime - b.startDateTime)
  // 第一个 endDateTime > now 的节
  const found = all.find(item => item.endDateTime > now.value)
  return found || null
})

// 倒计时分解（不跳秒）
const countdown = computed(() => {
  if (!nextUp.value) return null
  const diffMs = nextUp.value.startDateTime - now.value
  // nextUp 保证 endDateTime > now，因此 diffMs <= 0 即课程正在进行中
  if (diffMs <= 0) return { live: true, days: 0, hours: 0, totalHours: 0 }
  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  return { live: false, days, hours, totalHours }
})

// <24h 紧急态：薄荷呼吸光（进行中不触发）
const urgent = computed(() => {
  if (!nextUp.value || !countdown.value) return false
  if (countdown.value.live) return false
  return countdown.value.totalHours < 24
})

// 紧凑显示：>=1天 显示 "X天 Y小时"，<1天 显示 "Y小时"
const countdownMain = computed(() => {
  if (!countdown.value || countdown.value.live) return ''
  const { days, hours } = countdown.value
  if (days > 0) return days
  return hours
})
const countdownUnit = computed(() => {
  if (!countdown.value || countdown.value.live) return ''
  return countdown.value.days > 0 ? t.value.days : t.value.hours
})
const countdownSub = computed(() => {
  if (!countdown.value || countdown.value.live) return ''
  if (countdown.value.days > 0) return `${countdown.value.hours}${t.value.hours}`
  return ''
})
</script>

<template>
  <article
    v-if="nextUp"
    class="next-up-pill"
    :class="{ urgent }"
    :style="{ '--course-color': nextUp.color }"
  >
    <!-- 左侧课程色块 -->
    <div class="nu-colorblock" :style="{ background: nextUp.color }"></div>

    <!-- 中间倒计时 -->
    <div class="nu-mid">
      <span class="nu-label">{{ t.nextUp }}</span>
      <div class="nu-count">
        <template v-if="countdown && countdown.live">
          <span class="nu-number nu-live">{{ t.live }}</span>
        </template>
        <template v-else>
          <span class="nu-number">{{ countdownMain }}</span>
          <span class="nu-unit">{{ countdownUnit }}</span>
          <span v-if="countdownSub" class="nu-sub">{{ countdownSub }}</span>
        </template>
      </div>
      <span class="nu-date">
        {{ t.in }} · {{ formatDate(nextUp.date, { weekday: 'short' }) }}
        {{ nextUp.timeStart }}
      </span>
    </div>

    <!-- 右侧课程名 + 地点 -->
    <div class="nu-right">
      <span class="nu-course">{{ nextUp.courseName }}</span>
      <span class="nu-location">{{ nextUp.location }}</span>
    </div>
  </article>
</template>

<style scoped>
.next-up-pill {
  display: flex;
  align-items: stretch;
  gap: var(--space-4);
  background: var(--c-card-accent-bg);
  border: 1px solid transparent;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  margin-bottom: var(--space-6);
  transition: box-shadow var(--transition-base), border-color var(--transition-base);
}

/* <24h 薄荷呼吸光 */
.next-up-pill.urgent {
  animation: nuBreathe 2.4s ease-in-out infinite;
}

@keyframes nuBreathe {
  0%, 100% { box-shadow: 0 0 0 2px var(--c-card-accent-border), 0 0 18px var(--c-accent-glow); }
  50% { box-shadow: 0 0 0 3px var(--c-accent), 0 0 28px var(--c-accent-glow); }
}

@media (prefers-reduced-motion: reduce) {
  .next-up-pill.urgent {
    animation: none;
    box-shadow: 0 0 0 2px var(--c-accent);
  }
}

/* 左侧色块 */
.nu-colorblock {
  width: 14px;
  flex-shrink: 0;
}

/* 中间区 */
.nu-mid {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-3) 0;
}

.nu-label {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-card-accent-text);
  opacity: 0.8;
  margin-bottom: 2px;
}

.nu-count {
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1;
}

.nu-number {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--c-card-accent-text);
  letter-spacing: var(--letter-spacing-tight);
  font-variant-numeric: tabular-nums;
}

.nu-unit {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--c-card-accent-subtext);
}

.nu-sub {
  font-size: var(--text-sm);
  color: var(--c-card-accent-subtext);
  margin-left: 4px;
}

.nu-date {
  margin-top: 4px;
  font-size: var(--text-xs);
  color: var(--c-card-accent-subtext);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 右侧区 */
.nu-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  padding: var(--space-3) var(--space-4) var(--space-3) 0;
  text-align: right;
  max-width: 45%;
}

.nu-course {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--c-card-accent-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.nu-location {
  font-size: var(--text-xs);
  color: var(--c-card-accent-text);
  background: rgba(255, 255, 255, 0.22);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 移动端：高度≤64px，不换行，字体缩小 */
@media (max-width: 640px) {
  .next-up-pill {
    gap: var(--space-3);
    align-items: center;
  }

  .nu-colorblock {
    width: 10px;
  }

  .nu-mid {
    padding: var(--space-2) 0;
  }

  .nu-number {
    font-size: var(--text-2xl);
  }

  .nu-unit {
    font-size: var(--text-xs);
  }

  .nu-sub {
    display: none;
  }

  .nu-date {
    font-size: 11px;
  }

  .nu-right {
    padding-right: var(--space-3);
    max-width: 40%;
  }

  .nu-course {
    font-size: var(--text-xs);
  }

  .nu-location {
    font-size: 10px;
    padding: 2px 8px;
  }
}
</style>
