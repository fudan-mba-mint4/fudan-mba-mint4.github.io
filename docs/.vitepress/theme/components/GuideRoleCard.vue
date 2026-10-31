<script setup>
/**
 * GuideRoleCard · 角色 / 口径卡（蓝图 §5.11）
 * level: student | admin | auditor | viewer；compact = 首页「全局约定」紧凑信息条变体。
 * 成员真名不译；顶部角色色条由 level 映射 token。
 */
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  role: { type: String, default: '' },
  members: { type: String, default: '' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  level: {
    type: String,
    default: 'student',
    validator: (v) => ['student', 'admin', 'auditor', 'viewer'].includes(v),
  },
  link: { type: Object, default: null },
  compact: { type: Boolean, default: false },
  icon: { type: String, default: '' },
})

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)

const levelBar = {
  student: 'var(--c-accent)',
  admin: 'var(--c-blue)',
  auditor: 'var(--c-purple)',
  viewer: 'var(--c-text-quaternary)',
}

const levelLabel = computed(() => shared.value.role[props.level] || '')
</script>

<template>
  <div
    class="guide-role-card"
    :class="{ 'guide-role-card--compact': compact }"
    :style="{ '--role-bar': levelBar[level] }"
  >
    <div class="guide-role-card__inner">
      <div class="guide-role-card__head">
        <span v-if="icon" class="guide-role-card__icon" aria-hidden="true">{{ icon }}</span>
        <div class="guide-role-card__titles">
          <p class="guide-role-card__role">
            <strong>{{ role }}</strong>
            <span v-if="levelLabel" class="guide-role-card__level">{{ levelLabel }}</span>
          </p>
          <p v-if="members" class="guide-role-card__members">{{ members }}</p>
        </div>
      </div>
      <p v-if="title" class="guide-role-card__title">{{ title }}</p>
      <p v-if="desc" class="guide-role-card__desc">{{ desc }}</p>
      <div v-if="$slots.actions" class="guide-role-card__actions">
        <slot name="actions" />
      </div>
      <a v-if="link" class="guide-role-card__link" :href="link.href">{{ link.text }}</a>
    </div>
  </div>
</template>

<style scoped>
.guide-role-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  min-width: 0;
  transition: border-color var(--transition-base);
}

.guide-role-card:hover { border-color: var(--c-border-accent); }

.guide-role-card__inner {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.guide-role-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.guide-role-card__icon {
  font-size: 20px;
  flex-shrink: 0;
}

.guide-role-card__titles { min-width: 0; }

.guide-role-card__role {
  margin: 0;
  font-size: var(--text-base);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.guide-role-card__role strong {
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-role-card__level {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  background: var(--c-bg-secondary);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
}

.guide-role-card__members {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--c-text-secondary);
}

.guide-role-card__title {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--c-text-primary);
}

.guide-role-card__desc {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--line-height-normal);
  color: var(--c-text-tertiary);
}

.guide-role-card__actions {
  margin-top: var(--space-1);
}

.guide-role-card__link {
  margin-top: var(--space-1);
  color: var(--c-accent);
  font-size: var(--text-sm);
  min-height: 44px;
  line-height: 44px;
}

/* compact 信息条变体（蓝图 §5.11） */
.guide-role-card--compact {
  border-radius: var(--radius-lg);
}

.guide-role-card--compact .guide-role-card__inner {
  padding: var(--space-5);
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
}

.guide-role-card--compact .guide-role-card__head {
  align-items: center;
}

.guide-role-card--compact .guide-role-card__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--c-accent-light);
  color: var(--c-accent);
}

.guide-role-card--compact .guide-role-card__level { display: none; }

.guide-role-card--compact .guide-role-card__title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-role-card--compact .guide-role-card__desc {
  font-size: var(--text-sm);
  line-height: var(--line-height-normal);
}
</style>
