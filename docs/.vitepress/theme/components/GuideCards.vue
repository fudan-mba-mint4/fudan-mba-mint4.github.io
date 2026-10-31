<script setup>
/**
 * GuideCards · 指南中心五主题数据提供方 + 网格渲染（蓝图 §5.18 / §5.2）
 * 仅保留五主题数据数组 + useLang 词条 + 前缀拼装；视觉卡片由 GuideTopicCard 承担。
 * 废弃旧 6 列 span、translateY(-2px)、五卡五色硬编码（病因 B / X5）。
 * 本地过滤由 GuideHomeSearch 写入共享 query；无结果渲染 GuideEmptyState（search）。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import {
  guideI18n,
  guideTopicOrder,
  guideTopicIcons,
  guidePrefix,
} from '../composables/guide-i18n.js'
import { useGuideSearch } from '../composables/guide-search.js'
import GuideTopicCard from './GuideTopicCard.vue'
import GuideEmptyState from './GuideEmptyState.vue'

const ownI18n = {
  zh: { aria: '模块指南' },
  en: { aria: 'Module guides' },
  th: { aria: 'คู่มือแต่ละโมดูล' },
}

const { lang, t } = useLang(ownI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)
const { query } = useGuideSearch()

const prefix = computed(() => guidePrefix(lang.value))

/** 五主题数据（顺序固定：finance → mint-coins → community → study → people，蓝图 §2.1） */
const cards = computed(() =>
  guideTopicOrder.map((key) => ({
    key,
    icon: guideTopicIcons[key],
    title: shared.value.topics[key].title,
    desc: shared.value.topics[key].desc,
    link: `${prefix.value}/guide/${key}`,
  }))
)

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  if (!q) return cards.value
  return cards.value.filter((c) =>
    c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
  )
})

/** 网格 span：第一行三卡 4/12，第二行两卡 6/12（蓝图 §4.1.1） */
function spanClass(index) {
  return index < 3 ? 'guide-span-4' : 'guide-span-6'
}

const contactAction = computed(() => ({
  text: shared.value.search.contact,
  href: `${prefix.value}/treehole/`,
}))
</script>

<template>
  <div class="guide-cards guide-grid" role="navigation" :aria-label="t.aria">
    <GuideTopicCard
      v-for="(card, i) in filtered"
      :key="card.link"
      :class="spanClass(i)"
      :icon="card.icon"
      :title="card.title"
      :desc="card.desc"
      :link="card.link"
      size="md"
    />
    <div v-if="query && filtered.length === 0" class="guide-span-12">
      <GuideEmptyState variant="search" :action="contactAction" />
    </div>
  </div>
</template>

<style scoped>
.guide-cards { min-width: 0; }
</style>
