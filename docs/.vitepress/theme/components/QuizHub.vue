<template>
  <div class="quiz-hub">
    <div class="quiz-hero">
      <a :href="homePath" class="back-btn">&#8592; {{ t.back }}</a>
      <div class="quiz-hero-inner">
        <h1 class="quiz-title">{{ t.title }}</h1>
        <p class="quiz-subtitle">{{ totalCount }} {{ t.questions }} · {{ t.subtitle }}</p>
        <div class="quiz-search">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="searchQuery" type="text" :placeholder="t.searchPlaceholder" class="search-input" />
          <button v-if="searchQuery" class="search-clear" @click="clearSearch" :aria-label="t.clear">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="search-hint">{{ t.searchHint }}</div>
      </div>
    </div>
    <div class="quiz-container">
      <aside class="quiz-sidebar">
        <h3 class="sidebar-title">{{ t.categories }}</h3>
        <ul class="cat-list">
          <li class="cat-item" :class="{ active: activeCat === 'all' }" @click="activeCat = 'all'">
            <span>{{ t.all }}</span><span class="cat-count">{{ questions.length }}</span>
          </li>
          <li v-for="cat in categories" :key="cat" class="cat-item" :class="{ active: activeCat === cat }" @click="activeCat = cat">
            <span>{{ cat }}</span><span class="cat-count">{{ getCatCount(cat) }}</span>
          </li>
        </ul>
      </aside>
      <main class="quiz-main">
        <div class="quiz-section-header">
          <h2 class="section-title">{{ activeCat === 'all' ? t.all : activeCat }}</h2>
          <span class="result-count">{{ filteredQuestions.length }} {{ t.results }}</span>
        </div>
        <div v-if="filteredQuestions.length > 0" class="question-list">
          <div v-for="(q, index) in filteredQuestions" :key="q.id" class="q-card" :class="q.type">
            <div class="q-header">
              <span class="q-number">{{ String(index + 1).padStart(3, '0') }}</span>
              <span class="q-type-tag" :class="q.type">{{ getTypeName(q.type) }}</span>
            </div>
            <p class="q-text">{{ q.question }}</p>
            <div v-if="q.options && q.options.length > 0" class="q-options">
              <div v-for="(opt, i) in q.options" :key="i" class="q-option">
                <span class="opt-letter">{{ String.fromCharCode(65 + i) }}</span>
                <span class="opt-text">{{ opt }}</span>
              </div>
            </div>
            <div class="q-answer">
              <div class="ans-label">{{ t.answer }}</div>
              <div class="ans-content">
                <div v-for="(line, i) in (q.answerLines && q.answerLines.length ? q.answerLines : [q.answerDisplay || q.answer])" :key="i" class="ans-line">{{ line }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="quiz-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <p class="empty-text">{{ t.noResults }}</p>
        </div>
      </main>
    </div>
    <div class="quiz-footer"><span>{{ t.footer }}</span></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLang } from '../composables/useLang'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

const searchQuery = ref('')
const activeCat = ref('all')
const questions = ref([])

const i18n = {
  zh: { title: 'FDU 入学教育测试知识库', subtitle: '实时搜索 · 答案直接展示', questions: '道题目', searchPlaceholder: '输入关键词搜索，多个词用空格分隔（如：学籍 休学）...', searchHint: '支持多词模糊搜索 · 按 / 快速聚焦 · 按 Esc 清空', categories: '题目分类', all: '全部题目', results: '条结果', answer: '参考答案', noResults: '没有找到匹配的题目', back: '返回班级主页', clear: '清除', footer: 'FDU 入学教育测试知识库 · 薄荷4班整理', types: { single_choice: '单选题', multiple_choice: '多选题', true_false: '判断题', fill_blank: '填空题' } },
  en: { title: 'FDU Entry Exam Knowledge Base', subtitle: 'Live search · Answers shown directly', questions: 'questions', searchPlaceholder: 'Search keywords, separate with spaces...', searchHint: 'Multi-word fuzzy search · Press / to focus · Esc to clear', categories: 'Categories', all: 'All Questions', results: 'results', answer: 'Answer', noResults: 'No matching questions found', back: 'Back to Home', clear: 'Clear', footer: 'FDU Entry Exam Knowledge Base · Compiled by Mint 4', types: { single_choice: 'Single Choice', multiple_choice: 'Multiple Choice', true_false: 'True/False', fill_blank: 'Fill in Blank' } },
  th: { title: 'คลังข้อสอบเข้า FDU', subtitle: 'ค้นหาแบบเรียลไทม์ · แสดงคำตอบเลย', questions: 'ข้อ', searchPlaceholder: 'พิมพ์คำค้นหา คั่นด้วยช่องว่าง...', searchHint: 'ค้นหาหลายคำ · กด / เพื่อโฟกัส · Esc เพื่อล้าง', categories: 'หมวดหมู่', all: 'ทั้งหมด', results: 'ผลลัพธ์', answer: 'คำตอบ', noResults: 'ไม่พบข้อความที่ตรงกัน', back: 'กลับหน้าแรก', clear: 'ล้าง', footer: 'คลังข้อสอบเข้า FDU · จัดทำโดย Mint 4', types: { single_choice: 'เลือกตอบเดียว', multiple_choice: 'เลือกหลายข้อ', true_false: 'ถูก/ผิด', fill_blank: 'เติมคำ' } },
}

const { lang, t } = useLang(i18n)

const homePath = computed(() => lang.value === 'en' ? '/en/' : lang.value === 'th' ? '/th/' : '/')

onMounted(async () => {
  try {
    const res = await fetchWithRetry('/data/quiz-questions.json')
    questions.value = await res.json() || []
  } catch (e) {
    console.error('Failed to load quiz data:', e)
    questions.value = []
  }
})
const categories = computed(() => {
  const cats = []
  const seen = new Set()
  for (const q of questions.value) { if (!seen.has(q.category)) { seen.add(q.category); cats.push(q.category) } }
  return cats
})
const totalCount = computed(() => questions.value.length)
const filteredQuestions = computed(() => {
  let result = questions.value
  if (activeCat.value !== 'all') result = result.filter(q => q.category === activeCat.value)
  if (searchQuery.value.trim()) {
    const keywords = searchQuery.value.trim().toLowerCase().split(/\s+/)
    result = result.filter(q => {
      const text = (q.question + ' ' + (q.answerDisplay || q.answer) + ' ' + (q.options || []).join(' ')).toLowerCase()
      return keywords.every(kw => text.includes(kw))
    })
  }
  return result
})
function getCatCount(cat) { return questions.value.filter(q => q.category === cat).length }
function getTypeName(type) { return t.value.types[type] || type }
function clearSearch() { searchQuery.value = '' }
</script>

<style scoped>
.quiz-hub { min-height: 100vh; background: var(--c-bg-secondary); display: flex; flex-direction: column; }
.quiz-hero { background: linear-gradient(135deg, #1F5A4F 0%, #2D7A6C 30%, #3D9A85 60%, #5EC4AC 85%, #7AD1BC 100%); color: #fff; padding: 44px 32px 36px; text-align: center; position: relative; overflow: hidden; }
.quiz-hero::before { content: ''; position: absolute; top: -50%; left: -10%; width: 120%; height: 200%; background: radial-gradient(circle at 25% 40%, rgba(255,255,255,.07) 0%, transparent 45%), radial-gradient(circle at 75% 60%, rgba(168,224,209,.08) 0%, transparent 40%); pointer-events: none; }
.back-btn { position: absolute; top: 20px; left: 24px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.2); border-radius: 10px; color: #fff; font-size: 13px; font-weight: 600; text-decoration: none; transition: all .25s cubic-bezier(.4,0,.2,1); z-index: 10; }
.back-btn:hover { background: rgba(255,255,255,.25); }
.quiz-hero-inner { max-width: 640px; margin: 0 auto; position: relative; z-index: 2; }
.quiz-title { font-size: 28px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.5px; text-shadow: 0 2px 8px rgba(0,0,0,.12); }
.quiz-subtitle { font-size: 14px; color: rgba(255,255,255,.85); margin: 0 0 24px; }
.quiz-search { position: relative; }
.search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); opacity: 0.5; }
.search-input { width: 100%; padding: 14px 44px 14px 48px; border: 2px solid transparent; border-radius: 14px; font-size: 15px; background: rgba(255,255,255,.97); color: #1D1D1F; outline: none; transition: all .3s cubic-bezier(.4,0,.2,1); box-shadow: 0 4px 18px rgba(0,0,0,.14); }
.search-input:focus { border-color: #5EC4AC; box-shadow: 0 0 0 4px rgba(94,196,172,.35), 0 8px 28px rgba(0,0,0,.18); }
.search-clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border: none; border-radius: 50%; background: rgba(0,0,0,.1); color: #5A5A5E; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s; }
.search-clear:hover { background: rgba(0,0,0,.2); }
.search-hint { margin-top: 10px; font-size: 12px; color: rgba(255,255,255,.7); }
.quiz-container { display: flex; max-width: 1200px; margin: 0 auto; padding: 24px 32px 48px; gap: 28px; flex: 1; }
.quiz-sidebar { width: 240px; flex-shrink: 0; position: sticky; top: 80px; align-self: flex-start; }
.sidebar-title { font-size: 11px; font-weight: 700; color: var(--c-text-tertiary); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 14px; padding-left: 10px; }
.cat-list { list-style: none; margin: 0; padding: 0; }
.cat-item { display: flex; justify-content: space-between; align-items: center; padding: 11px 14px; border-radius: 10px; cursor: pointer; font-size: 14px; color: var(--c-text-secondary); margin-bottom: 3px; transition: all .2s cubic-bezier(.4,0,.2,1); font-weight: 500; }
.cat-item:hover { background: var(--c-bg-card); color: var(--c-text-primary); }
.cat-item.active { background: linear-gradient(135deg, var(--c-accent-dark) 0%, var(--c-accent) 100%); color: #fff; font-weight: 600; box-shadow: 0 4px 14px var(--c-accent-glow); }
.cat-count { font-size: 11px; padding: 2px 9px; border-radius: 10px; background: rgba(0,0,0,.06); font-weight: 700; }
.cat-item.active .cat-count { background: rgba(255,255,255,.25); }
.quiz-main { flex: 1; min-width: 0; }
.quiz-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 20px; font-weight: 800; color: var(--c-text-primary); margin: 0; }
.result-count { font-size: 13px; color: var(--c-text-tertiary); }
.question-list { display: flex; flex-direction: column; gap: 12px; }
.q-card { background: var(--c-bg-card); border-radius: 16px; padding: 20px 24px; border-left: 5px solid #E5E5EA; transition: all .25s cubic-bezier(.4,0,.2,1); animation: fadeInUp .4s ease both; }
.q-card:hover { box-shadow: 0 8px 28px var(--c-accent-glow); transform: translateY(-2px); }
.q-card.single_choice { border-left-color: var(--c-accent); }
.q-card.multiple_choice { border-left-color: var(--c-orange); }
.q-card.true_false { border-left-color: var(--c-blue); }
.q-card.fill_blank { border-left-color: var(--c-purple); }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.q-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.q-number { font-size: 12px; color: var(--c-text-tertiary); font-weight: 700; font-variant-numeric: tabular-nums; }
.q-type-tag { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 8px; }
.q-type-tag.single_choice { background: var(--c-accent-light); color: var(--c-accent); }
.q-type-tag.multiple_choice { background: var(--c-orange-light); color: var(--c-orange); }
.q-type-tag.true_false { background: var(--c-blue-light); color: var(--c-blue); }
.q-type-tag.fill_blank { background: rgba(175,82,222,.1); color: var(--c-purple); }
.q-text { font-size: 15px; font-weight: 600; color: var(--c-text-primary); line-height: 1.7; margin: 0 0 12px; }
.q-options { margin: 0 0 12px 8px; }
.q-option { display: flex; gap: 8px; padding: 6px 10px; border-radius: 8px; font-size: 14px; color: var(--c-text-secondary); line-height: 1.6; transition: all .2s; }
.q-option:hover { background: var(--c-accent-light); color: var(--c-text-primary); }
.opt-letter { font-weight: 700; color: var(--c-text-tertiary); min-width: 20px; }
.q-answer { margin-top: 14px; padding: 14px 18px; background: linear-gradient(135deg, var(--c-accent-light) 0%, var(--c-accent-glow) 100%); border-radius: 12px; border-left: 4px solid var(--c-accent); }
.ans-label { font-size: 11px; font-weight: 800; color: var(--c-accent); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1.5px; }
.ans-line { font-size: 15px; color: var(--c-text-primary); font-weight: 700; line-height: 1.7; padding: 2px 0; }
.quiz-empty { text-align: center; padding: 60px 20px; color: var(--c-text-tertiary); }
.quiz-empty svg { opacity: 0.4; margin-bottom: 12px; }
.empty-text { font-size: 15px; margin: 0; }
.quiz-footer { text-align: center; padding: 24px; color: var(--c-text-tertiary); font-size: 12px; border-top: 1px solid var(--c-border); background: var(--c-bg-card); }
@media (max-width: 900px) {
  .quiz-hero { padding: 28px 18px 24px; }
  .quiz-title { font-size: 22px; }
  .back-btn { top: 12px; left: 12px; padding: 6px 12px; font-size: 12px; }
  .quiz-container { flex-direction: column; padding: 18px 14px; }
  .quiz-sidebar { width: 100%; position: static; }
  .cat-list { display: flex; flex-wrap: wrap; gap: 5px; }
  .cat-item { margin-bottom: 0; padding: 7px 12px; font-size: 12px; }
  .q-text { font-size: 14px; }
  .q-option { font-size: 13px; }
}
</style>
