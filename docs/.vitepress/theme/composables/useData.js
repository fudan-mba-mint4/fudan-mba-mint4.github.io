/**
 * 通用 JSON 数据获取
 * 统一处理各组件中重复的 fetch('/data/xxx.json') 逻辑
 * 使用方式：const { data, loading, error, reload } = useData('/data/announcements.json')
 *
 * 支持数据库优先：传入 options.dbUrl（公开只读 API），先用短超时原生 fetch 探测 DB，
 * 成功则用 DB 数据；失败/超时快速回退到静态 JSON url。
 *   useData('/data/course-materials.json', { dbUrl: '/api/course-materials-db' })
 */
import { ref, onMounted } from 'vue'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

const cache = new Map()

export function useData(url, options = {}) {
  const { useCache = true, dbUrl = null, dbTimeout = 4000 } = options
  const cacheKey = dbUrl || url
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const source = ref('static')

  async function tryDb() {
    if (!dbUrl) return false
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), dbTimeout)
    try {
      const r = await fetch(dbUrl, { signal: ctrl.signal })
      if (!r.ok) return false
      const j = await r.json()
      if (!j || j.error) return false
      data.value = j
      source.value = 'db'
      if (useCache) cache.set(cacheKey, j)
      return true
    } catch {
      return false
    } finally {
      clearTimeout(timer)
    }
  }

  async function fetchData(force = false) {
    loading.value = true
    error.value = null
    try {
      if (useCache && !force && cache.has(cacheKey)) {
        data.value = cache.get(cacheKey)
        source.value = cacheKey === url ? 'static' : 'db'
        loading.value = false
        return
      }
      // 1. DB 优先（短超时探测，不重试，快速失败）
      if (dbUrl && await tryDb()) {
        loading.value = false
        return
      }
      // 2. 回退静态 JSON
      const res = await fetchWithRetry(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      data.value = json
      source.value = 'static'
      if (useCache) cache.set(cacheKey, json)
    } catch (e) {
      error.value = e.message
      console.error(`[useData] Failed to fetch ${url}:`, e)
    } finally {
      loading.value = false
    }
  }

  function reload() {
    return fetchData(true)
  }

  onMounted(() => {
    fetchData()
  })

  return { data, loading, error, source, reload }
}

/**
 * 预加载数据（在页面空闲时提前获取，加快后续页面访问）
 */
export function preloadData(urls) {
  urls.forEach(url => {
    if (!cache.has(url)) {
      fetch(url)
        .then(res => res.json())
        .then(json => cache.set(url, json))
        .catch(() => {})
    }
  })
}

/**
 * 清除数据缓存
 */
export function clearDataCache(url) {
  if (url) {
    cache.delete(url)
  } else {
    cache.clear()
  }
}
