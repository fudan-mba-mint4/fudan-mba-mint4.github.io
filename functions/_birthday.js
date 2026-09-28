// 生日「当天寿星」计算核心 —— 服务端预计算，前端只拿结果。
import { lunarToSolar } from './_lunar.js'

// 中国标准时间（UTC+8，无夏令时）的当天日期
export function getShanghaiDateParts(now = Date.now()) {
  const iso = new Date(now + 8 * 3600 * 1000).toISOString().slice(0, 10)
  const [Y, M, D] = iso.split('-').map(Number)
  return { iso, Y, M, D }
}

// 计算指定日期的寿星：
//  - 阳历：月/日相等即命中
//  - 农历：把农历月日换算为公历（同时尝试当前公历年与前一年，覆盖年初边界），
//    落到当天即命中
//  - celebrate=0 的同学（不主动为其庆祝）跳过
// 撞期多人：names 并列，displayNames 用全角竖线「｜」连接。
export async function computeBirthday(sql, { iso, Y, M, D }) {
  const rows = await sql`
    SELECT name, cal_type, month, day, celebrate
    FROM classmates_birthday
  `
  const names = []
  for (const r of rows) {
    if (!r.celebrate) continue
    let hit = false
    if (r.cal_type === 'solar') {
      hit = r.month === M && r.day === D
    } else {
      for (const y of [Y, Y - 1]) {
        const sol = lunarToSolar(y, r.month, r.day)
        if (sol.toISOString().slice(0, 10) === iso) { hit = true; break }
      }
    }
    if (hit) names.push(r.name)
  }
  return {
    celebrate: names.length > 0,
    names,
    displayNames: names.join('｜'),
  }
}
