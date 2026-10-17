// 班级同学名录（注册白名单）
// 单一数据源：docs/public/data/class-members.json（与“同学名录”页是同一份文件）。
// 仅 status === 'active' 的成员可注册，当前共 84 人：
//   班主任 + 传承人（含传承人 leader）+ 在读学生；
//   status === 'withdrawn'（已退出/退学）的同学不在白名单内。
import classMembers from '../docs/public/data/class-members.json'

// 规范化姓名：
// 1) NFKC 归一（全角字母/数字/符号 → 半角等）；
// 2) 去除所有空白（含普通空格、全角空格 U+3000、Tab、换行），避免误输入空格导致不匹配。
// 中文姓名通常不含空格，去除空白不影响正常姓名。姓名以同学名录为准，不做异体字替换。
export function normalizeName(raw) {
  if (raw === null || raw === undefined) return ''
  return String(raw).normalize('NFKC').replace(/[\s　]+/g, '')
}

const ROSTER_SET = new Set(
  classMembers.members
    .filter((m) => m && m.status === 'active')
    .map((m) => normalizeName(m.name)),
)

// 是否本班同学（在 84 人名录内）
export function isInRoster(rawName) {
  const n = normalizeName(rawName)
  return n.length > 0 && ROSTER_SET.has(n)
}

// 白名单人数（便于自检/日志）
export const ROSTER_SIZE = ROSTER_SET.size
