<script setup>
/**
 * GuideEmptyState · 空态 / 受限 / 未开放（蓝图 §5.17，F/X 空态根治件）
 * variant: empty | disabled | planned | search；disabled 不渲染可点击链接。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  variant: {
    type: String,
    default: 'empty',
    validator: (v) => ['empty', 'disabled', 'planned', 'search'].includes(v),
  },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  action: { type: Object, default: null },
})

const emit = defineEmits(['action-click'])

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)

const iconMap = { empty: '📭', disabled: '🔒', planned: '🧭', search: '🔍' }

const resolved = computed(() => {
  const e = shared.value.emptyState
  switch (props.variant) {
    case 'disabled': return { title: e.disabledTitle, desc: e.disabledDesc, icon: iconMap.disabled }
    case 'planned': return { title: e.plannedTitle, desc: e.plannedDesc, icon: iconMap.planned }
    case 'search':  return { title: e.searchEmptyTitle, desc: shared.value.search.emptyDesc, icon: iconMap.search }
    default:         return { title: e.empty, desc: '', icon: iconMap.empty }
  }
})

const resolvedTitle = computed(() => props.title || resolved.value.title)
const resolvedDesc = computed(() => props.desc || resolved.value.desc)

function onAction() { emit('action-click') }
</script>

<template>
  <div class="guide-empty-state" :class="`guide-empty-state--${variant}`">
    <span class="guide-empty-state__icon" aria-hidden="true">{{ resolved.icon }}</span>
    <p class="guide-empty-state__title">{{ resolvedTitle }}</p>
    <p v-if="resolvedDesc" class="guide-empty-state__desc">{{ resolvedDesc }}</p>
    <slot />
    <button
      v-if="action && action.href"
      type="button"
      class="guide-empty-state__action"
      @click="onAction"
    >{{ action.text }}</button>
    <button
      v-else-if="action"
      type="button"
      class="guide-empty-state__action is-disabled"
      disabled
      aria-disabled="true"
      @click="onAction"
    >{{ action.text }}</button>
  </div>
</template>

<style scoped>
.guide-empty-state {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-5);
  text-align: center;
  min-width: 0;
}

.guide-empty-state__icon {
  font-size: 48px;
  line-height: 1;
  color: var(--c-text-quaternary);
}

.guide-empty-state__title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-empty-state__desc {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--c-text-tertiary);
}

.guide-empty-state__action {
  min-height: 44px;
  padding: 0 var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-accent);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.guide-empty-state__action:hover { border-color: var(--c-border-accent); }

.guide-empty-state__action.is-disabled {
  background: var(--c-bg-secondary);
  color: var(--c-text-quaternary);
  cursor: not-allowed;
}
</style>
