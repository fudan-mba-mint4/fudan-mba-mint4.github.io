// 许愿池图片 / 报销凭证 / 薄荷币申报证明 / 预算公示活动方案附件 上传 - POST /api/upload（登录即可，面向全体同学）
// 与班委专用 /api/admin/upload 隔离：仅接受图片（image/*）或凭证/证明 PDF 或预算附件文档，
// 且 key 必须在 wishes/ 或 receipts/ 或 proofs/ 或 budgets/ 前缀下，防止越权写入其他路径或上传非白名单文件。
// body: { key, contentType, dataBase64 }
import {
  corsResponse, optionsResponse, parseBody, requireLogin,
} from '../../_utils.js'

// 全量图片扩展名（不含 svg：svg 可内嵌脚本，存在 XSS 风险）
const IMG_EXT = 'jpe?g|png|webp|gif|heic|heif|bmp|tiff?|avif'

// 各前缀的 key 规则：basename 允许含点（微信/截图常见命名），仅校验路径前缀与最终扩展名
const KEY_RULES = [
  { kind: 'wish',    re: new RegExp(`^wishes/[^/]+\\.(${IMG_EXT})$`, 'i') },
  { kind: 'receipt', re: new RegExp(`^receipts/[^/]+/[^/]+\\.(${IMG_EXT}|pdf)$`, 'i') },
  { kind: 'proof',   re: new RegExp(`^proofs/[^/]+/[^/]+\\.(${IMG_EXT}|pdf)$`, 'i') },
  { kind: 'budget',  re: new RegExp(`^budgets/[^/]+\\.(pdf|doc|docx|ppt|pptx|xls|xlsx|${IMG_EXT})$`, 'i') },
]

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const { key, contentType, dataBase64 } = await parseBody(request)
    if (!key || !dataBase64) return corsResponse({ error: '缺少 key 或 dataBase64' }, 400)
    const rule = KEY_RULES.find(r => r.re.test(key || ''))
    if (!rule) return corsResponse({ error: '非法的存储路径或文件类型' }, 400)

    // contentType 校验：图片任意 image/*；凭证/证明另接受 PDF；预算附件另接受办公文档
    let okType
    if (rule.kind === 'budget') {
      okType = /^image\//.test(contentType || '')
        || /^application\/(pdf|msword|vnd\.ms-powerpoint|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.)/.test(contentType || '')
    } else if (rule.kind === 'receipt' || rule.kind === 'proof') {
      okType = /^image\//.test(contentType || '') || contentType === 'application/pdf'
    } else {
      okType = /^image\//.test(contentType || '')
    }
    if (!okType) {
      const msg = rule.kind === 'budget'
        ? '预算附件仅支持 PDF/Word/PPT/Excel 或图片'
        : (rule.kind === 'receipt' || rule.kind === 'proof')
          ? '凭证/证明仅支持图片或 PDF'
          : '许愿池只能上传图片'
      return corsResponse({ error: msg }, 400)
    }

    if (typeof dataBase64 !== 'string') return corsResponse({ error: '文件内容无效' }, 400)
    // 大小上限：凭证/证明单文件 5MB（base64 约 7M 字符）；许愿池图片与预算附件放宽到 20MB（约 28M 字符）
    const maxChars = (rule.kind === 'receipt' || rule.kind === 'proof')
      ? 7 * 1024 * 1024
      : 28 * 1024 * 1024
    if (dataBase64.length > maxChars) {
      const limit = (rule.kind === 'receipt' || rule.kind === 'proof') ? 5 : 20
      return corsResponse({ error: `文件过大（单文件不超过 ${limit}MB）` }, 400)
    }
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
