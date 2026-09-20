// 服务端翻译：由 Cloudflare 边缘节点调用 Google Translate（边缘在海外，可访问）。
// 班委浏览器只调同源 /api/translate，无需 VPN / 无需能访问 Google。
import { corsResponse, optionsResponse } from '../../_utils.js'

async function googleTranslate(text, tl) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl='
    + tl + '&dt=t&q=' + encodeURIComponent(text)
  const res = await fetch(url, {
    // 相同译文边缘缓存 30 天，加速且减少外部请求
    cf: { cacheTtl: 30 * 24 * 3600, cacheEverything: true },
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()
  return data[0].map(s => s[0]).join('')
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
    googleTranslate(text, 'en').catch(() => text),
    googleTranslate(text, 'th').catch(() => text),
  ])
  return corsResponse({ en, th })
}
