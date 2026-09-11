<script setup>
import { ref, onMounted } from 'vue'

// 班级核心数据
const stats = ref([
  { value: 3, suffix: '', label: '核心课程' },
  { value: 21, suffix: '', label: '本学期课时' },
  { value: 60, suffix: '+', label: '班级同学' },
  { value: 24, suffix: '/7', label: '全天在线' },
])

const animatedValues = ref(stats.value.map(() => 0))
const hasAnimated = ref(false)

onMounted(() => {
  setTimeout(() => {
    animateNumbers()
  }, 600)
})

const animateNumbers = () => {
  if (hasAnimated.value) return
  hasAnimated.value = true

  stats.value.forEach((stat, index) => {
    const duration = 1800
    const startTime = performance.now()
    const target = stat.value

    const update = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      animatedValues.value[index] = Math.floor(target * easeOut)

      if (progress < 1) {
        requestAnimationFrame(update)
      } else {
        animatedValues.value[index] = target
      }
    }

    requestAnimationFrame(update)
  })
}
</script>

<template>
  <section class="hero">
    <div class="hero-content">
      <!-- 班级标识 -->
      <div class="hero-badge reveal">
        <span class="badge-dot"></span>
        <span>复旦大学 MBA 2026级 · 薄荷4班</span>
      </div>

      <!-- 主标题 -->
      <h1 class="hero-title reveal reveal-delay-1">
        <span class="title-line">薄荷4班</span>
        <span class="title-line accent">数字家园</span>
      </h1>

      <!-- 班级口号 -->
      <p class="hero-slogan reveal reveal-delay-2">
        4 the Best, for the Future.
      </p>

      <!-- 副标题 -->
      <p class="hero-subtitle reveal reveal-delay-3">
        课表查询 · 公告通知 · 知识沉淀 · 资源共享
        <br />
        为每一位同学打造高效便捷的学习平台
      </p>

      <!-- 按钮组 -->
      <div class="hero-actions reveal reveal-delay-4">
        <a href="/schedule" class="btn btn-primary">
          查看课表
        </a>
        <a href="/announcements/" class="btn btn-secondary">
          最新公告
        </a>
      </div>

      <!-- 数据统计 -->
      <div class="hero-stats reveal reveal-delay-5">
        <div class="stat-item" v-for="(stat, index) in stats" :key="index">
          <div class="stat-value">
            {{ animatedValues[index] }}<span class="stat-suffix">{{ stat.suffix }}</span>
          </div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- 向下滚动提示 -->
    <div class="scroll-indicator">
      <div class="scroll-mouse">
        <div class="scroll-wheel"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--space-20) var(--space-6);
  padding-top: calc(var(--nav-height) + var(--space-20));
  background: transparent;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 720px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-4);
  background: var(--c-bg-secondary);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
  margin-bottom: var(--space-8);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-accent);
}

.hero-title {
  font-size: clamp(40px, 8vw, 68px);
  font-weight: var(--font-bold);
  line-height: 1.08;
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: var(--space-6);
}

.title-line {
  display: block;
  color: var(--c-text-primary);
}

.title-line.accent {
  color: var(--c-accent);
}

.hero-slogan {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  color: var(--c-text-secondary);
  margin-bottom: var(--space-4);
  font-style: italic;
  letter-spacing: var(--letter-spacing-tight);
}

.hero-subtitle {
  font-size: var(--text-base);
  color: var(--c-text-tertiary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-10);
}

.hero-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  margin-bottom: var(--space-16);
  flex-wrap: wrap;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-6);
  max-width: 560px;
  margin: 0 auto;
  padding-top: var(--space-8);
  border-top: 0.5px solid var(--c-separator);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--c-text-primary);
  margin-bottom: var(--space-1);
  letter-spacing: var(--letter-spacing-tight);
}

.stat-suffix {
  font-size: var(--text-lg);
  color: var(--c-accent);
  font-weight: var(--font-medium);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.scroll-indicator {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.4;
  animation: bounceSubtle 2.5s ease-in-out infinite;
}

.scroll-mouse {
  width: 22px;
  height: 34px;
  border: 1.5px solid var(--c-text-tertiary);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  padding-top: 5px;
}

.scroll-wheel {
  width: 2px;
  height: 6px;
  background: var(--c-text-tertiary);
  border-radius: 2px;
  animation: scrollWheel 1.8s ease-in-out infinite;
}

@keyframes scrollWheel {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(6px); opacity: 0.3; }
}

@media (max-width: 640px) {
  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .hero {
    min-height: 88vh;
  }
}
</style>
