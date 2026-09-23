// D1 适配层
// 让原有 neon 风格的模板字符串查询在 Cloudflare D1（SQLite）上运行，
// 从而把数据库从「跨区域 Neon Postgres」迁到「Cloudflare 内部 D1」，
// 消除跨区域连接 / 外部冷启动导致的请求挂起。
//
// 用法保持不变：
//   const sql = getSql(env)
//   const rows = await sql`SELECT * FROM users WHERE id = ${id}`  // -> 行数组
//   await sql.unsafe('... $1 ...', [param])                        // 动态查询
//   await sql.exec('CREATE TABLE ...; CREATE TABLE ...')           // 多语句 DDL

// JS 值 -> D1 可绑定值
function toBind(v) {
  if (v === undefined || v === null) return null
  if (typeof v === 'boolean') return v ? 1 : 0
  if (v instanceof Date) return v.toISOString() // 带 Z 的 ISO（UTC）
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'object') return JSON.stringify(v) // 数组/对象 -> JSON 文本
  return v
}

// 生成「当前 UTC 时间」的 ISO 带 Z 字符串（SQLite 内），用于替换 Postgres 的 now()
export const SQL_NOW = `strftime('%Y-%m-%dT%H:%M:%fZ','now')`

// D1 里 JSON blob 以 TEXT 存储，不会像 Postgres JSONB 那样自动 parse。
// 本站所有整对象 blob 列统一命名为 data（announcements / activities / finance_records /
// course_materials / knowledge_base / polls_admin），故对结果行中名为 data 的列
// 自动 JSON.parse，保持「r.data 是对象」这一原有契约，前端无需改动。
function parseDataCols(rows) {
  for (const row of rows) {
    if (row && typeof row.data === 'string') {
      const t = row.data.trim()
      if ((t[0] === '{' && t[t.length - 1] === '}') || (t[0] === '[' && t[t.length - 1] === ']')) {
        try { row.data = JSON.parse(t) } catch { /* 非 JSON，保持原字符串 */ }
      }
    }
  }
  return rows
}

export function createD1Sql(db) {
  // 模板字符串 tag：返回 Promise<行数组>（与 @neondatabase/serverless 一致）
  function sql(strings, ...values) {
    let query = strings[0]
    const binds = []
    for (let i = 0; i < values.length; i++) {
      query += '?' + strings[i + 1]
      binds.push(toBind(values[i]))
    }
    return (async () => {
      const stmt = binds.length ? db.prepare(query).bind(...binds) : db.prepare(query)
      const r = await stmt.all()
      return parseDataCols(r.results || [])
    })()
  }

  // 动态查询：兼容 neon 的 sql.unsafe(text, params[])。
  //  - text 含 $n 占位：按 $n 从 params 取值（neon 风格）
  //  - text 仅含 ? 占位：params 按顺序绑定（可配合动态 IN 子句）
  sql.unsafe = (text, params = []) => {
    let binds = []
    let query = String(text)
    if (/\$\d+/.test(query)) {
      query = query.replace(/\$(\d+)/g, (m, n) => {
        binds.push(toBind(params[Number(n) - 1]))
        return '?'
      })
    } else {
      binds = (params || []).map(toBind)
    }
    return (async () => {
      const stmt = binds.length ? db.prepare(query).bind(...binds) : db.prepare(query)
      const r = await stmt.all()
      return parseDataCols(r.results || [])
    })()
  }

  // 多语句执行（DDL 初始化）
  sql.exec = (text) => db.exec(text)

  // 批量语句（D1 原生事务）。当前无多语句事务需求，保留接口。
  sql.batch = (statements) => db.batch(statements)

  // 便捷：构造一个 prepared statement（供高级用法）
  sql.prepare = (query, ...values) => {
    const binds = values.map(toBind)
    return binds.length ? db.prepare(query).bind(...binds) : db.prepare(query)
  }

  return sql
}
