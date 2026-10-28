// 许愿池图片 / 报销凭证 / 薄荷币申报证明 上传 - POST /api/upload（登录即可，面向全体同学）
// 与班委专用 /api/admin/upload 隔离：仅接受图片（image/*）或报销/证明 PDF，
// 且 key 必须在 wishes/ 或 receipts/ 或 proofs/ 前缀下，防止越权写入其他路径或上传非白名单文件。
// body: { key, contentType, dataBase64 }
import {
  corsResponse, optionsResponse, parseBody, requireLogin,
} from '../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const { key, contentType, dataBase64 } = await parseBody(request)
    if (!key || !dataBase64) return corsResponse({ error: '缺少 key 或 dataBase64' }, 400)
    const isReceipt = /^receipts\//.test(key || '')
    const isProof = /^proofs\//.test(key || '')
    const okKey = /^wishes\/[^/][^.]*\.(jpe?g|png|webp|gif|heic)$/i.test(key || '')
      || /^receipts\/[^/]+\/[^/][^.]*\.(jpe?g|png|webp|gif|pdf)$/i.test(key || '')
      || /^proofs\/[^/]+\/[^/][^.]*\.(jpe?g|png|webp|gif|pdf)$/i.test(key || '')
    if (!okKey) return corsResponse({ error: '非法的存储路径或文件类型' }, 400)
    const okType = (isReceipt || isProof)
      ? (/^image\//.test(contentType || '') || contentType === 'application/pdf')
      : /^image\//.test(contentType || '')
    if (!okType) return corsResponse({ error: (isReceipt || isProof) ? '凭证/证明仅支持图片或 PDF' : '许愿池只能上传图片' }, 400)
    // 大小上限：base64 约 14M 字符 ≈ 10MB 二进制（前端已压缩到 1600px，通常 <1MB）
    if (typeof dataBase64 !== 'string' || dataBase64.length > 14 * 1024 * 1024)
      return corsResponse({ error: '图片过大（单张不超过 10MB）' }, 400)
    if (!env.R2) return corsResponse({ error: 'R2 binding 未配置' }, 500)

    // base64 -> 二进制（for 循环逐字节，避免大文件逐元素回调开销）
    const binaryStr = atob(dataBase64)
    const bodyBytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) bodyBytes[i] = binaryStr.charCodeAt(i)

    await env.R2.put(key, bodyBytes, { httpMetadata: { contentType } })
    return corsResponse({
      message: '上传成功',
      url: `https://${env.R2_PUBLIC_DOMAIN || 'files.mint4.cn'}/${key}`,
      key,
    })
  } catch (err) {
    console.error('wishes upload 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
