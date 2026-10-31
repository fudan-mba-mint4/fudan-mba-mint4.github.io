<script setup>
/**
 * GuideFaq · FAQ 折叠面板组（蓝图 §5.12，E/X9 根治件）
 * items: [{ q, a, aHtml?, id? }]；singleOpen 展开一项自动收起其它项。
 * 答案内强调由插槽 <strong> 渲染；aHtml 仅渲染受信静态文案，禁止用户输入。
 */
import { ref, computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'
import GuideFaqItem from './GuideFaqItem.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  singleOpen: { type: Boolean, default: true },
  id: { type: String, default: '' },
})

const emit = defineEmits(['toggle'])

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)
const resolvedTitle = computed(() => props.title || shared.value.faqTitle)

const openId = ref(null)

function toggle(id) {
  const willOpen = openId.value !== id
  openId.value = props.singleOpen ? (willOpen ? id : null) : (willOpen ? id : null)
  emit('toggle', id, willOpen)
}

function itemId(item, i) {
  return item.id || `faq-${i}`
}
</script>

<template>
  <section class="guide-faq" :id="id || undefined" aria-label="FAQ">
    <header class="guide-faq__head">
      <h2 class="guide-faq__title">{{ resolvedTitle }}</h2>
      <div v-if="$slots['header-extra']" class="guide-faq__extra">
        <slot name="header-extra" />
      </div>
    </header>
    <div class="guide-faq__list">
      <GuideFaqItem
        v-for="(item, i) in items"
        :key="itemId(item, i)"
        :id="itemId(item, i)"
        :index="i"
        :question="item.q"
        :open="openId === itemId(item, i)"
        @toggle="toggle(itemId(item, i))"
      >
        <slot :name="`item-${i}`" :item="item" :index="i">
          <p v-if="item.aHtml" v-html="item.aHtml"></p>
          <p v-else-if="item.a">{{ item.a }}</p>
        </slot>
      </GuideFaqItem>
    </div>
  </section>
</template>

<style scoped>
.guide-faq {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.guide-faq__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
}

.guide-faq__title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--letter-spacing-tight);
  color: var(--c-text-primary);
  padding-bottom: var(--space-3);
  border-bottom: 0.5px solid var(--c-separator);
  flex: 1;
}

.guide-faq__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
