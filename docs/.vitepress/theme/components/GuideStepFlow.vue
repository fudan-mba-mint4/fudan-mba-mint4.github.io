<script setup>
/**
 * GuideStepFlow · 横向流程总览（蓝图 §5.8，E/X10 根治件）
 * steps: [{ icon?, title, desc?, state: 'done' | 'current' | 'todo' }]
 * ≥768 横向一行；<768 降级竖向时间线（蓝图 §4.2.3）；不使用等宽代码块。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  steps: { type: Array, default: () => [] },
  orientation: { type: String, default: 'auto' },
})

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)

const stateLabel = (state) => shared.value.state[state] || ''
</script>

<template>
  <ol class="guide-step-flow">
    <li v-for="(step, i) in steps" :key="i" class="guide-flow-node" :class="`is-${step.state || 'todo'}`">
      <span class="guide-flow-dot" :aria-label="stateLabel(step.state)">
        <span v-if="step.icon" aria-hidden="true">{{ step.icon }}</span>
        <template v-else aria-hidden="true">{{ i + 1 }}</template>
      </span>
      <div class="guide-flow-text">
        <p class="guide-flow-title">{{ step.title }}</p>
        <p v-if="step.desc" class="guide-flow-desc">{{ step.desc }}</p>
        <slot name="node-extra" :step="step" :index="i" />
      </div>
    </li>
  </ol>
</template>

<style scoped>
.guide-step-flow {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: var(--space-4);
  min-width: 0;
}

.guide-flow-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
}

/* 节点之间 1px 虚线连接（桌面横向） */
.guide-flow-node:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 14px;
  left: calc(50% + 22px);
  right: calc(-50% + 22px);
  border-top: 1px dashed var(--c-border);
}

.guide-flow-dot {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  flex-shrink: 0;
  z-index: 1;
}

.guide-flow-node.is-done .guide-flow-dot {
  background: var(--c-accent);
  color: var(--c-text-inverse);
}

.guide-flow-node.is-current .guide-flow-dot {
  background: var(--c-accent-light);
  color: var(--c-accent);
  border: 1px solid var(--c-accent);
}

.guide-flow-node.is-todo .guide-flow-dot {
  background: var(--c-bg-secondary);
  color: var(--c-text-tertiary);
}

.guide-flow-text { min-width: 0; }

.guide-flow-title {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  line-height: var(--line-height-normal);
}

.guide-flow-desc {
  margin: var(--space-1) 0 0;
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  line-height: var(--line-height-normal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* <768：竖向时间线，连接线改为竖向（蓝图 §4.2.3） */
@media (max-width: 768px) {
  .guide-step-flow {
    grid-auto-flow: row;
    grid-auto-columns: minmax(0, 1fr);
    gap: var(--space-6);
  }

  .guide-flow-node {
    flex-direction: row;
    align-items: flex-start;
  }

  .guide-flow-node:not(:last-child)::after {
    top: 30px;
    bottom: -22px;
    left: 14px;
    right: auto;
    border-top: none;
    border-left: 1px dashed var(--c-border);
  }
}
</style>
