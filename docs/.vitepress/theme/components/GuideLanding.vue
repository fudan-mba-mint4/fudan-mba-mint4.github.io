<script setup>
/**
 * GuideLanding · 指南中心首页布局壳（蓝图 §4.1 网格容器）
 * 首页无 GuideDocShell 三栏；本组件提供 .guide-landing 与 12 列 .guide-grid，
 * 避免在 markdown 顶层裸写 HTML 容器导致后续组件被 markdown-it 转义为代码块。
 * 默认插槽 = 网格内各 span 区块；footer 插槽 = 网格外的维护条。
 */
</script>

<template>
  <div class="guide-landing">
    <div class="guide-grid">
      <slot />
    </div>
    <div v-if="$slots.footer" class="guide-landing__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.guide-landing__footer {
  margin-top: var(--space-8);
  min-width: 0;
}
</style>
