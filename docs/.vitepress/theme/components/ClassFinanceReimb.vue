<script setup>
import { ref, computed, watch } from 'vue'
import { useFinanceV2 } from '../composables/useFinanceV2.js'
import { getQueryParam } from '../utils/urlUtils.js'
import { uploadVoucherFiles, newReimbId, MAX_VOUCHER_FILES } from '../utils/voucherUpload.js'
import '../finance-styles.css'
import SkeletonBlock from './SkeletonBlock.vue'

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
function emptyItemRow() { return { item: '', category: 'dining', amount: null, note: '', date: '' } }
function emptyReimbForm() {
  return {
    id: '', activityId: '', proposalId: '',
    description: '', items: [emptyItemRow()], vouchers: [],
    uploading: false, submitting: false, msg: '',
    editingId: null,
  }
}
const reimbForm = ref(emptyReimbForm())

/* 费用性质只列支出大类（收入类 tuition/sponsor/interest 不属于报销） */
const EXPENSE_CATEGORY_KEYS = ['dining', 'marketing', 'transport', 'venue', 'speaker', 'lodging', 'ticket', 'prize', 'insurance', 'supplies', 'care', 'activityprops', 'other']
const expenseCategories = computed(() =>
  EXPENSE_CATEGORY_KEYS.filter(k => t.value.categories[k]).map(k => ({ key: k, label: t.value.categories[k] }))
)

/* 明细行：与预算公示同一套网格，金额逐行填写，总报销金额由合计派生（不手填） */
const itemsTotal = computed(() => {
  const sum = reimbForm.value.items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
  return Math.round(sum * 100) / 100
})
function addReimbItem() { reimbForm.value.items.push(emptyItemRow()) }
function removeReimbItem(i) { if (reimbForm.value.items.length > 1) reimbForm.value.items.splice(i, 1) }

const paymentVouchers = computed(() => reimbForm.value.vouchers.filter(v => v.type === 'payment'))
const proofVouchers = computed(() => reimbForm.value.vouchers.filter(v => v.type === 'proof'))
const reimbCanSubmit = computed(() => {
  const f = reimbForm.value
  if (!f.proposalId || !(itemsTotal.value > 0) || !f.description.trim()) return false
  if (!f.items.length || !f.items.every(it => String(it.item || '').trim() && Number(it.amount) > 0 && it.category)) return false
  if (paymentVouchers.value.length < 1) return false
  return true
})

function editReimb(r) {
  const items = (r.items && r.items.length)
    ? r.items.map(it => ({ item: it.item || '', category: it.category || 'other', amount: it.amount ?? null, note: it.note || '', date: it.date || '' }))
    // 旧单行数据（无 items）：把原金额/类别/事项回填成一行，日期取顶部消费日期，便于补正
    : [{ item: r.description || '报销事项', category: r.category || 'other', amount: r.amount, note: '', date: r.expenseDate || '' }]
  reimbForm.value = {
    id: r.id, activityId: r.activityId || '', proposalId: r.proposalId || '',
    description: r.description || '', items, vouchers: [...(r.vouchers || [])],
    uploading: false, submitting: false, msg: '',
    editingId: r.id,
  }
  showReimbForm.value = true
}
function newReimbForm() {
  const f = emptyReimbForm()
  f.id = newReimbId()
  reimbForm.value = f
  showReimbForm.value = true
}

/* 凭证多文件上传：图片（任意格式，自动压缩）/PDF；单文件 5MB、总数 30 的上限在工具与后端双侧校验 */
async function addVoucherFiles(type, event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return
  const f = reimbForm.value
  if (f.vouchers.length + files.length > MAX_VOUCHER_FILES) {
    f.msg = `凭证文件最多 ${MAX_VOUCHER_FILES} 个（当前已有 ${f.vouchers.length} 个）`
    return
  }
  f.uploading = true
  f.msg = ''
  try {
    const uploaded = await uploadVoucherFiles({
      files,
      token: authToken.value,
      username: currentUser.value?.username,
    })
    uploaded.forEach((r, i) => {
      let name
      if (type === 'proof') {
        // 合并区命名：发票_报销单号_序号.扩展名
        const seq = proofVouchers.value.length + i + 1
        const ext = (/\.(pdf|jpg|jpeg|png|gif|webp|heic|bmp|tiff?|avif)(\?|$)/i.exec(r.url) || [])[1] || 'jpg'
        name = `发票_${f.id}_${seq}.${ext}`
      } else {
        name = files[i].name?.slice(-40) || `付款凭证_${paymentVouchers.value.length + i + 1}`
      }
      f.vouchers.push({ type, url: r.url, name })
    })
  } catch (e) {
    f.msg = e.message || t.value.loadFailed
  } finally {
    f.uploading = false
  }
}
function removeVoucher(i) { reimbForm.value.vouchers.splice(i, 1) }

async function submitReimb() {
  const f = reimbForm.value
  if (!reimbCanSubmit.value || f.submitting) return
  f.submitting = true
  f.msg = ''
  try {
    const payload = {
      id: f.id || undefined,
      activityId: f.activityId || null, proposalId: f.proposalId || null,
      amount: itemsTotal.value,
      category: f.items[0]?.category || 'other',
      items: f.items.map(it => ({
        item: String(it.item).trim(), category: it.category,
        amount: Number(it.amount), note: String(it.note || '').trim(),
        date: String(it.date || '').trim(),
      })),
      description: f.description.trim(), vouchers: f.vouchers,
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
watch(() => router.route.path, () => {
  const v = getQueryParam('focus')
  if (v) { hlId.value = String(v); setTimeout(() => { hlId.value = '' }, 2600) }
}, { immediate: true })
</script>

<template>
  <div class="finance-page reimb">
    <div v-if="error && !loading" class="fp-state">
      {{ t.loadFailed }} <button class="link-btn" @click="loadFinance">{{ t.retry }}</button>
    </div>
    <div v-else-if="!loading && !isAuthenticated" class="empty-state"><p>{{ t.noLoginReimb }}</p></div>
    <template v-else>
      <div v-if="!loading && statusBanners.length" class="reimb-banners">
        <div v-for="(b, i) in statusBanners" :key="i" class="reimb-banner">
          <span class="banner-ico">📣</span><span class="banner-text">{{ b }}</span>
          <button class="banner-close" @click="statusBanners.splice(i, 1)">×</button>
        </div>
      </div>

      <!-- 顶栏：标题与新建按钮是静态结构，首帧即渲染；条数用值级骨架等数据 -->
      <div class="reimb-topbar">
        <span class="group-title">
          {{ canViewAllReimb ? t.allReimb : t.myReimb }}<template v-if="loading"> <SkeletonBlock width="30px" height="14px" /></template><template v-else>（{{ reimbursements.length }}）</template>
        </span>
        <button class="btn-oppose primary" :disabled="loading" @click="showReimbForm = !showReimbForm">{{ showReimbForm ? t.close : t.newReimb }}</button>
      </div>

      <!-- 新建表单：数据就绪后才允许打开 -->
      <div v-if="showReimbForm && !loading" class="reimb-form">
        <h4 class="form-title">{{ t.reimbFormTitle }}</h4>
        <div class="form-row">
          <label class="f-label">{{ t.reimbActivity }}</label>
          <select v-model="reimbForm.activityId" class="fp-select">
            <option value="">—</option>
            <option v-for="(act, id) in activitiesMap" :key="id" :value="id">{{ act.date || '' }} · {{ act.title?.[currentLang] || act.title?.zh || id }}</option>
          </select>
        </div>
        <div class="form-row">
          <label class="f-label">{{ t.reimbBudget }} *</label>
          <select v-model="reimbForm.proposalId" class="fp-select" required>
            <option value="">请选择已通过的预算公示（先公示后花钱）</option>
            <option v-for="b in passedBudgets" :key="b.id" :value="b.id">{{ b.title }} · ¥{{ formatAmount(b.amount) }}{{ b.proposalNo ? '（' + b.proposalNo + '）' : '' }}</option>
          </select>
        </div>
        <!-- 报销明细清单：每行 项目/费用性质/金额/日期(选填)/备注，总报销金额由逐行金额合计 -->
        <div class="form-row col">
          <label class="f-label">{{ t.reimbItemsTitle }} *</label>
          <div class="detail-scroll reimb-items">
            <div class="detail-table-head">
              <span class="dt-item">{{ t.itemName }} <i class="req">*</i></span>
              <span class="dt-cat">{{ t.itemCategory }} <i class="req">*</i></span>
              <span class="dt-amt">{{ t.reimbItemAmount }} <i class="req">*</i></span>
              <span class="dt-date">{{ t.itemDate }}</span>
              <span class="dt-note">{{ t.itemNote }}</span>
              <span class="dt-del"></span>
            </div>
            <div v-for="(it, i) in reimbForm.items" :key="i" class="detail-row">
              <input v-model="it.item" class="fp-input dt-item" placeholder="如：活动物料采购" />
              <select v-model="it.category" class="fp-select dt-cat">
                <option v-for="c in expenseCategories" :key="c.key" :value="c.key">{{ c.label }}</option>
              </select>
              <input v-model.number="it.amount" type="number" step="0.01" min="0" class="fp-input dt-amt" placeholder="0.00" />
              <input v-model="it.date" type="date" class="fp-input dt-date" />
              <input v-model="it.note" class="fp-input dt-note" placeholder="备注（选填）" />
              <button type="button" class="mini-del" @click="removeReimbItem(i)" :disabled="reimbForm.items.length <= 1">×</button>
            </div>
            <div class="detail-total">
              <button type="button" class="mini-add" @click="addReimbItem">{{ t.addItem }}</button>
              <span class="dt-total">{{ t.reimbTotal }}：<b>¥{{ formatAmount(itemsTotal) }}</b></span>
            </div>
          </div>
        </div>
        <div class="form-row">
          <label class="f-label">{{ t.reimbDesc }} *</label>
          <input v-model="reimbForm.description" class="fp-input" :placeholder="t.reimbDesc" />
        </div>
        <!-- 凭证两个区：付款凭证（必传，多文件）+ 发票合并区（选传，多文件），图片/PDF 均可 -->
        <div class="form-row col">
          <label class="f-label">{{ t.reimbVouchers }} *</label>
          <p class="required-hint">{{ t.requiredHintV2 }}</p>
          <div class="voucher-zones">
            <div class="voucher-zone">
              <span class="v-name">{{ t.vPayment }}（{{ paymentVouchers.length }}）</span>
              <label class="v-upload btn-oppose primary">
                {{ t.addMultiFiles }}
                <input type="file" accept="image/*,.pdf" multiple style="display:none" :disabled="reimbForm.uploading" @change="addVoucherFiles('payment', $event)" />
              </label>
              <div v-for="(v, i) in paymentVouchers" :key="v.url" class="v-file">
                <a :href="v.url" target="_blank" rel="noopener">{{ v.name }}</a>
                <button class="v-rm" @click="removeVoucher(reimbForm.vouchers.indexOf(v))">×</button>
              </div>
            </div>
            <div class="voucher-zone">
              <span class="v-name">{{ t.vProof }}（{{ proofVouchers.length }}）</span>
              <label class="v-upload btn-oppose">
                {{ t.addMultiFiles }}
                <input type="file" accept="image/*,.pdf" multiple style="display:none" :disabled="reimbForm.uploading" @change="addVoucherFiles('proof', $event)" />
              </label>
              <div v-for="(v, i) in proofVouchers" :key="v.url" class="v-file">
                <a :href="v.url" target="_blank" rel="noopener">{{ v.name }}</a>
                <button class="v-rm" @click="removeVoucher(reimbForm.vouchers.indexOf(v))">×</button>
              </div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <span v-if="reimbForm.msg" class="oppose-msg">{{ reimbForm.msg }}</span>
          <button class="btn-oppose primary" :disabled="!reimbCanSubmit || reimbForm.submitting || reimbForm.uploading" @click="submitReimb">
            {{ reimbForm.uploading ? t.uploading : reimbForm.submitting ? t.submitting : (reimbForm.editingId ? t.needRevise : t.submit) }}
          </button>
          <button v-if="reimbForm.editingId" class="btn-ghost" @click="reimbForm = emptyReimbForm(); showReimbForm = false">{{ t.close }}</button>
        </div>
      </div>

      <!-- 列表：加载中 → 真实报销卡壳 + 值级骨架；数据到手后原位切换 -->
      <div v-if="loading" class="reimb-list" aria-hidden="true">
        <div v-for="n in 3" :key="n" class="reimb-card reimb-card--sk">
          <div class="rc-head">
            <SkeletonBlock width="64px" height="20px" radius="12px" />
            <SkeletonBlock width="72px" height="12px" />
          </div>
          <div class="rc-title"><SkeletonBlock width="58%" height="15px" /></div>
          <div class="rc-meta">
            <SkeletonBlock width="96px" height="12px" />
            <SkeletonBlock width="84px" height="12px" />
          </div>
          <div class="rc-items">
            <SkeletonBlock width="100%" height="12px" />
            <div style="height:8px"></div>
            <SkeletonBlock width="62%" height="12px" />
          </div>
          <div class="rc-foot"><SkeletonBlock width="120px" height="13px" /></div>
        </div>
      </div>
      <div class="reimb-list" v-else-if="reimbursements.length">
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
          </div>
          <!-- 明细清单：一行一条，网格与表单一致；旧数据（无 items）按原金额单行兜底 -->
          <div class="rc-items">
            <div class="rc-items-head">
              <span class="ci-idx">#</span>
              <span class="ci-name">{{ t.itemName }}</span>
              <span class="ci-cat">{{ t.itemCategory }}</span>
              <span class="ci-amt">{{ t.reimbItemAmount }}</span>
              <span class="ci-date">{{ t.itemDate }}</span>
              <span class="ci-note">{{ t.itemNote }}</span>
            </div>
            <div v-for="(it, i) in (r.items && r.items.length ? r.items : [{ item: r.description || '—', category: r.category, amount: r.amount, note: '', date: r.expenseDate || '' }])" :key="i" class="rc-item-row">
              <span class="ci-idx">{{ i + 1 }}</span>
              <span class="ci-name">{{ it.item || '—' }}</span>
              <span class="ci-cat">{{ t.categories[it.category] || it.category || '—' }}</span>
              <span class="ci-amt">¥{{ formatAmount(it.amount) }}</span>
              <span class="ci-date">{{ it.date || '—' }}</span>
              <span class="ci-note">{{ it.note || '' }}</span>
            </div>
            <div class="rc-items-total">{{ t.reimbTotal }}：<b>¥{{ formatAmount(r.amount) }}</b><span v-if="(r.items || []).length > 1" class="ci-count">（{{ r.items.length }}{{ t.itemCountUnit }}）</span></div>
          </div>
          <div class="rc-foot">
            <button v-if="r.vouchers && r.vouchers.length" class="link-btn" @click="openVouchers(r)">📎 {{ t.voucher }} ({{ r.vouchers.length }})</button>
            <span v-if="r.auditNote" class="rc-note">{{ t.auditNote }}: {{ r.auditNote }}</span>
            <button v-if="r.status === 'need_revision'" class="link-btn" @click="editReimb(r)">{{ t.needRevise }}</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state"><p>{{ t.emptyReimb }}</p></div>
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
