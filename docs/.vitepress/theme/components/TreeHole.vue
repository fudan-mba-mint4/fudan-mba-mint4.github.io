<template>
  <div class="treehole-page" ref="pageRef">
    <!-- 页面头部 -->
    <div class="treehole-header">
      <div class="treehole-title-row">
        <div>
          <h1 class="treehole-title">{{ t.title }}</h1>
          <p class="treehole-subtitle">{{ t.subtitle }}</p>
        </div>
        <button class="write-btn disabled" disabled title="尚未开放">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          {{ t.writeBtn }}
        </button>
      </div>
      <!-- 统计条 -->
      <div v-if="stats.total > 0" class="treehole-stats">
        <span class="stat-item"><strong>{{ stats.total }}</strong> {{ t.totalMessages }}</span>
        <span v-if="stats.todayCount > 0" class="stat-item stat-today"><strong>{{ stats.todayCount }}</strong> {{ t.todayNew }}</span>
      </div>

      <!-- 匿名性说明 -->
      <div class="privacy-notice" :class="{ expanded: privacyOpen }">
        <button class="privacy-toggle" @click="privacyOpen = !privacyOpen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>{{ t.privacyTitle }}</span>
          <svg class="privacy-arrow" :class="{ rotated: privacyOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div v-if="privacyOpen" class="privacy-content">
          <div class="privacy-row">
            <div class="privacy-icon anon">🕵️</div>
            <div class="privacy-text">
              <strong>{{ t.privacyAnonTitle }}</strong>
              <p>{{ t.privacyAnonDesc }}</p>
            </div>
          </div>
          <div class="privacy-row">
            <div class="privacy-icon login">👤</div>
            <div class="privacy-text">
              <strong>{{ t.privacyLoginTitle }}</strong>
              <p>{{ t.privacyLoginDesc }}</p>
            </div>
          </div>
          <div class="privacy-row">
            <div class="privacy-icon limit">⏱️</div>
            <div class="privacy-text">
              <strong>{{ t.privacyLimitTitle }}</strong>
              <p>{{ t.privacyLimitDesc }}</p>
            </div>
          </div>
          <div class="privacy-row">
            <div class="privacy-icon mod">🛡️</div>
            <div class="privacy-text">
              <strong>{{ t.privacyModTitle }}</strong>
              <p>{{ t.privacyModDesc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 留言列表 -->
    <div class="message-list">
      <!-- 加载中 -->
      <div v-if="loading && messages.length === 0" class="state-center">
        <div class="spinner"></div>
        <span class="state-text">{{ t.loading }}</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && !loadError && messages.length === 0" class="state-center empty-state">
        <div class="empty-icon">🌱</div>
        <p class="state-text">{{ t.empty }}</p>
        <button class="empty-action-btn" @click="openForm">{{ t.writeFirst }}</button>
      </div>

      <!-- 错误状态（但已有数据时不打断浏览） -->
      <div v-else-if="loadError && messages.length === 0" class="state-center">
        <div class="error-icon">📡</div>
        <p class="state-text error-text">{{ t.loadErrorText }}</p>
        <button class="retry-btn" @click="retryLoad">{{ t.retry }}</button>
      </div>

      <!-- 留言卡片 -->
      <TransitionGroup name="list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-card"
          :class="{ 'message-new': msg.id === newMessageId }"
        >
          <div class="message-header">
            <span class="message-nickname">{{ msg.nickname || t.anonymous }}</span>
            <span class="message-time">{{ formatTime(msg.created_at) }}</span>
          </div>
          <p class="message-content">{{ msg.content }}</p>
        </div>
      </TransitionGroup>

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading" class="load-more-sentinel" ref="sentinelRef">
        <button v-if="!autoLoading" class="load-more-btn" @click="loadMore">
          {{ t.loadMore }}
        </button>
        <div v-else class="loading-inline">
          <div class="spinner spinner-sm"></div>
          <span>{{ t.loading }}</span>
        </div>
      </div>

      <!-- 没有更多了 -->
      <div v-if="!hasMore && messages.length > 0" class="end-hint">— {{ t.endHint }} —</div>
    </div>

    <!-- 写留言弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">{{ t.formTitle }}</h3>
              <button class="modal-close" @click="closeForm" aria-label="关闭">✕</button>
            </div>
            <form class="modal-body" @submit.prevent="submitMessage">
              <div class="form-group">
                <label class="form-label">{{ t.contentLabel }} <span class="form-required">*</span></label>
                <textarea
                  v-model="form.content"
                  class="form-textarea"
                  :placeholder="t.contentPlaceholder"
                  maxlength="500"
                  rows="5"
                  required
                  ref="textareaRef"
                ></textarea>
                <div class="char-count" :class="{ 'char-warn': form.content.length > 450 }">{{ form.content.length }}/500</div>
              </div>
              <label v-if="isAuthenticated" class="realname-toggle">
                <input type="checkbox" v-model="form.realname" />
                <span>实名显示（将显示你的真名 {{ currentUser?.name || '' }}）</span>
              </label>
              <Transition name="fade">
                <div v-if="formError" class="form-error">{{ formError }}</div>
              </Transition>
              <div class="form-actions">
                <button type="button" class="btn-secondary" @click="closeForm">{{ t.cancel }}</button>
                <button type="submit" class="btn-primary" :disabled="submitting || !form.content.trim()">
                  <span v-if="submitting" class="btn-loading"></span>
                  {{ submitting ? t.submitting : t.submit }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 提交成功提示 -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="showSuccess" class="toast toast-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {{ t.submitSuccess }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useAuth } from '../composables/useAuth.js'

const i18n = {
  zh: {
    title: '匿名树洞',
    subtitle: '说出你的心声，这里没有人知道你是谁',
    writeBtn: '写留言',
    loading: '加载中...',
    empty: '空空如也，来做第一个倾诉者吧',
    writeFirst: '写下第一条',
    retry: '重试',
    loadMore: '加载更多',
    endHint: '已经到底啦',
    anonymous: '匿名同学',
    totalMessages: '条留言',
    todayNew: '条今日新增',
    privacyTitle: '匿名性说明',
    privacyAnonTitle: '真匿名：不登录也能留言',
    privacyAnonDesc: '无需注册登录即可留言，管理员仅能看到IP哈希（不可逆），无法追溯到具体个人。你的身份真正受到保护。',
    privacyLoginTitle: '登录留言：可选实名',
    privacyLoginDesc: '登录后留言可选择实名或匿名。匿名留言前台不显示身份，但管理员后台可见，用于处理恶意留言。',
    privacyLimitTitle: '频率限制',
    privacyLimitDesc: '同一IP/用户每分钟最多留言3条，防止刷屏和恶意灌水。',
    privacyModTitle: '内容管理',
    privacyModDesc: '管理员可删除违法、违规、辱骂等不当留言。请友善表达，共同维护树洞环境。',
    formTitle: '写下你的心声',
    nicknameLabel: '昵称',
    optional: '选填',
    nicknamePlaceholder: '不填则显示为匿名同学',
    contentLabel: '留言内容',
    contentPlaceholder: '想说什么就说什么吧...',
    cancel: '取消',
    submit: '提交',
    submitting: '提交中...',
    submitSuccess: '留言提交成功！',
    loadErrorText: '加载失败，请检查网络后重试',
  },
  en: {
    title: 'Anonymous Tree Hole',
    subtitle: 'Speak your mind, no one knows who you are',
    writeBtn: 'Write',
    loading: 'Loading...',
    empty: 'Nothing here yet. Be the first to share!',
    writeFirst: 'Write the First',
    retry: 'Retry',
    loadMore: 'Load More',
    endHint: 'You\'ve reached the end',
    anonymous: 'Anonymous',
    totalMessages: 'messages',
    todayNew: 'new today',
    privacyTitle: 'Privacy & Anonymity',
    privacyAnonTitle: 'Truly Anonymous: No Login Required',
    privacyAnonDesc: 'Post without registering. Admins only see an irreversible IP hash—your identity is truly protected.',
    privacyLoginTitle: 'Logged-in Posts: Optional Real Name',
    privacyLoginDesc: 'When logged in, choose real name or anonymous. Anonymous posts are visible to admins only for moderation.',
    privacyLimitTitle: 'Rate Limiting',
    privacyLimitDesc: 'Max 3 messages per minute per IP/user to prevent spam.',
    privacyModTitle: 'Content Moderation',
    privacyModDesc: 'Admins may remove illegal, abusive, or inappropriate posts. Please be kind.',
    formTitle: 'Write Your Thoughts',
    nicknameLabel: 'Nickname',
    optional: 'optional',
    nicknamePlaceholder: 'Leave empty for anonymous',
    contentLabel: 'Message',
    contentPlaceholder: 'Say whatever is on your mind...',
    cancel: 'Cancel',
    submit: 'Submit',
    submitting: 'Submitting...',
    submitSuccess: 'Message submitted!',
    loadErrorText: 'Failed to load. Please check your connection and retry.',
  },
  th: {
    title: 'กระบอกไม้ไผ่ นิรนาม',
    subtitle: 'พูดสิ่งที่อยากพูด ไม่มีใครรู้ว่าคุณคือใคร',
    writeBtn: 'เขียน',
    loading: 'กำลังโหลด...',
    empty: 'ยังไม่มีอะไรเลย เป็นคนแรกกัน!',
    writeFirst: 'เขียนข้อความแรก',
    retry: 'ลองอีกครั้ง',
    loadMore: 'โหลดเพิ่ม',
    endHint: 'ถึงที่สุดแล้ว',
    anonymous: 'นักเรียนนิรนาม',
    totalMessages: 'ข้อความ',
    todayNew: 'ใหม่วันนี้',
    privacyTitle: 'คำอธิบายความเป็นส่วนตัว',
    privacyAnonTitle: 'นิรนามแท้: ไม่ต้องเข้าสู่ระบบ',
    privacyAnonDesc: 'โพสต์ได้โดยไม่ต้องลงทะเบียน ผู้ดูแลเห็นแค่แฮช IP ที่ไม่สามารถย้อนกลับได้—ตัวตนของคุณได้รับการปกป้องอย่างแท้จริง',
    privacyLoginTitle: 'โพสต์เมื่อเข้าสู่ระบบ: ใส่ชื่อจริงได้',
    privacyLoginDesc: 'เมื่อเข้าสู่ระบบแล้ว สามารถเลือกใส่ชื่อจริงหรือนิรนามได้ โพสต์นิรนามผู้ดูแลเห็นได้เพื่อการดูแลเนื้อหา',
    privacyLimitTitle: 'จำกัดความถี่',
    privacyLimitDesc: 'สูงสุด 3 ข้อความต่อนาทีต่อ IP/ผู้ใช้ เพื่อป้องกันสแปม',
    privacyModTitle: 'การดูแลเนื้อหา',
    privacyModDesc: 'ผู้ดูแลสามารถลบโพสต์ที่ผิดกฎหมาย หยาบคาย หรือไม่เหมาะสมได้ กรุณาแสดงความเห็นอย่างมีมารยาท',
    formTitle: 'เขียนสิ่งที่อยากพูด',
    nicknameLabel: 'ชื่อเล่น',
    optional: 'ไม่บังคับ',
    nicknamePlaceholder: 'เว้นว่างเพื่อเป็นนิรนาม',
    contentLabel: 'ข้อความ',
    contentPlaceholder: 'พูดอะไรก็ได้ที่อยากพูด...',
    cancel: 'ยกเลิก',
    submit: 'ส่ง',
    submitting: 'กำลังส่ง...',
    submitSuccess: 'ส่งข้อความสำเร็จ!',
    loadErrorText: 'โหลดไม่สำเร็จ กรุณาตรวจสอบเครือข่ายแล้วลองอีกครั้ง',
  },
}

const { t } = useLang(i18n)

const API_BASE = '/api/treehole'
const isMock = import.meta.env.DEV
const { currentUser, isAuthenticated } = useAuth()

// ========== Mock 数据层（开发环境用 localStorage 模拟） ==========
const MOCK_KEY = 'mint4_treehole_mock'
function getMockMessages() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]')
  } catch { return [] }
}
function saveMockMessages(list) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(list))
}
function mockFetchMessages(page, limit) {
  const all = getMockMessages().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const total = all.length
  const totalPages = Math.ceil(total / limit)
  const data = all.slice((page - 1) * limit, page * limit)
  const todayCount = all.filter(m => {
    const d = new Date(m.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data,
      pagination: { page, limit, total, totalPages },
      stats: { total, todayCount },
    }),
  })
}
function mockPostMessage(body) {
  const all = getMockMessages()
  const newMsg = {
    id: 'mock-' + Date.now(),
    nickname: body.nickname || null,
    content: body.content,
    created_at: new Date().toISOString(),
  }
  all.unshift(newMsg)
  saveMockMessages(all)
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: '留言提交成功', data: newMsg }),
  })
}

// 状态
const messages = ref([])
const loading = ref(true)
const autoLoading = ref(false)
const loadError = ref(false)
const page = ref(1)
const hasMore = ref(true)
const stats = ref({ total: 0, todayCount: 0 })
const newMessageId = ref(null)

// 表单
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const form = ref({ realname: false, content: '' })
const showSuccess = ref(false)
const textareaRef = ref(null)

// 无限滚动
const sentinelRef = ref(null)
const pageRef = ref(null)
const privacyOpen = ref(false)
let observer = null

onMounted(() => {
  loadMessages()
  setupInfiniteScroll()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

function setupInfiniteScroll() {
  if (!('IntersectionObserver' in window)) return
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value && !autoLoading.value && messages.value.length > 0) {
      loadMore()
    }
  }, { rootMargin: '200px' })
  if (sentinelRef.value) observer.observe(sentinelRef.value)
}

async function loadMessages() {
  loading.value = true
  loadError.value = false
  page.value = 1
  try {
    const res = isMock
      ? await mockFetchMessages(1, 20)
      : await fetch(`${API_BASE}?page=1&limit=20`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    messages.value = data.data || []
    hasMore.value = data.pagination?.page < data.pagination?.totalPages
    stats.value = data.stats || { total: 0, todayCount: 0 }
  } catch (e) {
    console.error('加载留言失败:', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (autoLoading.value || !hasMore.value) return
  autoLoading.value = true
  try {
    const nextPage = page.value + 1
    const res = isMock
      ? await mockFetchMessages(nextPage, 20)
      : await fetch(`${API_BASE}?page=${nextPage}&limit=20`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    messages.value = [...messages.value, ...(data.data || [])]
    page.value = nextPage
    hasMore.value = data.pagination?.page < data.pagination?.totalPages
  } catch (e) {
    console.error('加载更多失败:', e)
  } finally {
    autoLoading.value = false
  }
}

function retryLoad() {
  loadMessages()
}

function openForm() {
  showForm.value = true
  formError.value = ''
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

function closeForm() {
  showForm.value = false
  form.value = { realname: false, content: '' }
  formError.value = ''
}

async function submitMessage() {
  if (!form.value.content.trim()) return
  submitting.value = true
  formError.value = ''
  try {
    const body = {
      nickname: (form.value.realname && currentUser.value?.name) ? currentUser.value.name : undefined,
      content: form.value.content.trim(),
    }
    const res = isMock
      ? await mockPostMessage(body)
      : await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error(data.error || '提交太频繁，请稍后再试')
      }
      throw new Error(data.error || data.errors?.join('、') || '提交失败')
    }
    // 提交成功
    const newMsg = data.data
    newMessageId.value = newMsg.id
    // 如果当前在第一页，直接插入到列表顶部
    if (page.value === 1) {
      messages.value = [newMsg, ...messages.value].slice(0, 20)
    } else {
      // 不在第一页，重新加载第一页
      await loadMessages()
    }
    stats.value.total = (stats.value.total || 0) + 1
    stats.value.todayCount = (stats.value.todayCount || 0) + 1
    closeForm()
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
    // 高亮新留言3秒后取消
    setTimeout(() => { newMessageId.value = null }, 3000)
    // 滚动到新留言
    nextTick(() => {
      const firstCard = document.querySelector('.message-card')
      if (firstCard) {
        firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  } catch (e) {
    formError.value = e.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.treehole-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 头部 */
.treehole-header { padding: 40px 0 24px; }
.treehole-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.treehole-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.3px;
}
.treehole-subtitle {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin: 8px 0 0;
}
.write-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.write-btn:hover { opacity: 0.85; }
.write-btn:active { transform: scale(0.97); }
.write-btn.disabled { opacity: 0.4; cursor: not-allowed; }
.write-btn.disabled:hover { opacity: 0.4; }
.write-btn.disabled:active { transform: none; }

/* 统计条 */
.treehole-stats {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  padding: 10px 16px;
  background: var(--c-bg-secondary);
  border-radius: 10px;
  width: fit-content;
}
.stat-item { font-size: 13px; color: var(--c-text-secondary); }
.stat-item strong { color: var(--c-text-primary); font-weight: 700; }
.stat-today strong { color: var(--c-accent); }

/* 匿名性说明 */
.privacy-notice {
  margin-top: 16px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}
.privacy-notice.expanded { border-color: var(--c-accent-light); }
.privacy-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}
.privacy-toggle:hover { color: var(--c-accent); }
.privacy-toggle svg:first-child { color: var(--c-accent); }
.privacy-arrow {
  margin-left: auto;
  transition: transform 0.2s ease;
  color: var(--c-text-tertiary);
}
.privacy-arrow.rotated { transform: rotate(180deg); }
.privacy-content {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.privacy-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.privacy-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: var(--c-bg-card);
}
.privacy-icon.anon { background: rgba(94, 196, 172, 0.15); }
.privacy-icon.login { background: rgba(0, 122, 255, 0.12); }
.privacy-icon.limit { background: rgba(255, 149, 0, 0.12); }
.privacy-icon.mod { background: rgba(255, 59, 48, 0.1); }
.privacy-text { flex: 1; min-width: 0; }
.privacy-text strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin-bottom: 2px;
}
.privacy-text p {
  font-size: 12px;
  line-height: 1.5;
  color: var(--c-text-secondary);
  margin: 0;
}

/* 状态居中 */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}
.state-text {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin: 0;
  text-align: center;
}
.error-text { color: var(--c-text-tertiary); }
.empty-icon { font-size: 44px; }
.error-icon { font-size: 40px; }
.empty-action-btn {
  margin-top: 8px;
  padding: 10px 24px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.empty-action-btn:hover { opacity: 0.85; }
.retry-btn {
  padding: 8px 20px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  color: var(--c-text-primary);
  transition: border-color 0.2s ease;
}
.retry-btn:hover { border-color: var(--c-accent); }

/* 加载动画 */
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner-sm { width: 18px; height: 18px; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 留言列表 */
.message-list { display: flex;
  flex-direction: column;
  gap: 12px;
}
.message-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 18px 20px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.message-card:hover {
  border-color: var(--c-accent-light);
}
.message-new {
  animation: highlight 3s ease-out;
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px rgba(45, 122, 108, 0.15);
}
@keyframes highlight {
  0% { box-shadow: 0 0 0 6px rgba(45, 122, 108, 0.25); }
  100% { box-shadow: 0 0 0 0 rgba(45, 122, 108, 0); }
}
.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.message-nickname {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
}
.message-time {
  font-size: 12px;
  color: var(--c-text-tertiary);
}
.message-content {
  font-size: 15px;
  line-height: 1.6;
  color: var(--c-text-primary);
  margin: 0;
  word-break: break-word;
  white-space: pre-wrap;
}

/* 列表动画 */
.list-enter-active { transition: all 0.3s ease; }
.list-enter-from { opacity: 0; transform: translateY(-10px); }
.list-leave-active { transition: all 0.2s ease; position: absolute; }
.list-leave-to { opacity: 0; }

/* 加载更多 */
.load-more-sentinel {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
.load-more-btn {
  padding: 10px 32px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  color: var(--c-text-primary);
  transition: border-color 0.2s ease;
}
.load-more-btn:hover { border-color: var(--c-accent); }
.loading-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--c-text-secondary);
}
.end-hint {
  text-align: center;
  font-size: 12px;
  color: var(--c-text-tertiary);
  padding: 16px 0;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-content {
  background: var(--c-bg-card);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--c-border);
}
.modal-title { font-size: 18px; font-weight: 700; margin: 0; }
.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--c-bg-secondary);
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  color: var(--c-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
.modal-close:hover { background: var(--c-border); }
.modal-body { padding: 24px; }
.form-group { margin-bottom: 18px; }
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--c-text-primary);
}
.form-optional { font-weight: 400; color: var(--c-text-tertiary); font-size: 12px; }
.form-required { color: #ff3b30; }
.form-input, .form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  font-size: 14px;
  background: var(--c-bg-secondary);
  color: var(--c-text-primary);
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.2s ease;
}
.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--c-accent);
}
.form-textarea { resize: vertical; min-height: 120px; line-height: 1.5; }
.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--c-text-tertiary);
  margin-top: 4px;
}
.char-warn { color: #ff9500; }
.form-error {
  padding: 10px 14px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 10px;
  font-size: 13px;
  color: #ff3b30;
  margin-bottom: 16px;
}
.realname-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--c-text-secondary);
  cursor: pointer;
}
.realname-toggle input {
  width: 16px;
  height: 16px;
  accent-color: var(--c-accent);
}
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.btn-primary, .btn-secondary {
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-primary { background: var(--c-accent); color: #fff; }
.btn-primary:hover:not(:disabled) { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--c-bg-secondary);
  color: var(--c-text-primary);
  border: 1px solid var(--c-border);
}
.btn-loading {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 弹窗动画 */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-content, .modal-leave-active .modal-content {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.modal-enter-from .modal-content, .modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Toast */
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 200;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}
.toast-success {
  background: var(--c-bg-card);
  color: #34c759;
  border: 1px solid rgba(52, 199, 89, 0.3);
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

/* 移动端 */
@media (max-width: 640px) {
  .treehole-page { padding: 0 16px 40px; }
  .treehole-header { padding: 28px 0 20px; }
  .treehole-title { font-size: 22px; }
  .treehole-title-row { flex-direction: column; align-items: stretch; gap: 14px; }
  .write-btn { width: 100%; justify-content: center; }
  .message-card { padding: 16px; }
  .treehole-stats { width: 100%; justify-content: center; }
}
</style>
