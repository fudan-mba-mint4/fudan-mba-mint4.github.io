<script setup>
/**
 * GuideHomeSearch · 指南首页本地过滤搜索框（蓝图 §5.1）
 * 仅负责输入框 / 清除按钮；过滤结果与空态由 GuideCards（重构后）依据共享 query 渲染。
 * 不接入 VitePress 搜索索引；无网络请求。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'
import { useGuideSearch } from '../composables/guide-search.js'

const props = defineProps({
  items: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:query'])

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)
const { query, setQuery, resetQuery } = useGuideSearch()

const resolvedPlaceholder = computed(() => props.placeholder || shared.value.search.placeholder)

function onInput(event) {
  setQuery(event.target.value)
  emit('update:query', query.value)
}

function onClear() {
  resetQuery()
  emit('update:query', '')
}
</script>

<template>
  <div class="guide-home-search" role="search">
    <div class="guide-home-search__field">
      <span class="guide-home-search__icon" aria-hidden="true">🔍</span>
      <input
        :value="query"
        type="search"
        role="searchbox"
        class="guide-home-search__input"
        :placeholder="resolvedPlaceholder"
        :aria-label="shared.aria.search"
        @input="onInput"
      />
      <button
        v-if="query"
        type="button"
        class="guide-home-search__clear"
        :aria-label="shared.search.clear"
        @click="onClear"
      >✕</button>
    </div>
  </div>
</template>

<style scoped>
.guide-home-search {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.guide-home-search__field {
  position: relative;
  width: 100%;
  max-width: 720px;
}

.guide-home-search__icon {
  position: absolute;
  left: var(--space-5);
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--c-text-tertiary);
  pointer-events: none;
}

.guide-home-search__input {
  width: 100%;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  padding: 0 var(--space-5);
  padding-left: calc(var(--space-5) + 28px);
  padding-right: calc(var(--space-5) + 44px);
  font-size: var(--text-base);
  color: var(--c-text-primary);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.guide-home-search__input::placeholder { color: var(--c-text-tertiary); }

.guide-home-search__input:focus {
  outline: none;
  border-color: var(--c-border-accent);
  box-shadow: 0 0 0 1px var(--c-accent-glow);
}

.guide-home-search__clear {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--c-text-tertiary);
  font-size: 16px;
  cursor: pointer;
  border-radius: var(--radius-full);
}

.guide-home-search__clear:hover { color: var(--c-text-primary); }
</style>
