<script setup>
import { ref, watch } from 'vue'
import { useFinanceV2 } from '../composables/useFinanceV2.js'
import '../finance-styles.css'

const {
  t, loading, error, loadFinance, isAuthenticated, authToken, router,
  openBudgets, pendingSettleBudgets, doneBudgets,
  daysLeft, budgetStatusText, activityTitle,
  gotoActivity, myVote, votedByMe, formatAmount,
} = useFinanceV2()

/* 投票（赞成/反对，二次确认，不可撤回；反对可填理由匿名公开） */
const voteForm = ref({ id: null, choice: '', reason: '', submitting: false, msg: '', showReason: false })
function startVote(b, choice) {
  if (choice === 'for') {
    if (!confirm(t.value.voteConfirm)) return
    voteForm.value = { id: b.id, choice: 'for', reason: '', submitting: true, msg: '', showReason: false }
    submitVote()
  } else {
    voteForm.value = { id: b.id, choice: 'against', reason: '', submitting: false, msg: '', showReason: true }
  }
}
function cancelVoteInput() { voteForm.value = { id: null, choice: '', reason: '', submitting: false, msg: '', showReason: false } }
async function submitVote() {
  const f = voteForm.value
  f.submitting = true
  f.msg = ''
  try {
    const res = await fetch('/api/finance/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({ proposalId: f.id, choice: f.choice, reason: f.choice === 'against' ? f.reason : '' }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) { cancelVoteInput(); await loadFinance() }
    else f.msg = json.error || 'error'
  } catch (e) { f.msg = t.value.loadFailed }
  finally { f.submitting = false }
}

/* focus 高亮 */
const hlId = ref('')
watch(() => router.route?.query?.focus, (v) => {
  if (v) { hlId.value = String(v); setTimeout(() => { hlId.value = '' }, 2600) }
}, { immediate: true })
</script>

<template>
  <div class="finance-page budgets">
    <div class="demo-banner">{{ t.demoNotice }}</div>
    <div v-if="loading" class="fp-state">{{ t.loading }}</div>
    <div v-else-if="error" class="fp-state">
      {{ t.loadFailed }} <button class="link-btn" @click="loadFinance">{{ t.retry }}</button>
    </div>
    <template v-else>
      <div class="section-header">
        <h3 class="section-title">{{ t.budgetTitle }}</h3>
        <span class="section-desc">{{ t.budgetDesc }}</span>
      </div>

      <!-- 进行中 -->
      <div v-if="openBudgets.length" class="budget-group">
        <h4 class="group-title">{{ t.inProgress }}</h4>
        <div v-for="b in openBudgets" :key="b.id" class="budget-card open" :class="{ 'hl-flash': hlId === b.id }">
          <div class="bc-head">
            <span class="bc-status open">● {{ t.inProgress }}</span>
            <span class="bc-days">{{ t.exposeDaysLeft.replace('{n}', daysLeft(b)) }}</span>
          </div>
          <div class="bc-title">{{ b.title }}</div>
          <div class="bc-meta">
            <span v-if="b.activityId" class="bc-meta-item"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(b.activityId)">{{ t.activity }}: {{ activityTitle(b.activityId) }}</a></span>
            <span>{{ t.proposer }}: {{ b.proposer || '—' }}</span>
            <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
          </div>
          <details class="bc-detail" v-if="b.detailItems && b.detailItems.length">
            <summary>{{ t.items }}</summary>
            <table class="mini-table">
              <tbody>
                <tr v-for="(it, i) in b.detailItems" :key="i"><td>{{ it.item }}</td><td class="num">¥{{ formatAmount(it.amount) }}</td></tr>
              </tbody>
            </table>
          </details>
          <div class="bc-vote">
            <div class="vote-row">
              <span class="vote-count">{{ t.forCount.replace('{n}', b.forCount) }} · {{ t.againstCount.replace('{n}', b.againstCount) }} · {{ t.uncommitted.replace('{n}', b.uncommitted) }}</span>
              <span class="vote-line">{{ t.vetoLineV2.replace('{n}', b.vetoCount) }}</span>
            </div>
            <div class="vote-bar">
              <div class="vote-fill" :class="{ veto: b.vetoed }" :style="{ width: Math.min(100, b.ratio * 100) + '%' }"></div>
              <div class="vote-marker" :style="{ left: Math.min(100, (b.vetoCount / b.total) * 100) + '%' }" :title="t.vetoLineV2.replace('{n}', b.vetoCount)"></div>
            </div>
            <div v-if="!isAuthenticated" class="oppose-hint">{{ t.loginFirst }}</div>
            <div v-else-if="votedByMe(b.id)" class="oppose-done">{{ myVote(b.id) === 'for' ? t.voteForDone : t.voteAgainstDone }}</div>
            <div v-else-if="voteForm.id !== b.id" class="vote-actions">
              <button class="btn-vote for" @click="startVote(b, 'for')">{{ t.voteFor }}</button>
              <button class="btn-vote against" @click="startVote(b, 'against')">{{ t.voteAgainst }}</button>
            </div>
            <div v-else class="vote-input">
              <p class="oppose-hint">{{ t.voteReasonHint }}</p>
              <textarea v-model="voteForm.reason" class="oppose-reason" :placeholder="t.opposeReason" rows="2"></textarea>
              <div class="oppose-actions">
                <button class="btn-vote against" :disabled="voteForm.submitting" @click="submitVote">{{ voteForm.submitting ? t.submitting : t.submit }}</button>
                <button class="btn-ghost" @click="cancelVoteInput">{{ t.close }}</button>
              </div>
              <span v-if="voteForm.msg" class="oppose-msg">{{ voteForm.msg }}</span>
            </div>
          </div>
          <div v-if="b.reasons && b.reasons.length" class="bc-reasons">
            <div class="reasons-k">{{ t.reasonsTitle }}（{{ b.reasons.length }}）</div>
            <div v-for="(r, i) in b.reasons" :key="i" class="reason-item"><span class="reason-dot">💬</span><span class="reason-text">{{ r.reason }}</span></div>
          </div>
          <div v-if="b.exposeType === 'emergency'" class="emergency-tag">{{ t.emergencyTag }}</div>
        </div>
      </div>

      <!-- 待结算 -->
      <div v-if="pendingSettleBudgets.length" class="budget-group">
        <h4 class="group-title">{{ t.pendingSettle }}</h4>
        <div v-for="b in pendingSettleBudgets" :key="b.id" class="budget-card pending">
          <div class="bc-head"><span class="bc-status pending">● {{ t.pendingSettle }}</span></div>
          <div class="bc-title">{{ b.title }}</div>
          <div class="bc-meta">
            <span>{{ t.proposer }}: {{ b.proposer || '—' }}</span>
            <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
          </div>
          <div class="vote-row">
            <span class="vote-count">{{ t.forCount.replace('{n}', b.forCount) }} · {{ t.againstCount.replace('{n}', b.againstCount) }}</span>
            <span class="expose-ended">{{ t.exposeEnded }}</span>
          </div>
        </div>
      </div>

      <!-- 历史 -->
      <div v-if="doneBudgets.length" class="budget-group">
        <h4 class="group-title">{{ t.history }}</h4>
        <div v-for="b in doneBudgets" :key="b.id" class="budget-card done" :class="{ 'hl-flash': hlId === b.id }">
          <div class="bc-head">
            <span class="bc-status" :class="b.status">{{ budgetStatusText(b) }}</span>
            <span class="bc-days">{{ t.forCount.replace('{n}', b.forCount) }} · {{ t.againstCount.replace('{n}', b.againstCount) }}</span>
          </div>
          <div class="bc-title">{{ b.title }}</div>
          <div class="bc-meta">
            <span v-if="b.activityId" class="bc-meta-item"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(b.activityId)">{{ t.activity }}: {{ activityTitle(b.activityId) }}</a></span>
            <span>{{ t.proposer }}: {{ b.proposer || '—' }}</span>
            <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
          </div>
          <div v-if="b.exposeType === 'emergency'" class="emergency-tag">{{ t.emergencyTag }}</div>
        </div>
      </div>

      <div v-if="!openBudgets.length && !pendingSettleBudgets.length && !doneBudgets.length" class="empty-state"><p>{{ t.noRecords }}</p></div>
    </template>
  </div>
</template>
