<script setup>
/**
 * GuideFaqItem · FAQ 折叠单条（蓝图 §5.12）
 * 原生 <button>，Enter / Space 可操作；aria-expanded / aria-controls 标注齐备。
 */
defineProps({
  question: { type: String, required: true },
  open: { type: Boolean, default: false },
  id: { type: String, required: true },
  index: { type: Number, default: 0 },
})

const emit = defineEmits(['toggle'])
function onToggle() { emit('toggle') }
</script>

<template>
  <div class="guide-faq-item" :class="{ 'is-open': open }">
    <button
      type="button"
      class="guide-faq-item__question"
      :aria-expanded="open"
      :aria-controls="`faq-${id}`"
      @click="onToggle"
    >
      <slot name="question">
        <span class="guide-faq-item__q-text">{{ question }}</span>
      </slot>
      <span class="guide-faq-item__chevron" aria-hidden="true">›</span>
    </button>
    <div
      v-show="open"
      :id="`faq-${id}`"
      class="guide-faq-item__answer"
      role="region"
      :aria-label="question"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.guide-faq-item {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.guide-faq-item__question {
  width: 100%;
  min-height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.guide-faq-item__question:hover { background: var(--c-bg-tertiary); }

.guide-faq-item__q-text {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  min-width: 0;
}

.guide-faq-item__chevron {
  font-size: 20px;
  color: var(--c-text-tertiary);
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.guide-faq-item.is-open .guide-faq-item__chevron {
  transform: rotate(90deg);
}

.guide-faq-item__answer {
  padding: 0 var(--space-5) var(--space-5);
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--c-text-secondary);
}

.guide-faq-item__answer :deep(p:last-child) { margin-bottom: 0; }
.guide-faq-item__answer :deep(a) { color: var(--c-accent); }
</style>
