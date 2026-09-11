import { ref, computed } from 'vue'

const lang = ref('zh')

/**
 * 统一语言检测 composable
 * 根据 URL 路径前缀判断当前语言：/en/ → en, /th/ → th, 默认 zh
 * 每次调用都重新检测（支持 SPA 内路由切换语言）
 */
export function useLang(i18nDict) {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname
    if (path.startsWith('/en/')) lang.value = 'en'
    else if (path.startsWith('/th/')) lang.value = 'th'
    else lang.value = 'zh'
  }

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
  const locale = lang.value === 'th' ? 'th-TH-u-ca-buddhist' : lang.value === 'en' ? 'en-US' : 'zh-CN'
  const defaultOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(parseLocalDate(dateStr))
}

/**
 * 多语言相对时间（如"3天后"）
 */
export function formatRelative(dateStr) {
  const locale = lang.value === 'th' ? 'th' : lang.value === 'en' ? 'en' : 'zh'
  const target = parseLocalDate(dateStr)
  // 按天比较（取本地零点差，避免时分秒导致"今天"误判）
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diff = Math.round((targetMidnight - todayMidnight) / 86400000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  return rtf.format(diff, 'day')
}
