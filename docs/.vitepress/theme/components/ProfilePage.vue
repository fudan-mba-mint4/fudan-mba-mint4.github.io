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

const router = useRouter()
import { API_PREFIX } from '../composables/apiConfig.js'
const { currentUser, isAuthenticated, logout, updateProfile, changePassword, authToken } = useAuth()
const { data: activitiesData } = useData('/data/activities.json', { dbUrl: '/api/activities-db' })

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

const avatarText = computed(() => {
  if (!currentUser.value) return '?'
  return currentUser.value.name?.charAt(0) || '?'
})

// 初始化编辑表单
watch(currentUser, (user) => {
  if (user) {
    editForm.value = {
      name: user.name || '',
      nickname: user.nickname || '',
      student_id: user.student_id || '',
      group_no: user.group_no || null,
    }
  }
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
})

watch(activitiesData, () => {
  loadMySignups()
})

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
</style>
