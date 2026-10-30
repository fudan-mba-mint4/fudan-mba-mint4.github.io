// SSR 安全的 URL query 读取工具
// 背景：VitePress 的 useRoute() 返回的 route 对象只有 path/data/title/description，
// 不含 query，因此 ?focus=xxx 这类参数需直接从浏览器 window.location 读取；
// 服务端渲染期间没有 window，必须做守卫，否则 build 报 "window is not defined"。
export function getQueryParam(name) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}
