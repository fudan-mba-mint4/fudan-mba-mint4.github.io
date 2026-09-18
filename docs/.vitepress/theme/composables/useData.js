/**
 * 通用 JSON 数据获取
 * 统一处理各组件中重复的 fetch('/data/xxx.json') 逻辑
 * 使用方式：const { data, loading, error, reload } = useData('/data/announcements.json')
 */
import { ref, onMounted } from 'vue'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

const cache = new Map()

/**
 * @param {string} url - JSON 文件路径，如 '/data/announcements.json'
 * @param {object} options
 * @param {boolean} options.watch - 是否启用缓存，默认 true
 * @returns {{ data: import('vue').Ref<any>, loading: import('vue').Ref<boolean>, error: import('vue').Ref<string|null>, reload: () => Promise<void> }}
 */
export function useData(url, options = {}) {
  const { useCache = true } = options
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)

  async function fetchData(force = false) {
    loading.value = true
    error.value = null
    try {
      if (useCache && !force && cache.has(url)) {
        data.value = cache.get(url)
        loading.value = false
        return
      }
      const res = await fetchWithRetry(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      data.value = json
      if (useCache) cache.set(url, json)
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

  return { data, loading, error, reload }
}

/**
 * 预加载数据（在页面空闲时提前获取，加快后续页面访问）
 * @param {string[]} urls
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
 * @param {string} [url] - 指定URL，不传则清除全部
 */
export function clearDataCache(url) {
  if (url) {
    cache.delete(url)
  } else {
    cache.clear()
  }
}
