<script setup>
import { ref, computed, onMounted } from 'vue'

/* ========== 语言检测 ========== */
const currentLang = ref('zh')
onMounted(() => {
  const path = window.location.pathname
  if (path.startsWith('/en/')) currentLang.value = 'en'
  else if (path.startsWith('/th/')) currentLang.value = 'th'
  else currentLang.value = 'zh'
})

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    balance: '当前余额',
    income: '总收入',
    expense: '总支出',
    all: '全部',
    incomeOnly: '收入',
    expenseOnly: '支出',
    details: '收支明细',
    noRecords: '暂无收支记录',
    month: '月',
    categories: {
      tuition: '班费缴纳',
      activity: '活动支出',
      material: '物资采购',
      other: '其他',
    },
  },
  en: {
    balance: 'Current Balance',
    income: 'Total Income',
    expense: 'Total Expense',
    all: 'All',
    incomeOnly: 'Income',
    expenseOnly: 'Expense',
    details: 'Transaction History',
    noRecords: 'No transactions yet',
    month: '',
    categories: {
      tuition: 'Class Dues',
      activity: 'Activities',
      material: 'Supplies',
      other: 'Other',
    },
  },
  th: {
    balance: 'ยอดคงเหลือ',
    income: 'รายรับรวม',
    expense: 'รายจ่ายรวม',
    all: 'ทั้งหมด',
    incomeOnly: 'รายรับ',
    expenseOnly: 'รายจ่าย',
    details: 'รายการธุรกรรม',
    noRecords: 'ยังไม่มีรายการ',
    month: '',
    categories: {
      tuition: 'ค่าชั้นเรียน',
      activity: 'กิจกรรม',
      material: 'วัสดุ',
      other: 'อื่นๆ',
    },
  },
}
const t = computed(() => i18n[currentLang.value])

/* ========== 班费数据（从JSON读取） ========== */
const transactions = ref([])
onMounted(async () => {
  try {
    const res = await fetch('/data/finance.json')
    const data = await res.json()
    transactions.value = data.transactions
  } catch (e) {
    console.error('Failed to load finance data:', e)
  }
})

/* ========== 统计计算 ========== */
const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))
const totalExpense = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))
const balance = computed(() => totalIncome.value - totalExpense.value)

/* ========== 筛选 ========== */
const filterType = ref('all')
const filtered = computed(() => {
  let list = [...transactions.value]
  if (filterType.value === 'income') list = list.filter(t => t.type === 'income')
  if (filterType.value === 'expense') list = list.filter(t => t.type === 'expense')
  return list.sort((a, b) => new Date(b.date) - new Date(a.date))
})

/* ========== 格式化 ========== */
const formatAmount = (n) => n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  if (currentLang.value === 'zh') return `${d.getMonth() + 1}月${d.getDate()}日`
  if (currentLang.value === 'en') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
}
const categoryLabel = (cat) => t.value.categories[cat] || cat
</script>

<template>
  <div class="finance-page">
    <!-- 余额概览卡片 -->
    <div class="balance-card">
      <div class="balance-main">
        <span class="balance-label">{{ t.balance }}</span>
        <span class="balance-amount">¥ {{ formatAmount(balance) }}</span>
      </div>
      <div class="balance-stats">
        <div class="stat-col">
          <span class="stat-label">{{ t.income }}</span>
          <span class="stat-value stat-income">+¥ {{ formatAmount(totalIncome) }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-col">
          <span class="stat-label">{{ t.expense }}</span>
          <span class="stat-value stat-expense">-¥ {{ formatAmount(totalExpense) }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <span class="details-title">{{ t.details }}</span>
      <div class="filter-btns">
        <button
          v-for="opt in [{key:'all',label:t.all},{key:'income',label:t.incomeOnly},{key:'expense',label:t.expenseOnly}]"
          :key="opt.key"
          class="filter-btn"
          :class="{ active: filterType === opt.key }"
          @click="filterType = opt.key"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- 收支明细列表 -->
    <div class="tx-list" v-if="filtered.length > 0">
      <div
        v-for="tx in filtered"
        :key="tx.id"
        class="tx-item"
      >
        <div class="tx-icon" :class="tx.type">
          <svg v-if="tx.type === 'income'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
        <div class="tx-info">
          <span class="tx-desc">{{ tx.description }}</span>
          <div class="tx-meta">
            <span class="tx-category">{{ categoryLabel(tx.category) }}</span>
            <span class="tx-date">{{ formatDate(tx.date) }}</span>
          </div>
        </div>
        <span class="tx-amount" :class="tx.type">
          {{ tx.type === 'income' ? '+' : '-' }}¥ {{ formatAmount(tx.amount) }}
        </span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
      <p>{{ t.noRecords }}</p>
    </div>
  </div>
</template>

<style scoped>
.finance-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, var(--c-accent) 0%, var(--c-accent-dark) 100%);
  border-radius: 20px;
  padding: 28px 32px;
  color: #fff;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.balance-card::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 160px;
  height: 160px;
  background: rgba(255,255,255,0.08);
  border-radius: 50%;
}
.balance-card::after {
  content: '';
  position: absolute;
  bottom: -60px;
  left: -20px;
  width: 120px;
  height: 120px;
  background: rgba(255,255,255,0.05);
  border-radius: 50%;
}
.balance-main {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.balance-label {
  display: block;
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 8px;
}
.balance-amount {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.balance-stats {
  display: flex;
  align-items: center;
  gap: 32px;
  position: relative;
  z-index: 1;
}
.stat-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-size: 12px;
  opacity: 0.75;
}
.stat-value {
  font-size: 18px;
  font-weight: 600;
}
.stat-income { color: #a7f3d0; }
.stat-expense { color: #fecaca; }
.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255,255,255,0.2);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.details-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--c-text-primary);
}
.filter-btns {
  display: flex;
  gap: 6px;
}
.filter-btn {
  padding: 6px 14px;
  border: 1px solid var(--c-border);
  border-radius: 16px;
  background: var(--c-bg-secondary);
  color: var(--c-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.filter-btn:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}
.filter-btn.active {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}

/* 交易列表 */
.tx-list {
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
}
.tx-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--c-border);
  transition: background 0.15s ease;
}
.tx-item:last-child {
  border-bottom: none;
}
.tx-item:hover {
  background: var(--c-bg-elevated);
}
.tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tx-icon.income {
  background: rgba(52, 199, 89, 0.12);
  color: #34C759;
}
.tx-icon.expense {
  background: rgba(255, 59, 48, 0.10);
  color: #FF3B30;
}
.tx-info {
  flex: 1;
  min-width: 0;
}
.tx-desc {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: var(--c-text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tx-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tx-category {
  font-size: 12px;
  color: var(--c-text-tertiary);
  background: var(--c-bg-elevated);
  padding: 2px 8px;
  border-radius: 6px;
}
.tx-date {
  font-size: 12px;
  color: var(--c-text-tertiary);
}
.tx-amount {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}
.tx-amount.income { color: #34C759; }
.tx-amount.expense { color: #FF3B30; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--c-text-tertiary);
}
.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}
.empty-state p {
  font-size: 15px;
  margin: 0;
}

/* 响应式 */
@media (max-width: 640px) {
  .finance-page {
    padding: 0 16px 80px;
  }
  .balance-card {
    padding: 24px 20px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .balance-amount {
    font-size: 30px;
  }
  .balance-stats {
    gap: 24px;
    width: 100%;
    justify-content: flex-start;
  }
  .tx-item {
    padding: 14px 16px;
  }
  .tx-desc {
    font-size: 14px;
  }
}
</style>
