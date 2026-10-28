<template>
  <div class="profile-page">
    <!-- 未登录提示 -->
    <div v-if="!isAuthenticated" class="profile-login-prompt">
      <div class="prompt-card">
        <div class="prompt-icon">🔐</div>
        <h2>请先登录</h2>
        <p>登录后可查看个人信息、活动报名记录等</p>
        <button class="prompt-btn" @click="goToAuth">去登录 / 注册</button>
      </div>
    </div>

    <!-- 已登录 -->
    <div v-else class="profile-container">
      <!-- 顶部用户卡片 -->
      <div class="profile-header">
        <div class="avatar">{{ avatarText }}</div>
        <div class="user-info">
          <h1 class="user-name">{{ currentUser.name }}</h1>
          <p class="user-meta">
            <span v-if="currentUser.nickname">{{ currentUser.nickname }}</span>
            <span v-if="currentUser.nickname && currentUser.group_no"> · </span>
            <span v-if="currentUser.group_no">第 {{ currentUser.group_no }} 组</span>
          </p>
          <p class="user-username">@{{ currentUser.username }}</p>
        </div>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>

      <div class="profile-content">
        <!-- 个人信息编辑 -->
        <div class="profile-section">
          <h2 class="section-title">个人信息</h2>
          <div class="info-card">
            <div class="info-row">
              <div class="info-group">
                <label class="info-label">真实姓名</label>
                <input v-model="editForm.name" class="info-input" />
              </div>
              <div class="info-group">
                <label class="info-label">小组</label>
                <select v-model="editForm.group_no" class="info-input">
                  <option :value="null">未选择</option>
                  <option v-for="n in 6" :key="n" :value="n">第 {{ n }} 组</option>
                </select>
              </div>
            </div>
            <div class="info-row">
              <div class="info-group">
                <label class="info-label">用户名（不可修改）</label>
                <input :value="currentUser.username" class="info-input" disabled />
              </div>
              <div class="info-group">
                <label class="info-label">花名/昵称</label>
                <input v-model="editForm.nickname" class="info-input" placeholder="选填" />
              </div>
            </div>
            <div class="save-row">
              <button class="save-btn" @click="handleSave" :disabled="saving">
                {{ saving ? '保存中...' : '保存修改' }}
              </button>
              <span v-if="saveMsg" class="save-msg" :class="saveMsgType">{{ saveMsg }}</span>
            </div>
          </div>
        </div>

        <!-- 修改密码 -->
        <div class="profile-section">
          <h2 class="section-title">修改密码</h2>
          <div class="info-card">
            <div class="info-row">
              <div class="info-group">
                <label class="info-label">旧密码</label>
                <input v-model="pwdForm.oldPassword" type="password" class="info-input" placeholder="请输入旧密码" autocomplete="current-password" />
              </div>
              <div class="info-group"></div>
            </div>
            <div class="info-row">
              <div class="info-group">
                <label class="info-label">新密码</label>
                <input v-model="pwdForm.newPassword" type="password" class="info-input" placeholder="至少6位" autocomplete="new-password" />
              </div>
              <div class="info-group">
                <label class="info-label">确认新密码</label>
                <input v-model="pwdForm.confirmPassword" type="password" class="info-input" placeholder="再次输入新密码" autocomplete="new-password" />
              </div>
            </div>
            <div class="save-row">
              <button class="save-btn" @click="handleChangePassword" :disabled="pwdSaving">
                {{ pwdSaving ? '修改中...' : '确认修改' }}
              </button>
              <span v-if="pwdMsg" class="save-msg" :class="pwdMsgType">{{ pwdMsg }}</span>
            </div>
          </div>
        </div>

        <!-- 我的报名 -->
        <div class="profile-section">
          <h2 class="section-title">我的活动报名</h2>
          <div v-if="mySignups.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>还没有报名任何活动</p>
            <button class="empty-btn" @click="goToActivities">去看看活动</button>
          </div>
          <div v-else class="signup-list">
            <div v-for="signup in mySignups" :key="signup.eventId" class="signup-item">
              <div class="signup-info">
                <h3 class="signup-title">{{ signup.title }}</h3>
                <p class="signup-meta">
                  <span>{{ signup.date }}</span>
                  <span v-if="signup.location"> · {{ signup.location }}</span>
                </p>
                <span class="signup-status signed">已报名</span>
              </div>
              <button class="cancel-signup-btn" @click="cancelSignup(signup.eventId)">取消报名</button>
            </div>
          </div>
        </div>

        <!-- 薄荷币（个人层：钱包 / 申报 / 明细） -->
        <div class="profile-section" id="coins">
          <h2 class="section-title">🍃 薄荷币</h2>
          <div class="mc-wallet-card" :class="'tier-' + (coinMe?.account?.tier?.key || 'none')">
            <div class="mc-wallet-left">
              <div class="mc-balance">{{ coinMe?.account?.balance ?? '–' }}<span class="mc-balance-unit">币</span></div>
              <div class="mc-wallet-sub">累计获得 {{ coinMe?.account?.earned ?? 0 }} · 已花费 {{ coinMe?.account?.spent ?? 0 }}</div>
            </div>
            <div class="mc-wallet-right">
              <span class="mc-tier-icon">{{ tierIcon }}</span>
              <span class="mc-tier-name">{{ tierName }}</span>
            </div>
          </div>
          <button v-if="!isViewerOnly" class="claim-btn" @click="openClaim" :disabled="coinLoading">{{ coinLoading ? '加载中...' : '＋ 贡献申报' }}</button>
          <p v-else class="viewer-only-hint">班主任与传承人仅可查看，不能参与薄荷币申报</p>

          <h3 class="mc-sub-title">我的申报</h3>
          <div v-if="coinMe?.claims?.length" class="claim-list">
            <div v-for="c in coinMe.claims" :key="c.id" class="claim-item" :class="'claim-' + c.status">
              <div class="claim-top">
                <span class="claim-title">{{ c.title }}</span>
                <span v-if="c.isDemo" class="mc-demo">演示</span>
                <span class="claim-status" :class="c.status">{{ statusText(c.status) }}</span>
              </div>
              <div class="claim-meta">
                <span class="claim-total">+{{ c.total }} 币</span>
                <span> · {{ shortDate(c.createdAt) }}</span>
                <span v-if="c.status === 'rejected' && c.auditNote" class="claim-reason"> · 驳回原因：{{ c.auditNote }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="coinMe" class="empty-state">
            <div class="empty-icon">🍃</div>
            <p>还没有申报记录，为班级做点事，赚第一枚薄荷币吧</p>
          </div>

          <h3 v-if="coinMe?.ledgers?.length" class="mc-sub-title">收支明细</h3>
          <div v-if="coinMe?.ledgers?.length" class="ledger-list">
            <div v-for="l in coinMe.ledgers.slice(0, 8)" :key="l.id" class="ledger-item">
              <span class="ledger-delta" :class="l.delta > 0 ? 'earn' : 'spend'">{{ l.delta > 0 ? '+' : '' }}{{ l.delta }}</span>
              <span class="ledger-note">{{ l.note || '—' }}</span>
              <span v-if="l.isDemo" class="mc-demo">演示</span>
              <time class="ledger-date">{{ shortDate(l.createdAt) }}</time>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 贡献申报弹层 -->
    <div v-if="showClaim" class="claim-modal-mask" @click.self="showClaim = false">
      <div class="claim-modal" role="dialog" aria-modal="true" aria-label="贡献申报">
        <h3 class="claim-modal-title">🍃 贡献申报</h3>
        <p class="claim-modal-sub">申报你做过的贡献，班委审核通过后薄荷币入账。凭据清晰，通过更快。</p>
        <form @submit.prevent="submitClaimForm">
          <div class="form-group">
            <label class="info-label">奖励规则 <span class="required">*</span></label>
            <select v-model="claimForm.ruleId" class="info-input" @change="onRuleChange" required>
              <option value="">请选择规则</option>
              <option v-for="r in coinMe?.rules || []" :key="r.id" :value="r.id">{{ r.name.zh }}（+{{ r.amount }} 币）</option>
            </select>
          </div>
          <div class="form-group">
            <label class="info-label">申报标题 <span class="required">*</span></label>
            <input v-model="claimForm.title" class="info-input" maxlength="60" required placeholder="如：参与 11 月班级团建" />
          </div>
          <div class="form-group">
            <label class="info-label">说明</label>
            <textarea v-model="claimForm.description" class="info-input" rows="3" maxlength="500" placeholder="做了什么、什么时候、结果如何（选填）"></textarea>
          </div>
          <div class="form-group">
            <label class="info-label">证明图片（选填，最多 3 张）</label>
            <div class="proof-row">
              <button type="button" class="proof-add" @click="fileInput.click()" :disabled="claimForm.proofs.length >= 3">＋ 添加图片</button>
              <div v-for="(u, i) in claimForm.proofs" :key="i" class="proof-thumb" :style="{ backgroundImage: `url(${u})` }" @click="removeProof(i)">
                <span class="proof-x">×</span>
              </div>
            </div>
            <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onProofFiles" />
          </div>
          <div class="claim-actions">
            <button type="button" class="claim-cancel" @click="showClaim = false">取消</button>
            <button type="submit" class="claim-submit" :disabled="claimSubmitting">{{ claimSubmitting ? '提交中...' : '提交申报' }}</button>
          </div>
          <p v-if="claimMsg" class="claim-msg" :class="claimMsgType">{{ claimMsg }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vitepress'
import { useAuth } from '../composables/useAuth.js'
import { useData } from '../composables/useData.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'
import { useCoins } from '../composables/useCoins.js'
import { markRead } from '../composables/useUnread.js'

const router = useRouter()
import { API_PREFIX } from '../composables/apiConfig.js'
const { currentUser, isAuthenticated, isViewerOnly, logout, updateProfile, changePassword, authToken } = useAuth()
const { data: activitiesData } = useData('/data/activities.json', { dbUrl: '/api/activities-db' })
const { me: coinMe, fetchMe, submitClaim } = useCoins()
const coinLoading = ref(false)

const saving = ref(false)
const saveMsg = ref('')
const saveMsgType = ref('success')
const editForm = ref({ name: '', nickname: '', group_no: null })

// 修改密码
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdSaving = ref(false)
const pwdMsg = ref('')
const pwdMsgType = ref('success')
const mySignups = ref([])

// 薄荷币申报
const showClaim = ref(false)
const claimForm = ref({ ruleId: '', title: '', description: '', proofs: [] })
const claimSubmitting = ref(false)
const claimMsg = ref('')
const claimMsgType = ref('success')
const fileInput = ref(null)

const avatarText = computed(() => {
  if (!currentUser.value) return '?'
  return currentUser.value.name?.charAt(0) || '?'
})

// —— 薄荷币：成长标识 ——
const TIER_META = {
  sprout: { icon: '🌱' }, leaf: { icon: '🍃' }, bush: { icon: '🌿' }, king: { icon: '👑' },
}
const tierIcon = computed(() => {
  const k = coinMe.value?.account?.tier?.key
  return k ? (TIER_META[k]?.icon || '🍃') : '—'
})
const tierName = computed(() => {
  const t = coinMe.value?.account?.tier
  return t ? t.zh : '尚未获得'
})

// 初始化编辑表单 + 登录态恢复后加载薄荷币
watch(currentUser, (user) => {
  if (user) {
    editForm.value = {
      name: user.name || '',
      nickname: user.nickname || '',
      student_id: user.student_id || '',
      group_no: user.group_no || null,
    }
  }
  loadCoins()
}, { immediate: true })

// 加载我的报名（从API加载）
async function loadMySignups() {
  if (!currentUser.value) {
    mySignups.value = []
    return
  }
  try {
    const activities = activitiesData.value?.activities || []
    const userSignups = []
    for (const act of activities) {
      const res = await fetchWithRetry(`${API_PREFIX}/api/activities/${act.id}/signups`)
      if (res.ok) {
        const result = await res.json()
        if (result.data?.some(s => s.username === currentUser.value.username)) {
          userSignups.push({
            eventId: act.id,
            title: act.title,
            date: act.date,
            location: act.location,
          })
        }
      }
    }
    mySignups.value = userSignups.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  } catch (e) {
    console.warn('加载我的报名失败:', e.message)
    mySignups.value = []
  }
}

onMounted(() => {
  loadMySignups()
  loadCoins()
})

watch(activitiesData, () => {
  loadMySignups()
})

async function loadCoins() {
  if (!isAuthenticated.value) return
  coinLoading.value = true
  const d = await fetchMe(true)
  if (d) markRead('coins', (d.claims || []).map(c => `${c.id}:${c.status}`))
  coinLoading.value = false
}

// —— 薄荷币：申报 ——
function openClaim() {
  claimForm.value = { ruleId: '', title: '', description: '', proofs: [] }
  claimMsg.value = ''
  showClaim.value = true
}
function onRuleChange() {
  const r = coinMe.value?.rules?.find(x => x.id === claimForm.value.ruleId)
  if (r) claimForm.value.title = r.name.zh
}
async function onProofFiles(e) {
  const files = Array.from(e.target.files || [])
    .filter(f => /^image\//.test(f.type))
    .slice(0, 3 - claimForm.value.proofs.length)
  for (const f of files) {
    const url = await compressUpload(f)
    if (url) claimForm.value.proofs.push(url)
  }
  e.target.value = ''
}
async function compressUpload(file) {
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = () => rej(new Error('图片解析失败'))
      i.src = URL.createObjectURL(file)
    })
    const maxSide = 1600
    let { width, height } = img
    if (Math.max(width, height) > maxSide) {
      const s = maxSide / Math.max(width, height)
      width = Math.round(width * s); height = Math.round(height * s)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    const dataBase64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1]
    const key = `proofs/${currentUser.value.username}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const res = await fetchWithRetry(`${API_PREFIX}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({ key, contentType: 'image/jpeg', dataBase64 }),
    })
    const j = await res.json().catch(() => ({}))
    return j.url || ''
  } catch (e) {
    console.warn('上传失败:', e)
    return ''
  }
}
function removeProof(i) {
  claimForm.value.proofs.splice(i, 1)
}
async function submitClaimForm() {
  if (!claimForm.value.ruleId || !claimForm.value.title.trim()) return
  claimSubmitting.value = true
  claimMsg.value = ''
  const res = await submitClaim({
    ruleId: claimForm.value.ruleId,
    title: claimForm.value.title.trim(),
    description: claimForm.value.description,
    proofs: claimForm.value.proofs,
  })
  if (res.ok) {
    claimMsg.value = '申报已提交，等待班委审核'
    claimMsgType.value = 'success'
    setTimeout(() => { showClaim.value = false; loadCoins() }, 1200)
  } else {
    claimMsg.value = res.error || '提交失败，请重试'
    claimMsgType.value = 'error'
  }
  claimSubmitting.value = false
}
function statusText(s) {
  return s === 'pending' ? '待审核' : s === 'approved' ? '已通过 ✓' : '已驳回'
}
function shortDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) } catch { return '' }
}

async function handleSave() {
  saving.value = true
  saveMsg.value = ''
  const result = await updateProfile(editForm.value)
  if (result.success) {
    saveMsg.value = '保存成功'
    saveMsgType.value = 'success'
  } else {
    saveMsg.value = result.error || '保存失败'
    saveMsgType.value = 'error'
  }
  saving.value = false
  setTimeout(() => { saveMsg.value = '' }, 3000)
}

function handleLogout() {
  logout()
  router.go('/')
}

async function handleChangePassword() {
  pwdMsg.value = ''
  // 前端校验
  if (!pwdForm.value.oldPassword) {
    pwdMsg.value = '请输入旧密码'
    pwdMsgType.value = 'error'
    return
  }
  if (!pwdForm.value.newPassword || pwdForm.value.newPassword.length < 6) {
    pwdMsg.value = '新密码至少6位'
    pwdMsgType.value = 'error'
    return
  }
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    pwdMsg.value = '两次输入的新密码不一致'
    pwdMsgType.value = 'error'
    return
  }

  pwdSaving.value = true
  try {
    const result = await changePassword(pwdForm.value)
    if (result.success) {
      pwdMsg.value = '密码修改成功'
      pwdMsgType.value = 'success'
      pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      pwdMsg.value = result.error || '修改失败'
      pwdMsgType.value = 'error'
    }
  } catch (e) {
    pwdMsg.value = '修改失败：' + e.message
    pwdMsgType.value = 'error'
  } finally {
    pwdSaving.value = false
    setTimeout(() => { pwdMsg.value = '' }, 3000)
  }
}

function goToAuth() {
  router.go('/auth/')
}

function goToActivities() {
  router.go('/activities/')
}

async function cancelSignup(eventId) {
  if (!confirm('确定取消报名这个活动吗？')) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/activities/${eventId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.value}`,
      },
    })
    if (res.ok) {
      loadMySignups()
    } else {
      alert('取消失败，请重试')
    }
  } catch (e) {
    alert('网络错误，请稍后重试')
  }
}
</script>

<style scoped>
.profile-page { max-width: 800px; margin: 0 auto; padding: 32px 20px; min-height: 70vh; }

/* 未登录提示 */
.profile-login-prompt { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.prompt-card { text-align: center; background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 20px; padding: 48px 40px; max-width: 360px; }
.prompt-icon { font-size: 48px; margin-bottom: 16px; }
.prompt-card h2 { font-size: 20px; margin: 0 0 8px; }
.prompt-card p { color: var(--c-text-secondary); font-size: 14px; margin: 0 0 24px; }
.prompt-btn { padding: 12px 32px; background: var(--c-accent); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; }
.prompt-btn:hover { opacity: 0.9; }

/* 顶部用户卡片 */
.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-accent), #1a5c50);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.user-meta { font-size: 14px; color: var(--c-text-secondary); margin: 0 0 2px; }
.user-email { font-size: 13px; color: var(--c-text-tertiary); margin: 0; }
.logout-btn {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 13px;
  color: var(--c-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}
.logout-btn:hover { border-color: #ff3b30; color: #ff3b30; }

/* 内容区 */
.profile-content { display: flex; flex-direction: column; gap: 24px; }
.profile-section { }
.section-title { font-size: 17px; font-weight: 700; margin: 0 0 14px; }

/* 信息卡片 */
.info-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 24px;
}
.info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.info-row:last-of-type { margin-bottom: 0; }
.info-group { display: flex; flex-direction: column; gap: 6px; }
.info-label { font-size: 13px; font-weight: 600; color: var(--c-text-primary); }
.info-input {
  padding: 10px 14px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 14px;
  background: var(--c-bg-secondary);
  color: var(--c-text-primary);
  font-family: inherit;
  box-sizing: border-box;
}
.info-input:focus { outline: none; border-color: var(--c-accent); }
.info-input:disabled { opacity: 0.5; cursor: not-allowed; }
.save-row { display: flex; align-items: center; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--c-border); }
.save-btn {
  padding: 10px 24px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.save-btn:hover:not(:disabled) { opacity: 0.9; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.save-msg { font-size: 13px; }
.save-msg.success { color: #34c759; }
.save-msg.error { color: #ff3b30; }

/* 报名列表 */
.empty-state {
  text-align: center;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 40px 20px;
}
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-state p { color: var(--c-text-secondary); font-size: 14px; margin: 0 0 16px; }
.empty-btn {
  padding: 10px 24px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.empty-btn:hover { opacity: 0.9; }

.signup-list { display: flex; flex-direction: column; gap: 10px; }
.signup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  padding: 18px 20px;
  gap: 16px;
}
.signup-info { flex: 1; min-width: 0; }
.signup-title { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
.signup-meta { font-size: 13px; color: var(--c-text-secondary); margin: 0 0 6px; }
.signup-status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.signup-status.signed { background: rgba(52, 199, 89, 0.15); color: #34c759; }
.cancel-signup-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #ff3b30;
  color: #ff3b30;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}
.cancel-signup-btn:hover { background: #ff3b30; color: #fff; }

@media (max-width: 640px) {
  .profile-header { flex-direction: column; text-align: center; }
  .info-row { grid-template-columns: 1fr; }
  .signup-item { flex-direction: column; align-items: flex-start; }
  .cancel-signup-btn { width: 100%; }
}

/* ===== 薄荷币（个人层） ===== */
.mc-wallet-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, #eef9f4, #e2f3ec);
  border: 1px solid rgba(45, 122, 108, 0.18);
  border-radius: 18px;
  padding: 22px 24px;
  margin-bottom: 12px;
}
.mc-wallet-card.tier-king {
  background: linear-gradient(135deg, #fff4e0, #ffe9c9);
  border-color: rgba(214, 150, 60, 0.35);
}
.mc-wallet-left { display: flex; flex-direction: column; gap: 4px; }
.mc-balance { font-size: 34px; font-weight: 800; color: #2d7a6c; line-height: 1; }
.mc-wallet-card.tier-king .mc-balance { color: #b8862d; }
.mc-balance-unit { font-size: 15px; font-weight: 600; margin-left: 4px; }
.mc-wallet-sub { font-size: 13px; color: var(--c-text-secondary, #6e6e73); }
.mc-wallet-right { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.mc-tier-icon { font-size: 34px; line-height: 1; }
.mc-tier-name { font-size: 13px; font-weight: 700; color: #2d7a6c; }
.mc-wallet-card.tier-king .mc-tier-name { color: #b8862d; }

.claim-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2d7a6c, #1a5c50);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 20px;
  transition: opacity 0.2s, transform 0.2s;
}
.claim-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
.claim-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.mc-sub-title { font-size: 14px; font-weight: 700; margin: 14px 0 10px; color: var(--c-text-secondary, #6e6e73); }

.claim-list { display: flex; flex-direction: column; gap: 8px; }
.claim-item {
  background: var(--c-bg-card, #fff);
  border: 1px solid var(--c-border, #e5e5ea);
  border-radius: 12px;
  padding: 12px 16px;
}
.claim-item.claim-pending { border-left: 3px solid #ff9500; }
.claim-item.claim-approved { border-left: 3px solid #34c759; }
.claim-item.claim-rejected { border-left: 3px solid #ff3b30; }
.claim-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
.claim-title { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.claim-status { font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 999px; flex-shrink: 0; }
.claim-status.pending { background: rgba(255, 149, 0, 0.14); color: #d9701a; }
.claim-status.approved { background: rgba(52, 199, 89, 0.14); color: #34c759; }
.claim-status.rejected { background: rgba(255, 59, 48, 0.12); color: #ff3b30; }
.claim-meta { font-size: 12px; color: var(--c-text-tertiary, #aeaeb2); display: flex; flex-wrap: wrap; gap: 2px; }
.claim-total { color: #2d7a6c; font-weight: 700; }
.claim-reason { color: #ff3b30; }

.ledger-list { display: flex; flex-direction: column; gap: 6px; }
.ledger-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--c-bg-card, #fff);
  border: 1px solid var(--c-border, #e5e5ea);
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
}
.ledger-delta { font-weight: 800; flex-shrink: 0; min-width: 44px; }
.ledger-delta.earn { color: #34c759; }
.ledger-delta.spend { color: #ff3b30; }
.ledger-note { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ledger-date { font-size: 12px; color: var(--c-text-tertiary, #aeaeb2); flex-shrink: 0; }
.mc-demo {
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  color: #b78a1a;
  background: rgba(255, 214, 102, 0.18);
  border: 0.5px solid rgba(183, 138, 26, 0.35);
  border-radius: 999px;
  padding: 3px 8px;
  flex-shrink: 0;
}
.dark .mc-demo { color: #f2c94c; background: rgba(183, 138, 26, 0.22); }
.viewer-only-hint {
  font-size: 12px;
  color: var(--c-text-tertiary, #aeaeb2);
  border: 0.5px dashed var(--c-text-tertiary, #aeaeb2);
  border-radius: 10px;
  padding: 8px 12px;
  margin-top: 12px;
}

/* 申报弹层 */
.claim-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.claim-modal {
  width: min(480px, 100%);
  max-height: 86vh;
  overflow-y: auto;
  background: var(--c-bg-card, #fff);
  border-radius: 20px;
  padding: 28px;
}
.claim-modal-title { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
.claim-modal-sub { font-size: 13px; color: var(--c-text-secondary, #6e6e73); margin: 0 0 18px; }
.form-group { margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px; }
.required { color: #ff3b30; }
.proof-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.proof-add {
  width: 72px; height: 72px;
  border: 1.5px dashed var(--c-border, #d1d1d6);
  border-radius: 12px;
  background: transparent;
  color: var(--c-text-secondary, #6e6e73);
  font-size: 13px;
  cursor: pointer;
}
.proof-add:hover { border-color: #2d7a6c; color: #2d7a6c; }
.proof-thumb {
  width: 72px; height: 72px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  position: relative;
  cursor: pointer;
}
.proof-x {
  position: absolute;
  top: -6px; right: -6px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
.claim-actions { display: flex; gap: 10px; margin-top: 18px; }
.claim-cancel {
  flex: 1;
  padding: 11px;
  border: 1px solid var(--c-border, #e5e5ea);
  border-radius: 12px;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
  color: var(--c-text-secondary, #6e6e73);
}
.claim-submit {
  flex: 2;
  padding: 11px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2d7a6c, #1a5c50);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.claim-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.claim-msg { font-size: 13px; margin: 12px 0 0; }
.claim-msg.success { color: #34c759; }
.claim-msg.error { color: #ff3b30; }
</style>
