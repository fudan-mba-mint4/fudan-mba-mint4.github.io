import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '复旦MBA 薄荷4班',
  description: '班级官方主页 - 课表、公告、知识库、课件',
  
  // 网站语言
  lang: 'zh-CN',
  
  // 最后更新时间
  lastUpdated: true,
  
  themeConfig: {
    // 网站logo（后续替换为班徽）
    logo: '/images/logo.jpg',
    
    // 顶部导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '课表', link: '/schedule' },
      { text: '公告通知', link: '/announcements/' },
      { text: '知识库', link: '/knowledge/' },
      { text: '课件下载', link: '/slides/' },
    ],
    
    // 侧边栏配置
    sidebar: {
      '/announcements/': [
        {
          text: '公告通知',
          items: [
            { text: '最新公告', link: '/announcements/' },
          ]
        }
      ],
      '/knowledge/': [
        {
          text: '知识库',
          items: [
            { text: '知识库首页', link: '/knowledge/' },
          ]
        }
      ],
    },
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/fudan-mba-mint4' },
    ],
    
    // 页脚
    footer: {
      message: '复旦MBA 薄荷4班 · 智库研究员共同维护',
      copyright: 'Copyright © 2024-present 薄荷4班'
    },
    
    // 本地搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索'
          },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除查询条件',
            backButtonTitle: '关闭搜索',
            noResultsText: '无法找到相关结果',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    
    // 回到顶部
    returnToTopLabel: '回到顶部',
    
    // 大纲标题
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    
    // 最后更新文本
    lastUpdatedText: '最后更新',
    
    // 文档页脚
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
  }
})
