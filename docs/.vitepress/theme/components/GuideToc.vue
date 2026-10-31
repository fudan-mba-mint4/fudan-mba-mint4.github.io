<script setup>
/**
 * GuideToc · 右侧本页目录 + scrollspy（蓝图 §5.7 / §2.3.4）
 * ≥1024 sticky；<1024 由 Shell 外层 display:none 隐藏。
 * IntersectionObserver 监听各 id 小节；无 JS 时静态列出不报错（SSR 安全）。
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  headings: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const emit = defineEmits(['navigate'])

const { lang } = useLang(guideI18n)
const resolvedTitle = computed(() => props.title || guideI18n[lang.value].onThisPage)

const activeId = ref(null)
let observer = null

function navigate(id) {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
  }
  emit('navigate', id)
}

function setupObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activeId.value = entry.target.id
      })
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
  )
  props.headings.forEach((h) => {
    const el = document.getElementById(h.id)
    if (el) observer.observe(el)
  })
}

onMounted(async () => {
  await nextTick()
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <nav class="guide-toc" :aria-label="guideI18n[lang].aria.toc">
    <p class="guide-toc__title">{{ resolvedTitle }}</p>
    <ul class="guide-toc__list">
      <li v-for="h in headings" :key="h.id" :class="`guide-toc__item--level-${h.level || 2}`">
        <a
          class="guide-toc__link"
          :class="{ 'is-active': activeId === h.id }"
          :href="`#${h.id}`"
          :aria-current="activeId === h.id ? 'location' : undefined"
          @click.prevent="navigate(h.id)"
        >{{ h.text }}</a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.guide-toc {
  min-width: 0;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.guide-toc__title {
  position: relative;
  margin: 0 0 var(--space-3);
  padding-left: var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  letter-spacing: 0;
}

.guide-toc__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--c-accent);
}

.guide-toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.guide-toc__link {
  position: relative;
  display: block;
  min-height: 44px;
  line-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--c-text-primary);
  text-decoration: none;
  transition: color var(--transition-fast), background var(--transition-fast);
  overflow-wrap: anywhere;
}

.guide-toc__link:hover { background: var(--c-bg-secondary); }

.guide-toc__link.is-active {
  color: var(--c-accent);
  font-weight: var(--font-medium);
  background: var(--c-accent-light);
}

.guide-toc__link.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: var(--radius-full);
  background: var(--c-accent);
}

.guide-toc__item--level-3 .guide-toc__link {
  padding-left: calc(var(--space-3) + 16px);
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
}

.guide-toc__item--level-3 .guide-toc__link.is-active { color: var(--c-accent); }
</style>
