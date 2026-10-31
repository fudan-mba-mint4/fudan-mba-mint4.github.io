/**
 * 由 schedule.json 同步生成：
 *  1) docs/public/data/schedule.ics —— RFC 5545 iCalendar 文件（手机日历/支付宝课表导入）
 *  2) docs/public/data/schedule-qr.png —— 指向线上 ICS 链接的二维码
 *
 * 用法：node scripts/generate-schedule-calendar.mjs（已接入 docs:build 前置）
 * 注意：二维码内容使用线上域名（https://mint4.cn），本地验证不影响文件本身；
 *       只有 push 上线后扫码/链接才指向真实可访问的 ICS。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import qrcode from 'qrcode'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const SITE_URL = 'https://mint4.cn' // 线上域名（二维码内容），与 CF Pages 站点一致

const schedule = JSON.parse(readFileSync(path.join(root, 'docs/public/data/schedule.json'), 'utf8'))

/* ---------- ICS 生成 ---------- */
const fmtDt = (date, time) => `${date.replaceAll('-', '')}T${time.replaceAll(':', '')}00` // 浮动本地时间（HHMMSS）

// RFC 5545：行 <=75 字节（含 CRLF），超出以空格续行折叠
const fold = (line) => {
  const max = 73 // 75 - CRLF(2)
  const bytes = Buffer.byteLength(line)
  if (bytes <= max) return line
  let out = ''
  let rest = line
  let first = true
  while (Buffer.byteLength(rest) > max) {
    let cut = max
    while (cut > 0 && Buffer.byteLength(rest.slice(0, cut)) > max) cut--
    out += (first ? '' : '\r\n ') + rest.slice(0, cut)
    rest = rest.slice(cut)
    first = false
  }
  if (rest) out += (first ? '' : '\r\n ') + rest
  return out
}

const lines = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Mint4 Class Homepage//Schedule//ZH',
  'CALSCALE:GREGORIAN',
  'X-WR-CALNAME:复旦MBA薄荷4班 课表',
]
for (const day of schedule.schedule) {
  for (const c of day.courses) {
    const exam = !!c.exam
    const summary = exam ? `${c.course}（期末考试）` : c.course
    const description = exam ? `期末考试 · 主讲：${c.teacher}` : `主讲：${c.teacher}`
    lines.push(
      'BEGIN:VEVENT',
      `UID:${day.date}-${c.course}@mint4.cn`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART:${fmtDt(c.date || day.date, c.time_start)}`,
      `DTEND:${fmtDt(c.date || day.date, c.time_end)}`,
      `SUMMARY:${summary}`,
      `LOCATION:${c.location || ''}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
    )
  }
}
lines.push('END:VCALENDAR', '')

const ics = lines.map(fold).join('\r\n')
writeFileSync(path.join(root, 'docs/public/data/schedule.ics'), ics, 'utf8')

/* ---------- 二维码 ---------- */
await qrcode.toFile(
  path.join(root, 'docs/public/data/schedule-qr.png'),
  `${SITE_URL}/data/schedule.ics`,
  { errorCorrectionLevel: 'M', width: 480, margin: 1 },
)

const eventCount = schedule.schedule.reduce((n, d) => n + d.courses.length, 0)
console.log(`[gen-schedule] schedule.ics 已生成（${eventCount} 个日程）`)
console.log(`[gen-schedule] schedule-qr.png 已生成（指向 ${SITE_URL}/data/schedule.ics）`)
