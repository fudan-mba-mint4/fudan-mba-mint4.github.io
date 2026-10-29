// 财务 v2 共享配置与工具
// 所有可调参数集中在 DEFAULT_FINANCE_CONFIG；线上值存 finance_config 表（后台可改），
// 读取时合并：finance_config 有值覆盖默认。前端数值由 /api/finance-v2 下发。

export const DEFAULT_FINANCE_CONFIG = {
  classSize: 69,        // 班级总人数（投票分母）
  vetoCount: 23,        // 否决红线：反对 ≥ 23 票（69 的 1/3）
  exposeDays: 3,        // 预算公示期（自然日）
  largeAmount: 500,     // 大额/小额凭证阈值（单笔 ≥500 为大额）
  warnLine: 2000,       // 余额预警线（低于此提示补充表决）
  initialBalance: 69000,// 期初班费（69 × 1000，已交齐一次性入账）
  reimbDays: 7,         // 报销提交时限（工作日）
  auditDays: 3,         // 会计审核时限（工作日）
  payDays: 3,           // 出纳打款时限（工作日）
  largeVouchers: ['invoice', 'payment'], // 大额必传：发票 + 付款凭证
  smallVouchers: ['payment', 'receipt'], // 小额必传：付款凭证 + 收据/小票
}

// 默认财务细分角色（真名；后台可调整；注册后自动关联 user_id）
export const DEFAULT_FINANCE_ROLES = [
  { name: '程枭', f_role: 'accountant' },   // 会计（审核唯一）
  { name: '李浩鹏', f_role: 'cashier' },    // 出纳（付款唯一）
  { name: '雷振宇', f_role: 'supervisor' }, // 监督人（票向唯一可见）
  { name: '高晓梅', f_role: 'treasury_staff' },
  { name: '叶宏颖', f_role: 'treasury_staff' },
]

// 支出性质大类（key 固定；zh/en/th 文案在前端 i18n）
export const FINANCE_CATEGORIES = [
  'dining', 'marketing', 'transport', 'venue', 'speaker',
  'lodging', 'ticket', 'prize', 'insurance', 'supplies', 'other',
]

// 收入来源大类
export const INCOME_CATEGORIES = ['tuition', 'sponsor', 'interest', 'other']

// 允许的凭证类型
export const VOUCHER_TYPES = ['invoice', 'payment', 'receipt', 'other']

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// 读取财务配置：finance_config 表有值覆盖默认（幂等，失败回退默认）
export async function getFinanceConfig(env) {
  const cfg = { ...DEFAULT_FINANCE_CONFIG }
  try {
    const rows = await env.DB.prepare('SELECT key, value FROM finance_config').all()
    for (const r of rows.results || []) {
      if (r.key in cfg) {
        const v = r.value
        if (typeof cfg[r.key] === 'number') {
          const n = Number(v)
          if (!Number.isNaN(n)) cfg[r.key] = n
        } else if (Array.isArray(cfg[r.key])) {
          try { cfg[r.key] = JSON.parse(v) } catch {}
        } else {
          cfg[r.key] = String(v)
        }
      }
    }
  } catch (e) { /* 表不存在等，用默认 */ }
  // 财务制度写死项（不可改、表内历史值也忽略）：班级人数 69 / 否决线 23 / 公示 3 天
  cfg.classSize = DEFAULT_FINANCE_CONFIG.classSize
  cfg.vetoCount = DEFAULT_FINANCE_CONFIG.vetoCount
  cfg.exposeDays = DEFAULT_FINANCE_CONFIG.exposeDays
  return cfg
}

// 读取财务细分角色（真名 → f_role）；未配置时用默认
export async function getFinanceRoles(env) {
  try {
    const rows = await env.DB.prepare('SELECT name, f_role, user_id FROM finance_roles').all()
    if ((rows.results || []).length > 0) return rows.results
  } catch (e) { /* 表不存在 */ }
  return DEFAULT_FINANCE_ROLES.map(r => ({ ...r, user_id: null }))
}

// 某登录用户是否为指定财务角色（按真名匹配；user_id 关联后亦可匹配）
export function hasFinanceRole(user, roles, fRole) {
  if (!user) return false
  return roles.some(r =>
    r.f_role === fRole && (r.user_id === user.id || r.name === user.name)
  )
}

// 会计（审核人）
export function isAccountant(user, roles) { return hasFinanceRole(user, roles, 'accountant') }
// 出纳（付款人）
export function isCashier(user, roles) { return hasFinanceRole(user, roles, 'cashier') }
// 监督人（票向/留言人身份唯一可见）
export function isFinanceSupervisor(user, roles) { return hasFinanceRole(user, roles, 'supervisor') }
// 财务组其他成员（只读/备岗）
export function isTreasuryStaff(user, roles) { return hasFinanceRole(user, roles, 'treasury_staff') }
// 财务相关角色（工作台可见）
export function isFinanceStaff(user, roles) {
  if (!user) return false
  return roles.some(r => r.user_id === user.id || r.name === user.name)
}

// 判断某公示此刻是否仍处于公示期
export function exposeOpen(p, now = Date.now()) {
  if (!p || p.status !== 'open') return false
  const end = p.expose_end ? new Date(p.expose_end).getTime() : 0
  const start = p.expose_start ? new Date(p.expose_start).getTime() : 0
  return now >= start && now <= end
}

// 投票统计（v2）：按赞成/反对分开；反对达到红线否决
export function voteStats(votes, config) {
  const list = Array.isArray(votes) ? votes : []
  const forCount = list.filter(v => v.choice === 'for').length
  const againstCount = list.filter(v => v.choice === 'against').length
  const total = config.classSize || 0
  const ratio = total > 0 ? againstCount / total : 0
  return {
    forCount, againstCount, total,
    uncommitted: Math.max(0, total - forCount - againstCount),
    ratio, vetoed: againstCount >= (config.vetoCount || 23),
  }
}

// 匿名反对留言（公开用：不含投票人身份，仅理由+时间）
export function anonymousReasons(votes) {
  return (Array.isArray(votes) ? votes : [])
    .filter(v => v.choice === 'against' && v.reason)
    .map(v => ({ reason: v.reason, createdAt: v.created_at }))
}

// 生成可读连续凭证编号 FT-YYYY-NNN
export async function nextVoucherNo(sql, now = new Date()) {
  const year = now.getFullYear()
  const prefix = `FT-${year}-`
  try {
    const rows = await sql`SELECT voucher_no FROM finance_tx WHERE voucher_no LIKE ${prefix + '%'} ORDER BY voucher_no DESC LIMIT 1`
    const last = rows[0]?.voucher_no
    if (last) {
      const n = parseInt(last.split('-').pop(), 10) || 0
      return `${prefix}${String(n + 1).padStart(3, '0')}`
    }
  } catch (e) { /* 无凭证编号列（旧库）→ 兜底 */ }
  return `${prefix}001`
}

// 生成预算公示编号 MF4-BM-YYYYMMDD-XX（财务小组统一编号，当天顺序号）
export async function nextProposalNo(sql, now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const datePart = `${y}${m}${d}`
  const prefix = `MF4-BM-${datePart}-`
  try {
    const rows = await sql`SELECT proposal_no FROM budget_proposals WHERE proposal_no LIKE ${prefix + '%'} ORDER BY proposal_no DESC LIMIT 1`
    const last = rows[0]?.proposal_no
    if (last) {
      const n = parseInt(last.split('-').pop(), 10) || 0
      return `${prefix}${String(n + 1).padStart(2, '0')}`
    }
  } catch (e) { /* 无编号列（旧库）→ 兜底 */ }
  return `${prefix}01`
}

// 预算公示流程状态
export const BUDGET_STATUS = {
  SUBMITTED: 'submitted', // 待审批（发起人已提交，等程枭审核）
  RETURNED: 'returned',   // 已退回（程枭退回，发起人可改后重交）
  OPEN: 'open',           // 公示中（程枭公开，3 天投票期）
  PASSED: 'passed',       // 公示通过（可执行/可关联报销）
  REJECTED: 'rejected',   // 反对 ≥1/3，驳回终止（不可动用）
  SPENT: 'spent',         // 已执行
  CANCELLED: 'cancelled', // 已取消
}

// 计算到某时限的工作日判断（简单口径：自然日，文案提示按“工作日”由前端显示）
export function dueMs(days, fromIso) {
  const from = fromIso ? new Date(fromIso).getTime() : Date.now()
  return from + days * 86400000
}
