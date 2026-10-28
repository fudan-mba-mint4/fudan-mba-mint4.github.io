/**
 * 薄荷币 · 前端数据访问与文案（公开页 + 个人页共用）
 * 对应 /api/coins/board（公开总览）与 /api/coins/me（个人中心）
 */
import { ref } from 'vue'
import { useAuth } from './useAuth.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

export const COIN_I18N = {
  zh: {
    title: '薄荷币',
    slogan: '每一片叶子，都是你为班级付出的样子',
    subtitle: '班级虚拟激励积分 · 与班费现金完全隔离，不可兑换现金',
    loginWallet: '登录查看我的钱包',
    myWallet: '我的钱包',
    balance: '当前余额',
    earned: '累计获得',
    spent: '累计花费',
    tier: '成长标识',
    overview: '班级概览',
    totalCirculating: '流通总币',
    issuedThisMonth: '本月发放',
    participants: '参与人数',
    bloomedTrees: '开花树',
    tabs: { forest: '薄荷园', board: '排行榜', ledger: '公开账本', honors: '荣誉墙' },
    forestTip: '以小组为单位，成员贡献汇成一棵树：200 币开花，500 币结果',
    group: '第 {n} 组',
    treeStages: { growing: '生长中', bloomed: '已开花', fruited: '已结果' },
    member: '人参与',
    boardTabs: { total: '总榜', year: '年度榜', month: '月度榜' },
    rank: '第 {n} 名',
    coins: '币',
    ledgerTitle: '每笔发放有迹可循',
    ledgerEmpty: '暂无公开记录',
    noAccount: '暂无',
    honorsTitle: '班级荣誉',
    honorTop3: '年度贡献之星',
    achievements: '成就',
    king: '薄荷王',
    treeAchievements: { tree_bloomed: '第 {g} 组的树开花了 🌸', tree_fruited: '第 {g} 组的树结果了 🍊' },
    applied: '已入账',
    noData: '暂无',
    updated: '更新于',
  },
  en: {
    title: 'Mint Coins',
    slogan: 'Every leaf is a piece of you, given to our class',
    subtitle: 'Class virtual incentive points · Fully separate from class funds, not redeemable for cash',
    loginWallet: 'Log in to see your wallet',
    myWallet: 'My Wallet',
    balance: 'Balance',
    earned: 'Total Earned',
    spent: 'Total Spent',
    tier: 'Growth Tier',
    overview: 'Class Overview',
    totalCirculating: 'In Circulation',
    issuedThisMonth: 'Issued This Month',
    participants: 'Participants',
    bloomedTrees: 'Bloomed Trees',
    tabs: { forest: 'Mint Garden', board: 'Leaderboard', ledger: 'Public Ledger', honors: 'Honors' },
    forestTip: 'Each group grows a tree from members\' contributions: blooms at 200, bears fruit at 500',
    group: 'Group {n}',
    treeStages: { growing: 'Growing', bloomed: 'Bloomed', fruited: 'Fruited' },
    member: 'members',
    boardTabs: { total: 'All-time', year: 'Yearly', month: 'Monthly' },
    rank: '#{n}',
    coins: 'coins',
    ledgerTitle: 'Every award, traceable',
    ledgerEmpty: 'No public records yet',
    noAccount: '—',
    honorsTitle: 'Class Honors',
    honorTop3: 'Top Contributors of the Year',
    achievements: 'Achievements',
    king: 'Mint King',
    treeAchievements: { tree_bloomed: 'Group {g}\'s tree bloomed 🌸', tree_fruited: 'Group {g}\'s tree bore fruit 🍊' },
    applied: 'Awarded',
    noData: 'None',
    updated: 'Updated',
  },
  th: {
    title: 'เหรียญมินต์',
    slogan: 'ทุกใบคือสิ่งที่คุณมอบให้ห้องเรียน',
    subtitle: 'คะแนนสะสมเสมือนจริงของห้องเรียน · แยกจากเงินส่วนกลาง ไม่สามารถแลกเป็นเงินสดได้',
    loginWallet: 'เข้าสู่ระบบเพื่อดูกระเป๋าของคุณ',
    myWallet: 'กระเป๋าของฉัน',
    balance: 'ยอดคงเหลือ',
    earned: 'สะสมทั้งหมด',
    spent: 'ใช้ไป',
    tier: 'ระดับการเติบโต',
    overview: 'ภาพรวมห้องเรียน',
    totalCirculating: 'เหรียญหมุนเวียน',
    issuedThisMonth: 'ออกเดือนนี้',
    participants: 'ผู้เข้าร่วม',
    bloomedTrees: 'ต้นไม้ออกดอก',
    tabs: { forest: 'สวนมินต์', board: 'อันดับ', ledger: 'บัญชีสาธารณะ', honors: 'เกียรติยศ' },
    forestTip: 'แต่ละกลุ่มผลิบานเป็นต้นไม้จากความร่วมมือ: 200 ออกดอก, 500 ออกผล',
    group: 'กลุ่ม {n}',
    treeStages: { growing: 'กำลังเติบโต', bloomed: 'ออกดอกแล้ว', fruited: 'ออกผลแล้ว' },
    member: 'คนร่วม',
    boardTabs: { total: 'รวม', year: 'รายปี', month: 'รายเดือน' },
    rank: 'อันดับ {n}',
    coins: 'เหรียญ',
    ledgerTitle: 'ทุกการออกเหรียญตรวจสอบได้',
    ledgerEmpty: 'ยังไม่มีบันทึกสาธารณะ',
    noAccount: '—',
    honorsTitle: 'เกียรติยศห้องเรียน',
    honorTop3: 'ดาวเด่นแห่งปี',
    achievements: 'ความสำเร็จ',
    king: 'ราชามินต์',
    treeAchievements: { tree_bloomed: 'ต้นไม้กลุ่ม {g} ออกดอก 🌸', tree_fruited: 'ต้นไม้กลุ่ม {g} ออกผล 🍊' },
    applied: 'เข้าบัญชีแล้ว',
    noData: 'ไม่มีข้อมูล',
    updated: 'อัปเดต',
  },
}

export function useCoins() {
  const { isAuthenticated, getToken } = useAuth()
  const board = ref(null)
  const me = ref(null)
  const boardLoading = ref(false)
  const meLoading = ref(false)
  const boardError = ref('')

  async function fetchBoard(force = false) {
    if (boardLoading.value) return board.value
    if (board.value && !force) return board.value
    boardLoading.value = true
    boardError.value = ''
    try {
      const res = await fetchWithRetry('/api/coins/board', {}, { timeoutMs: 10000, retries: 2 })
      if (!res.ok) { boardError.value = '加载失败'; return null }
      board.value = await res.json()
    } catch (e) { boardError.value = '网络错误' }
    finally { boardLoading.value = false }
    return board.value
  }

  async function fetchMe(force = false) {
    if (!isAuthenticated.value) { me.value = null; return null }
    if (meLoading.value) return me.value
    if (me.value && !force) return me.value
    meLoading.value = true
    try {
      const res = await fetchWithRetry('/api/coins/me', { headers: { Authorization: `Bearer ${getToken()}` } }, { timeoutMs: 10000, retries: 2 })
      if (!res.ok) { me.value = null; return null }
      me.value = await res.json()
    } catch (e) { me.value = null }
    finally { meLoading.value = false }
    return me.value
  }

  async function submitClaim(payload) {
    const res = await fetchWithRetry('/api/coins/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload),
    })
    const j = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, ...j }
  }

  return { board, me, boardLoading, meLoading, boardError, fetchBoard, fetchMe, submitClaim }
}

// 成长标识工具（前端轻量版，口径与后端 _coins.js 一致）
export const TIERS = [
  { key: 'sprout', min: 1, max: 5, zh: '薄荷芽', en: 'Mint Sprout', th: 'หน่อมินต์' },
  { key: 'leaf', min: 6, max: 10, zh: '薄荷叶', en: 'Mint Leaf', th: 'ใบมินต์' },
  { key: 'bush', min: 11, max: 15, zh: '薄荷丛', en: 'Mint Bush', th: 'พุ่มมินต์' },
  { key: 'king', min: 16, max: Infinity, zh: '薄荷王', en: 'Mint King', th: 'ราชามินต์' },
]
export function tierOf(earned) {
  const n = Number(earned) || 0
  if (n < 1) return null
  return TIERS.find(t => n >= t.min && n <= t.max) || TIERS[TIERS.length - 1]
}
