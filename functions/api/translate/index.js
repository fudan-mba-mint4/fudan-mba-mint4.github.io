// 服务端翻译：由 Cloudflare 边缘节点完成。班委浏览器只调同源 /api/translate，
// 无需 VPN、无需能访问任何境外翻译服务。
// 优先用配置了 GOOGLE_TRANSLATE_API_KEY 的 Google 官方翻译（稳定、按 key 计额）；
// 未配置 key 时用免 key 端点兜底（数据中心共享 IP 可能被限流）。
import { corsResponse, optionsResponse } from '../../_utils.js'

function splitText(text, max = 450) {
  const pieces = []
  let buf = ''
  const sentences = text.match(/[^。！？!?\n.]*[。！？!?\n.]*\n?/g)?.filter(Boolean) || [text]
  for (const s of sentences) {
    if ((buf + s).length > max) {
      if (buf) pieces.push(buf)
      if (s.length > max) {
        for (let i = 0; i < s.length; i += max) pieces.push(s.slice(i, i + max))
        buf = ''
      } else { buf = s }
    } else { buf += s }
  }
  if (buf) pieces.push(buf)
  return pieces.length ? pieces : [text]
}

// 官方 Google Cloud Translation v2（需 key，稳定）
async function googleOfficial(text, tl, key) {
  const body = new URLSearchParams()
  body.set('source', 'zh-CN'); body.set('target', tl); body.set('format', 'text')
  body.append('q', text)
  const res = await fetch(
    'https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(key),
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
  )
  if (!res.ok) throw new Error('googleOfficial HTTP ' + res.status)
  const d = await res.json()
  const t = d?.data?.translations?.[0]?.translatedText
  if (!t) throw new Error('googleOfficial 无译文')
  return t
}

// 免 key：Google dict-chrome-ex
async function googleDict(text, tl) {
  const out = []
  for (const seg of splitText(text)) {
    const url = 'https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex'
      + '&sl=zh-CN&tl=' + tl + '&dt=t&q=' + encodeURIComponent(seg)
    const res = await fetch(url, { cf: { cacheTtl: 30 * 24 * 3600, cacheEverything: true } })
    if (!res.ok) throw new Error('googleDict HTTP ' + res.status)
    const d = await res.json()
    if (!Array.isArray(d) || !Array.isArray(d[0])) throw new Error('googleDict 格式异常')
    const t = d[0].map(s => s[0]).join('')
    if (!t.trim()) throw new Error('googleDict 空译文')
    out.push(t)
  }
  return out.join('')
}

// 免 key：MyMemory
async function myMemory(text, tl) {
  const out = []
  for (const seg of splitText(text)) {
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(seg)
      + '&langpair=zh-CN|' + tl
    const res = await fetch(url, { cf: { cacheTtl: 30 * 24 * 3600, cacheEverything: true } })
    if (!res.ok) throw new Error('myMemory HTTP ' + res.status)
    const d = await res.json()
    const t = d?.responseData?.translatedText || ''
    if (d.responseStatus !== 200
      || /MYMEMORY|INVALID|PLEASE SELECT|QUERY LENGTH|WARNING/i.test(t)) {
      throw new Error('myMemory ' + d.responseStatus)
    }
    out.push(t)
  }
  return out.join('')
}

async function chainTranslate(text, tl, key) {
  let lastErr
  const providers = []
  if (key) providers.push((tx, l) => googleOfficial(tx, l, key))
  providers.push(googleDict, myMemory)
  for (const provider of providers) {
    try { return await provider(text, tl) } catch (e) { lastErr = e }
  }
  throw lastErr
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'POST') return corsResponse({ error: '仅支持 POST' }, 405)

  let body
  try { body = await request.json() } catch { return corsResponse({ error: '请求体格式错误' }, 400) }
  const text = (body.text || '').toString()
  if (!text.trim()) return corsResponse({ en: text, th: text })

  const key = env.GOOGLE_TRANSLATE_API_KEY || ''
  const [en, th] = await Promise.all([
    chainTranslate(text, 'en', key).catch(() => text),
    chainTranslate(text, 'th', key).catch(() => text),
  ])
  return corsResponse({ en, th })
}
