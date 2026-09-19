// 数据库诊断：列出所有表
import { getSql, corsResponse } from '../../_utils.js'

export async function onRequestGet({ env }) {
  try {
    const sql = getSql(env)
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `
    return corsResponse({ tables: tables.map(t => t.table_name) })
  } catch (e) {
    return corsResponse({ error: String(e?.message || e) }, 500)
  }
}
