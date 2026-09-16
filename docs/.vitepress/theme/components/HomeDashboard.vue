<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useData } from '../composables/useData.js'
import classData from '../../../public/data/class-members.json'

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    // 通用
    viewAll: '查看全部',
    backToTop: '回到顶部',
    noAnnouncements: '暂无公告',
    categoryMap: { important: '重要', academic: '教学', normal: '通知', event: '活动' },
    // 班级身份卡
    className: '薄荷 4 班',
    classFull: '复旦大学 MBA 2026 级',
    slogan: '4 the Best, for the Future.',
    // 课表
    scheduleTitle: '近期课程',
    scheduleSubtitle: '实时同步校历',
    today: '今天',
    tomorrow: '明天',
    daysLater: '天后',
    classroom: '教室',
    instructor: '授课教师',
    clickForDetails: '点击查看详情',
    collapseDetails: '收起详情',
    scheduleError: '加载失败，请稍后重试',
    retry: '重试',
    // 快速入口
    quickLinksTitle: '快速入口',
    links: {
      schedule: '课表',
      announcements: '公告',
      slides: '课程资料',
      activities: '活动',
      gallery: '相册',
      finance: '班费',
    },
    // 倒计时
    countdownTitle: '距离下次上课',
    semesterProgress: '学期进度',
    days: '天',
    // 作业
    homeworkTitle: '作业待办',
    noHomework: '暂无待办作业',
    day: '天',
    // 传承人
    mentorsTitle: '传承人',
    mentorsSubtitle: '感谢每一位的付出',
    viewDirectory: '查看名录',
    // 公告
    announcementsTitle: '最新公告',
    announcementsSubtitle: '班级通知与动态',
    // 相册
    galleryTitle: '活动相册',
    gallerySubtitle: '记录班级精彩瞬间',
    // 口号卡
    cultureTitle: '班级文化',
    values: '学习成长 · 资源共享 · 团结互助 · 追求卓越',
    // 班费
    financeTitle: '班费公开',
    financeSubtitle: '透明管理，每一笔都有迹可循',
    balance: '当前余额',
    income: '本学期收入',
    expense: '本学期支出',
    incomeDetail: '班费缴纳 ¥21,702.30',
    expenseDetail: '见面会 ¥11,761.40 + 团建聚餐 ¥9,940.90',
    // 空状态
    scheduleEmpty: '本学期课程已结束',
    noUpcoming: '暂无即将开始的课程',
    loadingSchedule: '加载课表中',
  },
  en: {
    viewAll: 'View All',
    backToTop: 'Back to Top',
    noAnnouncements: 'No announcements yet',
    categoryMap: { important: 'Important', academic: 'Academic', normal: 'Notice', event: 'Event' },
    className: 'Mint 4',
    classFull: 'Fudan University MBA Class of 2026',
    slogan: '4 the Best, for the Future.',
    scheduleTitle: 'Upcoming Classes',
    scheduleSubtitle: 'Synced with academic calendar',
    today: 'Today',
    tomorrow: 'Tomorrow',
    daysLater: 'days left',
    classroom: 'Classroom',
    instructor: 'Instructor',
    clickForDetails: 'Click for details',
    collapseDetails: 'Collapse',
    scheduleError: 'Failed to load, please retry',
    retry: 'Retry',
    quickLinksTitle: 'Quick Links',
    links: {
      schedule: 'Schedule',
      announcements: 'Announcements',
      slides: 'Course Materials',
      activities: 'Activities',
      gallery: 'Gallery',
      finance: 'Finance',
    },
    countdownTitle: 'Next Class In',
    semesterProgress: 'Semester Progress',
    days: 'days',
    homeworkTitle: 'Homework',
    noHomework: 'No pending homework',
    day: 'day',
    mentorsTitle: 'Mentors',
    mentorsSubtitle: 'With gratitude for your dedication',
    viewDirectory: 'View Directory',
    announcementsTitle: 'Announcements',
    announcementsSubtitle: 'Class news and updates',
    galleryTitle: 'Photo Gallery',
    gallerySubtitle: 'Capturing class moments',
    cultureTitle: 'Class Culture',
    values: 'Growth · Sharing · Unity · Excellence',
    financeTitle: 'Class Fund',
    financeSubtitle: 'Transparent management, every cent accounted for',
    balance: 'Balance',
    income: 'Income',
    expense: 'Expense',
    incomeDetail: 'Class dues ¥21,702.30',
    expenseDetail: 'Welcome dinner ¥11,761.40 + Teambuilding ¥9,940.90',
    scheduleEmpty: 'Semester classes ended',
    noUpcoming: 'No upcoming classes',
    loadingSchedule: 'Loading schedule',
  },
  th: {
    viewAll: 'ดูทั้งหมด',
    backToTop: 'กลับไปด้านบน',
    noAnnouncements: 'ไม่มีประกาศ',
    categoryMap: { important: 'สำคัญ', academic: 'การเรียน', normal: 'แจ้งเตือน', event: 'กิจกรรม' },
    className: 'มินต์ 4',
    classFull: 'มหาวิทยาลัยฟูตาน MBA รุ่น 2026',
    slogan: '4 the Best, for the Future.',
    scheduleTitle: 'คาบเรียนที่กำลังจะมา',
    scheduleSubtitle: 'ซิงค์กับปฏิทินการศึกษา',
    today: 'วันนี้',
    tomorrow: 'พรุ่งนี้',
    daysLater: 'วัน',
    classroom: 'ห้องเรียน',
    instructor: 'อาจารย์ผู้สอน',
    clickForDetails: 'คลิกดูรายละเอียด',
    collapseDetails: 'ย่อรายละเอียด',
    scheduleError: 'โหลดไม่สำเร็จ โปรดลองใหม่',
    retry: 'ลองใหม่',
    quickLinksTitle: 'ลิงก์ด่วน',
    links: {
      schedule: 'ตารางเรียน',
      announcements: 'ประกาศ',
      slides: 'เอกสารรายวิชา',
      activities: 'กิจกรรม',
      gallery: 'อัลบั้ม',
      finance: 'การเงิน',
    },
    countdownTitle: 'อีกกี่วันถึงคาบเรียนถัดไป',
    semesterProgress: 'ความคืบหน้าเทอม',
    days: 'วัน',
    homeworkTitle: 'การบ้าน',
    noHomework: 'ไม่มีการบ้านค้าง',
    day: 'วัน',
    mentorsTitle: 'ผู้ให้คำปรึกษา',
    mentorsSubtitle: 'ขอบคุณสำหรับความอุทิศตน',
    viewDirectory: 'ดูสารบัญ',
    announcementsTitle: 'ประกาศล่าสุด',
    announcementsSubtitle: 'ข่าวสารและอัปเดตของชั้น',
    galleryTitle: 'อัลบั้มรูป',
    gallerySubtitle: 'บันทึกช่วงเวลาที่ยอดเยี่ยม',
    cultureTitle: 'วัฒนธรรมชั้นเรียน',
    values: 'การเติบโต · การแบ่งปัน · ความสามัคคี · ความเป็นเลิศ',
    financeTitle: 'กองทุนชั้นเรียน',
    financeSubtitle: 'การจัดการโปร่งใส ทุกบัญชีมีหลักฐาน',
    balance: 'ยอดคงเหลือ',
    income: 'รายรับ',
    expense: 'รายจ่าย',
    incomeDetail: 'ค่าชั้นเรียน ¥21,702.30',
    expenseDetail: 'งานต้อนรับ ¥11,761.40 + กิจกรรมสร้างทีม ¥9,940.90',
    scheduleEmpty: 'คาบเรียนเทมนี้จบแล้ว',
    noUpcoming: 'ไม่มีคาบเรียนที่กำลังจะมา',
    loadingSchedule: 'กำลังโหลดตารางเรียน',
  },
}

const { lang: currentLang, t } = useLang(i18n)

const langPrefix = computed(() => {
  if (currentLang.value === 'en') return '/en'
  if (currentLang.value === 'th') return '/th'
  return ''
})

/* ========== 课表数据（真实） ========== */
const scheduleData = ref(null)
const scheduleLoading = ref(true)
const scheduleError = ref(false)

/* ========== 作业数据 ========== */
const homeworkData = ref([])

/* ========== 班费数据（从finance.json读取） ========== */
const { data: financeRaw } = useData('/data/finance.json')
const financeData = computed(() => {
  const txs = financeRaw.value?.transactions || []
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { balance: income - expense, income, expense }
})

/* ========== 公告数据（从announcements.json读取） ========== */
const { data: announcementsRaw } = useData('/data/announcements.json')
const announcementsData = computed(() => {
  return (announcementsRaw.value?.announcements || [])
    .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'))
    .slice(0, 3)
})

/* ========== 活动相册数据 ========== */
const { data: activitiesRaw } = useData('/data/activities.json')
const galleryActivities = computed(() => {
  return (activitiesRaw.value?.activities || [])
    .filter(a => a.tags && a.tags.hasMedia && a.tags.cover)
    .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'))
    .slice(0, 4)
})

async function fetchHomework() {
  try {
    const res = await fetch(`${langPrefix.value}/data/homework.json`)
    const data = await res.json()
    homeworkData.value = data.homework || []
  } catch (e) {
    try {
      const res = await fetch('/data/homework.json')
      const data = await res.json()
      homeworkData.value = data.homework || []
    } catch (e2) {
      console.error('加载作业失败', e2)
    }
  }
}

// 课程简称映射
const courseShortNames = {
  'dmd': 'DMD',
  'accounting': '会计',
  'managerial-economics': '管经',
}

// 待完成作业（计算剩余天数）
const pendingHomework = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return homeworkData.value
    .filter(hw => hw.status === 'pending')
    .map(hw => {
      const deadline = new Date((hw.deadline || '1970-01-01') + 'T00:00:00')
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
      const courseShort = courseShortNames[hw.course_id] || (hw.course || '').slice(0, 4) || '—'
      const titleShort = currentLang.value === 'zh' ? hw.title :
                         currentLang.value === 'en' ? (hw.title_en || hw.title) : (hw.title_th || hw.title)
      const deadlineText = currentLang.value === 'zh' ? `截止 ${(hw.deadline || '').slice(5)}` :
                           currentLang.value === 'en' ? `Due ${(hw.deadline || '').slice(5)}` :
                           `กำหนด ${(hw.deadline || '').slice(5)}`
      return { ...hw, daysLeft, courseShort, titleShort, deadlineText }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
})

async function fetchSchedule() {
  scheduleLoading.value = true
  scheduleError.value = false
  try {
    const res = await fetch(`${langPrefix.value}/data/schedule.json`)
    scheduleData.value = await res.json()
  } catch (e) {
    try {
      const res = await fetch('/data/schedule.json')
      scheduleData.value = await res.json()
    } catch (e2) {
      console.error('加载课表失败', e2)
      scheduleError.value = true
    }
  } finally {
    scheduleLoading.value = false
  }
}

const retrySchedule = () => {
  fetchSchedule()
}

/* ========== 截止提醒弹窗 ========== */
const showAlerts = ref(false)
const alerts = ref([])

// 弹窗类型配色
const alertColors = {
  homework: { bg: 'linear-gradient(135deg, #ff9500, #ff6b00)', glow: 'rgba(255, 149, 0, 0.35)', label: '作业' },
  important: { bg: 'linear-gradient(135deg, #ff3b30, #d70015)', glow: 'rgba(255, 59, 48, 0.35)', label: '重要' },
  activity: { bg: 'linear-gradient(135deg, #34c759, #248a3d)', glow: 'rgba(52, 199, 89, 0.35)', label: '活动' },
  course: { bg: 'linear-gradient(135deg, #007aff, #0051d5)', glow: 'rgba(0, 122, 255, 0.35)', label: '课程' },
  finance: { bg: 'linear-gradient(135deg, #af52de, #7c2eb8)', glow: 'rgba(175, 82, 222, 0.35)', label: '班费' },
}

// 检测截止项（真实数据）
const detectDeadlines = () => {
  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000
  const results = []

  // 1. 作业检测
  const hwList = homeworkData.value || []
  hwList.forEach(hw => {
    if (hw.status !== 'pending' || !hw.deadline) return
    const deadline = new Date(hw.deadline + 'T18:00:00')
    const diff = deadline - now
    if (diff > 0 && diff <= oneDay) {
      const hours = Math.ceil(diff / (60 * 60 * 1000))
      results.push({
        id: hw.id,
        type: 'homework',
        title: `${hw.course_id.toUpperCase()} ${hw.title}`,
        desc: `截止时间：${hw.deadline.slice(5)} 18:00（还剩${hours}小时）`,
      })
    }
  })

  // 2. 活动检测（活动前1天提醒）
  const actList = activitiesData.value || []
  actList.forEach(act => {
    if (!act.date || act.status === 'ended') return
    const actDate = new Date(act.date + 'T00:00:00')
    const diff = actDate - now
    if (diff > 0 && diff <= oneDay) {
      const hours = Math.ceil(diff / (60 * 60 * 1000))
      results.push({
        id: act.id,
        type: 'activity',
        title: act.title[currentLang.value] || act.title.zh,
        desc: `明天开始（还剩${hours}小时）${act.location ? ' · ' + act.location : ''}`,
      })
    }
  })

  return results
}

const triggerAlerts = () => {
  const detected = detectDeadlines()
  // Demo：如果没有真实截止项，用模拟数据展示效果
  alerts.value = detected.length > 0 ? detected : [
    { id: 'demo1', type: 'homework', title: 'DMD 第一次作业', desc: '截止时间：09-17 18:00（还剩约4天）' },
    { id: 'demo2', type: 'activity', title: '班委选举', desc: '今天 17:00 · B403教室' },
  ]
  showAlerts.value = true
  setTimeout(() => {
    showAlerts.value = false
  }, 6000)
}

onMounted(() => {
  fetchSchedule()
  fetchHomework()
  setTimeout(triggerAlerts, 1200)
})

// 获取接下来的2节课
const upcomingClasses = computed(() => {
  if (!scheduleData.value || !scheduleData.value.schedule) return []
  const now = new Date()
  const allClasses = []
  ;(scheduleData.value.schedule || []).forEach(day => {
    ;(day.courses || []).forEach(course => {
      const classDate = new Date(`${course.date}T${course.time_start}:00`)
      if (classDate > now) {
        allClasses.push({ ...course, weekday: day.weekday, datetime: classDate })
      }
    })
  })
  return allClasses.sort((a, b) => a.datetime - b.datetime).slice(0, 2)
})

// 下一节课的倒计时天数
const daysToNextClass = computed(() => {
  if (upcomingClasses.value.length === 0) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(upcomingClasses.value[0].date + 'T00:00:00')
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
})

// 学期进度（已过课程 / 总课程）
const semesterProgress = computed(() => {
  if (!scheduleData.value || !scheduleData.value.schedule) return 0
  const now = new Date()
  let completed = 0
  let total = 0
  ;(scheduleData.value.schedule || []).forEach(day => {
    ;(day.courses || []).forEach(course => {
      total++
      const classDate = new Date(`${course.date}T${course.time_end}:00`)
      if (classDate < now) completed++
    })
  })
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

// 格式化倒计时文字
const countdownText = computed(() => {
  const d = daysToNextClass.value
  if (d === null) return '—'
  if (d === 0) return t.value.today
  if (d === 1) return t.value.tomorrow
  return `${d} ${t.value.daysLater}`
})

// 通用：计算某门课距离今天的天数，返回"X天后"格式
const formatCourseDays = (course) => {
  if (!course || !course.date) return '—'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(course.date + 'T00:00:00')
  const d = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  if (d <= 0) return t.value.today
  if (d === 1) return t.value.tomorrow
  return `${d} ${t.value.daysLater}`
}

// 倒计时是否紧迫（≤1天）
const isCountdownUrgent = computed(() => daysToNextClass.value !== null && daysToNextClass.value <= 1)

/* ========== 班级统计（真实，从 class-members.json 计算） ========== */
const activeMembers = computed(() =>
  (classData.members || []).filter(m => m.status !== 'withdrawn')
)

const classStats = computed(() => {
  const students = activeMembers.value.filter(m => m.role === 'student').length
  const mentors = activeMembers.value.filter(m => m.role === 'mentor' || m.role === 'mentorLeader').length
  return {
    members: students,
    courses: scheduleData.value ? scheduleData.value.total_courses : 3,
    groups: 6,
    mentors: mentors,
  }
})

/* ========== 快速入口配置 ========== */
const quickLinks = computed(() => [
  { key: 'schedule', label: t.value.links.schedule, href: `${langPrefix.value}/schedule`, icon: 'calendar' },
  { key: 'announcements', label: t.value.links.announcements, href: `${langPrefix.value}/announcements/`, icon: 'megaphone' },
  { key: 'finance', label: t.value.links.finance, href: `${langPrefix.value}/finance/`, icon: 'wallet' },
  { key: 'activities', label: t.value.links.activities, href: `${langPrefix.value}/activities/`, icon: 'party-popper' },
  { key: 'gallery', label: t.value.links.gallery, href: `${langPrefix.value}/gallery/`, icon: 'image' },
  { key: 'slides', label: t.value.links.slides, href: `${langPrefix.value}/slides/`, icon: 'book' },
])

/* ========== 传承人列表（全部13人） ========== */
const mentorList = computed(() => {
  const leader = activeMembers.value.find(m => m.role === 'mentorLeader')
  const mentors = activeMembers.value.filter(m => m.role === 'mentor')
  return leader ? [leader, ...mentors] : mentors
})

/* ========== 课程展开/收起 ========== */
const expandedCourseIndex = ref(null)

const toggleCourse = (index) => {
  expandedCourseIndex.value = expandedCourseIndex.value === index ? null : index
}

/* ========== 工具函数 ========== */
const formatWeekday = (weekday) => {
  if (currentLang.value === 'en') {
    const map = { '周一': 'Mon', '周二': 'Tue', '周三': 'Wed', '周四': 'Thu', '周五': 'Fri', '周六': 'Sat', '周日': 'Sun' }
    return map[weekday] || weekday
  }
  if (currentLang.value === 'th') {
    const map = { '周一': 'จ.', '周二': 'อ.', '周三': 'พ.', '周四': 'พฤ.', '周五': 'ศ.', '周六': 'ส.', '周日': 'อา.' }
    return map[weekday] || weekday
  }
  return weekday
}

const formatMonth = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  if (currentLang.value === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[d.getMonth()]
  }
  if (currentLang.value === 'th') {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    return months[d.getMonth()]
  }
  return `${d.getMonth() + 1}月`
}

const formatNumber = (n) => (n || 0).toLocaleString(
  currentLang.value === 'th' ? 'th-TH' : currentLang.value === 'en' ? 'en-US' : 'zh-CN'
)

/* ========== 3D Tilt 自定义指令 ========== */
// 在 setup 顶层同步检测，确保自定义指令 mounted 钩子执行时已有正确值
const prefersReducedMotion = ref(
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)
const isTouchDevice = ref(
  typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
)

const vTilt = {
  mounted(el) {
    if (prefersReducedMotion.value || isTouchDevice.value) return

    let rafId = null
    let targetRX = 0, targetRY = 0
    let currentRX = 0, currentRY = 0
    const isLargeCard = el.classList.contains('card--identity') || el.classList.contains('card--culture')
    const maxTilt = isLargeCard ? 9 : 6

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      targetRY = (px - 0.5) * maxTilt * 2
      targetRX = (0.5 - py) * maxTilt * 2
      el.style.setProperty('--glare-x', `${px * 100}%`)
      el.style.setProperty('--glare-y', `${py * 100}%`)
      if (!rafId) rafId = requestAnimationFrame(animate)
    }

    const animate = () => {
      currentRX += (targetRX - currentRX) * 0.18
      currentRY += (targetRY - currentRY) * 0.18
      el.style.transform = `perspective(900px) rotateX(${currentRX.toFixed(2)}deg) rotateY(${currentRY.toFixed(2)}deg) translateZ(0)`
      if (Math.abs(targetRX - currentRX) > 0.05 || Math.abs(targetRY - currentRY) > 0.05) {
        rafId = requestAnimationFrame(animate)
      } else {
        rafId = null
      }
    }

    const onLeave = () => {
      targetRX = 0
      targetRY = 0
      if (!rafId) rafId = requestAnimationFrame(animate)
    }

    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave, { passive: true })
    el._tiltCleanup = () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (rafId) cancelAnimationFrame(rafId)
    }
  },
  unmounted(el) {
    if (el._tiltCleanup) el._tiltCleanup()
  }
}

/* ========== 鼠标跟随聚光灯 ========== */
const gridRef = ref(null)
let spotlightRafId = null
let spotlightX = 50, spotlightY = 50
let targetSpotX = 50, targetSpotY = 50

const onGridMouseMove = (e) => {
  if (prefersReducedMotion.value || isTouchDevice.value) return
  if (!gridRef.value) return
  const rect = gridRef.value.getBoundingClientRect()
  targetSpotX = ((e.clientX - rect.left) / rect.width) * 100
  targetSpotY = ((e.clientY - rect.top) / rect.height) * 100
  if (!spotlightRafId) {
    spotlightRafId = requestAnimationFrame(updateSpotlight)
  }
}

const updateSpotlight = () => {
  spotlightX += (targetSpotX - spotlightX) * 0.12
  spotlightY += (targetSpotY - spotlightY) * 0.12
  if (gridRef.value) {
    gridRef.value.style.setProperty('--mouse-x', `${spotlightX.toFixed(1)}%`)
    gridRef.value.style.setProperty('--mouse-y', `${spotlightY.toFixed(1)}%`)
  }
  if (Math.abs(targetSpotX - spotlightX) > 0.1 || Math.abs(targetSpotY - spotlightY) > 0.1) {
    spotlightRafId = requestAnimationFrame(updateSpotlight)
  } else {
    spotlightRafId = null
  }
}

/* ========== IntersectionObserver 卡片入场 ========== */
const cardObserver = ref(null)

onMounted(async () => {
  await nextTick()
  if (prefersReducedMotion.value) {
    document.querySelectorAll('.bento-grid .card').forEach(c => c.classList.add('is-visible'))
    return
  }
  cardObserver.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        cardObserver.value.unobserve(entry.target)
      }
    })
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

  document.querySelectorAll('.bento-grid .card').forEach(card => {
    cardObserver.value.observe(card)
  })
})

onUnmounted(() => {
  if (cardObserver.value) cardObserver.value.disconnect()
  if (spotlightRafId) cancelAnimationFrame(spotlightRafId)
})

/* ========== 回到顶部 ========== */
const showBackToTop = ref(false)
let scrollThrottleId = null

const onWindowScroll = () => {
  if (scrollThrottleId) return
  scrollThrottleId = requestAnimationFrame(() => {
    showBackToTop.value = window.scrollY > window.innerHeight * 0.7
    scrollThrottleId = null
  })
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
})

</script>

<template>
  <div class="home-dashboard">
    <!-- Bento 网格 -->
    <div
      ref="gridRef"
      class="bento-grid"
      @mousemove="onGridMouseMove"
      role="region"
      :aria-label="t.className"
    >
      <!-- 聚光灯层 -->
      <div class="grid-spotlight" aria-hidden="true"></div>

      <!-- 1. 班级身份卡（大卡，2x2） -->
      <div
        class="card card--identity card--span-2-col card--span-2-row"
        role="banner"
        :aria-label="`${t.className} - ${t.classFull}`"
      >
        <!-- 漂浮粒子（代表生命力与活力） -->
        <div class="particles" aria-hidden="true">
          <span
            v-for="i in 8"
            :key="i"
            class="particle"
            :style="{
              '--p-delay': `${i * 1.1}s`,
              '--p-size': `${5 + i * 2.5}px`,
              '--p-x': `${5 + i * 12}%`,
              '--p-y': `${10 + (i % 4) * 22}%`,
              '--p-dur': `${6 + i * 1.8}s`,
            }"
          ></span>
        </div>
        <!-- 苹果风色团呼吸旋转背景 -->
        <div class="color-blobs" aria-hidden="true">
          <div class="blob-orbit blob-orbit--1">
            <span class="color-blob color-blob--mint"></span>
          </div>
          <div class="blob-orbit blob-orbit--2">
            <span class="color-blob color-blob--orange"></span>
          </div>
          <div class="blob-orbit blob-orbit--3">
            <span class="color-blob color-blob--blue"></span>
          </div>
          <div class="blob-orbit blob-orbit--4">
            <span class="color-blob color-blob--pink"></span>
          </div>
        </div>
        <div class="identity-inner">
          <div class="identity-badge">
            <!-- 脉动光晕 -->
            <div class="badge-glow" aria-hidden="true"></div>
            <!-- 外光环：缓慢旋转（代表循环与成长） -->
            <div class="badge-ring badge-ring--outer" aria-hidden="true"></div>
            <!-- 内光环：反向旋转 -->
            <div class="badge-ring badge-ring--inner" aria-hidden="true"></div>
            <!-- 班徽图片：呼吸缩放（代表生命力） -->
            <img src="/images/logo.webp" alt="薄荷 4 班班徽" class="badge-img" loading="eager" fetchpriority="high" />
          </div>
          <div class="identity-text">
            <h1 class="identity-name">{{ t.className }}</h1>
            <p class="identity-full">{{ t.classFull }}</p>
            <p class="identity-slogan">"{{ t.slogan }}"</p>
          </div>
        </div>
      </div>

      <!-- 2. 近期课程（2x1，真实数据） -->
      <div
        class="card card--schedule card--span-2-col"
        v-tilt
        role="region"
        :aria-label="t.scheduleTitle"
      >
        <div class="card-header">
          <h3 class="card-title">{{ t.scheduleTitle }}</h3>
          <a :href="`${langPrefix}/schedule`" class="card-link" :aria-label="`${t.viewAll} ${t.scheduleTitle}`">
            {{ t.viewAll }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        <!-- 骨架屏加载 -->
        <div v-if="scheduleLoading" class="schedule-skeleton" role="status" :aria-label="t.loadingSchedule">
          <div class="skeleton-item" v-for="i in 2" :key="i">
            <div class="skeleton-date"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-line--title"></div>
              <div class="skeleton-line skeleton-line--meta"></div>
            </div>
          </div>
        </div>

        <!-- 加载失败错误状态 -->
        <div v-else-if="scheduleError" class="schedule-error" role="alert">
          <svg class="schedule-error-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p class="schedule-error-text">{{ t.scheduleError }}</p>
          <button class="schedule-retry-btn" @click="retrySchedule" :aria-label="t.retry">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            {{ t.retry }}
          </button>
        </div>

        <div v-else class="schedule-list">
          <div
            v-for="(course, i) in upcomingClasses"
            :key="i"
            class="schedule-item"
            :class="{ 'schedule-item--expanded': expandedCourseIndex === i }"
            @click="toggleCourse(i)"
            role="button"
            tabindex="0"
            :aria-expanded="expandedCourseIndex === i"
            :aria-label="`${course.course}, ${t.clickForDetails}`"
            @keydown.enter="toggleCourse(i)"
            @keydown.space.prevent="toggleCourse(i)"
          >
            <div class="schedule-item-main">
              <div class="schedule-date">
                <span class="schedule-day">{{ new Date(course.date + 'T00:00:00').getDate() }}</span>
                <span class="schedule-month">{{ formatMonth(course.date) }}</span>
              </div>
              <div class="schedule-info">
                <span class="schedule-course">{{ course.course }}</span>
                <span class="schedule-meta">{{ course.time_start }}–{{ course.time_end }} · {{ course.teacher }}</span>
              </div>
              <span class="schedule-countdown" :class="{ 'schedule-countdown--soon': i === 0 && isCountdownUrgent }">
                {{ formatCourseDays(course) }}
              </span>
              <svg class="schedule-expand-icon" :class="{ 'schedule-expand-icon--open': expandedCourseIndex === i }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
            <!-- 展开详情 -->
            <div class="schedule-detail" :class="{ 'schedule-detail--open': expandedCourseIndex === i }">
              <div class="schedule-detail-row">
                <span class="schedule-detail-label">{{ t.instructor }}</span>
                <span class="schedule-detail-value">{{ course.teacher }}</span>
              </div>
              <div class="schedule-detail-row">
                <span class="schedule-detail-label">{{ t.classroom }}</span>
                <span class="schedule-detail-value">{{ course.location }}</span>
              </div>
              <div class="schedule-detail-row">
                <span class="schedule-detail-label">{{ t.scheduleTitle }}</span>
                <span class="schedule-detail-value">{{ formatWeekday(course.weekday) }} {{ course.time_start }}–{{ course.time_end }}</span>
              </div>
            </div>
          </div>
          <div v-if="upcomingClasses.length === 0" class="schedule-empty">
            {{ t.scheduleEmpty }}
          </div>
        </div>
      </div>

      <!-- 3. 快速入口（1x1） -->
      <div class="card card--quicklinks" v-tilt role="navigation" :aria-label="t.quickLinksTitle">
        <h3 class="card-title card-title--compact">{{ t.quickLinksTitle }}</h3>
        <div class="quicklinks-grid">
          <a
            v-for="link in quickLinks"
            :key="link.key"
            :href="link.href"
            class="quicklink-item"
            :aria-label="link.label"
          >
            <svg class="quicklink-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <template v-if="link.icon === 'calendar'">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </template>
              <template v-else-if="link.icon === 'megaphone'">
                <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
              </template>
              <template v-else-if="link.icon === 'book'">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </template>
              <template v-else-if="link.icon === 'presentation'">
                <path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>
              </template>
              <template v-else-if="link.icon === 'users'">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </template>
              <template v-else-if="link.icon === 'image'">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </template>
              <template v-else-if="link.icon === 'party-popper'">
                <path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/>
              </template>
              <template v-else-if="link.icon === 'wallet'">
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
              </template>
            </svg>
            <span class="quicklink-label">{{ link.label }}</span>
          </a>
        </div>
      </div>

      <!-- 4. 班费公开（1x1，真实数据） -->
      <div class="card card--finance" v-tilt role="region" :aria-label="t.financeTitle">
        <div class="card-header">
          <h3 class="card-title card-title--compact">{{ t.financeTitle }}</h3>
          <div class="card-header-right">
            <a :href="`${langPrefix}/finance/`" class="card-link" :aria-label="`${t.viewAll} ${t.financeTitle}`">
              {{ t.viewAll }}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
        <div class="finance-balance">
          <span class="finance-amount">¥ {{ formatNumber(financeData.balance) }}</span>
          <span class="finance-label">{{ t.balance }}</span>
        </div>
        <div class="finance-row">
          <div class="finance-col finance-tooltip-wrap" :data-tooltip="t.incomeDetail">
            <span class="finance-sub finance-sub--income">+¥ {{ formatNumber(financeData.income) }}</span>
            <span class="finance-sublabel">{{ t.income }}</span>
            <span class="finance-tooltip" role="tooltip">{{ t.incomeDetail }}</span>
          </div>
          <div class="finance-divider-v"></div>
          <div class="finance-col finance-tooltip-wrap" :data-tooltip="t.expenseDetail">
            <span class="finance-sub finance-sub--expense">-¥ {{ formatNumber(financeData.expense) }}</span>
            <span class="finance-sublabel">{{ t.expense }}</span>
            <span class="finance-tooltip" role="tooltip">{{ t.expenseDetail }}</span>
          </div>
        </div>
      </div>

      <!-- 6. 最新公告（2x1，真实数据） -->
      <div class="card card--announcements card--span-2-col" v-tilt role="region" :aria-label="t.announcementsTitle">
        <div class="card-header">
          <h3 class="card-title">{{ t.announcementsTitle }}</h3>
          <div class="card-header-right">
            <a :href="`${langPrefix}/announcements/`" class="card-link" :aria-label="`${t.viewAll} ${t.announcementsTitle}`">
              {{ t.viewAll }}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
        <div class="announcement-list">
          <a
            v-for="item in announcementsData"
            :key="item.id"
            :href="`${langPrefix}/announcements/`"
            class="announcement-item"
            :aria-label="`${item.category}: ${(item.title[currentLang] || item.title.zh || '')}, ${item.date}`"
          >
            <span class="announcement-indicator" :class="{ 'announcement-indicator--pinned': item.pinned }" aria-hidden="true"></span>
            <span class="announcement-tag">{{ t.categoryMap[item.category] || item.category }}</span>
            <span class="announcement-title">{{ item.title[currentLang] || item.title.zh }}</span>
            <span class="announcement-date">{{ item.date }}</span>
            <svg class="announcement-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <div v-if="announcementsData.length === 0" class="announcement-empty">{{ t.noAnnouncements }}</div>
        </div>
      </div>

      <!-- 6. 倒计时（1x1，真实数据） -->
      <div class="card card--countdown" v-tilt role="region" :aria-label="`${t.countdownTitle}: ${countdownText}`">
        <h3 class="card-title card-title--compact">{{ t.countdownTitle }}</h3>
        <div class="countdown-ring-wrap">
          <div
            class="countdown-ring"
            :class="{ 'countdown-ring--urgent': isCountdownUrgent }"
            :style="{ '--ring-progress': semesterProgress + '%' }"
          >
            <div class="countdown-ring-inner">
              <span class="countdown-number" :class="{ 'countdown-number--urgent': isCountdownUrgent }">
                {{ daysToNextClass !== null ? daysToNextClass : '—' }}
              </span>
            </div>
          </div>
        </div>
        <p class="countdown-unit">{{ daysToNextClass === 0 ? t.today : daysToNextClass === 1 ? t.tomorrow : t.days }}</p>
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">{{ t.semesterProgress }}</span>
            <span class="progress-value">{{ semesterProgress }}%</span>
          </div>
          <div class="progress-bar" role="progressbar" :aria-valuenow="semesterProgress" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" :style="{ width: semesterProgress + '%' }">
              <div class="progress-shimmer" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 作业TODO（1x1，真实数据） -->
      <div class="card card--homework" v-tilt role="region" :aria-label="t.homeworkTitle">
        <div class="card-header">
          <h3 class="card-title card-title--compact">{{ t.homeworkTitle }}</h3>
          <span class="homework-count" v-if="pendingHomework.length > 0">{{ pendingHomework.length }}</span>
        </div>
        <div class="homework-list" v-if="pendingHomework.length > 0">
          <a
            v-for="hw in pendingHomework"
            :key="hw.id"
            :href="hw.url"
            class="homework-item"
            target="_blank"
            rel="noopener"
          >
            <div class="homework-course-tag">{{ hw.courseShort }}</div>
            <div class="homework-info">
              <span class="homework-title">{{ hw.titleShort }}</span>
              <span class="homework-deadline" :class="{ 'homework-deadline--urgent': hw.daysLeft <= 2 }">
                {{ hw.deadlineText }}
              </span>
            </div>
            <div class="homework-days" :class="{ 'homework-days--urgent': hw.daysLeft <= 2 }">
              <span class="homework-days-num">{{ hw.daysLeft }}</span>
              <span class="homework-days-unit">{{ hw.daysLeft === 1 ? t.day : t.days }}</span>
            </div>
          </a>
        </div>
        <div class="homework-empty" v-else>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span>{{ t.noHomework }}</span>
        </div>
      </div>

      <!-- 7. 传承人（1x1，真实数据） -->
      <div class="card card--mentors" v-tilt role="region" :aria-label="t.mentorsTitle">
        <div class="card-header">
          <h3 class="card-title card-title--compact">{{ t.mentorsTitle }}</h3>
          <a :href="`${langPrefix}/directory/`" class="card-link" :aria-label="t.viewDirectory">{{ t.viewAll }}</a>
        </div>
        <p class="mentors-subtitle">{{ t.mentorsSubtitle }}</p>
        <div class="mentors-avatars">
          <a
            v-for="m in mentorList"
            :key="m.id"
            :href="`${langPrefix}/directory/`"
            class="mentor-avatar"
            :title="m.name"
            :aria-label="m.name"
          >
            <span class="mentor-avatar-initials">{{ m.name.charAt(0) }}</span>
          </a>
          <a
            v-if="classStats.mentors - mentorList.length > 0"
            :href="`${langPrefix}/directory/`"
            class="mentor-avatar mentor-avatar--more"
            :aria-label="`+${classStats.mentors - mentorList.length}`"
          >+{{ classStats.mentors - mentorList.length }}</a>
        </div>
      </div>

      <!-- 8. 活动相册（2x1，真实封面图） -->
      <div class="card card--gallery card--span-2-col" v-tilt role="region" :aria-label="t.galleryTitle">
        <div class="card-header">
          <h3 class="card-title">{{ t.galleryTitle }}</h3>
          <a :href="`${langPrefix}/gallery/`" class="card-link">{{ t.viewAll }}</a>
        </div>
        <div class="gallery-grid">
          <a
            v-for="(act, idx) in galleryActivities"
            :key="act.id"
            :href="`${langPrefix}/gallery/`"
            class="gallery-item"
            :class="`gallery-item--${idx + 1}`"
          >
            <img :src="act.tags.cover" :alt="(act.title[currentLang] || act.title.zh || '')" class="gallery-item-img" loading="lazy" />
            <div class="gallery-item-overlay">
              <span class="gallery-item-title">{{ act.title[currentLang] || act.title.zh }}</span>
            </div>
          </a>
          <a :href="`${langPrefix}/gallery/`" class="gallery-item gallery-item--more" :aria-label="`${t.viewAll} ${t.galleryTitle}`">
            <span>{{ t.viewAll }}</span>
          </a>
        </div>
      </div>

      <!-- 9. 班级文化/口号（1x1） -->
      <div class="card card--culture" v-tilt role="region" :aria-label="t.cultureTitle">
        <h3 class="card-title card-title--compact">{{ t.cultureTitle }}</h3>
        <p class="culture-slogan">"{{ t.slogan }}"</p>
        <p class="culture-values">{{ t.values }}</p>
        <div class="culture-divider"></div>
        <p class="culture-name">{{ t.className }} · {{ t.classFull }}</p>
      </div>

    </div>

    <!-- 回到顶部按钮 -->
    <Transition name="back-to-top">
      <button
        v-if="showBackToTop"
        class="back-to-top"
        @click="scrollToTop"
        :aria-label="t.backToTop"
        :title="t.backToTop"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </button>
    </Transition>

    <!-- 截止提醒弹窗（多个同时显示） -->
    <Transition name="alert-pop">
      <div v-if="showAlerts" class="alerts-container">
        <div
          v-for="(alert, idx) in alerts"
          :key="alert.id"
          class="deadline-alert"
          :style="{
            '--alert-bg': alertColors[alert.type]?.bg,
            '--alert-glow': alertColors[alert.type]?.glow,
            '--alert-index': idx,
          }"
          role="alert"
        >
          <div class="deadline-alert-icon">
            <svg v-if="alert.type === 'homework'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <svg v-else-if="alert.type === 'activity'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <svg v-else-if="alert.type === 'important'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="deadline-alert-content">
            <div class="deadline-alert-title">{{ alert.title }}</div>
            <div class="deadline-alert-desc">{{ alert.desc }}</div>
          </div>
          <div class="deadline-alert-progress"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ========== 容器 ========== */
.home-dashboard {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 28px 24px 48px;
  position: relative;
}

/* ========== Bento 网格 ========== */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(150px, auto);
  gap: 14px;
  position: relative;
  --mouse-x: 50%;
  --mouse-y: 50%;
  /* 桌面端4列布局：1身份 2课程 3快捷 4作业 5倒计时 6班费 7公告 8传承人 9相册 10文化 */
  grid-template-areas:
    "identity identity schedule schedule"
    "identity identity quicklinks homework"
    "countdown finance announcements announcements"
    "mentors gallery gallery culture";
}

/* 聚光灯层 */
.grid-spotlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
    600px circle at var(--mouse-x) var(--mouse-y),
    var(--c-accent-glow),
    transparent 60%
  );
  mix-blend-mode: overlay;
  opacity: 0.7;
  transition: opacity 0.4s ease;
}

.bento-grid:hover .grid-spotlight {
  opacity: 1;
}

.card--span-2-col { grid-column: span 2; }
.card--span-2-row { grid-row: span 2; }

/* ========== 卡片 grid-area 命名（用于精确定位） ========== */
.card--identity { grid-area: identity; }
.card--schedule { grid-area: schedule; }
.card--quicklinks { grid-area: quicklinks; }
.card--finance { grid-area: finance; }
.card--homework { grid-area: homework; }
.card--announcements { grid-area: announcements; }
.card--countdown { grid-area: countdown; }
.card--mentors { grid-area: mentors; }
.card--gallery { grid-area: gallery; }
.card--culture { grid-area: culture; }

/* ========== 基础卡片 ========== */
.card {
  background: var(--c-bg-card);
  border: 0.5px solid var(--c-separator);
  border-radius: var(--radius-xl);
  padding: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
  /* 入场初始状态 */
  opacity: 0;
  transform: translateY(16px) scale(0.97);
  transition:
    opacity 550ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 550ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
  will-change: transform, opacity;
}

.card.is-visible {
  opacity: 1;
  transform: none;
}

/* 入场 stagger 延迟 */
.bento-grid .card:nth-child(1) { transition-delay: 0ms; }
.bento-grid .card:nth-child(2) { transition-delay: 50ms; }
.bento-grid .card:nth-child(3) { transition-delay: 100ms; }
.bento-grid .card:nth-child(4) { transition-delay: 150ms; }
.bento-grid .card:nth-child(5) { transition-delay: 200ms; }
.bento-grid .card:nth-child(6) { transition-delay: 250ms; }
.bento-grid .card:nth-child(7) { transition-delay: 300ms; }
.bento-grid .card:nth-child(8) { transition-delay: 350ms; }
.bento-grid .card:nth-child(9) { transition-delay: 400ms; }
.bento-grid .card:nth-child(10) { transition-delay: 450ms; }

.card:hover {
  background-color: var(--c-bg-secondary);
  border-color: var(--c-border);
  box-shadow: var(--shadow-float);
}

/* 卡片光泽反射层 */
.card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at var(--glare-x, 50%) var(--glare-y, 50%),
    rgba(255, 255, 255, 0.12) 0%,
    transparent 55%
  );
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
  border-radius: inherit;
  z-index: 2;
}

.card:hover::after {
  opacity: 1;
}

/* 大卡光泽更明显 */
.card--identity:hover::after,
.card--culture:hover::after {
  opacity: 0.8;
  background: radial-gradient(
    circle at var(--glare-x, 50%) var(--glare-y, 50%),
    rgba(255, 255, 255, 0.2) 0%,
    transparent 60%
  );
}

/* ========== 卡片标题 ========== */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
  gap: 8px;
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--c-text-primary);
  margin: 0;
  line-height: 1.3;
}

.card-title--compact {
  margin-bottom: 12px;
}

.card-link {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-accent);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: opacity var(--transition-fast), gap var(--transition-fast);
  flex-shrink: 0;
  cursor: pointer;
}

.card-link:hover {
  opacity: 0.7;
  gap: 6px;
}

.card-link:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Demo 标签 */
.demo-badge {
  font-size: 10px;
  font-weight: 500;
  color: var(--c-text-tertiary);
  background: var(--c-bg-tertiary);
  border: 0.5px solid var(--c-separator);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  letter-spacing: 0.3px;
}

/* ========== 1. 班级身份卡 ========== */
.card--identity {
  background: linear-gradient(
    135deg,
    var(--c-accent-light) 0%,
    var(--c-bg-card) 45%,
    var(--c-accent-light) 100%
  );
  background-size: 250% 250%;
  animation: gradientFlow 14s ease infinite;
  border-color: var(--c-border-accent);
  justify-content: center;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.card--identity:hover {
  background: linear-gradient(
    135deg,
    var(--c-accent-light) 0%,
    var(--c-bg-secondary) 45%,
    var(--c-accent-light) 100%
  );
  background-size: 250% 250%;
  animation: gradientFlow 14s ease infinite;
}

/* 漂浮粒子 */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

/* 苹果风色团呼吸旋转背景 */
.color-blobs {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 0;
  animation: blobsGlobalRotate 50s linear infinite;
}
@keyframes blobsGlobalRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 轨道层：每个色团绕中心做椭圆轨道运动 */
.blob-orbit {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
}
.blob-orbit--1 { animation: orbit1 14s ease-in-out infinite; }
.blob-orbit--2 { animation: orbit2 18s ease-in-out infinite; animation-direction: reverse; }
.blob-orbit--3 { animation: orbit3 16s ease-in-out infinite; }
.blob-orbit--4 { animation: orbit4 20s ease-in-out infinite; animation-direction: reverse; }

@keyframes orbit1 {
  0%   { transform: rotate(0deg) translateX(70px) rotate(0deg); }
  25%  { transform: rotate(90deg) translateX(90px) rotate(-90deg); }
  50%  { transform: rotate(180deg) translateX(65px) rotate(-180deg); }
  75%  { transform: rotate(270deg) translateX(85px) rotate(-270deg); }
  100% { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
}
@keyframes orbit2 {
  0%   { transform: rotate(45deg) translateX(85px) rotate(-45deg); }
  25%  { transform: rotate(135deg) translateX(60px) rotate(-135deg); }
  50%  { transform: rotate(225deg) translateX(90px) rotate(-225deg); }
  75%  { transform: rotate(315deg) translateX(70px) rotate(-315deg); }
  100% { transform: rotate(405deg) translateX(85px) rotate(-405deg); }
}
@keyframes orbit3 {
  0%   { transform: rotate(90deg) translateX(60px) rotate(-90deg); }
  33%  { transform: rotate(210deg) translateX(95px) rotate(-210deg); }
  66%  { transform: rotate(330deg) translateX(75px) rotate(-330deg); }
  100% { transform: rotate(450deg) translateX(60px) rotate(-450deg); }
}
@keyframes orbit4 {
  0%   { transform: rotate(135deg) translateX(90px) rotate(-135deg); }
  25%  { transform: rotate(225deg) translateX(65px) rotate(-225deg); }
  50%  { transform: rotate(315deg) translateX(85px) rotate(-315deg); }
  75%  { transform: rotate(405deg) translateX(70px) rotate(-405deg); }
  100% { transform: rotate(495deg) translateX(90px) rotate(-495deg); }
}

/* 色团本体：呼吸缩放+透明度+颜色交融 */
.color-blob {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  filter: blur(35px);
  mix-blend-mode: multiply;
  will-change: transform, opacity;
  transform: translate(-50%, -50%);
}
.dark .color-blob {
  mix-blend-mode: screen;
}
.color-blob--mint {
  width: 130px;
  height: 130px;
  background: radial-gradient(circle at 30% 30%, #5EC4AC 0%, #2D7A6C 50%, transparent 75%);
  animation: breatheMint 6s ease-in-out infinite;
}
.color-blob--orange {
  width: 110px;
  height: 110px;
  background: radial-gradient(circle at 60% 40%, #ffb347 0%, #ff6b00 50%, transparent 75%);
  animation: breatheOrange 7.5s ease-in-out infinite;
}
.color-blob--blue {
  width: 120px;
  height: 120px;
  background: radial-gradient(circle at 40% 60%, #5ac8fa 0%, #007aff 50%, transparent 75%);
  animation: breatheBlue 8s ease-in-out infinite;
}
.color-blob--pink {
  width: 100px;
  height: 100px;
  background: radial-gradient(circle at 50% 50%, #ff6482 0%, #ff2d55 50%, transparent 75%);
  animation: breathePink 7s ease-in-out infinite;
}

@keyframes breatheMint {
  0%, 100% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.25); opacity: 0.75; }
}
@keyframes breatheOrange {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.45; }
  30% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
  70% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.4; }
}
@keyframes breatheBlue {
  0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.4; }
  40% { transform: translate(-50%, -50%) scale(1.35); opacity: 0.65; }
  80% { transform: translate(-50%, -50%) scale(0.75); opacity: 0.35; }
}
@keyframes breathePink {
  0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
}

.particle {
  position: absolute;
  width: var(--p-size);
  height: var(--p-size);
  border-radius: 50%;  background: var(--c-accent);
  opacity: 0.12;
  left: var(--p-x);
  top: var(--p-y);
  animation: particleFloat var(--p-dur) ease-in-out infinite;
  animation-delay: var(--p-delay);
}

@keyframes particleFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.12;
  }
  25% {
    transform: translate(12px, -18px) scale(1.15);
    opacity: 0.2;
  }
  50% {
    transform: translate(-6px, -30px) scale(0.9);
    opacity: 0.08;
  }
  75% {
    transform: translate(8px, -12px) scale(1.1);
    opacity: 0.16;
  }
}

.identity-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.identity-badge {
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.dark .identity-badge {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
/* 班徽图片：呼吸缩放（代表生命力） */
.badge-img {
  width: 84px;
  height: 84px;
  max-width: none;
  flex-shrink: 0;
  object-fit: contain;
  position: relative;
  z-index: 2;
  animation: badgeBreath 6s ease-in-out infinite;
  filter: drop-shadow(0 2px 8px rgba(45, 122, 108, 0.15));
}

@keyframes badgeBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

/* 脉动光晕：班徽后方 */
.badge-glow {
  position: absolute;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--c-accent) 0%, transparent 70%);
  opacity: 0.15;
  z-index: 1;
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.12; }
  50% { transform: scale(1.15); opacity: 0.25; }
}

/* 旋转光环：代表循环与成长 */
.badge-ring {
  position: absolute;
  border-radius: 50%;
  z-index: 0;
}

.badge-ring--outer {
  width: 106px;
  height: 106px;
  border: 1.5px dashed var(--c-accent);
  opacity: 0.35;
  animation: ringSpin 20s linear infinite;
}

.badge-ring--inner {
  width: 94px;
  height: 94px;
  border: 1px solid var(--c-accent);
  opacity: 0.2;
  border-style: dotted;
  animation: ringSpinReverse 30s linear infinite;
}

@keyframes ringSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ringSpinReverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

.card--identity:hover .badge-img {
  animation-play-state: paused;
  transform: scale(1.06);
}

.card--identity:hover .badge-ring--outer {
  animation-duration: 8s;
}

.card--identity:hover .badge-ring--inner {
  animation-duration: 12s;
}

.identity-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.identity-name {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--c-text-primary);
  margin: 0;
  line-height: 1.2;
}

.identity-full {
  font-size: 13px;
  font-weight: 400;
  color: var(--c-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.identity-slogan {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-accent);
  margin: 6px 0 0 0;
  line-height: 1.4;
  font-style: italic;
  animation: sloganBreath 5s ease-in-out infinite;
}

@keyframes sloganBreath {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}

/* ========== 2. 近期课程 ========== */
/* 骨架屏 */
.schedule-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  padding: 4px 0;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
}

.skeleton-date {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-lg);
  background: var(--c-bg-secondary);
  flex-shrink: 0;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--c-bg-secondary);
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

.skeleton-line--title {
  width: 60%;
  height: 14px;
}

.skeleton-line--meta {
  width: 40%;
  height: 10px;
  animation-delay: 0.2s;
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.schedule-item {
  display: flex;
  flex-direction: column;
  padding: 8px 4px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  position: relative;
  min-height: 44px;
}

.schedule-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 60%;
  background: var(--c-accent);
  border-radius: 2px;
  transition: transform var(--transition-base);
}

.schedule-item:hover::before,
.schedule-item--expanded::before {
  transform: translateY(-50%) scaleY(1);
}

.schedule-item:hover {
  background-color: var(--c-bg-tertiary);
}

.schedule-item:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: -2px;
}

.schedule-item-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.schedule-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: var(--c-bg-secondary);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.schedule-item:hover .schedule-date {
  transform: scale(1.05);
}

.schedule-day {
  font-size: 17px;
  font-weight: 700;
  color: var(--c-text-primary);
  line-height: 1;
}

.schedule-month {
  font-size: 10px;
  color: var(--c-text-tertiary);
  margin-top: 2px;
}

.schedule-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.schedule-course {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform var(--transition-fast);
}

.schedule-item:hover .schedule-course {
  transform: translateX(2px);
}

.schedule-meta {
  font-size: 11px;
  color: var(--c-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.schedule-countdown {
  font-size: 11px;
  font-weight: 500;
  color: var(--c-text-tertiary);
  background: var(--c-bg-secondary);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.schedule-countdown--soon {
  color: var(--c-accent);
  background: var(--c-accent-light);
  animation: countdownPulse 2s ease-in-out infinite;
}

@keyframes countdownPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--c-accent-glow); }
  50% { box-shadow: 0 0 0 6px transparent; }
}

.schedule-expand-icon {
  color: var(--c-text-tertiary);
  flex-shrink: 0;
  transition: transform var(--transition-base);
}

.schedule-expand-icon--open {
  transform: rotate(180deg);
}

/* 课程展开详情 */
.schedule-detail {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s ease,
              margin-top 0.3s ease;
  margin-top: 0;
  padding-left: 54px;
}

.schedule-detail--open {
  max-height: 120px;
  opacity: 1;
  margin-top: 10px;
}

.schedule-detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}

.schedule-detail-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--c-text-tertiary);
  min-width: 56px;
  flex-shrink: 0;
}

.schedule-detail-value {
  font-size: 12px;
  color: var(--c-text-secondary);
  font-weight: 500;
}

.schedule-empty {
  font-size: 13px;
  color: var(--c-text-tertiary);
  text-align: center;
  padding: 24px 16px;
}

/* 加载失败错误状态 */
.schedule-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 16px;
  flex: 1;
  text-align: center;
}

.schedule-error-icon {
  color: var(--c-text-tertiary);
  opacity: 0.6;
}

.schedule-error-text {
  font-size: 13px;
  color: var(--c-text-tertiary);
  margin: 0;
  line-height: 1.4;
}

.schedule-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--c-accent);
  background: var(--c-accent-light);
  border: 0.5px solid var(--c-border-accent);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--transition-fast),
              transform var(--transition-fast);
  min-height: 32px;
}

.schedule-retry-btn:hover {
  background: var(--c-accent);
  color: var(--c-text-inverse);
  transform: scale(1.03);
}

.schedule-retry-btn:active {
  transform: scale(0.97);
}

.schedule-retry-btn:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
}

/* ========== 3. 快速入口 ========== */
.quicklinks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  flex: 1;
}

.quicklink-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 4px;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast),
              transform var(--transition-fast);
  min-height: 44px;
  cursor: pointer;
  position: relative;
}

.quicklink-item:hover {
  background-color: var(--c-bg-tertiary);
  transform: translateY(-3px);
}

.quicklink-item:active {
  transform: translateY(-1px) scale(0.97);
}

.quicklink-item:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
}

.quicklink-icon {
  width: 20px;
  height: 20px;
  color: var(--c-accent);
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.quicklink-item:hover .quicklink-icon {
  transform: scale(1.15);
}

.quicklink-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--c-text-secondary);
  text-align: center;
  line-height: 1.2;
  transition: color var(--transition-fast);
}

.quicklink-item:hover .quicklink-label {
  color: var(--c-accent);
}

/* ========== 4. 班级统计 ========== */
.stats-grid-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 8px 10px;
  background: var(--c-bg-secondary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast),
              transform var(--transition-fast),
              box-shadow var(--transition-fast);
  cursor: pointer;
  min-height: 44px;
  position: relative;
  overflow: hidden;
}

.stat-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 2px;
  background: var(--c-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-base);
  border-radius: 1px;
}

.stat-item:hover {
  background-color: var(--c-bg-tertiary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-subtle);
}

.stat-item:hover::after {
  transform: scaleX(1);
}

.stat-item:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
}

.stat-number {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--c-text-primary);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  font-weight: 400;
  color: var(--c-text-tertiary);
  line-height: 1.2;
}

/* ========== 5. 公告 ========== */
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.announcement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 8px 9px 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast),
              padding-left var(--transition-fast);
  cursor: pointer;
  min-height: 44px;
  position: relative;
}

.announcement-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 50%;
  background: var(--c-accent);
  border-radius: 2px;
  transition: transform var(--transition-base);
}

.announcement-item:hover {
  background-color: var(--c-bg-tertiary);
  padding-left: 16px;
}

.announcement-item:hover .announcement-indicator {
  transform: translateY(-50%) scaleY(1);
}

.announcement-item:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: -2px;
}

.announcement-tag {
  font-size: 10px;
  font-weight: 500;
  color: var(--c-accent);
  background: var(--c-accent-light);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  white-space: nowrap;
}

.announcement-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.announcement-item:hover .announcement-title {
  transform: translateX(3px);
  color: var(--c-accent);
}

.announcement-date {
  font-size: 11px;
  color: var(--c-text-tertiary);
  flex-shrink: 0;
}

.announcement-arrow {
  color: var(--c-accent);
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.announcement-item:hover .announcement-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ========== 6. 倒计时 ========== */
.card--countdown {
  align-items: center;
  text-align: center;
}

.card--countdown .card-title--compact {
  align-self: flex-start;
  width: 100%;
}

.countdown-ring-wrap {
  display: flex;
  justify-content: center;
  margin: 4px 0;
}

.countdown-ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(
    var(--c-accent) 0%,
    var(--c-accent) var(--ring-progress, 0%),
    var(--c-bg-secondary) var(--ring-progress, 0%),
    var(--c-bg-secondary) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.6s ease;
}

.countdown-ring--urgent {
  animation: ringPulse 2s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--c-accent-glow); }
  50% { box-shadow: 0 0 0 8px transparent; }
}

.countdown-ring-inner {
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  bottom: 5px;
  border-radius: 50%;
  background: var(--c-bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
}

.countdown-number {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -1.5px;
  color: var(--c-accent);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transition: transform var(--transition-base);
}

.countdown-number--urgent {
  animation: numberPulse 2s ease-in-out infinite;
}

@keyframes numberPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.countdown-unit {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-text-tertiary);
  margin: 2px 0 0 0;
}

.progress-section {
  width: 100%;
  margin-top: auto;
  padding-top: 10px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--c-text-secondary);
}

.progress-value {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-accent);
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  width: 100%;
  height: 5px;
  background: var(--c-bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--c-accent), var(--c-mint-400, #5fa898));
  border-radius: var(--radius-full);
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  overflow: hidden;
}

.progress-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: progressShimmer 2s linear infinite;
}

@keyframes progressShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ========== 作业TODO ========== */
.card--homework {
  display: flex;
  flex-direction: column;
}

.homework-count {
  background: var(--c-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.homework-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  margin-top: 4px;
}

.homework-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--c-bg-elevated);
  border-radius: 12px;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease;
}

.homework-item:hover {
  background: var(--c-accent-light);
  transform: translateX(2px);
}

.homework-course-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--c-accent);
  background: var(--c-accent-light);
  padding: 3px 7px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.homework-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.homework-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.homework-deadline {
  font-size: 11px;
  color: var(--c-text-tertiary);
}

.homework-deadline--urgent {
  color: #FF3B30;
  font-weight: 600;
}

.homework-days {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.homework-days-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--c-text-primary);
  line-height: 1;
}

.homework-days-unit {
  font-size: 9px;
  color: var(--c-text-tertiary);
  margin-top: 2px;
}

.homework-days--urgent .homework-days-num {
  color: #FF3B30;
}

.homework-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--c-text-tertiary);
}

.homework-empty svg {
  opacity: 0.4;
}

.homework-empty span {
  font-size: 12px;
}

/* ========== 7. 传承人 ========== */
.mentors-subtitle {
  font-size: 11px;
  color: var(--c-text-tertiary);
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.mentors-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  flex: 1;
  align-content: flex-start;
}

.mentor-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--c-accent-light);
  border: 1.5px solid var(--c-bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-decoration: none;
  cursor: pointer;
  transition: transform var(--transition-base),
              box-shadow var(--transition-base),
              border-color var(--transition-base);
  position: relative;
}

.mentor-avatar:hover {
  transform: scale(1.2);
  box-shadow: var(--shadow-float);
  border-color: var(--c-accent);
  z-index: 2;
}

.mentor-avatar:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
}

.mentor-avatar-initials {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-accent);
}

.mentor-avatar--more {
  background: var(--c-bg-secondary);
  border-color: var(--c-separator);
  font-size: 10px;
  font-weight: 600;
  color: var(--c-text-tertiary);
}

/* ========== 8. 相册 ========== */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  flex: 1;
}

.gallery-item {
  border-radius: var(--radius-md);
  background: var(--c-bg-secondary);
  position: relative;
  overflow: hidden;
  min-height: 0;
  aspect-ratio: 1;
  transition: transform var(--transition-base),
              box-shadow var(--transition-base);
  text-decoration: none;
  display: block;
}

.gallery-item:hover {
  transform: scale(1.03);
  box-shadow: var(--shadow-subtle);
}

.gallery-item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-item-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 8px 8px;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  display: flex;
  align-items: flex-end;
}

.gallery-item-title {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.gallery-item--more {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg-tertiary);
  text-decoration: none;
  transition: background-color var(--transition-fast), transform var(--transition-base);
  cursor: pointer;
}

.gallery-item--more:hover {
  background: var(--c-bg-secondary);
  transform: scale(1.03);
}

.gallery-item--more:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
}

.gallery-item--more span {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-accent);
}

/* ========== 9. 班级文化 ========== */
.card--culture {
  justify-content: center;
  text-align: center;
  background: linear-gradient(
    135deg,
    var(--c-accent-light) 0%,
    var(--c-bg-card) 60%,
    var(--c-accent-light) 100%
  );
  background-size: 250% 250%;
  animation: gradientFlow 16s ease infinite reverse;
  border-color: var(--c-border-accent);
}

.card--culture:hover {
  background: linear-gradient(
    135deg,
    var(--c-accent-light) 0%,
    var(--c-bg-secondary) 60%,
    var(--c-accent-light) 100%
  );
  background-size: 250% 250%;
  animation: gradientFlow 16s ease infinite reverse;
}

.culture-slogan {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--c-accent);
  margin: 8px 0 0 0;
  line-height: 1.3;
  font-style: italic;
  transition: transform var(--transition-slow);
}

.card--culture:hover .culture-slogan {
  transform: scale(1.03);
}

.culture-values {
  font-size: 11px;
  font-weight: 400;
  color: var(--c-text-secondary);
  margin: 6px 0 0 0;
  line-height: 1.5;
  letter-spacing: 0.2px;
}

.culture-divider {
  width: 32px;
  height: 1.5px;
  background: var(--c-border-accent);
  margin: 12px auto;
  border-radius: 1px;
  transition: width var(--transition-base);
}

.card--culture:hover .culture-divider {
  width: 48px;
}

.culture-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--c-text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* ========== 10. 班费 ========== */
.finance-balance {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}

.finance-amount {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--c-text-primary);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.finance-label {
  font-size: 11px;
  color: var(--c-text-tertiary);
}

.finance-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 0.5px solid var(--c-separator);
  flex: 1;
}

.finance-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  cursor: help;
}

.finance-tooltip-wrap:hover .finance-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}

.finance-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: var(--c-text-primary);
  color: var(--c-bg-card);
  font-size: 11px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  z-index: 10;
  max-width: 200px;
  text-align: center;
}

.finance-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--c-text-primary);
}

.finance-divider-v {
  width: 0.5px;
  height: 28px;
  background: var(--c-separator);
  flex-shrink: 0;
}

.finance-sub {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  transition: transform var(--transition-fast);
}

.finance-col:hover .finance-sub {
  transform: translateY(-1px);
}

.finance-sub--income { color: var(--c-green); }
.finance-sub--expense { color: var(--c-orange); }

.finance-sublabel {
  font-size: 10px;
  color: var(--c-text-tertiary);
}

/* ========== 回到顶部按钮 ========== */
.back-to-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--c-bg-card);
  border: 0.5px solid var(--c-separator);
  color: var(--c-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-float);
  z-index: 90;
  transition: transform var(--transition-base),
              background-color var(--transition-base),
              box-shadow var(--transition-base);
}

.back-to-top:hover {
  background: var(--c-accent);
  color: var(--c-text-inverse);
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-mint);
}

.back-to-top:active {
  transform: translateY(-1px) scale(0.98);
}

/* 回到顶部过渡动画 */
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.9);
}

.back-to-top:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 3px;
}

/* ========== 响应式 ========== */

/* 平板：3列 */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(142px, auto);
    gap: 12px;
    /* 平板端3列布局 */
    grid-template-areas:
      "identity identity identity"
      "schedule schedule quicklinks"
      "homework countdown finance"
      "announcements announcements mentors"
      "gallery gallery culture";
  }

  .card--identity {
    grid-column: span 3;
    grid-row: span 1;
  }

  .card--identity .identity-inner {
    flex-direction: row;
    text-align: left;
    gap: 28px;
  }

  .card--identity .identity-badge {
    width: 72px;
    height: 72px;
  }

  .card--schedule { grid-column: span 2; }
  .card--announcements { grid-column: span 2; }
  .card--gallery { grid-column: span 2; }

  .countdown-ring {
    width: 90px;
    height: 90px;
  }

  .countdown-number {
    font-size: 34px;
  }
}

/* 手机：2列 */
@media (max-width: 640px) {
  .home-dashboard {
    padding: 20px 16px 40px;
  }

  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: minmax(132px, auto);
    gap: 10px;
    /* 手机端2列布局：1身份 2课程 3快捷 4作业 5公告 6班费 7倒计时 8相册 9传承人 10文化 */
    grid-template-areas:
      "identity identity"
      "schedule schedule"
      "quicklinks homework"
      "announcements announcements"
      "finance countdown"
      "gallery gallery"
      "mentors culture";
  }

  .card {
    padding: 14px;
  }

  .card--identity {
    grid-column: span 2;
    grid-row: span 1;
  }

  .card--schedule { grid-column: span 2; }
  .card--announcements { grid-column: span 2; }
  .card--gallery { grid-column: span 2; }

  .card--identity .identity-inner {
    flex-direction: row;
    text-align: center;
    justify-content: center;
    gap: 24px;
  }

  .identity-badge {
    width: 64px;
    height: 64px;
  }

  .identity-name {
    font-size: 22px;
  }

  .countdown-ring {
    width: 84px;
    height: 84px;
  }

  .countdown-number {
    font-size: 30px;
  }

  .quicklinks-grid {
    gap: 6px;
  }

  .quicklink-label {
    font-size: 10px;
  }

  .back-to-top {
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
  }

  .finance-tooltip {
    display: none;
  }
}

/* 超小屏：1列 */
@media (max-width: 380px) {
  .bento-grid {
    grid-template-columns: 1fr;
    /* 超小屏1列布局，按手机端顺序 */
    grid-template-areas:
      "identity"
      "schedule"
      "quicklinks"
      "homework"
      "announcements"
      "finance"
      "countdown"
      "gallery"
      "mentors"
      "culture";
  }

  .card--identity,
  .card--schedule,
  .card--announcements,
  .card--gallery {
    grid-column: span 1;
  }

  .stat-number {
    font-size: 20px;
  }
}

/* ========== 减少动画偏好降级 ========== */
@media (prefers-reduced-motion: reduce) {
  .card {
    opacity: 1 !important;
    transform: none !important;
    transition: background-color var(--transition-base),
                border-color var(--transition-base) !important;
  }

  .card::after {
    display: none !important;
  }

  .grid-spotlight {
    display: none !important;
  }

  .particle {
    display: none !important;
  }

  .card--identity,
  .card--culture {
    animation: none !important;
  }

  .countdown-number--urgent,
  .countdown-ring--urgent,
  .schedule-countdown--soon {
    animation: none !important;
  }

  .progress-shimmer {
    display: none !important;
  }

  .skeleton-date,
  .skeleton-line {
    animation: none !important;
  }

  .back-to-top {
    transition: opacity 0.2s ease !important;
  }

  .schedule-detail {
    transition: opacity 0.2s ease !important;
  }
}

/* ========== 触摸设备优化 ========== */
@media (hover: none) {
  .card::after {
    display: none;
  }

  .grid-spotlight {
    display: none;
  }

  .card:hover {
    box-shadow: none;
  }

  .quicklink-item:hover,
  .stat-item:hover,
  .mentor-avatar:hover,
  .gallery-item:hover {
    transform: none;
  }
}

/* ========== 截止提醒弹窗 ========== */
.alerts-container {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}
.deadline-alert {
  position: relative;
  width: 320px;
  background: var(--c-bg-card);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--c-border);
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 16px 14px;
  pointer-events: auto;
  animation: alertPulse 1.5s ease-in-out infinite;
  --alert-bg: linear-gradient(135deg, #ff9500, #ff6b00);
  --alert-glow: rgba(255, 149, 0, 0.35);
}
.deadline-alert-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--alert-bg);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.deadline-alert-content {
  flex: 1;
  min-width: 0;
}
.deadline-alert-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 3px;
}
.deadline-alert-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.5;
}
.deadline-alert-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: var(--alert-bg);
  transform-origin: left center;
  animation: progressShrink 6s linear forwards;
}
@keyframes progressShrink {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}
@keyframes alertPulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1); }
  50% { box-shadow: 0 8px 40px var(--alert-glow), 0 2px 12px var(--alert-glow); }
}
.alert-pop-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.alert-pop-leave-active {
  transition: all 0.25s ease-in;
}
.alert-pop-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}
.alert-pop-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

@media (max-width: 768px) {
  .alerts-container {
    top: 70px;
    right: 12px;
    left: 12px;
  }
  .deadline-alert {
    width: auto;
  }
}
</style>
