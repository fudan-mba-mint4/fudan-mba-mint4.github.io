// 薄荷币 · 公开总览 - GET /api/coins/board（全站可见，无需登录）
// 返回：总览指标 + 三榜（总/年/月）+ 森林小组树 + 荣誉墙 + 公开账本（脱敏，不含个人名）+ 规则。
import {
  getSql, corsResponse, optionsResponse,
  ensureTables, isMissingTableError,
} from '../../_utils.js'
import { COIN_CONFIG, FOREST, treeStageOf } from '../../_coins.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (request.method !== 'GET') return corsResponse({ error: '不支持的请求方法' }, 405)
  try {
    return await handleBoard(env)
  } catch (err) {
    if (isMissingTableError(err)) {
      try {
        await ensureTables(env)
        return await handleBoard(env)
      } catch (e2) { console.error('coins board 懒建表后重试失败:', e2) }
    }
    console.error('coins board 错误:', err)
    return corsResponse({ error: '服务器内部错误', detail: String(err && err.message || err) }, 500)
  }
}

// 上海时区的「本月/本年」起点（UTC 时间戳字符串，供 created_at 比较）
function periodStarts() {
  const sh = new Date(Date.now() + 8 * 3600 * 1000)
  const y = sh.getUTCFullYear(), m = sh.getUTCMonth()
  const monthStart = new Date(Date.UTC(y, m, 1) - 8 * 3600 * 1000).toISOString()
  const yearStart = new Date(Date.UTC(y, 0, 1) - 8 * 3600 * 1000).toISOString()
  return { monthStart, yearStart }
}

async function handleBoard(env) {
  const sql = getSql(env)
  const { monthStart, yearStart } = periodStarts()
  const limit = COIN_CONFIG.leaderboardLimit

  // —— 总览指标 ——
  const circ = (await sql`SELECT COALESCE(SUM(balance),0) AS v FROM coin_accounts`)[0]
  const month = (await sql`SELECT COALESCE(SUM(delta),0) AS v FROM coin_ledger WHERE delta>0 AND created_at >= ${monthStart}`)[0]
  const part = (await sql`SELECT COUNT(*) AS v FROM coin_accounts`)[0]
  const earnedPerUser = await sql`SELECT user_id, COALESCE(SUM(delta),0) AS e FROM coin_ledger WHERE delta>0 GROUP BY user_id`

  // —— 排行榜（按累计获得币聚合；实名公开，待拍板后可按需匿名） ——
  const boardBase = `
    SELECT u.id AS user_id, u.name, u.group_no, COALESCE(SUM(l.delta),0) AS earned
    FROM coin_ledger l JOIN users u ON u.id = l.user_id
    WHERE l.delta > 0`
  const totalBoard = await sql.unsafe(
    `${boardBase} GROUP BY u.id ORDER BY earned DESC, u.name ASC LIMIT ${limit}`, [])
  const yearBoard = await sql.unsafe(
    `${boardBase} AND l.created_at >= ? GROUP BY u.id ORDER BY earned DESC, u.name ASC LIMIT ${limit}`, [yearStart])
  const monthBoard = await sql.unsafe(
    `${boardBase} AND l.created_at >= ? GROUP BY u.id ORDER BY earned DESC, u.name ASC LIMIT ${limit}`, [monthStart])

  // —— 森林（小组树：按 users.group_no 聚合贡献） ——
  const forestRows = await sql`
    SELECT u.group_no AS g, COUNT(DISTINCT l.user_id) AS members, COALESCE(SUM(l.delta),0) AS earned
    FROM coin_ledger l JOIN users u ON u.id = l.user_id
    WHERE l.delta > 0 AND u.group_no IS NOT NULL
    GROUP BY u.group_no ORDER BY u.group_no ASC`
  const forest = forestRows.map(f => ({
    group: f.g, members: f.members, earned: f.earned, stage: treeStageOf(f.earned),
  }))
  const achievements = []
  for (const f of forest) {
    if (f.stage === 'fruited') achievements.push({ type: 'tree_fruited', group: f.group })
    else if (f.stage === 'bloomed') achievements.push({ type: 'tree_bloomed', group: f.group })
  }
  // 个人「薄荷王」荣誉（累计 ≥16 币）
  const kingUsers = earnedPerUser.filter(r => Number(r.e) >= 16).slice(0, 8)
  const kingRows = kingUsers.length
    ? await sql.unsafe(`SELECT id, name FROM users WHERE id IN (${kingUsers.map(() => '?').join(',')})`, kingUsers.map(r => r.user_id))
    : []
  const kingNames = kingRows.map(r => r.name)

  // —— 公开账本（脱敏：不含 user_id/姓名，只留事由/数量/经办/时间） ——
  const ledger = await sql`
    SELECT delta, type, note, ref_type, operator, created_at
    FROM coin_ledger ORDER BY created_at DESC LIMIT ${COIN_CONFIG.ledgerPublicLimit}`

  // —— 规则（公开） ——
  const rules = await sql`
    SELECT id, name_zh, name_en, name_th, amount, unit, category, note
    FROM coin_rules WHERE status=1 ORDER BY amount ASC`

  return corsResponse({
    overview: {
      totalCirculating: Number(circ?.v || 0),
      issuedThisMonth: Number(month?.v || 0),
      participants: Number(part?.v || 0),
      bloomedTrees: forest.filter(f => f.stage !== 'growing').length,
    },
    leaderboard: {
      total: totalBoard.map(r => ({ userId: r.user_id, name: r.name, group: r.group_no, earned: Number(r.earned) })),
      year: yearBoard.map(r => ({ userId: r.user_id, name: r.name, group: r.group_no, earned: Number(r.earned) })),
      month: monthBoard.map(r => ({ userId: r.user_id, name: r.name, group: r.group_no, earned: Number(r.earned) })),
    },
    forest,
    honors: {
      top3: yearBoard.slice(0, 3).map(r => ({ userId: r.user_id, name: r.name, group: r.group_no, earned: Number(r.earned) })),
      achievements,
      kingNames,
    },
    ledger: ledger.map(l => ({
      delta: l.delta, type: l.type, note: l.note,
      refType: l.ref_type, operator: l.operator, createdAt: l.created_at,
    })),
    rules: rules.map(r => ({
      id: r.id,
      name: { zh: r.name_zh, en: r.name_en, th: r.name_th },
      amount: r.amount, unit: r.unit, category: r.category, note: r.note,
    })),
    forestConfig: { bloom: FOREST.bloom, fruit: FOREST.fruit },
  })
}
