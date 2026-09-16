// EdgeOne Pages Functions 共享工具
// 数据库连接、密码哈希、CORS、请求解析等

import { neon } from '@neondatabase/serverless'

let sqlInstance = null

export function getSql(env) {
  if (!sqlInstance) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL 环境变量未配置')
    }
    sqlInstance = neon(env.DATABASE_URL)
  }
  return sqlInstance
}

// 初始化数据库表（幂等）
export async function initDatabase(env) {
  const sql = getSql(env)

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
  await sql`CREATE INDEX IF NOT EXISTS idx_treehole_created_at ON treehole_messages (created_at DESC)`

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
  await sql`CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes (poll_id)`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes (poll_id, user_id) WHERE user_id IS NOT NULL`

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
  await sql`CREATE INDEX IF NOT EXISTS idx_activity_signups_activity ON activity_signups (activity_id)`
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
    SELECT id, username, name, nickname, group_no, created_at
    FROM users
    WHERE token = ${token} AND (token_expires_at IS NULL OR token_expires_at > NOW())
    LIMIT 1
  `
  return result[0] || null
}

// CORS响应
export function corsResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
