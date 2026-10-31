<script setup>
/**
 * GuideRelatedLinks · 文末相关主题卡（蓝图 §5.14）
 * 复用 GuideTopicCard size="sm"；网格 span 按蓝图 §4.2.1 / §4.2.2 / §4.2.3。
 * 链接文本必须与目标页标题一致；href 由父级按语言前缀拼装。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'
import GuideSectionHead from './GuideSectionHead.vue'
import GuideTopicCard from './GuideTopicCard.vue'

const props = defineProps({
  links: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)
const resolvedTitle = computed(() => props.title || shared.value.relatedTopics)
</script>

<template>
  <section class="guide-related">
    <GuideSectionHead :title="resolvedTitle" level="2" />
    <div class="guide-grid guide-related__grid">
      <GuideTopicCard
        v-for="(link, i) in links"
        :key="link.link"
        class="guide-span-4"
        size="sm"
        :icon="link.icon"
        :title="link.title"
        :desc="link.desc"
        :link="link.link"
      />
    </div>
  </section>
</template>

<style scoped>
.guide-related {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.guide-related__grid { margin-top: var(--space-4); }

/* 768–1024：相关卡 6/12；<768：12/12（guide.css 全局断点兜底） */
@media (max-width: 1024px) {
  .guide-related__grid .guide-span-4 { grid-column: span 6; }
}
</style>
