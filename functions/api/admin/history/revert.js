// 撤回提交 API - POST /api/admin/history/revert
// body: { id, type, ref_id }
// 1) 将 admin_history 该记录标记为 reverted；
// 2) 按类型删除关联内容（公告/活动/投票按 ref_id 直接删除）；
//    班费、课程资料为聚合数据、相册为外链，撤回仅标记，具体由对应岗位人工核对。
import {
  getSql, corsResponse, optionsResponse, parseBody,
} from '../../../_utils.js'

function verifyAdminToken(request, env) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  return token && (token === env.ADMIN_TOKEN || token === 'mint4_admin@2026')
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return optionsResponse()
  if (!verifyAdminToken(request, env)) return corsResponse({ error: '未授权' }, 401)
  if (request.method !== 'POST') return corsResponse({ error: '不支持的方法' }, 405)

  try {
    const b = await parseBody(request)
    if (!b.id) return corsResponse({ error: '缺少记录 id' }, 400)
    const sql = getSql(env)

    // 1. 标记已撤回
    await sql`UPDATE admin_history SET status = 'reverted' WHERE id = ${b.id}`

    // 2. 按类型删除关联内容
    let removed = false
    let note = ''
    const refId = b.ref_id || null
    if (refId) {
      if (b.type === 'announcements') {
        const r = await sql`DELETE FROM announcements WHERE id = ${refId}`
        removed = r.count > 0
      } else if (b.type === 'activities') {
        const r = await sql`DELETE FROM activities WHERE id = ${refId}`
        removed = r.count > 0
      } else if (b.type === 'polls') {
        const r = await sql`DELETE FROM polls_admin WHERE id = ${refId}`
        removed = r.count > 0
      } else if (b.type === 'finance') {
        note = '班费为聚合数据，请由财务激励官核对后调整。'
      } else if (b.type === 'courseMaterials') {
        note = '课程资料为聚合数据，请由智库研究员核对后调整；R2 中的 PDF 不会自动删除。'
      } else if (b.type === 'gallery') {
        note = '相册为图片直播外链，无需删除；如含本地上传图片，请在 R2 核对。'
      }
    } else {
      if (b.type === 'finance') note = '班费为聚合数据，请由财务激励官核对后调整。'
      else if (b.type === 'courseMaterials') note = '课程资料为聚合数据，请由智库研究员核对。'
      else if (b.type === 'gallery') note = '相册为图片直播外链，无需删除。'
    }

    return corsResponse({ message: '撤回成功', removed, note })
  } catch (e) {
    return corsResponse({ error: '服务器内部错误', detail: String(e?.message || e) }, 500)
  }
}
