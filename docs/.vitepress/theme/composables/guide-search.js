/**
 * 指南首页本地过滤搜索的模块级共享状态（蓝图 §5.1）
 * GuideHomeSearch 写入 query；GuideCards（重构后）读取并过滤五张主题卡。
 * 纯前端本地过滤，不接入 VitePress 搜索索引；SSR 安全（仅浏览器端赋值）。
 */
import { ref } from 'vue'

const query = ref('')

export function useGuideSearch() {
  function setQuery(value) {
    query.value = (value || '').trim()
  }
  function resetQuery() {
    query.value = ''
  }
  return { query, setQuery, resetQuery }
}
