<script setup>
import { computed } from 'vue'
import { useLang } from '../composables/useLang.js'

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    eyebrow: '核心功能',
    title: '一站式学习平台',
    subtitle: '从课表到课件，从公告到知识，所有学习需求一站满足',
    features: [
      { icon: 'calendar', title: '课表查询', description: '实时同步的课程安排，时间、教室、教师一目了然。', link: '/schedule' },
      { icon: 'bell', title: '公告通知', description: '班级通知、学校公告、作业截止日期，重要信息不再错过。', link: '/announcements/' },
      { icon: 'book', title: '知识沉淀', description: '课程笔记、重点总结、考题参考，智库共同维护。', link: '/knowledge/' },
      { icon: 'download', title: '课件下载', description: '按课程分类的课件，随时复习，云端多端访问。', link: '/slides/' },
    ],
  },
  en: {
    eyebrow: 'Core Features',
    title: 'One-Stop Learning Platform',
    subtitle: 'Schedule, announcements, knowledge and materials — all in one place',
    features: [
      { icon: 'calendar', title: 'Schedule', description: 'Real-time class arrangements with time, room and teacher at a glance.', link: '/schedule' },
      { icon: 'bell', title: 'Announcements', description: 'Class notices, school announcements and homework deadlines, never miss.', link: '/announcements/' },
      { icon: 'book', title: 'Knowledge', description: 'Course notes, key summaries and past exams, co-maintained.', link: '/knowledge/' },
      { icon: 'download', title: 'Materials', description: 'Slides organized by course, review anytime from any device.', link: '/slides/' },
    ],
  },
  th: {
    eyebrow: 'ฟีเจอร์หลัก',
    title: 'แพลตฟอร์มการเรียนครบวงจร',
    subtitle: 'ตารางเรียน ประกาศ คลังความรู้ และสื่อการสอนในที่เดียว',
    features: [
      { icon: 'calendar', title: 'ตารางเรียน', description: 'ตารางเรียนแบบเรียลไทม์ เวลา ห้อง และอาจารย์ครบถ้วน', link: '/schedule' },
      { icon: 'bell', title: 'ประกาศ', description: 'ประกาศชั้นเรียน ประกาศโรงเรียน และกำหนดส่งการบ้าน', link: '/announcements/' },
      { icon: 'book', title: 'คลังความรู้', description: 'โน้ต สรุปสำคัญ และข้อสอบเก่า ร่วมกันดูแล', link: '/knowledge/' },
      { icon: 'download', title: 'ดาวน์โหลดสื่อ', description: 'สื่อการสอนแยกตามรายวัน ทบทวนได้ทุกที่', link: '/slides/' },
    ],
  },
}
const { lang, t } = useLang(i18n)

const langPrefix = lang.value === 'en' ? '/en' : lang.value === 'th' ? '/th' : ''

const features = computed(() =>
  t.value.features.map((f, i) => ({
    ...f,
    href: `${langPrefix}${f.link}`,
    delay: i + 1,
  }))
)
</script>

<template>
  <section class="features section section-alt">
    <div class="container">
      <!-- 区块标题 -->
      <div class="section-header center reveal">
        <span class="eyebrow">{{ t.eyebrow }}</span>
        <h2>{{ t.title }}</h2>
        <p>{{ t.subtitle }}</p>
      </div>

      <!-- 功能网格 -->
      <div class="feature-grid">
        <a
          v-for="feature in features"
          :key="feature.title"
          :href="feature.href"
          class="feature-card reveal"
          :class="`reveal-delay-${feature.delay}`"
        >
          <div class="card-icon">
            <!-- 课表：日历 -->
            <svg v-if="feature.icon === 'calendar'" class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
              <line x1="3" y1="9.5" x2="21" y2="9.5" />
              <line x1="8" y1="2.5" x2="8" y2="6" />
              <line x1="16" y1="2.5" x2="16" y2="6" />
            </svg>
            <!-- 公告：铃铛 -->
            <svg v-else-if="feature.icon === 'bell'" class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
            <!-- 知识：书本 -->
            <svg v-else-if="feature.icon === 'book'" class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
              <line x1="4" y1="20.5" x2="20" y2="20.5" />
              <line x1="9" y1="7.5" x2="15" y2="7.5" />
            </svg>
            <!-- 课件：下载 -->
            <svg v-else class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v11" />
              <path d="M7 10l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ feature.title }}</h3>
            <p class="card-desc">{{ feature.description }}</p>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  background: var(--c-bg-secondary);
}

/* 桌面 4 列 · 平板 2 列 · 手机 1 列 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  max-width: var(--container-max);
  margin: 0 auto;
}

.feature-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  background: var(--c-bg-card);
  border-radius: var(--radius-xl);
  border: 0.5px solid var(--c-separator);
  text-decoration: none;
  transition: border-color var(--transition-base), background var(--transition-base);
}

/* hover 仅改边框色，不平移 */
.feature-card:hover {
  border-color: var(--c-border);
}

.feature-card:active {
  background: var(--c-bg-secondary);
}

/* 图标容器：44×44 · 圆角12 · 浅薄荷底 */
.card-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-accent-light);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-5);
  color: var(--c-accent);
}

.icon-svg {
  width: 24px;
  height: 24px;
}

.card-content {
  flex: 1;
}

/* 标题 17px semibold · 描述 14px tertiary */
.card-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: var(--space-2);
  letter-spacing: var(--letter-spacing-tight);
}

.card-desc {
  font-size: 14px;
  color: var(--c-text-tertiary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

/* 平板：2 列 */
@media (max-width: 900px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 手机：1 列 */
@media (max-width: 640px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
