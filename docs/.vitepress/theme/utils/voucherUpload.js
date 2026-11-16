/**
 * 报销/记账凭证上传公共工具
 * - 图片统一压缩为 JPEG（GIF 保留原文件，动图不压）；PDF 原样直传
 * - 单文件 5MB 上限；R2 key 规范化（不使用原始文件名，兼容多点/特殊字符文件名）
 * - 调用方负责总文件数上限（30）与凭证类型口径
 */
import { fetchWithRetry } from './fetchWithRetry.js'

export const MAX_VOUCHER_FILES = 30
export const MAX_VOUCHER_BYTES = 5 * 1024 * 1024

// 客户端预生成报销单号（与后端 newId('rb') 同形态）
export function newReimbId() {
  return `rb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function bytesToBase64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  return btoa(bin)
}

function randomTag() {
  return Math.random().toString(36).slice(2, 8)
}

// 图片压缩：限制最长边 maxEdge，输出 JPEG blob
function compressToJpeg(file, maxEdge, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      const scale = Math.min(1, maxEdge / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('图片压缩失败'))), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片读取失败')) }
    img.src = url
  })
}

/**
 * 预处理单个文件
 * @returns {Promise<{bytes:Uint8Array, contentType:string, ext:string}>}
 */
export async function prepareVoucherFile(file) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '')
  if (isPdf) {
    return { bytes: new Uint8Array(await file.arrayBuffer()), contentType: 'application/pdf', ext: 'pdf' }
  }
  if (/^image\/gif$/i.test(file.type || '')) {
    return { bytes: new Uint8Array(await file.arrayBuffer()), contentType: file.type || 'image/gif', ext: 'gif' }
  }
  const blob = await compressToJpeg(file, 2000, 0.85)
  return { bytes: new Uint8Array(await blob.arrayBuffer()), contentType: 'image/jpeg', ext: 'jpg' }
}

/**
 * 上传一个凭证文件到 R2
 * @param {object} p
 * @param {File} p.file 原始文件
 * @param {string} p.token 登录 token
 * @param {string} p.username 用户名（用于 key 路径）
 * @param {string} [p.prefix='receipts'] R2 前缀（receipts/proofs）
 * @returns {Promise<{url:string, key:string, size:number}>}
 */
export async function uploadVoucherFile({ file, token, username, prefix = 'receipts' }) {
  const prepared = await prepareVoucherFile(file)
  if (prepared.bytes.length > MAX_VOUCHER_BYTES)
    throw new Error('单文件不能超过 5MB（图片已自动压缩，仍超限请拆分或降低清晰度）')
  const safeUser = String(username || 'guest').replace(/[^\w-]/g, '_')
  const key = `${prefix}/${safeUser}/${Date.now()}-${randomTag()}.${prepared.ext}`
  const dataBase64 = bytesToBase64(prepared.bytes)
  const res = await fetchWithRetry('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ key, contentType: prepared.contentType, dataBase64 }),
  }, { timeoutMs: 120000, retries: 2 })
  let json = {}
  try { json = await res.json() } catch (e) {}
  if (!res.ok) throw new Error(json.error || `上传失败（${res.status}）`)
  if (!json.url) throw new Error('上传未返回 url')
  return { url: json.url, key, size: prepared.bytes.length }
}

/**
 * 批量上传（按顺序逐个上传，避免并发占用内存）
 * @param {object} p
 * @param {FileList|File[]} p.files
 * @returns {Promise<Array<{url:string, key:string, size:number}>>}
 */
export async function uploadVoucherFiles({ files, token, username, prefix = 'receipts' }) {
  const list = Array.from(files || [])
  const out = []
  for (const file of list)
    out.push(await uploadVoucherFile({ file, token, username, prefix }))
  return out
}
