<script setup>
import DefaultTheme from 'vitepress/theme'
import { useScrollReveal } from './composables/useScrollReveal'
import { onMounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

// 初始化滚动动画
const { refresh } = useScrollReveal()

// 页面切换后重新初始化滚动动画
watch(
  () => page.value.relativePath,
  async () => {
    await nextTick()
    setTimeout(() => {
      refresh()
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 200)
  }
)

onMounted(() => {
  // 导航栏滚动效果
  const nav = document.querySelector('.VPNav')
  if (nav) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled')
      } else {
        nav.classList.remove('scrolled')
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})
</script>

<template>
  <DefaultTheme.Layout>
    <!-- 可以在这里添加全局组件，如背景装饰、回到顶部等 -->
    <template #layout-bottom>
      <!-- 全局底部装饰 -->
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
/* 布局相关的额外样式 */
</style>
