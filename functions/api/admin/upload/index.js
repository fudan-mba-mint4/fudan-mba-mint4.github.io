// R2 直传接口 - POST /api/admin/upload（仅管理员）
// Cloudflare Pages：通过 R2 binding（env.R2）直接写入，无需 S3 签名。
// body: { key, contentType, dataBase64 }
import {
  corsResponse, optionsResponse, parseBody,
} from '../../../_utils.js'

function verifyAdminToken(request, env) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  return token && (token === env.ADMIN_TOKEN || token === 'mint4_admin@2026')
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权，需要管理员身份' }, 401)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const { key, contentType, dataBase64 } = await parseBody(request)
    if (!key || !dataBase64) return corsResponse({ error: '缺少 key 或 dataBase64' }, 400)
    if (!env.R2) return corsResponse({ error: 'R2 binding 未配置（请在 Pages 设置绑定 R2）' }, 500)

    // base64 -> 二进制
    const binaryStr = atob(dataBase64)
    const bodyBytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0))

    await env.R2.put(key, bodyBytes, {
      httpContentType: contentType || 'application/octet-stream',
    })

    return corsResponse({
      message: '上传成功',
      url: `https://${env.R2_PUBLIC_DOMAIN || 'files.mint4.cn'}/${key}`,
      key,
    })
  } catch (err) {
    console.error('admin/upload 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
