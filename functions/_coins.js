// 薄荷币体系共享配置与工具
// 所有可调参数集中在此；与班费（真钱）完全隔离，薄荷币为纯虚拟激励积分。
// 对应缺口清单 MINT-01~07；页面见 /mint-coins/（公开）+ /profile/（个人）+ /admin/（班委）。

export const COIN_CONFIG = {
  initialBalance: 1,   // 注册官网可得初始 1 币（班级计划 P43 口径；旧稿 10 币已被计划口径取代）
  maxProofs: 3,        // 申报证明图上限
  descLimit: 500,      // 申报说明字数上限
  titleLimit: 60,      // 申报标题字数上限
  ledgerPublicLimit: 30, // 公开账本默认展示条数
  leaderboardLimit: 10,  // 排行榜每榜人数
}

// 四档成长标识（按「累计获得币数」earned 判定，班级计划 P43/P45 口径）
export const GROWTH_TIERS = [
  { key: 'sprout', min: 1, max: 5, zh: '薄荷芽', en: 'Mint Sprout', th: 'หน่อมินต์' },
  { key: 'leaf', min: 6, max: 10, zh: '薄荷叶', en: 'Mint Leaf', th: 'ใบมินต์' },
  { key: 'bush', min: 11, max: 15, zh: '薄荷丛', en: 'Mint Bush', th: 'พุ่มมินต์' },
  { key: 'king', min: 16, max: Infinity, zh: '薄荷王', en: 'Mint King', th: 'ราชามินต์' },
]

// 币森林（小组树）阈值（班级计划 P43 口径：达 200 币开花、达 500 币结果）
export const FOREST = { bloom: 200, fruit: 500 }

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// 按累计获得币数返回成长标识（earned < 1 时返回 null，表示尚无币）
export function growthTierOf(earned) {
  const n = Number(earned) || 0
  if (n < 1) return null
  return GROWTH_TIERS.find(t => n >= t.min && n <= t.max) || GROWTH_TIERS[GROWTH_TIERS.length - 1]
}

// 小组树阶段：grow = 0-100% 生长（按 bloom 缩放）、bloomed=开花、fruited=结果
export function treeStageOf(groupEarn) {
  const n = Number(groupEarn) || 0
  if (n >= FOREST.fruit) return 'fruited'
  if (n >= FOREST.bloom) return 'bloomed'
  return 'growing'
}
