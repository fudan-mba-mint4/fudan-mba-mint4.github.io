<template>
  <div class="wishes-page" ref="wallRef">
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
          <span class="composer-cta">{{ t.postBtn }}</span>
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

    <!-- 首次加载状态 -->
    <div v-if="loadingFirst" class="state-center">
      <div class="spinner"></div>
    </div>
    <div v-else-if="!wishes.length && !error" class="state-center empty-state">
      <div class="empty-icon">✦</div>
      <p>{{ t.empty }}</p>
      <div class="empty-guide">
        <strong>{{ t.howTitle }}</strong>
        <ol class="empty-guide-list">
          <li>{{ t.how1 }}</li>
          <li>{{ t.how2 }}</li>
          <li>{{ t.how3 }}</li>
        </ol>
      </div>
    </div>
    <div v-else-if="!wishes.length && error" class="state-center">
      <div class="empty-icon">📡</div>
      <p>{{ t.loadError }}</p>
      <button class="btn-ghost" @click="loadFirst">{{ t.retry }}</button>
    </div>

    <!-- 瀑布流：JS 最矮列分列，桌面 3 / 平板 2 / 手机 1 -->
    <div v-else class="masonry">
      <div
        v-for="(col, ci) in columns"
        :key="ci"
        class="masonry-col"
        :ref="el => setColEl(el, ci)"
      >
        <div v-for="w in col" :key="w.id" class="wish-card">
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

          <!-- 点赞的人：名字逗号排队 -->
          <div v-if="w.likeCount" class="liked-bar">
            <span class="liked-emoji">👍</span>
            <span class="liked-names">{{ w.likes.map(x => x.author).join('、') }}</span>
          </div>

          <div class="wish-actions">
            <button class="action-btn" :class="{ active: w.likedByMe }" @click="toggleLike(w)">
              <svg width="18" height="18" viewBox="0 0 24 24" :fill="w.likedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              <span>{{ w.likeCount || t.like }}</span>
            </button>
            <button class="action-btn" @click="openDetail(w)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{{ w.comments.length || t.comment }}</span>
            </button>
          </div>

          <!-- 评论预览：卡片内最多 3 条，超过点详情 -->
          <div v-if="w.comments.length" class="comments-preview">
            <div v-for="c in w.comments.slice(0, 3)" :key="c.id" class="comment-row">
              <strong>{{ c.author }}</strong>
              <span class="comment-text">{{ c.content }}</span>
              <button v-if="canDeleteComment(c)" class="comment-del" @click="deleteComment(w, c)">{{ t.del }}</button>
            </div>
            <button v-if="w.comments.length > 3" class="view-all-comments" @click="openDetail(w)">
              {{ t.viewAllComments(w.comments.length) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 无限滚动哨兵 -->
    <div v-if="wishes.length" ref="sentinel" class="sentinel">
      <div v-if="loadingMore" class="more-status">
        <div class="spinner sm"></div>
        <span>{{ t.loadingMore }}</span>
      </div>
      <div v-else-if="!hasMore" class="no-more">{{ t.noMore }}</div>
    </div>

    <!-- 详情弹层：完整动态 + 全部评论 -->
    <div v-if="detailWish" class="modal-mask detail-mask" @click.self="closeDetail">
      <div class="modal-card detail-card">
        <div class="modal-head">
          <strong>{{ t.detailTitle }}</strong>
          <button class="modal-close" @click="closeDetail">×</button>
        </div>
        <div class="detail-body">
          <div class="wish-head">
            <div class="avatar">{{ detailWish.author[0] }}</div>
            <div class="wish-meta">
              <strong class="wish-author">{{ detailWish.author }}</strong>
              <span class="wish-time">{{ formatTime(detailWish.createdAt) }}</span>
            </div>
            <button v-if="canDelete(detailWish)" class="icon-btn" :title="t.del" @click="confirmDelete(detailWish)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>

          <p class="wish-content">{{ detailWish.content }}</p>

          <div v-if="detailWish.images.length" class="wish-images" :class="'n' + detailWish.images.length">
            <img
              v-for="(u, i) in detailWish.images"
              :key="i"
              :src="u"
              @click="openLightbox(detailWish.images, i)"
            />
          </div>

          <div v-if="detailWish.likeCount" class="liked-bar">
            <span class="liked-emoji">👍</span>
            <span class="liked-names">{{ detailWish.likes.map(x => x.author).join('、') }}</span>
          </div>

          <div class="wish-actions detail-actions">
            <button class="action-btn" :class="{ active: detailWish.likedByMe }" @click="toggleLike(detailWish)">
              <svg width="18" height="18" viewBox="0 0 24 24" :fill="detailWish.likedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              <span>{{ detailWish.likeCount || t.like }}</span>
            </button>
            <span class="detail-comment-count">{{ detailWish.comments.length }} {{ t.commentUnit }}</span>
          </div>

          <div class="detail-comments">
            <div v-if="!detailWish.comments.length" class="detail-no-comments">{{ t.noComments }}</div>
            <div v-for="c in detailWish.comments" :key="c.id" class="comment-row detail-comment-row">
              <strong>{{ c.author }}</strong>
              <span class="comment-text">{{ c.content }}</span>
              <button v-if="canDeleteComment(c)" class="comment-del" @click="deleteComment(detailWish, c)">{{ t.del }}</button>
            </div>
          </div>
        </div>

        <div class="detail-input-bar">
          <template v-if="user">
            <input
              v-model="detailDraft"
              class="comment-input"
              :placeholder="t.commentPh"
              maxlength="300"
              ref="detailInput"
              @keyup.enter="sendDetailComment"
            />
            <button class="btn-send" :disabled="!detailDraft.trim()" @click="sendDetailComment">{{ t.send }}</button>
          </template>
          <a v-else class="btn-login" :href="authUrl">{{ t.login }}</a>
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
import { ref, computed, onMounted, onBeforeUnmount, reactive, nextTick } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useLang } from '../composables/useLang'
import { API_PREFIX } from '../composables/apiConfig.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

const PAGE_SIZE = 12

const i18n = {
  zh: {
    loginHint: '登录后即可发布愿望、点赞和评论',
    login: '去登录',
    composerPh: (name) => `${name}，想组织什么活动？`,
    postBtn: '发布',
    modalTitle: '发布一个活动愿望',
    draftPh: '想去哪里、玩什么、什么时候……把想法写下来，让大家看到',
    uploading: '上传中…',
    uploadFail: '上传失败，点 × 移除',
    addImg: (n) => `添加图片（${n}/3）`,
    imgTip: '最多 3 张图片，不支持视频',
    cancel: '取消', publishing: '发布中…', publish: '发布',
    empty: '还没有愿望，第一个写下你的想法吧',
    howTitle: '许愿池怎么玩？',
    how1: '写下你想要的班级活动、想去的地方、想玩的玩法',
    how2: '同学们点赞支持，热度越高越容易成行',
    how3: '体验运营组参考大家的愿望，策划落地成真',
    loadError: '加载遇到问题', retry: '重试',
    del: '删除', like: '点赞', comment: '评论',
    commentUnit: '条评论', noComments: '还没有评论，快来抢沙发～',
    viewAllComments: (n) => `查看全部 ${n} 条评论`,
    loadingMore: '正在加载…', noMore: '—— 已经到底啦 ——',
    detailTitle: '动态详情',
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
    postBtn: 'Post',
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
    commentUnit: 'comments', noComments: 'No comments yet — be the first',
    viewAllComments: (n) => `View all ${n} comments`,
    loadingMore: 'Loading…', noMore: '— You have reached the end —',
    detailTitle: 'Details',
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
    postBtn: 'โพสต์',
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
    commentUnit: 'ความคิดเห็น', noComments: 'ยังไม่มีความคิดเห็น มาแสดงความคิดเห็นกัน',
    viewAllComments: (n) => `ดูทั้งหมด ${n} ความคิดเห็น`,
    loadingMore: 'กำลังโหลด…', noMore: '— ถึงจุดสิ้นสุดแล้ว —',
    detailTitle: 'รายละเอียด',
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

const wallRef = ref(null)
const colEls = ref([])
const sentinel = ref(null)
const detailInput = ref(null)

const wishes = ref([])
const columns = ref([])
const colCount = ref(3)
let cursor = null
const hasMore = ref(false)
const loadingFirst = ref(false)
const loadingMore = ref(false)
const error = ref(false)
let listLoading = false
let layoutGen = 0

const composerOpen = ref(false)
const draft = ref('')
const pendingImages = ref([])
const fileInput = ref(null)
const submitting = ref(false)

const lightboxUrl = ref(null)
const detailWish = ref(null)
const detailDraft = ref('')
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

function setColEl(el, i) {
  if (el) colEls.value[i] = el
}

function computeColCount() {
  const w = wallRef.value ? wallRef.value.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 900)
  if (w >= 920) return 3
  if (w >= 620) return 2
  return 1
}

function shortestCol() {
  let min = 0
  for (let i = 1; i < colCount.value; i++) {
    const h = colEls.value[i] ? colEls.value[i].offsetHeight : 0
    const m = colEls.value[min] ? colEls.value[min].offsetHeight : 0
    if (h < m) min = i
  }
  return min
}

// 逐张放入当前最矮列；图片区固定宽高比，nextTick 后列高即最终高度。
async function layOut(cards, gen) {
  for (const card of cards) {
    if (gen && gen !== layoutGen) return
    const idx = shortestCol()
    columns.value[idx].push(card)
    await nextTick()
  }
}

async function relayoutAll() {
  const n = computeColCount()
  if (n === colCount.value && columns.value.length === n) return
  colCount.value = n
  columns.value = Array.from({ length: n }, () => [])
  await nextTick()
  const gen = ++layoutGen
  await layOut(wishes.value, gen)
}

// ===== 分页加载 =====
async function fetchPage(cur) {
  const qs = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (cur) {
    qs.set('before', cur.before)
    qs.set('beforeId', cur.beforeId)
  }
  const res = await fetchWithRetry(`${API_PREFIX}/api/wishes?${qs.toString()}`, {}, { timeoutMs: 10000, retries: 2 })
  if (!res.ok) throw new Error('load failed')
  return res.json()
}

async function loadFirst() {
  if (listLoading) return
  listLoading = true
  loadingFirst.value = true
  error.value = false
  try {
    const d = await fetchPage(null)
    wishes.value = d.wishes || []
    cursor = d.nextCursor || null
    hasMore.value = !!d.hasMore
    columns.value = Array.from({ length: colCount.value }, () => [])
    // 必须先关闭首屏 loading，让 masonry 空列渲染并绑定列 ref，再逐张布局；
    // 否则列 DOM 尚不存在、offsetHeight 全为 0，会全部堆进第一列。
    loadingFirst.value = false
    await nextTick()
    await nextTick()
    const gen = ++layoutGen
    await layOut(wishes.value, gen)
  } catch (e) {
    error.value = true
  } finally {
    loadingFirst.value = false
    listLoading = false
  }
}

async function loadMore() {
  if (listLoading || !hasMore.value || loadingFirst.value || !wishes.value.length) return
  listLoading = true
  loadingMore.value = true
  try {
    const d = await fetchPage(cursor)
    const fresh = d.wishes || []
    wishes.value = wishes.value.concat(fresh)
    cursor = d.nextCursor || null
    hasMore.value = !!d.hasMore
    const gen = layoutGen
    await layOut(fresh, gen)
  } catch (e) {
    // 触底加载失败：保留哨兵，下次进入视口可重试
  } finally {
    loadingMore.value = false
    listLoading = false
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
    showToast(t.value.published)
    // 发布后回到第一页
    await loadFirst()
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    showToast(t.value.netSlow)
  } finally {
    submitting.value = false
  }
}

// ===== 点赞（乐观更新，以服务端计数校正）=====
async function toggleLike(w) {
  if (!user.value) { showToast(t.value.needLogin); return }
  const wasLiked = w.likedByMe
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
    // 点赞列表若与服务端计数不一致，以计数为准保留当前用户的乐观项
    if (w.likedByMe && !w.likes.some(x => x.userId === user.value.id)) {
      w.likes.push({ userId: user.value.id, author: user.value.name })
    }
    if (!w.likedByMe) {
      w.likes = w.likes.filter(x => x.userId !== user.value.id)
    }
  } catch (e) {
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

// ===== 详情弹层 =====
function openDetail(w) {
  detailWish.value = w
  detailDraft.value = ''
}
function closeDetail() {
  detailWish.value = null
  detailDraft.value = ''
}
async function sendDetailComment() {
  if (!detailWish.value) return
  await addComment(detailWish.value, detailDraft.value)
  if (detailWish.value) detailDraft.value = ''
}

async function addComment(w, contentRaw) {
  if (!user.value) { showToast(t.value.needLogin); return }
  const content = (contentRaw ?? '').trim()
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
    const id = w.id
    wishes.value = wishes.value.filter(x => x.id !== id)
    for (const col of columns.value) {
      const i = col.findIndex(x => x.id === id)
      if (i >= 0) col.splice(i, 1)
    }
    if (detailWish.value && detailWish.value.id === id) closeDetail()
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

let io = null
let ro = null
function onResize() {
  relayoutAll()
}

onMounted(async () => {
  colCount.value = computeColCount()
  columns.value = Array.from({ length: colCount.value }, () => [])
  await loadFirst()
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) loadMore()
    }, { rootMargin: '800px 0px' })
    if (sentinel.value) io.observe(sentinel.value)
  }
  if (wallRef.value && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => { relayoutAll() })
    ro.observe(wallRef.value)
  }
})

onBeforeUnmount(() => {
  if (io) io.disconnect()
  if (ro) ro.disconnect()
})
</script>

<style scoped>
.wishes-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 8px 0 40px;
}

/* 头像 */
.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--c-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}
.avatar.sm {
  width: 36px;
  height: 36px;
  font-size: 15px;
}

/* 顶部发布 */
.composer-card {
  margin-bottom: 22px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: 12px 16px;
}
.composer-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: var(--c-bg-secondary);
  border: none;
  border-radius: var(--radius-full);
  padding: 8px 12px 8px 16px;
  cursor: pointer;
  text-align: left;
}
.composer-placeholder {
  flex: 1;
  color: var(--c-text-tertiary);
  font-size: 15px;
}
.composer-cta {
  background: var(--c-accent);
  color: #fff;
  border-radius: var(--radius-full);
  padding: 6px 18px;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
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
  padding: 72px 20px;
  color: var(--c-text-tertiary);
  text-align: center;
  gap: 10px;
}
.empty-icon {
  font-size: 40px;
}
.empty-guide {
  margin-top: 18px;
  max-width: 460px;
  width: 100%;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  text-align: left;
}
.empty-guide strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 10px;
}
.empty-guide-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.5;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner.sm {
  width: 20px;
  height: 20px;
  border-width: 2px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 瀑布流 */
.masonry {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}
.masonry-col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 愿望卡片 */
.wish-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  padding: 15px 16px;
  break-inside: avoid;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.wish-head {
  display: flex;
  align-items: center;
  gap: 11px;
}
.wish-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  flex-shrink: 0;
}
.icon-btn:hover {
  color: var(--c-red);
  background: var(--c-bg-secondary);
}
.wish-content {
  margin: 11px 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--c-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 图片网格：固定宽高比，保证分列高度可预测 */
.wish-images {
  display: grid;
  gap: 5px;
  margin-bottom: 12px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.wish-images.n1 {
  grid-template-columns: 1fr;
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

/* 点赞列表：名字逗号排队 */
.liked-bar {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  background: var(--c-bg-secondary);
  border-radius: var(--radius-md);
  padding: 8px 11px;
  font-size: 13px;
  color: var(--c-text-secondary);
  margin-bottom: 10px;
  line-height: 1.5;
}
.liked-emoji {
  flex-shrink: 0;
}
.liked-names {
  word-break: break-word;
}

/* 底部操作 */
.wish-actions {
  display: flex;
  align-items: center;
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

/* 评论预览（卡片内最多 3 条） */
.comments-preview {
  border-top: 1px solid var(--c-border-light);
  padding-top: 10px;
  margin-top: 4px;
}
.comment-row {
  display: flex;
  align-items: baseline;
  gap: 7px;
  font-size: 13.5px;
  margin-bottom: 7px;
  flex-wrap: wrap;
}
.comment-row strong {
  color: var(--c-accent);
  flex-shrink: 0;
}
.comment-text {
  color: var(--c-text-primary);
  word-break: break-word;
  flex: 1;
  min-width: 0;
}
.comment-del {
  background: none;
  border: none;
  color: var(--c-text-quaternary);
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}
.comment-del:hover { color: var(--c-red); }
.view-all-comments {
  background: none;
  border: none;
  padding: 2px 0 0;
  color: var(--c-text-quaternary);
  font-size: 13px;
  cursor: pointer;
}
.view-all-comments:hover {
  color: var(--c-accent);
}

/* 无限滚动 */
.sentinel {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px;
}
.more-status {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--c-text-tertiary);
  font-size: 14px;
}
.no-more {
  color: var(--c-text-quaternary);
  font-size: 13px;
}

/* 详情弹层 */
.detail-mask {
  padding: 40px 16px;
}
.detail-card {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 80px);
}
.detail-body {
  padding: 18px 20px 8px;
  overflow-y: auto;
  flex: 1;
}
.detail-actions {
  border-top: none;
}
.detail-comment-count {
  flex: 1;
  text-align: right;
  font-size: 13px;
  color: var(--c-text-quaternary);
  padding-right: 8px;
}
.detail-comments {
  margin-top: 6px;
  border-top: 1px solid var(--c-border-light);
  padding-top: 12px;
}
.detail-comment-row {
  margin-bottom: 11px;
}
.detail-no-comments {
  color: var(--c-text-quaternary);
  font-size: 14px;
  padding: 8px 0 14px;
}
.detail-input-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid var(--c-border-light);
}
.comment-input {
  flex: 1;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  padding: 9px 16px;
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
  padding: 9px 20px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
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

/* 平板 2 列 */
@media (max-width: 920px) {
  .masonry { gap: 14px; }
  .masonry-col { gap: 14px; }
}

/* 手机 1 列 */
@media (max-width: 640px) {
  .wishes-page { padding: 6px 0 32px; }
  .modal-mask { padding: 20px 12px; }
  .composer-cta { padding: 6px 14px; }
}
</style>
