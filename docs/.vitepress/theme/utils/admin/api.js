/**
 * Admin 后台 API 封装（从 AdminPanel.vue 抽取，逻辑零变化）
 * 依赖：fetchWithRetry（../fetchWithRetry.js）、API_PREFIX（../composables/apiConfig.js）
 */
import { fetchWithRetry } from '../fetchWithRetry.js'
import { API_PREFIX } from '../../composables/apiConfig.js'
import { useAuth } from '../../composables/useAuth.js'
import { randomHex, extFromFileName, readFileAsBase64 } from './utils.js'

// useAuth 为模块级单例；getToken 返回当前登录 token（localStorage 持久化）
const { getToken } = useAuth()

/**
 * 当前登录班委的个人 token（原样 Bearer 带上）
 */
export function getAdminToken() {
  return getToken() || ''
}

/**
 * 后台请求头（Authorization Bearer token）
 */
export function adminHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}`, ...extra }
}

/**
 * 统一处理非 2xx：读出后端错误信息后抛错；res.ok 直接通过（与原实现逐字一致）
 */
export async function throwIfNotOk(res, action) {
  if (res.ok) return
  let msg = `${action}失败 ${res.status}`
  try { const e = await res.json(); if (e && e.error) msg = e.error } catch {}
  throw new Error(msg)
}

/**
 * 上传图片/PDF：File -> base64 -> POST /api/admin/upload -> { url }
 * @param {File} file
 * @param {string} customKey 自定义 R2 key（可选）
 * @returns {Promise<string>} url
 */
export async function uploadFileToAdmin(file, customKey) {
  const key = customKey || `uploads/${Date.now()}-${randomHex(4)}.${extFromFileName(file.name)}`
  const dataBase64 = await readFileAsBase64(file)
  // 大文件给足单次超时（慢网络/代理下避免误判超时），并减少重试以免反复重传整个大文件
  const res = await fetchWithRetry(`${API_PREFIX}/api/admin/upload`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ key, contentType: file.type || 'application/octet-stream', dataBase64 }),
  }, { timeoutMs: 120000, retries: 2 })
  await throwIfNotOk(res, '上传文件')
  const data = await res.json()
  if (!data.url) throw new Error('上传未返回 url')
  return data.url
}
