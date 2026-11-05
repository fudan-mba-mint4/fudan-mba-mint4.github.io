<script setup>
import { ref, computed } from 'vue'
import { useFinanceV2 } from '../composables/useFinanceV2.js'
import '../finance-styles.css'
import SkeletonBlock from './SkeletonBlock.vue'

const {
  t, loading, error, loadFinance,
  balance, totalIncome, totalExpense, balanceMap, months, activitiesWithTx, filtered,
  formatAmount, formatDate, catLabel, isImage, voucherTypeLabel, reimbStatusLabel,
  activityTitle, budgetsMap, reimbMap, canViewAllReimb,
  gotoActivity, gotoBudget, gotoReimb, budgetStatusText, formatFullDate,
  filterType, filterCategory, filterMonth, filterActivity,
  period, monthSel, semSel, semesters, periodTx, pIncome, pExpense, pBalance,
  catBreakdown, actBreakdown, catPalette, config,
} = useFinanceV2()

const txDetail = ref(null)
const openTxDetail = (tx) => { txDetail.value = tx }
const closeTxDetail = () => { txDetail.value = null }
/* 汇总 dash 卡片派生 */
const pTxCount = computed(() => periodTx.value.length)
const pIncomeCount = computed(() => periodTx.value.filter(t => t.type === 'income').length)
const pExpenseCount = computed(() => periodTx.value.filter(t => t.type === 'expense').length)
const voucherView = ref(null)
const openVouchers = (tx) => { if (tx.vouchers?.length) voucherView.value = { title: tx.description, vouchers: tx.vouchers } }
const closeVouchers = () => { voucherView.value = null }
const flash = ref('')
const gotoReimbFlash = (id) => { gotoReimb(id); flash.value = id; setTimeout(() => { flash.value = '' }, 2400) }
</script>

<template>
  <div class="finance-page ledger">
    <div v-if="error && !loading" class="fp-state">
      {{ t.loadFailed }} <button class="link-btn" @click="loadFinance">{{ t.retry }}</button>
    </div>
    <template v-else>
      <!-- 余额总览 + 预警（卡面与标签真实，仅金额数值用骨架） -->
      <div class="balance-card fx-fade-in">
        <div class="balance-main">
          <span class="balance-label">{{ t.balance }}</span>
          <span v-if="loading" class="balance-amount"><SkeletonBlock width="150px" height="30px" radius="8px" /></span>
          <span v-else class="balance-amount" :class="{ 'low': config.warnLine && balance < config.warnLine }">¥ {{ formatAmount(balance) }}</span>
          <div v-if="!loading && config.warnLine && balance < config.warnLine" class="warn-bar inline">
            <span class="warn-icon">⚠️</span><span>{{ t.lowBalance.replace('{n}', config.warnLine) }}</span>
          </div>
        </div>
        <div class="balance-stats">
          <div class="stat-col">
            <span class="stat-label">{{ t.income }}</span>
            <SkeletonBlock v-if="loading" width="92px" height="18px" />
            <span v-else class="stat-value stat-income">+¥ {{ formatAmount(totalIncome) }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-col">
            <span class="stat-label">{{ t.expense }}</span>
            <SkeletonBlock v-if="loading" width="92px" height="18px" />
            <span v-else class="stat-value stat-expense">-¥ {{ formatAmount(totalExpense) }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-col">
            <span class="stat-label">{{ t.initialBalance }}</span>
            <SkeletonBlock v-if="loading" width="92px" height="18px" />
            <span v-else class="stat-value stat-balance">¥ {{ formatAmount(config.initialBalance || 69000) }}</span>
          </div>
        </div>
      </div>

      <!-- 过滤：静态结构，数据未到位时禁用 -->
      <div class="filter-bar">
        <span class="details-title">{{ t.details }}</span>
        <div class="filters">
          <select v-model="filterType" class="fp-select" aria-label="type" :disabled="loading">
            <option value="all">{{ t.all }}</option>
            <option value="income">{{ t.incomeOnly }}</option>
            <option value="expense">{{ t.expenseOnly }}</option>
          </select>
          <select v-model="filterCategory" class="fp-select" :disabled="loading">
            <option value="all">{{ t.filterCategory }} · {{ t.all }}</option>
            <option v-for="(label, key) in t.categories" :key="key" :value="key">{{ label }}</option>
          </select>
          <select v-model="filterMonth" class="fp-select" :disabled="loading">
            <option value="all">{{ t.filterMonth }} · {{ t.all }}</option>
            <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
          </select>
          <select v-model="filterActivity" class="fp-select" :disabled="loading">
            <option value="all">{{ t.filterActivity }} · {{ t.all }}</option>
            <option v-for="id in activitiesWithTx" :key="id" :value="id">{{ activityTitle(id) }}</option>
          </select>
        </div>
      </div>

      <!-- 流水列表：加载中 → 真实行壳 + 值级骨架 -->
      <div v-if="loading" class="tx-list" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="tx-item">
          <SkeletonBlock variant="rect" width="38px" height="38px" radius="12px" />
          <div class="tx-info">
            <div class="tx-desc"><SkeletonBlock width="52%" height="15px" /></div>
            <div class="tx-meta">
              <SkeletonBlock width="76px" height="12px" radius="6px" />
              <SkeletonBlock width="84px" height="12px" />
            </div>
          </div>
          <div class="tx-right">
            <SkeletonBlock width="76px" height="15px" />
            <SkeletonBlock width="60px" height="11px" />
          </div>
        </div>
      </div>
      <div class="tx-list" v-else-if="filtered.length > 0">
        <div v-for="tx in filtered" :key="tx.id" class="tx-item clickable" :class="{ 'hl-flash': flash === tx.reimbursementId }" @click="openTxDetail(tx)">
          <div class="tx-icon" :class="tx.type">
            <svg v-if="tx.type === 'income'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </div>
          <div class="tx-info">
            <span class="tx-desc">{{ tx.description }}</span>
            <div class="tx-meta">
              <span class="tx-category">{{ catLabel(tx.category) }}</span>
              <span class="tx-date">{{ formatDate(tx.date) }}</span>
              <span v-if="tx.voucherNo" class="tx-voucherno">{{ t.voucherNo }}: {{ tx.voucherNo }}</span>
              <span v-if="tx.activityId" class="tx-activity"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(tx.activityId)">{{ t.activity }}: {{ activityTitle(tx.activityId) }}</a></span>
              <span v-if="tx.handler" class="tx-handler">{{ t.payer }}: {{ tx.handler }}</span>
              <span v-if="tx.checker" class="tx-handler">{{ t.checker }}: {{ tx.checker }}</span>
              <button v-if="tx.vouchers && tx.vouchers.length" class="tx-voucher" @click.stop="openVouchers(tx)">📎 {{ t.voucher }} ({{ tx.vouchers.length }})</button>
            </div>
          </div>
          <div class="tx-right">
            <span class="tx-amount" :class="tx.type">{{ tx.type === 'income' ? '+' : '-' }}¥ {{ formatAmount(tx.amount) }}</span>
            <span class="tx-balance">≈ {{ t.balanceCol }} ¥{{ formatAmount(balanceMap[tx.id]) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state"><p>{{ t.noRecords }}</p></div>

      <!-- ===== 收支汇总：标题与统计标签静态，仅数值骨架 ===== -->
      <div class="sum-section ledger-sum">
        <div class="sum-head">
          <h3 class="section-title">{{ t.summaryTitle }}</h3>
          <div class="period-bar">
            <select v-model="period" class="fp-select" :disabled="loading">
              <option value="all">{{ t.periodAll }}</option>
              <option value="month">{{ t.periodMonth }}</option>
              <option value="semester">{{ t.periodSemester }}</option>
            </select>
            <select v-if="period === 'month'" v-model="monthSel" class="fp-select" :disabled="loading">
              <option value="all">{{ t.periodAll }}</option>
              <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
            </select>
            <select v-if="period === 'semester'" v-model="semSel" class="fp-select" :disabled="loading">
              <option v-for="s in semesters" :key="s.key" :value="s.key">{{ s.label }}</option>
            </select>
          </div>
        </div>
        <div class="dash-cards">
          <div class="dash-card">
            <span class="dash-label">{{ t.income }}</span>
            <SkeletonBlock v-if="loading" width="112px" height="22px" />
            <span v-else class="dash-value income">+¥ {{ formatAmount(pIncome) }}</span>
            <SkeletonBlock v-if="loading" width="80px" height="11px" />
            <span v-else class="dash-sub">{{ t.incomeTx }} {{ pIncomeCount }}</span>
          </div>
          <div class="dash-card">
            <span class="dash-label">{{ t.expense }}</span>
            <SkeletonBlock v-if="loading" width="112px" height="22px" />
            <span v-else class="dash-value expense">-¥ {{ formatAmount(pExpense) }}</span>
            <SkeletonBlock v-if="loading" width="80px" height="11px" />
            <span v-else class="dash-sub">{{ t.expenseTx }} {{ pExpenseCount }}</span>
          </div>
          <div class="dash-card" :class="{ 'warn-card': !loading && config.warnLine && pBalance < config.warnLine }">
            <span class="dash-label">{{ t.balance }}</span>
            <SkeletonBlock v-if="loading" width="112px" height="22px" />
            <span v-else class="dash-value balance">¥ {{ formatAmount(pBalance) }}</span>
            <template v-if="loading"><SkeletonBlock width="80px" height="11px" /></template>
            <span v-else-if="config.warnLine && pBalance < config.warnLine" class="dash-tag warn">⚠️ {{ t.lowBalance.replace('{n}', config.warnLine) }}</span>
            <span v-else class="dash-sub">{{ t.txCount }} {{ pTxCount }}</span>
          </div>
        </div>
        <div class="sum-section">
          <h4 class="group-title">{{ t.expenseBy }}</h4>
          <div v-if="loading" class="cat-bars" aria-hidden="true">
            <div v-for="n in 4" :key="n" class="cat-bar">
              <SkeletonBlock width="64px" height="12px" />
              <div class="cat-track"><SkeletonBlock variant="rect" width="100%" height="12px" radius="6px" /></div>
              <SkeletonBlock width="56px" height="12px" />
              <SkeletonBlock width="36px" height="12px" />
            </div>
          </div>
          <div v-else-if="catBreakdown.length" class="cat-bars">
            <div v-for="(c, i) in catBreakdown" :key="c.cat" class="cat-bar">
              <span class="cat-name">{{ catLabel(c.cat) }}</span>
              <div class="cat-track"><div class="cat-fill" :style="{ width: (pExpense ? c.amt / pExpense * 100 : 0) + '%', background: catPalette[i % catPalette.length] }"></div></div>
              <span class="cat-amt">¥{{ formatAmount(c.amt) }}</span>
              <span class="cat-pct">{{ pExpense ? (c.amt / pExpense * 100).toFixed(1) : 0 }}%</span>
            </div>
          </div>
          <div v-else class="empty-state"><p>{{ t.noExpense }}</p></div>
        </div>
        <div class="sum-section">
          <h4 class="group-title">{{ t.byActivity }}</h4>
          <div v-if="loading" class="act-bars" aria-hidden="true">
            <div v-for="n in 3" :key="n" class="act-bar">
              <SkeletonBlock width="42%" height="14px" />
              <SkeletonBlock width="56px" height="12px" />
              <SkeletonBlock width="72px" height="14px" />
            </div>
          </div>
          <div v-else-if="actBreakdown.length" class="act-bars">
            <div v-for="a in actBreakdown" :key="a.id" class="act-bar">
              <span class="act-name">{{ activityTitle(a.id) }}</span>
              <span class="act-count">{{ a.count }} {{ t.expenseOnly }}</span>
              <span class="act-amt">¥{{ formatAmount(a.amt) }}</span>
            </div>
          </div>
          <div v-else class="empty-state"><p>{{ t.noExpense }}</p></div>
        </div>
      </div>
    </template>

    <!-- 流水详情弹层 -->
    <div v-if="txDetail" class="modal-mask" @click.self="closeTxDetail">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">{{ txDetail.description }}</span>
          <button class="modal-close" @click="closeTxDetail">×</button>
        </div>
        <div class="modal-body">
          <div class="td-grid">
            <div class="td-cell"><span class="td-k">{{ t.category }}</span><span class="td-v">{{ catLabel(txDetail.category) }}</span></div>
            <div class="td-cell"><span class="td-k">{{ t.date }}</span><span class="td-v">{{ formatFullDate(txDetail.date) }}</span></div>
            <div class="td-cell"><span class="td-k">{{ t.voucherNo }}</span><span class="td-v">{{ txDetail.voucherNo || '—' }}</span></div>
            <div class="td-cell"><span class="td-k">{{ t.amount }}</span><span class="td-v" :class="txDetail.type">¥{{ formatAmount(txDetail.amount) }}</span></div>
            <div class="td-cell"><span class="td-k">{{ t.balanceCol }}</span><span class="td-v">¥{{ formatAmount(balanceMap[txDetail.id]) }}</span></div>
            <div class="td-cell td-cell-empty"></div>
            <div class="td-cell"><span class="td-k">{{ t.payer }}</span><span class="td-v">{{ txDetail.handler || '—' }}</span></div>
            <div class="td-cell"><span class="td-k">{{ t.checker }}</span><span class="td-v">{{ txDetail.checker || '—' }}</span></div>
            <div class="td-cell td-cell-empty"></div>
          </div>
          <div v-if="txDetail.items && txDetail.items.length" class="td-items-box">
            <div class="td-rel-k">{{ t.itemDetail }}</div>
            <table class="mini-table">
              <tbody>
                <tr v-for="(it, i) in txDetail.items" :key="i"><td>{{ catLabel(it.category) }}</td><td v-if="it.description" class="it-desc">{{ it.description }}</td><td class="num">¥{{ formatAmount(it.amount) }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="td-rel" v-if="txDetail.proposalId && budgetsMap[txDetail.proposalId]">
            <div class="td-rel-k">{{ t.relatedBudget }}</div>
            <div class="td-rel-card" @click="gotoBudget(txDetail.proposalId)">
              <div class="td-rel-title">{{ budgetsMap[txDetail.proposalId].title }}</div>
              <div class="td-rel-meta">{{ budgetStatusText(budgetsMap[txDetail.proposalId]) }} · {{ t.budgetUpper }} ¥{{ formatAmount(budgetsMap[txDetail.proposalId].amount) }}</div>
              <div class="td-items" v-if="budgetsMap[txDetail.proposalId].detailItems && budgetsMap[txDetail.proposalId].detailItems.length">
                <table class="mini-table">
                  <tbody>
                    <tr v-for="(it, i) in budgetsMap[txDetail.proposalId].detailItems" :key="i"><td>{{ it.item }}</td><td class="num">¥{{ formatAmount(it.amount) }}</td></tr>
                  </tbody>
                </table>
              </div>
              <span class="td-rel-go">{{ t.viewDetail }} →</span>
            </div>
          </div>
          <div class="td-rel" v-if="txDetail.reimbursementId && reimbMap[txDetail.reimbursementId]">
            <div class="td-rel-k">{{ t.relatedReimb }}</div>
            <div class="td-rel-card" @click="gotoReimbFlash(txDetail.reimbursementId)">
              <div class="td-rel-title">{{ reimbMap[txDetail.reimbursementId].description || txDetail.description }}</div>
              <div class="td-rel-meta">{{ reimbStatusLabel(reimbMap[txDetail.reimbursementId].status) }}<template v-if="canViewAllReimb"> · {{ t.payer }}: {{ reimbMap[txDetail.reimbursementId].applicant }}</template></div>
              <span class="td-rel-go">{{ t.openVoucher }} →</span>
            </div>
          </div>
          <p v-if="!txDetail.activityId && !txDetail.proposalId && !txDetail.reimbursementId" class="td-none">{{ t.noRelation }}</p>
        </div>
      </div>
    </div>

    <!-- 凭证弹层 -->
    <div v-if="voucherView" class="modal-mask" @click.self="closeVouchers">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">{{ voucherView.title }}</span>
          <button class="modal-close" @click="closeVouchers">×</button>
        </div>
        <div class="modal-body">
          <div class="voucher-grid big">
            <a v-for="(v, i) in voucherView.vouchers" :key="i" :href="v.url" target="_blank" rel="noopener" class="v-thumb">
              <img v-if="isImage(v.url)" :src="v.url" :alt="v.name" loading="lazy" />
              <span v-else class="v-file-card">📄 {{ v.name || v.url }}</span>
              <em>{{ voucherTypeLabel(v.type) }}</em>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
