import { ref, computed, onMounted } from 'vue'

const lang = ref('zh')
let detected = false

/**
 * 统一语言检测 composable
 * 根据 URL 路径前缀判断当前语言：/en/ → en, /th/ → th, 默认 zh
 * 全组件共享同一个 lang ref，避免每个组件重复 onMounted 检测
 */
export function useLang(i18nDict) {
  if (!detected) {
    detected = true
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path.startsWith('/en/')) lang.value = 'en'
      else if (path.startsWith('/th/')) lang.value = 'th'
      else lang.value = 'zh'
    }
  }

  const t = computed(() => {
    if (!i18nDict) return {}
    return i18nDict[lang.value] || i18nDict.zh || {}
  })

  return { lang, t }
}

/**
 * 多语言日期格式化
 * 统一走 Intl，泰语自动佛历
 */
export function formatDate(dateStr, options = {}) {
  const locale = lang.value === 'th' ? 'th-TH-u-ca-buddhist' : lang.value === 'en' ? 'en-US' : 'zh-CN'
  const defaultOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(new Date(dateStr))
}

/**
 * 多语言相对时间（如"3天后"）
 */
export function formatRelative(dateStr) {
  const locale = lang.value === 'th' ? 'th' : lang.value === 'en' ? 'en' : 'zh'
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (diff === 0) return rtf.format(0, 'day')
  return rtf.format(diff, 'day')
}
