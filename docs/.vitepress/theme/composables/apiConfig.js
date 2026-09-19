// 全站 API 前缀（集中管理）
// 生产（Cloudflare Pages）：Functions 与站点同源，使用相对路径 ''。
// 本地 VitePress dev：默认 ''，页面展示走静态 fallback；
//   若需在本地测试登录 / 报名 / 投票 / 上传等写操作，启动时设置
//   VITE_API_PREFIX 指向已部署的 CF 域名，例如：
//   VITE_API_PREFIX=https://mint4.cn npm run docs:dev
export const API_PREFIX = import.meta.env.VITE_API_PREFIX || ''
