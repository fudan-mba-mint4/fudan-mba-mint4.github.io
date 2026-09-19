/**
 * 带自动重试的 fetch —— 兜底边缘/云函数免费版冷启动与节点抖动导致的 5xx/545。
 *
 * 背景：免费版 serverless 函数无常驻实例，冷启动或异常节点会快速返回
 * HTTP 545 "Error return from script"（偶发，重试落到健康实例即恢复）。
 * 本工具对可重试状态码和网络错误自动重试，指数退避 + 随机抖动。
 *
 * 用法：与原生 fetch 完全一致，直接替换 fetch：
 *   const res = await fetchWithRetry('/api/announcements')
 *   await fetchWithRetry(url, { method: 'POST', body })
 * 默认重试次数按方法自动选择：写操作（POST/PUT/PATCH/DELETE）重试更多。
 * 也可用 options.retries / options.timeoutMs 覆盖。
 * 便捷方法 fetchJson(url, init, options) 直接返回解析后的 JSON。
 */

// 网关/运行层可重试的状态码（服务自身错误，换一个实例重试可能成功）
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 545])

// 写操作默认重试 6 次（共 7 次请求），读操作默认 3 次（共 4 次）
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 指数退避：300ms, 600ms, 1000ms, 1500ms, 2100ms... 再加 ±25% 随机抖动
function backoffMs(attempt, baseDelay = 300) {
  const expo = baseDelay * Math.pow(1.7, attempt)
  const jitter = expo * 0.25 * (Math.random() * 2 - 1)
  return Math.max(0, Math.round(expo + jitter))
}

// 合并“单次超时”与“外部传入 signal”，返回 { signal, done }
function mergeSignal(externalSignal, timeoutMs) {
  if (!timeoutMs) return { signal: externalSignal }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new Error('请求超时')), timeoutMs)
  const onAbort = () => ctrl.abort(externalSignal?.reason)
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort(externalSignal.reason)
    else externalSignal.addEventListener('abort', onAbort, { once: true })
  }
  return {
    signal: ctrl.signal,
    done: () => {
      clearTimeout(timer)
      externalSignal?.removeEventListener('abort', onAbort)
    },
  }
}

/**
 * @param {string|Request} input - URL 或 Request，同原生 fetch
 * @param {RequestInit} [init] - 同原生 fetch
 * @param {object} [options]
 * @param {number} [options.retries] - 失败后最多再试几次（默认按方法：写6/读3）
 * @param {number} [options.timeoutMs=20000] - 单次请求超时（毫秒）
 * @param {number} [options.baseDelay=300] - 退避起始延迟
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(input, init = {}, options = {}) {
  const method = (init.method || 'GET').toUpperCase()
  const retries = options.retries ?? (WRITE_METHODS.has(method) ? 6 : 3)
  const timeoutMs = options.timeoutMs ?? 20000
  const baseDelay = options.baseDelay ?? 300

  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { signal, done } = mergeSignal(init.signal, timeoutMs)
    try {
      const res = await fetch(input, { ...init, signal })
      done?.()
      // 命中可重试状态码且还有机会 → 退避后重试
      if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
        // 429 若带 Retry-After，优先尊重
        const ra = res.headers?.get?.('Retry-After')
        const wait = ra && !Number.isNaN(Number(ra)) ? Number(ra) * 1000 : backoffMs(attempt, baseDelay)
        await sleep(wait)
        continue
      }
      return res
    } catch (e) {
      done?.()
      lastError = e
      // 外部主动取消：不重试，直接抛
      if (init.signal?.aborted) throw e
      if (attempt < retries) {
        await sleep(backoffMs(attempt, baseDelay))
        continue
      }
    }
  }
  throw lastError || new Error('fetchWithRetry: 重试耗尽')
}

/**
 * 便捷方法：直接返回解析后的 JSON
 * @returns {Promise<any>}
 */
export async function fetchJson(input, init = {}, options = {}) {
  const res = await fetchWithRetry(input, init, options)
  return res.json()
}
