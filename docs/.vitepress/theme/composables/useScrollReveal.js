/**
 * 滚动动画 composable
 * 使用 Intersection Observer 实现元素进入视口时的渐入动画
 */

import { onMounted, onUnmounted } from 'vue'

export function useScrollReveal() {
  let observer = null

  const initObserver = () => {
    // 检查是否支持 IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      // 不支持则直接显示所有元素
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('is-visible')
      })
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            // 只触发一次
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    // 观察所有带 reveal 类的元素
    document.querySelectorAll('.reveal').forEach(el => {
      observer.observe(el)
    })
  }

  // 重新观察（动态内容加载后调用）
  const refresh = () => {
    if (!observer) return
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
      observer.observe(el)
    })
  }

  onMounted(() => {
    // 延迟初始化，确保DOM渲染完成
    setTimeout(initObserver, 100)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return { refresh }
}
