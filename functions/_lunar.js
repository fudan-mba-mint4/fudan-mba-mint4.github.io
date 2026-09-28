// 农历（阴历）转换 —— 基于权威库 lunar-javascript（纯 JS，兼容浏览器 / Cloudflare Worker）。
// 对外只暴露本站需要的两个函数，内部实现与调用方解耦。
import { Lunar } from 'lunar-javascript'

// 农历 y 年 m 月 d 日（非闰月）-> 公历 Date（UTC 正午，避免时区偏移）
export function lunarToSolar(y, m, d) {
  const solar = Lunar.fromYmd(y, m, d).getSolar()
  return new Date(Date.UTC(solar.getYear(), solar.getMonth() - 1, solar.getDay(), 12))
}

// 农历日期 -> 公历 YYYY-MM-DD
export function lunarToYMD(y, m, d) {
  const solar = Lunar.fromYmd(y, m, d).getSolar()
  const mm = String(solar.getMonth()).padStart(2, '0')
  const dd = String(solar.getDay()).padStart(2, '0')
  return `${solar.getYear()}-${mm}-${dd}`
}
