/**
 * 响应式当前时间
 * 统一处理各组件中重复的 setInterval 更新当前时间逻辑
 * 使用方式：const { now } = useNow(60000) // 每分钟更新
 */
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * @param {number} intervalMs - 更新间隔（毫秒），默认60秒
 * @returns {{ now: import('vue').Ref<Date> }}
 */
export function useNow(intervalMs = 60000) {
  const now = ref(new Date())
  let timer = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date()
    }, intervalMs)
  })

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return { now }
}
