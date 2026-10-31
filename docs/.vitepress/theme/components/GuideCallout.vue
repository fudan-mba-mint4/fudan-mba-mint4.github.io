<script setup>
/**
 * GuideCallout · 七型提示条（蓝图 §5.10，C/X7 根治件）
 * variant: prerequisite / permission / admin / tip / note / warning / info
 * 统一容器 + 左侧 3px 色条；不使用渐变 / 阴影；非交互件，hover 无变化。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (v) => ['prerequisite', 'permission', 'admin', 'tip', 'note', 'warning', 'info'].includes(v),
  },
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
})

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)

const variantMap = {
  prerequisite: { bar: 'var(--c-blue)', bg: 'var(--c-blue-light)', tone: 'var(--c-blue)', fallbackIcon: '🔐' },
  permission:   { bar: 'var(--c-purple)', bg: 'var(--c-purple-light)', tone: 'var(--c-purple)', fallbackIcon: '🔑' },
  admin:        { bar: 'var(--c-accent)', bg: 'var(--c-accent-light)', tone: 'var(--c-accent)', fallbackIcon: '🧑‍💼' },
  tip:          { bar: 'var(--c-green)', bg: 'var(--c-accent-light)', tone: 'var(--c-green)', fallbackIcon: '💡' },
  warning:      { bar: 'var(--c-orange)', bg: 'var(--c-orange-light)', tone: 'var(--c-orange)', fallbackIcon: '⚠️' },
  note:         { bar: 'var(--c-border)', bg: 'var(--c-bg-secondary)', tone: 'var(--c-text-primary)', fallbackIcon: '📝' },
  info:         { bar: 'var(--c-border)', bg: 'var(--c-bg-secondary)', tone: 'var(--c-text-primary)', fallbackIcon: 'ℹ️' },
}

const current = computed(() => variantMap[props.variant])
const resolvedTitle = computed(() => props.title || shared.value.callout[props.variant] || '')
const resolvedIcon = computed(() => props.icon || current.value.fallbackIcon)
const roleHint = computed(() => ['prerequisite', 'permission', 'admin', 'warning'].includes(props.variant) ? 'note' : 'note')
</script>

<template>
  <aside
    class="guide-callout"
    :class="`guide-callout--${variant}`"
    :role="roleHint"
    :aria-label="resolvedTitle"
    :style="{ '--callout-bar': current.bar, '--callout-bg': current.bg, '--callout-tone': current.tone }"
  >
    <div class="guide-callout__body">
      <div v-if="resolvedTitle" class="guide-callout__header">
        <span class="guide-callout__icon" aria-hidden="true">{{ resolvedIcon }}</span>
        <strong class="guide-callout__title">{{ resolvedTitle }}</strong>
      </div>
      <div class="guide-callout__content">
        <slot />
      </div>
      <div v-if="$slots.footer" class="guide-callout__footer">
        <slot name="footer" />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.guide-callout {
  border-radius: var(--radius-lg);
  border: 0.5px solid var(--c-border-light);
  background: var(--callout-bg);
  position: relative;
  overflow: hidden;
}

/* 左侧 3px 色条（伪元素，圆角左侧对齐，蓝图 §5.10） */
.guide-callout::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: var(--callout-bar);
}

.guide-callout__body {
  padding: var(--space-4) var(--space-5);
  min-width: 0;
}

.guide-callout__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.guide-callout__icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.guide-callout__title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--callout-tone);
}

.guide-callout__content {
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--c-text-secondary);
}

.guide-callout__content :deep(p:last-child) { margin-bottom: 0; }
.guide-callout__content :deep(ul),
.guide-callout__content :deep(ol) {
  margin: var(--space-2) 0 0;
  padding-left: 20px;
}
.guide-callout__content :deep(li) { margin-bottom: var(--space-2); }

.guide-callout__footer {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 0.5px solid var(--c-border-light);
}

.guide-callout__content :deep(a) { color: var(--c-accent); }
</style>
