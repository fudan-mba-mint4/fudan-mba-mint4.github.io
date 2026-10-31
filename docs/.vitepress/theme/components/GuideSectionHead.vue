<script setup>
/**
 * GuideSectionHead · 分区标题三件套（蓝图 §5.3 / §3.3）
 * 眉标 eyebrow + H2/H3 标题 + 可选导语 lead；输出 id 锚点供 GuideToc 与页内跳转。
 */
import { computed } from 'vue'

const props = defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  lead: { type: String, default: '' },
  id: { type: String, default: '' },
  level: { type: [Number, String], default: 2, validator: (v) => Number(v) === 2 || Number(v) === 3 },
})

const levelNum = computed(() => Number(props.level) || 2)
const Tag = computed(() => (levelNum.value === 3 ? 'h3' : 'h2'))
</script>

<template>
  <header class="guide-section-head" :class="`guide-section-head--${levelNum}`">
    <p v-if="eyebrow" class="guide-section-head__eyebrow" aria-hidden="true">{{ eyebrow }}</p>
    <component :is="Tag" :id="id || undefined" class="guide-section-head__title">{{ title }}</component>
    <p v-if="lead || $slots.lead" class="guide-section-head__lead">
      <slot name="lead">{{ lead }}</slot>
    </p>
  </header>
</template>

<style scoped>
.guide-section-head {
  margin-top: var(--space-12);
}

.guide-section-head--3 {
  margin-top: var(--space-8);
}

.guide-section-head__eyebrow {
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
  color: var(--c-accent);
}

.guide-section-head__title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--letter-spacing-tight);
  line-height: var(--line-height-tight);
  color: var(--c-text-primary);
  padding-bottom: var(--space-3);
  border-bottom: 0.5px solid var(--c-separator);
  scroll-margin-top: calc(var(--nav-height) + var(--space-4));
}

.guide-section-head--3 .guide-section-head__title {
  font-size: var(--text-xl);
  padding-bottom: 0;
  border-bottom: none;
}

.guide-section-head__lead {
  margin: var(--space-3) 0 0;
  font-size: var(--text-lg);
  color: var(--c-text-secondary);
  max-width: 600px;
  line-height: var(--line-height-relaxed);
}
</style>
