/**
 * 活动统一 selector（读取层自动派生）
 *
 * 活动的"是否有相册 / 是否涉及班费"不再依赖发布活动时手动勾选，
 * 而由读取层根据"是否真的存在封面 / 相册链接 / 照片"和
 * "班费流水中是否存在 activityId 指向该活动"自动计算。
 *
 * useActivities()                 → 仅活动（相册相关派生）
 * useActivities({ withFinance })  → 同时交叉班费流水，派生 involvesFinance
 */
import { computed } from 'vue'
import { useData } from './useData.js'

// R2 资源版本号：R2 Worker / 资源有破坏性更新时递增，可强制所有客户端绕过旧缓存
export const ASSET_VERSION = 'v20260924'

// 给 files.mint4.cn 的资源 URL 追加版本参数（无查询参数时），用于缓存治理
function versioned(u) {
  if (typeof u === 'string' && u.indexOf('files.mint4.cn') !== -1 && u.indexOf('?') === -1) {
    return u + '?' + ASSET_VERSION
  }
  return u
}

// 单个活动派生：返回浅拷贝，tags 内补全 hasMedia / involvesFinance（不修改原数据）
export function deriveActivity(act, financeTxs = []) {
  const t = act.tags || {}
  const cover = versioned(t.cover)
  const mediaUrl = versioned(t.mediaUrl)
  const localPhotos = Array.isArray(t.localPhotos)
    ? t.localPhotos.map(versioned)
    : t.localPhotos
  const hasMedia = !!(
    cover ||
    mediaUrl || (Array.isArray(localPhotos) && localPhotos.length) ||
    t.hasMedia
  )
  const involvesFinance =
    financeTxs.some(x => x && String(x.activityId) === String(act.id)) ||
    !!t.involvesFinance
  return {
    ...act,
    tags: { ...t, cover, mediaUrl, localPhotos, hasMedia, involvesFinance },
  }
}

export function useActivities({ withFinance = false } = {}) {
  const { data: actsRaw, loading, error, reload } = useData(
    '/data/activities.json',
    { dbUrl: '/api/activities-db' }
  )
  const fin = useData('/data/finance.json', { dbUrl: '/api/finance-db' })
  const financeTxs = computed(() => fin.data.value?.transactions || [])

  const activities = computed(() => {
    const list = actsRaw.value?.activities || []
    const txs = withFinance ? financeTxs.value : []
    return list.map(a => deriveActivity(a, txs))
  })

  return { activities, loading, error, reload }
}
