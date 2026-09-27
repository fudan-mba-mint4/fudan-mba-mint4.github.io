/**
 * 模块「已读」——首页快速入口红点的数据来源
 *
 * 采用「已见条目集合（seen-set）」模型，不依赖 id 的数据类型或排序方式：
 *  - 每个模块记录「已经读过的条目标识集合」。
 *  - 公告/活动/投票/知识库/班费：条目标识 = String(id)（id 可能是数字 7、
 *    字符串 'ann-001'、甚至 UUID，统一转字符串作为集合键，同模块内唯一即可）。
 *  - 课件 slides：文件没有独立 id，条目标识 = 文件 url（R2 地址，全局唯一）。
 *  - 未读数 = 当前条目里「标识不在已读集合中」的条数。
 *
 * 优点：
 *  - 不依赖 id 是数字还是字符串、是否连续、字典序是否与时间一致；
 *  - 同一天内先读过、之后又发布新内容（新 id / 新文件 url）→ 仍准确提醒；
 *  - 进入模块页面（无论从首页快速入口、顶部菜单、底部导航哪个入口）即把当前
 *    所有条目标识并入集合 → 该模块红点清零。
 *
 * 集合存 localStorage（按设备/浏览器），并通过 storage 事件 + BroadcastChannel 跨标签同步。
 */
import { ref } from 'vue'

const STORE = 'mint4_module_read'
const CHANNEL_NAME = 'mint4-read'

let seen = {}
if (typeof localStorage !== 'undefined') {
  try { seen = JSON.parse(localStorage.getItem(STORE) || '{}') } catch { seen = {} }
}

// 供组件建立响应式依赖（集合变化时刷新红点）
export const readState = ref(seen)

let channel = null
function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (e) => {
      if (e?.data?.type === 'read') {
        seen = { ...(e.data.seen || {}) }
        readState.value = { ...seen }
      }
    }
  }
  return channel
}

function persist() {
  readState.value = { ...seen }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORE, JSON.stringify(seen))
  }
  const ch = getChannel()
  if (ch) { try { ch.postMessage({ type: 'read', seen }) } catch { /* 忽略 */ } }
}

/** 条目标识统一转字符串（数字 id、字符串 id、url 都可） */
export function itemKey(idOrUrl) {
  return String(idOrUrl)
}

/** 某模块当前已读标识集合（Set） */
export function getSeen(mod) {
  return new Set(Array.isArray(seen[mod]) ? seen[mod] : [])
}

/** 该模块是否已做过（基线）初始化 */
export function isInitialized(mod) {
  return mod in seen
}

/**
 * 把一批条目标识并入「已读集合」（进入模块页面时调用）。
 * 只在确有新增标识时才写入。
 */
export function markRead(mod, keys) {
  const set = getSeen(mod)
  let changed = false
  ;(keys || []).forEach(k => {
    const key = itemKey(k)
    if (!set.has(key)) { set.add(key); changed = true }
  })
  if (changed) {
    seen[mod] = [...set]
    persist()
  } else if (!(mod in seen)) {
    // 即便没有任何标识，也要把模块标记为已初始化（空集合）
    seen[mod] = []
    persist()
  }
}

// 跨标签：另一个标签写入 localStorage 时同步本标签
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORE) {
      try {
        seen = JSON.parse(e.newValue || '{}')
        readState.value = { ...seen }
      } catch { /* 忽略 */ }
    }
  })
  getChannel()
}
