<script setup>
import DefaultTheme from 'vitepress/theme'
import MobileTabBar from './components/MobileTabBar.vue'
import { useScrollReveal } from './composables/useScrollReveal'
import { onMounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

// 初始化滚动渐入动画
const { refresh } = useScrollReveal()

// 页面切换后：重新初始化滚动动画 + 滚动到顶部
watch(
  () => page.value.relativePath,
  async () => {
    await nextTick()
    setTimeout(() => {
      refresh()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 200)
  }
)

onMounted(() => {
  // 深色模式：每次都跟随系统设置，手动切换不保留记忆
  localStorage.removeItem('vitepress-theme-appearance')
  const applySystemTheme = () => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  }
  applySystemTheme()
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', applySystemTheme)

  // 导航栏滚动效果（滚动超过50px时切换毛玻璃强度）
  const nav = document.querySelector('.VPNav')
  if (nav) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled')
      } else {
        nav.classList.remove('scrolled')
      }
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <!-- 移动端底部 Tab Bar（仅 <768px 显示） -->
      <MobileTabBar />
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
/* 布局相关的额外样式 */
</style>
