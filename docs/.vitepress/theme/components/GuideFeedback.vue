<script setup>
/**
 * GuideFeedback · Microsoft 精简版 Yes/No 反馈（蓝图 §5.15.2）
 * Yes/No → 原因标签 → 可选留言；本期不接后端表单，仅本地 sessionStorage，不伪造成功提交。
 */
import { ref, computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { guideI18n } from '../composables/guide-i18n.js'

const props = defineProps({
  contactHref: { type: String, default: '/treehole/' },
})

const emit = defineEmits(['submit'])

const { lang } = useLang(guideI18n)
const shared = computed(() => guideI18n[lang.value] || guideI18n.zh)

const verdict = ref(null)
const reasons = ref([])
const note = ref('')
const submitted = ref(false)

const availableReasons = computed(() =>
  verdict.value === 'no' ? shared.value.feedback.reasonsNo : shared.value.feedback.reasonsYes
)

function setVerdict(v) {
  verdict.value = v
  reasons.value = []
}

function toggleReason(reason) {
  const idx = reasons.value.indexOf(reason)
  if (idx >= 0) reasons.value.splice(idx, 1)
  else reasons.value.push(reason)
}

function submitFeedback() {
  if (!verdict.value) return
  try {
    sessionStorage.setItem('guide_feedback', JSON.stringify({
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      verdict: verdict.value,
      reasons: reasons.value,
      note: note.value,
      at: new Date().toISOString(),
    }))
  } catch (e) { /* 隐私模式下静默 */ }
  submitted.value = true
  emit('submit', verdict.value, reasons.value, note.value)
}

function restart() {
  verdict.value = null
  reasons.value = []
  note.value = ''
  submitted.value = false
}
</script>

<template>
  <section class="guide-feedback" :aria-label="shared.feedback.question">
    <div class="guide-feedback__panel">
      <template v-if="!submitted">
        <p class="guide-feedback__question">{{ shared.feedback.question }}</p>
        <div class="guide-feedback__verdict">
          <button
            type="button"
            class="guide-feedback__btn"
            :class="{ 'is-selected': verdict === 'yes' }"
            :aria-pressed="verdict === 'yes'"
            @click="setVerdict('yes')"
          >{{ shared.feedback.yes }}</button>
          <button
            type="button"
            class="guide-feedback__btn"
            :class="{ 'is-selected': verdict === 'no' }"
            :aria-pressed="verdict === 'no'"
            @click="setVerdict('no')"
          >{{ shared.feedback.no }}</button>
        </div>

        <div v-if="verdict" class="guide-feedback__reasons">
          <button
            v-for="reason in availableReasons"
            :key="reason"
            type="button"
            class="guide-feedback__chip"
            :class="{ 'is-selected': reasons.includes(reason) }"
            :aria-pressed="reasons.includes(reason)"
            @click="toggleReason(reason)"
          >{{ reason }}</button>
        </div>

        <textarea
          v-if="verdict"
          v-model="note"
          class="guide-feedback__note"
          :placeholder="shared.feedback.notePlaceholder"
          :aria-label="shared.feedback.notePlaceholder"
          rows="3"
        ></textarea>

        <div v-if="verdict" class="guide-feedback__actions">
          <button type="button" class="guide-feedback__submit" @click="submitFeedback">
            {{ shared.feedback.submit }}
          </button>
        </div>
      </template>

      <div v-else class="guide-feedback__thanks" role="status">
        <p class="guide-feedback__thanks-title">{{ shared.feedback.thanks }}</p>
        <a class="guide-feedback__contact" :href="contactHref">{{ shared.feedback.contact }}</a>
        <button type="button" class="guide-feedback__restart" @click="restart">{{ shared.feedback.submit }}</button>
      </div>

      <slot name="footer-note" />
      <p class="guide-feedback__privacy">{{ shared.feedback.note }}</p>
    </div>
  </section>
</template>

<style scoped>
.guide-feedback {
  min-width: 0;
  margin-top: var(--space-8);
}

.guide-feedback__panel {
  background: var(--c-bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.guide-feedback__question {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-feedback__verdict {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.guide-feedback__btn {
  min-height: 44px;
  padding: 0 var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.guide-feedback__btn.is-selected {
  border-color: var(--c-border-accent);
  background: var(--c-accent-light);
  color: var(--c-accent);
}

.guide-feedback__reasons {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.guide-feedback__chip {
  min-height: 44px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-full);
  border: 1px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.guide-feedback__chip.is-selected {
  border-color: var(--c-border-accent);
  background: var(--c-accent-light);
  color: var(--c-accent);
}

.guide-feedback__note {
  width: 100%;
  min-height: 88px;
  resize: vertical;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  background: var(--c-bg-card);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--c-text-primary);
  font-family: inherit;
}

.guide-feedback__note:focus {
  outline: none;
  border-color: var(--c-border-accent);
}

.guide-feedback__actions { display: flex; }

.guide-feedback__submit {
  min-height: 44px;
  padding: 0 var(--space-5);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--c-accent);
  color: var(--c-text-inverse);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.guide-feedback__submit:hover { background: var(--c-accent-hover); }

.guide-feedback__thanks {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.guide-feedback__thanks-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-feedback__contact {
  color: var(--c-accent);
  font-size: var(--text-sm);
}

.guide-feedback__restart {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--c-text-tertiary);
  font-size: var(--text-xs);
  cursor: pointer;
  min-height: 44px;
}

.guide-feedback__privacy {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
}
</style>
