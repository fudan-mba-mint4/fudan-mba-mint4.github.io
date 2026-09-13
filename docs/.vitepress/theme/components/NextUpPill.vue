<script setup>
import { ref, computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useNow } from '../composables/useNow.js'
import { parseDateTime, isOngoing as checkOngoing } from '../utils/dateUtils.js'

/* ========== i18n ========== */
const i18n = {
  zh: {
    nextUp: '下节课',
    startsIn: '开始倒计时',
    ongoing: '进行中',
    statusLabel: '课程状态',
    at: '上课',
    location: '地点',
    teacher: '老师',
    daysShort: '天',
    hoursShort: '时',
    minsShort: '分',
  },
  en: {
    nextUp: 'Next Up',
    startsIn: 'Starts in',
    ongoing: 'Ongoing',
    statusLabel: 'Status',
    at: 'Class',
    location: 'Room',
    teacher: 'Prof.',
    daysShort: 'd',
    hoursShort: 'h',
    minsShort: 'm',
  },
  th: {
    nextUp: 'คาบต่อไป',
    startsIn: 'เริ่มในอีก',
    ongoing: 'กำลังดำเนินการ',
    statusLabel: 'สถานะ',
    at: 'เรียน',
    location: 'ห้อง',
    teacher: 'อาจารย์',
    daysShort: 'วัน',
    hoursShort: 'ชม.',
    minsShort: 'น.',
  },
}
const { lang, t } = useLang(i18n)

/* ========== Props ========== */
const props = defineProps({
  // 完整 schedule.json 数据
  data: { type: Object, default: null },
})

/* ========== 实时时钟（每分钟刷新） ========== */
const { now } = useNow()

/* 课程名 -> 稳定索引（按 courses[] 顺序），用于颜色 */
const courseIndexMap = computed(() => {
  const m = new Map()
  if (props.data && Array.isArray(props.data.courses)) {
    props.data.courses.forEach((c, i) => m.set(c.name, i))
  }
  return m
})

/* 展平所有节次，按开始时间升序 */
const flattened = computed(() => {
  if (!props.data || !Array.isArray(props.data.schedule)) return []
  const list = []
  for (const day of props.data.schedule) {
    for (const c of day.courses) {
      const start = parseDateTime(c.date, c.time_start)
      const end = parseDateTime(c.date, c.time_end)
      list.push({ ...c, start, end })
    }
  }
  list.sort((a, b) => a.start - b.start)
  return list
})

/* 取第一个结束时间 > now 的节 */
const next = computed(() => {
  const nowD = now.value
  return flattened.value.find(s => s.end > nowD) || null
})

/* 距上课是否 < 24h */
const isImminent = computed(() => {
  if (!next.value) return false
  const diff = next.value.start - now.value
  return diff > 0 && diff < 24 * 60 * 60 * 1000
})

/* 是否正在进行中 */
const isOngoing = computed(() => {
  if (!next.value) return false
  return checkOngoing(next.value.date, next.value.time_start, next.value.time_end, now.value)
})

/* 倒计时文案：X天X小时 / X小时X分 / 进行中 */
const countdown = computed(() => {
  if (!next.value) return ''
  if (isOngoing.value) return t.value.ongoing
  let diffMs = next.value.start - now.value
  if (diffMs < 0) diffMs = 0
  const totalMins = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMins / (60 * 24))
  const hours = Math.floor((totalMins % (60 * 24)) / 60)
  const mins = totalMins % 60

  if (lang.value === 'zh') {
    if (days > 0) return `${days}${t.value.daysShort} ${hours}${t.value.hoursShort}`
    if (hours > 0) return `${hours}${t.value.hoursShort} ${mins}${t.value.minsShort}`
    return `${mins}${t.value.minsShort}`
  }
  if (lang.value === 'th') {
    if (days > 0) return `${days} ${t.value.daysShort} ${hours} ${t.value.hoursShort}`
    if (hours > 0) return `${hours} ${t.value.hoursShort} ${mins} ${t.value.minsShort}`
    return `${mins} ${t.value.minsShort}`
  }
  // en
  if (days > 0) return `${days}${t.value.daysShort} ${hours}${t.value.hoursShort}`
  if (hours > 0) return `${hours}${t.value.hoursShort} ${mins}${t.value.minsShort}`
  return `${mins}${t.value.minsShort}`
})

/* 课程色条 class（稳定索引） */
const courseColorClass = computed(() => {
  if (!next.value) return 'course-0'
  const idx = courseIndexMap.value.get(next.value.course) ?? 0
  return `course-${idx}`
})

/* 上课日期格式化 */
const startLabel = computed(() => {
  if (!next.value) return ''
  const locale = lang.value === 'th' ? 'th-TH-u-ca-buddhist' : lang.value === 'en' ? 'en-US' : 'zh-CN'
  return new Intl.DateTimeFormat(locale, {
    month: 'short', day: 'numeric', weekday: 'short',
  }).format(next.value.start) + ' · ' + next.value.time_start
})
</script>

<template>
  <!-- 学期结束/无下节课时不渲染 -->
  <div v-if="next" class="next-up-pill" :class="[courseColorClass, { imminent: isImminent }]">
    <!-- 左侧课程色条 -->
    <div class="color-bar" aria-hidden="true"></div>

    <!-- 中间：课程信息 + 大倒计时 -->
    <div class="main">
      <span class="eyebrow">{{ t.nextUp }} · {{ startLabel }}</span>
      <h2 class="course-name">{{ next.course }}</h2>
      <div class="countdown-row">
        <span class="countdown-label">{{ isOngoing ? t.statusLabel : t.startsIn }}</span>
        <span class="countdown-value" :class="{ ongoing: isOngoing }">{{ countdown }}</span>
      </div>
    </div>

    <!-- 右侧：地点/老师 chip -->
    <div class="meta">
      <span class="chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        {{ next.location }}
      </span>
      <span class="chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        {{ t.teacher }} {{ next.teacher }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.next-up-pill {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: var(--space-5);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-6);
  overflow: hidden;
  transition: box-shadow var(--transition-base);
}

/* 距上课 <24h 薄荷呼吸光 */
.next-up-pill.imminent {
  border-color: var(--c-border-accent);
  animation: mintBreathe 2.4s ease-in-out infinite;
}

@keyframes mintBreathe {
  0%, 100% { box-shadow: 0 0 0 1px var(--c-border-accent), 0 0 12px var(--c-accent-glow); }
  50%      { box-shadow: 0 0 0 1px var(--c-border-accent), 0 0 28px var(--c-accent-glow); }
}

@media (prefers-reduced-motion: reduce) {
  .next-up-pill.imminent { animation: none; box-shadow: 0 0 0 1px var(--c-border-accent); }
}

/* 左侧课程色条 */
.color-bar {
  width: 4px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  background: var(--course-text, var(--c-accent));
}

.main {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-tertiary);
  margin-bottom: var(--space-1);
}

.course-name {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--course-text, var(--c-accent));
  margin: 0 0 var(--space-2);
  line-height: var(--line-height-tight);
}

.countdown-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.countdown-label {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
}

.countdown-value {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--c-text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--letter-spacing-tight);
}

.meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  background: var(--c-bg-secondary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--c-text-secondary);
  white-space: nowrap;
}

/* ========== 课程色板（按稳定索引，深色模式自动提亮） ========== */
.course-0 { --course-text: #8b9cf0; }   /* 数据、模型与决策 */
.course-1 { --course-text: #3d9a85; }   /* 管理经济学 */
.course-2 { --course-text: #d4a017; }   /* 会计学 */

:global(html.dark) .course-0 { --course-text: #aab4f5; }
:global(html.dark) .course-1 { --course-text: #5ec4ac; }
:global(html.dark) .course-2 { --course-text: #e8b93b; }

/* ========== 移动端 ========== */
@media (max-width: 640px) {
  .next-up-pill {
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
  }
  .color-bar {
    width: 100%;
    height: 4px;
    border-radius: var(--radius-full);
  }
  .countdown-value { font-size: var(--text-2xl); }
  .meta { flex-direction: row; flex-wrap: wrap; }
}
</style>
