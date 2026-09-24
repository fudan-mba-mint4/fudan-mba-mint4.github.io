/**
 * 资源注册表 + 数据依赖图（前端单一数据源映射）
 *
 * 声明每类"可发布内容"的 D1 公开读取端点、静态降级 JSON、数据结构，
 * 以及一处变更会影响哪些模块（供自动失效 / 静默刷新与文档）。
 * 所有首页卡片与对应详情页都从这里登记的同一数据源读取，避免重复维护。
 */

// 资源类型 → 数据源
//   dbUrl:     公开只读 D1 端点（运行时优先）
//   staticUrl: 离线 / 降级静态 JSON
//   listKey:   数组所在字段；整包类型（含多字段）用 null
export const RESOURCES = {
  announcements:   { dbUrl: '/api/announcements',       staticUrl: '/data/announcements.json',   listKey: 'announcements' },
  activities:      { dbUrl: '/api/activities-db',       staticUrl: '/data/activities.json',      listKey: 'activities' },
  courseMaterials: { dbUrl: '/api/course-materials-db', staticUrl: '/data/course-materials.json', listKey: null },
  polls:           { dbUrl: '/api/polls-admin',         staticUrl: '/data/polls.json',           listKey: 'polls' },
  knowledge:       { dbUrl: '/api/knowledge-db',        staticUrl: '/data/knowledge-base.json',  listKey: null },
  finance:         { dbUrl: '/api/finance-db',          staticUrl: '/data/finance.json',         listKey: null },
}

// admin 提交记录（admin_history）的 type 字段 → 资源 key（用于发布 / 撤回后失效）
export const HISTORY_TYPE_TO_RESOURCE = {
  announcements: 'announcements',
  activities: 'activities',
  gallery: 'activities', // 相册本质是更新 activities 的媒体标记 / 封面
  courseMaterials: 'courseMaterials',
  knowledge: 'knowledge',
  finance: 'finance',
  polls: 'polls',
}

// 数据资源 → 消费模块依赖图（一处变更 → 自动失效缓存并静默刷新这些模块）
export const RESOURCE_DEPENDENCIES = {
  announcements: { consumers: ['首页·公告卡片', '公告页'] },
  activities: {
    consumers: [
      '首页·活动相册', '首页·下一场活动', '活动日历页', '活动相册页',
      '班费页·关联活动', '个人主页·我的活动',
    ],
  },
  courseMaterials: { consumers: ['首页·作业待办', '首页·下节课/未读', '课程资料页', '课表页'] },
  polls: { consumers: ['首页·投票未读', '投票页'] },
  knowledge: { consumers: ['首页·知识库未读', '知识库页'] },
  finance: { consumers: ['首页·班费卡片', '班费页'] },
}

// 取某资源的 DB 读取端点
export function dbKeyOf(resource) {
  return RESOURCES[resource]?.dbUrl || null
}
