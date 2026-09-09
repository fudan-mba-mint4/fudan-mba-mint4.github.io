<script setup>
import { ref, onMounted } from 'vue'

const stats = ref([
  { value: 3, suffix: '', label: '核心课程' },
  { value: 21, suffix: '', label: '本学期课时' },
  { value: 100, suffix: '%', label: '同学覆盖' },
  { value: 24, suffix: '/7', label: '全天在线' },
])

const animatedValues = ref(stats.value.map(() => 0))
const hasAnimated = ref(false)

onMounted(() => {
  // 延迟启动数字动画
  setTimeout(() => {
    animateNumbers()
  }, 800)
})

const animateNumbers = () => {
  if (hasAnimated.value) return
  hasAnimated.value = true

  stats.value.forEach((stat, index) => {
    const duration = 2000
    const startTime = performance.now()
    const target = stat.value

    const update = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // 缓动函数
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
    <!-- 动态背景 -->
    <div class="hero-bg">
      <div class="orb orb-1" style="top: -10%; left: -5%;"></div>
      <div class="orb orb-2" style="bottom: -15%; right: -10%;"></div>
      <div class="orb orb-3" style="top: 30%; right: 20%;"></div>
      <div class="grid-bg"></div>
    </div>

    <div class="hero-content">
      <!-- 顶部徽章 -->
      <div class="hero-badge reveal">
        <span class="badge-dot"></span>
        <span>复旦大学 MBA 2024级 · 薄荷4班</span>
      </div>

      <!-- 主标题 -->
      <h1 class="hero-title reveal reveal-delay-1">
        <span class="title-line">薄荷4班</span>
        <span class="title-gradient">数字家园</span>
      </h1>

      <!-- 副标题 -->
      <p class="hero-subtitle reveal reveal-delay-2">
        课表查询 · 公告通知 · 知识沉淀 · 资源共享
        <br />
        <span class="subtitle-accent">为每一位同学打造高效便捷的学习平台</span>
      </p>

      <!-- 按钮组 -->
      <div class="hero-actions reveal reveal-delay-3">
        <a href="/schedule" class="btn btn-primary">
          <span>查看本周课表</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
        <a href="/announcements/" class="btn btn-secondary">
          最新公告
        </a>
      </div>

      <!-- 数据统计 -->
      <div class="hero-stats reveal reveal-delay-4">
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
      <span>向下滚动探索</span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--space-4xl) var(--space-xl);
  margin-top: calc(-1 * var(--nav-height));
  padding-top: var(--nav-height);
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: var(--c-hero-gradient);
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 900px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-lg);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border-accent);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
  margin-bottom: var(--space-2xl);
  backdrop-filter: blur(10px);
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c-mint);
  box-shadow: 0 0 10px var(--c-mint-glow);
  animation: pulse 2s ease-in-out infinite;
}

.hero-title {
  font-size: clamp(2.5rem, 8vw, 5.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: var(--space-xl);
}

.title-line {
  display: block;
  color: var(--c-text-primary);
}

.title-gradient {
  display: block;
  background: var(--c-accent-gradient);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--c-text-secondary);
  line-height: 1.8;
  margin-bottom: var(--space-3xl);
}

.subtitle-accent {
  color: var(--c-accent-light);
  font-weight: 500;
}

.hero-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  margin-bottom: var(--space-4xl);
  flex-wrap: wrap;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-xl);
  max-width: 700px;
  margin: 0 auto;
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--c-border);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--c-text-primary);
  margin-bottom: var(--space-xs);
  font-family: var(--font-mono);
}

.stat-suffix {
  font-size: var(--text-lg);
  color: var(--c-accent);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
}

.scroll-indicator {
  position: absolute;
  bottom: var(--space-2xl);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--c-text-tertiary);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  animation: bounceSubtle 2s ease-in-out infinite;
}

.scroll-mouse {
  width: 24px;
  height: 38px;
  border: 2px solid var(--c-border-accent);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.scroll-wheel {
  width: 3px;
  height: 8px;
  background: var(--c-accent);
  border-radius: 2px;
  animation: scrollWheel 1.5s ease-in-out infinite;
}

@keyframes scrollWheel {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(8px); opacity: 0.3; }
}

@media (max-width: 768px) {
  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-lg);
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .hero-subtitle {
    font-size: var(--text-lg);
  }
}
</style>
