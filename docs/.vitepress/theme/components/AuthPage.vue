<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧品牌区 -->
      <div class="auth-brand">
        <div class="auth-brand-inner">
          <div class="auth-logo">🌿</div>
          <h1 class="auth-brand-title">薄荷 4 班</h1>
          <p class="auth-brand-slogan">4 the Best, for the Future</p>
          <div class="auth-brand-features">
            <div class="feature-item">
              <span class="feature-icon">📅</span>
              <span>活动报名一键搞定</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📚</span>
              <span>课程资料随时下载</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💬</span>
              <span>匿名树洞畅所欲言</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="auth-form-area">
        <div class="auth-form-card">
          <!-- Tab切换 -->
          <div class="auth-tabs">
            <button
              class="auth-tab"
              :class="{ active: activeTab === 'login' }"
              @click="switchTab('login')"
            >登录</button>
            <button
              class="auth-tab"
              :class="{ active: activeTab === 'register' }"
              @click="switchTab('register')"
            >注册</button>
          </div>

          <!-- 登录表单 -->
          <form v-if="activeTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input
                v-model="loginForm.username"
                type="text"
                class="form-input"
                placeholder="字母、数字、下划线"
                autocomplete="username"
                pattern="[a-zA-Z0-9_]+"
                @input="loginForm.username = $event.target.value.replace(/[^a-zA-Z0-9_]/g, '')"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <input
                v-model="loginForm.password"
                type="password"
                class="form-input"
                placeholder="请输入密码"
                autocomplete="current-password"
                required
              />
            </div>
            <div v-if="loginError" class="form-error">{{ loginError }}</div>
            <button type="submit" class="submit-btn" :disabled="loginLoading">
              <span v-if="loginLoading" class="btn-spinner"></span>
              {{ loginLoading ? '登录中...' : '登 录' }}
            </button>
            <p class="auth-hint">
              还没有账号？<a href="#" @click.prevent="switchTab('register')">立即注册</a>
            </p>
          </form>

          <!-- 注册表单 -->
          <form v-else class="auth-form" @submit.prevent="handleRegister">
            <div class="form-group">
              <label class="form-label">用户名 <span class="required">*</span></label>
              <input v-model="regForm.username" type="text" class="form-input" placeholder="字母、数字、下划线，不可重复" autocomplete="username" pattern="[a-zA-Z0-9_]+" @input="regForm.username = $event.target.value.replace(/[^a-zA-Z0-9_]/g, '')" required />
            </div>
            <div class="form-group">
              <label class="form-label">真实姓名 <span class="required">*</span></label>
              <input v-model="regForm.name" type="text" class="form-input" placeholder="张三" required />
            </div>
            <div class="form-group">
              <label class="form-label">密码 <span class="required">*</span></label>
              <input v-model="regForm.password" type="password" class="form-input" placeholder="至少6位" autocomplete="new-password" required />
            </div>
            <div class="form-group">
              <label class="form-label">确认密码 <span class="required">*</span></label>
              <input
                v-model="regForm.confirmPassword"
                type="password"
                class="form-input"
                :class="{ 'input-error': confirmMismatch }"
                placeholder="再次输入密码"
                autocomplete="new-password"
                required
              />
              <p v-if="confirmMismatch" class="field-error">两次输入的密码不一致</p>
            </div>
            <div v-if="regError" class="form-error">{{ regError }}</div>
            <button type="submit" class="submit-btn" :disabled="regLoading">
              <span v-if="regLoading" class="btn-spinner"></span>
              {{ regLoading ? '注册中...' : '注 册' }}
            </button>
            <p class="auth-hint">
              已有账号？<a href="#" @click.prevent="switchTab('login')">直接登录</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vitepress'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { login, register } = useAuth()

const activeTab = ref('login')
const loginLoading = ref(false)
const regLoading = ref(false)
const loginError = ref('')
const regError = ref('')

const loginForm = ref({ username: '', password: '' })
const regForm = ref({
  username: '', password: '', confirmPassword: '',
  name: '',
})

// 实时校验：确认密码是否一致
const confirmMismatch = computed(() => {
  return regForm.value.confirmPassword.length > 0
    && regForm.value.password !== regForm.value.confirmPassword
})

function switchTab(tab) {
  activeTab.value = tab
  loginError.value = ''
  regError.value = ''
}

// 支持 /auth/?tab=register 直达注册
onMounted(() => {
  if (typeof window !== 'undefined') {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'register') switchTab('register')
  }
})

async function handleLogin() {
  loginError.value = ''
  loginLoading.value = true
  try {
    const result = await login(loginForm.value)
    if (result.success) {
      router.go('/')
    } else {
      loginError.value = result.error
    }
  } catch (e) {
    loginError.value = '登录失败：' + e.message
  } finally {
    loginLoading.value = false
  }
}

async function handleRegister() {
  regError.value = ''

  // 前端校验
  if (regForm.value.password !== regForm.value.confirmPassword) {
    regError.value = '两次输入的密码不一致'
    return
  }
  if (regForm.value.password.length < 6) {
    regError.value = '密码至少6位'
    return
  }

  regLoading.value = true
  try {
    const result = await register(regForm.value)
    if (result.success) {
      router.go('/')
    } else {
      regError.value = result.error
    }
  } catch (e) {
    regError.value = '注册失败：' + e.message
  } finally {
    regLoading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
.auth-container {
  display: flex;
  width: 100%;
  max-width: 900px;
  min-height: 560px;
  background: var(--c-bg-card);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--c-border);
}

/* 左侧品牌区 */
.auth-brand {
  flex: 1;
  background: linear-gradient(135deg, var(--c-accent) 0%, #1a5c50 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
}
.auth-brand::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  top: -100px;
  right: -100px;
}
.auth-brand::after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  bottom: -60px;
  left: -60px;
}
.auth-brand-inner {
  text-align: center;
  color: #fff;
  position: relative;
  z-index: 1;
}
.auth-logo { font-size: 56px; margin-bottom: 16px; }
.auth-brand-title { font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.5px; }
.auth-brand-slogan { font-size: 15px; opacity: 0.85; margin: 0 0 32px; font-style: italic; }
.auth-brand-features { display: flex; flex-direction: column; gap: 14px; text-align: left; }
.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 16px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
.feature-icon { font-size: 18px; }

/* 右侧表单区 */
.auth-form-area {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.auth-form-card {
  width: 100%;
  max-width: 380px;
}

/* Tab */
.auth-tabs {
  display: flex;
  background: var(--c-bg-secondary);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 28px;
}
.auth-tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.auth-tab.active {
  background: var(--c-bg-card);
  color: var(--c-accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 表单 */
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--c-text-primary); }
.form-label .required { color: #ff3b30; }
.form-label .optional { color: var(--c-text-tertiary); font-weight: 400; font-size: 12px; }
.form-input {
  padding: 11px 14px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 14px;
  background: var(--c-bg-secondary);
  color: var(--c-text-primary);
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
}
.form-input:focus { outline: none; border-color: var(--c-accent); }
.form-input.input-error { border-color: #ff3b30; }
.field-error {
  font-size: 12px;
  color: #ff3b30;
  margin: 4px 0 0;
}
.form-error {
  padding: 10px 14px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 10px;
  font-size: 13px;
  color: #ff3b30;
}
.submit-btn {
  padding: 13px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) { opacity: 0.9; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.auth-hint {
  text-align: center;
  font-size: 13px;
  color: var(--c-text-secondary);
  margin: 8px 0 0;
}
.auth-hint a { color: var(--c-accent); text-decoration: none; font-weight: 600; }
.auth-hint a:hover { text-decoration: underline; }

/* 移动端 */
@media (max-width: 768px) {
  .auth-container { flex-direction: column; min-height: auto; }
  .auth-brand { padding: 32px 24px; }
  .auth-brand-title { font-size: 26px; }
  .auth-brand-features { display: none; }
  .auth-form-area { padding: 28px 20px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
