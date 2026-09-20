// R2 直传接口 - POST /api/admin/upload（登录班委）
// Cloudflare Pages：通过 R2 binding（env.R2）直接写入，无需 S3 签名。
// body: { key, contentType, dataBase64 }
import {
  getSql, corsResponse, optionsResponse, parseBody, requireCommittee, logHistory,
} from '../../../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireCommittee(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const { key, contentType, dataBase64, module: mod, note, log } = await parseBody(request)
    if (!key || !dataBase64) return corsResponse({ error: '缺少 key 或 dataBase64' }, 400)
    if (!env.R2) return corsResponse({ error: 'R2 binding 未配置（请在 Pages 设置绑定 R2）' }, 500)

    // base64 -> 二进制
    const binaryStr = atob(dataBase64)
    const bodyBytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0))

    await env.R2.put(key, bodyBytes, {
      httpContentType: contentType || 'application/octet-stream',
    })

    // 底层文件上传默认不单独写历史（由 knowledge/course/activities 等业务端点
    // 统一记录，避免一次业务操作产生「文件上传 + 业务更新」多条记录）。
    // 仅当调用方显式传 log:true（无业务端点包裹的独立上传）时才记录。
    if (log === true) {
      const knownTypes = ['announcements', 'activities', 'polls', 'courseMaterials', 'finance', 'gallery', 'treehole']
      const histType = knownTypes.includes(mod) ? mod : 'gallery'
      await logHistory(getSql(env), {
        type: histType, action: 'upload', refId: null,
        description: note || key, operator: auth.user.name,
      })
    }

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
