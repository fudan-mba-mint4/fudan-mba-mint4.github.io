<script setup>
/**
 * GuideTopicCard · 单张可点击主题卡（蓝图 §5.2）
 * 供 index 网格与 GuideRelatedLinks 复用；size=md 首页卡，size=sm 相关链接小卡。
 * 整卡为 <a> 原生跳转；hover 仅 border-color 变化，不 translateY / 不加阴影。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  link: { type: String, required: true },
  badge: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['md', 'sm'].includes(v) },
  accentKey: { type: String, default: 'mint' },
})

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)
const ariaLabel = computed(() => `${shared.value.backToIndex ? '' : ''}${props.title}`)
</script>

<template>
  <a class="guide-topic-card" :class="`guide-topic-card--${size}`" :href="link" :aria-label="ariaLabel">
    <div class="guide-topic-card__top">
      <span class="guide-topic-card__icon" aria-hidden="true">{{ icon }}</span>
      <span v-if="badge" class="guide-topic-card__badge">{{ badge }}</span>
    </div>
    <div class="guide-topic-card__body">
      <slot>
        <p class="guide-topic-card__title">{{ title }}</p>
        <p v-if="desc" class="guide-topic-card__desc">{{ desc }}</p>
      </slot>
    </div>
    <div v-if="$slots.footer" class="guide-topic-card__footer">
      <slot name="footer" />
    </div>
    <span class="guide-topic-card__arrow" aria-hidden="true">›</span>
  </a>
</template>

<style scoped>
.guide-topic-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  min-height: 150px;
  padding: var(--space-6);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-none);
  text-decoration: none;
  color: inherit;
  transition: border-color var(--transition-base);
  -webkit-tap-highlight-color: transparent;
}

.guide-topic-card:hover {
  border-color: var(--c-border-accent);
}

.guide-topic-card:focus-visible {
  outline: none;
  border-color: var(--c-border-accent);
  box-shadow: 0 0 0 1px var(--c-border-accent);
}

.guide-topic-card--sm {
  min-height: 120px;
  padding: var(--space-5);
  gap: var(--space-3);
}

.guide-topic-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.guide-topic-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: var(--c-accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.guide-topic-card--sm .guide-topic-card__icon {
  width: 36px;
  height: 36px;
  font-size: 18px;
}

.guide-topic-card__badge {
  font-size: var(--text-xs);
  color: var(--c-accent);
  background: var(--c-accent-light);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
}

.guide-topic-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.guide-topic-card__title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  letter-spacing: -0.2px;
  color: var(--c-text-primary);
}

.guide-topic-card__desc {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--line-height-normal);
  color: var(--c-text-tertiary);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.guide-topic-card--sm .guide-topic-card__desc {
  -webkit-line-clamp: 2;
}

.guide-topic-card__footer { margin-top: auto; }

.guide-topic-card__arrow {
  position: absolute;
  right: var(--space-5);
  bottom: var(--space-5);
  font-size: 18px;
  color: var(--c-text-tertiary);
  transition: color var(--transition-fast);
}

.guide-topic-card:hover .guide-topic-card__arrow { color: var(--c-accent); }

@media (max-width: 480px) {
  .guide-topic-card { padding: var(--space-4); min-height: 0; }
  .guide-topic-card__icon { width: 40px; height: 40px; font-size: 20px; }
  .guide-topic-card__title { font-size: var(--text-sm); }
  .guide-topic-card__desc { font-size: var(--text-xs); }
}
</style>
