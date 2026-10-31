<script setup>
/**
 * GuideStepList · 纵向编号步骤（蓝图 §5.9，C/F 根治件）
 * steps: [{ title, desc?, substeps?: string[], link?: {text, href}, screenshot?: {alt, src?} }]
 * 控件名 / 步骤标题在组件 <strong> 内显式渲染（蓝图 §7.2），不在 markdown 里依赖 **。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  steps: { type: Array, default: () => [] },
  numbered: { type: Boolean, default: true },
})

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)
</script>

<template>
  <ol class="guide-step-list" :class="{ 'guide-step-list--plain': !numbered }">
    <li v-for="(step, i) in steps" :key="i" class="guide-step">
      <span v-if="numbered" class="guide-step__num" aria-hidden="true">{{ i + 1 }}</span>
      <div class="guide-step__main">
        <slot :name="`step-body-${i}`" :step="step" :index="i">
          <h4 class="guide-step__title"><strong>{{ step.title }}</strong></h4>
          <p v-if="step.desc" class="guide-step__desc">{{ step.desc }}</p>
          <ul v-if="step.substeps && step.substeps.length" class="guide-step__sub">
            <li v-for="(sub, j) in step.substeps" :key="j">{{ sub }}</li>
          </ul>
          <a v-if="step.link" class="guide-step__link" :href="step.link.href">{{ step.link.text }}</a>
        </slot>
        <slot :name="`screenshot-${i}`" :step="step" :index="i">
          <div v-if="step.screenshot" class="guide-step__shot">
            <img v-if="step.screenshot.src" :src="step.screenshot.src" :alt="step.screenshot.alt" />
            <div v-else class="guide-step__shot-placeholder">{{ shared.screenshotPlaceholder }}</div>
          </div>
        </slot>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.guide-step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.guide-step {
  display: flex;
  gap: var(--space-4);
  min-width: 0;
}

.guide-step__num {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--c-accent-light);
  color: var(--c-accent);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guide-step__main {
  flex: 1;
  min-width: 0;
}

.guide-step__title {
  margin: 4px 0 var(--space-2);
  font-size: var(--text-base);
  line-height: var(--line-height-relaxed);
}

.guide-step__title strong {
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-step__desc {
  margin: 0 0 var(--space-2);
  font-size: var(--text-base);
  line-height: var(--line-height-relaxed);
  color: var(--c-text-secondary);
}

.guide-step__sub {
  margin: var(--space-2) 0 0;
  padding-left: 20px;
}

.guide-step__sub li {
  margin-bottom: var(--space-2);
  line-height: var(--line-height-relaxed);
  color: var(--c-text-secondary);
}

.guide-step__link {
  display: inline-block;
  margin-top: var(--space-2);
  min-height: 44px;
  line-height: 44px;
  color: var(--c-accent);
  font-size: var(--text-sm);
}

.guide-step__shot {
  margin-top: var(--space-4);
}

.guide-step__shot img {
  max-width: 100%;
  border-radius: var(--radius-lg);
  border: 0.5px solid var(--c-border);
  display: block;
}

.guide-step__shot-placeholder {
  min-height: 160px;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-lg);
  background: var(--c-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
  text-align: center;
}

@media (max-width: 480px) {
  .guide-step { gap: var(--space-3); }
}
</style>
