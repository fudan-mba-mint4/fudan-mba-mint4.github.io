// 公开只读数据边缘缓存（Cloudflare Cache API）
// 仅用于【不含任何用户私有数据】的公开接口：缓存命中时秒回，避免每次请求都命中 D1 冷启动。
// 写入侧（审批/发布/申报等）成功后调用 purgePublicCache(key) 立即失效，下次访问即取新数据。
const BASE = 'https://mint4.pages.dev/_pc/'

function keyUrl(key) {
  return new URL(BASE + key)
}

// 读缓存：命中返回 Response，未命中返回 null
export async function getPublicCache(key) {
  try {
    const cache = caches.default
    const hit = await cache.match(keyUrl(key))
    return hit || null
  } catch (e) { return null }
}

// 写缓存（TTL 秒；clone 一份入缓存，原响应照常返回客户端）
export async function setPublicCache(key, response, ttlSeconds = 60) {
  try {
    const cache = caches.default
    const r = response.clone()
    r.headers.set('Cache-Control', `public, max-age=${ttlSeconds}`)
    await cache.put(keyUrl(key), r)
  } catch (e) { /* 缓存失败不影响主流程 */ }
}

// 失效（数据变更后调用）
export async function purgePublicCache(key) {
  try {
    const cache = caches.default
    await cache.delete(keyUrl(key))
  } catch (e) { /* 忽略 */ }
}
