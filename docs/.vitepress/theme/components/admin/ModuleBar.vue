<template>
  <div class="module-bar">
    <div class="module-stats">
      <button v-for="s in stats" :key="s.key" type="button" class="stat-chip"
        :class="{ on: active === s.key }" @click="$emit('toggle', s.key)">
        {{ s.label }} {{ s.count }}
      </button>
    </div>
    <button v-if="addLabel" type="button" class="module-add-btn" @click="$emit('add')">{{ addLabel }}</button>
  </div>
</template>

<script setup>
// 模块动作栏：统计筛选 chips + 添加按钮（复用组件，渲染效果与原内联模板逐字一致）
// 用法：
//   <ModuleBar :stats="[{key,label,count},...]" :active="filter" add-label="＋ 新建" @toggle="toggle" @add="openForm" />
// 约定：父组件 toggle(key) 统一为 filter = filter === key ? '' : key；key='' 即「全部」。
defineProps({
  stats: { type: Array, required: true }, // [{ key, label, count }]
  active: { type: String, default: '' },
  addLabel: { type: String, default: '' }, // 空串不显示添加按钮
})
defineEmits(['toggle', 'add'])
</script>

<style scoped>
.module-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: nowrap; margin-bottom: 18px; }
.module-stats { display: flex; align-items: center; gap: 8px; overflow-x: auto; flex: 1; min-width: 0; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.module-stats::-webkit-scrollbar { display: none; }
.stat-chip { flex-shrink: 0; font-size: 12px; font-weight: 500; color: var(--c-text-secondary); background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 12px; padding: 4px 10px; cursor: pointer; transition: all .2s; }
.stat-chip:hover { border-color: var(--c-accent); color: var(--c-accent); }
.stat-chip.on { background: var(--c-accent-light); border-color: var(--c-accent); color: var(--c-accent); font-weight: 600; }
.module-add-btn { font-size: 14px; font-weight: 600; color: #fff; background: var(--c-accent); border: none; border-radius: 10px; padding: 9px 18px; cursor: pointer; transition: all .2s; white-space: nowrap; flex-shrink: 0; }
.module-add-btn:hover { filter: brightness(1.08); }
</style>
