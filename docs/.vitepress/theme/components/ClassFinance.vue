<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLang } from '../composables/useLang.js'
import { sortByDateDesc, formatShortDate } from '../utils/dateUtils.js'
import { useData } from '../composables/useData.js'

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
    activityFinance: '活动财务',
    activityFinanceDesc: '点击查看活动消费明细',
    attendees: '人参加',
    total: '总计',
    perPerson: '人均',
    venue: '地点',
    breakdown: '消费明细',
    payers: '支付人',
    sponsors: '特别鸣谢赞助',
    attendanceNote: '签到说明',
    perPersonNote: '分摊说明',
    category: '类别',
    description: '项目',
    amount: '金额',
    payer: '支付人',
    note: '备注',
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
    activityFinance: 'Activity Finance',
    activityFinanceDesc: 'Click to view expense breakdown',
    attendees: 'attendees',
    total: 'Total',
    perPerson: 'Per Person',
    venue: 'Venue',
    breakdown: 'Expense Breakdown',
    payers: 'Paid By',
    sponsors: 'Special Thanks to Sponsors',
    attendanceNote: 'Attendance',
    perPersonNote: 'Split Note',
    category: 'Category',
    description: 'Item',
    amount: 'Amount',
    payer: 'Payer',
    note: 'Note',
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
    activityFinance: 'การเงินกิจกรรม',
    activityFinanceDesc: 'คลิกเพื่อดูรายละเอียดค่าใช้จ่าย',
    attendees: 'คนเข้าร่วม',
    total: 'รวมทั้งหมด',
    perPerson: 'ต่อคน',
    venue: 'สถานที่',
    breakdown: 'รายละเอียดค่าใช้จ่าย',
    payers: 'ผู้จ่าย',
    sponsors: 'ขอขอบคุณผู้สนับสนุน',
    attendanceNote: 'การเข้าร่วม',
    perPersonNote: 'หมายเหตุการแบ่ง',
    category: 'หมวดหมู่',
    description: 'รายการ',
    amount: 'จำนวนเงิน',
    payer: 'ผู้จ่าย',
    note: 'หมายเหตุ',
    categories: {
      tuition: 'ค่าชั้นเรียน',
      activity: 'กิจกรรม',
      material: 'วัสดุ',
      other: 'อื่นๆ',
    },
  },
}
const { lang: currentLang, t } = useLang(i18n)

/* ========== 班费数据（从JSON读取） ========== */
const { data: financeData } = useData('/data/finance.json')
const { data: activitiesData } = useData('/data/activities.json')
const transactions = computed(() => financeData.value?.transactions || [])
const activityFinances = computed(() => financeData.value?.activityFinances || [])
const activitiesMap = computed(() => {
  const map = {}
  ;(activitiesData.value?.activities || []).forEach(a => { map[a.id] = a })
  return map
})
const expandedActivity = ref(null)

const toggleActivity = (id) => {
  expandedActivity.value = expandedActivity.value === id ? null : id
}

const activityTitle = (af) => {
  const act = activitiesMap.value[af.activityId]
  return act ? (act.title[currentLang.value] || act.title.zh || af.activityId) : af.activityId
}

const sortedActivityFinances = computed(() => {
  return sortByDateDesc(activityFinances.value, 'date')
})

const activityDate = (af) => formatShortDate(af.date, currentLang.value)

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
  return sortByDateDesc(list, 'date')
})

/* ========== 格式化 ========== */
const formatAmount = (n) => (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const formatDate = (dateStr) => formatShortDate(dateStr, currentLang.value)
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

    <!-- 活动财务区块 -->
    <div class="activity-finance-section" v-if="activityFinances.length > 0">
      <div class="section-header">
        <h3 class="section-title">{{ t.activityFinance }}</h3>
        <span class="section-desc">{{ t.activityFinanceDesc }}</span>
      </div>
      <div class="activity-finance-list">
        <div
          v-for="af in sortedActivityFinances"
          :key="af.activityId"
          class="activity-finance-card"
          :class="{ expanded: expandedActivity === af.activityId }"
        >
          <!-- 摘要行 -->
          <div class="af-summary" @click="toggleActivity(af.activityId)">
            <div class="af-main-info">
              <span class="af-date">{{ activityDate(af) }}</span>
              <span class="af-title">{{ activityTitle(af) }}</span>
              <span class="af-venue" v-if="af.venue">{{ af.venue[currentLang] || af.venue.zh }}</span>
            </div>
            <div class="af-stats">
              <div class="af-stat">
                <span class="af-stat-label">{{ t.attendees }}</span>
                <span class="af-stat-value">{{ af.attendees }}</span>
              </div>
              <div class="af-stat">
                <span class="af-stat-label">{{ t.total }}</span>
                <span class="af-stat-value">¥{{ formatAmount(af.totalAmount) }}</span>
              </div>
              <div class="af-stat af-per-person">
                <span class="af-stat-label">{{ t.perPerson }}</span>
                <span class="af-stat-value">¥{{ af.perPerson }}</span>
              </div>
              <svg class="af-chevron" :class="{ rotated: expandedActivity === af.activityId }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>

          <!-- 详情展开 -->
          <div class="af-detail" v-if="expandedActivity === af.activityId">
            <!-- 分摊说明 -->
            <div class="af-note-row" v-if="af.perPersonNote">
              <span class="af-note-label">{{ t.perPersonNote }}</span>
              <span class="af-note-text">{{ af.perPersonNote[currentLang] || af.perPersonNote.zh }}</span>
            </div>

            <!-- 消费明细表格 -->
            <div class="af-breakdown">
              <h4 class="af-detail-title">{{ t.breakdown }}</h4>
              <table class="af-table">
                <thead>
                  <tr>
                    <th>{{ t.category }}</th>
                    <th>{{ t.description }}</th>
                    <th class="num">{{ t.amount }}</th>
                    <th>{{ t.payer }}</th>
                    <th>{{ t.note }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in af.items" :key="idx">
                    <td><span class="af-category-tag">{{ item.category }}</span></td>
                    <td>{{ item.description }}</td>
                    <td class="num">¥{{ formatAmount(item.amount) }}</td>
                    <td>{{ item.payer || '—' }}</td>
                    <td class="af-item-note">{{ item.note || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 支付人汇总 -->
            <div class="af-payers" v-if="af.payers && af.payers.length > 0">
              <h4 class="af-detail-title">{{ t.payers }}</h4>
              <div class="af-payers-list">
                <span v-for="p in af.payers" :key="p.name" class="af-payer-tag">
                  {{ p.name }} · ¥{{ formatAmount(p.amount) }}
                </span>
              </div>
            </div>

            <!-- 赞助 -->
            <div class="af-sponsors" v-if="af.sponsors && af.sponsors.length > 0">
              <h4 class="af-detail-title">{{ t.sponsors }}</h4>
              <div class="af-sponsors-list">
                <div v-for="(s, idx) in af.sponsors" :key="idx" class="af-sponsor-item">
                  <span class="af-sponsor-item">{{ s.item }}</span>
                  <span class="af-sponsor-qty" v-if="s.quantity && s.quantity !== '/'">{{ s.quantity }}</span>
                  <span class="af-sponsor-name">{{ s.sponsor }}</span>
                </div>
              </div>
            </div>

            <!-- 签到说明 -->
            <div class="af-attendance" v-if="af.attendanceNote">
              <h4 class="af-detail-title">{{ t.attendanceNote }}</h4>
              <p class="af-attendance-text">{{ af.attendanceNote[currentLang] || af.attendanceNote.zh }}</p>
            </div>
          </div>
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
  background: linear-gradient(135deg, #7ad1bc 0%, #5ec4ac 100%);
  border-radius: 24px;
  padding: 32px 36px;
  color: #1f5a4f;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  box-shadow: 0 8px 32px rgba(94, 196, 172, 0.3), 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid rgba(31, 90, 79, 0.15);
}
.balance-card::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -30px;
  width: 200px;
  height: 200px;
  background: rgba(31, 90, 79, 0.08);
  border-radius: 50%;
}
.balance-card::after {
  content: '';
  position: absolute;
  bottom: -70px;
  left: -30px;
  width: 160px;
  height: 160px;
  background: rgba(31, 90, 79, 0.05);
  border-radius: 50%;
}
.dark .balance-card {
  background: linear-gradient(135deg, #2d7a6c 0%, #1f5a4f 100%);
  color: #fff;
  box-shadow: 0 8px 32px rgba(45, 122, 108, 0.35), 0 2px 8px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.15);
}
.dark .balance-card::before {
  background: rgba(255,255,255,0.12);
}
.dark .balance-card::after {
  background: rgba(255,255,255,0.08);
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
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -1px;
}
.dark .balance-amount {
  text-shadow: 0 2px 8px rgba(0,0,0,0.15);
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
.stat-income { color: #2f9e44; }
.stat-expense { color: #c92a2a; }
.dark .stat-income { color: #8ce99a; }
.dark .stat-expense { color: #ff8a8a; }
.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(31, 90, 79, 0.2);
}
.dark .stat-divider {
  background: rgba(255,255,255,0.2);
}

/* 活动财务区块 */
.activity-finance-section {
  margin-bottom: 28px;
}
.section-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}
.section-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0;
}
.section-desc {
  font-size: 13px;
  color: var(--c-text-tertiary);
}
.activity-finance-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.activity-finance-card {
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}
.activity-finance-card.expanded {
  border-color: var(--c-accent-light);
}
.af-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  gap: 16px;
}
.af-summary:hover {
  background: var(--c-bg-elevated);
}
.af-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.af-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  flex-shrink: 0;
}
.af-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-primary);
  flex-shrink: 0;
}
.af-venue {
  font-size: 13px;
  color: var(--c-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.af-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
}
.af-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.af-stat-label {
  font-size: 11px;
  color: var(--c-text-tertiary);
}
.af-stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
}
.af-per-person .af-stat-value {
  color: var(--c-accent);
}
.af-chevron {
  color: var(--c-text-tertiary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.af-chevron.rotated {
  transform: rotate(180deg);
}

/* 活动财务详情 */
.af-detail {
  padding: 0 20px 20px;
  border-top: 1px solid var(--c-border);
}
.af-note-row {
  display: flex;
  gap: 10px;
  padding: 14px 0;
  font-size: 13px;
}
.af-note-label {
  font-weight: 600;
  color: var(--c-text-secondary);
  flex-shrink: 0;
}
.af-note-text {
  color: var(--c-text-secondary);
}
.af-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 16px 0 10px;
}
.af-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.af-table th {
  text-align: left;
  padding: 8px 10px;
  background: var(--c-bg-elevated);
  color: var(--c-text-secondary);
  font-weight: 500;
  font-size: 12px;
}
.af-table th.num, .af-table td.num {
  text-align: right;
}
.af-table td {
  padding: 10px;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text-primary);
}
.af-category-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--c-accent-light);
  color: var(--c-accent);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.af-item-note {
  color: var(--c-text-tertiary);
  font-size: 12px;
}
.af-payers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.af-payer-tag {
  padding: 6px 12px;
  background: var(--c-bg-elevated);
  border-radius: 8px;
  font-size: 13px;
  color: var(--c-text-secondary);
}
.af-sponsors-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.af-sponsor-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 8px 12px;
  background: var(--c-bg-elevated);
  border-radius: 8px;
}
.af-sponsor-item .af-sponsor-item {
  flex: 1;
  color: var(--c-text-primary);
  padding: 0;
  background: none;
}
.af-sponsor-qty {
  color: var(--c-text-tertiary);
  font-size: 12px;
  flex-shrink: 0;
}
.af-sponsor-name {
  font-weight: 600;
  color: var(--c-accent);
  flex-shrink: 0;
}
.af-attendance-text {
  font-size: 13px;
  color: var(--c-text-secondary);
  margin: 0;
  line-height: 1.6;
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
  /* 活动财务移动端 */
  .af-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
  }
  .af-main-info {
    flex-wrap: wrap;
    gap: 8px;
  }
  .af-venue {
    width: 100%;
  }
  .af-stats {
    width: 100%;
    justify-content: space-between;
    gap: 12px;
  }
  .af-stat {
    align-items: flex-start;
  }
  .af-detail {
    padding: 0 16px 16px;
  }
  .af-table {
    font-size: 12px;
    display: block;
    overflow-x: auto;
  }
  .af-table th, .af-table td {
    padding: 8px 6px;
  }
}
</style>
