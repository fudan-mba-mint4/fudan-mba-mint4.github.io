// GitHub API 代理 - 后端持有 token，前端不暴露
import { corsResponse, optionsResponse } from '../_utils.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()

  const token = env.GITHUB_TOKEN
  if (!token) return corsResponse({ error: 'GITHUB_TOKEN not configured' }, 500)

  // 从 URL 路径提取 GitHub API 路径：/api/github-proxy/repos/owner/repo/...
  const url = new URL(request.url)
  const apiPath = url.pathname.replace('/api/github-proxy', '')
  const targetUrl = `https://api.github.com${apiPath}${url.search}`

  try {
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'mint4-class-site',
    }
    const opts = { method: request.method, headers }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      opts.body = await request.text()
    }

    const ghRes = await fetch(targetUrl, opts)
    const body = await ghRes.text()
    return new Response(body, {
      status: ghRes.status,
      headers: {
        'Content-Type': ghRes.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (e) {
    return corsResponse({ error: 'github proxy error', detail: String(e) }, 502)
  }
}
