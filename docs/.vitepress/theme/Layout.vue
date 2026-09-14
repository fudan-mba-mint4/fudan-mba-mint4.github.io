<script setup>
import DefaultTheme from 'vitepress/theme'
import MobileTabBar from './components/MobileTabBar.vue'
import UserNavMenu from './components/UserNavMenu.vue'
import { useScrollReveal } from './composables/useScrollReveal'
import { onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

// 初始化滚动渐入动画
const { refresh } = useScrollReveal()

// 保存定时器句柄，避免快速导航时多个 setTimeout 竞态
let scrollTimer = null

// 页面切换后：重新初始化滚动动画 + 滚动到顶部
watch(
  () => page.value.relativePath,
  async () => {
    await nextTick()
    if (scrollTimer) clearTimeout(scrollTimer)
    scrollTimer = setTimeout(() => {
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
  let handleScroll = null
  if (nav) {
    handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled')
      } else {
        nav.classList.remove('scrolled')
      }
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  // ========== PDF后台预加载 ==========
  // 策略：页面加载完成后，浏览器空闲时自动预加载课程资料中的PDF
  // 用 <link rel="prefetch"> 最低优先级，不影响页面性能，用户点击下载时直接从缓存读取
  const prefetchPDFs = async () => {
    try {
      const res = await fetch('/data/course-materials.json')
      if (!res.ok) return
      const data = await res.json()
      const urls = new Set()
      // 遍历所有课程的所有节次，收集课件、作业、参考资料的URL
      for (const course of data.courses || []) {
        for (const session of course.sessions || []) {
          for (const file of session.files || []) {
            if (file.url && (file.url.startsWith('/') || file.url.startsWith(window.location.origin))) {
              urls.add(file.url)
            }
          }
          if (session.homework?.url) {
            urls.add(session.homework.url)
          }
          for (const ref of session.references || []) {
            if (ref.url && (ref.url.startsWith('/') || ref.url.startsWith(window.location.origin))) {
              urls.add(ref.url)
            }
          }
        }
      }
      // 为每个URL创建 prefetch 链接，浏览器会在空闲时加载
      urls.forEach(url => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = url
        link.as = 'fetch'
        document.head.appendChild(link)
      })
    } catch (e) {
      // 预加载失败不影响页面功能，静默忽略
    }
  }
  // 等待页面完全加载后再开始预加载
  if (document.readyState === 'complete') {
    prefetchPDFs()
  } else {
    window.addEventListener('load', prefetchPDFs, { once: true })
  }

  // 组件卸载时清理监听器，避免内存泄漏
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', applySystemTheme)
    if (handleScroll) window.removeEventListener('scroll', handleScroll, { passive: true })
    if (scrollTimer) clearTimeout(scrollTimer)
  })
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #nav-bar-content-after>
      <UserNavMenu />
    </template>
    <template #layout-bottom>
      <!-- 移动端底部 Tab Bar（仅 <768px 显示） -->
      <MobileTabBar />
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
/* 布局相关的额外样式 */
</style>
