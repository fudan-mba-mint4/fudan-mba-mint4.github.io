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

  // 投票记录表
  await sql`
    CREATE TABLE IF NOT EXISTS poll_votes (
      id SERIAL PRIMARY KEY,
      poll_id VARCHAR(50) NOT NULL,
      option_id VARCHAR(50) NOT NULL,
      user_id VARCHAR(50),
      anonymous BOOLEAN DEFAULT FALSE,
      ip_hash VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id 
    ON poll_votes (poll_id)
  `
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_user 
    ON poll_votes (poll_id, user_id)
    WHERE user_id IS NOT NULL
  `

  // 用户表
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(128) NOT NULL,
      name VARCHAR(100) NOT NULL,
      nickname VARCHAR(100) DEFAULT '',
      group_no INTEGER,
      token VARCHAR(128),
      token_expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `

  // 活动报名表
  await sql`
    CREATE TABLE IF NOT EXISTS activity_signups (
      id SERIAL PRIMARY KEY,
      activity_id VARCHAR(50) NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      username VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(activity_id, user_id)
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_activity_signups_activity 
    ON activity_signups (activity_id)
  `
}
