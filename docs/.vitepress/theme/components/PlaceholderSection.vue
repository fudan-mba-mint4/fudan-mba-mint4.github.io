<script setup>
defineProps({
  icon: {
    type: String,
    default: '🚧'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: '该功能正在紧张开发中，敬请期待'
  },
  features: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="placeholder-page">
    <div class="placeholder-content reveal">
      <!-- 图标 -->
      <div class="placeholder-icon">
        <span class="icon-emoji">{{ icon }}</span>
        <div class="icon-ring"></div>
        <div class="icon-pulse"></div>
      </div>

      <!-- 标题 -->
      <h1 class="placeholder-title">{{ title }}</h1>
      <p class="placeholder-desc">{{ description }}</p>

      <!-- 功能预告 -->
      <div v-if="features.length > 0" class="feature-preview">
        <h3 class="preview-label">即将上线</h3>
        <div class="preview-tags">
          <span v-for="feature in features" :key="feature" class="preview-tag">
            {{ feature }}
          </span>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="placeholder-footer">
        <div class="footer-line"></div>
        <p class="footer-text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          由薄荷4班智库研究员共同维护
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.placeholder-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) var(--space-xl);
  position: relative;
}

.placeholder-content {
  text-align: center;
  max-width: 600px;
}

.placeholder-icon {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto var(--space-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-emoji {
  font-size: 3rem;
  position: relative;
  z-index: 2;
}

.icon-ring {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--c-border-accent);
  background: var(--c-bg-card);
  animation: rotateSlow 20s linear infinite;
}

.icon-pulse {
  position: absolute;
  inset: -10px;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--c-border);
  animation: pulseGlow 3s ease-in-out infinite;
}

.placeholder-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--c-text-primary);
  margin-bottom: var(--space-md);
  background: var(--c-accent-gradient);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}

.placeholder-desc {
  font-size: var(--text-lg);
  color: var(--c-text-tertiary);
  margin-bottom: var(--space-3xl);
  line-height: 1.8;
}

.feature-preview {
  margin-bottom: var(--space-3xl);
}

.preview-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--c-accent);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-lg);
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-sm);
}

.preview-tag {
  padding: var(--space-xs) var(--space-md);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
  transition: all var(--transition-fast);
}

.preview-tag:hover {
  border-color: var(--c-border-accent);
  color: var(--c-accent-light);
  transform: translateY(-2px);
}

.placeholder-footer {
  margin-top: var(--space-3xl);
}

.footer-line {
  width: 60px;
  height: 1px;
  background: var(--c-border-accent);
  margin: 0 auto var(--space-lg);
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}
</style>
