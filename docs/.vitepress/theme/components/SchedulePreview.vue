<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLang } from '../composables/useLang.js'

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    eyebrow: '课程安排',
    title: '即将开始的课程',
    subtitle: '实时同步校历，不错过每一节课',
    loading: '加载课表中...',
    viewAll: '查看完整课表',
    today: '今天',
    tomorrow: '明天',
    daysLater: '天后',
    empty: '本学期暂未安排课程',
  },
  en: {
    eyebrow: 'Schedule',
    title: 'Upcoming Classes',
    subtitle: 'Synced with the academic calendar, never miss a class',
    loading: 'Loading schedule...',
    viewAll: 'Full Schedule',
    today: 'Today',
    tomorrow: 'Tomorrow',
    daysLater: 'days left',
    empty: 'No upcoming classes this semester',
  },
  th: {
    eyebrow: 'ตารางเรียน',
    title: 'คาบเรียนที่กำลังจะมา',
    subtitle: 'ซิงค์กับปฏิทินการศึกษา ไม่พลาดทุกคาบ',
    loading: 'กำลังโหลดตารางเรียน...',
    viewAll: 'ดูตารางเรียนทั้งหมด',
    today: 'วันนี้',
    tomorrow: 'พรุ่งนี้',
    daysLater: 'วัน',
    empty: 'ไม่มีคาบเรียนในเทอมนี้',
  },
}
const { lang, t } = useLang(i18n)
const langPrefix = lang.value === 'en' ? '/en' : lang.value === 'th' ? '/th' : ''

const scheduleData = ref(null)
const loading = ref(true)

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

// 获取接下来的3节课
const upcomingClasses = computed(() => {
  if (!scheduleData.value || !scheduleData.value.schedule) return []
  const now = new Date()
  const allClasses = []

  ;(scheduleData.value.schedule || []).forEach(day => {
    ;(day.courses || []).forEach(course => {
      const classDate = new Date(`${course.date}T${course.time_start}:00`)
      if (classDate > now) {
        allClasses.push({
          ...course,
          weekday: day.weekday,
          datetime: classDate,
        })
      }
    })
  })

  return allClasses.sort((a, b) => a.datetime - b.datetime).slice(0, 3)
})

// 计算距离今天的天数
const daysUntil = (dateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return t.value.today
  if (diff === 1) return t.value.tomorrow
  return `${diff} ${t.value.daysLater}`
}
</script>

<template>
  <section class="schedule-preview section">
    <div class="container">
      <!-- 区块标题 -->
      <div class="section-header center reveal">
        <span class="eyebrow">{{ t.eyebrow }}</span>
        <h2>{{ t.title }}</h2>
        <p>{{ t.subtitle }}</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <p>{{ t.loading }}</p>
      </div>

      <!-- 课程列表（苹果风格分组列表） -->
      <div v-else-if="upcomingClasses.length" class="schedule-list reveal reveal-delay-1">
        <div
          v-for="(course, index) in upcomingClasses"
          :key="index"
          class="schedule-item"
        >
          <!-- 日期 -->
          <div class="item-date">
            <span class="date-day">{{ new Date(course.date + 'T00:00:00').getDate() }}</span>
            <span class="date-month">{{ new Date(course.date + 'T00:00:00').getMonth() + 1 }}</span>
          </div>

          <!-- 课程信息 -->
          <div class="item-info">
            <h3 class="course-name">{{ course.course }}</h3>
            <div class="course-meta">
              <span class="meta-item">{{ course.time_start }} - {{ course.time_end }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-item">{{ course.teacher }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-item">{{ course.location }}</span>
            </div>
          </div>

          <!-- 倒计时 -->
          <div class="item-countdown">
            <span class="countdown-badge">{{ daysUntil(course.date) }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="schedule-empty reveal reveal-delay-1">
        <p>{{ t.empty }}</p>
      </div>

      <!-- 查看全部 -->
      <div class="view-all reveal reveal-delay-2">
        <a :href="`${langPrefix}/schedule`" class="btn btn-ghost">
          {{ t.viewAll }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.schedule-preview {
  background: var(--c-bg-primary);
}

.loading {
  text-align: center;
  padding: var(--space-12);
  color: var(--c-text-tertiary);
  font-size: var(--text-sm);
}

.schedule-empty {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  padding: var(--space-12);
  color: var(--c-text-tertiary);
  font-size: var(--text-sm);
  background: var(--c-bg-card);
  border: 0.5px dashed var(--c-border);
  border-radius: var(--radius-xl);
}

.schedule-list {
  max-width: 640px;
  margin: 0 auto;
  background: var(--c-bg-card);
  border-radius: var(--radius-xl);
  border: 0.5px solid var(--c-separator);
  overflow: hidden;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-bottom: 0.5px solid var(--c-border-light);
  transition: background var(--transition-fast);
}

.schedule-item:last-child {
  border-bottom: none;
}

.schedule-item:hover {
  background: var(--c-bg-secondary);
}

.item-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--c-bg-secondary);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.date-day {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--c-text-primary);
  line-height: 1;
}

.date-month {
  font-size: 10px;
  color: var(--c-text-tertiary);
  margin-top: 2px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.course-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  margin-bottom: 2px;
}

.course-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.meta-item {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.meta-dot {
  color: var(--c-text-quaternary);
  font-size: var(--text-xs);
}

.item-countdown {
  flex-shrink: 0;
}

.countdown-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: var(--c-accent-light);
  color: var(--c-accent);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
}

.view-all {
  text-align: center;
  margin-top: var(--space-8);
}

@media (max-width: 640px) {
  .schedule-item {
    flex-wrap: wrap;
  }

  .item-countdown {
    width: 100%;
    padding-left: 60px;
  }
}
</style>
