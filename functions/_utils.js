// Cloudflare Pages Functions 共享工具
// 数据库访问（Cloudflare D1 / SQLite）、密码哈希、CORS、请求解析等

import { createD1Sql } from './_d1.js'

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
`

// 初始化数据库表（幂等）。D1 的 exec 支持一次执行多语句。
// 只在「懒初始化兜底」（查询报 no such table）或需要时调用，不在每个冷节点
// 首请求的热路径上跑。
export async function initDatabase(env) {
  await env.DB.exec(SCHEMA)
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

// 获取客户端IP
export function getClientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'
}

// 从Authorization头获取用户
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
  施纯: 'experience', 潘芸怡: 'experience',
  // 财务激励官
  高晓梅: 'finance', 叶宏颖: 'finance', 李浩鹏: 'finance', 程枭: 'finance',
  // 智库研究员
  孟维翰: 'thinktank', 邹智宇: 'thinktank',
  // 记忆主理人（徐佩莹/徐珮莹为同一人异体写法，都识别）
  杨旻: 'memory', 陈飘逸: 'memory', 徐哲明: 'memory',
  李甜: 'memory', 徐佩莹: 'memory', 徐珮莹: 'memory',
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
