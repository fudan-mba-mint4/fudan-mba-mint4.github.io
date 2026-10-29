<template>
  <div class="treehole-page" ref="pageRef">
    <!-- 页面头部 -->
    <div class="treehole-header">
      <div class="treehole-title-row">
        <div>
          <h1 class="treehole-title">{{ t.title }}</h1>
          <p class="treehole-subtitle">{{ t.subtitle }}</p>
        </div>
        <button class="write-btn disabled" disabled :title="t.closeHint">
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

      <!-- 踩一踩（QQ空间早期风格） -->
      <div class="treehole-step">
        <button class="step-btn" :class="{ stepped: steppedToday }" :disabled="stepping || steppedToday" @click="doStep">
          <span class="step-icon">👣</span>
          <span>{{ steppedToday ? t.stepDone : t.stepBtn }}</span>
        </button>
        <span class="step-total" :title="t.stepTotalTitle">{{ stepsTotal }} {{ t.stepUnit }}</span>
        <span v-if="recentSteps.length" class="step-recent">{{ t.recentSteps }}<span class="step-names">{{ recentSteps.join('、') }}</span></span>
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
            <div class="privacy-icon login">🔐</div>
            <div class="privacy-text">
              <strong>{{ t.privacyLoginTitle }}</strong>
              <p>{{ t.privacyLoginDesc }}</p>
            </div>
          </div>
          <div class="privacy-row">
            <div class="privacy-icon anon">🕵️</div>
            <div class="privacy-text">
              <strong>{{ t.privacyAnonTitle }}</strong>
              <p>{{ t.privacyAnonDesc }}</p>
            </div>
          </div>
          <div class="privacy-row">
            <div class="privacy-icon real">👤</div>
            <div class="privacy-text">
              <strong>{{ t.privacyRealTitle }}</strong>
              <p>{{ t.privacyRealDesc }}</p>
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
        <button class="empty-action-btn" disabled :title="t.closeHint">{{ t.writeFirst }}</button>
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

          <!-- 评论区 -->
          <div class="comment-section">
            <div v-if="msg.commentTotal > 0" class="comment-list">
              <div v-for="c in msg.comments" :key="c.id" class="comment-item">
                <span class="comment-nick">{{ c.anonymous === 1 ? t.anonymous : (c.user_name || t.anonymous) }}</span>
                <span class="comment-text">{{ c.content }}</span>
                <button
                  v-if="canDeleteComment(c)"
                  class="comment-del"
                  title="删除评论"
                  @click="deleteComment(msg, c)"
                >✕</button>
              </div>
              <button v-if="msg.commentTotal > msg.comments.length" class="comment-more" @click="openCommentModal(msg)">
                {{ t.viewAllComments }}（{{ msg.commentTotal }}）
              </button>
            </div>
            <!-- 评论输入 -->
            <div v-if="isAuthenticated" class="comment-input-row">
              <input
                v-model="commentDrafts[msg.id].text"
                class="comment-input"
                :placeholder="t.commentPlaceholder"
                maxlength="200"
                @keyup.enter="submitComment(msg)"
              />
              <label class="comment-realname-toggle" :title="t.realnameShow">
                <input type="checkbox" v-model="commentDrafts[msg.id].realname" />
                <span>{{ commentDrafts[msg.id].realname ? (currentUser?.name || '👤') : '🕵️' }}</span>
              </label>
              <button class="comment-submit" :disabled="!commentDrafts[msg.id].text.trim()" @click="submitComment(msg)">{{ t.commentSubmit }}</button>
            </div>
            <button v-else class="comment-login" @click="goLogin">{{ t.needLoginTip }}</button>
          </div>
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
              <div class="form-anon-hint">{{ t.formAnonHint }}</div>
              <label v-if="isAuthenticated" class="realname-toggle">
                <input type="checkbox" v-model="form.realname" />
                <span>{{ t.realnameShow }}{{ form.realname && currentUser?.name ? '：' + currentUser.name : '' }}</span>
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

    <!-- 查看全部评论弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="commentModal" class="modal-overlay" @click.self="commentModal = null">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">{{ t.viewAllComments }}（{{ commentModal.msg.commentTotal || 0 }}）</h3>
              <button class="modal-close" @click="commentModal = null" aria-label="关闭">✕</button>
            </div>
            <div class="modal-body comment-modal-body">
              <div class="comment-modal-msg">
                <span class="comment-modal-nick">{{ commentModal.msg.nickname || t.anonymous }}</span>
                <p>{{ commentModal.msg.content }}</p>
              </div>
              <div v-if="commentLoading" class="loading-inline">
                <div class="spinner spinner-sm"></div>
                <span>{{ t.loading }}</span>
              </div>
              <div v-else-if="commentModalAll.length" class="comment-modal-list">
                <div v-for="c in commentModalAll" :key="c.id" class="comment-item">
                  <span class="comment-nick">{{ c.anonymous === 1 ? t.anonymous : (c.user_name || t.anonymous) }}</span>
                  <span class="comment-text">{{ c.content }}</span>
                  <button v-if="canDeleteComment(c)" class="comment-del" title="删除评论" @click="deleteCommentFromModal(c)">✕</button>
                </div>
              </div>
              <div v-else class="comment-empty">{{ t.commentEmpty }}</div>
            </div>
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

    <!-- 通用提示（踩一踩等） -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toastMsg" class="toast toast-info">
          <span>👣</span>
          {{ toastMsg }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useAuth } from '../composables/useAuth.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

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
    privacyLoginTitle: '需登录才能留言',
    privacyLoginDesc: '必须用班级账号登录后才能留言，防止非本班同学随意发言；未登录的同学只能浏览。',
    privacyAnonTitle: '匿名留言：身份不可反查',
    privacyAnonDesc: '选择匿名后，你的留言将以「匿名同学」展示；后台仅存有一串不可逆的匿名标识（哈希），管理员无法反查到你的身份。',
    privacyRealTitle: '实名留言：显示真名',
    privacyRealDesc: '选择实名后，留言将显示你的真实姓名，方便大家知道是谁在说话。',
    privacyLimitTitle: '频率限制',
    privacyLimitDesc: '同一IP/用户每分钟最多留言3条，防止刷屏和恶意灌水。',
    privacyModTitle: '内容管理',
    privacyModDesc: '管理员可删除违法、违规、辱骂等不当留言。请友善表达，共同维护树洞环境。',
    formTitle: '写下你的心声',
    formAnonHint: '默认以「匿名同学」发布；勾选下方选项则显示真名',
    realnameShow: '实名显示',
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
    needLogin: '请先登录',
    needLoginTip: '登录后才能留言',
    closeHint: '留言尚未开放，敬请期待',
    stepBtn: '踩一踩',
    stepDone: '今日已踩',
    stepUnit: '次来访',
    stepTotalTitle: '累计被踩次数',
    recentSteps: '最近踩过',
    stepSuccess: '踩一踩成功！',
    stepAlready: '今天已经踩过啦，明天再来吧',
    commentPlaceholder: '说点什么…',
    commentSubmit: '评论',
    viewAllComments: '查看全部评论',
    commentEmpty: '暂无评论，来抢沙发',
    commentOk: '评论成功',
    commentDeleted: '评论已删除',
    commentFail: '评论失败，请重试',
    commentDeleteFail: '删除失败',
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
    privacyLoginTitle: 'Login Required to Post',
    privacyLoginDesc: 'You must log in with your class account to post, so outsiders cannot leave messages. Browsing stays open to everyone.',
    privacyAnonTitle: 'Anonymous: Identity Not Traceable',
    privacyAnonDesc: 'Choose anonymous and your post shows as "Anonymous". Admins only see an irreversible anonymous hash—your identity cannot be traced back.',
    privacyRealTitle: 'Real Name: Shows Your Name',
    privacyRealDesc: 'Choose real name and your post will show your actual name, so everyone knows who is speaking.',
    privacyLimitTitle: 'Rate Limiting',
    privacyLimitDesc: 'Max 3 messages per minute per IP/user to prevent spam.',
    privacyModTitle: 'Content Moderation',
    privacyModDesc: 'Admins may remove illegal, abusive, or inappropriate posts. Please be kind.',
    formTitle: 'Write Your Thoughts',
    formAnonHint: 'Posted as "Anonymous" by default; tick the option below to show your real name',
    realnameShow: 'Show my real name',
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
    needLogin: 'Please log in',
    needLoginTip: 'Log in to post',
    closeHint: 'Posting is not open yet. Stay tuned!',
    stepBtn: 'Step In',
    stepDone: 'Stepped Today',
    stepUnit: 'visits',
    stepTotalTitle: 'Total steps received',
    recentSteps: 'Recently stepped by',
    stepSuccess: 'Stepped in!',
    stepAlready: 'You already stepped in today. Come back tomorrow!',
    commentPlaceholder: 'Say something…',
    commentSubmit: 'Comment',
    viewAllComments: 'View all comments',
    commentEmpty: 'No comments yet. Be the first!',
    commentOk: 'Comment posted!',
    commentDeleted: 'Comment deleted',
    commentFail: 'Failed to post. Try again.',
    commentDeleteFail: 'Failed to delete',
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
    privacyLoginTitle: 'ต้องเข้าสู่ระบบเพื่อโพสต์',
    privacyLoginDesc: 'ต้องเข้าสู่ระบบด้วยบัญชีห้องเรียนก่อนโพสต์ เพื่อป้องกันคนนอกห้องโพสต์ ผู้ที่ยังไม่เข้าสู่ระบบดูได้อย่างเดียว',
    privacyAnonTitle: 'โพสต์นิรนาม: ย้อนรอยตัวตนไม่ได้',
    privacyAnonDesc: 'เมื่อเลือกนิรนาม โพสต์จะแสดงเป็น "นักเรียนนิรนาม" ผู้ดูแลเห็นเพียงแฮชนิรนามที่ไม่สามารถย้อนกลับได้—ไม่สามารถระบุตัวตนคุณได้',
    privacyRealTitle: 'โพสต์ใส่ชื่อจริง: แสดงชื่อจริง',
    privacyRealDesc: 'เมื่อเลือกใส่ชื่อจริง โพสต์จะแสดงชื่อจริงของคุณ เพื่อให้ทุกคนรู้ว่าใครเป็นคนโพสต์',
    privacyLimitTitle: 'จำกัดความถี่',
    privacyLimitDesc: 'สูงสุด 3 ข้อความต่อนาทีต่อ IP/ผู้ใช้ เพื่อป้องกันสแปม',
    privacyModTitle: 'การดูแลเนื้อหา',
    privacyModDesc: 'ผู้ดูแลสามารถลบโพสต์ที่ผิดกฎหมาย หยาบคาย หรือไม่เหมาะสมได้ กรุณาแสดงความเห็นอย่างมีมารยาท',
    formTitle: 'เขียนสิ่งที่อยากพูด',
    formAnonHint: 'โพสต์เป็น "นักเรียนนิรนาม" โดยค่าเริ่มต้น; เลือกช่องด้านล่างเพื่อแสดงชื่อจริง',
    realnameShow: 'แสดงชื่อจริง',
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
    needLogin: 'กรุณาเข้าสู่ระบบ',
    needLoginTip: 'ต้องเข้าสู่ระบบเพื่อโพสต์',
    closeHint: 'ยังไม่เปิดให้โพสต์ โปรดรอติดตาม!',
    stepBtn: 'ก้าวเข้ามา',
    stepDone: 'ก้าวแล้ววันนี้',
    stepUnit: 'ครั้ง',
    stepTotalTitle: 'จำนวนครั้งที่ถูกก้าว',
    recentSteps: 'ผู้ก้าวล่าสุด',
    stepSuccess: 'ก้าวเข้ามาสำเร็จ!',
    stepAlready: 'ก้าวแล้ววันนี้ กลับมาพรุ่งนี้ใหม่นะ!',
    commentPlaceholder: 'แสดงความคิดเห็น…',
    commentSubmit: 'แสดงความเห็น',
    viewAllComments: 'ดูความคิดเห็นทั้งหมด',
    commentEmpty: 'ยังไม่มีความคิดเห็น เป็นคนแรกเลย!',
    commentOk: 'แสดงความเห็นสำเร็จ!',
    commentDeleted: 'ลบความคิดเห็นแล้ว',
    commentFail: 'ส่งไม่สำเร็จ ลองอีกครั้ง',
    commentDeleteFail: 'ลบไม่สำเร็จ',
  },
}

const { t, lang } = useLang(i18n)

const API_BASE = '/api/treehole'
const isMock = import.meta.env.DEV
const { currentUser, isAuthenticated, getToken } = useAuth()

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
    nickname: body.realname ? 'mock-user' : '匿名',
    anonymous: body.realname ? 0 : 1,
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
function mockStep() {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: '踩一踩成功', stepped: true, stepsTotal: 1, recentSteps: ['mock-user'] }),
  })
}
function mockPostComment(messageId, text, realname) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      message: '评论成功',
      data: { id: 'mock-c-' + Date.now(), message_id: messageId, user_id: realname ? 'mock-user' : null, user_name: realname ? 'mock-user' : null, anonymous: realname ? 0 : 1, content: text, created_at: new Date().toISOString() },
    }),
  })
}
function mockGetComments(messageId) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
}
function mockDeleteComment() {
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: '评论已删除', ok: true }) })
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

// 踩一踩状态
const stepsTotal = ref(0)
const recentSteps = ref([])
const steppedToday = ref(false)
const stepping = ref(false)

// 评论区状态
const commentDrafts = reactive({})
const commentModal = ref(null)
const commentModalAll = ref([])
const commentLoading = ref(false)
const commenting = ref(false)
function ensureDraft(id) {
  if (!commentDrafts[id]) commentDrafts[id] = { text: '', realname: false }
  return commentDrafts[id]
}
function canDeleteComment(c) {
  if (!currentUser.value) return false
  if (currentUser.value.role) return true // 班委可删任何评论
  return !!c.user_id && c.user_id === currentUser.value.id // 实名评论者本人
}
async function submitComment(msg) {
  const draft = ensureDraft(msg.id)
  const text = draft.text.trim()
  if (!text || commenting.value) return
  commenting.value = true
  try {
    const res = isMock
      ? await mockPostComment(msg.id, text, draft.realname)
      : await fetchWithRetry(`${API_BASE}/${msg.id}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify({ content: text, realname: draft.realname }),
        })
    const data = await res.json()
    if (res.ok) {
      const newComment = { ...data.data, anonymous: (data.data.anonymous != null) ? data.data.anonymous : (draft.realname ? 0 : 1) }
      if (!msg.comments) msg.comments = []
      msg.comments.push(newComment)
      if (msg.comments.length > 3) msg.comments.shift()
      msg.commentTotal = (msg.commentTotal || 0) + 1
      draft.text = ''
      showToast(t.value.commentOk)
    } else if (res.status === 401) {
      goLogin()
    } else {
      showToast(data.error || t.value.commentFail)
    }
  } catch (e) {
    showToast(t.value.commentFail)
  } finally {
    commenting.value = false
  }
}
async function deleteComment(msg, c) {
  const res = isMock
    ? await mockDeleteComment()
    : await fetchWithRetry(`${API_BASE}/${msg.id}/comment?commentId=${c.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      })
  if (res.ok) {
    msg.comments = (msg.comments || []).filter(x => x.id !== c.id)
    msg.commentTotal = Math.max(0, (msg.commentTotal || 0) - 1)
    commentModalAll.value = commentModalAll.value.filter(x => x.id !== c.id)
    showToast(t.value.commentDeleted)
  } else {
    const data = await res.json().catch(() => ({}))
    showToast(data.error || t.value.commentDeleteFail)
  }
}
async function deleteCommentFromModal(c) {
  const msg = commentModal.value?.msg
  if (!msg) return
  await deleteComment(msg, c)
  if (commentModal.value && commentModal.value.msg.commentTotal === 0) {
    commentModal.value = null
  }
}
async function openCommentModal(msg) {
  commentModal.value = { msg }
  commentModalAll.value = []
  commentLoading.value = true
  try {
    const res = isMock
      ? await mockGetComments(msg.id)
      : await fetchWithRetry(`${API_BASE}/${msg.id}/comments`)
    const data = await res.json()
    commentModalAll.value = data.data || []
  } catch (e) {
    commentModalAll.value = []
  } finally {
    commentLoading.value = false
  }
}

// 表单
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const form = ref({ realname: false, content: '' })
const showSuccess = ref(false)
const textareaRef = ref(null)

// 通用 toast（踩一踩等）
const toastMsg = ref('')
let toastTimer = null
function showToast(msg) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2500)
}

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
      : await fetchWithRetry(`${API_BASE}?page=1&limit=20`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    messages.value = data.data || []
    ;(data.data || []).forEach(m => ensureDraft(m.id))
    hasMore.value = data.pagination?.page < data.pagination?.totalPages
    stats.value = data.stats || { total: 0, todayCount: 0 }
    if (data.stats) {
      stepsTotal.value = data.stats.stepsTotal || 0
      recentSteps.value = data.stats.recentSteps || []
    }
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
      : await fetchWithRetry(`${API_BASE}?page=${nextPage}&limit=20`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    messages.value = [...messages.value, ...(data.data || [])]
    ;(data.data || []).forEach(m => ensureDraft(m.id))
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

function goLogin() {
  // 全站登录/注册页为 /auth/（含三语镜像），非 /login/
  window.location.href = lang.value === 'zh' ? '/auth/' : `/${lang.value}/auth/`
}

function onWriteClick() {
  if (!isAuthenticated.value) {
    goLogin()
    return
  }
  openForm()
}

async function doStep() {
  if (!isAuthenticated.value) {
    goLogin()
    return
  }
  if (stepping.value || steppedToday.value) return
  stepping.value = true
  try {
    const res = isMock
      ? await mockStep()
      : await fetchWithRetry(`${API_BASE}/step`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        })
    const data = await res.json()
    if (res.ok) {
      steppedToday.value = true
      stepsTotal.value = (data.stepsTotal != null) ? data.stepsTotal : stepsTotal.value + 1
      if (Array.isArray(data.recentSteps)) recentSteps.value = data.recentSteps
      showToast(t.value.stepSuccess)
    } else if (res.status === 409) {
      steppedToday.value = true
      showToast(data.error || t.value.stepAlready)
    } else if (res.status === 401) {
      goLogin()
    } else {
      showToast(data.error || t.value.stepAlready)
    }
  } catch (e) {
    showToast(t.value.stepAlready)
  } finally {
    stepping.value = false
  }
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
      content: form.value.content.trim(),
      realname: form.value.realname,
    }
    const res = isMock
      ? await mockPostMessage(body)
      : await fetchWithRetry(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify(body),
        })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 401) {
        closeForm()
        goLogin()
        return
      }
      if (res.status === 429) {
        throw new Error(data.error || '提交太频繁，请稍后再试')
      }
      throw new Error(data.error || data.errors?.join('、') || '提交失败')
    }
    // 提交成功
    const newMsg = data.data
    newMessageId.value = newMsg.id
    newMsg.comments = []
    newMsg.commentTotal = 0
    ensureDraft(newMsg.id)
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

/* 踩一踩 */
.treehole-step {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 8px 16px;
  background: var(--c-bg-secondary);
  border-radius: 12px;
  width: fit-content;
  flex-wrap: wrap;
}
.step-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s ease;
}
.step-btn:hover:not(:disabled) { opacity: 0.85; }
.step-btn:active:not(:disabled) { transform: scale(0.97); }
.step-btn.stepped {
  background: var(--c-bg-card);
  color: var(--c-text-tertiary);
  border: 1px solid var(--c-border);
  cursor: default;
}
.step-icon { font-size: 14px; }
.step-total { font-size: 13px; font-weight: 700; color: var(--c-accent); }
.step-recent { font-size: 12px; color: var(--c-text-secondary); }
.step-names { color: var(--c-text-primary); font-weight: 500; }

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
.privacy-icon.real { background: rgba(0, 122, 255, 0.12); }
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

/* 评论区 */
.comment-section {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--c-border);
}
.comment-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.comment-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.comment-nick {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--c-accent);
  font-size: 12px;
}
.comment-text { color: var(--c-text-primary); word-break: break-word; }
.comment-del {
  flex-shrink: 0;
  margin-left: auto;
  border: none;
  background: none;
  color: var(--c-text-tertiary);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}
.comment-del:hover { color: #ff3b30; background: rgba(255,59,48,0.08); }
.comment-more {
  align-self: flex-start;
  border: none;
  background: none;
  color: var(--c-accent);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
  margin-top: 2px;
}
.comment-more:hover { text-decoration: underline; }
.comment-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.comment-input {
  flex: 1;
  min-width: 0;
  padding: 7px 12px;
  font-size: 13px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--c-bg-card);
  color: var(--c-text-primary);
  outline: none;
  transition: border-color 0.2s ease;
}
.comment-input:focus { border-color: var(--c-accent); }
.comment-realname-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--c-text-secondary);
  flex-shrink: 0;
}
.comment-realname-toggle input { display: none; }
.comment-realname-toggle span {
  padding: 4px 8px;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: var(--c-bg-secondary);
  white-space: nowrap;
}
.comment-submit {
  flex-shrink: 0;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: var(--c-accent);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.comment-submit:disabled { opacity: 0.4; cursor: default; }
.comment-login {
  border: none;
  background: none;
  color: var(--c-accent);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
}
.comment-login:hover { text-decoration: underline; }
/* 查看全部评论弹窗 */
.comment-modal-body { max-height: 60vh; overflow-y: auto; }
.comment-modal-msg {
  padding: 10px 12px;
  margin-bottom: 12px;
  background: var(--c-bg-secondary);
  border-radius: 8px;
}
.comment-modal-nick { font-size: 12px; font-weight: 600; color: var(--c-accent); }
.comment-modal-msg p { margin: 6px 0 0; font-size: 13px; line-height: 1.5; color: var(--c-text-primary); }
.comment-modal-list { display: flex; flex-direction: column; gap: 8px; }
.comment-empty { text-align: center; color: var(--c-text-tertiary); font-size: 13px; padding: 20px 0; }

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
.form-anon-hint {
  margin: -6px 0 14px;
  font-size: 12px;
  color: var(--c-text-tertiary);
  line-height: 1.5;
}
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
.toast-info {
  background: var(--c-bg-card);
  color: var(--c-text-primary);
  border: 1px solid var(--c-border);
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
