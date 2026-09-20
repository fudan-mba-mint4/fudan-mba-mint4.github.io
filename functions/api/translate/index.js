// 服务端翻译：由 Cloudflare 边缘节点完成。班委浏览器只调同源 /api/translate，
// 无需 VPN、无需能访问任何境外翻译服务。多供应商兜底，任一成功即可。
import { corsResponse, optionsResponse } from '../../_utils.js'

// 按句子边界聚合切分，单段不超过 max 字符
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
      } else {
        buf = s
      }
    } else {
      buf += s
    }
  }
  if (buf) pieces.push(buf)
  return pieces.length ? pieces : [text]
}

// 供应商1：Google translate 的 dict-chrome-ex 客户端端点（限流比 gtx 宽松，免 key）
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

// 供应商2：MyMemory（免注册、免 key）
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
      throw new Error('myMemory ' + d.responseStatus + ' ' + (d.responseDetails || t))
    }
    out.push(t)
  }
  return out.join('')
}

// 供应商链：依次尝试，全部失败才抛错
async function chainTranslate(text, tl) {
  let lastErr
  for (const provider of [googleDict, myMemory]) {
    try { return await provider(text, tl) } catch (e) { lastErr = e }
  }
  throw lastErr
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'POST') return corsResponse({ error: '仅支持 POST' }, 405)

  let body
  try { body = await request.json() } catch { return corsResponse({ error: '请求体格式错误' }, 400) }
  const text = (body.text || '').toString()
  if (!text.trim()) return corsResponse({ en: text, th: text })

  const [en, th] = await Promise.all([
    chainTranslate(text, 'en').catch(() => text),
    chainTranslate(text, 'th').catch(() => text),
  ])
  return corsResponse({ en, th })
}
