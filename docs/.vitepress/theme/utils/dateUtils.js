/**
 * 日期工具函数
 * 统一处理全站的日期解析、格式化、倒计时、排序等逻辑
 * 所有组件应使用本模块，避免重复实现
 */

/**
 * 解析日期字符串为 Date 对象
 * 统一处理 'YYYY-MM-DD' 格式，避免时区问题
 * @param {string} dateStr - 日期字符串，如 '2026-09-13'
 * @returns {Date}
 */
export function parseDate(dateStr) {
  if (!dateStr) return new Date('1970-01-01T00:00:00')
  // 如果已经包含时间（如 '2026-09-13T14:00:00'），直接解析
  if (dateStr.includes('T')) return new Date(dateStr)
  // 否则补上 T00:00:00，避免 UTC 时区偏移
  return new Date(dateStr + 'T00:00:00')
}

/**
 * 解析日期时间字符串
 * @param {string} date - 日期 'YYYY-MM-DD'
 * @param {string} time - 时间 'HH:MM'
 * @returns {Date}
 */
export function parseDateTime(date, time) {
  return new Date(`${date}T${time}:00`)
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期字符串或 Date 对象
 * @param {string} locale - 语言标签，如 'zh-CN', 'en-US', 'th-TH'
 * @param {object} options - Intl.DateTimeFormat 选项
 * @returns {string}
 */
export function formatDate(date, locale = 'zh-CN', options = {}) {
  const d = typeof date === 'string' ? parseDate(date) : date
  return new Intl.DateTimeFormat(locale, options).format(d)
}

/**
 * 短日期格式（月-日），如 '9月13日' / 'Sep 13'
 * @param {string} dateStr
 * @param {string} lang - 'zh' | 'en' | 'th'
 * @returns {string}
 */
export function formatShortDate(dateStr, lang = 'zh') {
  const localeMap = { zh: 'zh-CN', en: 'en-US', th: 'th-TH' }
  return formatDate(dateStr, localeMap[lang] || 'zh-CN', { month: 'short', day: 'numeric' })
}

/**
 * 长日期格式（年-月-日），如 '2026年9月13日'
 * @param {string} dateStr
 * @param {string} lang
 * @returns {string}
 */
export function formatLongDate(dateStr, lang = 'zh') {
  const localeMap = { zh: 'zh-CN', en: 'en-US', th: 'th-TH' }
  return formatDate(dateStr, localeMap[lang] || 'zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * 计算倒计时
 * @param {Date|string} target - 目标时间
 * @param {Date} now - 当前时间
 * @returns {{days: number, hours: number, minutes: number, totalMs: number, isPast: boolean}}
 */
export function getCountdown(target, now = new Date()) {
  const targetDate = typeof target === 'string' ? parseDateTime(target.split('T')[0], target.split('T')[1]?.slice(0, 5) || '00:00') : target
  const totalMs = targetDate.getTime() - now.getTime()
  const isPast = totalMs <= 0
  const absMs = Math.abs(totalMs)
  return {
    days: Math.floor(absMs / 86400000),
    hours: Math.floor((absMs % 86400000) / 3600000),
    minutes: Math.floor((absMs % 3600000) / 60000),
    totalMs,
    isPast,
  }
}

/**
 * 判断是否今天
 * @param {string} dateStr
 * @param {Date} now
 * @returns {boolean}
 */
export function isToday(dateStr, now = new Date()) {
  return parseDate(dateStr).toDateString() === now.toDateString()
}

/**
 * 判断活动/课程是否进行中
 * @param {string} date - 日期
 * @param {string} startTime - 开始时间 'HH:MM'
 * @param {string} endTime - 结束时间 'HH:MM'
 * @param {Date} now
 * @returns {boolean}
 */
export function isOngoing(date, startTime, endTime, now = new Date()) {
  const start = parseDateTime(date, startTime)
  const end = parseDateTime(date, endTime)
  return now >= start && now <= end
}

/**
 * 按日期降序排序（新的在前）
 * @param {Array} list - 数据数组
 * @param {string} dateField - 日期字段名
 * @returns {Array} 排序后的新数组
 */
export function sortByDateDesc(list, dateField = 'date') {
  return [...list].sort((a, b) => parseDate(b[dateField]) - parseDate(a[dateField]))
}

/**
 * 按日期升序排序（旧的在前）
 * @param {Array} list
 * @param {string} dateField
 * @returns {Array}
 */
export function sortByDateAsc(list, dateField = 'date') {
  return [...list].sort((a, b) => parseDate(a[dateField]) - parseDate(b[dateField]))
}

/**
 * 获取月份中文名称
 * @param {number} month - 0-11
 * @returns {string}
 */
export function getMonthName(month) {
  const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return names[month] || ''
}

/**
 * 获取星期中文名称
 * @param {number} day - 0-6 (0=周日)
 * @returns {string}
 */
export function getWeekdayName(day) {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return names[day] || ''
}

/**
 * 相对时间描述，如 '3天后'、'昨天'、'刚刚'
 * @param {string} dateStr
 * @param {Date} now
 * @param {string} lang
 * @returns {string}
 */
export function relativeTime(dateStr, now = new Date(), lang = 'zh') {
  const date = parseDate(dateStr)
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / 86400000)

  const i18n = {
    zh: { today: '今天', tomorrow: '明天', yesterday: '昨天', daysLater: '天后', daysAgo: '天前' },
    en: { today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday', daysLater: ' days later', daysAgo: ' days ago' },
    th: { today: 'วันนี้', tomorrow: 'พรุ่งนี้', yesterday: 'เมื่อวาน', daysLater: ' วันหลัง', daysAgo: ' วันที่แล้ว' },
  }
  const t = i18n[lang] || i18n.zh

  if (diffDays === 0) return t.today
  if (diffDays === 1) return t.tomorrow
  if (diffDays === -1) return t.yesterday
  if (diffDays > 1) return diffDays + t.daysLater
  return Math.abs(diffDays) + t.daysAgo
}

/**
 * 获取当前日期字符串 'YYYY-MM-DD'
 * @returns {string}
 */
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}
