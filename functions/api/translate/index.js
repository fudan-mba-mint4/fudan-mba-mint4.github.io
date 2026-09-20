// 服务端翻译：由 Cloudflare 边缘节点调用 MyMemory（免注册、免 key、支持中/英/泰）。
// 班委浏览器只调同源 /api/translate，无需 VPN、无需能访问任何境外翻译服务。
import { corsResponse, optionsResponse } from '../../_utils.js'

// 按句子边界聚合切分，单段不超过 max 字符（MyMemory 对超长 query 会拒绝）
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

async function myMemoryTranslate(text, tl) {
  const segments = splitText(text)
  const out = []
  for (const seg of segments) {
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(seg)
      + '&langpair=zh-CN|' + tl
    const res = await fetch(url, {
      cf: { cacheTtl: 30 * 24 * 3600, cacheEverything: true },
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const d = await res.json()
    const t = d?.responseData?.translatedText || ''
    // 识别额度/参数错误（此时 translatedText 可能是警告串而非译文）
    if (d.responseStatus !== 200
      || /MYMEMORY|INVALID|PLEASE SELECT|QUERY LENGTH|WARNING/i.test(t)) {
      throw new Error('MyMemory ' + d.responseStatus + ' ' + (d.responseDetails || t))
    }
    out.push(t)
  }
  return out.join('')
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'POST') return corsResponse({ error: '仅支持 POST' }, 405)

  let body
  try { body = await request.json() } catch { return corsResponse({ error: '请求体格式错误' }, 400) }
  const text = (body.text || '').toString()
  if (!text.trim()) return corsResponse({ en: text, th: text })

  // 两种语言并行；任一失败则该语言回退原文，不影响另一种
  const [en, th] = await Promise.all([
    myMemoryTranslate(text, 'en').catch(() => text),
    myMemoryTranslate(text, 'th').catch(() => text),
  ])
  return corsResponse({ en, th })
}
