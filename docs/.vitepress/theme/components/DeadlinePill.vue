<script setup>
import { computed } from 'vue'
import { useLang } from '../composables/useLang'

const props = defineProps({
  // 截止日期 ISO 字符串，如 "2026-09-15"；为空时组件不渲染
  deadline: { type: String, default: '' },
  // 尺寸：sm 紧凑（卡片header用）/ md 默认
  size: { type: String, default: 'md' },
})

/* ========== 组件内 i18n（zh / en / th） ========== */
const i18n = {
  zh: {
    daysLeft: '剩{days}天',
    dueSoon: '即将截止',
    overdue: '已截止',
  },
  en: {
    daysLeft: '{days} days left',
    dueSoon: 'Due soon',
    overdue: 'Overdue',
  },
  th: {
    daysLeft: 'เหลือ {days} วัน',
    dueSoon: 'ใกล้กำหนด',
    overdue: 'หมดกำหนด',
  },
}

const { t } = useLang(i18n)

/* ========== 截止状态计算 ========== */
// 距截止天数：Math.ceil((deadlineDate - now) / 86400000)
const daysLeft = computed(() => {
  if (!props.deadline) return null
  const deadlineDate = new Date(props.deadline)
  return Math.ceil((deadlineDate - Date.now()) / 86400000)
})

// normal  → 距离 >=1 天：普通薄荷 chip
// soon    → 0 天且未过期（<24h）：琥珀色 + 呼吸光
// overdue → 已过期：转灰，不消失
const pillState = computed(() => {
  if (!props.deadline || daysLeft.value === null) return 'empty'
  if (daysLeft.value < 0) return 'overdue'
  if (daysLeft.value === 0) return 'soon'
  return 'normal'
})

const label = computed(() => {
  if (pillState.value === 'overdue') return t.value.overdue
  if (pillState.value === 'soon') return t.value.dueSoon
  return t.value.daysLeft.replace('{days}', daysLeft.value)
})
</script>

<template>
  <span
    v-if="deadline && pillState !== 'empty'"
    class="deadline-pill"
    :class="[`deadline-pill--${size}`, `deadline-pill--${pillState}`]"
    :title="deadline"
    role="status"
  >
    {{ label }}
  </span>
</template>

<style scoped>
.deadline-pill {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
  font-weight: var(--font-medium);
  white-space: nowrap;
  line-height: 1;
}

/* 尺寸 */
.deadline-pill--md {
  padding: 6px 14px;
  font-size: var(--text-sm);
}
.deadline-pill--sm {
  padding: 3px 10px;
  font-size: var(--text-xs);
}

/* 常态：浅薄荷底 + 薄荷字 */
.deadline-pill--normal {
  background: var(--c-accent-light);
  color: var(--c-accent);
}

/* <24h：琥珀色 + 呼吸光 */
.deadline-pill--soon {
  background: var(--c-amber-light);
  color: var(--c-amber);
  animation: deadline-pill-pulse 2s ease-in-out infinite;
}

/* 已过期：自动转灰，仍保留展示 */
.deadline-pill--overdue {
  background: transparent;
  color: var(--c-text-quaternary);
}

@keyframes deadline-pill-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 var(--c-amber-light);
  }
  50% {
    box-shadow: 0 0 0 5px var(--c-amber-light);
  }
}

/* 动效降级：尊重 prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .deadline-pill--soon {
    animation: none;
    box-shadow: inset 0 0 0 1px var(--c-amber);
  }
}
</style>
