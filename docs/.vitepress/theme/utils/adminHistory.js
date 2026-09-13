/**
 * Admin提交记录模块
 * 所有提交记录保存在 GitHub 的 admin-history.json 中，所有人可见
 * 支持：获取记录、追加记录、标记撤回
 */

const HISTORY_PATH = 'docs/public/data/admin-history.json'

function ghApi(token, path, opts = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      ...opts.headers,
    },
  })
}

/** 获取所有提交记录 */
export async function fetchHistory(token, repo) {
  const res = await ghApi(token, `/repos/${repo}/contents/${HISTORY_PATH}?ref=main`)
  if (!res.ok) throw new Error(`获取提交记录失败 ${res.status}`)
  const d = await res.json()
  const data = JSON.parse(decodeURIComponent(escape(atob(d.content))))
  return { records: data.records || [], sha: d.sha }
}

/** 追加一条提交记录，返回 commitSha */
export async function appendHistory(token, repo, record) {
  const { records, sha } = await fetchHistory(token, repo)
  records.unshift(record)
  const content = btoa(unescape(encodeURIComponent(JSON.stringify({ records }, null, 2))))
  const res = await ghApi(token, `/repos/${repo}/contents/${HISTORY_PATH}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `[Admin] 记录提交: ${record.description}`,
      content,
      sha,
      branch: 'main',
    }),
  })
  if (!res.ok) throw new Error((await res.json()).message || '保存提交记录失败')
  return (await res.json()).commit.sha
}

/** 标记某条记录为已撤回 */
export async function markReverted(token, repo, recordId, operator) {
  const { records, sha } = await fetchHistory(token, repo)
  const record = records.find((r) => r.id === recordId)
  if (!record) throw new Error('找不到该提交记录')
  record.reverted = true
  record.revertedBy = operator || '未知'
  record.revertedTime = new Date().toLocaleString('zh-CN')
  const content = btoa(unescape(encodeURIComponent(JSON.stringify({ records }, null, 2))))
  const res = await ghApi(token, `/repos/${repo}/contents/${HISTORY_PATH}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `[Admin] 撤回提交: ${record.description}`,
      content,
      sha,
      branch: 'main',
    }),
  })
  if (!res.ok) throw new Error((await res.json()).message || '更新撤回状态失败')
  return (await res.json()).commit.sha
}
