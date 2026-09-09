<script setup>
const features = [
  {
    icon: '📅',
    title: '课表查询',
    description: '实时同步的课程安排，包含上课时间、教室、教师信息，支持日历订阅，永不缺席。',
    link: '/schedule',
    color: 'gold',
    delay: 1,
  },
  {
    icon: '📢',
    title: '公告通知',
    description: '班级重要通知、学校公告、作业截止日期，一目了然，重要信息不再错过。',
    link: '/announcements/',
    color: 'mint',
    delay: 2,
  },
  {
    icon: '📚',
    title: '知识沉淀',
    description: '课程笔记、重点总结、考题参考、学习资源汇总，智库研究员共同维护，持续更新。',
    link: '/knowledge/',
    color: 'gold',
    delay: 3,
  },
  {
    icon: '📥',
    title: '课件下载',
    description: '按课程分类的课件PDF下载，随时复习，云端存储，手机电脑随时访问。',
    link: '/slides/',
    color: 'mint',
    delay: 4,
  },
]
</script>

<template>
  <section class="features section">
    <div class="container">
      <!-- 标题 -->
      <div class="section-title reveal">
        <span class="label">核心功能</span>
        <h2>一站式学习平台</h2>
        <p>从课表到课件，从公告到知识，所有学习需求一站满足</p>
      </div>

      <!-- 卡片网格 -->
      <div class="features-grid">
        <a
          v-for="feature in features"
          :key="feature.title"
          :href="feature.link"
          class="feature-card card-3d reveal"
          :class="[`feature-${feature.color}`, `reveal-delay-${feature.delay}`]"
        >
          <!-- 卡片光晕 -->
          <div class="card-glow"></div>

          <!-- 图标 -->
          <div class="feature-icon">
            <span class="icon-emoji">{{ feature.icon }}</span>
            <div class="icon-ring"></div>
          </div>

          <!-- 内容 -->
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.description }}</p>

          <!-- 底部箭头 -->
          <div class="feature-arrow">
            <span>了解更多</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  background: var(--c-bg-secondary);
  position: relative;
}

.features::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-border-accent), transparent);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2xl);
  max-width: 1000px;
  margin: 0 auto;
}

.feature-card {
  position: relative;
  display: block;
  padding: var(--space-2xl);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-2xl);
  text-decoration: none;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.card-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0;
  transition: opacity var(--transition-slow);
}

.feature-gold .card-glow {
  background: var(--c-accent);
}

.feature-mint .card-glow {
  background: var(--c-mint);
}

.feature-card:hover .card-glow {
  opacity: 0.15;
}

.feature-icon {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-emoji {
  font-size: 2rem;
  position: relative;
  z-index: 1;
}

.icon-ring {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-xl);
  border: 1px solid var(--c-border);
  transition: all var(--transition-base);
}

.feature-gold .icon-ring {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), transparent);
}

.feature-mint .icon-ring {
  background: linear-gradient(135deg, rgba(79, 209, 197, 0.1), transparent);
}

.feature-card:hover .icon-ring {
  transform: rotate(45deg) scale(1.1);
  border-color: var(--c-border-accent);
}

.feature-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--c-text-primary);
  margin-bottom: var(--space-md);
  transition: color var(--transition-fast);
}

.feature-card:hover .feature-title {
  color: var(--c-accent-light);
}

.feature-desc {
  font-size: var(--text-base);
  color: var(--c-text-tertiary);
  line-height: 1.8;
  margin-bottom: var(--space-xl);
}

.feature-arrow {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--c-text-tertiary);
  transition: all var(--transition-fast);
}

.feature-gold .feature-arrow {
  color: var(--c-accent);
}

.feature-mint .feature-arrow {
  color: var(--c-mint);
}

.feature-card:hover .feature-arrow {
  gap: var(--space-md);
}

.feature-arrow svg {
  transition: transform var(--transition-fast);
}

.feature-card:hover .feature-arrow svg {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }

  .feature-card {
    padding: var(--space-xl);
  }
}
</style>
