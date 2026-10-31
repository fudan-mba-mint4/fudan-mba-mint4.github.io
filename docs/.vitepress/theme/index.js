/**
 * 薄荷4班班级网站 - 自定义主题入口
 * 苹果 HIG 风格 · 支持浅色/深色模式
 */

import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import ScheduleView from './components/ScheduleView.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import Classmates from './components/Classmates.vue'
import HomeDashboard from './components/HomeDashboard.vue'
import CourseMaterials from './components/CourseMaterials.vue'
import PageHeader from './components/PageHeader.vue'
import Announcements from './components/Announcements.vue'
import ClassFinanceLedger from './components/ClassFinanceLedger.vue'
import ClassFinanceBudgets from './components/ClassFinanceBudgets.vue'
import ClassFinanceReimb from './components/ClassFinanceReimb.vue'
import ClassFinanceWorkbench from './components/ClassFinanceWorkbench.vue'
import KnowledgeBase from './components/KnowledgeBase.vue'
import Activities from './components/Activities.vue'
import ClassCulture from './components/ClassCulture.vue'
import ClassVision from './components/ClassVision.vue'
import OrgStructure from './components/OrgStructure.vue'
import ClassCommittee from './components/ClassCommittee.vue'
import Gallery from './components/Gallery.vue'
import ToolsHub from './components/ToolsHub.vue'
import QuizHub from './components/QuizHub.vue'
import CareerDev from './components/CareerDev.vue'
import AdminPanel from './components/AdminPanel.vue'
import TreeHole from './components/TreeHole.vue'
import AuthPage from './components/AuthPage.vue'
import ProfilePage from './components/ProfilePage.vue'
import Polls from './components/Polls.vue'
import CityFootprint from './components/CityFootprint.vue'
import Wishes from './components/Wishes.vue'
import MintCoins from './components/MintCoins.vue'
import GuideCards from './components/GuideCards.vue'

// ===== 指南中心 Guide* 组件族（蓝图 §5，方案 B+） =====
import GuideSectionHead from './components/GuideSectionHead.vue'
import GuideCallout from './components/GuideCallout.vue'
import GuideStepList from './components/GuideStepList.vue'
import GuideStepFlow from './components/GuideStepFlow.vue'
import GuideInfoTable from './components/GuideInfoTable.vue'
import GuideRoleCard from './components/GuideRoleCard.vue'
import GuideFaqItem from './components/GuideFaqItem.vue'
import GuideFaq from './components/GuideFaq.vue'
import GuideTopicCard from './components/GuideTopicCard.vue'
import GuideHomeSearch from './components/GuideHomeSearch.vue'
import GuideEmptyState from './components/GuideEmptyState.vue'
import GuideMaintenanceBar from './components/GuideMaintenanceBar.vue'
import GuideRelatedLinks from './components/GuideRelatedLinks.vue'
import GuideDocFooter from './components/GuideDocFooter.vue'
import GuideFeedback from './components/GuideFeedback.vue'
import GuideBreadcrumb from './components/GuideBreadcrumb.vue'
import GuideTopicRail from './components/GuideTopicRail.vue'
import GuideToc from './components/GuideToc.vue'
import GuideDocShell from './components/GuideDocShell.vue'
import GuideLanding from './components/GuideLanding.vue'

import './styles/index.css'
import './styles/guide.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件，可在 Markdown 中直接使用
    app.component('ScheduleView', ScheduleView)
    app.component('MobileTabBar', MobileTabBar)
    app.component('Classmates', Classmates)
    app.component('HomeDashboard', HomeDashboard)
    app.component('CourseMaterials', CourseMaterials)
    app.component('PageHeader', PageHeader)
    app.component('Announcements', Announcements)
    app.component('ClassFinanceLedger', ClassFinanceLedger)
    app.component('ClassFinanceBudgets', ClassFinanceBudgets)
    app.component('ClassFinanceReimb', ClassFinanceReimb)
    app.component('ClassFinanceWorkbench', ClassFinanceWorkbench)
    app.component('KnowledgeBase', KnowledgeBase)
    app.component('Activities', Activities)
    app.component('ClassCulture', ClassCulture)
    app.component('ClassVision', ClassVision)
    app.component('OrgStructure', OrgStructure)
    app.component('ClassCommittee', ClassCommittee)
    app.component('Gallery', Gallery)
    app.component('ToolsHub', ToolsHub)
    app.component('QuizHub', QuizHub)
    app.component('CareerDev', CareerDev)
    app.component('AdminPanel', AdminPanel)
    app.component('TreeHole', TreeHole)
    app.component('AuthPage', AuthPage)
    app.component('ProfilePage', ProfilePage)
    app.component('Polls', Polls)
    app.component('CityFootprint', CityFootprint)
    app.component('Wishes', Wishes)
    app.component('MintCoins', MintCoins)
    app.component('GuideCards', GuideCards)

    // 指南中心 Guide* 组件族（蓝图 §5.0：md 中可直接标签使用）
    app.component('GuideSectionHead', GuideSectionHead)
    app.component('GuideCallout', GuideCallout)
    app.component('GuideStepList', GuideStepList)
    app.component('GuideStepFlow', GuideStepFlow)
    app.component('GuideInfoTable', GuideInfoTable)
    app.component('GuideRoleCard', GuideRoleCard)
    app.component('GuideFaqItem', GuideFaqItem)
    app.component('GuideFaq', GuideFaq)
    app.component('GuideTopicCard', GuideTopicCard)
    app.component('GuideHomeSearch', GuideHomeSearch)
    app.component('GuideEmptyState', GuideEmptyState)
    app.component('GuideMaintenanceBar', GuideMaintenanceBar)
    app.component('GuideRelatedLinks', GuideRelatedLinks)
    app.component('GuideDocFooter', GuideDocFooter)
    app.component('GuideFeedback', GuideFeedback)
    app.component('GuideBreadcrumb', GuideBreadcrumb)
    app.component('GuideTopicRail', GuideTopicRail)
    app.component('GuideToc', GuideToc)
    app.component('GuideDocShell', GuideDocShell)
    app.component('GuideLanding', GuideLanding)

    // 全局IP追踪：应用启动 2 秒后静默记录一次城市足迹。
    // - enhanceApp 只在应用首次启动时执行一次，SPA 路由切换不会重复触发，
    //   因此这里不需要 router.onAfterRouteChanged；30 分钟去重窗口由 API 负责。
    // - 使用 sendBeacon（或 fetch keepalive），保证用户立即跳走时请求仍能送达；
    //   不 await、不抛错、不打扰用户。
    const trackVisit = () => {
      try {
        const url = '/api/city-footprint'
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          // sendBeacon 仅支持 POST，body 为空即可
          navigator.sendBeacon(url)
        } else {
          fetch(url, { method: 'POST', keepalive: true }).catch(() => {})
        }
      } catch (e) { /* 静默 */ }
    }
    setTimeout(trackVisit, 2000)

    // 以下 DOM 操作仅在浏览器端执行（SSR 时无 document）
    if (typeof window === 'undefined') return

    // 路由切换顶部进度条
    const bar = document.createElement('div')
    bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:var(--c-accent,#2D7A6C);z-index:99999;transition:width .2s ease,opacity .3s ease;width:0;opacity:0;box-shadow:0 0 8px rgba(45,122,108,.5)'
    document.body.appendChild(bar)

    router.onBeforeRouteChange = () => {
      bar.style.opacity = '1'
      bar.style.width = '30%'
      setTimeout(() => { bar.style.width = '60%' }, 200)
    }

    // 全局截止提醒弹窗：进首页后检测今日/明日截止的作业
    const showDeadlinePopup = async () => {
      if (sessionStorage.getItem('deadline_popup_shown') === '1') return
      if (router.route.path !== '/' && router.route.path !== '/index.html') return

      try {
        const hwRes = await fetch('/data/homework.json')
        if (!hwRes.ok) return
        const hwData = await hwRes.json()
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const items = []

        for (const hw of (hwData.homework || [])) {
          if (hw.status !== 'pending') continue
          const due = new Date(hw.deadline + 'T00:00:00')
          const diffDays = Math.round((due - today) / 864e5)
          if (diffDays === 0) {
            items.push({
              type: '作业', color: '#FF3B30',
              title: hw.title, desc: hw.course,
              time: `今日截止（${hw.deadline_time || '23:59'}）`,
            })
          } else if (diffDays === 1) {
            items.push({
              type: '作业', color: '#FF9500',
              title: hw.title, desc: hw.course,
              time: `明天截止（${hw.deadline_time || '23:59'}）`,
            })
          }
        }

        if (items.length === 0) return
        sessionStorage.setItem('deadline_popup_shown', '1')

        const popup = document.createElement('div')
        popup.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99998;display:flex;flex-direction:column;gap:8px;max-width:340px'
        items.forEach((item, i) => {
          const card = document.createElement('div')
          card.style.cssText = `background:rgba(255,255,255,.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:12px;padding:14px 16px;box-shadow:0 4px 20px rgba(0,0,0,.1);border-left:4px solid ${item.color};opacity:0;transform:translateX(40px);transition:all .3s ease`
          card.innerHTML = `
            <div style="font-size:11px;font-weight:600;color:${item.color};margin-bottom:4px">⏰ ${item.type}提醒</div>
            <div style="font-size:14px;font-weight:600;color:#1d1d1f">${item.title}</div>
            <div style="font-size:12px;color:#6e6e73;margin-top:2px">${item.desc} · ${item.time}</div>
            <div style="height:3px;background:${item.color};margin-top:8px;border-radius:2px;width:100%;transform-origin:left;animation:deadline-progress 6s linear forwards"></div>
          `
          popup.appendChild(card)
          setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateX(0)' }, 100 + i * 100)
          setTimeout(() => { card.style.opacity = '0'; card.style.transform = 'translateX(40px)' }, 6000 + i * 100)
        })

        if (!document.getElementById('deadline-popup-style')) {
          const style = document.createElement('style')
          style.id = 'deadline-popup-style'
          style.textContent = '@keyframes deadline-progress { from { width: 100% } to { width: 0% } }'
          document.head.appendChild(style)
        }

        document.body.appendChild(popup)
        setTimeout(() => { popup.remove() }, 7000)
      } catch (e) { /* 静默 */ }
    }

    router.onAfterRouteChanged = () => {
      bar.style.width = '100%'
      setTimeout(() => { bar.style.opacity = '0'; bar.style.width = '0' }, 200)
      setTimeout(showDeadlinePopup, 800)
    }
  }
}
