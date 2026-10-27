// 财务参数配置 - /api/admin/finance/config
// GET：登录班委可读（返回当前参数 + 财务细分角色）
// POST：仅主理人/副主理人/监督人可改（参数表 + 角色人员按真名配置）
// body: { config?: { key: value, ... }, roles?: [{name, f_role}] }
import { getSql, corsResponse, optionsResponse, parseBody, requireLogin, logHistory, isMissingTableError, ensureTables } from '../../../../_utils.js'
import { DEFAULT_FINANCE_CONFIG, getFinanceConfig, getFinanceRoles, isFinanceSupervisor, isFinanceStaff } from '../../../../_finance.js'

const ALLOWED_KEYS = Object.keys(DEFAULT_FINANCE_CONFIG)
// 财务制度写死项：69 人 / 23 票否决线 / 公示 3 天，后台不可修改（POST 直接忽略）
const LOCKED_KEYS = ['classSize', 'vetoCount', 'exposeDays']
const ALLOWED_ROLES = ['accountant', 'cashier', 'supervisor', 'treasury_staff']

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  const auth = await requireLogin(request, env)
  if (!auth.ok) return corsResponse({ error: auth.error }, auth.status)

  try {
    const sql = getSql(env)
    if (request.method === 'GET') {
      const roles = await getFinanceRoles(env)
      const isCommittee = ['leader', 'deputy'].includes(auth.user.role) || isFinanceStaff(auth.user, roles)
      if (!isCommittee) return corsResponse({ error: '仅班委可查看财务配置' }, 403)
      const config = await getFinanceConfig(env)
      return corsResponse({ config, roles, defaults: DEFAULT_FINANCE_CONFIG })
    }

    if (request.method === 'POST') {
      const roles = await getFinanceRoles(env)
      const canWrite = ['leader', 'deputy'].includes(auth.user.role) || isFinanceSupervisor(auth.user, roles)
      if (!canWrite) return corsResponse({ error: '仅主理人/副主理人/监督人可修改财务配置' }, 403)

      const body = await parseBody(request)
      const updates = []
      if (body.config && typeof body.config === 'object') {
        for (const key of Object.keys(body.config)) {
          if (!ALLOWED_KEYS.includes(key)) continue
          if (LOCKED_KEYS.includes(key)) continue // 制度写死项忽略
          const v = body.config[key]
          if (typeof DEFAULT_FINANCE_CONFIG[key] === 'number') {
            const n = Number(v)
            if (!Number.isNaN(n) && n > 0) updates.push([key, String(n)])
          } else if (Array.isArray(DEFAULT_FINANCE_CONFIG[key])) {
            if (Array.isArray(v)) updates.push([key, JSON.stringify(v)])
          } else if (typeof v === 'string') {
            updates.push([key, v])
          }
        }
      }
      try { await ensureTables(env) } catch (e) {}
      for (const [k, val] of updates) {
        await sql`INSERT INTO finance_config (key, value) VALUES (${k}, ${val}) ON CONFLICT (key) DO UPDATE SET value = ${val}`
      }

      // 角色人员配置（按真名 upsert；user_id 注册后自动关联）
      let roleUpdated = 0
      if (Array.isArray(body.roles)) {
        for (const r of body.roles) {
          const name = String(r.name || '').trim()
          const fRole = String(r.f_role || '')
          if (!name || !ALLOWED_ROLES.includes(fRole)) continue
          const u = await sql`SELECT id FROM users WHERE name = ${name} LIMIT 1`
          await sql`INSERT INTO finance_roles (name, f_role, user_id, updated_at) VALUES (${name}, ${fRole}, ${u[0] ? u[0].id : null}, strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT (name) DO UPDATE SET f_role = ${fRole}, user_id = ${u[0] ? u[0].id : null}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`
          roleUpdated++
        }
      }

      if (updates.length === 0 && roleUpdated === 0) return corsResponse({ error: '没有可更新的配置项' }, 400)
      await logHistory(sql, { type: 'finance', action: 'config', description: `更新财务配置（${updates.length} 项参数、${roleUpdated} 个角色）`, operator: auth.user.name })
      const config = await getFinanceConfig(env)
      const rolesOut = await getFinanceRoles(env)
      return corsResponse({ message: '财务配置已更新', config, roles: rolesOut })
    }

    return corsResponse({ error: '不支持的请求方法' }, 405)
  } catch (err) {
    console.error('admin/finance/config 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}
