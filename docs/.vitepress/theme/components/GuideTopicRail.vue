<script setup>
/**
 * GuideTopicRail · 左侧主题轨 / 移动端胶囊条（蓝图 §5.5 / §2.3.3）
 * variant=rail：≥1024 竖排 sticky 列表；variant=capsule：<1024 横向可滚动胶囊条。
 * 当前主题高亮：accent 文字 + accent-light 底 + 左侧 3px accent 竖条。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n, guideTopicOrder, guideTopicIcons, guidePrefix } from '../composables/guide-i18n.js'

const props = defineProps({
  active: { type: String, required: true },
  topics: { type: Array, default: null },
  variant: { type: String, default: 'rail', validator: (v) => ['rail', 'capsule'].includes(v) },
})

const { lang } = useLang(guideI18n)

const items = computed(() => {
  const prefix = guidePrefix(lang.value)
  const home = {
    key: '__home__',
    icon: '🧭',
    title: guideI18n[lang.value].backToIndex,
    link: `${prefix}/guide/`,
  }
  const topicItems = guideTopicOrder.map((key) => ({
    key,
    icon: guideTopicIcons[key],
    title: guideI18n[lang.value].topics[key].title,
    link: `${prefix}/guide/${key}`,
  }))
  return props.topics ? props.topics : [home, ...topicItems]
})

const homeLabel = computed(() => guideI18n[lang.value].breadcrumbHome)
</script>

<template>
  <nav
    v-if="variant === 'rail'"
    class="guide-rail"
    :aria-label="guideI18n[lang].aria.topicNav"
  >
    <p class="guide-rail__title">{{ homeLabel }}</p>
    <ul class="guide-rail__list">
      <li v-for="item in items" :key="item.key">
        <a
          class="guide-rail__link"
          :class="{ 'is-active': item.key === active }"
          :href="item.link"
          :aria-current="item.key === active ? 'page' : undefined"
        >
          <span class="guide-rail__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="guide-rail__text">{{ item.title }}</span>
        </a>
      </li>
    </ul>
  </nav>

  <nav
    v-else
    class="guide-rail-capsule"
    :aria-label="guideI18n[lang].aria.topicNav"
  >
    <ul class="guide-rail-capsule__list">
      <li v-for="item in items" :key="item.key">
        <a
          class="guide-rail-capsule__chip"
          :class="{ 'is-active': item.key === active }"
          :href="item.link"
          :aria-current="item.key === active ? 'page' : undefined"
        >
          <span aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.title }}</span>
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* ---------- 桌面竖排轨 ---------- */
.guide-rail { min-width: 0; }

.guide-rail__title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  letter-spacing: var(--letter-spacing-wide);
}

.guide-rail__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.guide-rail__link {
  position: relative;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px var(--space-4);
  border-radius: var(--radius-md);
  color: var(--c-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
}

.guide-rail__link:hover { color: var(--c-text-primary); }

.guide-rail__link.is-active {
  color: var(--c-accent);
  background: var(--c-accent-light);
}

/* 当前态左侧 3px 竖条 */
.guide-rail__link.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: var(--radius-full);
  background: var(--c-accent);
}

.guide-rail__icon { font-size: 18px; flex-shrink: 0; }
.guide-rail__text { min-width: 0; overflow-wrap: anywhere; }

/* ---------- 移动端胶囊条（仅 <1024 显示，由 guide.css 外层容器控制） ---------- */
.guide-rail-capsule { min-width: 0; }

.guide-rail-capsule__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  min-width: 0;
}

.guide-rail-capsule__list::-webkit-scrollbar { display: none; }

.guide-rail-capsule__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  background: var(--c-bg-card);
  color: var(--c-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  white-space: nowrap;
  flex-shrink: 0;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.guide-rail-capsule__chip.is-active {
  border-color: var(--c-border-accent);
  background: var(--c-accent-light);
  color: var(--c-accent);
}
</style>
