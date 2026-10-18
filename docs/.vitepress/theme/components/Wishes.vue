<template>
  <div class="wishes-page">
    <!-- 顶部发布区 -->
    <div class="composer-card">
      <template v-if="!user">
        <div class="login-hint">
          <span>{{ t.loginHint }}</span>
          <a class="btn-login" :href="authUrl">{{ t.login }}</a>
        </div>
      </template>
      <template v-else>
        <button class="composer-trigger" @click="openComposer">
          <div class="avatar sm">{{ user.name[0] }}</div>
          <span class="composer-placeholder">{{ t.composerPh(user.name) }}</span>
        </button>
      </template>
    </div>

    <!-- 发布弹窗 -->
    <div v-if="composerOpen" class="modal-mask" @click.self="closeComposer">
      <div class="modal-card">
        <div class="modal-head">
          <strong>{{ t.modalTitle }}</strong>
          <button class="modal-close" @click="closeComposer">×</button>
        </div>
        <div class="modal-body">
          <div class="author-row">
            <div class="avatar sm">{{ user?.name?.[0] }}</div>
            <strong>{{ user?.name }}</strong>
          </div>
          <textarea
            v-model="draft"
            class="draft-area"
            :placeholder="t.draftPh"
            maxlength="1000"
            rows="4"
            autofocus
          ></textarea>
          <div class="draft-foot">
            <span class="char-count">{{ draft.length }}/1000</span>
          </div>

          <div v-if="pendingImages.length" class="img-preview-grid">
            <div v-for="(img, i) in pendingImages" :key="i" class="img-preview">
              <img :src="img.preview" />
              <button class="img-remove" :disabled="img.uploading" @click="removeImage(i)">×</button>
              <div v-if="img.uploading" class="img-uploading">{{ t.uploading }}</div>
              <div v-else-if="img.error" class="img-uploading img-failed">{{ t.uploadFail }}</div>
            </div>
          </div>

          <button v-if="pendingImages.length < 3" class="add-image-btn" @click="pickImage">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>{{ t.addImg(pendingImages.length) }}</span>
          </button>
          <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onSelectImage" />
          <p class="tip-line">{{ t.imgTip }}</p>
        </div>
        <div class="modal-foot">
          <button class="btn-ghost" @click="closeComposer">{{ t.cancel }}</button>
          <button class="btn-primary" :disabled="!canSubmit || submitting" @click="submit">
            {{ submitting ? t.publishing : t.publish }}
          </button>
        </div>
      </div>
    </div>

    <!-- 信息流 -->
    <div class="feed">
      <div v-if="loading && !wishes.length" class="state-center">
        <div class="spinner"></div>
      </div>
      <div v-else-if="!loading && !error && !wishes.length" class="state-center empty-state">
        <div class="empty-icon">✦</div>
        <p>{{ t.empty }}</p>
      </div>
      <div v-else-if="error && !wishes.length" class="state-center">
        <div class="empty-icon">📡</div>
        <p>{{ t.loadError }}</p>
        <button class="btn-ghost" @click="load">{{ t.retry }}</button>
      </div>

      <div v-for="w in wishes" :key="w.id" class="wish-card">
        <div class="wish-head">
          <div class="avatar">{{ w.author[0] }}</div>
          <div class="wish-meta">
            <strong class="wish-author">{{ w.author }}</strong>
            <span class="wish-time">{{ formatTime(w.createdAt) }}</span>
          </div>
          <button v-if="canDelete(w)" class="icon-btn" :title="t.del" @click="confirmDelete(w)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>

        <p class="wish-content">{{ w.content }}</p>

        <div v-if="w.images.length" class="wish-images" :class="'n' + w.images.length">
          <img
            v-for="(u, i) in w.images"
            :key="i"
            :src="u"
            loading="lazy"
            @click="openLightbox(w.images, i)"
          />
        </div>

        <div v-if="w.likeCount" class="liked-bar">
          <span class="liked-badge">👍</span>
          <span>{{ w.likes.map(x => x.author).join('、') }}</span>
        </div>

        <div class="wish-actions">
          <button class="action-btn" :class="{ active: w.likedByMe }" @click="toggleLike(w)">
            <svg width="18" height="18" viewBox="0 0 24 24" :fill="w.likedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span>{{ w.likeCount || t.like }}</span>
          </button>
          <button class="action-btn" :class="{ active: w.showComments }" @click="toggleComments(w)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{{ w.comments.length || t.comment }}</span>
          </button>
        </div>

        <div v-if="w.showComments" class="comments-panel">
          <div v-for="c in w.comments" :key="c.id" class="comment-row">
            <strong>{{ c.author }}</strong>
            <span class="comment-text">{{ c.content }}</span>
            <button v-if="canDeleteComment(c)" class="comment-del" @click="deleteComment(w, c)">{{ t.del }}</button>
          </div>
          <div class="comment-input-row">
            <input
              v-model="w.draftComment"
              class="comment-input"
              :placeholder="t.commentPh"
              maxlength="300"
              @keyup.enter="addComment(w)"
            />
            <button class="btn-send" :disabled="!w.draftComment.trim()" @click="addComment(w)">{{ t.send }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 大图预览 -->
    <div v-if="lightboxUrl" class="lightbox" @click="closeLightbox">
      <img :src="lightboxUrl" />
    </div>

    <!-- 轻提示 -->
    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useLang } from '../composables/useLang'
import { API_PREFIX } from '../composables/apiConfig.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

const i18n = {
  zh: {
    loginHint: '登录后即可发布愿望、点赞和评论',
    login: '去登录',
    composerPh: (name) => `${name}，想组织什么活动？`,
    modalTitle: '发布一个活动愿望',
    draftPh: '想去哪里、玩什么、什么时候……把想法写下来，让大家看到',
    uploading: '上传中…',
    uploadFail: '上传失败，点 × 移除',
    addImg: (n) => `添加图片（${n}/3）`,
    imgTip: '最多 3 张图片，不支持视频',
    cancel: '取消', publishing: '发布中…', publish: '发布',
    empty: '还没有愿望，第一个写下你的想法吧',
    loadError: '加载遇到问题', retry: '重试',
    del: '删除', like: '点赞', comment: '评论',
    commentPh: '写下你的评论…', send: '发送',
    confirmDelete: '确定删除这条愿望？',
    justNow: '刚刚', minAgo: (n) => `${n} 分钟前`, hourAgo: (n) => `${n} 小时前`, dayAgo: (n) => `${n} 天前`,
    dateFmt: (d) => `${d.getMonth() + 1}月${d.getDate()}日`,
    imgMax: '最多 3 张图片', imgOnly: '只能上传图片，不支持视频', imgFail: '图片上传失败',
    publishFail: '发布失败', published: '愿望已发布', netSlow: '网络较慢，请稍后重试',
    needLogin: '请先登录', actionFail: '操作失败，请稍后重试', commentFail: '评论失败', delFail: '删除失败', deleted: '已删除',
  },
  en: {
    loginHint: 'Log in to post wishes, like and comment',
    login: 'Log in',
    composerPh: (name) => `${name}, what activity do you want?`,
    modalTitle: 'Post an activity wish',
    draftPh: 'Where to go, what to do, when… write it down for everyone to see',
    uploading: 'Uploading…',
    uploadFail: 'Upload failed, click × to remove',
    addImg: (n) => `Add photos (${n}/3)`,
    imgTip: 'Up to 3 photos, no videos',
    cancel: 'Cancel', publishing: 'Posting…', publish: 'Post',
    empty: 'No wishes yet — be the first to share an idea',
    loadError: 'Something went wrong', retry: 'Retry',
    del: 'Delete', like: 'Like', comment: 'Comment',
    commentPh: 'Write a comment…', send: 'Send',
    confirmDelete: 'Delete this wish?',
    justNow: 'Just now', minAgo: (n) => `${n} min ago`, hourAgo: (n) => `${n} h ago`, dayAgo: (n) => `${n} d ago`,
    dateFmt: (d) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d),
    imgMax: 'Up to 3 photos', imgOnly: 'Only images allowed, no videos', imgFail: 'Image upload failed',
    publishFail: 'Failed to post', published: 'Wish posted', netSlow: 'Network slow, please try again later',
    needLogin: 'Please log in first', actionFail: 'Action failed, please try again', commentFail: 'Failed to comment', delFail: 'Delete failed', deleted: 'Deleted',
  },
  th: {
    loginHint: 'เข้าสู่ระบบเพื่อโพสต์คำขอ กดถูกใจและแสดงความคิดเห็น',
    login: 'เข้าสู่ระบบ',
    composerPh: (name) => `${name} อยากจัดกิจกรรมอะไร?`,
    modalTitle: 'โพสต์คำขอกิจกรรม',
    draftPh: 'อยากไปที่ไหน ทำอะไร เมื่อไหร่… เขียนให้เพื่อน ๆ เห็น',
    uploading: 'กำลังอัปโหลด…',
    uploadFail: 'อัปโหลดล้มเหลว กด × เพื่อลบ',
    addImg: (n) => `เพิ่มรูป (${n}/3)`,
    imgTip: 'ได้สูงสุด 3 รูป ไม่รองรับวิดีโอ',
    cancel: 'ยกเลิก', publishing: 'กำลังโพสต์…', publish: 'โพสต์',
    empty: 'ยังไม่มีคำขอ เป็นคนแรกที่แชร์ไอเดีย',
    loadError: 'เกิดข้อผิดพลาด', retry: 'ลองใหม่',
    del: 'ลบ', like: 'ถูกใจ', comment: 'ความคิดเห็น',
    commentPh: 'เขียนความคิดเห็น…', send: 'ส่ง',
    confirmDelete: 'ลบคำขอนี้?',
    justNow: 'เมื่อสักครู่', minAgo: (n) => `${n} นาทีที่แล้ว`, hourAgo: (n) => `${n} ชม.ที่แล้ว`, dayAgo: (n) => `${n} วันที่แล้ว`,
    dateFmt: (d) => new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(d),
    imgMax: 'ได้สูงสุด 3 รูป', imgOnly: 'อัปโหลดได้เฉพาะรูป ไม่รองรับวิดีโอ', imgFail: 'อัปโหลดรูปไม่สำเร็จ',
    publishFail: 'โพสต์ไม่สำเร็จ', published: 'โพสต์คำขอแล้ว', netSlow: 'เครือข่ายช้า กรุณาลองใหม่ภายหลัง',
    needLogin: 'กรุณาเข้าสู่ระบบก่อน', actionFail: 'ทำรายการไม่สำเร็จ กรุณาลองใหม่', commentFail: 'แสดงความคิดเห็นไม่สำเร็จ', delFail: 'ลบไม่สำเร็จ', deleted: 'ลบแล้ว',
  },
}
const { lang, t } = useLang(i18n)
const authUrl = computed(() => (lang.value === 'zh' ? '/auth/' : `/${lang.value}/auth/`))

const { currentUser: user, getToken } = useAuth()

const wishes = ref([])
const loading = ref(false)
const error = ref(false)

const composerOpen = ref(false)
const draft = ref('')
const pendingImages = ref([])
const fileInput = ref(null)
const submitting = ref(false)

const lightboxUrl = ref(null)
const toast = ref('')
let toastTimer = null

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2200)
}

const canSubmit = computed(() =>
  draft.value.trim().length > 0 &&
  pendingImages.value.every(i => !i.uploading && i.url)
)

// ===== 加载 =====
async function load() {
  loading.value = true
  error.value = false
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/wishes`, {}, { timeoutMs: 10000, retries: 3 })
    if (!res.ok) throw new Error('load failed')
    const d = await res.json()
    wishes.value = (d.wishes || []).map(w => ({
      ...w,
      showComments: false,
      draftComment: '',
    }))
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

// ===== 发布弹窗 =====
function openComposer() {
  composerOpen.value = true
  draft.value = ''
  pendingImages.value = []
}
function closeComposer() {
  if (submitting.value) return
  composerOpen.value = false
}

function pickImage() {
  fileInput.value?.click()
}

async function onSelectImage(e) {
  const files = Array.from(e.target.files || [])
  for (const file of files) {
    if (pendingImages.value.length >= 3) {
      showToast(t.value.imgMax)
      break
    }
    if (!/^image\//.test(file.type)) {
      showToast(t.value.imgOnly)
      continue
    }
    const compressed = await compressImage(file)
    const item = reactive({
      file: compressed,
      preview: URL.createObjectURL(compressed),
      url: null,
      uploading: true,
      error: false,
    })
    pendingImages.value.push(item)
    // 选择后立即上传，发布时直接带上已返回的 URL
    try {
      item.url = await uploadImage(item.file)
    } catch (err) {
      item.error = true
      showToast(err.message || t.value.imgFail)
    } finally {
      item.uploading = false
    }
  }
  e.target.value = ''
}

function removeImage(i) {
  const img = pendingImages.value[i]
  if (img.uploading) return
  URL.revokeObjectURL(img.preview)
  pendingImages.value.splice(i, 1)
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    // 图片在选择时已上传，这里直接收集已返回的 URL
    const images = pendingImages.value.map(i => i.url).filter(Boolean)
    const res = await fetchWithRetry(`${API_PREFIX}/api/wishes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ content: draft.value.trim(), images }),
    }, { timeoutMs: 15000, retries: 2 })
    if (!res.ok) {
      let msg = t.value.publishFail
      try { const e = await res.json(); if (e.error) msg = e.error } catch {}
      showToast(msg)
      return
    }
    composerOpen.value = false
    pendingImages.value.forEach(i => URL.revokeObjectURL(i.preview))
    await load()
    showToast(t.value.published)
  } catch (e) {
    showToast(t.value.netSlow)
  } finally {
    submitting.value = false
  }
}

// ===== 点赞 =====
async function toggleLike(w) {
  if (!user.value) { showToast(t.value.needLogin); return }
  const wasLiked = w.likedByMe
  // 乐观更新
  w.likedByMe = !wasLiked
  if (wasLiked) {
    w.likeCount = Math.max(0, w.likeCount - 1)
    w.likes = w.likes.filter(x => x.userId !== user.value.id)
  } else {
    w.likeCount += 1
    w.likes.push({ userId: user.value.id, author: user.value.name })
  }
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/wishes/${w.id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    }, { timeoutMs: 10000, retries: 2 })
    if (!res.ok) throw new Error('like failed')
    const d = await res.json()
    w.likedByMe = d.liked
    w.likeCount = d.likeCount
    // 以服务端为准重建 likes
    await refreshOne(w)
  } catch (e) {
    // 回滚
    w.likedByMe = wasLiked
    if (wasLiked) {
      w.likeCount += 1
      w.likes.push({ userId: user.value.id, author: user.value.name })
    } else {
      w.likeCount = Math.max(0, w.likeCount - 1)
      w.likes = w.likes.filter(x => x.userId !== user.value.id)
    }
    showToast(t.value.actionFail)
  }
}

// 服务端为准，刷新单条的点赞/评论
async function refreshOne(w) {
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/wishes`, {}, { timeoutMs: 10000, retries: 1 })
    if (!res.ok) return
    const d = await res.json()
    const latest = (d.wishes || []).find(x => x.id === w.id)
    if (latest) {
      w.likes = latest.likes
      w.likeCount = latest.likeCount
      w.likedByMe = latest.likedByMe
      const wasOpen = w.showComments
      const draftText = w.draftComment
      w.comments = latest.comments
      w.showComments = wasOpen
      w.draftComment = draftText
    }
  } catch {}
}

// ===== 评论 =====
function toggleComments(w) {
  w.showComments = !w.showComments
}

async function addComment(w) {
  if (!user.value) { showToast(t.value.needLogin); return }
  const content = w.draftComment.trim()
  if (!content) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/wishes/${w.id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ content }),
    }, { timeoutMs: 10000, retries: 2 })
    if (!res.ok) {
      let msg = t.value.commentFail
      try { const e = await res.json(); if (e.error) msg = e.error } catch {}
      showToast(msg)
      return
    }
    const d = await res.json()
    w.comments.push({ ...d.comment, mine: true })
    w.draftComment = ''
  } catch (e) {
    showToast(t.value.netSlow)
  }
}

async function deleteComment(w, c) {
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/wishes/${w.id}/comment`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ commentId: c.id }),
    }, { timeoutMs: 10000, retries: 2 })
    if (!res.ok) { showToast(t.value.delFail); return }
    w.comments = w.comments.filter(x => x.id !== c.id)
  } catch (e) {
    showToast(t.value.netSlow)
  }
}

// ===== 删除许愿 =====
function canDelete(w) {
  if (!user.value) return false
  return user.value.id === w.userId || !!user.value.role
}
function canDeleteComment(c) {
  if (!user.value) return false
  return c.mine || !!user.value.role
}
async function confirmDelete(w) {
  if (typeof window !== 'undefined' && !window.confirm(t.value.confirmDelete)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/wishes/${w.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }, { timeoutMs: 10000, retries: 2 })
    if (!res.ok) { showToast(t.value.delFail); return }
    wishes.value = wishes.value.filter(x => x.id !== w.id)
    showToast(t.value.deleted)
  } catch (e) {
    showToast(t.value.netSlow)
  }
}

// ===== 大图 =====
function openLightbox(images, i) {
  lightboxUrl.value = images[i]
}
function closeLightbox() {
  lightboxUrl.value = null
}

// ===== 工具 =====
function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now - d) / 1000
  const L = t.value
  if (diff < 60) return L.justNow
  if (diff < 3600) return L.minAgo(Math.floor(diff / 60))
  if (diff < 86400) return L.hourAgo(Math.floor(diff / 3600))
  if (diff < 86400 * 7) return L.dayAgo(Math.floor(diff / 86400))
  return L.dateFmt(d)
}

const MAX_IMAGE_EDGE = 1600
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => {
        let w = img.width, h = img.height
        const ratio = Math.min(1, MAX_IMAGE_EDGE / Math.max(w, h))
        w = Math.round(w * ratio); h = Math.round(h * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          } else resolve(file)
        }, 'image/jpeg', 0.85)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = String(reader.result || '')
      resolve(s.includes(',') ? s.slice(s.indexOf(',') + 1) : s)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function randHex(n) {
  const arr = new Uint8Array(n)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function uploadImage(file) {
  const key = `wishes/${Date.now()}-${randHex(4)}.jpg`
  const dataBase64 = await readAsBase64(file)
  const res = await fetchWithRetry(`${API_PREFIX}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ key, contentType: 'image/jpeg', dataBase64 }),
  }, { timeoutMs: 120000, retries: 2 })
  if (!res.ok) {
    let msg = '图片上传失败'
    try { const e = await res.json(); if (e.error) msg = e.error } catch {}
    throw new Error(msg)
  }
  const d = await res.json()
  return d.url
}

onMounted(load)
</script>

<style scoped>
.wishes-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 8px 0 40px;
}

/* 头像 */
.avatar {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: var(--c-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 17px;
  flex-shrink: 0;
}
.avatar.sm {
  width: 36px;
  height: 36px;
  font-size: 15px;
}

/* 顶部发布 */
.composer-card {
  margin-bottom: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: 14px 16px;
}
.composer-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: var(--c-bg-secondary);
  border: none;
  border-radius: var(--radius-full);
  padding: 8px 16px;
  cursor: pointer;
  text-align: left;
}
.composer-placeholder {
  color: var(--c-text-tertiary);
  font-size: 15px;
}
.login-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 15px;
  color: var(--c-text-secondary);
}
.btn-login {
  background: var(--c-accent);
  color: #fff;
  border-radius: var(--radius-full);
  padding: 7px 18px;
  font-size: 14px;
  font-weight: 500;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 16px;
  z-index: var(--z-modal);
  overflow-y: auto;
}
.modal-card {
  background: var(--c-bg-card);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 560px;
  box-shadow: var(--shadow-float);
  overflow: hidden;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--c-border-light);
}
.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: var(--c-text-tertiary);
  cursor: pointer;
}
.modal-body {
  padding: 18px 20px;
}
.author-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.draft-area {
  width: 100%;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
  font-size: 16px;
  font-family: inherit;
  background: var(--c-bg-primary);
  color: var(--c-text-primary);
  resize: vertical;
  box-sizing: border-box;
}
.draft-area:focus {
  outline: none;
  border-color: var(--c-accent);
}
.draft-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}
.char-count {
  font-size: 12px;
  color: var(--c-text-quaternary);
}

.img-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 12px 0;
}
.img-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.img-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-uploading {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  text-align: center;
  padding: 4px;
}
.img-failed {
  background: rgba(255, 59, 48, 0.75);
}
.add-image-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--c-bg-secondary);
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  color: var(--c-text-secondary);
  cursor: pointer;
  font-size: 14px;
  width: 100%;
  justify-content: center;
}
.tip-line {
  font-size: 12px;
  color: var(--c-text-quaternary);
  margin: 8px 0 0;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--c-border-light);
}
.btn-ghost {
  background: var(--c-bg-secondary);
  border: none;
  border-radius: var(--radius-full);
  padding: 9px 22px;
  font-size: 15px;
  color: var(--c-text-primary);
  cursor: pointer;
}
.btn-primary {
  background: var(--c-accent);
  border: none;
  border-radius: var(--radius-full);
  padding: 9px 24px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 状态 */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--c-text-tertiary);
  text-align: center;
  gap: 10px;
}
.empty-icon {
  font-size: 36px;
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

/* 愿望卡片 */
.wish-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: 16px 18px;
  margin-bottom: 14px;
}
.wish-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.wish-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.wish-author {
  font-size: 15px;
  color: var(--c-text-primary);
}
.wish-time {
  font-size: 12px;
  color: var(--c-text-quaternary);
}
.icon-btn {
  background: none;
  border: none;
  color: var(--c-text-quaternary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-full);
}
.icon-btn:hover {
  color: var(--c-red);
  background: var(--c-bg-secondary);
}
.wish-content {
  margin: 12px 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--c-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 图片网格 */
.wish-images {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.wish-images.n1 {
  grid-template-columns: 1fr;
  max-width: 70%;
}
.wish-images.n1 img {
  aspect-ratio: 4/3;
  object-fit: cover;
}
.wish-images.n2 {
  grid-template-columns: 1fr 1fr;
}
.wish-images.n2 img {
  aspect-ratio: 1;
  object-fit: cover;
}
.wish-images.n3 {
  grid-template-columns: 1fr 1fr 1fr;
}
.wish-images.n3 img {
  aspect-ratio: 1;
  object-fit: cover;
}
.wish-images img {
  width: 100%;
  cursor: zoom-in;
}

/* 点赞列表 */
.liked-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--c-bg-secondary);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: 13px;
  color: var(--c-text-secondary);
  margin-bottom: 10px;
}
.liked-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--c-accent);
  font-size: 11px;
}

/* 底部操作 */
.wish-actions {
  display: flex;
  border-top: 1px solid var(--c-border-light);
  padding-top: 8px;
}
.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--c-text-tertiary);
  font-size: 14px;
  padding: 8px;
  cursor: pointer;
  border-radius: var(--radius-md);
}
.action-btn.active {
  color: var(--c-accent);
}
.action-btn:hover {
  background: var(--c-bg-secondary);
}

/* 评论 */
.comments-panel {
  border-top: 1px solid var(--c-border-light);
  padding-top: 12px;
  margin-top: 4px;
}
.comment-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.comment-row strong {
  color: var(--c-accent);
  flex-shrink: 0;
}
.comment-text {
  color: var(--c-text-primary);
  word-break: break-word;
}
.comment-del {
  background: none;
  border: none;
  color: var(--c-text-quaternary);
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;
}
.comment-del:hover { color: var(--c-red); }
.comment-input-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.comment-input {
  flex: 1;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  padding: 8px 16px;
  font-size: 14px;
  color: var(--c-text-primary);
}
.comment-input:focus {
  outline: none;
  border-color: var(--c-accent);
}
.btn-send {
  background: var(--c-accent);
  border: none;
  border-radius: var(--radius-full);
  color: #fff;
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
}
.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 大图 */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: 24px;
  cursor: zoom-out;
}
.lightbox img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* toast */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  font-size: 14px;
  z-index: var(--z-toast);
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .wish-images.n1 { max-width: 100%; }
  .modal-mask { padding: 20px 12px; }
}
</style>
