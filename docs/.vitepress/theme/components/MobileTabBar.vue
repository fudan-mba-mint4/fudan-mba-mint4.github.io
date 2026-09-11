<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

/* ========== 语言检测 ========== */
const currentLang = ref('zh')

onMounted(() => {
  const path = window.location.pathname
  if (path.startsWith('/en/')) currentLang.value = 'en'
  else if (path.startsWith('/th/')) currentLang.value = 'th'
  else currentLang.value = 'zh'
})

const langPrefix = computed(() => {
  if (currentLang.value === 'en') return '/en'
  if (currentLang.value === 'th') return '/th'
  return ''
})

/* ========== 多语言文案 ========== */
const i18n = {
  zh: {
    home: '首页',
    schedule: '课表',
    announcements: '公告',
    slides: '课件',
  },
  en: {
    home: 'Home',
    schedule: 'Schedule',
    announcements: 'Announcements',
    slides: 'Slides',
  },
  th: {
    home: 'หน้าแรก',
    schedule: 'ตารางเรียน',
    announcements: 'ประกาศ',
    slides: 'ไฟล์บรรยาย',
  },
}

const t = computed(() => i18n[currentLang.value])

// 底部 4 个固定 Tab：首页 / 课表 / 公告 / 课件
const tabs = computed(() => [
  { name: t.value.home, path: `${langPrefix.value}/`, icon: 'home' },
  { name: t.value.schedule, path: `${langPrefix.value}/schedule`, icon: 'calendar' },
  { name: t.value.announcements, path: `${langPrefix.value}/announcements/`, icon: 'bell' },
  { name: t.value.slides, path: `${langPrefix.value}/slides/`, icon: 'file' },
])

// 去除语言前缀，用于路由匹配
const stripLangPrefix = (p) => p.replace(/^\/(en|th)(?=\/|$)/, '') || '/'

// 判断当前路由是否命中某个 Tab（支持子路径）
const isActive = (path) => {
  const current = page.value.path || '/'
  const p = stripLangPrefix(path)
  const c = stripLangPrefix(current)
  if (p === '/') return c === '/' || c === '/index.html'
  return c === p || c.startsWith(p)
}

onMounted(() => {
  // 为 body 预留底部安全距离，防止内容被 Tab Bar 遮挡
  document.body.style.paddingBottom = '56px'
})

onUnmounted(() => {
  document.body.style.paddingBottom = ''
})
</script>

<template>
  <nav class="m-tabbar" aria-label="移动端导航">
    <a
      v-for="tab in tabs"
      :key="tab.name"
      :href="tab.path"
      class="m-tabbar-item"
      :class="{ active: isActive(tab.path) }"
    >
      <!-- 首页图标 -->
      <svg v-if="tab.icon === 'home'" class="m-tabbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
      </svg>
      <!-- 课表图标 -->
      <svg v-else-if="tab.icon === 'calendar'" class="m-tabbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
        <line x1="3" y1="9.5" x2="21" y2="9.5" />
        <line x1="8" y1="2.5" x2="8" y2="6" />
        <line x1="16" y1="2.5" x2="16" y2="6" />
      </svg>
      <!-- 公告图标 -->
      <svg v-else-if="tab.icon === 'bell'" class="m-tabbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
      <!-- 课件图标 -->
      <svg v-else-if="tab.icon === 'file'" class="m-tabbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
      <span class="m-tabbar-label">{{ tab.name }}</span>
    </a>
  </nav>
</template>

<style scoped>
.m-tabbar {
  /* 默认隐藏于桌面端 */
  display: none;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  height: 56px;
  align-items: stretch;
  justify-content: space-around;
  /* 毛玻璃材质 */
  background: var(--c-bg-glass);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  /* 顶部 0.5px 分割线 */
  border-top: 0.5px solid var(--c-separator);
  /* 安全区域适配 */
  padding-bottom: env(safe-area-inset-bottom);
}

/* 仅手机端显示 */
@media (max-width: 768px) {
  .m-tabbar {
    display: flex;
  }
}

.m-tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--c-text-tertiary);
  text-decoration: none;
  font-family: inherit;
  transition: color 200ms ease-in-out;
}

.m-tabbar-item.active {
  color: var(--c-accent);
}

.m-tabbar-icon {
  width: 20px;
  height: 20px;
}

.m-tabbar-label {
  font-size: 10px;
  line-height: 1;
}
</style>
