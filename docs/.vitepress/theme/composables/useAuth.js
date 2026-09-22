// 认证状态管理（调用 Cloudflare Pages Functions + Neon Postgres）
import { ref, computed } from 'vue'

import { API_PREFIX } from './apiConfig.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

const TOKEN_KEY = 'mint4_auth_token'

const currentUser = ref(null)
const authToken = ref(null)
const isAuthenticated = computed(() => !!currentUser.value)

// 统一请求：单次 10s 超时（后端 Neon 查询 8s 超时 + 余量），失败自动重试。
// 读（me）重试 3 次；写（登录/注册/改密/更新）重试 2 次——写接口均为
// 「校验/覆盖」语义，DB 超时时事务未提交，重试安全；成功(2xx)不重试。
async function authRequest(path, { method = 'GET', body = null, withToken = false, retries = 2 } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (withToken) headers['Authorization'] = `Bearer ${authToken.value}`
  return fetchWithRetry(`${API_PREFIX}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }, { timeoutMs: 10000, retries })
}

// 初始化：从localStorage恢复登录状态
function initAuth() {
  if (typeof window === 'undefined') return
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    authToken.value = token
    // 从API获取用户信息
    fetchMe()
  }
}

async function fetchMe() {
  try {
    const res = await authRequest('/api/auth/me', { withToken: true, retries: 3 })
    if (res.ok) {
      const result = await res.json()
      currentUser.value = result.data
    } else {
      localStorage.removeItem(TOKEN_KEY)
      authToken.value = null
    }
  } catch (e) {
    console.warn('获取用户信息失败:', e.message)
  }
}

// 注册
async function register({ username, password, name, nickname }) {
  try {
    const res = await authRequest('/api/auth/register', {
      method: 'POST',
      body: { username, password, name, nickname },
    })
    const result = await res.json()
    if (res.ok) {
      authToken.value = result.data.token
      localStorage.setItem(TOKEN_KEY, result.data.token)
      currentUser.value = result.data.user
      return { success: true, user: result.data.user }
    }
    return { success: false, error: result.error || '注册失败' }
  } catch (e) {
    return { success: false, error: '网络较慢，请稍后重试' }
  }
}

// 登录
async function login({ username, password }) {
  try {
    const res = await authRequest('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    const result = await res.json()
    if (res.ok) {
      authToken.value = result.data.token
      localStorage.setItem(TOKEN_KEY, result.data.token)
      currentUser.value = result.data.user
      return { success: true, user: result.data.user }
    }
    return { success: false, error: result.error || '登录失败' }
  } catch (e) {
    return { success: false, error: '网络较慢，请检查后重试' }
  }
}

// 修改密码
async function changePassword({ oldPassword, newPassword }) {
  if (!authToken.value) return { success: false, error: '未登录' }
  try {
    const res = await authRequest('/api/auth/change-password', {
      method: 'POST',
      body: { oldPassword, newPassword },
      withToken: true,
    })
    const result = await res.json()
    if (res.ok) return { success: true }
    return { success: false, error: result.error || '修改失败' }
  } catch (e) {
    return { success: false, error: '网络较慢，请稍后重试' }
  }
}

// 登出
function logout() {
  localStorage.removeItem(TOKEN_KEY)
  authToken.value = null
  currentUser.value = null
}

// 更新个人信息
async function updateProfile(updates) {
  if (!authToken.value) return { success: false, error: '未登录' }
  try {
    const res = await authRequest('/api/auth/profile', {
      method: 'PUT',
      body: updates,
      withToken: true,
    })
    const result = await res.json()
    if (res.ok) {
      currentUser.value = { ...currentUser.value, ...result.data }
      return { success: true, user: result.data }
    }
    return { success: false, error: result.error || '更新失败' }
  } catch (e) {
    return { success: false, error: '网络较慢，请稍后重试' }
  }
}

// 获取认证token（供其他API调用）
function getToken() {
  return authToken.value
}

initAuth()

export function useAuth() {
  return {
    currentUser,
    isAuthenticated,
    authToken,
    register,
    login,
    logout,
    changePassword,
    updateProfile,
    getToken,
    initAuth,
  }
}
