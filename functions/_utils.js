// Cloudflare Pages Functions 共享工具
// 数据库访问（Cloudflare D1 / SQLite）、密码哈希、CORS、请求解析等

import { createD1Sql } from './_d1.js'
import { isViewerOnlyName } from './_roster.js'

// 数据库为 Cloudflare D1（SQLite），通过 Pages Functions 的 D1 binding（env.DB）
// 在 Cloudflare 网络内部访问：毫秒级、无外部连接、无冷启动。
export function getSql(env) {
  if (!env.DB) {
    throw new Error('D1 数据库绑定（env.DB）未配置：请在 Pages 项目绑定 D1，本地用 --d1=DB')
  }
  return createD1Sql(env.DB)
}

// ===== D1（SQLite）建表 Schema =====
// 时间列统一存「带 Z 的 ISO 字符串」（UTC），默认值用 strftime 生成，
// 与前端 new Date(iso) 解析、JS toISOString() 完全一致。
const SCHEMA = `
CREATE TABLE IF NOT EXISTS treehole_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT,
  content TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  ip_hash TEXT,
  user_id TEXT,
  anonymous INTEGER DEFAULT 1,
  anon_hash TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_treehole_created_at ON treehole_messages (created_at DESC);
CREATE TABLE IF NOT EXISTS treehole_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  user_name TEXT NOT NULL,
  step_count INTEGER DEFAULT 1,
  last_stepped_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS treehole_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  anonymous INTEGER DEFAULT 1,
  content TEXT NOT NULL,
  ip_hash TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_treehole_comments_msg ON treehole_comments (message_id, created_at);

CREATE TABLE IF NOT EXISTS poll_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  user_id TEXT,
  anonymous INTEGER DEFAULT 0,
  ip_hash TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes (poll_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes (poll_id, user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  group_no INTEGER,
  role TEXT,
  token TEXT,
  token_expires_at TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS activity_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  username TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(activity_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_activity_signups_activity ON activity_signups (activity_id);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  date TEXT,
  category TEXT,
  pinned INTEGER DEFAULT 0,
  data TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  date TEXT,
  status TEXT,
  data TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS finance_records (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data TEXT,
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS polls_admin (
  id TEXT PRIMARY KEY,
  data TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS city_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  country TEXT,
  city TEXT,
  lat REAL DEFAULT 0,
  lng REAL DEFAULT 0,
  visited_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_city_visits_ip_time ON city_visits (ip_hash, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_visits_city ON city_visits (city);

CREATE TABLE IF NOT EXISTS admin_history (
  id TEXT PRIMARY KEY,
  type TEXT,
  action TEXT,
  ref_id TEXT,
  description TEXT,
  operator TEXT,
  status TEXT DEFAULT 'success',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_history_created ON admin_history (created_at DESC);

CREATE TABLE IF NOT EXISTS course_materials (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data TEXT,
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data TEXT,
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  title TEXT,
  body TEXT,
  module_path TEXT,
  operator TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);

CREATE TABLE IF NOT EXISTS finance_reminders (
  key TEXT PRIMARY KEY,
  type TEXT,
  ref_id TEXT,
  sent_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS classmates_birthday (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  nickname TEXT DEFAULT '',
  cal_type TEXT DEFAULT 'solar',
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  celebrate INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS birthday_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  device_key TEXT,
  view_date TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_birthday_views_date ON birthday_views (view_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_birthday_views_user_date ON birthday_views (user_id, view_date) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS birthday_today (
  day_key TEXT PRIMARY KEY,
  data TEXT,
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ===== 许愿池（朋友圈式活动需求收集） =====
CREATE TABLE IF NOT EXISTS activity_wishes (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT DEFAULT '[]',   -- JSON 数组，最多 3 张 R2 图片 URL
  activity_id TEXT,           -- 班委定档后关联的活动 id
  status TEXT DEFAULT 'open', -- open / scheduled / closed
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_wishes_created ON activity_wishes (created_at DESC);

CREATE TABLE IF NOT EXISTS activity_wish_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wish_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  author TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(wish_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_wish_likes_wish ON activity_wish_likes (wish_id);

CREATE TABLE IF NOT EXISTS activity_wish_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wish_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_wish_comments_wish ON activity_wish_comments (wish_id);

-- ===== 班费线上化（预算事前投票 / 报销审批 / 结构化流水） v2 =====
CREATE TABLE IF NOT EXISTS finance_tx (
  id TEXT PRIMARY KEY,
  voucher_no TEXT,             -- 凭证编号，如 FT-2026-001（可读、连续）
  date TEXT NOT NULL,
  type TEXT NOT NULL,          -- income / expense
  category TEXT NOT NULL,      -- 支出性质大类 key（FINANCE_CATEGORIES）
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  items TEXT DEFAULT '[]',     -- JSON 数组 [{category,amount,description}] 多行明细（分类-金额），空=单笔
  is_demo INTEGER DEFAULT 0,   -- 临时示例数据标记（1=演示，正式启用清理时按此删除）
  activity_id TEXT,
  proposal_id TEXT,
  reimbursement_id TEXT,
  vouchers TEXT DEFAULT '[]',  -- JSON 数组 [{type,url,name}]
  handler TEXT,                -- 经手人
  checker TEXT,                -- 复核人（财务）
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_finance_tx_date ON finance_tx (date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_tx_activity ON finance_tx (activity_id);

CREATE TABLE IF NOT EXISTS budget_proposals (
  id TEXT PRIMARY KEY,
  proposal_no TEXT DEFAULT '',      -- 公示编号 MF4-BM-YYYYMMDD-XX（财务小组统一编号，自动生成）
  activity_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  detail_items TEXT DEFAULT '[]',  -- 预算明细 JSON [{item, qty, unitPrice, amount, category, note}]
  amount REAL NOT NULL,            -- 预算上限
  proposer TEXT DEFAULT '',        -- 申请人真名
  proposer_id INTEGER,
  applicant_id TEXT DEFAULT '',    -- 发起人 user_id（前台全员可发起）
  group_name TEXT DEFAULT '',      -- 申请小组/部门（体验组/记忆组/学术组/生活组/财务组/其他项目组）
  contact TEXT DEFAULT '',         -- 联系方式（选填）
  event_type TEXT DEFAULT '',      -- 事项性质：常规事项 / 非常规事项
  activity_type TEXT DEFAULT '',   -- 活动类型（含括号说明的全称）
  pay_target TEXT DEFAULT '',      -- 资金支付对象：淘宝商家/场地租赁方/个人垫付报销/其他
  redlines TEXT DEFAULT '',        -- 财务红线核对确认 JSON {r1:bool, r2:bool, r3:bool}
  returned_reason TEXT DEFAULT '', -- 程枭退回原因（status=returned 时展示）
  sync_time TEXT,                  -- 微信群同步链接时间（程枭公开时自动记为当天，可改）
  expose_type TEXT DEFAULT 'normal', -- normal / emergency（紧急·事后补公示）
  status TEXT DEFAULT 'submitted', -- submitted(待审批) / returned(已退回) / open(公示中) / passed(已通过) / rejected(已否决) / spent(已执行) / cancelled(已取消)
  expose_start TEXT,
  expose_end TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  settled_at TEXT,
  is_demo INTEGER DEFAULT 0      -- 临时示例数据标记（1=演示，正式启用清理时按此删除）
);
CREATE INDEX IF NOT EXISTS idx_budget_proposals_status ON budget_proposals (status);

-- v2 预算投票：赞成/反对一人一票、不可撤回；反对理由匿名公开（票向仅监督人可见）
CREATE TABLE IF NOT EXISTS budget_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  choice TEXT NOT NULL,           -- for / against
  reason TEXT DEFAULT '',         -- 反对理由（against 时可填，匿名公开）
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(proposal_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_budget_votes_proposal ON budget_votes (proposal_id);

-- 旧版异议表（仅反对、可覆盖）：v2 起不再读写，仅保留定义兼容历史数据
CREATE TABLE IF NOT EXISTS budget_objections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(proposal_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_budget_objections_proposal ON budget_objections (proposal_id);

CREATE TABLE IF NOT EXISTS reimbursements (
  id TEXT PRIMARY KEY,
  proposal_id TEXT,
  activity_id TEXT,
  applicant TEXT NOT NULL,         -- 申请人真名
  applicant_id INTEGER NOT NULL,
  expense_date TEXT,
  amount REAL NOT NULL,
  category TEXT,
  description TEXT DEFAULT '',
  vouchers TEXT DEFAULT '[]',      -- JSON [{type,url,name}]
  endorsement TEXT DEFAULT '',     -- 签字背书 JSON {committee:{name,at}}（≥500 无发票场景）
  status TEXT DEFAULT 'submitted', -- submitted / need_revision / approved / paid / rejected
  audit_by TEXT,
  audit_at TEXT,
  audit_note TEXT,
  paid_by TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  is_demo INTEGER DEFAULT 0      -- 临时示例数据标记（1=演示，正式启用清理时按此删除）
);
CREATE INDEX IF NOT EXISTS idx_reimbursements_applicant ON reimbursements (applicant_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursements (status);

-- v2 财务全局参数（后台可配置；无值用代码内默认）
CREATE TABLE IF NOT EXISTS finance_config (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- v2 财务细分角色（按真名配置，支持后台调整；注册后自动关联 user_id）
CREATE TABLE IF NOT EXISTS finance_roles (
  name TEXT PRIMARY KEY,
  f_role TEXT NOT NULL,            -- accountant / cashier / supervisor / treasury_staff
  user_id INTEGER,
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- v2 小荷包对账记录（出纳登记；可关联预算公示/报销单）
CREATE TABLE IF NOT EXISTS reconcilations (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  actual_balance REAL NOT NULL,    -- 小荷包实际余额
  note TEXT DEFAULT '',
  proposal_id TEXT,                -- 关联预算公示（可空）
  reimbursement_id TEXT,           -- 关联报销单（可空）
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  is_demo INTEGER DEFAULT 0      -- 临时示例数据标记（1=演示，正式启用清理时按此删除）
);
CREATE INDEX IF NOT EXISTS idx_reconcilations_date ON reconcilations (date DESC);

-- ===== 薄荷币激励体系（纯虚拟积分，与班费现金严格隔离） =====
CREATE TABLE IF NOT EXISTS coin_accounts (
  user_id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 1,   -- 当前余额（注册可得初始 1 币，计划 P43 口径）
  is_demo INTEGER DEFAULT 0,   -- 临时示例数据标记（1=演示，正式启用清理时按此删除）
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS coin_rules (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  name_th TEXT DEFAULT '',
  amount INTEGER NOT NULL DEFAULT 1,     -- 单次奖励币数
  unit TEXT DEFAULT 'fixed',             -- fixed（固定） / per_activity（按活动）
  category TEXT DEFAULT 'contribution',  -- contribution/organize/resource/help/other
  is_routine INTEGER DEFAULT 1,          -- 1=常规（系统快速复核） 0=非常规（人工审核）
  status INTEGER DEFAULT 1,              -- 1=启用 0=停用
  note TEXT DEFAULT '',
  is_demo INTEGER DEFAULT 0,   -- 临时示例数据标记（1=演示，正式启用清理时按此删除）
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS coin_claims (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,             -- 申报人
  applicant TEXT NOT NULL,              -- 申报人真名
  rule_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  activity_id TEXT,
  proofs TEXT DEFAULT '[]',             -- JSON [{url,name}] ≤3
  recipients TEXT DEFAULT '[]',         -- JSON [{userId,name,amount}] 获币名单
  total INTEGER DEFAULT 0,              -- 本次发放总数
  status TEXT DEFAULT 'pending',        -- pending / approved / rejected
  auditor TEXT,
  audit_note TEXT,
  is_demo INTEGER DEFAULT 0,   -- 临时示例数据标记（1=演示，正式启用清理时按此删除）
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  audited_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_coin_claims_user ON coin_claims (user_id);
CREATE INDEX IF NOT EXISTS idx_coin_claims_status ON coin_claims (status);

CREATE TABLE IF NOT EXISTS coin_ledger (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  delta INTEGER NOT NULL,               -- 正=赚 负=花
  type TEXT DEFAULT 'earn',             -- earn / spend / adjust
  rule_id TEXT,
  ref_id TEXT,                          -- 关联 claim/order id
  ref_type TEXT DEFAULT 'claim',
  balance_after INTEGER,
  operator TEXT,                        -- 经办班委真名
  note TEXT DEFAULT '',
  is_demo INTEGER DEFAULT 0,   -- 临时示例数据标记（1=演示，正式启用清理时按此删除）
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_coin_ledger_user ON coin_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_ledger_created ON coin_ledger (created_at DESC);
`

// 初始化数据库表（幂等）。D1 的 exec 支持一次执行多语句。
// 只在「懒初始化兜底」（查询报 no such table）或需要时调用，不在每个冷节点
// 首请求的热路径上跑。
export async function initDatabase(env) {
  // 逐条执行建表语句：D1 exec 一次性跑整个 SCHEMA 在个别语句上会解析失败，
  // 拆分后每条独立执行更稳；CREATE ... IF NOT EXISTS 本身幂等。
  const stmts = SCHEMA.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'))
  for (const s of stmts) {
    try { await env.DB.exec(s + ';') }
    catch (e) {
      if (/already exists/i.test(String((e && e.message) || e || ''))) continue
      throw e
    }
  }
}

// 兼容旧 import
export async function ensureContentTables(env) {
  return initDatabase(env)
}

// 模块级一次性初始化 promise：仅在“懒初始化兜底”时首次触发。
let initPromise = null
export function ensureTables(env) {
  if (!initPromise) {
    initPromise = initDatabase(env).catch((e) => {
      initPromise = null // 失败后允许下次重试
      throw e
    })
  }
  return initPromise
}

// 判断错误是否为“表/列不存在”，用于触发懒建表兜底
export function isMissingTableError(e) {
  return /no such table|no such column|does not exist|undefined_table/i.test(
    String((e && e.message) || e || '')
  )
}

// 密码哈希（SHA-256，和前端一致）
export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'mint4_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 生成随机token
export function generateToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// IP哈希
export async function hashIp(ip) {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + 'mint4_ip_salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 树洞匿名标识哈希（不可逆）：匿名留言时对 user_id 加盐哈希。
// 普通管理员在后台只能看到这串标识（用于识别同一人多条匿名留言），无法反查身份。
export async function anonHashOf(id) {
  const encoder = new TextEncoder()
  const data = encoder.encode(String(id) + 'mint4_anon_salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 获取客户端IP
export function getClientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'
}

// 从Authorization头获取用户
// 是否「仅可查看」身份（班主任 / 传承人，含传承人组长）：
// 只能浏览，不能参与公示投票、薄荷币申报、报销提交、活动报名等班级活动。
export function isViewerOnly(user) {
  return !!user && isViewerOnlyName(user.name)
}
// 统一 403 文案
export const VIEWER_ONLY_MSG = '班主任与传承人仅可查看，不能参与班级活动（投票、申报、报销、报名等）'

export async function getAuthUser(request, sql) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null
  const result = await sql`
    SELECT id, username, name, nickname, group_no, role, created_at
    FROM users
    WHERE token = ${token}
      AND (token_expires_at IS NULL OR token_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    LIMIT 1
  `
  return result[0] || null
}

// ===== 班委角色与权限（RBAC）=====
// leader 班级主理人 / deputy 副主理人 / supervisor 独立董事会：全部模块（写）
// experience 体验运营官 / finance 财务激励官 / thinktank 智库研究员 / memory 记忆主理人
export const ROLE_LABELS = {
  leader: '班级主理人',
  deputy: '副主理人',
  experience: '体验运营官',
  finance: '财务激励官',
  thinktank: '智库研究员',
  memory: '记忆主理人',
  supervisor: '独立董事会',
}

// 班委真名 → 角色（注册时按真名自动识别）。班委名单是公开信息（班委介绍页）。
export const COMMITTEE_ROLES = {
  彭皓宁: 'leader',
  相婉玲: 'deputy',
  雷振宇: 'deputy',
  // 体验运营官
  程芳芳: 'experience', 王炜泽: 'experience', 彭泽云: 'experience',
  施纯: 'experience', 潘芸怡: 'experience', 王雨露: 'experience',
  // 财务激励官
  高晓梅: 'finance', 叶宏颖: 'finance', 李浩鹏: 'finance', 程枭: 'finance',
  // 智库研究员
  孟维翰: 'thinktank', 邹智宇: 'thinktank', 刘瑞霖: 'thinktank',
  // 记忆主理人
  杨旻: 'memory', 陈飘逸: 'memory', 徐哲明: 'memory',
  李甜: 'memory', 徐珮莹: 'memory', 夏叶: 'memory',
  // 独立董事会（监督，与主理人/副主理人同权）
  周楠骐: 'supervisor', 李浩: 'supervisor',
  王星然: 'supervisor', 王胜: 'supervisor',
}

// 每个后台模块允许【写】的角色（leader/deputy/supervisor 在 requireRole 内自动放行全部模块）
// announcements 对全体班委开放。
export const MODULE_ROLES = {
  announcements: ['leader', 'deputy', 'experience', 'finance', 'thinktank', 'memory'],
  activities: ['leader', 'deputy', 'experience'],
  polls: ['leader', 'deputy', 'experience'],
  courseMaterials: ['leader', 'deputy', 'thinktank'],
  knowledge: ['leader', 'deputy', 'thinktank'],
  finance: ['leader', 'deputy', 'finance'],
  gallery: ['leader', 'deputy', 'memory'],
  treehole: ['leader', 'deputy', 'memory'],
  // 薄荷币激励体系：审批由财务激励官「高晓梅 / 叶宏颖」专人负责（见 COIN_AUDITORS 与 requireCoinsAdmin），
  // 不再整体放行 finance 组；leader/deputy/supervisor 仅可做规则配置等管理。
  coins: ['leader', 'deputy'],
}

// 薄荷币审批负责人（真名白名单）：所有审批（列表/通过/驳回）仅此二人
export const COIN_AUDITORS = ['高晓梅', '叶宏颖']

// 薄荷币后台鉴权：
// - auditOnly（审批工作台）：仅 COIN_AUDITORS 两人可操作
// - 配置管理（规则等）：COIN_AUDITORS 两人 + leader/deputy/supervisor 兜底
export async function requireCoinsAdmin(request, env, { auditOnly = false } = {}) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return { ok: false, status: 401, error: '请先登录' }
  if (COIN_AUDITORS.includes(user.name)) return { ok: true, user }
  if (auditOnly) return { ok: false, status: 403, error: '薄荷币审批由财务激励官高晓梅、叶宏颖负责' }
  if (user.role === 'leader' || user.role === 'deputy' || user.role === 'supervisor') return { ok: true, user }
  return { ok: false, status: 403, error: '没有该模块的操作权限' }
}

// 按模块鉴权【写/改/删】：
// 未登录 → 401；登录但无该模块权限 → 403；否则返回 user。
// leader/deputy/supervisor 自动放行全部模块（独立董事会与主理人/副主理人同权）。
export async function requireRole(request, env, module) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return { ok: false, status: 401, error: '请先登录' }
  if (user.role === 'leader' || user.role === 'deputy' || user.role === 'supervisor') return { ok: true, user }
  const allowed = MODULE_ROLES[module] || []
  if (!allowed.includes(user.role)) {
    return { ok: false, status: 403, error: '没有该模块的操作权限' }
  }
  return { ok: true, user }
}

// 按模块鉴权【读】（后台内部列表）：登录且是班委（含 supervisor）即可；
// 普通同学（role 为空）→ 403。
export async function requireRead(request, env) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return { ok: false, status: 401, error: '请先登录' }
  if (!user.role) return { ok: false, status: 403, error: '没有访问权限' }
  return { ok: true, user }
}

// 仅要求“登录且是班委”（用于文件上传等多模块共用端点；supervisor 同样放行）
export async function requireCommittee(request, env) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return { ok: false, status: 401, error: '请先登录' }
  if (!user.role) return { ok: false, status: 403, error: '没有操作权限' }
  return { ok: true, user }
}

// 仅要求“登录”（不要求班委）：许愿池发布/点赞/评论等面向全体同学的写操作。
// 未登录 → 401；任何登录用户（含普通同学）均放行。
export async function requireLogin(request, env) {
  const sql = getSql(env)
  const user = await getAuthUser(request, sql)
  if (!user) return { ok: false, status: 401, error: '请先登录' }
  return { ok: true, user }
}

// 统一格式化记录一次后台操作到 admin_history（服务端强制，不依赖前端，无法绕过）。
// 覆盖 create / update / delete / revert / upload / 树洞管理等，operator 为登录真名。
export async function logHistory(sql, { type, action, refId = null, description = '', operator }) {
  const id = `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await sql`
    INSERT INTO admin_history (id, type, action, ref_id, description, operator, status)
    VALUES (${id}, ${type}, ${action}, ${refId}, ${description}, ${operator}, 'success')
    ON CONFLICT (id) DO NOTHING
  `
  return id
}

// 写入一条面向用户的发布通知（首页弹窗/提醒用）。失败只告警、不阻断主流程。
export async function notify(sql, { type, title, body = '', modulePath = '', operator = '' }) {
  try {
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await sql`
      INSERT INTO notifications (id, type, title, body, module_path, operator)
      VALUES (${id}, ${type}, ${title}, ${body}, ${modulePath}, ${operator})
      ON CONFLICT (id) DO NOTHING
    `
    return id
  } catch (e) {
    console.warn('notify 写入失败:', e?.message || e)
    return null
  }
}

// 从 R2 公开 URL / 站内 /files 路径解析 R2 对象 key（非本站 R2 返回 null）
export function r2KeyFromUrl(url, env) {
  if (!url || typeof url !== 'string') return null
  if (env.R2_PUBLIC_DOMAIN) {
    const pre = `https://${env.R2_PUBLIC_DOMAIN}/`
    if (url.startsWith(pre)) return url.slice(pre.length)
    try {
      const uo = new URL(url)
      if (uo.hostname === env.R2_PUBLIC_DOMAIN)
        return uo.pathname.slice(1) + (uo.search || '')
    } catch {}
  }
  if (url.startsWith('/files/')) return url.slice(1)
  return null
}

// 从 R2/任意 URL（或 key）中提取纯文件名（去掉目录与查询串、decode）
export function fileNameFromUrl(u) {
  if (!u || typeof u !== 'string') return ''
  let s = u.split('?')[0].split('#')[0]
  s = s.lastIndexOf('/') >= 0 ? s.substring(s.lastIndexOf('/') + 1) : s
  try { s = decodeURIComponent(s) } catch (e) {}
  return s
}

// CORS响应
export function corsResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'CDN-Cache-Control': 'no-store',
      'Surrogate-Control': 'no-store',
    },
  })
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// 解析请求体
export async function parseBody(request) {
  const text = await request.text()
  try { return text ? JSON.parse(text) : {} } catch { return {} }
}

// 简单频率限制（内存级，Edge环境每个节点独立）
const rateLimitMap = new Map()
export function checkRateLimit(key, windowMs, maxRequests) {
  const now = Date.now()
  const record = rateLimitMap.get(key) || { count: 0, windowStart: now }
  if (now - record.windowStart > windowMs) {
    record.count = 0
    record.windowStart = now
  }
  record.count++
  rateLimitMap.set(key, record)
  return { allowed: record.count <= maxRequests, retryAfter: Math.ceil((windowMs - (now - record.windowStart)) / 1000) }
}
