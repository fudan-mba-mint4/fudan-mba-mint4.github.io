<script setup>
import { ref, watch, computed } from 'vue'
import { useFinanceV2 } from '../composables/useFinanceV2.js'
import '../finance-styles.css'

const {
  t, currentLang, loading, error, loadFinance, authToken, isAuthenticated, getToken,
  workbench, pendingAudits, pendingPays, reimbursements, activitiesMap, activitiesWithTx,
  activityTitle, gotoActivity, gotoBudget, formatAmount, formatDate,
  reimbStatusLabel, voucherTypeLabel, isImage, budgets,
} = useFinanceV2()

const workbenchBusy = ref('')
async function auditReimb(r, action, note = '') {
  if (action === 'revision' || action === 'reject') {
    const reason = prompt(action === 'revision' ? t.value.revision + '（填退回意见）' : t.value.reject + '（填驳回意见）', '')
    if (reason === null) return
    note = reason
  }
  if (!confirm(`${action === 'approve' ? t.value.approve : action === 'revision' ? t.value.revision : t.value.reject}：${r.description || r.id}？`)) return
  workbenchBusy.value = r.id
  try {
    const res = await fetch(`/api/admin/finance/reimbursements/${r.id}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ action, note }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { alert(json.error || t.value.loadFailed); return }
    await loadFinance()
  } catch (e) { alert(t.value.loadFailed) }
  finally { workbenchBusy.value = '' }
}
async function payReimb(r) {
  if (!confirm(t.value.confirmPay + '？' + t.value.payNeed)) return
  workbenchBusy.value = r.id
  try {
    const res = await fetch(`/api/admin/finance/reimbursements/${r.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({}),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { alert(json.error || t.value.loadFailed); return }
    await loadFinance()
  } catch (e) { alert(t.value.loadFailed) }
  finally { workbenchBusy.value = '' }
}

/* ===== 小荷包变动登记（出纳）：收入/支出登记进收支明细，账页即小荷包台账 ===== */
const txForm = ref({ date: '', type: 'income', category: 'tuition', amount: null, description: '', activityId: '', proposalId: '', submitting: false })
watch(() => txForm.value.type, (v) => { txForm.value.category = v === 'income' ? 'tuition' : 'dining' })
const txCatOptions = computed(() => {
  const cats = txForm.value.type === 'income'
    ? ['tuition', 'sponsor', 'interest', 'other']
    : ['dining', 'marketing', 'transport', 'venue', 'speaker', 'lodging', 'ticket', 'prize', 'insurance', 'supplies', 'other']
  return cats.map(c => ({ key: c, label: t.value.categories[c] || c }))
})
async function registerTx() {
  const f = txForm.value
  if (!f.date || !(Number(f.amount) > 0) || !f.description.trim()) return
  // 财务制度：支出必须关联预算公示（事前公示）
  if (f.type === 'expense' && !f.proposalId) { alert(t.value.needBudgetForExpense); return }
  f.submitting = true
  try {
    const res = await fetch('/api/admin/finance/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ date: f.date, type: f.type, category: f.category, amount: Number(f.amount), description: f.description.trim(), activityId: f.activityId || null, proposalId: f.proposalId || null }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { alert(json.error || t.value.loadFailed); return }
    txForm.value = { date: '', type: 'income', category: 'tuition', amount: null, description: '', activityId: '', proposalId: '', submitting: false }
    await loadFinance()
  } catch (e) { alert(t.value.loadFailed) }
  finally { f.submitting = false }
}
const nowIso = () => new Date().toISOString().slice(0, 10)

const voucherView = ref(null)
const openVouchers = (r) => { voucherView.value = { title: r.description, vouchers: r.vouchers } }
const closeVouchers = () => { voucherView.value = null }
</script>

<template>
  <div class="finance-page workbench">
    <div class="demo-banner">{{ t.demoNotice }}</div>
    <div v-if="!isAuthenticated" class="empty-state"><p>{{ t.loginFirst }}</p></div>
    <template v-else>
      <div v-if="loading" class="fp-state">{{ t.loading }}</div>
      <div v-else-if="error" class="fp-state">
        {{ t.loadFailed }} <button class="link-btn" @click="loadFinance">{{ t.retry }}</button>
      </div>
      <template v-else>
        <div class="section-header">
          <h3 class="section-title">{{ t.tabWorkbench }}</h3>
          <span class="section-desc">{{ t.workbenchDesc }}</span>
        </div>

        <!-- 会计视图 -->
        <div v-if="workbench.isAccountant" class="wb-section">
          <h4 class="group-title">👤 {{ t.accountantView }}</h4>
          <div v-if="pendingAudits.length" class="reimb-list">
            <div v-for="r in pendingAudits" :key="r.id" class="reimb-card">
              <div class="rc-head"><span class="rc-status submitted">{{ reimbStatusLabel(r.status) }}</span><span class="rc-date">{{ formatDate(r.createdAt) }}</span></div>
              <div class="rc-title">{{ r.description || '—' }}</div>
              <div class="rc-meta">
                <span v-if="r.activityId"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(r.activityId)">{{ t.activity }}: {{ activityTitle(r.activityId) }}</a></span>
                <span v-if="r.proposalId"><a class="link-activity" href="#" @click.prevent.stop="gotoBudget(r.proposalId)">{{ t.relatedBudget }}</a></span>
                <span>{{ t.payer }}: {{ r.applicant }}</span>
                <span class="rc-amount">¥{{ formatAmount(r.amount) }}</span>
              </div>
              <div class="rc-foot">
                <button class="link-btn" @click="openVouchers(r)">📎 {{ t.voucher }} ({{ r.vouchers?.length || 0 }})</button>
                <span v-if="r.endorsement?.committee?.name" class="rc-note">{{ t.endorsementTitle }}: {{ r.endorsement.committee.name }}</span>
              </div>
              <div class="wb-actions">
                <button class="btn-vote for" :disabled="workbenchBusy === r.id" @click="auditReimb(r, 'approve')">{{ t.approve }}</button>
                <button class="btn-ghost" :disabled="workbenchBusy === r.id" @click="auditReimb(r, 'revision')">{{ t.revision }}</button>
                <button class="btn-vote against" :disabled="workbenchBusy === r.id" @click="auditReimb(r, 'reject')">{{ t.reject }}</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state"><p>{{ t.pendingAuditQ.replace('{n}', 0) }}</p></div>
        </div>

        <!-- 出纳视图 -->
        <div v-if="workbench.isCashier" class="wb-section">
          <h4 class="group-title">👤 {{ t.cashierView }}</h4>
          <div v-if="pendingPays.length" class="reimb-list">
            <div v-for="r in pendingPays" :key="r.id" class="reimb-card">
              <div class="rc-head"><span class="rc-status approved">{{ reimbStatusLabel(r.status) }}</span><span class="rc-date">{{ formatDate(r.createdAt) }}</span></div>
              <div class="rc-title">{{ r.description || '—' }}</div>
              <div class="rc-meta">
                <span v-if="r.proposalId"><a class="link-activity" href="#" @click.prevent.stop="gotoBudget(r.proposalId)">{{ t.relatedBudget }}</a></span>
                <span>{{ t.payer }}: {{ r.applicant }}</span>
                <span class="rc-amount">¥{{ formatAmount(r.amount) }}</span>
              </div>
              <div class="rc-foot">
                <button class="link-btn" @click="openVouchers(r)">📎 {{ t.voucher }} ({{ r.vouchers?.length || 0 }})</button>
              </div>
              <div class="wb-actions">
                <button class="btn-vote for" :disabled="workbenchBusy === r.id" @click="payReimb(r)">{{ t.confirmPay }}</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state"><p>{{ t.pendingPayQ.replace('{n}', 0) }}</p></div>

          <!-- 小荷包变动登记（收支明细即小荷包台账） -->
          <div class="wb-panel">
            <h4 class="group-title">🧾 {{ t.reconcileTitle }}</h4>
            <p class="section-desc">{{ t.reconcile }}：小荷包发生收入/支出后，在此登记进收支明细，全班可见。</p>
            <div class="rc-form-grid">
              <label class="f-label">{{ t.filterMonth }}</label>
              <input v-model="txForm.date" type="date" class="fp-input" :max="nowIso()" />
              <label class="f-label">{{ t.category }}</label>
              <select v-model="txForm.type" class="fp-select">
                <option value="income">{{ t.txIncome }}</option>
                <option value="expense">{{ t.txExpense }}</option>
              </select>
              <select v-model="txForm.category" class="fp-select">
                <option v-for="c in txCatOptions" :key="c.key" :value="c.key">{{ c.label }}</option>
              </select>
              <label class="f-label">{{ t.amount }}</label>
              <input v-model.number="txForm.amount" type="number" step="0.01" min="0" class="fp-input" placeholder="0.00" />
              <label class="f-label">{{ t.description }}</label>
              <input v-model="txForm.description" class="fp-input" placeholder="如：补缴班费 / 聚餐支出" />
              <label class="f-label">{{ t.relatedBudget }}<span v-if="txForm.type === 'expense'" class="req-star">*</span></label>
              <select v-model="txForm.proposalId" class="fp-select" :required="txForm.type === 'expense'"><option value="">—</option><option v-for="b in budgets" :key="b.id" :value="b.id">{{ b.title }}</option></select>
              <label class="f-label">{{ t.activity }}</label>
              <select v-model="txForm.activityId" class="fp-select"><option value="">—</option><option v-for="id in activitiesWithTx" :key="id" :value="id">{{ activityTitle(id) }}</option></select>
              <button class="btn-oppose primary" :disabled="txForm.submitting" @click="registerTx">{{ txForm.submitting ? t.submitting : t.reconcile }}</button>
            </div>
          </div>
        </div>

        <div v-if="!workbench.isAccountant && !workbench.isCashier" class="empty-state"><p>{{ t.workbenchDesc }}</p></div>
      </template>
    </template>

    <!-- 凭证弹层 -->
    <div v-if="voucherView" class="modal-mask" @click.self="closeVouchers">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">{{ voucherView.title }}</span>
          <button class="modal-close" @click="closeVouchers">×</button>
        </div>
        <div class="modal-body">
          <div class="voucher-grid big">
            <a v-for="(v, i) in voucherView.vouchers" :key="i" :href="v.url" target="_blank" rel="noopener" class="v-thumb">
              <img v-if="isImage(v.url)" :src="v.url" :alt="v.name" loading="lazy" />
              <span v-else class="v-file-card">📄 {{ v.name || v.url }}</span>
              <em>{{ voucherTypeLabel(v.type) }}</em>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
