// Neon(Postgres) -> Cloudflare D1(SQLite) 数据迁移脚本
// 1) 从 .dev.vars 读 DATABASE_URL，用 neon 驱动读全部表；
// 2) 转换：时间 -> 带Z ISO；boolean -> 0/1；JSONB -> JSON 字符串；
// 3) 生成 scripts/d1-data.sql（INSERT OR REPLACE，幂等可重跑）。
// 之后用：npx wrangler d1 execute mint4 --local  --file=scripts/d1-data.sql
//         npx wrangler d1 execute mint4 --remote --file=scripts/d1-data.sql
import fs from 'node:fs'
import { neon } from '@neondatabase/serverless'

function loadDevVars() {
  const env = {}
  for (let line of fs.readFileSync('.dev.vars', 'utf8').split('\n')) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[line.slice(0, eq).trim()] = v
  }
  return env
}

// 时间 -> 带 Z 的 ISO 字符串
function iso(v) {
  if (v === null || v === undefined) return null
  if (v instanceof Date) return v.toISOString()
  const d = new Date(v)
  return isNaN(d) ? String(v) : d.toISOString()
}
// JSONB -> JSON 字符串
function jsonb(v) {
  if (v === null || v === undefined) return null
  return typeof v === 'string' ? v : JSON.stringify(v)
}
const num = (v) => (v === null || v === undefined ? null : Number(v))
const str = (v) => (v === null || v === undefined ? null : String(v))
const bool = (v) => (v ? 1 : 0)

// 每张表：列、SELECT、行 -> 值数组（顺序与列一致）
const TABLES = [
  {
    name: 'users',
    cols: ['id', 'username', 'password_hash', 'name', 'nickname', 'group_no', 'role', 'token', 'token_expires_at', 'created_at'],
    select: `SELECT id, username, password_hash, name, nickname, group_no, role, token, token_expires_at, created_at FROM users ORDER BY id`,
    map: (r) => [r.id, str(r.username), str(r.password_hash), str(r.name), r.nickname ?? '', num(r.group_no), str(r.role), str(r.token), iso(r.token_expires_at), iso(r.created_at)],
  },
  {
    name: 'treehole_messages',
    cols: ['id', 'nickname', 'content', 'is_deleted', 'ip_hash', 'created_at'],
    select: `SELECT id, nickname, content, is_deleted, ip_hash, created_at FROM treehole_messages ORDER BY id`,
    map: (r) => [r.id, str(r.nickname), str(r.content), bool(r.is_deleted), str(r.ip_hash), iso(r.created_at)],
  },
  {
    name: 'poll_votes',
    cols: ['id', 'poll_id', 'option_id', 'user_id', 'anonymous', 'ip_hash', 'created_at'],
    select: `SELECT id, poll_id, option_id, user_id, anonymous, ip_hash, created_at FROM poll_votes ORDER BY id`,
    map: (r) => [r.id, str(r.poll_id), str(r.option_id), str(r.user_id), bool(r.anonymous), str(r.ip_hash), iso(r.created_at)],
  },
  {
    name: 'activity_signups',
    cols: ['id', 'activity_id', 'user_id', 'username', 'created_at'],
    select: `SELECT id, activity_id, user_id, username, created_at FROM activity_signups ORDER BY id`,
    map: (r) => [r.id, str(r.activity_id), num(r.user_id), str(r.username), iso(r.created_at)],
  },
  {
    name: 'city_visits',
    cols: ['id', 'ip_hash', 'country', 'city', 'lat', 'lng', 'visited_at'],
    select: `SELECT id, ip_hash, country, city, lat, lng, visited_at FROM city_visits ORDER BY id`,
    map: (r) => [r.id, str(r.ip_hash), str(r.country), str(r.city), num(r.lat), num(r.lng), iso(r.visited_at)],
  },
  {
    name: 'admin_history',
    cols: ['id', 'type', 'action', 'ref_id', 'description', 'operator', 'status', 'created_at'],
    select: `SELECT id, type, action, ref_id, description, operator, status, created_at FROM admin_history ORDER BY id`,
    map: (r) => [str(r.id), str(r.type), str(r.action), str(r.ref_id), str(r.description), str(r.operator), str(r.status) ?? 'success', iso(r.created_at)],
  },
  {
    name: 'notifications',
    cols: ['id', 'type', 'title', 'body', 'module_path', 'operator', 'created_at'],
    select: `SELECT id, type, title, body, module_path, operator, created_at FROM notifications ORDER BY id`,
    map: (r) => [str(r.id), str(r.type), str(r.title), str(r.body), str(r.module_path), str(r.operator), iso(r.created_at)],
  },
  {
    name: 'announcements',
    cols: ['id', 'date', 'category', 'pinned', 'data', 'created_at', 'updated_at'],
    select: `SELECT id, date, category, pinned, data, created_at, updated_at FROM announcements ORDER BY id`,
    map: (r) => [str(r.id), str(r.date), str(r.category), bool(r.pinned), jsonb(r.data), iso(r.created_at), iso(r.updated_at)],
  },
  {
    name: 'activities',
    cols: ['id', 'date', 'status', 'data', 'created_at', 'updated_at'],
    select: `SELECT id, date, status, data, created_at, updated_at FROM activities ORDER BY id`,
    map: (r) => [str(r.id), str(r.date), str(r.status), jsonb(r.data), iso(r.created_at), iso(r.updated_at)],
  },
  {
    name: 'finance_records',
    cols: ['id', 'data', 'updated_at'],
    select: `SELECT id, data, updated_at FROM finance_records ORDER BY id`,
    map: (r) => [str(r.id), jsonb(r.data), iso(r.updated_at)],
  },
  {
    name: 'polls_admin',
    cols: ['id', 'data', 'created_at', 'updated_at'],
    select: `SELECT id, data, created_at, updated_at FROM polls_admin ORDER BY id`,
    map: (r) => [str(r.id), jsonb(r.data), iso(r.created_at), iso(r.updated_at)],
  },
  {
    name: 'course_materials',
    cols: ['id', 'data', 'updated_at'],
    select: `SELECT id, data, updated_at FROM course_materials ORDER BY id`,
    map: (r) => [str(r.id), jsonb(r.data), iso(r.updated_at)],
  },
  {
    name: 'knowledge_base',
    cols: ['id', 'data', 'updated_at'],
    select: `SELECT id, data, updated_at FROM knowledge_base ORDER BY id`,
    map: (r) => [str(r.id), jsonb(r.data), iso(r.updated_at)],
  },
]

function sqlVal(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL'
  if (typeof v === 'boolean') return v ? '1' : '0'
  return "'" + String(v).replace(/'/g, "''") + "'"
}

async function main() {
  const { DATABASE_URL } = loadDevVars()
  const sql = neon(DATABASE_URL)
  const out = ['-- 由 scripts/migrate-neon-to-d1.mjs 生成；INSERT OR REPLACE，幂等', 'PRAGMA defer_foreign_keys = ON;', '']
  const counts = {}
  for (const t of TABLES) {
    let rows = []
    try {
      rows = await sql.query(t.select)
    } catch (e) {
      console.warn(`! 读取 ${t.name} 失败（表可能不存在，跳过）:`, e.message)
      counts[t.name] = 0
      continue
    }
    counts[t.name] = rows.length
    if (rows.length) {
      out.push(`-- ${t.name} (${rows.length})`)
      const colList = t.cols.join(', ')
      for (const r of rows) {
        const vals = t.map(r).map(sqlVal).join(', ')
        out.push(`INSERT OR REPLACE INTO ${t.name} (${colList}) VALUES (${vals});`)
      }
      out.push('')
    }
  }
  fs.writeFileSync('scripts/d1-data.sql', out.join('\n'))
  console.log('已生成 scripts/d1-data.sql')
  console.table(counts)
}

main().catch((e) => { console.error(e); process.exit(1) })
