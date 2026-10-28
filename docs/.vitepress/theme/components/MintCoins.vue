<template>
  <div class="mint-coins" :class="{ 'is-dark': isDark }">
    <!-- ===== Hero：浪漫主视觉 ===== -->
    <section class="mc-hero">
      <div class="mc-hero-bg" aria-hidden="true">
        <span class="leaf leaf-1"></span><span class="leaf leaf-2"></span>
        <span class="leaf leaf-3"></span><span class="leaf leaf-4"></span>
        <span class="leaf leaf-5"></span><span class="leaf leaf-6"></span>
      </div>
      <div class="mc-hero-inner">
        <div class="mc-hero-badge">🍃 {{ t.title }}</div>
        <h1 class="mc-hero-title">{{ t.title }}</h1>
        <p class="mc-hero-slogan">{{ t.slogan }}</p>
        <p class="mc-hero-sub">{{ t.subtitle }}</p>
        <a v-if="isAuthenticated" :href="`${langPrefix}/profile/#coins`" class="mc-wallet-btn">
          🍃 {{ me?.account?.balance ?? '…' }} · {{ t.myWallet }}
        </a>
        <a v-else :href="`${langPrefix}/auth/`" class="mc-wallet-btn">{{ t.loginWallet }}</a>
      </div>
      <!-- 概览指标 -->
      <div class="mc-overview" v-if="board">
        <div class="mc-stat"><span class="mc-stat-num">{{ board.overview.totalCirculating }}</span><span class="mc-stat-label">{{ t.totalCirculating }}</span></div>
        <div class="mc-stat"><span class="mc-stat-num">+{{ board.overview.issuedThisMonth }}</span><span class="mc-stat-label">{{ t.issuedThisMonth }}</span></div>
        <div class="mc-stat"><span class="mc-stat-num">{{ board.overview.participants }}</span><span class="mc-stat-label">{{ t.participants }}</span></div>
        <div class="mc-stat"><span class="mc-stat-num">{{ board.overview.bloomedTrees }}</span><span class="mc-stat-label">{{ t.bloomedTrees }}</span></div>
      </div>
    </section>

    <!-- ===== 分区 Tab ===== -->
    <nav class="mc-tabs" role="tablist">
      <button v-for="(label, key) in t.tabs" :key="key" role="tab" :aria-selected="tab === key"
        class="mc-tab" :class="{ active: tab === key }" @click="tab = key">{{ label }}</button>
    </nav>

    <section v-if="boardLoading && !board" class="mc-loading">{{ t.noData }}</section>

    <!-- ===== 薄荷园 · 森林 ===== -->
    <section v-show="tab === 'forest'" class="mc-section">
      <p class="mc-tip">{{ t.forestTip }}</p>
      <div class="mc-forest">
        <div v-for="tree in forest" :key="tree.group" class="mc-tree-card" :class="{ 'mc-tree-card--bloomed': tree.stage !== 'growing' }">
          <svg class="mc-tree-svg" viewBox="0 0 120 170" role="img" :aria-label="treeLabel(tree)" :style="treeSwayStyle(tree)">
            <ellipse cx="60" cy="162" rx="34" ry="7" class="mc-tree-shadow" />
            <g class="mc-tree-grow" :style="treeGrowStyle(tree)">
              <path :d="trunkPath(tree)" class="mc-tree-trunk" />
              <g v-for="(c, i) in crownCircles(tree)" :key="i" :cx="c.x" :cy="c.y">
                <circle :cx="c.x" :cy="c.y" :r="c.r" class="mc-tree-crown" />
                <circle :cx="c.x" :cy="c.y" :r="c.r" class="mc-tree-crown-inner" />
              </g>
              <g v-if="tree.stage === 'bloomed'" class="mc-tree-blooms">
                <circle v-for="(b, i) in stageDots(tree, 'bloom')" :key="'b' + i" :cx="b.x" :cy="b.y" r="4.2" class="mc-bloom" />
                <circle v-for="(b, i) in stageDots(tree, 'bloom')" :key="'bh' + i" :cx="b.x - 1.5" :cy="b.y - 1.5" r="1.6" class="mc-bloom-hi" />
              </g>
              <g v-if="tree.stage === 'fruited'" class="mc-tree-fruits">
                <circle v-for="(f, i) in stageDots(tree, 'fruit')" :key="'f' + i" :cx="f.x" :cy="f.y" r="5.8" class="mc-fruit" />
                <circle v-for="(f, i) in stageDots(tree, 'fruit')" :key="'fh' + i" :cx="f.x - 2" :cy="f.y - 2" r="1.9" class="mc-fruit-hi" />
              </g>
            </g>
          </svg>
          <div class="mc-tree-meta">
            <div class="mc-tree-group">{{ t.group.replace('{n}', tree.group) }}</div>
            <div class="mc-tree-amount"><strong>{{ tree.earned }}</strong> {{ t.coins }}</div>
            <div class="mc-tree-stage" :class="'stage-' + tree.stage">{{ stageLabel(tree) }}</div>
            <div class="mc-tree-members">{{ tree.members }} {{ t.member }}</div>
          </div>
        </div>
        <div v-if="!forest.length" class="mc-empty">{{ t.ledgerEmpty }}</div>
      </div>
    </section>

    <!-- ===== 排行榜 ===== -->
    <section v-show="tab === 'board'" class="mc-section">
      <div class="mc-subtabs">
        <button v-for="(label, key) in t.boardTabs" :key="key" class="mc-subtab" :class="{ active: boardTab === key }"
          @click="boardTab = key">{{ label }}</button>
      </div>
      <ol class="mc-rank-list">
        <li v-for="(p, i) in currentBoard" :key="p.userId" class="mc-rank-row" :class="'rank-' + (i + 1)">
          <span class="mc-rank-no">{{ i < 3 ? medal(i) : i + 1 }}</span>
          <span class="mc-rank-avatar">{{ (p.name || '?').charAt(0) }}</span>
          <span class="mc-rank-name">{{ p.name }}</span>
          <span v-if="p.group" class="mc-rank-group">{{ t.group.replace('{n}', p.group) }}</span>
          <span class="mc-rank-earned">{{ p.earned }} {{ t.coins }}</span>
        </li>
        <li v-if="!currentBoard.length" class="mc-empty">{{ t.noData }}</li>
      </ol>
    </section>

    <!-- ===== 公开账本 ===== -->
    <section v-show="tab === 'ledger'" class="mc-section">
      <p class="mc-tip">{{ t.ledgerTitle }}</p>
      <div class="mc-ledger">
        <div v-for="row in board?.ledger || []" :key="row.createdAt + ':' + row.delta + ':' + row.note" class="mc-ledger-row">
          <span class="mc-ledger-delta" :class="row.delta > 0 ? 'earn' : 'spend'">{{ row.delta > 0 ? '+' : '' }}{{ row.delta }}</span>
          <span class="mc-ledger-note">{{ row.note || '—' }}</span>
          <span class="mc-ledger-op">{{ row.operator || '' }}</span>
          <time class="mc-ledger-date">{{ shortDate(row.createdAt) }}</time>
        </div>
        <div v-if="!board?.ledger?.length" class="mc-empty">{{ t.ledgerEmpty }}</div>
      </div>
    </section>

    <!-- ===== 荣誉墙 ===== -->
    <section v-show="tab === 'honors'" class="mc-section">
      <div class="mc-honors">
        <div class="mc-honor-podium">
          <h3 class="mc-honor-title">👑 {{ t.honorTop3 }}</h3>
          <div class="mc-podium">
            <div v-for="(p, i) in podiumOrder(board?.honors?.top3)" :key="p.userId" class="mc-podium-card" :class="'podium-' + p._rank">
              <div class="mc-podium-medal">{{ podiumMedal(p._rank) }}</div>
              <div class="mc-podium-avatar">{{ (p.name || '?').charAt(0) }}</div>
              <div class="mc-podium-name">{{ p.name }}</div>
              <div class="mc-podium-earned">{{ p.earned }} {{ t.coins }}</div>
            </div>
          </div>
        </div>
        <div class="mc-honor-ach">
          <h3 class="mc-honor-title">🏅 {{ t.achievements }}</h3>
          <ul class="mc-ach-list">
            <li v-for="(a, i) in board?.honors?.achievements || []" :key="i" class="mc-ach-item">
              {{ t.treeAchievements[a.type]?.replace('{g}', a.group) || a.type }}
            </li>
            <li v-if="board?.honors?.kingNames?.length" class="mc-ach-item mc-ach-king">
              {{ t.king }}：{{ board.honors.kingNames.join('、') }}
            </li>
            <li v-if="!board?.honors?.achievements?.length && !board?.honors?.kingNames?.length" class="mc-empty">{{ t.noData }}</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useAuth } from '../composables/useAuth.js'
import { COIN_I18N, useCoins } from '../composables/useCoins.js'
import { markRead } from '../composables/useUnread.js'

const { t, lang } = useLang(COIN_I18N)
const { isAuthenticated } = useAuth()
const { board, boardLoading, fetchBoard, me, fetchMe } = useCoins()

const langPrefix = computed(() => lang.value === 'en' ? '/en' : lang.value === 'th' ? '/th' : '')
const isDark = ref(false)
const tab = ref('forest')
const boardTab = ref('total')

// 树生长：earned → 0..1 比例（按 200 币开花缩放），树干/冠随比例生长
const forest = computed(() => (board.value?.forest || []).map(f => ({
  ...f,
  grow: Math.min(1, (f.earned || 0) / (board.value?.forestConfig?.bloom || 200)),
})))

function trunkPath(tree) {
  const trunkH = 36 + 62 * tree.grow
  return `M60 158 C57 ${152 - trunkH * 0.45} 57 ${156 - trunkH * 0.75} 60 ${158 - trunkH}`
}
function crownCircles(tree) {
  const trunkH = 36 + 62 * tree.grow
  // cy 下移 10px：保证完全生长时树冠顶部仍在 SVG 内留白（顶部圆 r+4）
  const cy = 158 - trunkH - 16 - 6 * tree.grow
  const r = 17 + 9 * tree.grow
  return [
    { x: 45, y: cy + 8, r },
    { x: 75, y: cy + 8, r },
    { x: 60, y: cy - 6, r: r + 4 },
  ]
}
function treeGrowStyle(tree) {
  const scale = 0.45 + 0.55 * tree.grow
  return {
    transform: `translateY(${(1 - tree.grow) * 46}px) scale(${scale.toFixed(3)})`,
    transformOrigin: '60px 158px',
  }
}
// 六棵树各自不同的摇摆参数（周期/幅度/相位），风吹般错落
const SWAY = [
  { dur: 4.4, amp: 2.0, delay: 0 }, { dur: 5.8, amp: 1.4, delay: -1.6 },
  { dur: 3.6, amp: 2.6, delay: -3.4 }, { dur: 6.2, amp: 1.2, delay: -0.7 },
  { dur: 4.9, amp: 2.2, delay: -2.6 }, { dur: 5.3, amp: 1.7, delay: -4.2 },
]
function treeSwayStyle(tree) {
  const s = SWAY[(tree.group - 1) % SWAY.length]
  return { '--sway-dur': s.dur + 's', '--sway-amp': s.amp + 'deg', '--sway-delay': s.delay + 's' }
}
// 花/果随树冠动态定位：粉花开在枝头（树冠上部），橙果挂在冠间，随生长比例上移
function stageDots(tree, kind) {
  const trunkH = 36 + 62 * tree.grow
  const cy = 158 - trunkH - 16 - 6 * tree.grow
  const r = 17 + 9 * tree.grow
  const ox = 60
  const oy = cy + 6
  const rel = kind === 'bloom'
    ? [[-0.55, -0.4], [0.1, -0.58], [0.52, -0.24], [-0.28, 0.02], [0.38, 0.0], [-0.5, 0.2]]
    : [[-0.5, 0.12], [0.08, 0.34], [0.46, 0.16], [-0.12, 0.5], [0.32, 0.48], [0.12, -0.2]]
  return rel.map(([fx, fy]) => ({ x: ox + fx * r * 1.45, y: oy + fy * r * 1.45 }))
}
const stageLabel = (tree) => (t.value.treeStages[tree.stage] || tree.stage)
const treeLabel = (tree) => `${t.value.group.replace('{n}', tree.group)} · ${tree.earned} ${t.value.coins} · ${stageLabel(tree)}`

const currentBoard = computed(() => board.value?.leaderboard?.[boardTab.value] || [])
const medal = (i) => ['🥇', '🥈', '🥉'][i] || ''
const podiumMedal = (r) => ['👑', '🥈', '🥉'][r - 1] || ''
// 领奖台顺序：第 1 名居中，2/3 两侧
function podiumOrder(list) {
  if (!list || !list.length) return []
  const arr = list.slice(0, 3).map((p, i) => ({ ...p, _rank: i + 1 }))
  if (arr.length === 1) return arr
  const first = arr.find(x => x._rank === 1) || arr[0]
  const others = arr.filter(x => x._rank !== 1)
  return [others[0], first, others[1]].filter(Boolean)
}
function shortDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) } catch { return '' }
}

function syncDark() {
  if (typeof document === 'undefined') return
  isDark.value = document.documentElement.classList.contains('dark')
}

// 登录态异步恢复后补拉个人数据（钱包按钮与红点清零依赖）
watch(isAuthenticated, (v) => {
  if (v) {
    fetchMe().then(d => { if (d) markRead('coins', (d.claims || []).map(c => `${c.id}:${c.status}`)) })
  }
}, { immediate: true })

onMounted(() => {
  syncDark()
  fetchBoard()
  if (typeof window !== 'undefined') {
    const mo = window.matchMedia('(prefers-color-scheme: dark)')
    mo.addEventListener?.('change', syncDark)
    const obs = new MutationObserver(syncDark)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }
})
</script>

<style scoped>
.mint-coins {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px 48px;
  min-height: 70vh;
}

/* ===== Hero ===== */
.mc-hero {
  position: relative;
  border-radius: 24px;
  padding: 56px 40px 48px;
  margin: 24px 0 28px;
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 12% 0%, rgba(94, 196, 172, 0.28), transparent 55%),
    radial-gradient(90% 80% at 92% 12%, rgba(94, 92, 230, 0.16), transparent 60%),
    linear-gradient(160deg, #f2fbf7, #eaf6f1);
  text-align: center;
}
.dark .mc-hero {
  background:
    radial-gradient(120% 90% at 12% 0%, rgba(45, 122, 108, 0.5), transparent 55%),
    radial-gradient(90% 80% at 92% 12%, rgba(94, 92, 230, 0.28), transparent 60%),
    linear-gradient(160deg, #16312b, #1d1d1f);
}
.mc-hero-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #2d7a6c;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(45, 122, 108, 0.2);
  margin-bottom: 14px;
}
.dark .mc-hero-badge { color: #5ec4ac; background: rgba(29, 29, 31, 0.7); }
.mc-hero-title { font-size: 44px; font-weight: 800; margin: 0 0 10px; letter-spacing: 2px; }
.mc-hero-slogan { font-size: 17px; font-weight: 600; color: #2d7a6c; margin: 0 0 8px; }
.dark .mc-hero-slogan { color: #5ec4ac; }
.mc-hero-sub { font-size: 13px; color: var(--c-text-secondary, #6e6e73); margin: 0 0 24px; }
.mc-wallet-btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2d7a6c, #1a5c50);
  box-shadow: 0 8px 24px rgba(45, 122, 108, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}
.mc-wallet-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(45, 122, 108, 0.45); }

/* 概览指标：文档流 grid，宽屏 4 列 / 窄屏 2 列，避免绝对定位换行遮挡 */
.mc-overview {
  margin: 28px auto 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  width: min(92%, 780px);
}
.mc-stat {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(45, 122, 108, 0.14);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}
.dark .mc-stat { background: rgba(29, 29, 31, 0.7); border-color: rgba(94, 196, 172, 0.2); }
.mc-stat-num { font-size: 24px; font-weight: 800; color: #2d7a6c; }
.dark .mc-stat-num { color: #5ec4ac; }
.mc-stat-label { font-size: 12px; color: var(--c-text-secondary, #6e6e73); }

/* 薄荷叶粒子 */
.mc-hero-bg .leaf {
  position: absolute;
  width: 18px;
  height: 22px;
  opacity: 0.45;
  animation: mc-fall linear infinite;
  pointer-events: none;
}
.mc-hero-bg .leaf::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at 40% 60%, #5ec4ac 45%, #2d7a6c 100%);
  border-radius: 70% 10% 70% 10%;
  transform: rotate(-28deg);
}
.dark .mc-hero-bg .leaf::before { background: radial-gradient(ellipse at 40% 60%, #5ec4ac 30%, #1a5c50 100%); }
.leaf-1 { left: 6%; top: -30px; animation-duration: 9s; }
.leaf-2 { left: 18%; top: -40px; animation-duration: 12s; animation-delay: 2s; transform: scale(1.2); }
.leaf-3 { left: 32%; top: -25px; animation-duration: 10s; animation-delay: 4s; transform: scale(0.8); }
.leaf-4 { left: 62%; top: -35px; animation-duration: 11s; animation-delay: 1s; transform: scale(1.1); }
.leaf-5 { left: 76%; top: -28px; animation-duration: 9.5s; animation-delay: 3s; transform: scale(0.9); }
.leaf-6 { left: 90%; top: -38px; animation-duration: 13s; animation-delay: 5s; transform: scale(1.25); }
@keyframes mc-fall {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(640px) rotate(340deg); }
}

/* ===== Tab ===== */
.mc-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 28px;
}
.mc-tab {
  padding: 9px 22px;
  border-radius: 999px;
  border: 1px solid var(--c-border, #e5e5ea);
  background: var(--c-bg-card, #fff);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-secondary, #6e6e73);
  cursor: pointer;
  transition: all 0.2s;
}
.mc-tab.active {
  background: linear-gradient(135deg, #2d7a6c, #1a5c50);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6px 18px rgba(45, 122, 108, 0.3);
}
.mc-section { animation: mc-fadein 0.35s ease; }
@keyframes mc-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.mc-tip { font-size: 13px; color: var(--c-text-secondary, #6e6e73); text-align: center; margin: 0 0 18px; }

/* ===== 薄荷园 · 森林 ===== */
.mc-forest {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.mc-tree-card {
  position: relative;
  background: var(--c-bg-card, #fff);
  border: 1px solid var(--c-border, #e5e5ea);
  border-radius: 20px;
  padding: 20px 14px 18px;
  text-align: center;
  overflow: hidden;
}
.mc-tree-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(80% 60% at 50% 0%, rgba(94, 196, 172, 0.12), transparent 70%);
  pointer-events: none;
}
.mc-tree-card--bloomed::before {
  background: radial-gradient(80% 60% at 50% 0%, rgba(255, 182, 193, 0.22), rgba(94, 196, 172, 0.08) 60%, transparent 75%);
}
.mc-tree-svg {
  width: 100%;
  max-width: 170px;
  height: auto;
  transform-origin: 60px 158px;
  animation: mc-sway var(--sway-dur, 4.8s) ease-in-out infinite;
  animation-delay: var(--sway-delay, 0s);
}
@keyframes mc-sway {
  0%, 100% { transform: rotate(var(--sway-amp, 2deg)); }
  50% { transform: rotate(calc(var(--sway-amp, 2deg) * -1)); }
}
.mc-tree-shadow { fill: rgba(0, 0, 0, 0.08); }
.mc-tree-grow { transition: transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1); }
.mc-tree-trunk {
  fill: none;
  stroke: #8a6a48;
  stroke-width: 9;
  stroke-linecap: round;
}
.mc-tree-crown { fill: #3ba08a; }
.mc-tree-crown-inner { fill: #5ec4ac; opacity: 0.5; }
.dark .mc-tree-crown { fill: #2a8a74; }
.dark .mc-tree-crown-inner { fill: #5ec4ac; opacity: 0.45; }
.mc-bloom { fill: #ff9ebc; animation: mc-bloom-pulse 2.4s ease-in-out infinite; }
.mc-bloom-hi { fill: rgba(255, 255, 255, 0.9); }
.mc-bloom:nth-child(even) { animation-delay: 0.7s; }
@keyframes mc-bloom-pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; transform-origin: center; } }
.mc-fruit { fill: #ff7b29; }
.mc-fruit-hi { fill: rgba(255, 235, 200, 0.95); }
.mc-tree-meta { margin-top: 4px; position: relative; }
.mc-tree-group { font-size: 14px; font-weight: 700; }
.mc-tree-amount { font-size: 13px; color: var(--c-text-secondary, #6e6e73); margin: 2px 0; }
.mc-tree-amount strong { color: #2d7a6c; font-size: 15px; }
.dark .mc-tree-amount strong { color: #5ec4ac; }
.mc-tree-stage {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  margin-top: 4px;
}
.stage-growing { background: rgba(94, 196, 172, 0.16); color: #2d7a6c; }
.dark .stage-growing { color: #5ec4ac; }
.stage-bloomed { background: rgba(255, 179, 193, 0.28); color: #d6336c; }
.stage-fruited { background: rgba(255, 138, 61, 0.2); color: #d9701a; }
.mc-tree-members { font-size: 12px; color: var(--c-text-tertiary, #aeaeb2); margin-top: 3px; }

/* ===== 排行榜 ===== */
.mc-subtabs { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
.mc-subtab {
  padding: 7px 18px;
  border-radius: 999px;
  border: 1px solid var(--c-border, #e5e5ea);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-secondary, #6e6e73);
  cursor: pointer;
  transition: all 0.2s;
}
.mc-subtab.active { background: rgba(45, 122, 108, 0.12); color: #2d7a6c; border-color: rgba(45, 122, 108, 0.3); }
.dark .mc-subtab.active { color: #5ec4ac; background: rgba(94, 196, 172, 0.14); }
.mc-rank-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mc-rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--c-bg-card, #fff);
  border: 1px solid var(--c-border, #e5e5ea);
  border-radius: 14px;
  padding: 12px 18px;
  transition: transform 0.15s, box-shadow 0.2s;
}
.mc-rank-row:hover { transform: translateX(4px); }
.mc-rank-row.rank-1 { border-color: rgba(255, 190, 60, 0.55); box-shadow: 0 4px 18px rgba(255, 190, 60, 0.18); }
.mc-rank-row.rank-2 { border-color: rgba(190, 196, 204, 0.55); }
.mc-rank-row.rank-3 { border-color: rgba(205, 142, 90, 0.5); }
.mc-rank-no { width: 34px; text-align: center; font-size: 18px; font-weight: 800; flex-shrink: 0; }
.mc-rank-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #5ec4ac, #2d7a6c);
  color: #fff; font-weight: 700; font-size: 16px;
  flex-shrink: 0;
}
.mc-rank-name { flex: 1; min-width: 0; font-weight: 600; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-rank-group { font-size: 12px; color: var(--c-text-tertiary, #aeaeb2); flex-shrink: 0; }
.mc-rank-earned { font-size: 14px; font-weight: 700; color: #2d7a6c; flex-shrink: 0; }
.dark .mc-rank-earned { color: #5ec4ac; }

/* ===== 公开账本 ===== */
.mc-ledger { display: flex; flex-direction: column; gap: 6px; }
.mc-ledger-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--c-bg-card, #fff);
  border: 1px solid var(--c-border, #e5e5ea);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
}
.mc-ledger-delta { font-weight: 800; font-size: 15px; flex-shrink: 0; min-width: 52px; }
.mc-ledger-delta.earn { color: #34c759; }
.mc-ledger-delta.spend { color: #ff3b30; }
.mc-ledger-note { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-ledger-op { font-size: 12px; color: var(--c-text-tertiary, #aeaeb2); flex-shrink: 0; }
.mc-ledger-date { font-size: 12px; color: var(--c-text-tertiary, #aeaeb2); flex-shrink: 0; }

/* ===== 荣誉墙 ===== */
.mc-honors { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.mc-honor-title { font-size: 16px; font-weight: 700; margin: 0 0 14px; }
.mc-podium { display: flex; align-items: flex-end; gap: 10px; justify-content: center; }
.mc-podium-card {
  flex: 1;
  text-align: center;
  background: var(--c-bg-card, #fff);
  border: 1px solid var(--c-border, #e5e5ea);
  border-radius: 16px;
  padding: 16px 10px;
}
.mc-podium-card.podium-1 { order: 0; padding-top: 22px; border-color: rgba(255, 190, 60, 0.5); box-shadow: 0 6px 22px rgba(255, 190, 60, 0.18); }
.mc-podium-card.podium-2 { order: 1; }
.mc-podium-card.podium-3 { order: 2; }
.mc-podium-medal { font-size: 22px; }
.mc-podium-avatar {
  width: 46px; height: 46px; margin: 8px auto 6px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #5ec4ac, #2d7a6c);
  color: #fff; font-weight: 800; font-size: 19px;
}
.mc-podium-name { font-size: 14px; font-weight: 700; }
.mc-podium-earned { font-size: 13px; color: #2d7a6c; font-weight: 600; }
.dark .mc-podium-earned { color: #5ec4ac; }
.mc-ach-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mc-ach-item {
  background: var(--c-bg-card, #fff);
  border: 1px solid var(--c-border, #e5e5ea);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
}
.mc-ach-king { color: #2d7a6c; font-weight: 600; }
.dark .mc-ach-king { color: #5ec4ac; }

.mc-empty { text-align: center; color: var(--c-text-tertiary, #aeaeb2); font-size: 14px; padding: 24px 0; }
.mc-loading { text-align: center; color: var(--c-text-tertiary, #aeaeb2); padding: 40px 0; }

@media (max-width: 860px) {
  .mc-forest { grid-template-columns: repeat(2, 1fr); }
  .mc-honors { grid-template-columns: 1fr; }
  .mc-hero { padding: 40px 20px 56px; }
  .mc-hero-title { font-size: 32px; }
  .mc-overview { grid-template-columns: repeat(2, 1fr); gap: 12px; width: 100%; }
}
@media (max-width: 560px) {
  .mc-forest { grid-template-columns: 1fr; }
  .mc-hero { padding: 32px 16px 40px; }
  .mc-hero-title { font-size: 28px; }
}
</style>
