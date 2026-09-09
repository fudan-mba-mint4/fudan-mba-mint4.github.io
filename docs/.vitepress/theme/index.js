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
  }
}
