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
    <div class="page-header-row">
      <!-- 图标 -->
      <span v-if="icon" class="page-header-icon">{{ icon }}</span>
      
      <!-- 标题 -->
      <h1 class="page-header-title">{{ title }}</h1>
      
      <!-- 口号（与标题同行） -->
      <span v-if="slogan" class="page-header-slogan">{{ slogan }}</span>
    </div>
    
    <!-- 描述 -->
    <p v-if="description" class="page-header-desc">{{ description }}</p>
  </div>
</template>

<style scoped>
.page-header-section {
  margin: 0 0 44px;
  text-align: center;
}

.page-header-row {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  padding-top: 24px;
}

.page-header-icon {
  font-size: 28px;
  line-height: 1;
}

.page-header-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1.3;
  margin: 0;
  color: var(--c-text-primary, #1d1d1f);
}

.page-header-slogan {
  font-size: 13px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 15px;
  background: var(--c-accent-light, rgba(45,122,108,.12));
  border: 0.5px solid var(--c-border-accent, rgba(45,122,108,.35));
  color: var(--c-accent, #2D7A6C);
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.page-header-desc {
  margin: 12px auto 0;
  font-size: 14px;
  line-height: 1.65;
  color: var(--c-text-secondary, #6e6e73);
  max-width: 560px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header-section {
    margin-bottom: 30px;
  }
  
  .page-header-row {
    gap: 10px;
    padding-top: 22px;
  }
  
  .page-header-title {
    font-size: 24px;
  }
  
  .page-header-desc {
    margin-top: 12px;
    font-size: 13.5px;
  }
}
</style>
