<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

// 顶部 Tab 定义：图标为内联 SVG 线框
const tabs = [
  {
    name: '首页',
    path: '/',
    icon: 'home',
  },
  {
    name: '课表',
    path: '/schedule',
    icon: 'calendar',
  },
  {
    name: '公告',
    path: '/announcements/',
    icon: 'bell',
  },
]

// “更多”菜单展开项
const moreItems = [
  { name: '知识库', path: '/knowledge/' },
  { name: '课件下载', path: '/slides/' },
]

const moreOpen = ref(false)

// 判断当前路由是否命中某个 Tab（支持子路径）
const isActive = (path) => {
  const current = page.value.path || '/'
  if (path === '/') return current === '/' || current === '/index.html'
  return current === path || current.startsWith(path)
}

const currentPath = computed(() => page.value.path || '/')

// 点击空白处关闭“更多”菜单
const onDocClick = (e) => {
  if (!moreOpen.value) return
  if (e.target.closest('.m-tabbar-more')) return
  moreOpen.value = false
}

// 切换页面后自动收起“更多”菜单
watch(currentPath, () => {
  moreOpen.value = false
})

onMounted(() => {
  document.addEventListener('click', onDocClick)
  // 为 body 预留底部安全距离，防止内容被 Tab Bar 遮挡
  document.body.style.paddingBottom = '56px'
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.body.style.paddingBottom = ''
})

const toggleMore = () => {
  moreOpen.value = !moreOpen.value
}
</script>

<template>
  <nav class="m-tabbar" aria-label="移动端导航">
    <!-- 固定三 Tab -->
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
      <span class="m-tabbar-label">{{ tab.name }}</span>
    </a>

    <!-- 更多按钮（带弹层） -->
    <div class="m-tabbar-more">
      <button
        class="m-tabbar-item"
        :class="{ active: moreOpen }"
        aria-label="更多"
        @click.stop="toggleMore"
      >
        <svg class="m-tabbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
        <span class="m-tabbar-label">更多</span>
      </button>

      <!-- 简易弹层菜单 -->
      <transition name="more-pop">
        <div v-if="moreOpen" class="m-tabbar-menu">
          <a
            v-for="item in moreItems"
            :key="item.name"
            :href="item.path"
            class="m-tabbar-menu-item"
            :class="{ active: isActive(item.path) }"
          >
            <svg class="m-tabbar-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ item.name }}</span>
          </a>
        </div>
      </transition>
    </div>
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

/* 更多按钮容器（相对定位以承载弹层） */
.m-tabbar-more {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.m-tabbar-more .m-tabbar-item {
  width: 100%;
}

/* 弹层菜单 */
.m-tabbar-menu {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  min-width: 140px;
  padding: 6px;
  background: var(--c-bg-glass-strong);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 0.5px solid var(--c-separator);
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  z-index: 1001;
}

.m-tabbar-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--c-text-secondary);
  text-decoration: none;
  transition: background 200ms ease-in-out, color 200ms ease-in-out;
}

.m-tabbar-menu-item:active,
.m-tabbar-menu-item.active {
  background: var(--c-accent-light);
  color: var(--c-accent);
}

.m-tabbar-menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* 弹层出现/消失过渡 */
.more-pop-enter-active,
.more-pop-leave-active {
  transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
}

.more-pop-enter-from,
.more-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>
