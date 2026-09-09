/**
 * 薄荷4班班级网站 - 自定义主题入口
 * 高级商务风格 · 深色主题 · 全动画效果
 */

import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import HeroSection from './components/HeroSection.vue'
import FeatureCards from './components/FeatureCards.vue'
import SchedulePreview from './components/SchedulePreview.vue'
import ScheduleView from './components/ScheduleView.vue'
import PlaceholderSection from './components/PlaceholderSection.vue'
import './styles/index.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件，可在Markdown中直接使用
    app.component('HeroSection', HeroSection)
    app.component('FeatureCards', FeatureCards)
    app.component('SchedulePreview', SchedulePreview)
    app.component('ScheduleView', ScheduleView)
    app.component('PlaceholderSection', PlaceholderSection)
  }
}
