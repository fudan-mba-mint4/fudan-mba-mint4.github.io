// 后台「用户管理」专用：注册账号 ↔ 班级名录对齐（纯函数，无 DB 依赖，便于单测）
// 单一身份口径（与同学名录页、注册白名单一致）：
//   headTeacher 班主任（贺婧）/ mentor 传承人 / mentorLeader 传承人组长 / student 在读同学
// 规则：
//   1) 班委（DB users.role 非空，来源 COMMITTEE_ROLES）一定是在读学生；
//   2) 班主任 / 传承人（含组长）为只读身份，可存在账号但不参与投票/申报等活动；
//   3) 未注册同学 = 活跃名录中的在读学生，且 D1 users 表无同名（normalizeName 归一）账号；
//   4) 异常账号 = 已注册但不在活跃名录（已退出/休学或姓名不一致），供主理人核对。
import {
  getActiveMembers, normalizeName, rosterRoleOf, rosterStatusOf, inactiveStatusOf,
} from './_roster.js'

export const ROSTER_LABEL = {
  headTeacher: '班主任',
  mentor: '传承人',
  mentorLeader: '传承人（组长）',
  student: '在读同学',
}

const INACTIVE_LABEL = { withdrawn: '已退出', suspended: '休学' }

// 账号行附加名录身份字段（不改变 DB 原始字段）
export function enrichAccount(row) {
  const role = rosterRoleOf(row.name)
  return {
    ...row,
    rosterRole: role,
    rosterLabel: role ? ROSTER_LABEL[role] : null,
    rosterStatus: rosterStatusOf(row.name),
  }
}

// rows: D1 users 行（id, username, name, nickname, group_no, role, created_at）
// committeeRoles: COMMITTEE_ROLES（真名 → 班委职务 key），由调用方从 _utils 传入，避免循环依赖
export function buildRosterAlignment(rows, committeeRoles = {}) {
  const members = getActiveMembers()
  const accountByNormName = new Map()
  for (const row of rows || []) {
    const n = normalizeName(row.name)
    if (n && !accountByNormName.has(n)) accountByNormName.set(n, row)
  }

  const students = members
    .filter((m) => m.role === 'student')
    .map((m) => {
      const acc = accountByNormName.get(normalizeName(m.name)) || null
      return {
        id: m.id,
        name: m.name,
        nickname: m.nickname || '',
        group: m.orientationGroup,
        rosterRole: m.role,
        rosterLabel: ROSTER_LABEL[m.role],
        committeeRole: committeeRoles[m.name] || null,
        registered: !!acc,
        userId: acc ? acc.id : null,
        username: acc ? acc.username : null,
      }
    })

  const observers = members
    .filter((m) => m.role !== 'student')
    .map((m) => {
      const acc = accountByNormName.get(normalizeName(m.name)) || null
      return {
        id: m.id,
        name: m.name,
        nickname: m.nickname || '',
        rosterRole: m.role,
        rosterLabel: ROSTER_LABEL[m.role] || m.role,
        registered: !!acc,
        userId: acc ? acc.id : null,
        username: acc ? acc.username : null,
      }
    })

  const unregisteredStudents = students.filter((s) => !s.registered)

  const unknownAccounts = (rows || [])
    .filter((row) => rosterStatusOf(row.name) !== 'active')
    .map((row) => {
      const inactive = inactiveStatusOf(row.name)
      return {
        id: row.id,
        username: row.username,
        name: row.name,
        nickname: row.nickname || '',
        role: row.role || null,
        groupNo: row.group_no ?? null,
        reason: inactive
          ? `名录状态：${INACTIVE_LABEL[inactive] || inactive}（不在注册白名单）`
          : '非名录姓名，需人工核对',
      }
    })

  return {
    users: (rows || []).map(enrichAccount),
    labels: ROSTER_LABEL,
    summary: {
      activeTotal: members.length,
      students: students.length,
      observers: observers.length,
      unregisteredStudents: unregisteredStudents.length,
      registeredObservers: observers.filter((o) => o.registered).length,
      unknownAccounts: unknownAccounts.length,
    },
    students,
    unregisteredStudents,
    observers,
    unknownAccounts,
  }
}
