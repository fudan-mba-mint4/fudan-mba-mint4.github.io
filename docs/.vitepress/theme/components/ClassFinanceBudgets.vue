<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useFinanceV2 } from '../composables/useFinanceV2.js'
import '../finance-styles.css'

const {
  t, currentLang, loading, error, loadFinance, isAuthenticated, currentUser, authToken, router,
  budgets, myBudgets, openBudgets, pendingSettleBudgets, doneBudgets,
  daysLeft, budgetStatusText, activityTitle, myVote, votedByMe, formatAmount,
  activitiesMap, passedBudgets, gotoActivity,
} = useFinanceV2()

const tab = ref('all') // all | mine
const showForm = ref(false)

/* ===== 常量（对齐《附件二 班费预算公示记录表》）===== */
const GROUP_OPTIONS = ['体验组', '记忆组', '学术组', '生活组', '财务组', '其他项目组']
const EVENT_TYPE_OPTIONS = ['常规事项（例行性、可预见）', '非常规事项（临时发生、额外增加）']
const ACTIVITY_TYPE_OPTIONS = [
  '纯会务/赋能类-讲座', '纯会务/赋能类-分享', '纯会务/赋能类-企业参访',
  '联谊/凝聚类-聚餐', '联谊/凝聚类-旅行', '联谊/凝聚类-团建', '联谊/凝聚类-聚劲周',
  '日常运营类-常规宣传物料', '日常运营类-班级公共用品', '日常运营类-教师慰问',
]
const PAY_TARGET_OPTIONS = ['淘宝商家', '场地租赁方', '个人垫付报销', '其他']
const FEE_CATEGORY_OPTIONS = [
  '宣传与文化建设', '场地与设备租赁', '交通与差旅', '餐饮与茶歇（⚠️聚餐正餐严禁填入）',
  '住宿费（⚠️聚餐旅行严禁填入）', '门票与报名费', '纪念品与奖品', '班级关怀与慰问',
  '嘉宾接待与讲师费', '学习资料与打印', '活动道具与物料', '公共设备与图书',
  '软件与工具订阅', '保险与医疗物资', '其他额外支出',
]

/* ===== 发起/重交表单 ===== */
function emptyForm() {
  return {
    editingId: null, fromDraft: false, isDraft: false,
    title: '', groupName: '', applicant: currentUser?.value?.name || '', contact: '',
    eventType: '', activityType: '', payTarget: '', amount: null, description: '', activityId: '',
    detailItems: [{ item: '', qty: 1, unitPrice: null, amount: null, category: '', note: '' }],
    redlines: { r1: false, r2: false, r3: false },
    msg: '', submitting: false,
  }
}
const form = ref(emptyForm())
const rowTotal = (it) => Math.round(((Number(it.qty) || 0) * (Number(it.unitPrice) || 0)) * 100) / 100
const itemsTotal = computed(() => form.value.detailItems.reduce((s, it) => s + rowTotal(it), 0))
const formCanSubmit = computed(() => {
  const f = form.value
  if (!f.title.trim() || !(Number(f.amount) > 0) || !f.groupName || !f.eventType || !f.activityType || !f.payTarget) return false
  // 明细每一行都须完整：支出项目、数量>0、单价>0、费用性质分类（备注选填）
  if (!form.value.detailItems.length) return false
  if (!form.value.detailItems.every(it => it.item.trim() && Number(it.qty) > 0 && Number(it.unitPrice) > 0 && it.category)) return false
  if (!f.redlines.r1 || !f.redlines.r2 || !f.redlines.r3) return false
  return true
})
function addItemRow() {
  form.value.detailItems.push({ item: '', qty: 1, unitPrice: null, amount: null, category: '', note: '' })
}
function removeItemRow(i) {
  if (form.value.detailItems.length > 1) form.value.detailItems.splice(i, 1)
}
function openForm(b) {
  if (b) {
    // 回填：草稿（继续填写）或被退回（修改重交）的公示
    const fromDraft = b.status === 'draft'
    form.value = {
      editingId: b.id, fromDraft, isDraft: fromDraft, title: b.title, groupName: b.groupName || '', applicant: b.proposer || currentUser?.value?.name || '',
      contact: b.contact || '', eventType: b.eventType || '', activityType: b.activityType || '',
      payTarget: b.payTarget || '', amount: b.amount, description: b.description || '', activityId: b.activityId || '',
      detailItems: (b.detailItems && b.detailItems.length ? b.detailItems : [{ item: '', qty: 1, unitPrice: null, amount: null, category: '', note: '' }])
        .map(it => ({ item: it.item || '', qty: Number(it.qty) || 1, unitPrice: it.unitPrice, amount: Number(it.amount) || 0, category: it.category || '', note: it.note || '' })),
      redlines: b.redlines || { r1: false, r2: false, r3: false },
      msg: '', submitting: false,
    }
  } else {
    form.value = emptyForm()
  }
  showForm.value = true
}
async function submitForm() {
  const f = form.value
  if (!formCanSubmit.value || f.submitting) return
  f.submitting = true
  f.msg = ''
  try {
    const detailItems = f.detailItems.map(it => ({
      item: it.item.trim(), qty: Number(it.qty) || 1, unitPrice: Number(it.unitPrice) || 0,
      amount: rowTotal(it), category: it.category, note: it.note.trim(),
    })).filter(it => it.item && it.amount > 0)
    const payload = {
      id: f.editingId || undefined,
      title: f.title.trim(), amount: Number(f.amount), groupName: f.groupName,
      applicant: f.applicant.trim() || currentUser?.value?.name, contact: f.contact.trim(),
      eventType: f.eventType, activityType: f.activityType, payTarget: f.payTarget,
      description: f.description.trim(), activityId: f.activityId || null,
      detailItems, redlines: f.redlines,
    }
    const res = await fetch(f.editingId ? `/api/finance/budgets/${f.editingId}` : '/api/finance/budgets', {
      method: f.editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      f.msg = json.message || t.value.successSubmittedBudget
      showForm.value = false
      form.value = emptyForm()
      await loadFinance()
    } else f.msg = json.error || t.value.loadFailed
  } catch (e) { f.msg = t.value.loadFailed }
  finally { f.submitting = false }
}

async function saveDraftForm() {
  const f = form.value
  if (f.submitting) return
  f.submitting = true
  f.msg = ''
  try {
    const detailItems = f.detailItems.map(it => ({
      item: it.item.trim(), qty: Number(it.qty) || 1, unitPrice: Number(it.unitPrice) || 0,
      amount: rowTotal(it), category: it.category, note: it.note.trim(),
    })).filter(it => it.item || it.category || Number(it.unitPrice) > 0 || it.note)
    const payload = {
      id: f.editingId || undefined,
      title: f.title.trim(), amount: Number(f.amount) || 0, groupName: f.groupName,
      applicant: f.applicant.trim() || currentUser?.value?.name, contact: f.contact.trim(),
      eventType: f.eventType, activityType: f.activityType, payTarget: f.payTarget,
      description: f.description.trim(), activityId: f.activityId || null,
      detailItems, redlines: f.redlines, saveDraft: true,
    }
    const res = await fetch(f.editingId ? `/api/finance/budgets/${f.editingId}` : '/api/finance/budgets', {
      method: f.editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      f.msg = json.message || t.value.draftSaved
      f.isDraft = true
      if (!f.editingId && json.id) f.editingId = json.id // 新草稿生成后绑定 id，后续再存走 PUT
      await loadFinance()
    } else f.msg = json.error || t.value.loadFailed
  } catch (e) { f.msg = t.value.loadFailed }
  finally { f.submitting = false }
}

/* ===== 投票（全部公示 tab 内）===== */
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
    else f.msg = json.error || t.value.loadFailed
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
    <div v-if="loading" class="fp-state">{{ t.loading }}</div>
    <div v-else-if="error" class="fp-state">
      {{ t.loadFailed }} <button class="link-btn" @click="loadFinance">{{ t.retry }}</button>
    </div>
    <template v-else>
      <div class="section-header">
        <h3 class="section-title">{{ t.budgetTitle }}</h3>
        <span class="section-desc">{{ t.budgetDesc }}</span>
      </div>

      <!-- Tab 切换 + 发起公示 -->
      <div class="budget-toolbar">
        <div class="budget-tabs">
          <button class="budget-tab" :class="{ active: tab === 'all' }" @click="tab = 'all'">{{ t.tabAllBudgets }}</button>
          <button class="budget-tab" :class="{ active: tab === 'mine' }" @click="tab = 'mine'">{{ t.tabMyBudgets }}</button>
        </div>
        <button v-if="isAuthenticated" class="btn-oppose primary" @click="openForm()">{{ t.newBudgetPropose }}</button>
        <button v-else class="btn-oppose" @click="router.push('/auth/')">{{ t.loginFirst }}</button>
      </div>

      <!-- 发起/重交表单 -->
      <div v-if="showForm" class="budget-form-card">
        <h4 class="form-title">{{ t.proposeTitle }}</h4>
        <p class="oppose-hint">{{ t.proposeHint }}</p>
        <div class="form-row">
          <label class="f-label">{{ t.formActivityName }} *</label>
          <input v-model="form.title" class="fp-input" placeholder="如：9月班级聚餐预算" />
        </div>
        <div class="form-row">
          <label class="f-label">{{ t.formGroup }} *</label>
          <select v-model="form.groupName" class="fp-select">
            <option value="">请选择</option>
            <option v-for="g in GROUP_OPTIONS" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div class="form-row">
          <label class="f-label">{{ t.formApplicant }}</label>
          <input v-model="form.applicant" class="fp-input" placeholder="申请人" />
          <label class="f-label">{{ t.formContact }}</label>
          <input v-model="form.contact" class="fp-input" placeholder="手机 / 微信（选填）" />
        </div>
        <div class="form-row">
          <label class="f-label">{{ t.formEventType }} *</label>
          <select v-model="form.eventType" class="fp-select">
            <option value="">请选择</option>
            <option v-for="g in EVENT_TYPE_OPTIONS" :key="g" :value="g">{{ g }}</option>
          </select>
          <label class="f-label" style="margin-left:12px">{{ t.formPayTarget }} *</label>
          <select v-model="form.payTarget" class="fp-select">
            <option value="">请选择</option>
            <option v-for="g in PAY_TARGET_OPTIONS" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div class="form-row">
          <label class="f-label">{{ t.formActivityType }} *</label>
          <select v-model="form.activityType" class="fp-select">
            <option value="">请选择</option>
            <option v-for="g in ACTIVITY_TYPE_OPTIONS" :key="g" :value="g">{{ g }}</option>
          </select>
          <label class="f-label" style="margin-left:12px">{{ t.activity }}</label>
          <select v-model="form.activityId" class="fp-select">
            <option value="">不关联</option>
            <option v-for="(act, id) in activitiesMap" :key="id" :value="id">{{ act.date || '' }} · {{ act.title?.[currentLang] || act.title?.zh || id }}</option>
          </select>
        </div>
        <div class="form-row col">
          <label class="f-label">{{ t.formDetailTitle }}</label>
          <div class="detail-scroll">
            <div class="detail-table-head">
              <span class="dt-item">{{ t.itemName }}</span><span class="dt-qty">{{ t.qty }}</span>
              <span class="dt-price">{{ t.unitPrice }}</span><span class="dt-sub">{{ t.itemAmount }}</span>
              <span class="dt-cat">{{ t.itemCategory }}</span><span class="dt-note">{{ t.itemNote }}</span>
              <span class="dt-del"></span>
            </div>
            <div v-for="(it, i) in form.detailItems" :key="i" class="detail-row">
              <input v-model="it.item" class="fp-input dt-item" placeholder="如：横幅印刷" />
              <input v-model.number="it.qty" type="number" min="0" class="fp-input dt-qty" />
              <input v-model.number="it.unitPrice" type="number" step="0.01" min="0" class="fp-input dt-price" />
              <span class="dt-sub">{{ formatAmount(rowTotal(it)) }}</span>
              <select v-model="it.category" class="fp-select dt-cat">
                <option value="">请选择</option>
                <option v-for="c in FEE_CATEGORY_OPTIONS" :key="c" :value="c">{{ c }}</option>
              </select>
              <input v-model="it.note" class="fp-input dt-note" placeholder="备注" />
              <button type="button" class="mini-del" @click="removeItemRow(i)" :disabled="form.detailItems.length <= 1">×</button>
            </div>
            <div class="detail-total">
              <button type="button" class="mini-add" @click="addItemRow">{{ t.addItem }}</button>
              <span class="dt-total">{{ t.total }}：<b>¥{{ formatAmount(itemsTotal) }}</b></span>
            </div>
          </div>
        </div>
        <div class="form-row">
          <label class="f-label">{{ t.formBudgetAmount }} *</label>
          <input v-model.number="form.amount" type="number" step="0.01" min="0" class="fp-input" placeholder="预算总上限（元），须 ≥ 明细合计" />
          <span v-if="itemsTotal > 0" class="dim" :style="itemsTotal > Number(form.amount || 0) ? 'color:#c92a2a;font-weight:600' : ''">
            明细合计 ¥{{ formatAmount(itemsTotal) }}{{ itemsTotal > Number(form.amount || 0) ? '（超过上限，无法提交）' : '' }}
          </span>
        </div>
        <div class="form-row col redline-box">
          <label class="f-label">{{ t.redlineTitle }}</label>
          <label class="redline-item"><input type="checkbox" v-model="form.redlines.r1" /><span>{{ t.redline1 }}</span></label>
          <label class="redline-item"><input type="checkbox" v-model="form.redlines.r2" /><span>{{ t.redline2 }}</span></label>
          <label class="redline-item"><input type="checkbox" v-model="form.redlines.r3" /><span>{{ t.redline3 }}</span></label>
        </div>
        <div class="form-actions">
          <span v-if="form.msg" class="oppose-msg">{{ form.msg }}</span>
          <button class="btn-ghost" :disabled="form.submitting" @click="saveDraftForm">{{ t.saveDraft }}</button>
          <button class="btn-oppose primary" :disabled="!formCanSubmit || form.submitting" @click="submitForm">
            {{ form.submitting ? t.submitting : (form.isDraft ? t.submitBudget : (form.editingId ? t.resubmit : t.submitBudget)) }}
          </button>
          <button class="btn-ghost" @click="showForm = false; form = emptyForm()">{{ t.close }}</button>
        </div>
      </div>

      <!-- ===== Tab：我提交的公示 ===== -->
      <template v-if="tab === 'mine'">
        <div class="budget-group" v-if="myBudgets.length">
          <h4 class="group-title">{{ t.tabMyBudgets }}（{{ myBudgets.length }}）</h4>
          <div v-for="b in myBudgets" :key="b.id" class="budget-card mine" :class="b.status">
            <div class="bc-head">
              <span class="bc-status" :class="b.status">{{ budgetStatusText(b) }}</span>
              <span class="bc-days" v-if="b.status === 'open'">{{ t.exposeDaysLeft.replace('{n}', daysLeft(b)) }}</span>
            </div>
            <div class="bc-title">
              {{ b.title || '（未命名草稿）' }}
              <span v-if="b.proposalNo" class="bc-no">{{ b.proposalNo }}</span>
            </div>
            <div class="bc-meta">
              <span>{{ t.formGroup }}: {{ b.groupName || '—' }}</span>
              <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
            </div>
            <details class="bc-detail" v-if="b.detailItems && b.detailItems.length">
              <summary>{{ t.items }}</summary>
              <table class="mini-table">
                <tbody>
                  <tr v-for="(it, i) in b.detailItems" :key="i">
                    <td>{{ it.item }}{{ it.qty > 1 ? ' ×' + it.qty : '' }}</td>
                    <td class="num">¥{{ formatAmount(it.amount) }}</td>
                    <td class="dim">{{ it.category }}</td>
                  </tr>
                </tbody>
              </table>
            </details>
            <div v-if="b.status === 'returned' && b.returnedReason" class="return-reason">
              ⚠️ {{ t.returnedReason }}：{{ b.returnedReason }}
            </div>
            <div class="bc-actions">
              <button v-if="b.status === 'returned'" class="btn-oppose primary" @click="openForm(b)">{{ t.resubmit }}</button>
              <button v-if="b.status === 'draft'" class="btn-oppose primary" @click="openForm(b)">{{ t.continueEdit }}</button>
              <span v-if="b.status === 'open'" class="oppose-hint">{{ t.inProgress }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state"><p>{{ t.mySubmitEmpty }}</p></div>
      </template>

      <!-- ===== Tab：全部公示 ===== -->
      <template v-else>
        <div v-if="openBudgets.length" class="budget-group">
          <h4 class="group-title">{{ t.inProgress }}</h4>
          <div v-for="b in openBudgets" :key="b.id" class="budget-card open" :class="{ 'hl-flash': hlId === b.id }">
            <div class="bc-head">
              <span class="bc-status open">● {{ t.inProgress }}</span>
              <span class="bc-days">{{ t.exposeDaysLeft.replace('{n}', daysLeft(b)) }}</span>
            </div>
            <div class="bc-title">{{ b.title }}<span v-if="b.proposalNo" class="bc-no">{{ b.proposalNo }}</span></div>
            <div class="bc-meta">
              <span v-if="b.activityId" class="bc-meta-item"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(b.activityId)">{{ t.activity }}: {{ activityTitle(b.activityId) }}</a></span>
              <span>{{ t.formGroup }}: {{ b.groupName || '—' }} · {{ t.proposer }}: {{ b.proposer || '—' }}</span>
              <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
            </div>
            <details class="bc-detail" v-if="b.detailItems && b.detailItems.length">
              <summary>{{ t.items }}</summary>
              <table class="mini-table">
                <tbody>
                  <tr v-for="(it, i) in b.detailItems" :key="i">
                    <td>{{ it.item }}{{ it.qty > 1 ? ' ×' + it.qty : '' }}</td>
                    <td class="num">¥{{ formatAmount(it.amount) }}</td>
                    <td class="dim">{{ it.category }}</td>
                  </tr>
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

        <div v-if="pendingSettleBudgets.length" class="budget-group">
          <h4 class="group-title">{{ t.pendingSettle }}</h4>
          <div v-for="b in pendingSettleBudgets" :key="b.id" class="budget-card pending">
            <div class="bc-head"><span class="bc-status pending">● {{ t.pendingSettle }}</span></div>
            <div class="bc-title">{{ b.title }}</div>
            <div class="bc-meta">
              <span>{{ t.formGroup }}: {{ b.groupName || '—' }} · {{ t.proposer }}: {{ b.proposer || '—' }}</span>
              <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
            </div>
            <div class="vote-row">
              <span class="vote-count">{{ t.forCount.replace('{n}', b.forCount) }} · {{ t.againstCount.replace('{n}', b.againstCount) }}</span>
              <span class="expose-ended">{{ t.exposeEnded }}</span>
            </div>
          </div>
        </div>

        <div v-if="doneBudgets.length" class="budget-group">
          <h4 class="group-title">{{ t.history }}</h4>
          <div v-for="b in doneBudgets" :key="b.id" class="budget-card done" :class="{ 'hl-flash': hlId === b.id }">
            <div class="bc-head">
              <span class="bc-status" :class="b.status">{{ budgetStatusText(b) }}</span>
              <span class="bc-days">{{ t.forCount.replace('{n}', b.forCount) }} · {{ t.againstCount.replace('{n}', b.againstCount) }}</span>
            </div>
            <div class="bc-title">{{ b.title }}<span v-if="b.proposalNo" class="bc-no">{{ b.proposalNo }}</span></div>
            <div class="bc-meta">
              <span v-if="b.activityId" class="bc-meta-item"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(b.activityId)">{{ t.activity }}: {{ activityTitle(b.activityId) }}</a></span>
              <span>{{ t.formGroup }}: {{ b.groupName || '—' }} · {{ t.proposer }}: {{ b.proposer || '—' }}</span>
              <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
            </div>
            <div v-if="b.exposeType === 'emergency'" class="emergency-tag">{{ t.emergencyTag }}</div>
          </div>
        </div>

        <div v-if="!openBudgets.length && !pendingSettleBudgets.length && !doneBudgets.length" class="empty-state"><p>{{ t.noRecords }}</p></div>
      </template>
    </template>
  </div>
</template>
