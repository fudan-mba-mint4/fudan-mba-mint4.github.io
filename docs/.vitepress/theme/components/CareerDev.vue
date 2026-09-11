<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLang, formatDate } from '../composables/useLang.js'

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    title: '💼 职业发展',
    subtitle: '班级职业资源中心',
    students: '位同学',
    industries: '个行业',
    referrals: '条内推',
    industryTitle: '行业分布',
    industrySub: '薄荷4班同学职业版图',
    referralTitle: '内推机会板',
    referralSub: '本班同学发布的内推岗位',
    resourceTitle: '职业资源书签墙',
    resourceSub: '简历 · 面试 · 报告 · 政策',
    eventTitle: '职业分享会',
    eventSub: '班级举办或参与的职业主题活动',
    open: '开放中',
    closed: '已截止',
    deadline: '截止',
    referrerLabel: '内推人',
    contactLabel: '联系',
    categories: {
      resume: { zh: '简历模板', en: 'Resume', th: 'เรซูเม่' },
      interview: { zh: '面试经验', en: 'Interview', th: 'สัมภาษณ์' },
      report: { zh: '行业报告', en: 'Report', th: 'รายงาน' },
      policy: { zh: '就业政策', en: 'Policy', th: 'นโยบาย' },
    },
    viewResource: '查看',
    eventsEmpty: '暂无职业分享会活动，后续发布后将展示在这里。',
    noData: '数据加载中…',
  },
  en: {
    title: '💼 Career Development',
    subtitle: 'Class Career Resource Center',
    students: 'students',
    industries: 'industries',
    referrals: 'referrals',
    industryTitle: 'Industry Distribution',
    industrySub: 'Career map of Mint Class 4',
    referralTitle: 'Referral Board',
    referralSub: 'Open roles referred by classmates',
    resourceTitle: 'Resource Wall',
    resourceSub: 'Resume · Interview · Reports · Policy',
    eventTitle: 'Career Talks',
    eventSub: 'Career-themed events hosted by the class',
    open: 'Open',
    closed: 'Closed',
    deadline: 'by',
    referrerLabel: 'Referred by',
    contactLabel: 'Contact',
    categories: {
      resume: { zh: '简历模板', en: 'Resume', th: 'เรซูเม่' },
      interview: { zh: '面试经验', en: 'Interview', th: 'สัมภาษณ์' },
      report: { zh: '行业报告', en: 'Report', th: 'รายงาน' },
      policy: { zh: '就业政策', en: 'Policy', th: 'นโยบาย' },
    },
    viewResource: 'View',
    eventsEmpty: 'No career talks yet — they will appear here once published.',
    noData: 'Loading…',
  },
  th: {
    title: '💼 การพัฒนาอาชีพ',
    subtitle: 'ศูนย์รวมทรัพยากรอาชีพประจำชั้น',
    students: 'คน',
    industries: 'อุตสาหกรรม',
    referrals: 'การแนะนำงาน',
    industryTitle: 'การกระจายตามอุตสาหกรรม',
    industrySub: 'แผนที่สายอาชีพของชั้นมินต์ 4',
    referralTitle: 'กระดานแนะนำงาน',
    referralSub: 'ตำแหน่งที่เปิดรับจากการแนะนำของเพื่อนร่วมชั้น',
    resourceTitle: 'ผนังบุ๊กมาร์กทรัพยากรอาชีพ',
    resourceSub: 'เรซูเม่ · สัมภาษณ์ · รายงาน · นโยบาย',
    eventTitle: 'เสวนาอาชีพ',
    eventSub: 'กิจกรรมธีมอาชีพที่ชั้นเรียนจัดหรือเข้าร่วม',
    open: 'เปิดรับ',
    closed: 'ปิดรับ',
    deadline: 'ถึง',
    referrerLabel: 'ผู้แนะนำ',
    contactLabel: 'ติดต่อ',
    categories: {
      resume: { zh: '简历模板', en: 'Resume', th: 'เรซูเม่' },
      interview: { zh: '面试经验', en: 'Interview', th: 'สัมภาษณ์' },
      report: { zh: '行业报告', en: 'Report', th: 'รายงาน' },
      policy: { zh: '就业政策', en: 'Policy', th: 'นโยบาย' },
    },
    viewResource: 'ดู',
    eventsEmpty: 'ยังไม่มีงานเสวนาอาชีพ จะแสดงที่นี่เมื่อเผยแพร่แล้ว',
    noData: 'กำลังโหลด…',
  },
}
const { lang, t } = useLang(i18n)

/* ========== 数据 ========== */
const stats = ref({ totalStudents: 0, industries: 0, referrals: 0 })
const industries = ref([])
const referrals = ref([])
const resources = ref([])
const careerEvents = ref([])
const loading = ref(true)

const totalCount = computed(() => industries.value.reduce((s, i) => s + i.count, 0))

/* ========== SVG 环形图计算 ========== */
const R = 80
const C = 2 * Math.PI * R
const ringSegments = computed(() => {
  let offset = 0
  return industries.value.map((ind) => {
    const frac = totalCount.value ? ind.count / totalCount.value : 0
    const len = frac * C
    const seg = { ...ind, frac, dash: `${Math.max(len - 2, 0)} ${C - len + 2}`, offset: -offset }
    offset += len
    return seg
  })
})

const percent = (count) => totalCount.value ? Math.round(count / totalCount.value * 100) : 0

/* ========== 分类标签本地名 ========== */
const catLabel = (key) => {
  const c = t.value.categories[key]
  return c ? c[lang.value] : key
}

onMounted(async () => {
  try {
    const [cdRes, actRes] = await Promise.all([
      fetch('/data/career-data.json'),
      fetch('/data/activities.json').catch(() => null),
    ])
    const cd = await cdRes.json()
    stats.value = cd.stats || { totalStudents: 0, industries: 0, referrals: 0 }
    industries.value = cd.industries || []
    referrals.value = cd.referrals || []
    resources.value = cd.resources || []
    if (actRes) {
      const act = await actRes.json()
      careerEvents.value = (act.activities || []).filter(a => a.tags && a.tags.type === 'career')
    }
  } catch (e) {
    console.warn('career data load failed', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="career-page">
    <!-- 模块A：页面头部 -->
    <header class="career-hero">
      <h1 class="hero-title">{{ t.title }}</h1>
      <p class="hero-sub">{{ t.subtitle }}</p>
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-num">{{ stats.totalStudents }}</span>
          <span class="stat-label">{{ t.students }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-num">{{ stats.industries }}</span>
          <span class="stat-label">{{ t.industries }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-num">{{ stats.referrals }}</span>
          <span class="stat-label">{{ t.referrals }}</span>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading">{{ t.noData }}</div>
    <template v-else>
      <!-- 模块B：行业分布环图 -->
      <section class="block">
        <h2 class="block-title">{{ t.industryTitle }}</h2>
        <p class="block-sub">{{ t.industrySub }}</p>
        <div class="ring-wrap">
          <div class="ring-chart">
            <svg viewBox="0 0 200 200" class="ring-svg">
              <circle cx="100" cy="100" :r="R" fill="none" stroke="var(--c-border-light)" stroke-width="22" />
              <circle
                v-for="seg in ringSegments"
                :key="seg.key"
                cx="100" cy="100" :r="R" fill="none"
                :stroke="seg.color"
                stroke-width="22"
                :stroke-dasharray="seg.dash"
                :stroke-dashoffset="seg.offset"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div class="ring-center">
              <span class="ring-total">{{ totalCount }}</span>
              <span class="ring-total-label">{{ t.students }}</span>
            </div>
          </div>
          <ul class="ring-legend">
            <li v-for="seg in ringSegments" :key="seg.key" class="legend-item">
              <span class="legend-dot" :style="{ background: seg.color }"></span>
              <span class="legend-name">{{ seg.name[lang] || seg.name.zh }}</span>
              <span class="legend-count">{{ seg.count }}</span>
              <span class="legend-pct">{{ percent(seg.count) }}%</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- 模块C：内推机会板 -->
      <section class="block">
        <h2 class="block-title">{{ t.referralTitle }}</h2>
        <p class="block-sub">{{ t.referralSub }}</p>
        <div class="referral-grid">
          <article v-for="ref in referrals" :key="ref.id" class="referral-card">
            <div class="ref-top">
              <span class="ref-company">{{ ref.company[lang] || ref.company.zh }}</span>
              <span class="ref-badge" :class="ref.status">{{ ref.status === 'open' ? t.open : t.closed }}</span>
            </div>
            <h3 class="ref-role">{{ ref.role[lang] || ref.role.zh }}</h3>
            <div class="ref-meta">
              <span>{{ t.referrerLabel }} · {{ ref.referrer }}</span>
              <span>{{ t.deadline }} {{ ref.expires }}</span>
            </div>
            <a class="ref-contact" :href="'mailto:' + ref.contact">{{ ref.contact }}</a>
          </article>
        </div>
      </section>

      <!-- 模块D：职业资源书签墙 -->
      <section class="block">
        <h2 class="block-title">{{ t.resourceTitle }}</h2>
        <p class="block-sub">{{ t.resourceSub }}</p>
        <div class="resource-grid">
          <a
            v-for="res in resources"
            :key="res.id"
            class="resource-card"
            :href="res.url"
            target="_blank"
            rel="noopener"
          >
            <span class="resource-cat">{{ catLabel(res.category) }}</span>
            <h3 class="resource-title">{{ res.title[lang] || res.title.zh }}</h3>
            <p class="resource-desc">{{ res.desc[lang] || res.desc.zh }}</p>
            <span class="resource-cta">{{ t.viewResource }} →</span>
          </a>
        </div>
      </section>

      <!-- 模块E：职业分享会 -->
      <section class="block">
        <h2 class="block-title">{{ t.eventTitle }}</h2>
        <p class="block-sub">{{ t.eventSub }}</p>
        <div v-if="careerEvents.length" class="event-row">
          <article v-for="ev in careerEvents" :key="ev.id" class="event-card">
            <span class="event-date">{{ formatDate(ev.date) }}</span>
            <h3 class="event-title">{{ ev.title[lang] || ev.title.zh }}</h3>
            <p class="event-location">{{ ev.location[lang] || ev.location.zh }}</p>
            <p class="event-organizer">{{ ev.organizer[lang] || ev.organizer.zh }}</p>
          </article>
        </div>
        <div v-else class="events-empty">
          <span class="events-empty-icon">🗓️</span>
          <p>{{ t.eventsEmpty }}</p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.career-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* ========== 模块A Hero ========== */
.career-hero {
  padding: 40px 0 32px;
  text-align: center;
}
.hero-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--letter-spacing-tight);
  color: var(--c-text-primary);
  margin: 0 0 8px;
}
.hero-sub {
  font-size: var(--text-base);
  color: var(--c-text-tertiary);
  margin: 0 0 28px;
}
.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-num {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--c-accent);
  letter-spacing: var(--letter-spacing-tight);
}
.stat-label {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
}
.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--c-separator);
}

/* ========== 通用区块 ========== */
.block {
  margin-top: 48px;
}
.block-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  margin: 0 0 4px;
  letter-spacing: var(--letter-spacing-tight);
}
.block-sub {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
  margin: 0 0 20px;
}
.loading {
  text-align: center;
  color: var(--c-text-tertiary);
  padding: 60px 0;
}

/* ========== 模块B 环图 ========== */
.ring-wrap {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 24px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-2xl);
}
.ring-chart {
  position: relative;
  width: 220px;
  height: 220px;
  flex-shrink: 0;
}
.ring-svg {
  width: 100%;
  height: 100%;
}
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.ring-total {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--c-text-primary);
  letter-spacing: var(--letter-spacing-tight);
  line-height: 1;
}
.ring-total-label {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  margin-top: 4px;
}
.ring-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-name {
  color: var(--c-text-secondary);
  flex: 1;
}
.legend-count {
  color: var(--c-text-primary);
  font-weight: var(--font-semibold);
}
.legend-pct {
  color: var(--c-text-tertiary);
  font-size: var(--text-xs);
  min-width: 40px;
  text-align: right;
}

/* ========== 模块C 内推板 ========== */
.referral-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.referral-card {
  padding: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  transition: border-color var(--transition-base), transform var(--transition-base);
}
.referral-card:hover {
  border-color: var(--c-border-accent);
  transform: translateY(-2px);
}
.ref-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.ref-company {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--c-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ref-badge {
  font-size: 11px;
  font-weight: var(--font-semibold);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}
.ref-badge.open {
  background: var(--c-accent-light);
  color: var(--c-accent);
}
.ref-badge.closed {
  background: var(--c-bg-secondary);
  color: var(--c-text-tertiary);
}
.ref-role {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  margin: 0 0 12px;
  line-height: var(--line-height-tight);
}
.ref-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  margin-bottom: 12px;
}
.ref-contact {
  font-size: var(--text-sm);
  color: var(--c-accent);
  text-decoration: none;
  word-break: break-all;
}
.ref-contact:hover {
  text-decoration: underline;
}

/* ========== 模块D 资源墙 ========== */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.resource-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: border-color var(--transition-base), transform var(--transition-base);
}
.resource-card:hover {
  border-color: var(--c-accent);
  transform: translateY(-2px);
}
.resource-cat {
  align-self: flex-start;
  font-size: 11px;
  font-weight: var(--font-semibold);
  color: var(--c-accent);
  background: var(--c-accent-light);
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
}
.resource-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  margin: 0 0 6px;
  line-height: var(--line-height-tight);
}
.resource-desc {
  font-size: var(--text-sm);
  color: var(--c-text-tertiary);
  margin: 0 0 16px;
  flex: 1;
  line-height: var(--line-height-normal);
}
.resource-cta {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--c-accent);
}

/* ========== 模块E 分享会 ========== */
.event-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}
.event-row::-webkit-scrollbar { display: none; }
.event-card {
  flex: 0 0 260px;
  padding: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-xl);
}
.event-date {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--c-accent);
}
.event-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
  margin: 8px 0 6px;
}
.event-location,
.event-organizer {
  font-size: var(--text-xs);
  color: var(--c-text-tertiary);
  margin: 0;
}
.events-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--c-text-tertiary);
  background: var(--c-bg-card);
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-xl);
}
.events-empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}
.events-empty p {
  margin: 0;
  font-size: var(--text-sm);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .resource-grid { grid-template-columns: repeat(2, 1fr); }
  .ring-wrap {
    flex-direction: column;
    gap: 24px;
  }
  .ring-legend { width: 100%; }
}

@media (max-width: 640px) {
  .career-page { padding: 0 16px 80px; }
  .hero-title { font-size: var(--text-3xl); }
  .hero-stats { gap: 16px; }
  .ring-chart { width: 180px; height: 180px; }
  .ring-legend { grid-template-columns: repeat(2, 1fr); }
  .referral-grid { grid-template-columns: 1fr; }
  .resource-grid { grid-template-columns: 1fr; }
}
</style>
