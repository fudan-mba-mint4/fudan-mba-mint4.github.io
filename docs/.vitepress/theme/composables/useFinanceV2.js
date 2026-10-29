// 财务 v2 共享数据层：四个页面（账页/预算公示/我的报销/财务工作台）共用的
// 三语 i18n、finance-v2 拉取、常用派生数据与工具函数。
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vitepress'
import { useLang } from './useLang.js'
import { useAuth } from './useAuth.js'
import { sortByDateDesc, formatShortDate, formatLongDate } from '../utils/dateUtils.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'
import { useData } from './useData.js'
import { markRead } from './useUnread.js'

export const financeI18n = {
  zh: {
    tabTx: '收支明细', tabBudget: '预算公示', tabReimb: '我的报销', tabSummary: '汇总',
    navLedger: '班费账页', navBudgets: '预算公示', navReimb: '我的报销', navWorkbench: '财务工作台',
    balance: '当前余额', income: '总收入', expense: '总支出',
    all: '全部', incomeOnly: '收入', expenseOnly: '支出',
    details: '收支明细', noRecords: '暂无收支记录',
    category: '类别', description: '项目', amount: '金额', payer: '经手人', checker: '复核人', date: '日期',
    activity: '关联活动', balanceCol: '余额', voucher: '凭证', noVoucher: '无凭证',
    filterCategory: '性质大类', filterMonth: '月份', filterActivity: '活动',
    running: '累计余额',
    categories: {
      dining: '餐饮费', marketing: '宣传物料', transport: '交通费', venue: '场地设备',
      speaker: '讲师嘉宾', lodging: '住宿', ticket: '门票', prize: '奖品纪念品',
      insurance: '保险', supplies: '物资文具', other: '其他',
      tuition: '班费缴纳', sponsor: '赞助/奖金', interest: '利息收入',
    },
    budgetTitle: '预算公示', budgetDesc: '支出前公示 ≥3 日，实名异议，反对达 1/3 不可动用班费',
    inProgress: '公示中', pendingSettle: '待结算', history: '历史公示',
    budgetUpper: '预算上限', proposer: '申请方', items: '预算明细', exposeDaysLeft: '剩余 {n} 天',
    exposeEnded: '公示已结束，待财务结算',
    budgetPassed: '已通过', budgetRejected: '已否决', budgetCancelled: '已取消', budgetSpent: '已执行',
    reimbTitle: '报销', reimbDesc: '线上提交凭证 → 财务审批 → 线下打款 → 入账公示',
    newReimb: '新建报销', submit: '提交', submitting: '提交中…',
    reimbFormTitle: '新建报销单', reimbActivity: '关联活动', reimbBudget: '关联预算公示',
    reimbDate: '消费日期', reimbAmount: '报销金额（元）', reimbCategory: '支出大类', reimbDesc: '事项描述',
    reimbVouchers: '报销凭证', requiredHint: '金额 ≥ {n} 元必传：{list}', requiredHintSmall: '金额 < {n} 元必传：{list}',
    uploadVoucher: '上传', uploaded: '已上传', remove: '移除',
    vInvoice: '发票', vPayment: '付款凭证', vReceipt: '收据/小票', vOther: '其他凭证',
    statusSubmitted: '待审批', statusApproved: '已通过', statusPaid: '已打款', statusRejected: '已驳回',
    myReimb: '我的报销单', allReimb: '全部报销单（财务）', emptyReimb: '暂无报销记录',
    applyDate: '提交时间', auditNote: '审批意见', noLoginReimb: '请先登录后提交报销',
    successSubmitted: '报销已提交，等待财务审批',
    summaryTitle: '收支汇总', period: '统计周期', periodAll: '全部', periodMonth: '按月', periodSemester: '按学期',
    semFall: '秋季学期', semSpring: '春季学期', byCategory: '支出按性质大类', byActivity: '支出按活动',
    expenseBy: '支出构成', noExpense: '暂无支出',
    loading: '加载中…', loadFailed: '加载失败，请稍后重试', retry: '重试',
    loginFirst: '请先登录', close: '关闭',
    detail: '详情', viewDetail: '查看详情', relatedActivity: '关联活动', relatedBudget: '关联预算公示',
    relatedReimb: '关联报销单', noRelation: '未关联活动/预算（如班费缴纳等非活动收支）', openVoucher: '查看凭证', jumpTo: '前往',
    voteFor: '赞成', voteAgainst: '反对', voteForDone: '已投赞成', voteAgainstDone: '已投反对',
    voteConfirm: '投票一经提交不可撤回、不可改投，确认提交吗？', myVote: '我的投票',
    uncommitted: '未表态 {n}', vetoLineV2: '反对达 {n} 票即否决',
    forCount: '赞成 {n}', againstCount: '反对 {n}',
    reasonsTitle: '反对留言（匿名公开）', noReasons: '暂无反对留言',
    emergencyTag: '紧急·事后补公示', voteReasonHint: '反对理由（可选，将匿名公开，不可撤回）',
    statusNeedRevision: '待补正', needRevise: '修改重新提交',
    /* v2 预算公示：全员发起 → 会计审批 → 公开投票 */
    tabAllBudgets: '全部公示', tabMyBudgets: '我提交的公示',
    newBudgetPropose: '发起公示', proposeTitle: '发起预算公示（支出前公示 3 天征集反对）',
    proposeHint: '提交后由会计（程枭）审核资料，齐全后公开进入 3 天全员投票期',
    formActivityName: '活动/事项名称', formGroup: '申请小组/部门', formApplicant: '申请人',
    formContact: '联系方式（选填）', formEventType: '事项性质', formActivityType: '活动类型',
    formPayTarget: '资金支付对象', formBudgetAmount: '预算总上限金额（元）',
    formDetailTitle: '预算明细清单', itemName: '支出项目', qty: '数量', unitPrice: '单价(元)',
    itemAmount: '小计(元)', itemCategory: '费用性质分类', itemNote: '备注/明细说明',
    addItem: '+ 添加一行', removeItem: '删除本行', total: '合计',
    redlineTitle: '财务红线核对（3 项必须逐项确认）',
    redline1: '本预算不含聚餐、旅行类活动的餐饮费、住宿费（此类费用参加人 AA，严禁使用班费）',
    redline2: '本预算已包含所有相关的公共支出（宣传物料、策划费、摄影摄像等）',
    redline3: '同一活动的多笔支出已全部合并在此公示中（严禁拆分规避公示）',
    redlineConfirm: '已确认', submitBudget: '提交公示',
    successSubmittedBudget: '预算公示已提交，待会计审核',
    statusSubmitted: '待审批', statusReturned: '已退回', statusDraft: '草稿（未提交）', returnedReason: '退回原因',
    saveDraft: '保存草稿', draftSaved: '草稿已保存', continueEdit: '继续填写',
    resubmit: '修改并重新提交', mySubmitEmpty: '你还没有提交过预算公示',
    endorsementTitle: '签字背书（大额无发票时必填）', endorserName: '背书班委姓名',
    endorserHint: '≥¥{n} 且无发票时：付款凭证 + 盖章收据/小票 + 经办人与 1 名班委签字背书',
    tabWorkbench: '财务工作台', workbenchDesc: '按登录角色显示待办（会计/出纳视图不同）',
    accountantView: '会计工作台', cashierView: '出纳工作台',
    pendingAuditQ: '待审核 {n}', pendingPayQ: '待付款 {n}',
    approve: '通过', revision: '退回补正', reject: '驳回',
    confirmPay: '确认已打款', payNeed: '请先在支付宝小荷包完成实际打款，再点击确认',
    reconcile: '登记小荷包变动', reconcileTitle: '小荷包变动登记', actualBalance: '小荷包实际余额',
    ledgerBalance: '台账余额', reconcileDiff: '差额', reconcileMatch: '账实相符',
    reconcileNote: '备注', reconcileLinked: '关联', reconcileBy: '登记人',
    txIncome: '小荷包收入', txExpense: '小荷包支出',
    needBudgetForExpense: '支出必须关联预算公示（财务制度：先公示后花钱）',
    txCount: '总笔数', incomeTx: '收入笔数', expenseTx: '支出笔数', itemDetail: '支出明细',
    warnLine: '余额预警', lowBalance: '余额不足 ¥{n}，建议启动补充班费表决',
    voucherNo: '凭证编号', initialBalance: '期初班费',
  },
  en: {
    tabTx: 'Transactions', tabBudget: 'Budgets', tabReimb: 'Reimbursement', tabSummary: 'Summary',
    navLedger: 'Ledger', navBudgets: 'Budgets', navReimb: 'Reimbursement', navWorkbench: 'Workbench',
    balance: 'Balance', income: 'Total Income', expense: 'Total Expense',
    all: 'All', incomeOnly: 'Income', expenseOnly: 'Expense',
    details: 'History', noRecords: 'No transactions yet',
    category: 'Category', description: 'Item', amount: 'Amount', payer: 'Handler', checker: 'Reviewer', date: 'Date',
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
    exposeEnded: 'Disclosure ended, pending settlement',
    budgetPassed: 'Approved', budgetRejected: 'Vetoed', budgetCancelled: 'Cancelled', budgetSpent: 'Executed',
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
    loginFirst: 'Please log in first', close: 'Close',
    detail: 'Details', viewDetail: 'View details', relatedActivity: 'Related activity', relatedBudget: 'Related budget',
    relatedReimb: 'Related claim', noRelation: 'Not linked to any activity/budget', openVoucher: 'View vouchers', jumpTo: 'Open',
    voteFor: 'For', voteAgainst: 'Against', voteForDone: 'Voted for', voteAgainstDone: 'Voted against',
    voteConfirm: 'Votes are final and cannot be changed. Confirm?', myVote: 'My vote',
    uncommitted: '{n} not voted', vetoLineV2: 'Veto at {n} against votes',
    forCount: '{n} for', againstCount: '{n} against',
    reasonsTitle: 'Against comments (anonymous)', noReasons: 'No comments yet',
    emergencyTag: 'Emergency · post-disclosure', voteReasonHint: 'Reason (optional, shown anonymously, final)',
    statusNeedRevision: 'Revision needed', needRevise: 'Edit & resubmit',
    /* v2 budget: everyone submits → accountant approves → public vote */
    tabAllBudgets: 'All budgets', tabMyBudgets: 'My submissions',
    newBudgetPropose: 'Submit a budget', proposeTitle: 'New budget disclosure (≥3 days before spending)',
    proposeHint: 'After submission, accountant (程枭) reviews; once complete it goes public for a 3-day vote',
    formActivityName: 'Activity / item name', formGroup: 'Applying group / dept', formApplicant: 'Applicant',
    formContact: 'Contact (optional)', formEventType: 'Nature of item', formActivityType: 'Activity type',
    formPayTarget: 'Payee', formBudgetAmount: 'Budget cap (¥)',
    formDetailTitle: 'Budget breakdown', itemName: 'Item', qty: 'Qty', unitPrice: 'Unit price',
    itemAmount: 'Subtotal', itemCategory: 'Category', itemNote: 'Notes',
    addItem: '+ Add row', removeItem: 'Remove row', total: 'Total',
    redlineTitle: 'Finance red-line checklist (all 3 must be confirmed)',
    redline1: 'No dining/lodging for group meals or trips (paid by attendees, class funds forbidden)',
    redline2: 'All related public expenses included (materials, planning, photo/video, etc.)',
    redline3: 'All expenses of the same activity merged into this disclosure (no splitting to evade review)',
    redlineConfirm: 'Confirmed', submitBudget: 'Submit',
    successSubmittedBudget: 'Budget submitted, pending accountant review',
    statusSubmitted: 'Pending', statusReturned: 'Returned', statusDraft: 'Draft', returnedReason: 'Return reason',
    saveDraft: 'Save draft', draftSaved: 'Draft saved', continueEdit: 'Continue editing',
    resubmit: 'Edit & resubmit', mySubmitEmpty: 'No budget submissions yet',
    endorsementTitle: 'Endorsement (required when ≥¥{n} without invoice)', endorserName: 'Endorsing committee name',
    endorserHint: '≥¥{n} without invoice: payment proof + stamped receipt + endorser (applicant + 1 committee)',
    tabWorkbench: 'Finance Workbench', workbenchDesc: 'To-dos by role (accountant / cashier views differ)',
    accountantView: 'Accountant desk', cashierView: 'Cashier desk',
    pendingAuditQ: '{n} to review', pendingPayQ: '{n} to pay',
    approve: 'Approve', revision: 'Request revision', reject: 'Reject',
    confirmPay: 'Confirm paid', payNeed: 'Complete the actual payment in Alipay pocket first, then confirm',
    reconcile: 'Record pocket change', reconcileTitle: 'Pocket change', actualBalance: 'Actual pocket balance',
    ledgerBalance: 'Ledger balance', reconcileDiff: 'Diff', reconcileMatch: 'Matched',
    reconcileNote: 'Note', reconcileLinked: 'Linked', reconcileBy: 'By',
    txIncome: 'Pocket income', txExpense: 'Pocket expense',
    needBudgetForExpense: 'Expense must be linked to a disclosed budget (rule: disclose first)',
    txCount: 'Total Tx', incomeTx: 'Income Tx', expenseTx: 'Expense Tx', itemDetail: 'Detail Items',
    warnLine: 'Balance warning', lowBalance: 'Balance below ¥{n}, consider collecting extra dues',
    voucherNo: 'Voucher #', initialBalance: 'Opening balance',
  },
  th: {
    tabTx: 'รายการ', tabBudget: 'งบประมาณ', tabReimb: 'เบิกจ่าย', tabSummary: 'สรุป',
    navLedger: 'บัญชี', navBudgets: 'งบประมาณ', navReimb: 'เบิกจ่าย', navWorkbench: 'แผงงาน',
    balance: 'ยอดคงเหลือ', income: 'รายรับรวม', expense: 'รายจ่ายรวม',
    all: 'ทั้งหมด', incomeOnly: 'รายรับ', expenseOnly: 'รายจ่าย',
    details: 'ประวัติ', noRecords: 'ยังไม่มีรายการ',
    category: 'หมวดหมู่', description: 'รายการ', amount: 'จำนวน', payer: 'ผู้ดำเนินการ', checker: 'ผู้ตรวจ', date: 'วันที่',
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
    exposeEnded: 'สิ้นสุดการเปิดเผย รอสรุป',
    budgetPassed: 'ผ่าน', budgetRejected: 'คัดค้าน', budgetCancelled: 'ยกเลิก', budgetSpent: 'ดำเนินการแล้ว',
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
    loginFirst: 'กรุณาเข้าสู่ระบบก่อน', close: 'ปิด',
    detail: 'รายละเอียด', viewDetail: 'ดูรายละเอียด', relatedActivity: 'กิจกรรมที่เกี่ยวข้อง', relatedBudget: 'งบประมาณที่เกี่ยวข้อง',
    relatedReimb: 'การเบิกจ่ายที่เกี่ยวข้อง', noRelation: 'ไม่ผูกกับกิจกรรม/งบประมาณ', openVoucher: 'ดูหลักฐาน', jumpTo: 'ไป',
    voteFor: 'เห็นด้วย', voteAgainst: 'คัดค้าน', voteForDone: 'โหวตเห็นด้วยแล้ว', voteAgainstDone: 'โหวตคัดค้านแล้ว',
    voteConfirm: 'การโหวตส่งแล้วไม่สามารถแก้ไข ยืนยันหรือไม่', myVote: 'การโหวตของฉัน',
    uncommitted: 'ยังไม่โหวต {n}', vetoLineV2: 'คัดค้านถึง {n} เสียง ห้ามใช้',
    forCount: 'เห็นด้วย {n}', againstCount: 'คัดค้าน {n}',
    reasonsTitle: 'ความคิดเห็นคัดค้าน (ไม่ระบุชื่อ)', noReasons: 'ยังไม่มีความคิดเห็น',
    emergencyTag: 'ฉุกเฉิน · เปิดเผยหลังใช้จ่าย', voteReasonHint: 'เหตุผล (ไม่บังคับ เปิดเผยไม่ระบุชื่อ แก้ไขไม่ได้)',
    statusNeedRevision: 'รอแก้ไข', needRevise: 'แก้ไขแล้วส่งใหม่',
    /* v2 งบประมาณ: ทุกคนส่ง → บัญชีอนุมัติ → โหวตสาธารณะ */
    tabAllBudgets: 'งบประมาณทั้งหมด', tabMyBudgets: 'รายการที่ฉันส่ง',
    newBudgetPropose: 'ส่งงบประมาณ', proposeTitle: 'เปิดเผยงบประมาณใหม่ (≥3 วันก่อนใช้จ่าย)',
    proposeHint: 'ส่งแล้ว บัญชี (程枭) ตรวจเอกสาร แล้วเปิดสาธารณะโหวต 3 วัน',
    formActivityName: 'ชื่อกิจกรรม/รายการ', formGroup: 'กลุ่ม/แผนกที่ยื่น', formApplicant: 'ผู้ยื่น',
    formContact: 'ติดต่อ (ไม่บังคับ)', formEventType: 'ลักษณะรายการ', formActivityType: 'ประเภทกิจกรรม',
    formPayTarget: 'ผู้รับเงิน', formBudgetAmount: 'วงเงินสูงสุด (หยวน)',
    formDetailTitle: 'รายละเอียดงบประมาณ', itemName: 'รายการ', qty: 'จำนวน', unitPrice: 'ราคาหน่วย',
    itemAmount: 'รวมย่อย', itemCategory: 'หมวดค่าใช้จ่าย', itemNote: 'หมายเหตุ',
    addItem: '+ เพิ่มแถว', removeItem: 'ลบแถว', total: 'รวม',
    redlineTitle: 'เช็กลิสต์红线การเงิน (ยืนยันทั้ง 3 ข้อ)',
    redline1: 'ไม่มีค่าอาหาร/ที่พักของมื้อรวมหรือทริป (ผู้เข้าร่วมจ่ายเอง ห้ามใช้เงินชั้นเรียน)',
    redline2: 'รวมค่าใช้จ่ายสาธารณะที่เกี่ยวข้องทั้งหมดแล้ว',
    redline3: 'รวมค่าใช้จ่ายทั้งหมดของกิจกรรมเดียวในนี้ (ห้ามแยกเพื่อเลี่ยงการตรวจสอบ)',
    redlineConfirm: 'ยืนยันแล้ว', submitBudget: 'ส่ง',
    successSubmittedBudget: 'ส่งงบประมาณแล้ว รอการตรวจสอบ',
    statusSubmitted: 'รออนุมัติ', statusReturned: 'ถูกส่งกลับ', statusDraft: 'ร่าง', returnedReason: 'เหตุผลที่ส่งกลับ',
    saveDraft: 'บันทึกร่าง', draftSaved: 'บันทึกร่างแล้ว', continueEdit: 'แก้ไขต่อ',
    resubmit: 'แก้ไขแล้วส่งใหม่', mySubmitEmpty: 'ยังไม่มีงบประมาณที่ส่ง',
    endorsementTitle: 'การรับรอง (บังคับเมื่อ ≥{n} ไม่มีใบกำกับ)', endorserName: 'ชื่อกรรมการผู้รับรอง',
    endorserHint: '≥{n} ไม่มีใบกำกับ: หลักฐานชำระ + ใบเสร็จ + ผู้ยื่นกับกรรมการ 1 คนรับรอง',
    tabWorkbench: 'แผงงานการเงิน', workbenchDesc: 'งานตามบทบาท (มุมมองบัญชี/แคชเชียร์ต่างกัน)',
    accountantView: 'งานบัญชี', cashierView: 'งานแคชเชียร์',
    pendingAuditQ: 'รออนุมัติ {n}', pendingPayQ: 'รอโอน {n}',
    approve: 'อนุมัติ', revision: 'ขอแก้ไข', reject: 'ไม่อนุมัติ',
    confirmPay: 'ยืนยันโอนแล้ว', payNeed: 'โอนเงินใน Alipay pocket จริงก่อน แล้วกดยืนยัน',
    reconcile: 'บันทึกการเปลี่ยนแปลง pocket', reconcileTitle: 'บันทึก pocket', actualBalance: 'ยอด pocket จริง',
    ledgerBalance: 'ยอดบัญชี', reconcileDiff: 'ส่วนต่าง', reconcileMatch: 'ตรงกัน',
    reconcileNote: 'หมายเหตุ', reconcileLinked: 'ผูก', reconcileBy: 'โดย',
    txIncome: 'รายรับ pocket', txExpense: 'รายจ่าย pocket',
    needBudgetForExpense: 'รายจ่ายต้องผูกงบประมาณ (กฎ: เปิดเผยก่อนใช้จ่าย)',
    txCount: 'รายการรวม', incomeTx: 'รายรับ', expenseTx: 'รายจ่าย', itemDetail: 'รายละเอียด',
    warnLine: 'เตือนยอดคงเหลือ', lowBalance: 'ยอดต่ำกว่า ¥{n} แนะนำเก็บเงินเพิ่ม',
    voucherNo: 'เลขที่หลักฐาน', initialBalance: 'ยอดเปิดบัญชี',
  },
}

export function useFinanceV2() {
  const { lang: currentLang, t } = useLang(financeI18n)
  const { currentUser, authToken, isAuthenticated, getToken } = useAuth()
  const router = useRouter()

  const financeData = ref(null)
  const loading = ref(true)
  const error = ref(false)
  const nowTs = ref(Date.now())
  const { data: activitiesData } = useData('/data/activities.json', { dbUrl: '/api/activities-db' })

  // 「我提交的公示」：独立接口（含未公开的 submitted/returned）
  const myBudgets = ref([])
  async function loadMyBudgets() {
    if (!isAuthenticated.value || !getToken()) { myBudgets.value = []; return }
    try {
      const res = await fetchWithRetry('/api/finance/budgets?mine=1', {
        headers: { Authorization: `Bearer ${getToken()}` }, signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return
      const j = await res.json()
      myBudgets.value = j.budgets || []
    } catch (e) { /* 静默 */ }
  }

  async function loadFinance() {
    loading.value = true
    error.value = false
    try {
      const headers = isAuthenticated.value && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
      const res = await fetchWithRetry('/api/finance-v2', { signal: AbortSignal.timeout(8000), headers })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      financeData.value = await res.json()
      nowTs.value = Date.now()
      await loadMyBudgets()
      markRead('finance', (financeData.value?.transactions || []).map(t => String(t.id)))
    } catch (e) {
      error.value = true
    } finally {
      loading.value = false
    }
  }
  onMounted(loadFinance)

  const transactions = computed(() => financeData.value?.transactions || [])
  const budgets = computed(() => financeData.value?.budgets || [])
  const reimbursements = computed(() => financeData.value?.reimbursements || [])
  const reconcilations = computed(() => financeData.value?.reconcilations || [])
  const canViewAllReimb = computed(() => !!financeData.value?.canViewAllReimb)
  const workbench = computed(() => financeData.value?.workbench || {})
  const myVotesMap = computed(() => financeData.value?.myVotes || {})
  const config = computed(() => financeData.value?.config || { classSize: 69, largeAmount: 500, largeVouchers: ['invoice', 'payment'], smallVouchers: ['payment', 'receipt'], warnLine: 2000 })
  const myVote = (id) => myVotesMap.value[id] || ''
  const votedByMe = (id) => !!myVotesMap.value[id]

  const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
  const totalExpense = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
  const balance = computed(() => totalIncome.value - totalExpense.value)
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

  const filterType = ref('all')
  const filterCategory = ref('all')
  const filterMonth = ref('all')
  const filterActivity = ref('all')
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
  const formatFullDate = (d) => formatLongDate(d, currentLang.value)
  const catLabel = (c) => t.value.categories[c] || c || '—'
  const isImage = (u) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u || '')
  const voucherTypeLabel = (type) => t.value['v' + type[0].toUpperCase() + type.slice(1)] || type
  const reimbStatusLabel = (s) => t.value['status' + s[0].toUpperCase() + s.slice(1)] || s

  const activitiesMap = computed(() => {
    const src = activitiesData.value?.activities || []
    const m = {}
    src.forEach(a => { m[a.id] = a })
    return m
  })
  const activityTitle = (id) => {
    const a = activitiesMap.value[id]
    if (!a) return id
    return a.title?.[currentLang.value] || a.title?.zh || a.title || id
  }

  const budgetsMap = computed(() => { const m = {}; budgets.value.forEach(b => { m[b.id] = b }); return m })
  const reimbMap = computed(() => { const m = {}; reimbursements.value.forEach(r => { m[r.id] = r }); return m })

  const gotoActivity = (id) => { if (id) router.push({ path: '/activities/', query: { focus: id } }) }
  const gotoBudget = (id) => { if (id) router.push({ path: '/finance/budgets/', query: { focus: id } }) }
  const gotoReimb = (id) => { if (id) router.push({ path: '/finance/reimb/', query: { focus: id } }) }

  const budgetStatusText = (b) => b.status === 'passed' ? t.value.budgetPassed : b.status === 'rejected' ? t.value.budgetRejected : b.status === 'cancelled' ? t.value.budgetCancelled : b.status === 'submitted' ? t.value.statusSubmitted : b.status === 'returned' ? t.value.statusReturned : b.status === 'draft' ? t.value.statusDraft : t.value.budgetSpent
  const passedBudgets = computed(() => budgets.value.filter(b => b.status === 'passed'))
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

  /* 汇总 */
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

  /* 工作台辅助 */
  const pendingAudits = computed(() => reimbursements.value.filter(r => r.status === 'submitted'))
  const pendingPays = computed(() => reimbursements.value.filter(r => r.status === 'approved'))
  const ledgerBalanceNow = computed(() => transactions.value.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0))
  const lastRc = computed(() => [...reconcilations.value].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null)
  const rcDiff = computed(() => lastRc.value ? Number(lastRc.value.actualBalance) - ledgerBalanceNow.value : null)
  const nowIso = () => new Date().toISOString().slice(0, 10)

  return {
    currentLang, t, currentUser, authToken, isAuthenticated, getToken, router,
    financeData, loading, error, nowTs, loadFinance,
    myBudgets, loadMyBudgets,
    transactions, budgets, reimbursements, reconcilations, canViewAllReimb,
    workbench, myVotesMap, config, myVote, votedByMe,
    totalIncome, totalExpense, balance, balanceMap, months, activitiesWithTx,
    filterType, filterCategory, filterMonth, filterActivity, filtered,
    formatAmount, formatDate, formatFullDate, catLabel, isImage, voucherTypeLabel, reimbStatusLabel,
    activitiesMap, activityTitle, budgetsMap, reimbMap,
    gotoActivity, gotoBudget, gotoReimb, budgetStatusText, passedBudgets,
    openBudgets, pendingSettleBudgets, doneBudgets, daysLeft, exposeStatus,
    period, monthSel, semSel, semesters, periodTx, pIncome, pExpense, pBalance,
    catBreakdown, actBreakdown, catPalette,
    pendingAudits, pendingPays, ledgerBalanceNow, lastRc, rcDiff, nowIso,
  }
}
