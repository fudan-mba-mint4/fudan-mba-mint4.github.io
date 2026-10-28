<template>
  <div class="module-tabs">
    <button v-for="t in tabs" :key="t.key" type="button" class="module-tab"
      :class="{ on: active === t.key }" @click="$emit('select', t.key)">
      {{ t.label }}
    </button>
  </div>
</template>

<script setup>
// 模块内 Tab 切换条（复用组件，渲染效果与原内联模板逐字一致）
defineProps({
  tabs: { type: Array, required: true }, // [{ key, label }]
  active: { type: String, default: '' },
})
defineEmits(['select'])
</script>

<style scoped>
.module-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--c-border, #333); }
.module-tab { background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--c-text-secondary, #999); font-size: 14px; font-weight: 600; padding: 8px 14px; cursor: pointer; margin-bottom: -1px; transition: color .2s; }
.module-tab.on { color: var(--c-accent, #34c759); border-bottom-color: var(--c-accent, #34c759); }
</style>
