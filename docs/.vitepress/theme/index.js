/**
 * 薄荷4班班级网站 - 自定义主题入口
 * 苹果 HIG 风格 · 支持浅色/深色模式
 */

import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import HeroSection from './components/HeroSection.vue'
import FeatureCards from './components/FeatureCards.vue'
import SchedulePreview from './components/SchedulePreview.vue'
import ScheduleView from './components/ScheduleView.vue'
import PlaceholderSection from './components/PlaceholderSection.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import Classmates from './components/Classmates.vue'
import HomeDashboard from './components/HomeDashboard.vue'
import CourseMaterials from './components/CourseMaterials.vue'
import PageHeader from './components/PageHeader.vue'
import Announcements from './components/Announcements.vue'
import ClassFinance from './components/ClassFinance.vue'
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
import './styles/index.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件，可在 Markdown 中直接使用
    app.component('HeroSection', HeroSection)
    app.component('FeatureCards', FeatureCards)
    app.component('SchedulePreview', SchedulePreview)
    app.component('ScheduleView', ScheduleView)
    app.component('PlaceholderSection', PlaceholderSection)
    app.component('MobileTabBar', MobileTabBar)
    app.component('Classmates', Classmates)
    app.component('HomeDashboard', HomeDashboard)
    app.component('CourseMaterials', CourseMaterials)
    app.component('PageHeader', PageHeader)
    app.component('Announcements', Announcements)
    app.component('ClassFinance', ClassFinance)
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
  }
}
