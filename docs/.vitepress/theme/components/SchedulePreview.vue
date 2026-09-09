<script setup>
import { ref, onMounted, computed } from 'vue'

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
  if (!scheduleData.value) return []
  const now = new Date()
  const allClasses = []

  scheduleData.value.schedule.forEach(day => {
    day.courses.forEach(course => {
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

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${day}日 ${weekdays[date.getDay()]}`
}

// 计算距离今天的天数
const daysUntil = (dateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  return `${diff}天后`
}
</script>

<template>
  <section class="schedule-preview section">
    <div class="container">
      <!-- 标题 -->
      <div class="section-title reveal">
        <span class="label">课程安排</span>
        <h2>即将开始的课程</h2>
        <p>实时同步校历，不错过每一节课</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载课表中...</p>
      </div>

      <!-- 课程卡片 -->
      <div v-else class="schedule-cards">
        <div
          v-for="(course, index) in upcomingClasses"
          :key="index"
          class="schedule-card reveal"
          :class="`reveal-delay-${index + 1}`"
        >
          <!-- 日期标签 -->
          <div class="date-badge">
            <div class="date-day">{{ new Date(course.date).getDate() }}</div>
            <div class="date-month">{{ new Date(course.date).getMonth() + 1 }}月</div>
          </div>

          <!-- 课程信息 -->
          <div class="course-info">
            <div class="course-meta">
              <span class="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                {{ course.time_start }} - {{ course.time_end }}
              </span>
              <span class="meta-item location">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {{ course.location }}
              </span>
            </div>
            <h3 class="course-name">{{ course.course }}</h3>
            <p class="course-teacher">主讲：{{ course.teacher }}</p>
          </div>

          <!-- 倒计时 -->
          <div class="countdown">
            <span class="countdown-text">{{ daysUntil(course.date) }}</span>
          </div>
        </div>
      </div>

      <!-- 查看全部按钮 -->
      <div class="view-all reveal reveal-delay-4">
        <a href="/schedule" class="btn btn-secondary">
          查看完整课表
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
  position: relative;
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

.schedule-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 800px;
  margin: 0 auto;
}

.schedule-card {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-xl) var(--space-2xl);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.schedule-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--c-accent-gradient);
  transform: scaleY(0);
  transition: transform var(--transition-base);
}

.schedule-card:hover {
  border-color: var(--c-border-accent);
  transform: translateX(8px);
  box-shadow: var(--shadow-gold);
}

.schedule-card:hover::before {
  transform: scaleY(1);
}

.date-badge {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  background: var(--c-bg-tertiary);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.date-day {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--c-accent);
  line-height: 1;
}

.date-month {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  margin-top: 2px;
}

.course-info {
  flex: 1;
  min-width: 0;
}

.course-meta {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-sm);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.meta-item.location {
  color: var(--c-mint);
}

.course-name {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--c-text-primary);
  margin-bottom: 2px;
}

.course-teacher {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
}

.countdown {
  flex-shrink: 0;
  text-align: right;
}

.countdown-text {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid var(--c-border-accent);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--c-accent);
}

.view-all {
  text-align: center;
  margin-top: var(--space-3xl);
}

@media (max-width: 640px) {
  .schedule-card {
    flex-wrap: wrap;
    padding: var(--space-lg);
  }

  .countdown {
    width: 100%;
    text-align: left;
  }
}
</style>
