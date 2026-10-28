/**
 * Admin 后台常量（从 AdminPanel.vue 抽取，逻辑零变化）
 * 与 functions/_utils.js 的 MODULE_ROLES / COIN_AUDITORS / ROLE_LABELS 保持一致（改动需同步）
 */

// 后台模块列表（模板按钮顺序即数组顺序）
export const dataTypes = [
  { id: 'announcements', name: '公告', icon: '📢' },
  { id: 'activities', name: '活动', icon: '🎉' },
  { id: 'polls', name: '投票', icon: '🗳️' },
  { id: 'courseMaterials', name: '课程资料', icon: '📚' },
  { id: 'knowledge', name: '知识库', icon: '📖' },
  { id: 'finance', name: '班费', icon: '💰' },
  { id: 'coins', name: '薄荷币', icon: '🍃' },
  { id: 'gallery', name: '相册', icon: '🖼️' },
  { id: 'treehole', name: '树洞管理', icon: '🌳' },
]

// 班费模块内部子 Tab
export const finTabs = [
  { key: 'ledger', name: '流水管理', icon: '💸' },
  { key: 'budgets', name: '预算公示', icon: '📋' },
  { key: 'reimb', name: '报销审批', icon: '🧾' },
  { key: 'config', name: '参数配置', icon: '⚙️' },
  { key: 'supervision', name: '监督视图', icon: '🔍' },
]

// 薄荷币模块内部子 Tab
export const coinsTabs = [
  { key: 'claims', name: '申报审核', icon: '🧾' },
  { key: 'rules', name: '规则配置', icon: '⚙️' },
]

// 各模块允许的角色（与 functions/_utils.js 的 MODULE_ROLES 保持一致，改动需同步）
// leader/deputy/supervisor 可见并可写全部模块；其余角色只看到本职能模块。
export const MODULE_ROLE_MAP = {
  announcements: ['leader', 'deputy', 'experience', 'finance', 'thinktank', 'memory'],
  activities: ['leader', 'deputy', 'experience'],
  polls: ['leader', 'deputy', 'experience'],
  courseMaterials: ['leader', 'deputy', 'thinktank'],
  knowledge: ['leader', 'deputy', 'thinktank'],
  finance: ['leader', 'deputy', 'finance'],
  // 薄荷币：审批由财务激励官「高晓梅 / 叶宏颖」专人负责（与 functions/_utils.js COIN_AUDITORS 一致），
  // 不再整体放行 finance 组；leader/deputy/supervisor 兜底可见。
  coins: ['leader', 'deputy'],
  gallery: ['leader', 'deputy', 'memory'],
  treehole: ['leader', 'deputy', 'memory'],
}

// 薄荷币审批负责人（真名白名单，与后端 COIN_AUDITORS 保持一致）
export const COIN_AUDITORS = ['高晓梅', '叶宏颖']

export const ROLE_LABEL_MAP = {
  leader: '班级主理人', deputy: '副主理人', experience: '体验运营官',
  finance: '财务激励官', thinktank: '智库研究员', memory: '记忆主理人',
  supervisor: '独立董事会',
}
