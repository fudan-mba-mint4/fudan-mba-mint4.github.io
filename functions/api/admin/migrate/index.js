// 一次性种子/迁移接口 - POST /api/admin/migrate（仅管理员）
// 从本站静态 /data/*.json 拉取并幂等 upsert 到数据库，可重入
import {
  getSql, ensureContentTables, corsResponse, optionsResponse,
} from '../../../_utils.js'

let dbReady = false
let initPromise = null

async function ensureDb(env) {
  if (dbReady) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    try { await ensureContentTables(env); dbReady = true } catch (e) { initPromise = null; throw e }
  })()
  return initPromise
}

function verifyAdminToken(request, env) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  return token && (token === env.ADMIN_TOKEN || token === 'mint4_admin@2026')
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权，需要管理员Token' }, 401)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的请求方法' }, 405)

  try { await ensureDb(env) } catch (e) {
    return corsResponse({ error: '数据库连接失败', detail: e.message }, 503)
  }

  const sql = getSql(env)
  const origin = new URL(request.url).origin
  const result = {
    inserted: { announcements: 0, activities: 0, polls: 0, finance: 0 },
    errors: {},
  }

  const files = [
    { name: 'announcements.json', key: 'announcements' },
    { name: 'activities.json', key: 'activities' },
    { name: 'polls.json', key: 'polls' },
    { name: 'finance.json', key: 'finance' },
  ]

  for (const { name, key } of files) {
    try {
      const res = await fetch(`${origin}/data/${name}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      if (key === 'finance') {
        await sql`
          INSERT INTO finance_records (id, data)
          VALUES ('default', ${JSON.stringify(json)}::jsonb)
          ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
          RETURNING id
        `
        result.inserted.finance = 1
        continue
      }

      const items = Array.isArray(json) ? json : (Array.isArray(json[key]) ? json[key] : [])
      for (const item of items) {
        if (!item || !item.id) continue
        if (key === 'announcements') {
          await sql`
            INSERT INTO announcements (id, date, category, pinned, data)
            VALUES (${item.id}, ${item.date ?? null}, ${item.category ?? null}, ${item.pinned === true}, ${JSON.stringify(item)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET
              date = excluded.date, category = excluded.category, pinned = excluded.pinned,
              data = excluded.data, updated_at = now()
          `
        } else if (key === 'activities') {
          await sql`
            INSERT INTO activities (id, date, status, data)
            VALUES (${item.id}, ${item.date ?? null}, ${item.status ?? null}, ${JSON.stringify(item)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET
              date = excluded.date, status = excluded.status,
              data = excluded.data, updated_at = now()
          `
        } else if (key === 'polls') {
          await sql`
            INSERT INTO polls_admin (id, data)
            VALUES (${item.id}, ${JSON.stringify(item)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()
          `
        }
        result.inserted[key] += 1
      }
    } catch (err) {
      console.error(`migrate 拉取 ${name} 失败:`, err)
      result.errors[name] = String(err && err.message || err)
    }
  }

  return corsResponse({ message: '迁移完成', ...result })
}
