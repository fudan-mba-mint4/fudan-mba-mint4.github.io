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

// 名录内成员的角色：headTeacher（班主任）/ mentor（传承人）/ mentorLeader（传承人组长）/ student（在读学生）
const ROSTER_ROLE_MAP = new Map(
  classMembers.members
    .filter((m) => m && m.status === 'active' && m.role)
    .map((m) => [normalizeName(m.name), m.role]),
)

// 是否本班同学（在 84 人名录内）
export function isInRoster(rawName) {
  const n = normalizeName(rawName)
  return n.length > 0 && ROSTER_SET.has(n)
}

// 某真名在名录中的角色（不在名录返回 null）
export function rosterRoleOf(rawName) {
  const n = normalizeName(rawName)
  return n ? (ROSTER_ROLE_MAP.get(n) || null) : null
}

// 名录内成员的 Orientation 分组（1-6）；无 orientationGroup 的成员（班主任、传承人组长）不进映射
const ORIENTATION_GROUP_MAP = new Map(
  classMembers.members
    .filter((m) => m && m.status === 'active' && m.orientationGroup)
    .map((m) => [normalizeName(m.name), parseInt(m.orientationGroup, 10)]),
)

// 某真名的 Orientation 分组号（1-6）；无分组或不在名录返回 null
export function orientationGroupOf(rawName) {
  const n = normalizeName(rawName)
  if (!n) return null
  const g = ORIENTATION_GROUP_MAP.get(n)
  return Number.isInteger(g) ? g : null
}

// 是否「仅可查看」身份：班主任 / 传承人（含组长）——不能参与投票、薄荷币申报、报销、报名等活动
export function isViewerOnlyName(rawName) {
  const r = rosterRoleOf(rawName)
  return r === 'headTeacher' || r === 'mentor' || r === 'mentorLeader'
}

// 白名单人数（便于自检/日志）
export const ROSTER_SIZE = ROSTER_SET.size
