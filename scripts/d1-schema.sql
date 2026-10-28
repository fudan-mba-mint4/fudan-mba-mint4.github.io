-- Cloudflare D1（SQLite）建表脚本
-- 时间列统一为「带 Z 的 ISO 字符串」（UTC），默认值用 strftime 生成。
-- 用法（本地）：npx wrangler d1 execute mint4 --local --file=scripts/d1-schema.sql

CREATE TABLE IF NOT EXISTS treehole_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT,
  content TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  ip_hash TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_treehole_created_at ON treehole_messages (created_at DESC);

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

-- ===== 班费线上化（预算公示异议 / 报销审批 / 结构化流水） =====
CREATE TABLE IF NOT EXISTS finance_tx (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  activity_id TEXT,
  proposal_id TEXT,
  reimbursement_id TEXT,
  vouchers TEXT DEFAULT '[]',
  handler TEXT,
  checker TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_finance_tx_date ON finance_tx (date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_tx_activity ON finance_tx (activity_id);

CREATE TABLE IF NOT EXISTS budget_proposals (
  id TEXT PRIMARY KEY,
  activity_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  detail_items TEXT DEFAULT '[]',
  amount REAL NOT NULL,
  proposer TEXT DEFAULT '',
  proposer_id INTEGER,
  status TEXT DEFAULT 'open',
  expose_start TEXT,
  expose_end TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  settled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_budget_proposals_status ON budget_proposals (status);

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
  applicant TEXT NOT NULL,
  applicant_id INTEGER NOT NULL,
  expense_date TEXT,
  amount REAL NOT NULL,
  category TEXT,
  description TEXT DEFAULT '',
  vouchers TEXT DEFAULT '[]',
  status TEXT DEFAULT 'submitted',
  audit_by TEXT,
  audit_at TEXT,
  audit_note TEXT,
  paid_by TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_reimbursements_applicant ON reimbursements (applicant_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursements (status);

-- ===== 薄荷币激励体系（纯虚拟积分，与班费现金严格隔离） =====
CREATE TABLE IF NOT EXISTS coin_accounts (
  user_id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 1,   -- 当前余额（注册可得初始 1 币，计划 P43 口径）
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
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_coin_ledger_user ON coin_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_ledger_created ON coin_ledger (created_at DESC);
