<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  slogan: { type: String, default: '' },
  icon: { type: String, default: '' }
})

const currentLang = ref('zh')
onMounted(() => {
  const path = window.location.pathname
  if (path.startsWith('/en/')) currentLang.value = 'en'
  else if (path.startsWith('/th/')) currentLang.value = 'th'
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
  margin-bottom: 36px;
}

.page-header-inner {
  text-align: center;
  padding: 40px 24px 32px;
}

.page-header-icon {
  font-size: 40px;
  margin-bottom: 16px;
  line-height: 1;
}

.page-header-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.2;
  margin: 0 0 12px 0;
  color: var(--c-text-primary);
}

.page-header-desc {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.7;
  color: var(--c-text-secondary);
  margin: 0 auto 20px auto;
  max-width: 560px;
}

.page-header-slogan {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
  background: var(--c-accent-light);
  border-radius: 20px;
  border: 0.5px solid var(--c-border-accent);
}

.slogan-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-accent);
  letter-spacing: 0.2px;
}

.page-header-divider {
  height: 1px;
  background: var(--c-separator);
  max-width: 60px;
  margin: 0 auto;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header-inner {
    padding: 28px 16px 24px;
  }
  
  .page-header-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  .page-header-title {
    font-size: 24px;
  }
  
  .page-header-desc {
    font-size: 14px;
    max-width: 100%;
  }
}
</style>
