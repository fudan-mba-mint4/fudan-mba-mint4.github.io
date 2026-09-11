<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  slogan: { type: String, default: '' },
  icon: { type: String, default: '' }
})
</script>

<template>
  <div class="page-header-section">
    <div class="page-header-inner">
      <!-- 图标 -->
      <div v-if="icon" class="page-header-icon">{{ icon }}</div>
      
      <!-- 标题 -->
      <h1 class="page-header-title">{{ title }}</h1>
      
      <!-- 描述 -->
      <p v-if="description" class="page-header-desc">{{ description }}</p>
      
      <!-- 口号 -->
      <div v-if="slogan" class="page-header-slogan">
        <span class="slogan-text">{{ slogan }}</span>
      </div>
    </div>
    
    <!-- 底部分割线 -->
    <div class="page-header-divider"></div>
  </div>
</template>

<style scoped>
.page-header-section {
  margin-bottom: 20px;
}

.page-header-inner {
  text-align: center;
  padding: 24px 24px 16px;
}

.page-header-icon {
  font-size: 28px;
  margin-bottom: 10px;
  line-height: 1;
}

.page-header-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1.25;
  margin: 0 0 8px 0;
  color: var(--c-text-primary);
}

.page-header-desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.65;
  color: var(--c-text-secondary);
  margin: 0 auto 14px auto;
  max-width: 560px;
}

.page-header-slogan {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: var(--c-accent-light);
  border-radius: 16px;
  border: 0.5px solid var(--c-border-accent);
}

.slogan-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-accent);
  letter-spacing: 0.2px;
}

.page-header-divider {
  display: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header-inner {
    padding: 18px 16px 14px;
  }
  
  .page-header-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  .page-header-title {
    font-size: 22px;
  }
  
  .page-header-desc {
    font-size: 13px;
    max-width: 100%;
    margin-bottom: 12px;
  }
}
</style>
