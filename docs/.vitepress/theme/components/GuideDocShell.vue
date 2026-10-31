<script setup>
/**
 * GuideDocShell · 子页三栏包裹容器（蓝图 §5.4，A1/A3 核心件）
 * 面包屑 → 三栏（轨 / 正文 / 目录）→ 底部 DocFooter + Feedback；
 * RelatedLinks 走 #related 槽，MaintenanceBar 走 #footer 槽。
 * 壳层不为 body 追加 padding-bottom（MobileTabBar 全局注入，蓝图 §8.5）。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import {
  guideI18n,
  guideTopicOrder,
  guideTopicIcons,
  guidePrefix,
} from '../composables/guide-i18n.js'
import GuideBreadcrumb from './GuideBreadcrumb.vue'
import GuideTopicRail from './GuideTopicRail.vue'
import GuideToc from './GuideToc.vue'
import GuideDocFooter from './GuideDocFooter.vue'
import GuideFeedback from './GuideFeedback.vue'

const props = defineProps({
  topic: {
    type: String,
    required: true,
    validator: (v) => guideTopicOrder.includes(v),
  },
  headings: { type: Array, default: () => [] },
  prev: { type: Object, default: null },
  next: { type: Object, default: null },
  contactHref: { type: String, default: '' },
})

const { lang } = useLang(guideI18n)

const prefix = computed(() => guidePrefix(lang.value))
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)

function topicMeta(key) {
  return {
    icon: guideTopicIcons[key],
    title: shared.value.topics[key].title,
    desc: shared.value.topics[key].desc,
    link: `${prefix.value}/guide/${key}`,
  }
}

const currentIndex = computed(() => guideTopicOrder.indexOf(props.topic))

const prevData = computed(() => {
  if (props.prev) return props.prev
  const prevKey = guideTopicOrder[(currentIndex.value - 1 + guideTopicOrder.length) % guideTopicOrder.length]
  return topicMeta(prevKey)
})

const nextData = computed(() => {
  if (props.next) return props.next
  const nextKey = guideTopicOrder[(currentIndex.value + 1) % guideTopicOrder.length]
  return topicMeta(nextKey)
})

const breadcrumbItems = computed(() => [
  { label: shared.value.breadcrumbHome, link: `${prefix.value}/guide/` },
  { label: shared.value.topics[props.topic].title },
])

const indexLink = computed(() => ({
  label: shared.value.backToIndex,
  link: `${prefix.value}/guide/`,
}))

const resolvedContactHref = computed(() => props.contactHref || `${prefix.value}/treehole/`)
</script>

<template>
  <div class="guide-doc-shell">
    <div class="guide-doc-breadcrumb">
      <slot name="breadcrumb">
        <GuideBreadcrumb :items="breadcrumbItems" />
      </slot>
    </div>

    <div class="guide-doc-layout">
      <aside class="guide-doc-rail" :aria-label="shared.aria.topicNav">
        <slot name="rail">
          <GuideTopicRail variant="rail" :active="topic" />
        </slot>
      </aside>

      <main class="guide-doc">
        <div class="guide-doc-capsule">
          <GuideTopicRail variant="capsule" :active="topic" />
        </div>

        <article class="guide-doc-article">
          <slot />
        </article>

        <div v-if="$slots.related" class="guide-doc-related">
          <slot name="related" />
        </div>

        <GuideDocFooter :prev="prevData" :next="nextData" :index-link="indexLink" />

        <GuideFeedback :contact-href="resolvedContactHref" />

        <slot name="footer" />
      </main>

      <aside class="guide-doc-toc" :aria-label="shared.aria.toc">
        <slot name="toc">
          <GuideToc :headings="headings" />
        </slot>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.guide-doc-related { min-width: 0; }

/* 移动端胶囊条：仅 <1024 显示；桌面由 guide.css 隐藏 .guide-doc-rail / .guide-doc-toc */
.guide-doc-capsule { display: none; }

@media (max-width: 1024px) {
  .guide-doc-capsule { display: block; }
}
</style>
