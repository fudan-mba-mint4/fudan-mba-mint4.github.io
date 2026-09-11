<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLang } from '../composables/useLang'

const props = defineProps({
  scheduleData: { type: Object, default: null }
})
const emit = defineEmits(['jump-date'])

// 课程主题色（与 NextUpPill 保持一致）
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
    semesterProgress: '学期进度',
    weekXOfN: (w, n) => `第${w}周 / 共${n}周`,
    doneCount: (m, total) => `已完成 ${m}/${total} 节`,
    past: '已完成',
    today: '今天',
    upcoming: '未开始'
  },
  en: {
    semesterProgress: 'Semester progress',
    weekXOfN: (w, n) => `Week ${w} of ${n}`,
    doneCount: (m, total) => `${m} of ${total} ${m === 1 ? 'class' : 'classes'} done`,
    past: 'Done',
    today: 'Today',
    upcoming: 'Upcoming'
  },
  th: {
    semesterProgress: 'ความคืบหน้าภาคเรียน',
    weekXOfN: (w, n) => `สัปดาห์ที่ ${w} / ${n}`,
    doneCount: (m, total) => `เสร็จแล้ว ${m}/${total} คาบ`,
    past: 'เสร็จแล้ว',
    today: 'วันนี้',
    upcoming: 'จะถึง'
  }
}
const { t } = useLang(i18n)

// ============ 时钟（分钟级刷新，与日期状态一致） ============
const now = ref(new Date())
let timer = null
onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 60000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

// ============ 学期时间范围 ============
const semesterRange = computed(() => {
  const data = props.scheduleData
  if (!data || !Array.isArray(data.courses) || data.courses.length === 0) return null
  let min = null
  let max = null
  for (const course of data.courses) {
    if (!Array.isArray(course.sessions)) continue
    for (const s of course.sessions) {
      if (!s || !s.date || !s.time_start) continue
      const start = new Date(`${s.date}T${s.time_start}:00`)
      const end = new Date(`${s.date}T${s.time_end}:00`)
      if (isNaN(start) || isNaN(end)) continue
      if (!min || start < min) min = start
      if (!max || end > max) max = end
    }
  }
  if (!min || !max || max <= min) return null
  return { semStart: min, semEnd: max }
})

// ============ 三条车道 ============
const lanes = computed(() => {
  const data = props.scheduleData
  const range = semesterRange.value
  if (!data || !range) return []
  const span = range.semEnd - range.semStart
  if (span <= 0) return []

  const todayStr = now.value.toDateString()

  return data.courses
    .filter(c => Array.isArray(c.sessions) && c.sessions.length > 0)
    .map(course => {
      const nodes = course.sessions
        .filter(s => s && s.date && s.time_start)
        .map(s => {
          const start = new Date(`${s.date}T${s.time_start}:00`)
          const end = new Date(`${s.date}T${s.time_end}:00`)
          // clamp 到 [1.5, 98.5]，避免首尾节点 translate(-50%,-50%) 后半个圆点溢出轨道被裁剪
          const rawPct = span > 0 ? ((start - range.semStart) / span) * 100 : 0
          const pct = Math.min(98.5, Math.max(1.5, rawPct))
          let status = 'upcoming'
          if (end < now.value) status = 'past'
          else if (start.toDateString() === todayStr) status = 'today'
          return {
            date: s.date,
            timeStart: s.time_start,
            start,
            end,
            pct,
            status
          }
        })
        .sort((a, b) => a.start - b.start)
      return {
        name: course.name,
        teacher: course.teacher,
        color: themeColor(course.name),
        nodes
      }
    })
})

// ============ 顶部进度牌 ============
const totalSessions = computed(() => {
  const data = props.scheduleData
  if (data && typeof data.total_sessions === 'number') return data.total_sessions
  let sum = 0
  for (const l of lanes.value) sum += l.nodes.length
  return sum
})

const doneCount = computed(() => {
  let m = 0
  for (const l of lanes.value) {
    for (const n of l.nodes) {
      if (n.end < now.value) m++
    }
  }
  return m
})

const totalWeeks = computed(() => {
  const range = semesterRange.value
  if (!range) return 1
  return Math.max(1, Math.floor((range.semEnd - range.semStart) / WEEK_MS) + 1)
})

const currentWeek = computed(() => {
  const range = semesterRange.value
  if (!range) return 1
  const w = Math.ceil((now.value - range.semStart) / WEEK_MS) + 1
  return Math.max(1, Math.min(totalWeeks.value, w))
})

const hasData = computed(() => lanes.value.length > 0 && semesterRange.value)

function onNodeClick(node) {
  emit('jump-date', node.date)
}
</script>

<template>
  <section v-if="hasData" class="semester-highway">
    <!-- 顶部进度牌 -->
    <div class="hw-header">
      <span class="hw-title">{{ t.semesterProgress }}</span>
      <span class="hw-stats">
        <span class="hw-week">{{ t.weekXOfN(currentWeek, totalWeeks) }}</span>
        <span class="hw-dot">·</span>
        <span class="hw-done">{{ t.doneCount(doneCount, totalSessions) }}</span>
      </span>
    </div>

    <!-- 横向滚动轨道 -->
    <div class="hw-scroll">
      <div class="hw-inner">
        <div
          v-for="lane in lanes"
          :key="lane.name"
          class="lane"
        >
          <div class="lane-label" :style="{ color: lane.color }">
            <span class="lane-swatch" :style="{ background: lane.color }"></span>
            <span class="lane-name">{{ lane.name }}</span>
          </div>
          <div class="lane-track">
            <div class="lane-line" :style="{ background: lane.color }"></div>
            <button
              v-for="node in lane.nodes"
              :key="node.date + node.timeStart"
              type="button"
              class="lane-node"
              :class="node.status"
              :style="{ left: node.pct + '%', '--node-color': lane.color }"
              :title="`${node.date} ${node.timeStart}`"
              @click="onNodeClick(node)"
            >
              <span class="node-dot"></span>
            </button>
          </div>
        </div>

        <!-- 图例 -->
        <div class="hw-legend">
          <span class="lg-item"><span class="lg-dot solid"></span>{{ t.past }}</span>
          <span class="lg-item"><span class="lg-dot today"></span>{{ t.today }}</span>
          <span class="lg-item"><span class="lg-dot hollow"></span>{{ t.upcoming }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.semester-highway {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-5) var(--space-5) var(--space-4);
  margin-bottom: var(--space-6);
}

.hw-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.hw-title {
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-accent);
}

.hw-stats {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
}

.hw-week {
  font-weight: 700;
  color: var(--c-text-primary);
}

.hw-dot {
  color: var(--c-text-quaternary);
}

.hw-done {
  font-variant-numeric: tabular-nums;
}

/* 横向滚动容器 */
.hw-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--space-1);
}

.hw-inner {
  min-width: 640px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-right: var(--space-2);
}

/* 车道行 */
.lane {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.lane-label {
  width: 108px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
}

.lane-swatch {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lane-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.lane-track {
  position: relative;
  flex: 1;
  height: 24px;
}

.lane-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 3px;
  transform: translateY(-50%);
  border-radius: var(--radius-full);
  opacity: 0.35;
}

/* 节点：热区 ≥24×24，圆心用 translate 定位 */
.lane-node {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  transform: translate(-50%, -50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid var(--node-color);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

/* 已过：实心 */
.lane-node.past .node-dot {
  background: var(--node-color);
  opacity: 0.55;
}

/* 未到：空心 */
.lane-node.upcoming .node-dot {
  background: transparent;
}

/* 今天：呼吸光晕 */
.lane-node.today .node-dot {
  background: var(--node-color);
  box-shadow: 0 0 0 3px var(--c-bg-card), 0 0 0 5px var(--node-color),
              0 0 14px var(--node-color);
  animation: hwPulse 2s ease-in-out infinite;
}

@keyframes hwPulse {
  0%, 100% { box-shadow: 0 0 0 3px var(--c-bg-card), 0 0 0 5px var(--node-color), 0 0 10px var(--node-color); }
  50% { box-shadow: 0 0 0 3px var(--c-bg-card), 0 0 0 7px var(--node-color), 0 0 22px var(--node-color); }
}

.lane-node:hover .node-dot {
  transform: scale(1.2);
}

@media (prefers-reduced-motion: reduce) {
  .lane-node.today .node-dot {
    animation: none;
    box-shadow: 0 0 0 3px var(--c-bg-card), 0 0 0 6px var(--node-color);
  }
  .lane-node:hover .node-dot {
    transform: none;
  }
}

/* 图例 */
.hw-legend {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-2);
  padding-left: 112px;
}

.lg-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.lg-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.lg-dot.solid {
  background: var(--c-text-tertiary);
  opacity: 0.55;
}

.lg-dot.today {
  background: var(--c-accent);
  box-shadow: 0 0 6px var(--c-accent);
}

.lg-dot.hollow {
  background: transparent;
  border: 2px solid var(--c-text-quaternary);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .semester-highway {
    padding: var(--space-4) var(--space-4) var(--space-3);
  }

  .hw-inner {
    min-width: 560px;
  }

  .lane-label {
    width: 84px;
    font-size: 11px;
  }

  .lane-name {
    max-width: 76px;
  }

  .node-dot {
    width: 14px;
    height: 14px;
  }

  .hw-legend {
    padding-left: 90px;
    gap: var(--space-3);
  }
}
</style>
