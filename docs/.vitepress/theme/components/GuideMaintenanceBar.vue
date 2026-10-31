<script setup>
/**
 * GuideMaintenanceBar · 页尾维护条（蓝图 §5.16）
 * 日期经 formatDate 按当前语言格式化（泰语佛历）；左对齐，不居中。
 */
import { computed } from 'vue'
import { useLang, formatDate } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  date: { type: String, required: true },
  maintainer: { type: String, default: '' },
})

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)
const resolvedMaintainer = computed(() => props.maintainer || shared.value.maintainedBy)
const formattedDate = computed(() => formatDate(props.date))
</script>

<template>
  <footer class="guide-maintenance-bar">
    <div class="guide-maintenance-bar__row">
      <span class="guide-maintenance-bar__label">{{ shared.lastUpdated }}</span>
      <time class="guide-maintenance-bar__date">{{ formattedDate }}</time>
    </div>
    <p class="guide-maintenance-bar__note">{{ resolvedMaintainer }}</p>
    <div v-if="$slots.links" class="guide-maintenance-bar__links">
      <slot name="links" />
    </div>
  </footer>
</template>

<style scoped>
.guide-maintenance-bar {
  border-top: 0.5px solid var(--c-separator);
  padding-top: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.guide-maintenance-bar__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.guide-maintenance-bar__label,
.guide-maintenance-bar__date {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}

.guide-maintenance-bar__note {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
  line-height: var(--line-height-relaxed);
}

.guide-maintenance-bar__links {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.guide-maintenance-bar__links :deep(a) {
  color: var(--c-accent);
  font-size: var(--text-sm);
}
</style>
