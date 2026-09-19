// R2 直传接口 - POST /api/admin/upload（仅管理员）
// body: { key, contentType, dataBase64 }
// 用 AWS SigV4（WebCrypto）对 S3 兼容 REST PUT 直传 Cloudflare R2
import {
  corsResponse, optionsResponse, parseBody,
} from '../../../_utils.js'

function verifyAdminToken(request, env) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  return token && (token === env.ADMIN_TOKEN || token === 'mint4_admin@2026')
}

const encoder = new TextEncoder()

function toHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(data) {
  const buf = await crypto.subtle.digest('SHA-256', data)
  return toHex(new Uint8Array(buf))
}

async function hmacRaw(keyBytes, dataStr) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(dataStr)))
}

async function hmacHex(keyBytes, dataStr) {
  return toHex(await hmacRaw(keyBytes, dataStr))
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权，需要管理员Token' }, 401)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try {
    const { key, contentType, dataBase64 } = await parseBody(request)
    if (!key || !dataBase64) return corsResponse({ error: '缺少 key 或 dataBase64' }, 400)

    const accountId = env.R2_ACCOUNT_ID
    const bucket = env.R2_BUCKET
    const accessKeyId = env.R2_ACCESS_KEY_ID
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      return corsResponse({ error: 'R2 环境变量未配置' }, 500)
    }

    // base64 -> 二进制 body
    const binaryStr = atob(dataBase64)
    const bodyBytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0))

    const region = 'auto'
    const service = 's3'
    const host = `${accountId}.r2.cloudflarestorage.com`
    const canonicalUri = '/' + bucket + '/' + String(key).split('/').map(s => encodeURIComponent(s)).join('/')

    // 时间戳
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const dateStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`
    const amzDate = `${dateStamp}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

    const payloadHash = await sha256Hex(bodyBytes)
    const signedContentType = contentType || 'application/octet-stream'

    // 规范化请求
    const canonicalHeaders =
      `content-type:${signedContentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
    const canonicalRequest = [
      'PUT',
      canonicalUri,
      '', // 无 query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n')

    // 待签名串
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      await sha256Hex(encoder.encode(canonicalRequest)),
    ].join('\n')

    // 派生签名密钥
    const kDate = await hmacRaw(encoder.encode('AWS4' + secretAccessKey), dateStamp)
    const kRegion = await hmacRaw(kDate, region)
    const kService = await hmacRaw(kRegion, service)
    const kSigning = await hmacRaw(kService, 'aws4_request')
    const signature = await hmacHex(kSigning, stringToSign)

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`

    const putRes = await fetch(`https://${host}${canonicalUri}`, {
      method: 'PUT',
      headers: {
        'Authorization': authorization,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Content-Type': signedContentType,
      },
      body: bodyBytes,
    })

    if (!putRes.ok) {
      const errText = await putRes.text().catch(() => '')
      return corsResponse({ error: 'R2 上传失败', status: putRes.status, detail: errText.slice(0, 500) }, 502)
    }

    return corsResponse({
      message: '上传成功',
      url: `https://${env.R2_PUBLIC_DOMAIN}/${key}`,
      key,
    })
  } catch (err) {
    console.error('admin/upload 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
