<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLang } from '../composables/useLang.js'

/* ========== i18n ========== */
const i18n = {
  zh: {
    highwayTitle: '学期进度',
    highwaySub: '每门课的上课节点，已过的路灯已熄灭',
    of: '共',
    done: '已上',
    teacher: '老师',
  },
  en: {
    highwayTitle: 'Semester Highway',
    highwaySub: 'Each light is a class session — past lights are dimmed',
    of: 'of',
    done: 'done',
    teacher: 'Prof.',
  },
  th: {
    highwayTitle: 'เส้นทางตลอดเทอม',
    highwaySub: 'แต่ละไฟคือคาบเรียน คาบที่ผ่านไปแล้วจะหรี่ลง',
    of: 'จาก',
    done: 'เรียนแล้ว',
    teacher: 'อาจารย์',
  },
}
const { lang, t } = useLang(i18n)

/* ========== Props ========== */
const props = defineProps({
  // schedule.json 的 courses[]
  courses: { type: Array, default: () => [] },
  // 完整 scheduleData，用于取节点 location
  data: { type: Object, default: null },
})

/* ========== 实时时钟（每分钟刷新） ========== */
const now = ref(new Date())
let timer = null
onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 60 * 1000) })
onUnmounted(() => clearInterval(timer))

/* 节点详情展开状态：Map<"courseIndex-sessionIndex", true> */
const expanded = ref(new Set())
const toggleNode = (key) => {
  if (expanded.value.has(key)) expanded.value.delete(key)
  else expanded.value.add(key)
}
const isOpen = (key) => expanded.value.has(key)

/* 合并后的车道模型 */
const lanes = computed(() => {
  return props.courses.map((course, cIdx) => {
    const sessions = (course.sessions || []).map((s, sIdx) => {
      const start = new Date(`${s.date}T${s.time_start}:00`)
      const end = new Date(`${s.date}T${s.time_end}:00`)
      return {
        ...s,
        start, end,
        key: `${cIdx}-${sIdx}`,
        isPast: end < now.value,
        // 最近一个未结束的节点
        isNext: start <= now.value && now.value <= end,
      }
    })
    const doneCount = sessions.filter(s => s.isPast).length
    // 脉动节点：第一个未结束的节点
    const nextIdx = sessions.findIndex(s => !s.isPast)
    sessions.forEach((s, i) => { s.isPulsing = i === nextIdx })
    return {
      name: course.name,
      teacher: course.teacher,
      location: course.location,
      colorClass: `course-${cIdx}`,
      sessions,
      doneCount,
      total: sessions.length,
      percent: sessions.length ? Math.round((doneCount / sessions.length) * 100) : 0,
    }
  })
})

/* 节点 tooltip/详情日期格式化 */
const fmtNodeDate = (d) => {
  const locale = lang.value === 'th' ? 'th-TH-u-ca-buddhist' : lang.value === 'en' ? 'en-US' : 'zh-CN'
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', weekday: 'short' }).format(d)
}
</script>

<template>
  <div class="highway" v-if="lanes.length">
    <div class="highway-head">
      <h3>{{ t.highwayTitle }}</h3>
      <p>{{ t.highwaySub }}</p>
    </div>

    <div v-for="(lane, cIdx) in lanes" :key="lane.name" class="lane" :class="lane.colorClass">
      <!-- 车道头：课程名+老师 / 进度 -->
      <div class="lane-head">
        <div class="lane-title">
          <span class="lane-dot" aria-hidden="true"></span>
          <div class="lane-title-text">
            <span class="lane-name">{{ lane.name }}</span>
            <span class="lane-teacher">{{ t.teacher }} {{ lane.teacher }}</span>
          </div>
        </div>
        <div class="lane-progress">
          <span class="lane-count">{{ lane.doneCount }}/{{ lane.total }}</span>
          <div class="progress-track"><div class="progress-fill" :style="{ width: lane.percent + '%' }"></div></div>
          <span class="lane-percent">{{ lane.percent }}%</span>
        </div>
      </div>

      <!-- 车道轨道：节点横向排列 -->
      <div class="lane-track">
        <div
          v-for="(s, sIdx) in lane.sessions"
          :key="s.key"
          class="node-wrap"
        >
          <button
            class="node"
            :class="{ past: s.isPast, next: s.isNext, pulsing: s.isPulsing, open: isOpen(s.key) }"
            :title="`${fmtNodeDate(s.start)} ${s.time_start}-${s.time_end}`"
            @click="toggleNode(s.key)"
          >
            <span class="node-dot"></span>
            <span class="node-label">{{ s.start.getDate() }}</span>
          </button>

          <!-- 展开详情 -->
          <transition name="node-detail">
            <div v-if="isOpen(s.key)" class="node-detail">
              <strong>{{ fmtNodeDate(s.start) }}</strong>
              <span class="node-detail-time">{{ s.time_start }} – {{ s.time_end }}</span>
              <span class="node-detail-loc">{{ lane.location }}</span>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.highway {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-8);
}

.highway-head {
  margin-bottom: var(--space-5);
}
.highway-head h3 {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 2px;
}
.highway-head p {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
  margin: 0;
}

/* ========== 单条车道 ========== */
.lane {
  padding: var(--space-4) 0;
  border-top: 1px solid var(--c-border-light);
}
.lane:first-of-type { border-top: none; padding-top: 0; }

.lane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.lane-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}
.lane-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--course-text, var(--c-accent));
  flex-shrink: 0;
}
.lane-title-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.lane-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--c-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lane-teacher {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.lane-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}
.lane-count {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.progress-track {
  width: 72px;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--c-bg-secondary);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--course-text, var(--c-accent));
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}
.lane-percent {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--c-text-secondary);
  font-variant-numeric: tabular-nums;
  width: 3em;
  text-align: right;
}

/* ========== 车道轨道 ========== */
.lane-track {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0;
  overflow-x: auto;
  padding: var(--space-2) 0 var(--space-3);
}
/* 虚线连接线：贯穿轨道 */
.lane-track::before {
  content: '';
  position: absolute;
  top: 14px;
  left: 8px;
  right: 8px;
  border-top: 2px dashed var(--c-border);
}

.node-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1 0 auto;
  min-width: 44px;
  z-index: 1;
}

.node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}
.node-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--course-text, var(--c-accent));
  border: 2px solid var(--c-bg-card);
  box-shadow: 0 0 0 1px var(--course-text, var(--c-accent));
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}
.node-label {
  font-size: 10px;
  color: var(--c-text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* 已过去的节点变暗 */
.node.past .node-dot { opacity: 0.3; }
.node.past .node-label { opacity: 0.5; }

/* 当前进行中的节点 */
.node.next .node-dot {
  background: var(--c-accent);
  box-shadow: 0 0 0 3px var(--c-accent-light);
}

/* 最近的未来节点脉动 */
.node.pulsing .node-dot {
  animation: nodePulse 2s ease-in-out infinite;
}
@keyframes nodePulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--c-accent-glow); }
  50%      { box-shadow: 0 0 0 8px transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .node.pulsing .node-dot { animation: none; }
}

.node:hover .node-dot { transform: scale(1.25); }
.node.open .node-dot {
  box-shadow: 0 0 0 3px var(--c-accent-light), 0 0 0 1px var(--c-accent);
}

/* 节点详情展开 */
.node-detail {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border-light);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}
.node-detail strong {
  font-size: var(--text-xs);
  color: var(--c-text-primary);
}
.node-detail-time {
  font-size: var(--text-xs);
  color: var(--c-text-secondary);
  font-family: var(--font-mono);
}
.node-detail-loc {
  font-size: 10px;
  color: var(--c-text-tertiary);
}
.node-detail-enter-active, .node-detail-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.node-detail-enter-from, .node-detail-leave-to {
  opacity: 0; transform: translateY(-4px);
}

/* ========== 课程色板（与 NextUpPill / ScheduleView 一致） ========== */
.course-0 { --course-text: #8b9cf0; }
.course-1 { --course-text: #3d9a85; }
.course-2 { --course-text: #d4a017; }
:global(html.dark) .course-0 { --course-text: #aab4f5; }
:global(html.dark) .course-1 { --course-text: #5ec4ac; }
:global(html.dark) .course-2 { --course-text: #e8b93b; }

/* ========== 移动端 ========== */
@media (max-width: 640px) {
  .highway { padding: var(--space-4); }
  .lane-head { flex-wrap: wrap; }
  .lane-progress { width: 100%; justify-content: flex-start; }
  .progress-track { flex: 1; width: auto; }
}
</style>
