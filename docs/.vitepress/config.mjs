import { defineConfig } from 'vitepress'
import markdownItPangu from 'markdown-it-pangu'

// ========== 共享配置（所有语言共用） ==========
const sharedThemeConfig = {
  logo: '/images/logo.webp',
}

// ========== 各语言导航 / 侧边栏 / 页脚 / 搜索文案 ==========

// 中文（根路径 /）
const zhNav = [
  { text: '首页', link: '/' },
  {
    text: '主理团',
    items: [
      { text: '公告通知', link: '/announcements/' },
      { text: '班委介绍', link: '/governance/' },
      { text: '班级文化', link: '/about/culture/' },
      { text: '愿景使命', link: '/about/vision/' },
      { text: '职能架构', link: '/about/structure/' },
    ],
  },
  {
    text: '体验运营',
    items: [
      { text: '班级投票', link: '/polls/' },
      { text: '活动日历', link: '/activities/' },
      { text: '同学名录', link: '/directory/' },
      { text: '职业发展', link: '/career/' },
    ],
  },
  { text: '财务激励', link: '/finance/' },
  {
    text: '记忆主理',
    items: [
      { text: '活动相册', link: '/gallery/' },
      { text: '匿名树洞', link: '/treehole/' },
      { text: '城市足迹', link: '/city-footprint/' },
    ],
  },
  {
    text: '智库研究',
    items: [
      { text: '课表', link: '/schedule' },
      { text: '知识库', link: '/knowledge/' },
      { text: '课程资料', link: '/slides/' },
    ],
  },
  {
    text: '工具箱',
    items: [
      { text: '入学测试知识库', link: '/quiz/' },
      { text: '实用小工具', link: '/tools/' },
      { text: '管理后台', link: '/admin/' },
    ],
  },
]

const zhSidebar = {}

const zhFooter = {
  message: '复旦 MBA 薄荷 4 班 · 雷振宇维护',
  copyright: 'Copyright © 2026 薄荷 4 班',
}

const zhSearch = {
  provider: 'local',
  options: {
    translations: {
      button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
      modal: {
        displayDetails: '显示详细列表',
        resetButtonTitle: '清除查询条件',
        backButtonTitle: '关闭搜索',
        noResultsText: '无法找到相关结果',
        footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
      },
    },
  },
}

// English（/en/）
const enNav = [
  { text: 'Home', link: '/en/' },
  {
    text: 'Leadership',
    items: [
      { text: 'Announcements', link: '/en/announcements/' },
      { text: 'Class Committee', link: '/en/governance/' },
      { text: 'Class Culture', link: '/en/about/culture/' },
      { text: 'Vision & Mission', link: '/en/about/vision/' },
      { text: 'Org Structure', link: '/en/about/structure/' },
    ],
  },
  {
    text: 'Experience',
    items: [
      { text: 'Polls', link: '/en/polls/' },
      { text: 'Activities', link: '/en/activities/' },
      { text: 'Directory', link: '/en/directory/' },
      { text: 'Career', link: '/en/career/' },
    ],
  },
  { text: 'Finance', link: '/en/finance/' },
  {
    text: 'Memories',
    items: [
      { text: 'Gallery', link: '/en/gallery/' },
      { text: 'Anonymous Tree Hole', link: '/en/treehole/' },
      { text: 'City Footprint', link: '/en/city-footprint/' },
    ],
  },
  {
    text: 'Research',
    items: [
      { text: 'Schedule', link: '/en/schedule' },
      { text: 'Knowledge Base', link: '/en/knowledge/' },
      { text: 'Course Materials', link: '/en/slides/' },
    ],
  },
  {
    text: 'Tools',
    items: [
      { text: 'Entry Quiz KB', link: '/en/quiz/' },
      { text: 'Utilities', link: '/en/tools/' },
      { text: 'Admin Panel', link: '/en/admin/' },
    ],
  },
]

const enSidebar = {}

const enFooter = {
  message: 'Fudan MBA Mint 4 · Maintained by Zhenyu Lei',
  copyright: 'Copyright © 2026 Mint 4 Class',
}

const enSearch = {
  provider: 'local',
  options: {
    translations: {
      button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
      modal: {
        displayDetails: 'Detailed list',
        resetButtonTitle: 'Clear',
        backButtonTitle: 'Close search',
        noResultsText: 'No results found',
        footer: { selectText: 'Select', navigateText: 'Navigate', closeText: 'Close' },
      },
    },
  },
}

// ไทย（/th/）
const thNav = [
  { text: 'หน้าแรก', link: '/th/' },
  {
    text: 'ผู้นำ',
    items: [
      { text: 'ประกาศ', link: '/th/announcements/' },
      { text: 'คณะกรรมการ', link: '/th/governance/' },
      { text: 'วัฒนธรรมชั้นเรียน', link: '/th/about/culture/' },
      { text: 'วิสัยทัศน์', link: '/th/about/vision/' },
      { text: 'โครงสร้าง', link: '/th/about/structure/' },
    ],
  },
  {
    text: 'ประสบการณ์',
    items: [
      { text: 'โหวต', link: '/th/polls/' },
      { text: 'กิจกรรม', link: '/th/activities/' },
      { text: 'รายชื่อ', link: '/th/directory/' },
      { text: 'อาชีพ', link: '/th/career/' },
    ],
  },
  { text: 'การเงิน', link: '/th/finance/' },
  {
    text: 'ความทรงจำ',
    items: [
      { text: 'อัลบั้ม', link: '/th/gallery/' },
      { text: 'กระบอกไม้ไผ่', link: '/th/treehole/' },
      { text: 'ร่องรอยเมือง', link: '/th/city-footprint/' },
    ],
  },
  {
    text: 'วิจัย',
    items: [
      { text: 'ตารางเรียน', link: '/th/schedule' },
      { text: 'คลังความรู้', link: '/th/knowledge/' },
      { text: 'เอกสารรายวิชา', link: '/th/slides/' },
    ],
  },
  {
    text: 'เครื่องมือ',
    items: [
      { text: 'คลังข้อสอบเข้า', link: '/th/quiz/' },
      { text: 'เครื่องมือทั่วไป', link: '/th/tools/' },
      { text: 'แผงควบคุม', link: '/th/admin/' },
    ],
  },
]

const thSidebar = {}

const thFooter = {
  message: 'Fudan MBA มินต์ 4 · ดูแลโดย Zhenyu Lei',
  copyright: 'Copyright © 2026 ชั้นเรียนมินต์ 4',
}

const thSearch = {
  provider: 'local',
  options: {
    translations: {
      button: { buttonText: 'ค้นหา', buttonAriaLabel: 'ค้นหา' },
      modal: {
        displayDetails: 'แสดงรายละเอียด',
        resetButtonTitle: 'ล้างการค้นหา',
        backButtonTitle: 'ปิดการค้นหา',
        noResultsText: 'ไม่พบผลลัพธ์',
        footer: { selectText: 'เลือก', navigateText: 'เปลี่ยน', closeText: 'ปิด' },
      },
    },
  },
}

// ========== 导出最终配置 ==========
export default defineConfig({
  title: '复旦 MBA 薄荷 4 班',
  description: '复旦 MBA 薄荷 4 班官方主页 — 课表、公告、智库、活动、回忆、班费与班级治理',

  // 站点图标
  head: [
    ['link', { rel: 'icon', href: '/favicon.png' }],
    // 泰文字体已本地化，不依赖Google Fonts（国内访问优化）
  ],

  // 启用浅色/深色模式切换
  appearance: true,

  // 最后更新时间
  lastUpdated: true,

  // Markdown：中西文自动空格（pangu），跳过行内代码
  markdown: {
    config(md) {
      md.use(markdownItPangu, { additionalRules: [] })
    },
  },

  // 共享 themeConfig（logo / 社交链接）
  themeConfig: {
    ...sharedThemeConfig,
  },

  // ========== 多语言配置 ==========
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      description: '复旦 MBA 薄荷 4 班官方主页 — 课表、公告、智库、活动、回忆、班费与班级治理',
      themeConfig: {
        ...sharedThemeConfig,
        nav: zhNav,
        sidebar: zhSidebar,
        footer: zhFooter,
        search: zhSearch,
        returnToTopLabel: '回到顶部',
        outline: { level: [2, 3], label: '本页目录' },
        lastUpdatedText: '最后更新',
        docFooter: { prev: '上一页', next: '下一页' },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      description: 'Fudan MBA Mint 4 Class Portal — Schedule, Announcements, Knowledge, Activities, Memories, Finance and Governance',
      themeConfig: {
        ...sharedThemeConfig,
        nav: enNav,
        sidebar: enSidebar,
        footer: enFooter,
        search: enSearch,
        returnToTopLabel: 'Back to top',
        outline: { level: [2, 3], label: 'On this page' },
        lastUpdatedText: 'Last updated',
        docFooter: { prev: 'Previous page', next: 'Next page' },
      },
    },
    th: {
      label: 'ไทย',
      lang: 'th-TH',
      description: 'เว็บไซต์ชั้นเรียน Fudan MBA มินต์ 4 — ตารางเรียน ประกาศ ความรู้ กิจกรรม ความทรงจำ การเงิน และการปกครอง',
      themeConfig: {
        ...sharedThemeConfig,
        nav: thNav,
        sidebar: thSidebar,
        footer: thFooter,
        search: thSearch,
        returnToTopLabel: 'กลับด้านบน',
        outline: { level: [2, 3], label: 'ในหน้านี้' },
        lastUpdatedText: 'อัปเดตล่าสุด',
        docFooter: { prev: 'หน้าก่อน', next: 'หน้าถัดไป' },
      },
    },
  },
})
