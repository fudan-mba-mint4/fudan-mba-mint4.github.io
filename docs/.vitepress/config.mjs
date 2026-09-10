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
  { text: '公告', link: '/announcements/' },
  {
    text: '智库',
    items: [
      { text: '知识库', link: '/knowledge/' },
      { text: '课件下载', link: '/slides/' },
    ],
  },
  { text: '活动', link: '/activities/' },
  { text: '回忆', link: '/gallery/' },
  { text: '班费', link: '/finance/' },
  {
    text: '治理',
    items: [
      { text: '同学名录', link: '/directory/' },
      { text: '班委介绍', link: '/governance/' },
    ],
  },
  {
    text: '关于',
    items: [
      { text: '班级文化', link: '/about/culture/' },
      { text: '班级愿景', link: '/about/vision/' },
      { text: '职能架构', link: '/about/structure/' },
      { text: '职业发展', link: '/career/' },
    ],
  },
]

const zhSidebar = {
  '/announcements/': [
    {
      text: '公告',
      items: [{ text: '最新公告', link: '/announcements/' }],
    },
  ],
  '/knowledge/': [
    {
      text: '知识库',
      items: [{ text: '知识库首页', link: '/knowledge/' }],
    },
  ],
  '/governance/': [
    {
      text: '班委介绍',
      items: [{ text: '班委介绍', link: '/governance/' }],
    },
  ],
  '/about/culture/': [
    {
      text: '班级文化',
      items: [{ text: '班级文化', link: '/about/culture/' }],
    },
  ],
  '/about/vision/': [
    {
      text: '班级愿景',
      items: [{ text: '班级愿景', link: '/about/vision/' }],
    },
  ],
  '/about/structure/': [
    {
      text: '职能架构',
      items: [{ text: '职能架构', link: '/about/structure/' }],
    },
  ],
}

const zhFooter = {
  message: '复旦 MBA 薄荷 4 班 · 智库研究员共同维护',
  copyright: 'Copyright © 2024-present 薄荷 4 班',
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
  {
    text: 'Knowledge',
    items: [
      { text: 'Knowledge Base', link: '/en/knowledge/' },
      { text: 'Slides', link: '/en/slides/' },
    ],
  },
  { text: 'Activities', link: '/en/activities/' },
  { text: 'Memories', link: '/en/gallery/' },
  { text: 'Finance', link: '/en/finance/' },
  {
    text: 'Governance',
    items: [
      { text: 'Directory', link: '/en/directory/' },
      { text: 'Class Committee', link: '/en/governance/' },
    ],
  },
  {
    text: 'About',
    items: [
      { text: 'Class Culture', link: '/en/about/culture/' },
      { text: 'Class Vision', link: '/en/about/vision/' },
      { text: 'Org Structure', link: '/en/about/structure/' },
      { text: 'Career', link: '/en/career/' },
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
  '/en/governance/': [
    {
      text: 'Class Committee',
      items: [{ text: 'Class Committee', link: '/en/governance/' }],
    },
  ],
  '/en/about/culture/': [
    {
      text: 'Class Culture',
      items: [{ text: 'Class Culture', link: '/en/about/culture/' }],
    },
  ],
  '/en/about/vision/': [
    {
      text: 'Class Vision',
      items: [{ text: 'Class Vision', link: '/en/about/vision/' }],
    },
  ],
  '/en/about/structure/': [
    {
      text: 'Org Structure',
      items: [{ text: 'Org Structure', link: '/en/about/structure/' }],
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
  {
    text: 'ความรู้',
    items: [
      { text: 'คลังความรู้', link: '/th/knowledge/' },
      { text: 'ไฟล์บรรยาย', link: '/th/slides/' },
    ],
  },
  { text: 'กิจกรรม', link: '/th/activities/' },
  { text: 'ความทรงจำ', link: '/th/gallery/' },
  { text: 'การเงิน', link: '/th/finance/' },
  {
    text: 'การปกครอง',
    items: [
      { text: 'รายชื่อ', link: '/th/directory/' },
      { text: 'คณะกรรมการ', link: '/th/governance/' },
    ],
  },
  {
    text: 'เกี่ยวกับ',
    items: [
      { text: 'วัฒนธรรมชั้นเรียน', link: '/th/about/culture/' },
      { text: 'วิสัยทัศน์', link: '/th/about/vision/' },
      { text: 'โครงสร้าง', link: '/th/about/structure/' },
      { text: 'อาชีพ', link: '/th/career/' },
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
  '/th/governance/': [
    {
      text: 'คณะกรรมการ',
      items: [{ text: 'คณะกรรมการ', link: '/th/governance/' }],
    },
  ],
  '/th/about/culture/': [
    {
      text: 'วัฒนธรรมชั้นเรียน',
      items: [{ text: 'วัฒนธรรมชั้นเรียน', link: '/th/about/culture/' }],
    },
  ],
  '/th/about/vision/': [
    {
      text: 'วิสัยทัศน์',
      items: [{ text: 'วิสัยทัศน์', link: '/th/about/vision/' }],
    },
  ],
  '/th/about/structure/': [
    {
      text: 'โครงสร้าง',
      items: [{ text: 'โครงสร้าง', link: '/th/about/structure/' }],
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
  title: '复旦 MBA 薄荷 4 班',
  description: '复旦 MBA 薄荷 4 班官方主页 — 课表、公告、智库、活动、回忆、班费与班级治理',

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
