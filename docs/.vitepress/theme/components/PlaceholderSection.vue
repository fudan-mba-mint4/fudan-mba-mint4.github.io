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
        <span>{{ icon }}</span>
      </div>

      <!-- 标题 -->
      <h1 class="placeholder-title">{{ title }}</h1>
      <p class="placeholder-desc">{{ description }}</p>

      <!-- 功能预告 -->
      <div v-if="features.length > 0" class="feature-preview">
        <div class="preview-tags">
          <span v-for="feature in features" :key="feature" class="preview-tag">
            {{ feature }}
          </span>
        </div>
      </div>

      <!-- 底部 -->
      <div class="placeholder-footer">
        <p>薄荷4班 · 智库研究员共同维护</p>
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
  padding: var(--space-16) var(--space-6);
}

.placeholder-content {
  text-align: center;
  max-width: 480px;
}

.placeholder-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto var(--space-8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  background: var(--c-bg-secondary);
  border-radius: var(--radius-xl);
}

.placeholder-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--c-text-primary);
  margin-bottom: var(--space-3);
  letter-spacing: var(--letter-spacing-tight);
}

.placeholder-desc {
  font-size: var(--text-base);
  color: var(--c-text-tertiary);
  margin-bottom: var(--space-10);
  line-height: var(--line-height-relaxed);
}

.feature-preview {
  margin-bottom: var(--space-10);
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
}

.preview-tag {
  padding: var(--space-1) var(--space-3);
  background: var(--c-bg-secondary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--c-text-secondary);
}

.placeholder-footer {
  padding-top: var(--space-8);
  border-top: 0.5px solid var(--c-separator);
}

.placeholder-footer p {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  margin: 0;
}
</style>
