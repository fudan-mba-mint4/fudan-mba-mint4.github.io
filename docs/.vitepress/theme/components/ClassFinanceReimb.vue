<script setup>
import { ref, computed, watch } from 'vue'
import { useFinanceV2 } from '../composables/useFinanceV2.js'
import '../finance-styles.css'

const {
  t, currentLang, loading, error, loadFinance, isAuthenticated, currentUser, authToken, router,
  reimbursements, canViewAllReimb, config, passedBudgets, activitiesMap,
  activityTitle, gotoActivity, gotoBudget, formatAmount, formatDate,
  reimbStatusLabel, voucherTypeLabel, isImage,
} = useFinanceV2()

/* 报销状态变化提示：提交后若被通过/驳回/退回补正，进入页面时提示 */
const statusBanners = ref([])
function checkReimbStatusChange() {
  const KEY = 'mint4_reimb_snap'
  let snap = {}
  try { snap = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) {}
  const myName = currentUser?.value?.name || ''
  const mine = reimbursements.value.filter(r => (canViewAllReimb.value ? (r.applicant === myName) : true))
  const next = {}
  const banners = []
  for (const r of mine) {
    next[r.id] = r.status
    const prev = snap[r.id]
    if (prev && prev !== r.status) {
      const note = r.auditNote ? `：${r.auditNote}` : ''
      banners.push(`「${r.description || '报销单'}」${reimbStatusLabel(r.status)}${note}`)
    }
  }
  if (banners.length) statusBanners.value = banners
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch (e) {}
}
watch(reimbursements, () => checkReimbStatusChange(), { immediate: true })

const showReimbForm = ref(false)
function emptyReimbForm() {
  return {
    activityId: '', proposalId: '', expenseDate: '', amount: null,
    category: 'dining', description: '', vouchers: [],
    endorserName: '', uploading: false, submitting: false, msg: '',
    editingId: null,
  }
}
const reimbForm = ref(emptyReimbForm())

const requiredVouchers = computed(() => {
  const amt = Number(reimbForm.value.amount) || 0
  return amt >= (config.value.largeAmount || 500) ? (config.value.largeVouchers || ['invoice', 'payment']) : (config.value.smallVouchers || ['payment', 'receipt'])
})
const needsEndorsement = computed(() => {
  const amt = Number(reimbForm.value.amount) || 0
  const have = new Set(reimbForm.value.vouchers.map(v => v.type))
  return amt >= (config.value.largeAmount || 500) && !have.has('invoice')
})
const requiredHintText = computed(() => {
  const amt = Number(reimbForm.value.amount) || 0
  const list = requiredVouchers.value.map(v => t.value['v' + v[0].toUpperCase() + v.slice(1)]).join('、')
  return amt >= (config.value.largeAmount || 500)
    ? t.value.requiredHint.replace('{n}', config.value.largeAmount).replace('{list}', list)
    : t.value.requiredHintSmall.replace('{n}', config.value.largeAmount).replace('{list}', list)
})
const reimbCanSubmit = computed(() => {
  const f = reimbForm.value
  if (!f.expenseDate || !(Number(f.amount) > 0) || !f.description.trim()) return false
  const have = new Set(f.vouchers.map(v => v.type))
  if (!requiredVouchers.value.every(v => have.has(v))) return false
  if (needsEndorsement.value && !String(f.endorserName || '').trim()) return false
  return true
})

function editReimb(r) {
  reimbForm.value = {
    activityId: r.activityId || '', proposalId: r.proposalId || '',
    expenseDate: r.expenseDate || '', amount: r.amount, category: r.category || 'dining',
    description: r.description || '', vouchers: [...(r.vouchers || [])],
    endorserName: r.endorsement?.committee?.name || '', uploading: false, submitting: false, msg: '',
    editingId: r.id,
  }
  showReimbForm.value = true
}
function newReimbForm() { reimbForm.value = emptyReimbForm(); showReimbForm.value = true }

function bytesToBase64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  return btoa(bin)
}
async function compressImage(file, maxEdge, quality) {
  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = url
  })
  let { width, height } = img
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  width = Math.round(width * scale); height = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  URL.revokeObjectURL(img.src)
  return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
}
async function addVoucherFile(type, event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const f = reimbForm.value
  f.uploading = true
  f.msg = ''
  try {
    const isPdf = file.type === 'application/pdf'
    let dataBase64, contentType
    if (isPdf) {
      const buf = await file.arrayBuffer()
      dataBase64 = bytesToBase64(new Uint8Array(buf))
      contentType = 'application/pdf'
    } else {
      const blob = await compressImage(file, 2000, 0.85)
      dataBase64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
      contentType = blob.type
    }
    if (dataBase64.length > 14 * 1024 * 1024) { f.msg = t.value.loadFailed; return }
    const username = (currentUser?.value?.username || 'guest').replace(/[^\w-]/g, '_')
    const safeName = file.name.replace(/[^\w.\-]/g, '_').slice(-60)
    const key = `receipts/${username}/${Date.now()}-${safeName}`
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({ key, contentType, dataBase64 }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { f.msg = json.error || t.value.loadFailed; return }
    const idx = f.vouchers.findIndex(v => v.type === type)
    if (idx >= 0) f.vouchers.splice(idx, 1)
    f.vouchers.push({ type, url: json.url, name: file.name.slice(-40) })
  } catch (e) { f.msg = t.value.loadFailed }
  finally { f.uploading = false }
}
function removeVoucher(i) { reimbForm.value.vouchers.splice(i, 1) }

async function submitReimb() {
  const f = reimbForm.value
  if (!reimbCanSubmit.value || f.submitting) return
  f.submitting = true
  f.msg = ''
  try {
    const endorsement = needsEndorsement.value ? { committee: { name: String(f.endorserName || '').trim() } } : null
    const payload = {
      id: f.editingId || undefined,
      activityId: f.activityId || null, proposalId: f.proposalId || null,
      expenseDate: f.expenseDate, amount: Number(f.amount), category: f.category,
      description: f.description.trim(), vouchers: f.vouchers, endorsement,
    }
    const res = await fetch('/api/finance/reimbursements', {
      method: f.editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      f.msg = f.editingId ? t.value.needRevise + ' ✓' : t.value.successSubmitted
      showReimbForm.value = false
      reimbForm.value = emptyReimbForm()
      await loadFinance()
    } else f.msg = json.error || t.value.loadFailed
  } catch (e) { f.msg = t.value.loadFailed }
  finally { f.submitting = false }
}

const voucherView = ref(null)
const openVouchers = (r) => { voucherView.value = { title: r.description, vouchers: r.vouchers } }
const closeVouchers = () => { voucherView.value = null }
const hlId = ref('')
watch(() => router.route?.query?.focus, (v) => {
  if (v) { hlId.value = String(v); setTimeout(() => { hlId.value = '' }, 2600) }
}, { immediate: true })
</script>

<template>
  <div class="finance-page reimb">
    <div class="demo-banner">{{ t.demoNotice }}</div>
    <div v-if="loading" class="fp-state">{{ t.loading }}</div>
    <div v-else-if="error" class="fp-state">
      {{ t.loadFailed }} <button class="link-btn" @click="loadFinance">{{ t.retry }}</button>
    </div>
    <template v-else>
      <div class="section-header">
        <h3 class="section-title">{{ t.reimbTitle }}</h3>
        <span class="section-desc">{{ t.reimbDesc }}</span>
      </div>
      <div v-if="statusBanners.length" class="reimb-banners">
        <div v-for="(b, i) in statusBanners" :key="i" class="reimb-banner">
          <span class="banner-ico">📣</span><span class="banner-text">{{ b }}</span>
          <button class="banner-close" @click="statusBanners.splice(i, 1)">×</button>
        </div>
      </div>
      <div v-if="!isAuthenticated" class="empty-state"><p>{{ t.noLoginReimb }}</p></div>
      <template v-else>
        <div class="reimb-topbar">
          <span class="group-title">{{ canViewAllReimb ? t.allReimb : t.myReimb }}（{{ reimbursements.length }}）</span>
          <button class="btn-oppose primary" @click="showReimbForm = !showReimbForm">{{ showReimbForm ? t.close : t.newReimb }}</button>
        </div>

        <!-- 新建表单 -->
        <div v-if="showReimbForm" class="reimb-form">
          <h4 class="form-title">{{ t.reimbFormTitle }}</h4>
          <div class="form-row">
            <label class="f-label">{{ t.reimbActivity }}</label>
            <select v-model="reimbForm.activityId" class="fp-select">
              <option value="">—</option>
              <option v-for="(act, id) in activitiesMap" :key="id" :value="id">{{ act.date || '' }} · {{ act.title?.[currentLang] || act.title?.zh || id }}</option>
            </select>
          </div>
          <div class="form-row">
            <label class="f-label">{{ t.reimbBudget }}</label>
            <select v-model="reimbForm.proposalId" class="fp-select">
              <option value="">—</option>
              <option v-for="b in passedBudgets" :key="b.id" :value="b.id">{{ b.title }}</option>
            </select>
          </div>
          <div class="form-row">
            <label class="f-label">{{ t.reimbDate }} *</label>
            <input v-model="reimbForm.expenseDate" type="date" class="fp-input" />
          </div>
          <div class="form-row">
            <label class="f-label">{{ t.reimbAmount }} *</label>
            <input v-model.number="reimbForm.amount" type="number" step="0.01" min="0" class="fp-input" placeholder="0.00" />
          </div>
          <div class="form-row">
            <label class="f-label">{{ t.reimbCategory }}</label>
            <select v-model="reimbForm.category" class="fp-select">
              <option v-for="(label, key) in t.categories" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div class="form-row">
            <label class="f-label">{{ t.reimbDesc }} *</label>
            <input v-model="reimbForm.description" class="fp-input" :placeholder="t.reimbDesc" />
          </div>
          <div class="form-row col">
            <label class="f-label">{{ t.reimbVouchers }} *</label>
            <p class="required-hint">{{ requiredHintText }}</p>
            <div class="voucher-grid">
              <div v-for="type in ['invoice', 'payment', 'receipt', 'other']" :key="type" class="voucher-cell">
                <span class="v-name">{{ voucherTypeLabel(type) }}</span>
                <label class="v-upload btn-oppose" :class="{ primary: reimbForm.vouchers.some(v => v.type === type) }">
                  {{ reimbForm.vouchers.some(v => v.type === type) ? t.uploaded + ' ✓' : t.uploadVoucher }}
                  <input type="file" accept="image/*,.pdf" style="display:none" @change="addVoucherFile(type, $event)" />
                </label>
                <div v-for="(v, i) in reimbForm.vouchers.filter(x => x.type === type)" :key="i" class="v-file">
                  <a :href="v.url" target="_blank" rel="noopener">{{ v.name }}</a>
                  <button class="v-rm" @click="removeVoucher(reimbForm.vouchers.indexOf(v))">×</button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-row col" v-if="needsEndorsement">
            <label class="f-label">{{ t.endorsementTitle }}</label>
            <input v-model="reimbForm.endorserName" class="fp-input" :placeholder="t.endorserName" />
            <p class="required-hint">{{ t.endorserHint.replace('{n}', config.largeAmount || 500) }}</p>
          </div>
          <div class="form-actions">
            <span v-if="reimbForm.msg" class="oppose-msg">{{ reimbForm.msg }}</span>
            <button class="btn-oppose primary" :disabled="!reimbCanSubmit || reimbForm.submitting || reimbForm.uploading" @click="submitReimb">
              {{ reimbForm.submitting ? t.submitting : (reimbForm.editingId ? t.needRevise : t.submit) }}
            </button>
            <button v-if="reimbForm.editingId" class="btn-ghost" @click="reimbForm = emptyReimbForm(); showReimbForm = false">{{ t.close }}</button>
          </div>
        </div>

        <!-- 列表 -->
        <div class="reimb-list" v-if="reimbursements.length">
          <div v-for="r in reimbursements" :key="r.id" class="reimb-card" :class="{ 'hl-flash': hlId === r.id }">
            <div class="rc-head">
              <span class="rc-status" :class="r.status">{{ reimbStatusLabel(r.status) }}</span>
              <span class="rc-date">{{ formatDate(r.createdAt) }}</span>
            </div>
            <div class="rc-title">{{ r.description || '—' }}</div>
            <div class="rc-meta">
              <span v-if="r.activityId"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(r.activityId)">{{ t.activity }}: {{ activityTitle(r.activityId) }}</a></span>
              <span v-if="r.proposalId"><a class="link-activity" href="#" @click.prevent.stop="gotoBudget(r.proposalId)">{{ t.relatedBudget }}</a></span>
              <span v-if="canViewAllReimb">{{ t.payer }}: {{ r.applicant }}</span>
              <span class="rc-amount">¥{{ formatAmount(r.amount) }}</span>
            </div>
            <div class="rc-foot">
              <button v-if="r.vouchers && r.vouchers.length" class="link-btn" @click="openVouchers(r)">📎 {{ t.voucher }} ({{ r.vouchers.length }})</button>
              <span v-if="r.endorsement?.committee?.name" class="rc-note">{{ t.endorsementTitle }}: {{ r.endorsement.committee.name }}</span>
              <span v-if="r.auditNote" class="rc-note">{{ t.auditNote }}: {{ r.auditNote }}</span>
              <button v-if="r.status === 'need_revision'" class="link-btn" @click="editReimb(r)">{{ t.needRevise }}</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state"><p>{{ t.emptyReimb }}</p></div>
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
