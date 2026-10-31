import { ref, computed } from 'vue'
import { useRoute } from 'vitepress'

/**
 * 供纯客户端日期格式化使用的模块级语言标记（formatDate / formatRelative）；
 * 这些函数只在浏览器端事件/渲染中调用，不参与 SSR 预渲染，因此不影响页面语言判定。
 */
const clientLang = ref('zh')

function detectLangFromPath(path) {
  if (!path) return 'zh'
  if (path.startsWith('/en/') || path === '/en') return 'en'
  if (path.startsWith('/th/') || path === '/th') return 'th'
  return 'zh'
}

/**
 * 统一语言检测 composable
 * 根据当前路由路径前缀判断语言：/en/ → en, /th/ → th, 默认 zh。
 * 优先使用 VitePress 响应式 route.path（SSR 预渲染与 SPA 切换都可靠），
 * window.location 仅作非组件上下文兜底；不要使用模块级共享 ref，避免多页面 SSR 串语言。
 */
export function useLang(i18nDict) {
  let route = null
  try {
    route = useRoute()
  } catch (e) {
    route = null
  }

  const lang = computed(() => {
    let path = ''
    if (route && route.path) path = route.path
    else if (typeof window !== 'undefined') path = window.location.pathname
    const detected = detectLangFromPath(path)
    clientLang.value = detected
    return detected
  })

  const t = computed(() => {
    if (!i18nDict) return {}
    return i18nDict[lang.value] || i18nDict.zh || {}
  })

  return { lang, t }
}

/**
 * 将日期字符串解析为本地零点（避免 UTC 解析导致的时区偏移）
 */
function parseLocalDate(dateStr) {
  // 如果已经包含时间部分，直接解析；否则补 T00:00:00 按本地时区
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00')
  }
  return new Date(dateStr)
}

/**
 * 多语言日期格式化
 * 统一走 Intl，泰语自动佛历
 */
export function formatDate(dateStr, options = {}) {
  const locale = clientLang.value === 'th' ? 'th-TH-u-ca-buddhist' : clientLang.value === 'en' ? 'en-US' : 'zh-CN'
  const defaultOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(parseLocalDate(dateStr))
}

/**
 * 多语言相对时间（如"3天后"）
 */
export function formatRelative(dateStr) {
  const locale = clientLang.value === 'th' ? 'th' : clientLang.value === 'en' ? 'en' : 'zh'
  const target = parseLocalDate(dateStr)
  // 按天比较（取本地零点差，避免时分秒导致"今天"误判）
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diff = Math.round((targetMidnight - todayMidnight) / 86400000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  return rtf.format(diff, 'day')
}
