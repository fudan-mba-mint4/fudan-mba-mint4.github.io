<script setup>
/**
 * GuideBreadcrumb · 面包屑（蓝图 §5.6 / §2.3.2）
 * 固定两级：指南中心 › 当前主题；末项纯文本 aria-current="page"。
 */
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

defineProps({
  items: { type: Array, default: () => [] },
})

const { lang } = useLang(guideI18n)
</script>

<template>
  <nav class="guide-breadcrumb" :aria-label="guideI18n[lang].aria.breadcrumb">
    <ol class="guide-breadcrumb__list">
      <li v-for="(item, i) in items" :key="i" class="guide-breadcrumb__item">
        <template v-if="item.link">
          <a class="guide-breadcrumb__link" :href="item.link">{{ item.label }}</a>
        </template>
        <span v-else class="guide-breadcrumb__current" aria-current="page">{{ item.label }}</span>
        <span v-if="i < items.length - 1" class="guide-breadcrumb__sep" aria-hidden="true">›</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.guide-breadcrumb { min-width: 0; }

.guide-breadcrumb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.guide-breadcrumb__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.guide-breadcrumb__link {
  color: var(--c-accent);
  font-size: var(--text-sm);
  text-decoration: none;
  min-height: 44px;
  line-height: 44px;
}

.guide-breadcrumb__link:hover { text-decoration: underline; }

.guide-breadcrumb__current {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-breadcrumb__sep {
  font-size: var(--text-xs);
  color: var(--c-text-quaternary);
}
</style>
