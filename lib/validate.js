// 参数校验与安全工具

/**
 * 去除HTML标签，防止XSS
 * @param {string} str
 * @returns {string}
 */
export function sanitizeHtml(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '').trim()
}

/**
 * 校验树洞留言
 * @param {object} body
 * @returns {{valid: boolean, errors: string[], data: object}}
 */
export function validateTreeholeMessage(body) {
  const errors = []
  const data = {}

  // 昵称：可选，最长50字符
  if (body.nickname !== undefined && body.nickname !== null && body.nickname !== '') {
    const nickname = sanitizeHtml(body.nickname)
    if (nickname.length > 50) {
      errors.push('昵称不能超过50个字符')
    } else {
      data.nickname = nickname
    }
  } else {
    data.nickname = null
  }

  // 内容：必填，1-500字符
  if (!body.content || typeof body.content !== 'string') {
    errors.push('留言内容不能为空')
  } else {
    const content = sanitizeHtml(body.content)
    if (content.length === 0) {
      errors.push('留言内容不能为空')
    } else if (content.length > 500) {
      errors.push('留言内容不能超过500个字符')
    } else {
      data.content = content
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data,
  }
}

/**
 * 简单频率限制（内存Map，Serverless单实例内有效）
 * 同一IP在windowMs内最多maxRequests次
 */
const rateLimitMap = new Map()

export function checkRateLimit(ip, windowMs = 60000, maxRequests = 3) {
  const now = Date.now()
  const key = `${ip}:${Math.floor(now / windowMs)}`
  const count = (rateLimitMap.get(key) || 0) + 1
  rateLimitMap.set(key, count)

  // 清理过期的key（简单清理，防止内存泄漏）
  if (rateLimitMap.size > 1000) {
    for (const [k] of rateLimitMap) {
      const [, ts] = k.split(':')
      if (now - Number(ts) * windowMs > windowMs * 2) {
        rateLimitMap.delete(k)
      }
    }
  }

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
  }
}

/**
 * 获取客户端IP（兼容Vercel）
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
}

/**
 * 简单哈希IP（不存原始IP，保护隐私）
 * @param {string} ip
 * @returns {string}
 */
export async function hashIp(ip) {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + 'mint4-treehole-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

/**
 * 验证管理员Token
 * @param {import('http').IncomingMessage} req
 * @returns {boolean}
 */
export function verifyAdminToken(req) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  const token = authHeader.slice(7)
  return token === process.env.ADMIN_TOKEN
}

/**
 * 统一JSON响应
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {object} data
 */
export function jsonResponse(res, statusCode, data) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}
