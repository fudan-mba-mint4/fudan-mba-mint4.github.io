<template>
  <div class="treehole-page">
    <!-- 页面头部 -->
    <div class="treehole-header">
      <div class="treehole-title-row">
        <h1 class="treehole-title">{{ t.title }}</h1>
        <button class="write-btn" @click="showForm = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          {{ t.writeBtn }}
        </button>
      </div>
      <p class="treehole-subtitle">{{ t.subtitle }}</p>
    </div>

    <!-- 留言列表 -->
    <div class="message-list">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>{{ t.loading }}</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="messages.length === 0 && !error" class="empty-state">
        <div class="empty-icon">🌱</div>
        <p class="empty-text">{{ t.empty }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p class="error-text">{{ error }}</p>
        <button class="retry-btn" @click="loadMessages">{{ t.retry }}</button>
      </div>

      <!-- 留言卡片 -->
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-card"
        @dblclick="handleAdminDelete(msg.id)"
      >
        <div class="message-header">
          <span class="message-nickname">{{ msg.nickname || t.anonymous }}</span>
          <span class="message-time">{{ formatTime(msg.created_at) }}</span>
        </div>
        <p class="message-content">{{ msg.content }}</p>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading" class="load-more">
        <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
          {{ loadingMore ? t.loading : t.loadMore }}
        </button>
      </div>
    </div>

    <!-- 写留言弹窗 -->
    <Teleport to="body">
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">{{ t.formTitle }}</h3>
            <button class="modal-close" @click="closeForm">✕</button>
          </div>
          <form class="modal-body" @submit.prevent="submitMessage">
            <div class="form-group">
              <label class="form-label">{{ t.nicknameLabel }} <span class="form-optional">({{ t.optional }})</span></label>
              <input
                v-model="form.nickname"
                type="text"
                class="form-input"
                :placeholder="t.nicknamePlaceholder"
                maxlength="50"
              />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t.contentLabel }} <span class="form-required">*</span></label>
              <textarea
                v-model="form.content"
                class="form-textarea"
                :placeholder="t.contentPlaceholder"
                maxlength="500"
                rows="5"
                required
              ></textarea>
              <div class="char-count">{{ form.content.length }}/500</div>
            </div>
            <div v-if="formError" class="form-error">{{ formError }}</div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeForm">{{ t.cancel }}</button>
              <button type="submit" class="btn-primary" :disabled="submitting || !form.content.trim()">
                {{ submitting ? t.submitting : t.submit }}
              </button>
            </div>
          </form>
        </div>
      </div>
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
import { ref, onMounted } from 'vue'
import { useLang } from '../composables/useLang.js'

const i18n = {
  zh: {
    title: '匿名树洞',
    subtitle: '说出你的心声，这里没有人知道你是谁',
    writeBtn: '写留言',
    loading: '加载中...',
    empty: '还没有留言，来做第一个吧',
    retry: '重试',
    loadMore: '加载更多',
    anonymous: '匿名同学',
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
    formError: '',
  },
  en: {
    title: 'Anonymous Tree Hole',
    subtitle: 'Speak your mind, no one knows who you are',
    writeBtn: 'Write',
    loading: 'Loading...',
    empty: 'No messages yet. Be the first!',
    retry: 'Retry',
    loadMore: 'Load More',
    anonymous: 'Anonymous',
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
    formError: '',
  },
  th: {
    title: 'กระบอกไม้ไผ่ นิรนาม',
    subtitle: 'พูดสิ่งที่อยากพูด ไม่มีใครรู้ว่าคุณคือใคร',
    writeBtn: 'เขียน',
    loading: 'กำลังโหลด...',
    empty: 'ยังไม่มีข้อความ เป็นคนแรกกัน!',
    retry: 'ลองอีกครั้ง',
    loadMore: 'โหลดเพิ่ม',
    anonymous: 'นักเรียนนิรนาม',
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
    formError: '',
  },
}

const { t } = useLang(i18n)

const API_BASE = '/api/treehole'

const messages = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const page = ref(1)
const hasMore = ref(true)
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const showSuccess = ref(false)
const form = ref({ nickname: '', content: '' })

onMounted(() => {
  loadMessages()
})

async function loadMessages() {
  loading.value = true
  error.value = ''
  page.value = 1
  try {
    const res = await fetch(`${API_BASE}?page=1&limit=20`)
    if (!res.ok) throw new Error('加载失败')
    const data = await res.json()
    messages.value = data.data || []
    hasMore.value = data.pagination?.page < data.pagination?.totalPages
  } catch (e) {
    error.value = e.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const nextPage = page.value + 1
    const res = await fetch(`${API_BASE}?page=${nextPage}&limit=20`)
    if (!res.ok) throw new Error('加载失败')
    const data = await res.json()
    messages.value = [...messages.value, ...(data.data || [])]
    page.value = nextPage
    hasMore.value = data.pagination?.page < data.pagination?.totalPages
  } catch (e) {
    console.error('加载更多失败:', e)
  } finally {
    loadingMore.value = false
  }
}

async function submitMessage() {
  if (!form.value.content.trim()) return
  submitting.value = true
  formError.value = ''
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: form.value.nickname.trim() || undefined,
        content: form.value.content.trim(),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || data.errors?.join('、') || '提交失败')
    }
    // 提交成功，关闭弹窗，刷新列表
    closeForm()
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
    await loadMessages()
  } catch (e) {
    formError.value = e.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

function closeForm() {
  showForm.value = false
  form.value = { nickname: '', content: '' }
  formError.value = ''
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
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 管理员删除：双击留言卡片，输入Token后删除
async function handleAdminDelete(id) {
  const token = prompt('管理员删除：请输入Admin Token')
  if (!token) return
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    if (res.ok) {
      alert('删除成功')
      await loadMessages()
    } else {
      alert(data.error || '删除失败')
    }
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}
</script>

<style scoped>
.treehole-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 头部 */
.treehole-header {
  padding: 40px 0 28px;
}
.treehole-title-row {
  display: flex;
  align-items: center;
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
  transition: opacity 0.2s ease;
  white-space: nowrap;
}
.write-btn:hover { opacity: 0.85; }

/* 留言列表 */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.message-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 20px;
  transition: border-color 0.2s ease;
  cursor: default;
}
.message-card:hover {
  border-color: var(--c-accent-light);
}
.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.message-nickname {
  font-size: 14px;
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
}

/* 状态 */
.loading-state, .empty-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 40px; }
.empty-text, .loading-state span {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin: 0;
}
.error-text {
  font-size: 14px;
  color: var(--c-error, #ff3b30);
  margin: 0;
}
.retry-btn {
  padding: 8px 20px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  color: var(--c-text-primary);
}

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  padding: 8px 0;
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
.load-more-btn:hover:not(:disabled) {
  border-color: var(--c-accent);
}
.load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
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
}
.modal-body {
  padding: 24px;
}
.form-group {
  margin-bottom: 18px;
}
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--c-text-primary);
}
.form-optional {
  font-weight: 400;
  color: var(--c-text-tertiary);
  font-size: 12px;
}
.form-required {
  color: #ff3b30;
}
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
.form-textarea {
  resize: vertical;
  min-height: 120px;
}
.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--c-text-tertiary);
  margin-top: 4px;
}
.form-error {
  padding: 10px 14px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 10px;
  font-size: 13px;
  color: #ff3b30;
  margin-bottom: 16px;
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
}
.btn-primary {
  background: var(--c-accent);
  color: #fff;
}
.btn-primary:hover:not(:disabled) { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--c-bg-secondary);
  color: var(--c-text-primary);
  border: 1px solid var(--c-border);
}

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
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

/* 移动端 */
@media (max-width: 640px) {
  .treehole-page { padding: 0 16px 40px; }
  .treehole-header { padding: 28px 0 20px; }
  .treehole-title { font-size: 22px; }
  .treehole-title-row { flex-direction: column; align-items: flex-start; gap: 12px; }
  .write-btn { width: 100%; justify-content: center; }
  .message-card { padding: 16px; }
}
</style>
