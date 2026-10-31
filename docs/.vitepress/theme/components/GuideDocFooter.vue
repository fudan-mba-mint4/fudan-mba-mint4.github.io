<script setup>
/**
 * GuideDocFooter · 上下篇导航（蓝图 §5.15.1）
 * 桌面左右两卡各 6/12；<768 上下堆叠；整卡 ≥44px 可点。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  prev: { type: Object, default: null },
  next: { type: Object, default: null },
  indexLink: { type: Object, default: null },
})

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)
</script>

<template>
  <nav class="guide-doc-footer" :aria-label="`${shared.prev} / ${shared.next}`">
    <div class="guide-grid guide-doc-footer__grid">
      <div class="guide-span-6 guide-doc-footer__side">
        <a v-if="prev" class="guide-doc-footer__card guide-doc-footer__card--prev" :href="prev.link">
          <span class="guide-doc-footer__arrow" aria-hidden="true">‹</span>
          <span class="guide-doc-footer__text">
            <span class="guide-doc-footer__label">{{ shared.prev }}</span>
            <span class="guide-doc-footer__name">{{ prev.icon }} {{ prev.title }}</span>
            <span v-if="prev.desc" class="guide-doc-footer__desc">{{ prev.desc }}</span>
          </span>
        </a>
      </div>
      <div class="guide-span-6 guide-doc-footer__side guide-doc-footer__side--next">
        <a v-if="next" class="guide-doc-footer__card guide-doc-footer__card--next" :href="next.link">
          <span class="guide-doc-footer__text guide-doc-footer__text--right">
            <span class="guide-doc-footer__label">{{ shared.next }}</span>
            <span class="guide-doc-footer__name">{{ next.icon }} {{ next.title }}</span>
            <span v-if="next.desc" class="guide-doc-footer__desc">{{ next.desc }}</span>
          </span>
          <span class="guide-doc-footer__arrow" aria-hidden="true">›</span>
        </a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.guide-doc-footer { min-width: 0; }

.guide-doc-footer__grid { margin-top: var(--space-4); }

.guide-doc-footer__card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  padding: var(--space-5);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: border-color var(--transition-base);
  min-width: 0;
}

.guide-doc-footer__card:hover { border-color: var(--c-border-accent); }

.guide-doc-footer__arrow {
  font-size: 22px;
  color: var(--c-text-tertiary);
  flex-shrink: 0;
}

.guide-doc-footer__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.guide-doc-footer__text--right { text-align: right; }

.guide-doc-footer__label {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.guide-doc-footer__name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-doc-footer__desc {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  line-height: var(--line-height-normal);
}

.guide-doc-footer__side--next .guide-doc-footer__card { justify-content: flex-end; }

@media (max-width: 768px) {
  .guide-doc-footer__side--next .guide-doc-footer__card { justify-content: flex-start; }
  .guide-doc-footer__text--right { text-align: left; }
}
</style>
