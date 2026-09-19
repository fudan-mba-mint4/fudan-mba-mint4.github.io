// 数据库连接诊断：仅 SELECT 1，不调用 initDatabase，排除建表干扰
import { getSql, corsResponse } from '../../_utils.js'

export async function onRequestGet({ env }) {
  try {
    const sql = getSql(env)
    const row = await sql`SELECT 1 AS ok, NOW() AS now`
    return corsResponse({ db: true, row: row[0] })
  } catch (e) {
    return corsResponse({ db: false, error: String(e?.message || e) }, 500)
  }
}
