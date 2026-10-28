<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vitepress'
import { useLang } from '../composables/useLang.js'
import { useAuth } from '../composables/useAuth.js'
import { sortByDateDesc, formatShortDate } from '../utils/dateUtils.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'
import { useData } from '../composables/useData.js'
import { markRead } from '../composables/useUnread.js'

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    tabTx: '收支明细', tabBudget: '预算公示', tabReimb: '我的报销', tabSummary: '汇总',
    balance: '当前余额', income: '总收入', expense: '总支出',
    all: '全部', incomeOnly: '收入', expenseOnly: '支出',
    details: '收支明细', noRecords: '暂无收支记录',
    category: '类别', description: '项目', amount: '金额', payer: '经手人', checker: '复核人',
    activity: '关联活动', balanceCol: '余额', voucher: '凭证', noVoucher: '无凭证',
    filterCategory: '性质大类', filterMonth: '月份', filterActivity: '活动',
    running: '累计余额',
    categories: {
      dining: '餐饮费', marketing: '宣传物料', transport: '交通费', venue: '场地设备',
      speaker: '讲师嘉宾', lodging: '住宿', ticket: '门票', prize: '奖品纪念品',
      insurance: '保险', supplies: '物资文具', other: '其他',
      tuition: '班费缴纳', sponsor: '赞助/奖金', interest: '利息收入',
    },
    // 预算公示
    budgetTitle: '预算公示', budgetDesc: '支出前公示 ≥3 日，实名异议，反对达 1/3 不可动用班费',
    inProgress: '公示中', pendingSettle: '待结算', history: '历史公示',
    budgetUpper: '预算上限', proposer: '申请方', items: '预算明细', exposeDaysLeft: '剩余 {n} 天',
    exposeEnded: '公示已结束，待财务结算', opposeCount: '反对 {n} 人', opposeRatio: '占比 {p}%',
    vetoLine: '否决线 1/3', vetoed: '已达否决线', myOpposed: '我已提交反对', oppose: '提交反对',
    opposeReason: '反对理由（选填）', submitOppose: '确认提交', opposeDone: '反对已提交',
    budgetPassed: '已通过', budgetRejected: '已否决', budgetCancelled: '已取消', budgetSpent: '已执行',
    myObjectionHint: '实名反对：请如实填写理由',
    // 报销
    reimbTitle: '报销', reimbDesc: '线上提交凭证 → 财务审批 → 线下打款 → 入账公示',
    newReimb: '新建报销', submit: '提交', submitting: '提交中…',
    reimbFormTitle: '新建报销单', reimbActivity: '关联活动', reimbBudget: '关联预算（选填）',
    reimbDate: '消费日期', reimbAmount: '报销金额（元）', reimbCategory: '支出大类', reimbDesc: '事项描述',
    reimbVouchers: '报销凭证', requiredHint: '金额 ≥ {n} 元必传：{list}', requiredHintSmall: '金额 < {n} 元必传：{list}',
    uploadVoucher: '上传', uploaded: '已上传', remove: '移除',
    vInvoice: '发票', vPayment: '付款凭证', vReceipt: '收据/小票', vOther: '其他凭证',
    statusSubmitted: '待审批', statusApproved: '已通过', statusPaid: '已打款', statusRejected: '已驳回',
    myReimb: '我的报销单', allReimb: '全部报销单（财务）', emptyReimb: '暂无报销记录',
    applyDate: '提交时间', auditNote: '审批意见', noLoginReimb: '请先登录后提交报销',
    successSubmitted: '报销已提交，等待财务审批',
    // 汇总
    summaryTitle: '收支汇总', period: '统计周期', periodAll: '全部', periodMonth: '按月', periodSemester: '按学期',
    semFall: '秋季学期', semSpring: '春季学期', byCategory: '支出按性质大类', byActivity: '支出按活动',
    expenseBy: '支出构成', noExpense: '暂无支出',
    // 通用
    loading: '加载中…', loadFailed: '加载失败，请稍后重试', retry: '重试',
    loginFirst: '请先登录', close: '关闭', viewerOnlyHint: '班主任与传承人仅可查看，不能参与投票、申报、报销等活动',
    detail: '详情', viewDetail: '查看详情', relatedActivity: '关联活动', relatedBudget: '关联预算公示',
    relatedReimb: '关联报销单', noRelation: '未关联活动/预算（如班费缴纳等非活动收支）', openVoucher: '查看凭证', jumpTo: '前往',
    // v2 投票
    voteFor: '赞成', voteAgainst: '反对', voteForDone: '已投赞成', voteAgainstDone: '已投反对',
    voteConfirm: '投票一经提交不可撤回、不可改投，确认提交吗？', myVote: '我的投票',
    uncommitted: '未表态 {n}', vetoLineV2: '反对达 {n} 票即否决',
    forCount: '赞成 {n}', againstCount: '反对 {n}',
    reasonsTitle: '反对留言（匿名公开）', noReasons: '暂无反对留言',
    emergencyTag: '紧急·事后补公示', voteReasonHint: '反对理由（可选，将匿名公开，不可撤回）',
    // v2 报销
    statusNeedRevision: '待补正', needRevise: '修改重新提交',
    endorsementTitle: '签字背书（大额无发票时必填）', endorserName: '背书班委姓名',
    endorserHint: '≥¥{n} 且无发票时：付款凭证 + 盖章收据/小票 + 经办人与 1 名班委签字背书',
    // v2 工作台
    tabWorkbench: '财务工作台', workbenchDesc: '按登录角色显示待办（会计/出纳视图不同）',
    accountantView: '会计工作台', cashierView: '出纳工作台',
    pendingAuditQ: '待审核 {n}', pendingPayQ: '待付款 {n}',
    approve: '通过', revision: '退回补正', reject: '驳回',
    confirmPay: '确认已打款', payNeed: '请先在支付宝小荷包完成实际打款，再点击确认',
    reconcile: '对账登记', reconcileTitle: '小荷包对账', actualBalance: '小荷包实际余额',
    ledgerBalance: '台账余额', reconcileDiff: '差额', reconcileMatch: '账实相符',
    reconcileNote: '备注', reconcileLinked: '关联', reconcileBy: '登记人',
    // v2 汇总
    warnLine: '余额预警', lowBalance: '余额不足 ¥{n}，建议启动补充班费表决',
    // v2 账页
    voucherNo: '凭证编号', initialBalance: '期初班费',
  },
  en: {
    tabTx: 'Transactions', tabBudget: 'Budgets', tabReimb: 'Reimbursement', tabSummary: 'Summary',
    balance: 'Balance', income: 'Total Income', expense: 'Total Expense',
    all: 'All', incomeOnly: 'Income', expenseOnly: 'Expense',
    details: 'History', noRecords: 'No transactions yet',
    category: 'Category', description: 'Item', amount: 'Amount', payer: 'Handler', checker: 'Reviewer',
    activity: 'Activity', balanceCol: 'Balance', voucher: 'Vouchers', noVoucher: 'None',
    filterCategory: 'Category', filterMonth: 'Month', filterActivity: 'Activity',
    running: 'Running balance',
    categories: {
      dining: 'Dining', marketing: 'Marketing', transport: 'Transport', venue: 'Venue & Gear',
      speaker: 'Speakers', lodging: 'Lodging', ticket: 'Tickets', prize: 'Prizes',
      insurance: 'Insurance', supplies: 'Supplies', other: 'Other',
      tuition: 'Class Dues', sponsor: 'Sponsorship', interest: 'Interest',
    },
    budgetTitle: 'Budget Disclosure', budgetDesc: 'Disclosed ≥3 days before spending; real-name objections; ≥1/3 veto',
    inProgress: 'Open', pendingSettle: 'To settle', history: 'History',
    budgetUpper: 'Budget cap', proposer: 'Proposer', items: 'Breakdown', exposeDaysLeft: '{n} days left',
    exposeEnded: 'Disclosure ended, pending settlement', opposeCount: '{n} objections', opposeRatio: '{p}%',
    vetoLine: 'Veto line 1/3', vetoed: 'Veto reached', myOpposed: 'I objected', oppose: 'Object',
    opposeReason: 'Reason (optional)', submitOppose: 'Confirm', opposeDone: 'Objection submitted',
    budgetPassed: 'Approved', budgetRejected: 'Vetoed', budgetCancelled: 'Cancelled', budgetSpent: 'Executed',
    myObjectionHint: 'Real-name objection: be honest about your reason',
    reimbTitle: 'Reimbursement', reimbDesc: 'Submit vouchers online → finance review → offline payment → posted',
    newReimb: 'New', submit: 'Submit', submitting: 'Submitting…',
    reimbFormTitle: 'New Reimbursement', reimbActivity: 'Activity', reimbBudget: 'Budget (optional)',
    reimbDate: 'Expense date', reimbAmount: 'Amount (¥)', reimbCategory: 'Category', reimbDesc: 'Description',
    reimbVouchers: 'Vouchers', requiredHint: '≥¥{n} requires: {list}', requiredHintSmall: '<¥{n} requires: {list}',
    uploadVoucher: 'Upload', uploaded: 'Uploaded', remove: 'Remove',
    vInvoice: 'Invoice', vPayment: 'Payment proof', vReceipt: 'Receipt', vOther: 'Other',
    statusSubmitted: 'Pending', statusApproved: 'Approved', statusPaid: 'Paid', statusRejected: 'Rejected',
    myReimb: 'My claims', allReimb: 'All claims (finance)', emptyReimb: 'No claims yet',
    applyDate: 'Submitted', auditNote: 'Review note', noLoginReimb: 'Please log in to file a claim',
    successSubmitted: 'Claim submitted, pending finance review',
    summaryTitle: 'Summary', period: 'Period', periodAll: 'All', periodMonth: 'Monthly', periodSemester: 'Semester',
    semFall: 'Fall semester', semSpring: 'Spring semester', byCategory: 'By category', byActivity: 'By activity',
    expenseBy: 'Expense breakdown', noExpense: 'No expenses yet',
    loading: 'Loading…', loadFailed: 'Failed to load. Try again.', retry: 'Retry',
    loginFirst: 'Please log in first', close: 'Close', viewerOnlyHint: 'Head teacher & mentors can view only; voting, claims and reimbursement are for students only',
    detail: 'Details', viewDetail: 'View details', relatedActivity: 'Related activity', relatedBudget: 'Related budget',
    relatedReimb: 'Related claim', noRelation: 'Not linked to any activity/budget', openVoucher: 'View vouchers', jumpTo: 'Open',
    voteFor: 'For', voteAgainst: 'Against', voteForDone: 'Voted for', voteAgainstDone: 'Voted against',
    voteConfirm: 'Votes are final and cannot be changed. Confirm?', myVote: 'My vote',
    uncommitted: '{n} not voted', vetoLineV2: 'Veto at {n} against votes',
    forCount: '{n} for', againstCount: '{n} against',
    reasonsTitle: 'Against comments (anonymous)', noReasons: 'No comments yet',
    emergencyTag: 'Emergency · post-disclosure', voteReasonHint: 'Reason (optional, shown anonymously, final)',
    statusNeedRevision: 'Revision needed', needRevise: 'Edit & resubmit',
    endorsementTitle: 'Endorsement (required when ≥¥{n} without invoice)', endorserName: 'Endorsing committee name',
    endorserHint: '≥¥{n} without invoice: payment proof + stamped receipt + endorser (applicant + 1 committee)',
    tabWorkbench: 'Finance Workbench', workbenchDesc: 'To-dos by role (accountant / cashier views differ)',
    accountantView: 'Accountant desk', cashierView: 'Cashier desk',
    pendingAuditQ: '{n} to review', pendingPayQ: '{n} to pay',
    approve: 'Approve', revision: 'Request revision', reject: 'Reject',
    confirmPay: 'Confirm paid', payNeed: 'Complete the actual payment in Alipay pocket first, then confirm',
    reconcile: 'Reconcile', reconcileTitle: 'Pocket reconciliation', actualBalance: 'Actual pocket balance',
    ledgerBalance: 'Ledger balance', reconcileDiff: 'Diff', reconcileMatch: 'Matched',
    reconcileNote: 'Note', reconcileLinked: 'Linked', reconcileBy: 'By',
    warnLine: 'Balance warning', lowBalance: 'Balance below ¥{n}, consider collecting extra dues',
    voucherNo: 'Voucher #', initialBalance: 'Opening balance',
  },
  th: {
    tabTx: 'รายการ', tabBudget: 'งบประมาณ', tabReimb: 'เบิกจ่าย', tabSummary: 'สรุป',
    balance: 'ยอดคงเหลือ', income: 'รายรับรวม', expense: 'รายจ่ายรวม',
    all: 'ทั้งหมด', incomeOnly: 'รายรับ', expenseOnly: 'รายจ่าย',
    details: 'ประวัติ', noRecords: 'ยังไม่มีรายการ',
    category: 'หมวดหมู่', description: 'รายการ', amount: 'จำนวน', payer: 'ผู้ดำเนินการ', checker: 'ผู้ตรวจ',
    activity: 'กิจกรรม', balanceCol: 'ยอดคงเหลือ', voucher: 'หลักฐาน', noVoucher: 'ไม่มี',
    filterCategory: 'หมวดหมู่', filterMonth: 'เดือน', filterActivity: 'กิจกรรม',
    running: 'ยอดสะสม',
    categories: {
      dining: 'ค่าอาหาร', marketing: 'ประชาสัมพันธ์', transport: 'เดินทาง', venue: 'สถานที่/อุปกรณ์',
      speaker: 'วิทยากร', lodging: 'ที่พัก', ticket: 'ตั๋ว', prize: 'รางวัล/ของที่ระลึก',
      insurance: 'ประกัน', supplies: 'วัสดุ/เครื่องเขียน', other: 'อื่นๆ',
      tuition: 'ค่าชั้นเรียน', sponsor: 'เงินสนับสนุน', interest: 'ดอกเบี้ย',
    },
    budgetTitle: 'การเปิดเผยงบประมาณ', budgetDesc: 'เปิดเผย ≥3 วันก่อนใช้จ่าย คัดค้านแบบระบุชื่อ ถึง 1/3 ห้ามใช้',
    inProgress: 'กำลังเปิดเผย', pendingSettle: 'รอสรุป', history: 'ประวัติ',
    budgetUpper: 'วงเงิน', proposer: 'ผู้ยื่น', items: 'รายละเอียด', exposeDaysLeft: 'เหลือ {n} วัน',
    exposeEnded: 'สิ้นสุดการเปิดเผย รอสรุป', opposeCount: 'คัดค้าน {n} คน', opposeRatio: '{p}%',
    vetoLine: 'เส้นคัดค้าน 1/3', vetoed: 'ถึงเส้นคัดค้าน', myOpposed: 'คัดค้านแล้ว', oppose: 'คัดค้าน',
    opposeReason: 'เหตุผล (ไม่บังคับ)', submitOppose: 'ยืนยัน', opposeDone: 'ส่งการคัดค้านแล้ว',
    budgetPassed: 'ผ่าน', budgetRejected: 'คัดค้าน', budgetCancelled: 'ยกเลิก', budgetSpent: 'ดำเนินการแล้ว',
    myObjectionHint: 'คัดค้านแบบระบุชื่อ: กรุณากรอกเหตุผลตามจริง',
    reimbTitle: 'เบิกจ่าย', reimbDesc: 'ส่งหลักฐานออนไลน์ → อนุมัติ → โอนเงิน → ลงบัญชี',
    newReimb: 'ใหม่', submit: 'ส่ง', submitting: 'กำลังส่ง…',
    reimbFormTitle: 'แบบฟอร์มเบิกจ่าย', reimbActivity: 'กิจกรรม', reimbBudget: 'งบประมาณ (ไม่บังคับ)',
    reimbDate: 'วันที่ใช้จ่าย', reimbAmount: 'จำนวน (บาท/หยวน)', reimbCategory: 'หมวดหมู่', reimbDesc: 'รายละเอียด',
    reimbVouchers: 'หลักฐาน', requiredHint: '≥{n} บังคับ: {list}', requiredHintSmall: '<{n} บังคับ: {list}',
    uploadVoucher: 'อัปโหลด', uploaded: 'อัปโหลดแล้ว', remove: 'ลบ',
    vInvoice: 'ใบกำกับ', vPayment: 'หลักฐานการชำระ', vReceipt: 'ใบเสร็จ', vOther: 'อื่นๆ',
    statusSubmitted: 'รออนุมัติ', statusApproved: 'อนุมัติ', statusPaid: 'โอนแล้ว', statusRejected: 'ไม่อนุมัติ',
    myReimb: 'รายการของฉัน', allReimb: 'ทั้งหมด (การเงิน)', emptyReimb: 'ยังไม่มีรายการ',
    applyDate: 'ยื่นเมื่อ', auditNote: 'หมายเหตุอนุมัติ', noLoginReimb: 'กรุณาเข้าสู่ระบบก่อนเบิกจ่าย',
    successSubmitted: 'ส่งคำขอแล้ว รอการอนุมัติ',
    summaryTitle: 'สรุป', period: 'ช่วงเวลา', periodAll: 'ทั้งหมด', periodMonth: 'รายเดือน', periodSemester: 'ภาคเรียน',
    semFall: 'ภาคเรียนแรก', semSpring: 'ภาคเรียนที่สอง', byCategory: 'รายจ่ายตามหมวด', byActivity: 'รายจ่ายตามกิจกรรม',
    expenseBy: 'สัดส่วนรายจ่าย', noExpense: 'ยังไม่มีรายจ่าย',
    loading: 'กำลังโหลด…', loadFailed: 'โหลดไม่สำเร็จ กรุณาลองใหม่', retry: 'ลองใหม่',
    loginFirst: 'กรุณาเข้าสู่ระบบก่อน', close: 'ปิด', viewerOnlyHint: 'อาจารย์ประจำชั้นและพี่เลี้ยงดูได้อย่างเดียว ไม่สามารถโหวต/เบิกจ่าย/ยื่นเรื่องได้',
    detail: 'รายละเอียด', viewDetail: 'ดูรายละเอียด', relatedActivity: 'กิจกรรมที่เกี่ยวข้อง', relatedBudget: 'งบประมาณที่เกี่ยวข้อง',
    relatedReimb: 'การเบิกจ่ายที่เกี่ยวข้อง', noRelation: 'ไม่ผูกกับกิจกรรม/งบประมาณ', openVoucher: 'ดูหลักฐาน', jumpTo: 'ไป',
    voteFor: 'เห็นด้วย', voteAgainst: 'คัดค้าน', voteForDone: 'โหวตเห็นด้วยแล้ว', voteAgainstDone: 'โหวตคัดค้านแล้ว',
    voteConfirm: 'การโหวตส่งแล้วไม่สามารถแก้ไข ยืนยันหรือไม่', myVote: 'การโหวตของฉัน',
    uncommitted: 'ยังไม่โหวต {n}', vetoLineV2: 'คัดค้านถึง {n} เสียง ห้ามใช้',
    forCount: 'เห็นด้วย {n}', againstCount: 'คัดค้าน {n}',
    reasonsTitle: 'ความคิดเห็นคัดค้าน (ไม่ระบุชื่อ)', noReasons: 'ยังไม่มีความคิดเห็น',
    emergencyTag: 'ฉุกเฉิน · เปิดเผยหลังใช้จ่าย', voteReasonHint: 'เหตุผล (ไม่บังคับ เปิดเผยไม่ระบุชื่อ แก้ไขไม่ได้)',
    statusNeedRevision: 'รอแก้ไข', needRevise: 'แก้ไขแล้วส่งใหม่',
    endorsementTitle: 'การรับรอง (บังคับเมื่อ ≥{n} ไม่มีใบกำกับ)', endorserName: 'ชื่อกรรมการผู้รับรอง',
    endorserHint: '≥{n} ไม่มีใบกำกับ: หลักฐานชำระ + ใบเสร็จ + ผู้ยื่นกับกรรมการ 1 คนรับรอง',
    tabWorkbench: 'แผงงานการเงิน', workbenchDesc: 'งานตามบทบาท (มุมมองบัญชี/แคชเชียร์ต่างกัน)',
    accountantView: 'งานบัญชี', cashierView: 'งานแคชเชียร์',
    pendingAuditQ: 'รออนุมัติ {n}', pendingPayQ: 'รอโอน {n}',
    approve: 'อนุมัติ', revision: 'ขอแก้ไข', reject: 'ไม่อนุมัติ',
    confirmPay: 'ยืนยันโอนแล้ว', payNeed: 'โอนเงินใน Alipay pocket จริงก่อน แล้วกดยืนยัน',
    reconcile: 'ลงบัญชีเทียบ', reconcileTitle: 'เทียบยอด pocket', actualBalance: 'ยอด pocket จริง',
    ledgerBalance: 'ยอดบัญชี', reconcileDiff: 'ส่วนต่าง', reconcileMatch: 'ตรงกัน',
    reconcileNote: 'หมายเหตุ', reconcileLinked: 'ผูก', reconcileBy: 'โดย',
    warnLine: 'เตือนยอดคงเหลือ', lowBalance: 'ยอดต่ำกว่า ¥{n} แนะนำเก็บเงินเพิ่ม',
    voucherNo: 'เลขที่หลักฐาน', initialBalance: 'ยอดเปิดบัญชี',
  },
}
const { lang: currentLang, t } = useLang(i18n)
const { currentUser, authToken, isAuthenticated, isViewerOnly } = useAuth()

/* ========== 数据 ========== */
const activeTab = ref('tx')
const financeData = ref(null)
const loading = ref(true)
const error = ref(false)
const { data: activitiesData } = useData('/data/activities.json', { dbUrl: '/api/activities-db' })

const transactions = computed(() => financeData.value?.transactions || [])
const budgets = computed(() => financeData.value?.budgets || [])
const reimbursements = computed(() => financeData.value?.reimbursements || [])
const reconcilations = computed(() => financeData.value?.reconcilations || [])
const canViewAllReimb = computed(() => !!financeData.value?.canViewAllReimb)
const workbench = computed(() => financeData.value?.workbench || {})
const myVotesMap = computed(() => financeData.value?.myVotes || {})
const myVote = (id) => myVotesMap.value[id] || ''
const config = computed(() => financeData.value?.config || { classSize: 87, largeAmount: 500, largeVouchers: ['invoice', 'payment'], smallVouchers: ['payment', 'receipt'] })
const nowTs = ref(Date.now())

watch(transactions, (list) => {
  markRead('finance', list.map(t => String(t.id)))
})

const activitiesMap = computed(() => {
  const map = {}
  ;(activitiesData.value?.activities || []).forEach(a => { map[a.id] = a })
  return map
})
const activityTitle = (id) => {
  if (!id) return ''
  const act = activitiesMap.value[id]
  return act ? (act.title?.[currentLang.value] || act.title?.zh || act.title || id) : id
}

async function loadFinance() {
  loading.value = true
  error.value = false
  try {
    const res = await fetchWithRetry('/api/finance-v2', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    financeData.value = await res.json()
    nowTs.value = Date.now()
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}
onMounted(loadFinance)

/* ========== 收支明细 ========== */
const filterType = ref('all')
const filterCategory = ref('all')
const filterMonth = ref('all')
const filterActivity = ref('all')

const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const totalExpense = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const balance = computed(() => totalIncome.value - totalExpense.value)

// 每笔的"当时余额"：按日期升序累计
const balanceMap = computed(() => {
  const asc = [...transactions.value].sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1))
  const map = {}
  let run = 0
  asc.forEach(t => { run += (t.type === 'income' ? t.amount : -t.amount); map[t.id] = run })
  return map
})

const months = computed(() => {
  const set = new Set(transactions.value.map(t => (t.date || '').slice(0, 7)))
  return [...set].sort().reverse()
})
const activitiesWithTx = computed(() => {
  const set = new Set(transactions.value.map(t => t.activityId).filter(Boolean))
  return [...set]
})

const filtered = computed(() => {
  let list = [...transactions.value]
  if (filterType.value !== 'all') list = list.filter(t => t.type === filterType.value)
  if (filterCategory.value !== 'all') list = list.filter(t => t.category === filterCategory.value)
  if (filterMonth.value !== 'all') list = list.filter(t => (t.date || '').startsWith(filterMonth.value))
  if (filterActivity.value !== 'all') list = list.filter(t => t.activityId === filterActivity.value)
  return sortByDateDesc(list, 'date')
})

const formatAmount = (n) => (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const formatDate = (d) => formatShortDate(d, currentLang.value)
const catLabel = (c) => t.value.categories[c] || c || '—'
const voucherView = ref(null) // { title, vouchers }
const openVouchers = (tx) => { if (tx.vouchers?.length) voucherView.value = { title: tx.description, vouchers: tx.vouchers } }
const closeVouchers = () => { voucherView.value = null }

/* ========== 流水详情（有迹可循：关联活动/预算/报销 + 明细/凭证/附件） ========== */
const router = useRouter()
const budgetsMap = computed(() => { const m = {}; budgets.value.forEach(b => { m[b.id] = b }); return m })
const reimbMap = computed(() => { const m = {}; reimbursements.value.forEach(r => { m[r.id] = r }); return m })
const txDetail = ref(null)
const openTxDetail = (tx) => { txDetail.value = tx }
const closeTxDetail = () => { txDetail.value = null }
const hlBudgetId = ref('')
const hlReimbId = ref('')
const flashHl = (set, id) => { set.value = id; setTimeout(() => { set.value = '' }, 2400) }
const gotoActivity = (id) => { if (id) router.push(`/activities/?focus=${encodeURIComponent(id)}`) }
const gotoBudget = (id) => { closeTxDetail(); activeTab.value = 'budget'; flashHl(hlBudgetId, id) }
const gotoReimb = (id) => { closeTxDetail(); activeTab.value = 'reimb'; flashHl(hlReimbId, id) }
const budgetStatusText = (b) => b.status === 'passed' ? t.value.budgetPassed : b.status === 'rejected' ? t.value.budgetRejected : b.status === 'cancelled' ? t.value.budgetCancelled : t.value.budgetSpent
const isImage = (u) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u || '')

/* ========== 预算公示 ========== */
const openBudgets = computed(() => {
  const now = Date.now()
  return budgets.value.filter(b => b.status === 'open' && now >= new Date(b.exposeStart).getTime() && now <= new Date(b.exposeEnd).getTime())
})
const pendingSettleBudgets = computed(() => {
  const now = Date.now()
  return budgets.value.filter(b => b.status === 'open' && now > new Date(b.exposeEnd).getTime())
})
const doneBudgets = computed(() => budgets.value.filter(b => !['open'].includes(b.status)))
const daysLeft = (b) => Math.max(0, Math.ceil((new Date(b.exposeEnd).getTime() - Date.now()) / 86400000))
const exposeStatus = (b) => {
  const now = Date.now()
  if (now < new Date(b.exposeStart).getTime()) return 'notstart'
  if (now <= new Date(b.exposeEnd).getTime()) return 'open'
  return 'ended'
}
const opposedByMe = (id) => myVotesMap.value[id] === 'against'
const votedByMe = (id) => !!myVotesMap.value[id]

/* ========== v2 投票（赞成/反对，二次确认，不可撤回；反对可填理由匿名公开） ========== */
const voteForm = ref({ id: null, choice: '', reason: '', submitting: false, msg: '', showReason: false })
function startVote(b, choice) {
  if (choice === 'for') {
    if (!confirm(t.value.voteConfirm)) return
    voteForm.value = { id: b.id, choice: 'for', reason: '', submitting: true, msg: '', showReason: false }
    submitVote()
  } else {
    voteForm.value = { id: b.id, choice: 'against', reason: '', submitting: false, msg: '', showReason: true }
  }
}
function cancelVoteInput() { voteForm.value = { id: null, choice: '', reason: '', submitting: false, msg: '', showReason: false } }
async function submitVote() {
  const f = voteForm.value
  f.submitting = true
  f.msg = ''
  try {
    const res = await fetchWithRetry('/api/finance/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({ proposalId: f.id, choice: f.choice, reason: f.choice === 'against' ? f.reason : '' }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) { f.msg = f.choice === 'for' ? t.value.voteForDone : t.value.voteAgainstDone; cancelVoteInput(); await loadFinance() }
    else f.msg = json.error || 'error'
  } catch (e) { f.msg = t.value.loadFailed }
  finally { f.submitting = false }
}

/* ========== 报销 ========== */
const showReimbForm = ref(false)
const reimbForm = ref(emptyReimbForm())
function emptyReimbForm() {
  return {
    activityId: '', proposalId: '', expenseDate: '', amount: null,
    category: 'dining', description: '', vouchers: [],
    endorserName: '', uploading: false, submitting: false, msg: '',
    editingId: null,
  }
}
const passedBudgets = computed(() => budgets.value.filter(b => b.status === 'passed'))
const requiredVouchers = computed(() => {
  const amt = Number(reimbForm.value.amount) || 0
  return amt >= config.value.largeAmount ? config.value.largeVouchers : config.value.smallVouchers
})
const needsEndorsement = computed(() => {
  const amt = Number(reimbForm.value.amount) || 0
  const have = new Set(reimbForm.value.vouchers.map(v => v.type))
  return amt >= config.value.largeAmount && !have.has('invoice')
})
const requiredHintText = computed(() => {
  const amt = Number(reimbForm.value.amount) || 0
  const list = requiredVouchers.value.map(v => t.value['v' + v[0].toUpperCase() + v.slice(1)]).join('、')
  return amt >= config.value.largeAmount
    ? t.value.requiredHint.replace('{n}', config.value.largeAmount).replace('{list}', list)
    : t.value.requiredHintSmall.replace('{n}', config.value.largeAmount).replace('{list}', list)
})
const reimbCanSubmit = computed(() => {
  const f = reimbForm.value
  if (!f.expenseDate || !(Number(f.amount) > 0) || !f.description.trim()) return false
  const have = new Set(f.vouchers.map(v => v.type))
  if (!requiredVouchers.value.every(v => have.has(v))) return false
  if (needsEndorsement.value && !String(f.endorserName || '').trim()) return false
  return true
})
const voucherTypeLabel = (type) => t.value['v' + type[0].toUpperCase() + type.slice(1)] || type

// 补正：待补正状态由本人修改重提（PUT）
function editReimb(r) {
  reimbForm.value = {
    activityId: r.activityId || '', proposalId: r.proposalId || '',
    expenseDate: r.expenseDate || '', amount: r.amount, category: r.category || 'dining',
    description: r.description || '', vouchers: [...(r.vouchers || [])],
    endorserName: r.endorsement?.committee?.name || '', uploading: false, submitting: false, msg: '',
    editingId: r.id,
  }
  showReimbForm.value = true
}
function newReimbForm() {
  reimbForm.value = emptyReimbForm()
  showReimbForm.value = true
}

function bytesToBase64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}
async function compressImage(file, maxEdge, quality) {
  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = url
  })
  let { width, height } = img
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  width = Math.round(width * scale); height = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  URL.revokeObjectURL(img.src)
  return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
}
async function addVoucherFile(type, event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const f = reimbForm.value
  f.uploading = true
  f.msg = ''
  try {
    const isPdf = file.type === 'application/pdf'
    let dataBase64, contentType
    if (isPdf) {
      const buf = await file.arrayBuffer()
      dataBase64 = bytesToBase64(new Uint8Array(buf))
      contentType = 'application/pdf'
    } else {
      const blob = await compressImage(file, 2000, 0.85)
      dataBase64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
      contentType = blob.type
    }
    if (dataBase64.length > 14 * 1024 * 1024) { f.msg = 'file too large'; return }
    const username = (currentUser.value?.username || 'guest').replace(/[^\w-]/g, '_')
    const safeName = file.name.replace(/[^\w.\-]/g, '_').slice(-60)
    const key = `receipts/${username}/${Date.now()}-${safeName}`
    const res = await fetchWithRetry('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({ key, contentType, dataBase64 }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { f.msg = json.error || t.value.loadFailed; return }
    // 同类型可多份；移除旧的同类型第一份保持列表清爽
    const idx = f.vouchers.findIndex(v => v.type === type)
    if (idx >= 0) f.vouchers.splice(idx, 1)
    f.vouchers.push({ type, url: json.url, name: file.name.slice(-40) })
  } catch (e) { f.msg = t.value.loadFailed }
  finally { f.uploading = false }
}
function removeVoucher(i) { reimbForm.value.vouchers.splice(i, 1) }

async function submitReimb() {
  const f = reimbForm.value
  if (!reimbCanSubmit.value || f.submitting) return
  f.submitting = true
  f.msg = ''
  try {
    const endorsement = needsEndorsement.value ? { committee: { name: String(f.endorserName || '').trim() } } : null
    const payload = {
      id: f.editingId || undefined,
      activityId: f.activityId || null, proposalId: f.proposalId || null,
      expenseDate: f.expenseDate, amount: Number(f.amount), category: f.category,
      description: f.description.trim(), vouchers: f.vouchers,
      endorsement,
    }
    const res = await fetchWithRetry('/api/finance/reimbursements', {
      method: f.editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      f.msg = f.editingId ? t.value.resubmitted : t.value.successSubmitted
      showReimbForm.value = false
      reimbForm.value = emptyReimbForm()
      await loadFinance()
    } else f.msg = json.error || t.value.loadFailed
  } catch (e) { f.msg = t.value.loadFailed }
  finally { f.submitting = false }
}
const reimbStatusLabel = (s) => t.value['status' + s[0].toUpperCase() + s.slice(1)] || s

/* ========== 财务工作台操作（会计/出纳） ========== */
const workbenchBusy = ref('')
async function auditReimb(r, action, note = '') {
  if (action === 'revision' || action === 'reject') {
    const reason = prompt(action === 'revision' ? t.value.revision + '（填退回意见）' : t.value.reject + '（填驳回意见）', '')
    if (reason === null) return
    note = reason
  }
  if (!confirm(`${action === 'approve' ? t.value.approve : action === 'revision' ? t.value.revision : t.value.reject}：${r.description || r.id}？`)) return
  workbenchBusy.value = r.id
  try {
    const res = await fetchWithRetry(`/api/admin/finance/reimbursements/${r.id}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({ action, note }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { alert(json.error || t.value.loadFailed); return }
    await loadFinance()
  } catch (e) { alert(t.value.loadFailed) }
  finally { workbenchBusy.value = '' }
}
async function payReimb(r) {
  if (!confirm(t.value.confirmPay + '？' + t.value.payNeed)) return
  workbenchBusy.value = r.id
  try {
    const res = await fetchWithRetry(`/api/admin/finance/reimbursements/${r.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({}),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { alert(json.error || t.value.loadFailed); return }
    await loadFinance()
  } catch (e) { alert(t.value.loadFailed) }
  finally { workbenchBusy.value = '' }
}
// 出纳登记收入/流水
async function registerTx() {
  const f = txForm.value
  if (!f.date || !(Number(f.amount) > 0) || !f.description.trim()) return
  f.submitting = true
  try {
    const res = await fetchWithRetry('/api/admin/finance/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({ date: f.date, type: f.type, category: f.category, amount: Number(f.amount), description: f.description.trim(), activityId: f.activityId || null, proposalId: f.proposalId || null }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { alert(json.error || t.value.loadFailed); return }
    txForm.value = { date: '', type: 'income', category: 'tuition', amount: null, description: '', activityId: '', proposalId: '', submitting: false }
    await loadFinance()
  } catch (e) { alert(t.value.loadFailed) }
  finally { f.submitting = false }
}
const txForm = ref({ date: '', type: 'income', category: 'tuition', amount: null, description: '', activityId: '', proposalId: '', submitting: false })

/* ========== 小荷包对账（仅出纳） ========== */
const rcForm = ref({ date: '', actualBalance: null, note: '', proposalId: '', reimbursementId: '', submitting: false })
async function submitReconcile() {
  const f = rcForm.value
  if (!f.date || !(Number(f.actualBalance) >= 0)) return
  f.submitting = true
  try {
    const res = await fetchWithRetry('/api/finance/reconcilations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken.value}` },
      body: JSON.stringify({ date: f.date, actualBalance: Number(f.actualBalance), note: f.note, proposalId: f.proposalId || null, reimbursementId: f.reimbursementId || null }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { alert(json.error || t.value.loadFailed); return }
    rcForm.value = { date: '', actualBalance: null, note: '', proposalId: '', reimbursementId: '', submitting: false }
    await loadFinance()
  } catch (e) { alert(t.value.loadFailed) }
  finally { f.submitting = false }
}
// 台账余额（对账对比用）
const ledgerBalanceNow = computed(() => transactions.value.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0))
const pendingAudits = computed(() => reimbursements.value.filter(r => r.status === 'submitted'))
const pendingPays = computed(() => reimbursements.value.filter(r => r.status === 'approved'))
const lastRc = computed(() => [...reconcilations.value].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null)
const rcDiff = computed(() => lastRc.value ? Number(lastRc.value.actualBalance) - ledgerBalanceNow.value : null)
const nowIso = () => new Date().toISOString().slice(0, 10)

/* ========== 汇总 ========== */
const period = ref('all')
const monthSel = ref('all')
const semSel = ref('fall')
const semesters = computed(() => [
  { key: 'fall', label: t.value.semFall, start: '2026-09-01', end: '2027-01-31' },
  { key: 'spring', label: t.value.semSpring, start: '2027-02-01', end: '2027-06-30' },
])
const periodTx = computed(() => {
  let list = [...transactions.value]
  if (period.value === 'month' && monthSel.value !== 'all') list = list.filter(t => (t.date || '').startsWith(monthSel.value))
  if (period.value === 'semester') {
    const s = semesters.value.find(x => x.key === semSel.value)
    if (s) list = list.filter(t => (t.date || '') >= s.start && (t.date || '') <= s.end)
  }
  return list
})
const pIncome = computed(() => periodTx.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const pExpense = computed(() => periodTx.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const pBalance = computed(() => pIncome.value - pExpense.value)
const catBreakdown = computed(() => {
  const map = {}
  periodTx.value.filter(t => t.type === 'expense').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => ({ cat, amt }))
})
const actBreakdown = computed(() => {
  const map = {}
  periodTx.value.filter(t => t.type === 'expense' && t.activityId).forEach(t => {
    if (!map[t.activityId]) map[t.activityId] = { amt: 0, count: 0 }
    map[t.activityId].amt += t.amount
    map[t.activityId].count += 1
  })
  return Object.entries(map).sort((a, b) => b[1].amt - a[1].amt).map(([id, v]) => ({ id, ...v }))
})

const catPalette = ['#5ec4ac', '#5e5ce6', '#ff9f0a', '#ff375f', '#30b0c7', '#af52de', '#64d2ff', '#ffd60a', '#8e8e93', '#34c759', '#a2845e']
</script>

<template>
  <div class="finance-page">
    <!-- 顶部 Tab -->
    <div class="fp-tabs" role="tablist">
      <button v-for="tab in [{k:'tx',l:t.tabTx},{k:'budget',l:t.tabBudget},{k:'reimb',l:t.tabReimb},{k:'summary',l:t.tabSummary}, ...(workbench.isFinanceStaff ? [{k:'workbench',l:t.tabWorkbench}] : [])]"
        :key="tab.k" class="fp-tab" :class="{ active: activeTab === tab.k }" role="tab"
        :aria-selected="activeTab === tab.k" @click="activeTab = tab.k">
        {{ tab.l }}
        <span v-if="tab.k === 'workbench' && (workbench.pendingAudit || workbench.pendingPay)" class="wb-badge">
          {{ workbench.pendingAudit + workbench.pendingPay }}
        </span>
      </button>
    </div>

    <!-- 加载 / 错误 -->
    <div v-if="loading" class="fp-state">{{ t.loading }}</div>
    <div v-else-if="error" class="fp-state">
      {{ t.loadFailed }} <button class="link-btn" @click="loadFinance">{{ t.retry }}</button>
    </div>

    <template v-else>
      <!-- ===== Tab 1 收支明细 ===== -->
      <div v-show="activeTab === 'tx'">
        <div class="balance-card">
          <div class="balance-main">
            <span class="balance-label">{{ t.balance }}</span>
            <span class="balance-amount">¥ {{ formatAmount(balance) }}</span>
          </div>
          <div class="balance-stats">
            <div class="stat-col"><span class="stat-label">{{ t.income }}</span><span class="stat-value stat-income">+¥ {{ formatAmount(totalIncome) }}</span></div>
            <div class="stat-divider"></div>
            <div class="stat-col"><span class="stat-label">{{ t.expense }}</span><span class="stat-value stat-expense">-¥ {{ formatAmount(totalExpense) }}</span></div>
          </div>
        </div>

        <div class="filter-bar">
          <span class="details-title">{{ t.details }}</span>
          <div class="filters">
            <select v-model="filterType" class="fp-select" aria-label="type">
              <option value="all">{{ t.all }}</option>
              <option value="income">{{ t.incomeOnly }}</option>
              <option value="expense">{{ t.expenseOnly }}</option>
            </select>
            <select v-model="filterCategory" class="fp-select">
              <option value="all">{{ t.filterCategory }} · {{ t.all }}</option>
              <option v-for="(label, key) in t.categories" :key="key" :value="key">{{ label }}</option>
            </select>
            <select v-model="filterMonth" class="fp-select">
              <option value="all">{{ t.filterMonth }} · {{ t.all }}</option>
              <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
            </select>
            <select v-model="filterActivity" class="fp-select">
              <option value="all">{{ t.filterActivity }} · {{ t.all }}</option>
              <option v-for="id in activitiesWithTx" :key="id" :value="id">{{ activityTitle(id) }}</option>
            </select>
          </div>
        </div>

        <div class="tx-list" v-if="filtered.length > 0">
          <div v-for="tx in filtered" :key="tx.id" class="tx-item clickable" @click="openTxDetail(tx)">
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
      </div>

      <!-- ===== Tab 2 预算公示 ===== -->
      <div v-show="activeTab === 'budget'">
        <div class="section-header">
          <h3 class="section-title">{{ t.budgetTitle }}</h3>
          <span class="section-desc">{{ t.budgetDesc }}</span>
        </div>

        <div v-if="openBudgets.length" class="budget-group">
          <h4 class="group-title">{{ t.inProgress }}</h4>
          <div v-for="b in openBudgets" :key="b.id" class="budget-card open" :class="{ 'hl-flash': hlBudgetId === b.id }">
            <div class="bc-head">
              <span class="bc-status open">● {{ t.inProgress }}</span>
              <span class="bc-days">{{ t.exposeDaysLeft.replace('{n}', daysLeft(b)) }}</span>
            </div>
            <div class="bc-title">{{ b.title }}</div>
            <div class="bc-meta">
              <span v-if="b.activityId" class="bc-meta-item"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(b.activityId)">{{ t.activity }}: {{ activityTitle(b.activityId) }}</a></span>
              <span>{{ t.proposer }}: {{ b.proposer || '—' }}</span>
              <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
            </div>
            <details class="bc-detail" v-if="b.detailItems && b.detailItems.length">
              <summary>{{ t.items }}</summary>
              <table class="mini-table">
                <tbody>
                  <tr v-for="(it, i) in b.detailItems" :key="i"><td>{{ it.item }}</td><td class="num">¥{{ formatAmount(it.amount) }}</td></tr>
                </tbody>
              </table>
            </details>
            <div class="bc-vote">
              <div class="vote-row">
                <span class="vote-count">{{ t.forCount.replace('{n}', b.forCount) }} · {{ t.againstCount.replace('{n}', b.againstCount) }} · {{ t.uncommitted.replace('{n}', b.uncommitted) }}</span>
                <span class="vote-line">{{ t.vetoLineV2.replace('{n}', b.vetoCount) }}</span>
              </div>
              <div class="vote-bar">
                <div class="vote-fill" :class="{ veto: b.vetoed }" :style="{ width: Math.min(100, b.ratio * 100) + '%' }"></div>
                <div class="vote-marker" :style="{ left: Math.min(100, (b.vetoCount / b.total) * 100) + '%' }" :title="t.vetoLineV2.replace('{n}', b.vetoCount)"></div>
              </div>
              <div v-if="!isAuthenticated" class="oppose-hint">{{ t.loginFirst }}</div>
              <div v-else-if="isViewerOnly" class="oppose-hint">{{ t.viewerOnlyHint }}</div>
              <div v-else-if="votedByMe(b.id)" class="oppose-done">{{ myVote(b.id) === 'for' ? t.voteForDone : t.voteAgainstDone }}</div>
              <div v-else-if="voteForm.id !== b.id" class="vote-actions">
                <button class="btn-vote for" @click="startVote(b, 'for')">{{ t.voteFor }}</button>
                <button class="btn-vote against" @click="startVote(b, 'against')">{{ t.voteAgainst }}</button>
              </div>
              <div v-else class="vote-input">
                <p class="oppose-hint">{{ t.voteReasonHint }}</p>
                <textarea v-model="voteForm.reason" class="oppose-reason" :placeholder="t.opposeReason" rows="2"></textarea>
                <div class="oppose-actions">
                  <button class="btn-vote against" :disabled="voteForm.submitting" @click="submitVote">{{ voteForm.submitting ? t.submitting : t.submitOppose }}</button>
                  <button class="btn-ghost" @click="cancelVoteInput">{{ t.close }}</button>
                </div>
                <span v-if="voteForm.msg" class="oppose-msg">{{ voteForm.msg }}</span>
              </div>
            </div>
            <div v-if="b.reasons && b.reasons.length" class="bc-reasons">
              <div class="reasons-k">{{ t.reasonsTitle }}（{{ b.reasons.length }}）</div>
              <div v-for="(r, i) in b.reasons" :key="i" class="reason-item">
                <span class="reason-dot">💬</span><span class="reason-text">{{ r.reason }}</span>
              </div>
            </div>
            <div v-if="b.exposeType === 'emergency'" class="emergency-tag">{{ t.emergencyTag }}</div>
          </div>
        </div>

        <div v-if="pendingSettleBudgets.length" class="budget-group">
          <h4 class="group-title">{{ t.pendingSettle }}</h4>
          <div v-for="b in pendingSettleBudgets" :key="b.id" class="budget-card pending">
            <div class="bc-head">
              <span class="bc-status pending">● {{ t.pendingSettle }}</span>
            </div>
            <div class="bc-title">{{ b.title }}</div>
            <div class="bc-meta">
              <span>{{ t.proposer }}: {{ b.proposer || '—' }}</span>
              <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
            </div>
            <div class="vote-row">
              <span class="vote-count">{{ t.forCount.replace('{n}', b.forCount) }} · {{ t.againstCount.replace('{n}', b.againstCount) }}</span>
              <span class="expose-ended">{{ t.exposeEnded }}</span>
            </div>
          </div>
        </div>

        <div v-if="doneBudgets.length" class="budget-group">
          <h4 class="group-title">{{ t.history }}</h4>
          <div v-for="b in doneBudgets" :key="b.id" class="budget-card done" :class="{ 'hl-flash': hlBudgetId === b.id }">
            <div class="bc-head">
              <span class="bc-status" :class="b.status">{{ budgetStatusText(b) }}</span>
              <span class="bc-days">{{ t.forCount.replace('{n}', b.forCount) }} · {{ t.againstCount.replace('{n}', b.againstCount) }}</span>
            </div>
            <div class="bc-title">{{ b.title }}</div>
            <div class="bc-meta">
              <span v-if="b.activityId" class="bc-meta-item"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(b.activityId)">{{ t.activity }}: {{ activityTitle(b.activityId) }}</a></span>
              <span>{{ t.proposer }}: {{ b.proposer || '—' }}</span>
              <span class="bc-amount">{{ t.budgetUpper }}: <b>¥{{ formatAmount(b.amount) }}</b></span>
            </div>
          </div>
        </div>

        <div v-if="!openBudgets.length && !pendingSettleBudgets.length && !doneBudgets.length" class="empty-state"><p>{{ t.noRecords }}</p></div>
      </div>

      <!-- ===== Tab 3 我的报销 ===== -->
      <div v-show="activeTab === 'reimb'">
        <div class="section-header">
          <h3 class="section-title">{{ t.reimbTitle }}</h3>
          <span class="section-desc">{{ t.reimbDesc }}</span>
        </div>

        <div v-if="!isAuthenticated" class="empty-state"><p>{{ t.noLoginReimb }}</p></div>
        <div v-else-if="isViewerOnly" class="empty-state"><p>{{ t.viewerOnlyHint }}</p></div>
        <template v-else>
          <div class="reimb-topbar">
            <span class="group-title">{{ canViewAllReimb ? t.allReimb : t.myReimb }}（{{ reimbursements.length }}）</span>
            <button class="btn-oppose primary" @click="showReimbForm = !showReimbForm">{{ showReimbForm ? t.close : t.newReimb }}</button>
          </div>

          <!-- 新建表单 -->
          <div v-if="showReimbForm" class="reimb-form">
            <h4 class="form-title">{{ t.reimbFormTitle }}</h4>
            <div class="form-row">
              <label class="f-label">{{ t.reimbActivity }}</label>
              <select v-model="reimbForm.activityId" class="fp-select">
                <option value="">—</option>
                <option v-for="(act, id) in activitiesMap" :key="id" :value="id">{{ act.date || '' }} · {{ act.title?.[currentLang] || act.title?.zh || id }}</option>
              </select>
            </div>
            <div class="form-row">
              <label class="f-label">{{ t.reimbBudget }}</label>
              <select v-model="reimbForm.proposalId" class="fp-select">
                <option value="">—</option>
                <option v-for="b in passedBudgets" :key="b.id" :value="b.id">{{ b.title }}</option>
              </select>
            </div>
            <div class="form-row">
              <label class="f-label">{{ t.reimbDate }} *</label>
              <input v-model="reimbForm.expenseDate" type="date" class="fp-input" />
            </div>
            <div class="form-row">
              <label class="f-label">{{ t.reimbAmount }} *</label>
              <input v-model.number="reimbForm.amount" type="number" step="0.01" min="0" class="fp-input" placeholder="0.00" />
            </div>
            <div class="form-row">
              <label class="f-label">{{ t.reimbCategory }}</label>
              <select v-model="reimbForm.category" class="fp-select">
                <option v-for="(label, key) in t.categories" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
            <div class="form-row">
              <label class="f-label">{{ t.reimbDesc }} *</label>
              <input v-model="reimbForm.description" class="fp-input" :placeholder="t.reimbDesc" />
            </div>
            <div class="form-row col">
              <label class="f-label">{{ t.reimbVouchers }} *</label>
              <p class="required-hint">{{ requiredHintText }}</p>
              <div class="voucher-grid">
                <div v-for="type in ['invoice', 'payment', 'receipt', 'other']" :key="type" class="voucher-cell">
                  <span class="v-name">{{ voucherTypeLabel(type) }}</span>
                  <label class="v-upload btn-oppose" :class="{ primary: reimbForm.vouchers.some(v => v.type === type) }">
                    {{ reimbForm.vouchers.some(v => v.type === type) ? t.uploaded + ' ✓' : t.uploadVoucher }}
                    <input type="file" :accept="type === 'other' ? 'image/*,.pdf' : 'image/*,.pdf'" style="display:none" @change="addVoucherFile(type, $event)" />
                  </label>
                  <div v-for="(v, i) in reimbForm.vouchers.filter(x => x.type === type)" :key="i" class="v-file">
                    <a :href="v.url" target="_blank" rel="noopener">{{ v.name }}</a>
                    <button class="v-rm" @click="removeVoucher(reimbForm.vouchers.indexOf(v))">×</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-row col" v-if="needsEndorsement">
              <label class="f-label">{{ t.endorsementTitle }}</label>
              <input v-model="reimbForm.endorserName" class="fp-input" :placeholder="t.endorserName" />
              <p class="required-hint">{{ t.endorserHint.replace('{n}', config.largeAmount || 500) }}</p>
            </div>
            <div class="form-actions">
              <span v-if="reimbForm.msg" class="oppose-msg">{{ reimbForm.msg }}</span>
              <button class="btn-oppose primary" :disabled="!reimbCanSubmit || reimbForm.submitting || reimbForm.uploading" @click="submitReimb">
                {{ reimbForm.submitting ? t.submitting : (reimbForm.editingId ? t.needRevise : t.submit) }}
              </button>
              <button v-if="reimbForm.editingId" class="btn-ghost" @click="reimbForm = emptyReimbForm(); showReimbForm = false">{{ t.close }}</button>
            </div>
          </div>

          <!-- 列表 -->
          <div class="reimb-list" v-if="reimbursements.length">
            <div v-for="r in reimbursements" :key="r.id" class="reimb-card" :class="{ 'hl-flash': hlReimbId === r.id }">
              <div class="rc-head">
                <span class="rc-status" :class="r.status">{{ reimbStatusLabel(r.status) }}</span>
                <span class="rc-date">{{ formatDate(r.createdAt) }}</span>
              </div>
              <div class="rc-title">{{ r.description || '—' }}</div>
              <div class="rc-meta">
                <span v-if="r.activityId"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(r.activityId)">{{ t.activity }}: {{ activityTitle(r.activityId) }}</a></span>
                <span v-if="r.proposalId"><a class="link-activity" href="#" @click.prevent.stop="gotoBudget(r.proposalId)">{{ t.relatedBudget }}</a></span>
                <span v-if="canViewAllReimb">{{ t.payer }}: {{ r.applicant }}</span>
                <span class="rc-amount">¥{{ formatAmount(r.amount) }}</span>
              </div>
              <div class="rc-foot">
                <button v-if="r.vouchers && r.vouchers.length" class="link-btn" @click="voucherView = { title: r.description, vouchers: r.vouchers }">📎 {{ t.voucher }} ({{ r.vouchers.length }})</button>
                <span v-if="r.endorsement?.committee?.name" class="rc-note">{{ t.endorsementTitle }}: {{ r.endorsement.committee.name }}</span>
                <span v-if="r.auditNote" class="rc-note">{{ t.auditNote }}: {{ r.auditNote }}</span>
                <button v-if="r.status === 'need_revision' && currentUser?.username === r.applicant" class="link-btn" @click="editReimb(r)">{{ t.needRevise }}</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state"><p>{{ t.emptyReimb }}</p></div>
        </template>
      </div>

      <!-- ===== Tab 4 汇总 ===== -->
      <div v-show="activeTab === 'summary'">
        <div class="section-header">
          <h3 class="section-title">{{ t.summaryTitle }}</h3>
          <span class="section-desc">{{ t.period }}</span>
        </div>
        <div class="period-bar">
          <select v-model="period" class="fp-select">
            <option value="all">{{ t.periodAll }}</option>
            <option value="month">{{ t.periodMonth }}</option>
            <option value="semester">{{ t.periodSemester }}</option>
          </select>
          <select v-if="period === 'month'" v-model="monthSel" class="fp-select">
            <option value="all">{{ t.periodAll }}</option>
            <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
          </select>
          <select v-if="period === 'semester'" v-model="semSel" class="fp-select">
            <option v-for="s in semesters" :key="s.key" :value="s.key">{{ s.label }}</option>
          </select>
        </div>

        <div class="balance-card compact">
          <div class="balance-main"><span class="balance-label">{{ t.income }}</span><span class="balance-amount small">+¥ {{ formatAmount(pIncome) }}</span></div>
          <div class="balance-stats">
            <div class="stat-col"><span class="stat-label">{{ t.expense }}</span><span class="stat-value stat-expense">-¥ {{ formatAmount(pExpense) }}</span></div>
            <div class="stat-divider"></div>
            <div class="stat-col"><span class="stat-label">{{ t.balance }}</span><span class="stat-value stat-balance">¥ {{ formatAmount(pBalance) }}</span></div>
          </div>
        </div>

        <div v-if="config.warnLine && pBalance < config.warnLine" class="warn-bar">
          <span class="warn-icon">⚠️</span>
          <span>{{ t.lowBalance.replace('{n}', config.warnLine) }}</span>
        </div>

        <div class="sum-section">
          <h4 class="group-title">{{ t.expenseBy }}</h4>
          <div v-if="catBreakdown.length" class="cat-bars">
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
          <div v-if="actBreakdown.length" class="act-bars">
            <div v-for="a in actBreakdown" :key="a.id" class="act-bar">
              <span class="act-name">{{ activityTitle(a.id) }}</span>
              <span class="act-count">{{ a.count }} {{ t.expenseOnly }}</span>
              <span class="act-amt">¥{{ formatAmount(a.amt) }}</span>
            </div>
          </div>
          <div v-else class="empty-state"><p>{{ t.noExpense }}</p></div>
        </div>
      </div>

      <!-- ===== Tab 5 财务工作台 ===== -->
      <div v-show="activeTab === 'workbench'">
        <div class="section-header">
          <h3 class="section-title">{{ t.tabWorkbench }}</h3>
          <span class="section-desc">{{ t.workbenchDesc }}</span>
        </div>

        <!-- 会计视图 -->
        <div v-if="workbench.isAccountant" class="wb-section">
          <h4 class="group-title">👤 {{ t.accountantView }}</h4>
          <div v-if="pendingAudits.length" class="reimb-list">
            <div v-for="r in pendingAudits" :key="r.id" class="reimb-card">
              <div class="rc-head"><span class="rc-status submitted">{{ reimbStatusLabel(r.status) }}</span><span class="rc-date">{{ formatDate(r.createdAt) }}</span></div>
              <div class="rc-title">{{ r.description || '—' }}</div>
              <div class="rc-meta">
                <span v-if="r.activityId"><a class="link-activity" href="#" @click.prevent.stop="gotoActivity(r.activityId)">{{ t.activity }}: {{ activityTitle(r.activityId) }}</a></span>
                <span v-if="r.proposalId"><a class="link-activity" href="#" @click.prevent.stop="gotoBudget(r.proposalId)">{{ t.relatedBudget }}</a></span>
                <span>{{ t.payer }}: {{ r.applicant }}</span>
                <span class="rc-amount">¥{{ formatAmount(r.amount) }}</span>
              </div>
              <div class="rc-foot">
                <button class="link-btn" @click="voucherView = { title: r.description, vouchers: r.vouchers }">📎 {{ t.voucher }} ({{ r.vouchers?.length || 0 }})</button>
                <span v-if="r.endorsement?.committee?.name" class="rc-note">{{ t.endorsementTitle }}: {{ r.endorsement.committee.name }}</span>
              </div>
              <div class="wb-actions">
                <button class="btn-vote for" :disabled="workbenchBusy === r.id" @click="auditReimb(r, 'approve')">{{ t.approve }}</button>
                <button class="btn-ghost" :disabled="workbenchBusy === r.id" @click="auditReimb(r, 'revision')">{{ t.revision }}</button>
                <button class="btn-vote against" :disabled="workbenchBusy === r.id" @click="auditReimb(r, 'reject')">{{ t.reject }}</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state"><p>{{ t.pendingAuditQ.replace('{n}', 0) }}</p></div>
        </div>

        <!-- 出纳视图 -->
        <div v-if="workbench.isCashier" class="wb-section">
          <h4 class="group-title">👤 {{ t.cashierView }}</h4>
          <div v-if="pendingPays.length" class="reimb-list">
            <div v-for="r in pendingPays" :key="r.id" class="reimb-card">
              <div class="rc-head"><span class="rc-status approved">{{ reimbStatusLabel(r.status) }}</span><span class="rc-date">{{ formatDate(r.createdAt) }}</span></div>
              <div class="rc-title">{{ r.description || '—' }}</div>
              <div class="rc-meta">
                <span v-if="r.proposalId"><a class="link-activity" href="#" @click.prevent.stop="gotoBudget(r.proposalId)">{{ t.relatedBudget }}</a></span>
                <span>{{ t.payer }}: {{ r.applicant }}</span>
                <span class="rc-amount">¥{{ formatAmount(r.amount) }}</span>
              </div>
              <div class="rc-foot">
                <button class="link-btn" @click="voucherView = { title: r.description, vouchers: r.vouchers }">📎 {{ t.voucher }} ({{ r.vouchers?.length || 0 }})</button>
              </div>
              <div class="wb-actions">
                <button class="btn-vote for" :disabled="workbenchBusy === r.id" @click="payReimb(r)">{{ t.confirmPay }}</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state"><p>{{ t.pendingPayQ.replace('{n}', 0) }}</p></div>

          <!-- 收款登记 -->
          <div class="wb-panel">
            <h4 class="group-title">💰 {{ t.income }}</h4>
            <div class="rc-form-grid">
              <label class="f-label">{{ t.filterMonth }}</label>
              <input v-model="txForm.date" type="date" class="fp-input" :max="nowIso()" />
              <label class="f-label">{{ t.category }}</label>
              <select v-model="txForm.category" class="fp-select"><option v-for="(label, key) in t.categories" :key="key" :value="key">{{ label }}</option></select>
              <label class="f-label">{{ t.amount }}</label>
              <input v-model.number="txForm.amount" type="number" step="0.01" min="0" class="fp-input" placeholder="0.00" />
              <label class="f-label">{{ t.description }}</label>
              <input v-model="txForm.description" class="fp-input" />
              <button class="btn-oppose primary" :disabled="txForm.submitting" @click="registerTx">{{ txForm.submitting ? t.submitting : t.incomeOnly }}</button>
            </div>
          </div>

          <!-- 小荷包对账 -->
          <div class="wb-panel">
            <h4 class="group-title">🧾 {{ t.reconcileTitle }}</h4>
            <p class="section-desc">{{ t.payNeed }}</p>
            <div class="rc-form-grid">
              <label class="f-label">{{ t.filterMonth }}</label>
              <input v-model="rcForm.date" type="date" class="fp-input" :max="nowIso()" />
              <label class="f-label">{{ t.actualBalance }}</label>
              <input v-model.number="rcForm.actualBalance" type="number" step="0.01" min="0" class="fp-input" placeholder="0.00" />
              <label class="f-label">{{ t.relatedBudget }}</label>
              <select v-model="rcForm.proposalId" class="fp-select"><option value="">—</option><option v-for="b in budgets" :key="b.id" :value="b.id">{{ b.title }}</option></select>
              <label class="f-label">{{ t.relatedReimb }}</label>
              <select v-model="rcForm.reimbursementId" class="fp-select"><option value="">—</option><option v-for="r in reimbursements" :key="r.id" :value="r.id">{{ r.description }}</option></select>
              <label class="f-label">{{ t.reconcileNote }}</label>
              <input v-model="rcForm.note" class="fp-input" />
              <button class="btn-oppose primary" :disabled="rcForm.submitting" @click="submitReconcile">{{ rcForm.submitting ? t.submitting : t.reconcile }}</button>
            </div>
            <div v-if="reconcilations.length" class="rc-records">
              <div v-for="r in reconcilations" :key="r.id" class="rc-record">
                <span class="rc-rec-date">{{ r.date }}</span>
                <span class="rc-rec-bal">¥ {{ formatAmount(r.actualBalance) }}</span>
                <a v-if="r.proposalId" class="link-activity" href="#" @click.prevent.stop="gotoBudget(r.proposalId)">{{ t.relatedBudget }}</a>
                <a v-if="r.reimbursementId" class="link-activity" href="#" @click.prevent.stop="gotoReimb(r.reimbursementId)">{{ t.relatedReimb }}</a>
                <span v-if="r.note" class="rc-rec-note">{{ r.note }}</span>
              </div>
            </div>
            <div v-if="lastRc" class="rc-compare" :class="rcDiff === 0 ? 'ok' : 'warn'">
              <span>{{ t.ledgerBalance }}: ¥{{ formatAmount(ledgerBalanceNow) }}</span>
              <span>{{ rcDiff === 0 ? '✓ ' + t.reconcileMatch : t.reconcileDiff + ': ¥' + formatAmount(Math.abs(rcDiff)) }}</span>
            </div>
          </div>
        </div>

        <div v-if="!workbench.isAccountant && !workbench.isCashier" class="empty-state"><p>{{ t.workbenchDesc }}</p></div>
      </div>
    </template>

    <!-- 流水详情弹层（有迹可循：活动/预算/报销关联 + 明细/凭证/附件） -->
    <div v-if="txDetail" class="modal-mask" @click.self="closeTxDetail">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">{{ txDetail.description }}</span>
          <button class="modal-close" @click="closeTxDetail">×</button>
        </div>
        <div class="modal-body">
          <div class="td-grid">
            <div class="td-cell"><span class="td-k">{{ t.category }}</span><span class="td-v">{{ catLabel(txDetail.category) }}</span></div>
            <div class="td-cell"><span class="td-k">{{ t.filterMonth }}</span><span class="td-v">{{ formatDate(txDetail.date) }}</span></div>
            <div class="td-cell" v-if="txDetail.voucherNo"><span class="td-k">{{ t.voucherNo }}</span><span class="td-v">{{ txDetail.voucherNo }}</span></div>
            <div class="td-cell"><span class="td-k">{{ t.amount }}</span><span class="td-v" :class="txDetail.type">¥{{ formatAmount(txDetail.amount) }}</span></div>
            <div class="td-cell"><span class="td-k">{{ t.balanceCol }}</span><span class="td-v">¥{{ formatAmount(balanceMap[txDetail.id]) }}</span></div>
            <div class="td-cell" v-if="txDetail.handler"><span class="td-k">{{ t.payer }}</span><span class="td-v">{{ txDetail.handler }}</span></div>
            <div class="td-cell" v-if="txDetail.checker"><span class="td-k">{{ t.checker }}</span><span class="td-v">{{ txDetail.checker }}</span></div>
          </div>

          <!-- 关联活动 -->
          <div class="td-rel" v-if="txDetail.activityId && activitiesMap[txDetail.activityId]">
            <div class="td-rel-k">{{ t.relatedActivity }}</div>
            <div class="td-rel-card" @click="gotoActivity(txDetail.activityId)">
              <div class="td-rel-title">{{ activityTitle(txDetail.activityId) }}</div>
              <div class="td-rel-meta">{{ activitiesMap[txDetail.activityId].date }}<template v-if="activitiesMap[txDetail.activityId].location && activitiesMap[txDetail.activityId].location.zh"> · {{ activitiesMap[txDetail.activityId].location.zh }}</template></div>
              <span class="td-rel-go">{{ t.jumpTo }} →</span>
            </div>
          </div>

          <!-- 关联预算 -->
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

          <!-- 关联报销 -->
          <div class="td-rel" v-if="txDetail.reimbursementId && reimbMap[txDetail.reimbursementId]">
            <div class="td-rel-k">{{ t.relatedReimb }}</div>
            <div class="td-rel-card" @click="gotoReimb(txDetail.reimbursementId)">
              <div class="td-rel-title">{{ reimbMap[txDetail.reimbursementId].description || txDetail.description }}</div>
              <div class="td-rel-meta">{{ reimbStatusLabel(reimbMap[txDetail.reimbursementId].status) }}<template v-if="canViewAllReimb"> · {{ t.payer }}: {{ reimbMap[txDetail.reimbursementId].applicant }}</template></div>
              <div class="voucher-grid mini" v-if="reimbMap[txDetail.reimbursementId].vouchers && reimbMap[txDetail.reimbursementId].vouchers.length">
                <a v-for="(v, i) in reimbMap[txDetail.reimbursementId].vouchers" :key="i" :href="v.url" target="_blank" rel="noopener" class="v-thumb" @click.stop>
                  <img v-if="isImage(v.url)" :src="v.url" :alt="v.name" loading="lazy" />
                  <span v-else class="v-file-card">📄 {{ v.name || v.type }}</span>
                  <em>{{ voucherTypeLabel(v.type) }}</em>
                </a>
              </div>
              <span class="td-rel-go">{{ t.openVoucher }} →</span>
            </div>
          </div>

          <p v-if="!txDetail.activityId && !txDetail.proposalId && !txDetail.reimbursementId" class="td-none">{{ t.noRelation }}</p>
          <p class="modal-tip">{{ t.close }}</p>
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
          <p class="modal-tip">{{ t.close }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.finance-page { max-width: 1080px; margin: 0 auto; padding: 0 24px 60px; }

/* Tabs */
.fp-tabs { display: flex; gap: 8px; margin-bottom: 22px; border-bottom: 1px solid var(--c-border); padding-bottom: 10px; flex-wrap: wrap; }
.fp-tab { padding: 8px 18px; border-radius: 18px; border: 1px solid transparent; background: none; color: var(--c-text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .2s ease; }
.fp-tab:hover { background: var(--c-bg-elevated); color: var(--c-accent); }
.fp-tab.active { background: var(--c-accent); color: #fff; border-color: var(--c-accent); }

.fp-state { text-align: center; padding: 60px 20px; color: var(--c-text-tertiary); font-size: 15px; }
.link-btn { background: none; border: none; color: var(--c-accent); font-size: 13px; cursor: pointer; padding: 2px 4px; font-family: inherit; }

/* 余额卡 */
.balance-card { background: linear-gradient(135deg, #7ad1bc 0%, #5ec4ac 100%); border-radius: 24px; padding: 30px 34px; color: #1f5a4f; margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.balance-card.compact { padding: 24px 30px; }
.dark .balance-card { background: linear-gradient(135deg, #2d7a6c 0%, #1f5a4f 100%); color: #fff; }
.balance-main { flex-shrink: 0; }
.balance-label { display: block; font-size: 14px; opacity: .85; margin-bottom: 8px; }
.balance-amount { font-size: 42px; font-weight: 700; letter-spacing: -1px; }
.balance-amount.small { font-size: 30px; }
.balance-stats { display: flex; align-items: center; gap: 32px; }
.stat-col { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 12px; opacity: .75; }
.stat-value { font-size: 18px; font-weight: 600; }
.stat-income { color: #2f9e44; } .dark .stat-income { color: #8ce99a; }
.stat-expense { color: #c92a2a; } .dark .stat-expense { color: #ff8a8a; }
.stat-balance { color: #1f5a4f; } .dark .stat-balance { color: #fff; }
.stat-divider { width: 1px; height: 32px; background: rgba(31,90,79,.2); } .dark .stat-divider { background: rgba(255,255,255,.2); }

/* 筛选 */
.filter-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.details-title { font-size: 17px; font-weight: 600; color: var(--c-text-primary); }
.filters { display: flex; gap: 8px; flex-wrap: wrap; }
.fp-select, .fp-input { padding: 7px 12px; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-bg-secondary); color: var(--c-text-primary); font-size: 13px; font-family: inherit; }
.fp-input { width: 100%; }
.fp-select:focus, .fp-input:focus { outline: none; border-color: var(--c-accent); }

/* 流水列表 */
.tx-list { background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 16px; overflow: hidden; }
.tx-item { display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid var(--c-border); transition: background .15s; }
.tx-item:last-child { border-bottom: none; }
.tx-item:hover { background: var(--c-bg-elevated); }
.tx-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tx-icon.income { background: rgba(52,199,89,.12); color: #34C759; }
.tx-icon.expense { background: rgba(255,59,48,.10); color: #FF3B30; }
.tx-info { flex: 1; min-width: 0; }
.tx-desc { display: block; font-size: 15px; font-weight: 500; color: var(--c-text-primary); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tx-category { font-size: 12px; color: var(--c-text-tertiary); background: var(--c-bg-elevated); padding: 2px 8px; border-radius: 6px; }
.tx-date, .tx-handler { font-size: 12px; color: var(--c-text-tertiary); }
.tx-activity { font-size: 12px; color: var(--c-accent); }
.tx-voucher { background: none; border: 1px dashed var(--c-border); border-radius: 8px; font-size: 12px; color: var(--c-accent); padding: 3px 8px; cursor: pointer; font-family: inherit; }
.tx-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
.tx-amount { font-size: 16px; font-weight: 600; }
.tx-amount.income { color: #34C759; } .tx-amount.expense { color: #FF3B30; }
.tx-balance { font-size: 11px; color: var(--c-text-tertiary); }

/* 区块标题 */
.section-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.section-title { font-size: 17px; font-weight: 600; color: var(--c-text-primary); margin: 0; }
.section-desc { font-size: 13px; color: var(--c-text-tertiary); }
.group-title { font-size: 14px; font-weight: 600; color: var(--c-text-secondary); margin: 0 0 10px; }

/* 预算公示 */
.budget-group { margin-bottom: 22px; }
.budget-card { background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 14px; padding: 16px 20px; margin-bottom: 10px; }
.budget-card.open { border-color: rgba(94,196,172,.5); }
.budget-card.pending { border-color: rgba(255,159,10,.45); }
.bc-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
.bc-status { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px; }
.bc-status.open { background: rgba(94,196,172,.15); color: var(--c-accent); }
.bc-status.pending { background: rgba(255,159,10,.15); color: #b45309; }
.bc-status.passed { background: rgba(52,199,89,.14); color: #2f9e44; }
.bc-status.rejected { background: rgba(255,59,48,.12); color: #c92a2a; }
.bc-status.cancelled, .bc-status.spent { background: var(--c-bg-elevated); color: var(--c-text-tertiary); }
.bc-days { font-size: 13px; color: var(--c-accent); font-weight: 600; }
.bc-title { font-size: 16px; font-weight: 600; color: var(--c-text-primary); margin-bottom: 8px; }
.bc-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--c-text-secondary); margin-bottom: 8px; }
.bc-amount b { color: var(--c-text-primary); }
.bc-detail summary { font-size: 13px; color: var(--c-accent); cursor: pointer; margin-bottom: 6px; }
.mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mini-table td { padding: 6px 8px; border-bottom: 1px solid var(--c-border); color: var(--c-text-secondary); }
.mini-table td.num { text-align: right; color: var(--c-text-primary); }

.bc-vote { margin-top: 10px; border-top: 1px dashed var(--c-border); padding-top: 12px; }
.vote-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 6px; flex-wrap: wrap; gap: 6px; }
.vote-count { color: var(--c-text-secondary); }
.vote-count.veto { color: #c92a2a; font-weight: 600; }
.vote-line { font-size: 12px; color: var(--c-text-tertiary); }
.vote-bar { position: relative; height: 8px; background: var(--c-bg-elevated); border-radius: 4px; margin-bottom: 12px; }
.vote-fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--c-accent); border-radius: 4px; transition: width .3s; }
.vote-fill.veto { background: #ff3b30; }
.vote-marker { position: absolute; top: -3px; bottom: -3px; width: 2px; background: rgba(0,0,0,.35); }
.oppose-hint { font-size: 12px; color: var(--c-text-tertiary); margin: 4px 0; }
.oppose-done { font-size: 13px; color: #2f9e44; font-weight: 600; }
.oppose-actions { display: flex; gap: 10px; align-items: center; }
.btn-oppose { padding: 7px 16px; border-radius: 16px; border: 1px solid var(--c-accent); background: none; color: var(--c-accent); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .2s; }
.btn-oppose:hover { background: var(--c-accent); color: #fff; }
.btn-oppose.primary { background: var(--c-accent); color: #fff; }
.btn-oppose:disabled { opacity: .5; cursor: not-allowed; }
.btn-ghost { padding: 7px 14px; border-radius: 16px; border: 1px solid var(--c-border); background: none; color: var(--c-text-secondary); font-size: 13px; cursor: pointer; font-family: inherit; }
.oppose-form { margin-top: 4px; }
.oppose-reason { width: 100%; padding: 10px 12px; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-bg-elevated); color: var(--c-text-primary); font-size: 13px; font-family: inherit; resize: vertical; margin-bottom: 8px; box-sizing: border-box; }
.oppose-msg { font-size: 12px; color: var(--c-accent); }
.expose-ended { font-size: 12px; color: #b45309; }

/* 报销 */
.reimb-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px; flex-wrap: wrap; }
.reimb-form { background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 16px; padding: 18px 20px; margin-bottom: 18px; }
.form-title { font-size: 15px; font-weight: 600; color: var(--c-text-primary); margin: 0 0 14px; }
.form-row { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
.form-row.col { flex-direction: column; align-items: flex-start; }
.f-label { font-size: 13px; font-weight: 500; color: var(--c-text-secondary); min-width: 92px; }
.required-hint { font-size: 12px; color: var(--c-text-tertiary); margin: 0 0 10px; }
.voucher-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; width: 100%; }
.voucher-cell { border: 1px dashed var(--c-border); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.v-name { font-size: 13px; font-weight: 600; color: var(--c-text-primary); }
.v-upload { display: inline-block; text-align: center; }
.v-file { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.v-file a { color: var(--c-accent); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
.v-rm { background: none; border: none; color: var(--c-text-tertiary); cursor: pointer; font-size: 15px; }
.form-actions { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 6px; }
.reimb-list { display: flex; flex-direction: column; gap: 10px; }
.reimb-card { background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 14px; padding: 14px 18px; }
.rc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.rc-status { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 12px; }
.rc-status.submitted { background: rgba(255,159,10,.15); color: #b45309; }
.rc-status.approved { background: rgba(94,196,172,.15); color: var(--c-accent); }
.rc-status.paid { background: rgba(52,199,89,.14); color: #2f9e44; }
.rc-status.rejected { background: rgba(255,59,48,.12); color: #c92a2a; }
.rc-date { font-size: 12px; color: var(--c-text-tertiary); }
.rc-title { font-size: 15px; font-weight: 500; color: var(--c-text-primary); margin-bottom: 6px; }
.rc-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--c-text-secondary); margin-bottom: 6px; }
.rc-amount { font-weight: 600; color: var(--c-text-primary); margin-left: auto; }
.rc-foot { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.rc-note { font-size: 12px; color: var(--c-text-tertiary); }

/* 汇总 */
.period-bar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.sum-section { margin-bottom: 22px; }
.cat-bars, .act-bars { display: flex; flex-direction: column; gap: 10px; }
.cat-bar { display: flex; align-items: center; gap: 10px; }
.cat-name { width: 96px; font-size: 13px; color: var(--c-text-primary); flex-shrink: 0; }
.cat-track { flex: 1; height: 12px; background: var(--c-bg-elevated); border-radius: 6px; overflow: hidden; }
.cat-fill { height: 100%; border-radius: 6px; transition: width .3s; }
.cat-amt { width: 88px; text-align: right; font-size: 13px; font-weight: 600; color: var(--c-text-primary); flex-shrink: 0; }
.cat-pct { width: 52px; text-align: right; font-size: 12px; color: var(--c-text-tertiary); flex-shrink: 0; }
.act-bar { display: flex; align-items: center; gap: 12px; background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 12px; padding: 12px 16px; }
.act-name { font-size: 14px; font-weight: 500; color: var(--c-text-primary); flex: 1; }
.act-count { font-size: 12px; color: var(--c-text-tertiary); }
.act-amt { font-size: 14px; font-weight: 600; color: var(--c-accent); }

/* 弹层 */
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal { background: var(--c-bg-primary); border-radius: 16px; max-width: 560px; width: 100%; max-height: 80vh; overflow: auto; padding: 18px 20px; }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.modal-title { font-size: 15px; font-weight: 600; color: var(--c-text-primary); }
.modal-close { background: none; border: none; font-size: 20px; color: var(--c-text-tertiary); cursor: pointer; }
.modal-body { display: flex; flex-direction: column; gap: 8px; }
.voucher-link { display: block; padding: 10px 12px; background: var(--c-bg-elevated); border-radius: 10px; color: var(--c-accent); font-size: 13px; text-decoration: none; word-break: break-all; }
.modal-tip { font-size: 12px; color: var(--c-text-tertiary); margin: 8px 0 0; }

/* 流水详情弹层（有迹可循） */
.tx-item.clickable { cursor: pointer; transition: background .15s; }
.tx-item.clickable:hover { background: var(--c-bg-tertiary); }
.link-activity { color: var(--c-accent); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
.td-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px 14px; margin-bottom: 16px; }
.td-cell { display: flex; flex-direction: column; gap: 2px; }
.td-k { font-size: 11px; color: var(--c-text-tertiary); }
.td-v { font-size: 14px; font-weight: 600; color: var(--c-text-primary); }
.td-v.income { color: #2f9e44; }
.td-v.expense { color: #ff3b30; }
.td-rel { margin: 14px 0; }
.td-rel-k { font-size: 12px; font-weight: 700; color: var(--c-text-tertiary); margin-bottom: 6px; }
.td-rel-card { border: 1px solid var(--c-border); border-radius: 12px; padding: 12px 14px; cursor: pointer; transition: border-color .15s; }
.td-rel-card:hover { border-color: var(--c-accent); }
.td-rel-title { font-size: 14px; font-weight: 700; color: var(--c-text-primary); }
.td-rel-meta { font-size: 12px; color: var(--c-text-tertiary); margin-top: 3px; }
.td-rel-go { display: inline-block; margin-top: 8px; font-size: 12px; color: var(--c-accent); font-weight: 600; }
.td-items { margin-top: 8px; }
.td-none { font-size: 12px; color: var(--c-text-tertiary); }
.voucher-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.v-thumb { display: inline-flex; flex-direction: column; gap: 4px; width: 132px; border: 1px solid var(--c-border); border-radius: 10px; overflow: hidden; text-decoration: none; background: var(--c-bg-card); }
.v-thumb img { width: 100%; height: 88px; object-fit: cover; background: var(--c-bg-tertiary); }
.v-thumb em { font-style: normal; font-size: 11px; color: var(--c-text-secondary); padding: 0 6px 6px; }
.v-file-card { display: flex; align-items: center; justify-content: center; height: 88px; font-size: 12px; color: var(--c-text-secondary); padding: 0 6px; text-align: center; background: var(--c-bg-tertiary); word-break: break-all; }
.voucher-grid.big .v-thumb { width: 160px; }
.voucher-grid.big .v-thumb img, .voucher-grid.big .v-file-card { height: 104px; }
.hl-flash { animation: hlflash 2.4s ease; }
@keyframes hlflash { 0%, 55% { box-shadow: 0 0 0 2px var(--c-accent); } 100% { box-shadow: none; } }

/* v2 投票/工作台/对账/预警 */
.wb-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; margin-left: 5px; border-radius: 9px; background: #ff3b30; color: #fff; font-size: 11px; font-weight: 700; }
.vote-actions { display: flex; gap: 10px; margin-top: 4px; }
.btn-vote { padding: 6px 18px; border-radius: 16px; border: 1px solid var(--c-border); background: none; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; }
.btn-vote.for { color: #2f9e44; border-color: rgba(47,158,68,.5); }
.btn-vote.for:hover { background: rgba(47,158,68,.1); }
.btn-vote.against { color: #c92a2a; border-color: rgba(201,42,42,.5); }
.btn-vote.against:hover { background: rgba(201,42,42,.1); }
.btn-vote:disabled { opacity: .5; cursor: not-allowed; }
.vote-input { margin-top: 4px; }
.bc-reasons { margin-top: 10px; border-top: 1px dashed var(--c-border); padding-top: 8px; }
.reasons-k { font-size: 12px; font-weight: 600; color: var(--c-text-tertiary); margin-bottom: 4px; }
.reason-item { display: flex; gap: 6px; align-items: baseline; font-size: 12px; color: var(--c-text-secondary); padding: 2px 0; }
.reason-dot { flex-shrink: 0; }
.emergency-tag { display: inline-block; margin-top: 8px; padding: 2px 10px; border-radius: 10px; background: rgba(255,159,10,.15); color: #b45309; font-size: 12px; font-weight: 600; }
.tx-voucherno { padding: 0 8px; border-radius: 8px; background: var(--c-bg-elevated); color: var(--c-text-secondary); font-family: ui-monospace, Menlo, monospace; font-size: 11px; }
.rc-status.need_revision { background: rgba(255,159,10,.15); color: #b45309; }
.warn-bar { display: flex; align-items: center; gap: 8px; margin: 12px 0 16px; padding: 10px 14px; border-radius: 12px; background: rgba(255,59,48,.1); border: 1px solid rgba(255,59,48,.3); color: #c92a2a; font-size: 13px; font-weight: 500; }
.warn-icon { font-size: 15px; }
.wb-section { margin-bottom: 22px; }
.wb-panel { margin-top: 18px; background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 14px; padding: 16px 18px; }
.wb-actions { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.rc-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px 12px; align-items: center; margin-bottom: 12px; }
.rc-form-grid .f-label { min-width: 0; }
.rc-form-grid .btn-oppose { align-self: end; }
.rc-records { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.rc-record { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; font-size: 13px; background: var(--c-bg-elevated); border-radius: 10px; padding: 8px 12px; }
.rc-rec-date { font-weight: 600; color: var(--c-text-primary); }
.rc-rec-bal { font-weight: 700; color: var(--c-accent); }
.rc-rec-note { font-size: 12px; color: var(--c-text-tertiary); }
.rc-compare { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-top: 10px; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; }
.rc-compare.ok { background: rgba(47,158,68,.12); color: #2f9e44; }
.rc-compare.warn { background: rgba(255,159,10,.15); color: #b45309; }

/* 空态 */
.empty-state { text-align: center; padding: 48px 20px; color: var(--c-text-tertiary); }
.empty-state p { font-size: 15px; margin: 0; }

/* 响应式 */
@media (max-width: 640px) {
  .finance-page { padding: 0 16px 80px; }
  .balance-card { padding: 22px 20px; flex-direction: column; align-items: flex-start; gap: 14px; }
  .balance-amount { font-size: 30px; }
  .balance-stats { gap: 22px; width: 100%; }
  .tx-item { padding: 13px 14px; flex-wrap: wrap; }
  .tx-right { flex-direction: row; gap: 10px; }
  .tx-balance { display: none; }
  .f-label { min-width: 0; width: 100%; }
  .cat-name { width: 72px; }
  .cat-amt { width: 76px; }
}
</style>
