// 数据库连接工具（Neon Serverless Postgres）
import { neon } from '@neondatabase/serverless'

let sqlInstance = null

/**
 * 获取数据库查询实例（单例模式）
 * @returns {import('@neondatabase/serverless').NeonQueryFunction}
 */
export function getSql() {
  if (!sqlInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL 环境变量未配置')
    }
    sqlInstance = neon(process.env.DATABASE_URL)
  }
  return sqlInstance
}

/**
 * 执行参数化查询（防止SQL注入）
 * @param {string} query - SQL语句，参数用$1, $2占位
 * @param {any[]} params - 参数数组
 * @returns {Promise<any[]>} 查询结果数组
 */
export async function query(query, params = []) {
  const sql = getSql()
  return sql(query, params)
}

/**
 * 初始化数据库表（启动时调用，幂等）
 */
export async function initDatabase() {
  const sql = getSql()

  // 树洞留言表
  await sql`
    CREATE TABLE IF NOT EXISTS treehole_messages (
      id SERIAL PRIMARY KEY,
      nickname VARCHAR(50),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_deleted BOOLEAN DEFAULT FALSE,
      ip_hash VARCHAR(64)
    )
  `

  // 创建索引（按时间倒序查询）
  await sql`
    CREATE INDEX IF NOT EXISTS idx_treehole_created_at 
    ON treehole_messages (created_at DESC)
  `
}
