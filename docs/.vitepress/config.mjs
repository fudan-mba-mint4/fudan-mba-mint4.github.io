import { defineConfig } from 'vitepress'
import markdownItPangu from 'markdown-it-pangu'

// ========== 共享配置（所有语言共用） ==========
const sharedThemeConfig = {
  logo: '/images/logo.png',
  socialLinks: [
    { icon: 'github', link: 'https://github.com/fudan-mba-mint4' },
  ],
}

// ========== 各语言导航 / 侧边栏 / 页脚 / 搜索文案 ==========

// 中文（根路径 /）
const zhNav = [
  { text: '首页', link: '/' },
  { text: '课表', link: '/schedule' },
  { text: '公告通知', link: '/announcements/' },
  { text: '知识库', link: '/knowledge/' },
  { text: '课件下载', link: '/slides/' },
  {
    text: '更多',
    items: [
      { text: '同学名录', link: '/directory/' },
      { text: '活动相册', link: '/gallery/' },
      { text: '职业发展', link: '/career/' },
      { text: '班费公开', link: '/finance/' },
      { text: '活动日历', link: '/activities/' },
    ],
  },
]

const zhSidebar = {
  '/announcements/': [
    {
      text: '公告通知',
      items: [{ text: '最新公告', link: '/announcements/' }],
    },
  ],
  '/knowledge/': [
    {
      text: '知识库',
      items: [{ text: '知识库首页', link: '/knowledge/' }],
    },
  ],
}

const zhFooter = {
  message: '复旦MBA 薄荷4班 · 智库研究员共同维护',
  copyright: 'Copyright © 2024-present 薄荷4班',
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
  { text: 'Schedule', link: '/en/schedule' },
  { text: 'Announcements', link: '/en/announcements/' },
  { text: 'Knowledge', link: '/en/knowledge/' },
  { text: 'Slides', link: '/en/slides/' },
  {
    text: 'More',
    items: [
      { text: 'Directory', link: '/en/directory/' },
      { text: 'Gallery', link: '/en/gallery/' },
      { text: 'Career', link: '/en/career/' },
      { text: 'Finance', link: '/en/finance/' },
      { text: 'Activities', link: '/en/activities/' },
    ],
  },
]

const enSidebar = {
  '/en/announcements/': [
    {
      text: 'Announcements',
      items: [{ text: 'Latest', link: '/en/announcements/' }],
    },
  ],
  '/en/knowledge/': [
    {
      text: 'Knowledge Base',
      items: [{ text: 'Overview', link: '/en/knowledge/' }],
    },
  ],
}

const enFooter = {
  message: 'Fudan MBA Mint 4 · Maintained by Research Team',
  copyright: 'Copyright © 2024-present Mint 4 Class',
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
  { text: 'ตารางเรียน', link: '/th/schedule' },
  { text: 'ประกาศ', link: '/th/announcements/' },
  { text: 'ความรู้', link: '/th/knowledge/' },
  { text: 'ไฟล์บรรยาย', link: '/th/slides/' },
  {
    text: 'เพิ่มเติม',
    items: [
      { text: 'รายชื่อ', link: '/th/directory/' },
      { text: 'แกลเลอรี', link: '/th/gallery/' },
      { text: 'อาชีพ', link: '/th/career/' },
      { text: 'การเงิน', link: '/th/finance/' },
      { text: 'กิจกรรม', link: '/th/activities/' },
    ],
  },
]

const thSidebar = {
  '/th/announcements/': [
    {
      text: 'ประกาศ',
      items: [{ text: 'ประกาศล่าสุด', link: '/th/announcements/' }],
    },
  ],
  '/th/knowledge/': [
    {
      text: 'ความรู้',
      items: [{ text: 'ภาพรวม', link: '/th/knowledge/' }],
    },
  ],
}

const thFooter = {
  message: 'Fudan MBA มินต์ 4 · ดูแลโดยทีมวิจัย',
  copyright: 'Copyright © 2024-present ชั้นเรียนมินต์ 4',
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
  title: '复旦MBA 薄荷4班',
  description: '班级官方主页 - 课表、公告、知识库、课件',

  // 站点图标
  head: [
    ['link', { rel: 'icon', href: '/favicon.png' }],
    // 泰文字体（Noto Sans Thai），按需加载
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap',
      },
    ],
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
      description: '班级官方主页 - 课表、公告、知识库、课件',
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
      description: 'Class Portal - Schedule, Announcements, Knowledge Base, Slides',
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
      description: 'เว็บไซต์ชั้นเรียน - ตารางเรียน ประกาศ ความรู้ สไลด์',
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
