/**
 * 带自动重试的 fetch —— 兜底 Cloudflare 免费版边缘节点冷启动偶发的 545/5xx。
 *
 * 背景：免费版无常驻预热，全球边缘节点冷启动时会秒回 HTTP 545
 * "Error return from script"（偶发，落到健康节点即恢复）。
 * 本工具对可重试的状态码和网络错误自动重试，间隔 1s、2s 递增。
 *
 * 用法：与原生 fetch 完全一致，直接替换 fetch 即可：
 *   const res = await fetchWithRetry('/api/announcements')
 *   const res = await fetchWithRetry(url, { method:'POST', ... })
 * 也有便捷的 fetchJson(url, init, options) 直接返回解析后的 JSON。
 */

// 545 = Cloudflare Pages Functions "Error return from script"（冷启动/节点抖动）
const RETRYABLE_STATUS = new Set([425, 429, 500, 502, 503, 545])

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {string|Request} input - URL 或 Request，同原生 fetch
 * @param {RequestInit} [init] - 同原生 fetch
 * @param {object} [options]
 * @param {number} [options.retries=2] - 失败后最多再试几次（默认 2 次）
 * @param {number} [options.baseDelay=1000] - 第 n 次重试前等待 baseDelay*n 毫秒（1s、2s）
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(input, init = {}, options = {}) {
  const { retries = 2, baseDelay = 1000 } = options
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init)
      // 命中可重试状态码且还有重试机会 → 退避后重试
      if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
        await sleep(baseDelay * (attempt + 1))
        continue
      }
      return res
    } catch (e) {
      // 网络错误 / fetch failed / 超时 → 退避后重试
      lastError = e
      if (attempt < retries) {
        await sleep(baseDelay * (attempt + 1))
        continue
      }
    }
  }
  throw lastError || new Error('fetchWithRetry: 重试耗尽')
}

/**
 * 便捷方法：直接返回解析后的 JSON（fetchWithRetry + res.json()）
 * @param {string|Request} input
 * @param {RequestInit} [init]
 * @param {object} [options] - 同 fetchWithRetry
 * @returns {Promise<any>}
 */
export async function fetchJson(input, init = {}, options = {}) {
  const res = await fetchWithRetry(input, init, options)
  return res.json()
}
