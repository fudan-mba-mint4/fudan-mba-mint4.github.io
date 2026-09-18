<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vitepress'
import { useLang } from '../composables/useLang.js'
import { useAuth } from '../composables/useAuth.js'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

const router = useRouter()

const { lang, t } = useLang({
  zh: {
    title: '班级投票',
    subtitle: '班级大小事，大家一起决定',
    loginToVote: '登录后投票',
    anonymous: '匿名投票',
    realname: '实名投票',
    single: '单选',
    multiple: '多选',
    deadline: '截止时间',
    ended: '已结束',
    daysLeft: '剩余',
    days: '天',
    hours: '小时',
    submit: '提交投票',
    voted: '已投票',
    totalVotes: '总票数',
    creatorOnly: '仅发起人可见结果',
    afterDeadline: '截止后公布结果',
    afterVote: '投票后可见结果',
    always: '实时可见结果',
    noPolls: '暂无投票',
    yourVote: '你的选择',
    votes: '票',
    percent: '%',
  },
  en: {
    title: 'Class Polls',
    subtitle: 'Decide together, big or small',
    loginToVote: 'Login to vote',
    anonymous: 'Anonymous',
    realname: 'Real-name',
    single: 'Single choice',
    multiple: 'Multiple choice',
    deadline: 'Deadline',
    ended: 'Ended',
    daysLeft: 'Time left',
    days: 'd',
    hours: 'h',
    submit: 'Submit',
    voted: 'Voted',
    totalVotes: 'Total votes',
    creatorOnly: 'Results visible to creator only',
    afterDeadline: 'Results after deadline',
    afterVote: 'Results after voting',
    always: 'Live results',
    noPolls: 'No polls yet',
    yourVote: 'Your choice',
    votes: 'votes',
    percent: '%',
  },
  th: {
    title: 'โหวตชั้นเรียน',
    subtitle: 'ตัดสินใจด้วยกัน ไม่ว่าจะเรื่องใหญ่หรือเล็ก',
    loginToVote: 'เข้าสู่ระบบเพื่อโหวต',
    anonymous: 'โหวตไม่เปิดเผย',
    realname: 'โหวตเปิดเผย',
    single: 'เลือกได้ 1 ข้อ',
    multiple: 'เลือกได้หลายข้อ',
    deadline: 'เวลาปิดโหวต',
    ended: 'ปิดโหวตแล้ว',
    daysLeft: 'เวลาที่เหลือ',
    days: 'วัน',
    hours: 'ชม.',
    submit: 'ส่งโหวต',
    voted: 'โหวตแล้ว',
    totalVotes: 'จำนวนโหวตทั้งหมด',
    creatorOnly: 'ผลโหวตเห็นได้เฉพาะผู้สร้าง',
    afterDeadline: 'ประกาศผลหลังปิดโหวต',
    afterVote: 'เห็นผลหลังโหวต',
    always: 'เห็นผลเรียลไทม์',
    noPolls: 'ยังไม่มีโหวต',
    yourVote: 'ทางเลือกของคุณ',
    votes: 'คะแนน',
    percent: '%',
  },
})

const { isAuthenticated, currentUser } = useAuth()

const API_PREFIX = import.meta.env.DEV ? 'https://fudan-mba-mint4.vercel.app' : ''

const polls = ref([])
const loading = ref(true)
const expandedId = ref(null)
const selectedOptions = ref({}) // pollId -> [optionId]
const userVotes = ref({}) // pollId -> [optionId]
const submitting = ref(false)

const MOCK_VOTES_KEY = 'mint4_poll_votes'

onMounted(async () => {
  if (typeof window === 'undefined') { loading.value = false; return }
  loadUserVotes()
  try {
    // 投票内容/选项：数据库优先（/api/polls-admin，期望 {polls:[...]}），
    // 仅当 DB 成功且 polls 非空才用 DB，否则回退静态 /data/polls.json。
    let data = null
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 6000)
      const res = await fetchWithRetry('/api/polls-admin', { signal: ctrl.signal })
      clearTimeout(timer)
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json?.polls) && json.polls.length > 0) data = json
      }
    } catch (e) {
      /* DB 不可达/超时，静默回退 */
    }
    if (!data) {
      const res = await fetchWithRetry('/data/polls.json')
      data = await res.json()
    }
    polls.value = data.polls || []
    // 从API加载真实票数
    await loadVoteCounts()
  } catch (e) {
    console.error('加载投票失败:', e)
  } finally {
    loading.value = false
  }
})

async function loadVoteCounts() {
  try {
    const userId = currentUser.value?.username || null
    for (const poll of polls.value) {
      const res = await fetchWithRetry(`${API_PREFIX}/api/polls/${poll.id}${userId ? `?user_id=${encodeURIComponent(userId)}` : ''}`)
      if (res.ok) {
        const result = await res.json()
        const votes = result.data?.votes || {}
        poll.options.forEach(opt => { opt.votes = votes[opt.id] || 0 })
        if (result.data?.userVoted?.length) {
          userVotes.value[poll.id] = result.data.userVoted
        }
      }
    }
  } catch (e) {
    console.warn('加载票数失败，使用本地数据:', e.message)
  }
}

function loadUserVotes() {
  try {
    userVotes.value = JSON.parse(localStorage.getItem(MOCK_VOTES_KEY) || '{}')
  } catch { userVotes.value = {} }
}
function saveUserVotes() {
  localStorage.setItem(MOCK_VOTES_KEY, JSON.stringify(userVotes.value))
}

function isEnded(poll) {
  return new Date(poll.deadline) < new Date()
}

function timeLeft(poll) {
  const diff = new Date(poll.deadline) - new Date()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  return { days, hours }
}

function totalVotes(poll) {
  return poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)
}

function hasVoted(pollId) {
  return !!userVotes.value[pollId]
}

function canSeeResults(poll) {
  if (poll.visibility === 'creator_only') {
    return currentUser.value?.username === poll.creator
  }
  if (poll.visibility === 'after_deadline') {
    return isEnded(poll)
  }
  if (poll.visibility === 'after_vote') {
    return hasVoted(poll.id) || isEnded(poll)
  }
  return true // always
}

function toggleExpand(pollId) {
  expandedId.value = expandedId.value === pollId ? null : pollId
  if (expandedId.value === pollId && !selectedOptions.value[pollId]) {
    selectedOptions.value[pollId] = []
  }
}

function toggleOption(pollId, optionId, type) {
  if (!selectedOptions.value[pollId]) selectedOptions.value[pollId] = []
  const idx = selectedOptions.value[pollId].indexOf(optionId)
  if (type === 'single') {
    selectedOptions.value[pollId] = [optionId]
  } else {
    if (idx > -1) selectedOptions.value[pollId].splice(idx, 1)
    else selectedOptions.value[pollId].push(optionId)
  }
}

function goToAuth() {
  router.go('/auth/')
}

async function submitVote(poll) {
  if (!isAuthenticated.value || !selectedOptions.value[poll.id]?.length) return
  submitting.value = true
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        optionIds: selectedOptions.value[poll.id],
        userId: currentUser.value.username,
        anonymous: poll.anonymous,
      }),
    })
    if (res.ok) {
      const result = await res.json()
      const votes = result.data?.votes || {}
      poll.options.forEach(opt => { opt.votes = votes[opt.id] || 0 })
      userVotes.value[poll.id] = result.data?.userVoted || [...selectedOptions.value[poll.id]]
      saveUserVotes()
    } else if (res.status === 409) {
      alert('您已投过票了')
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || '投票失败，请重试')
    }
  } catch (e) {
    console.error('投票失败:', e)
    // 降级到本地mock
    poll.options.forEach(opt => {
      if (selectedOptions.value[poll.id].includes(opt.id)) {
        opt.votes = (opt.votes || 0) + 1
      }
    })
    userVotes.value[poll.id] = [...selectedOptions.value[poll.id]]
    saveUserVotes()
  }
  submitting.value = false
}

function visibilityLabel(poll) {
  const map = { always: t.always, after_vote: t.afterVote, after_deadline: t.afterDeadline, creator_only: t.creatorOnly }
  return map[poll.visibility] || poll.visibility
}

function formatDeadline(iso) {
  const d = new Date(iso)
  return d.toLocaleString(lang.value === 'zh' ? 'zh-CN' : lang.value === 'th' ? 'th-TH' : 'en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div class="polls-page">
    <div class="polls-hero">
      <h1>{{ t.title }}</h1>
      <p>{{ t.subtitle }}</p>
    </div>

    <div v-if="loading" class="polls-loading">加载中...</div>
    <div v-else-if="!polls.length" class="polls-empty">{{ t.noPolls }}</div>

    <div class="polls-list">
      <div v-for="poll in polls" :key="poll.id" class="poll-card" :class="{ expanded: expandedId === poll.id }">
        <!-- 卡片头 -->
        <div class="poll-head" @click="toggleExpand(poll.id)">
          <div class="poll-head-main">
            <h3 class="poll-title">{{ poll.title[lang] }}</h3>
            <div class="poll-tags">
              <span class="poll-tag" :class="{ anon: poll.anonymous }">
                {{ poll.anonymous ? t.anonymous : t.realname }}
              </span>
              <span class="poll-tag">{{ poll.type === 'single' ? t.single : t.multiple }}</span>
              <span class="poll-tag tag-visibility">{{ visibilityLabel(poll) }}</span>
            </div>
          </div>
          <div class="poll-head-side">
            <div v-if="isEnded(poll)" class="poll-ended">{{ t.ended }}</div>
            <div v-else class="poll-countdown">
              <span class="countdown-num">{{ timeLeft(poll)?.days || 0 }}</span><span class="countdown-unit">{{ t.days }}</span>
              <span class="countdown-num">{{ timeLeft(poll)?.hours || 0 }}</span><span class="countdown-unit">{{ t.hours }}</span>
            </div>
            <div class="poll-deadline">{{ t.deadline }}: {{ formatDeadline(poll.deadline) }}</div>
          </div>
        </div>

        <!-- 展开详情 -->
        <transition name="poll-expand">
          <div v-if="expandedId === poll.id" class="poll-detail">
            <p class="poll-desc">{{ poll.description[lang] }}</p>

            <!-- 选项列表 -->
            <div class="poll-options">
              <div
                v-for="opt in poll.options"
                :key="opt.id"
                class="poll-option"
                :class="{
                  selected: selectedOptions[poll.id]?.includes(opt.id),
                  voted: userVotes[poll.id]?.includes(opt.id),
                  disabled: hasVoted(poll.id) || isEnded(poll),
                }"
                @click="!hasVoted(poll.id) && !isEnded(poll) && isAuthenticated && toggleOption(poll.id, opt.id, poll.type)"
              >
                <div class="option-radio">
                  <span v-if="selectedOptions[poll.id]?.includes(opt.id) || userVotes[poll.id]?.includes(opt.id)" class="radio-dot"></span>
                </div>
                <div class="option-content">
                  <span class="option-text">{{ opt.text[lang] }}</span>
                  <div v-if="canSeeResults(poll)" class="option-result">
                    <div class="result-bar"><div class="result-fill" :style="{ width: (totalVotes(poll) ? (opt.votes / totalVotes(poll) * 100) : 0) + '%' }"></div></div>
                    <span class="result-count">{{ opt.votes }} {{ t.votes }} ({{ totalVotes(poll) ? Math.round(opt.votes / totalVotes(poll) * 100) : 0 }}{{ t.percent }})</span>
                  </div>
                </div>
                <img v-if="opt.image" :src="opt.image" class="option-image" />
              </div>
            </div>

            <!-- 底部操作区 -->
            <div class="poll-footer">
              <div class="poll-total" v-if="canSeeResults(poll)">{{ t.totalVotes }}: {{ totalVotes(poll) }}</div>
              <div class="poll-total" v-else-if="poll.visibility === 'creator_only'">{{ t.creatorOnly }}</div>
              <div class="poll-total" v-else-if="poll.visibility === 'after_deadline' && !isEnded(poll)">{{ t.afterDeadline }}</div>

              <div v-if="!isAuthenticated" class="poll-login-hint">
                <button class="poll-login-btn" @click.stop="goToAuth">{{ t.loginToVote }}</button>
              </div>
              <div v-else-if="hasVoted(poll.id)" class="poll-voted-badge">✓ {{ t.voted }}</div>
              <div v-else-if="!isEnded(poll)" class="poll-submit-area">
                <button
                  class="poll-submit-btn"
                  :disabled="!selectedOptions[poll.id]?.length || submitting"
                  @click.stop="submitVote(poll)"
                >
                  {{ submitting ? '...' : t.submit }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.polls-page { max-width: 800px; margin: 0 auto; padding: 32px 20px 60px; }
.polls-hero { text-align: center; margin-bottom: 32px; }
.polls-hero h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px; color: var(--c-text-primary); }
.polls-hero p { font-size: 15px; color: var(--c-text-secondary); margin: 0; }

.polls-loading, .polls-empty { text-align: center; padding: 60px 0; color: var(--c-text-tertiary); font-size: 15px; }

.polls-list { display: flex; flex-direction: column; gap: 16px; }

.poll-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.poll-card.expanded { border-color: var(--c-accent-light); }

.poll-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  cursor: pointer;
}
.poll-head:hover { background: var(--c-bg-secondary); }
.poll-head-main { flex: 1; min-width: 0; }
.poll-title { font-size: 17px; font-weight: 600; margin: 0 0 10px; color: var(--c-text-primary); line-height: 1.4; }
.poll-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.poll-tag {
  font-size: 11px; font-weight: 600; padding: 3px 10px;
  border-radius: 20px; background: var(--c-bg-secondary);
  color: var(--c-text-secondary); border: 1px solid var(--c-border);
  white-space: nowrap;
}
.poll-tag.anon { color: var(--c-accent); border-color: var(--c-accent-light); background: var(--c-accent-light); }
.poll-tag.tag-visibility { color: var(--c-text-tertiary); }

.poll-head-side { flex-shrink: 0; text-align: right; min-width: 120px; }
.poll-ended {
  display: inline-block; font-size: 12px; font-weight: 600;
  color: var(--c-text-tertiary); background: var(--c-bg-elevated);
  padding: 4px 12px; border-radius: 20px; margin-bottom: 6px;
}
.poll-countdown { display: flex; align-items: baseline; gap: 2px; justify-content: flex-end; margin-bottom: 4px; }
.countdown-num { font-size: 20px; font-weight: 700; color: var(--c-accent); font-variant-numeric: tabular-nums; }
.countdown-unit { font-size: 11px; color: var(--c-text-tertiary); margin-right: 6px; }
.poll-deadline { font-size: 11px; color: var(--c-text-tertiary); }

.poll-detail { padding: 0 20px 20px; border-top: 1px solid var(--c-border-light); }
.poll-desc { font-size: 14px; color: var(--c-text-secondary); margin: 16px 0; line-height: 1.6; }

.poll-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.poll-option {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border: 1.5px solid var(--c-border);
  border-radius: 12px; cursor: pointer; transition: all 0.2s;
  background: var(--c-bg-secondary);
}
.poll-option:hover:not(.disabled) { border-color: var(--c-accent); }
.poll-option.selected { border-color: var(--c-accent); background: var(--c-accent-light); }
.poll-option.voted { border-color: #34c759; background: rgba(52,199,89,0.06); }
.poll-option.disabled { cursor: default; }

.option-radio {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--c-border); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.poll-option.selected .option-radio, .poll-option.voted .option-radio { border-color: var(--c-accent); }
.poll-option.voted .option-radio { border-color: #34c759; }
.radio-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c-accent); }
.poll-option.voted .radio-dot { background: #34c759; }

.option-content { flex: 1; min-width: 0; }
.option-text { font-size: 14px; font-weight: 500; color: var(--c-text-primary); display: block; margin-bottom: 6px; }
.option-result { display: flex; align-items: center; gap: 10px; }
.result-bar { flex: 1; height: 5px; background: var(--c-bg-elevated); border-radius: 3px; overflow: hidden; }
.result-fill { height: 100%; background: var(--c-accent); border-radius: 3px; transition: width 0.5s ease; }
.poll-option.voted .result-fill { background: #34c759; }
.result-count { font-size: 11px; color: var(--c-text-tertiary); white-space: nowrap; font-variant-numeric: tabular-nums; }

.option-image { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }

.poll-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding-top: 16px; border-top: 1px solid var(--c-border-light);
}
.poll-total { font-size: 13px; color: var(--c-text-tertiary); }
.poll-login-btn, .poll-submit-btn {
  padding: 9px 24px; background: var(--c-accent); color: #fff;
  border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: opacity 0.2s;
}
.poll-login-btn:hover, .poll-submit-btn:hover:not(:disabled) { opacity: 0.9; }
.poll-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.poll-voted-badge {
  font-size: 13px; font-weight: 600; color: #34c759;
  background: rgba(52,199,89,0.1); padding: 6px 16px; border-radius: 10px;
}

.poll-expand-enter-active, .poll-expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.poll-expand-enter-from, .poll-expand-leave-to { opacity: 0; max-height: 0; }
.poll-expand-enter-to, .poll-expand-leave-from { opacity: 1; max-height: 1000px; }

@media (max-width: 640px) {
  .polls-page { padding: 20px 16px 40px; }
  .polls-hero h1 { font-size: 22px; }
  .poll-head { flex-direction: column; }
  .poll-head-side { text-align: left; min-width: 0; }
  .poll-countdown { justify-content: flex-start; }
}
</style>
