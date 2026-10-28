/**
 * Admin 后台纯工具函数（从 AdminPanel.vue 抽取，逻辑零变化）
 * 不依赖组件状态；依赖状态的函数（如 createRecord、coinRuleName）保留在组件内。
 */

/**
 * 文件大小人性化显示：B / KB / MB
 * @param {number} bytes
 * @returns {string}
 */
export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

/**
 * 自动翻译已停用：英/泰字段暂以中文填充，不请求外部、不阻塞提交；后续需要可人工补译
 */
export function translateBoth(text) {
  return Promise.resolve({ en: text, th: text })
}

/**
 * 随机 hex 串（用于生成临时 key / id）
 * @param {number} n 字节数
 * @returns {string} 2n 位 hex
 */
export function randomHex(n) {
  const arr = new Uint8Array(n)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr)
  else for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 从文件名取扩展名（小写）；无扩展名返回 'bin'
 * @param {string} name
 * @returns {string}
 */
export function extFromFileName(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || '')
  return m ? m[1].toLowerCase() : 'bin'
}

/**
 * File -> base64（去 dataURL 前缀）
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = String(reader.result || '')
      resolve(s.includes(',') ? s.slice(s.indexOf(',') + 1) : s)
    }
    reader.onerror = () => reject(reader.error || new Error('FileReader 读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 树洞时间：MM-DD HH:mm（zh-CN）
 */
export function formatTreeholeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/**
 * 短时间：MM-DD HH:mm（手动补零）
 */
export function shortTime(t) {
  if (!t) return ''
  const d = t instanceof Date ? t : new Date(t)
  if (isNaN(d.getTime())) return String(t)
  const p = n => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * 薄荷币时间：MM-DD HH:mm（zh-CN locale）
 */
export function coinShortDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

/**
 * 课程资料包 -> 扁平文件列表（课件/作业/参考）
 * @param {object} pack { courses: [{ name, sessions: [{ files, homework, references }] }] }
 * @returns {Array<{courseName, kind, name, size, fileUrl}>}
 */
export function flattenCourseFiles(pack) {
  const out = []
  for (const c of pack.courses || []) {
    for (const sess of c.sessions || []) {
      for (const f of sess.files || [])
        out.push({ courseName: c.name, kind: '课件', name: f.name, size: f.size, fileUrl: f.url })
      if (sess.homework?.url)
        out.push({ courseName: c.name, kind: '作业', name: sess.homework.name, size: sess.homework.size, fileUrl: sess.homework.url })
      for (const r of sess.references || []) if (r.url)
        out.push({ courseName: c.name, kind: '参考', name: r.name, size: r.size, fileUrl: r.url })
    }
  }
  return out
}

/**
 * 讲次内全部文件 url（去重）
 * @param {object} sess
 * @returns {string[]}
 */
export function sessionUrls(sess) {
  const urls = []
  ;(sess.files || []).forEach(f => f.url && urls.push(f.url))
  ;(sess.references || []).forEach(r => r.url && urls.push(r.url))
  if (sess.homework?.url) urls.push(sess.homework.url)
  return [...new Set(urls)]
}

/**
 * 讲次管理行（按讲次序号升序）
 * @param {object} pack
 * @returns {Array<{id, name, sessions: Array<{session, date, title, draftTitle, draftDate, fileCount, urls}>}>}
 */
export function buildCmMgrRows(pack) {
  return (pack.courses || []).map(c => ({
    id: c.id, name: c.name,
    sessions: (c.sessions || []).slice().sort((a, b) => Number(a.session) - Number(b.session)).map(sess => {
      const urls = sessionUrls(sess)
      return {
        session: sess.session, date: sess.date, title: sess.title || '',
        draftTitle: sess.title || '', draftDate: sess.date,
        fileCount: urls.length, urls,
      }
    }),
  }))
}
