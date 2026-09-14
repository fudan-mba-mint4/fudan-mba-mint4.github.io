<template>
  <div class="user-nav-menu">
    <span class="nav-sep">|</span>
    <!-- 未登录 -->
    <button v-if="!isAuthenticated" class="login-btn" @click="goToAuth">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span>登录</span>
    </button>

    <!-- 已登录 -->
    <div v-else class="user-menu-wrap" @click.stop>
      <button class="user-trigger" @click="toggleMenu" :class="{ open: menuOpen }">
        <div class="user-avatar-sm">{{ avatarText }}</div>
        <span class="user-name-sm">{{ currentUser?.name }}</span>
        <svg class="dropdown-arrow" :class="{ rotated: menuOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <!-- 下拉菜单 -->
      <Transition name="dropdown">
        <div v-if="menuOpen" class="user-dropdown">
          <div class="dropdown-header">
            <div class="dropdown-avatar">{{ avatarText }}</div>
            <div class="dropdown-info">
              <div class="dropdown-name">{{ currentUser?.name }}</div>
              <div class="dropdown-email">@{{ currentUser?.username }}</div>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="goToProfile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            个人中心
          </button>
          <button class="dropdown-item" @click="goToMySignups">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            我的报名
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item logout" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            退出登录
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vitepress'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { currentUser, isAuthenticated, logout } = useAuth()

const menuOpen = ref(false)

const avatarText = computed(() => {
  return currentUser.value?.name?.charAt(0) || '?'
})

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function goToAuth() {
  router.go('/auth/')
}

function goToProfile() {
  closeMenu()
  router.go('/profile/')
}

function goToMySignups() {
  closeMenu()
  router.go('/profile/')
}

function handleLogout() {
  closeMenu()
  logout()
  router.go('/')
}

// 点击外部关闭菜单
function handleClickOutside(e) {
  if (!e.target.closest('.user-nav-menu')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-nav-menu {
  display: flex;
  align-items: center;
}
.user-nav-menu::before {
  margin-right: 8px;
  margin-left: 8px;
  width: 1px;
  height: 24px;
  background-color: var(--vp-c-divider);
  content: "";
}
.nav-sep { display: none; }

/* 登录按钮 */
.login-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.login-btn:hover { opacity: 0.9; }

/* 用户触发器 */
.user-menu-wrap {
  position: relative;
}
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.user-trigger:hover {
  background: var(--c-bg-secondary);
  border-color: var(--c-border);
}
.user-trigger.open {
  background: var(--c-bg-secondary);
  border-color: var(--c-border);
}
.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-accent), #1a5c50);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
.user-name-sm {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-primary);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-arrow {
  color: var(--c-text-tertiary);
  transition: transform 0.2s;
}
.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
  backdrop-filter: blur(20px);
}
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}
.dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-accent), #1a5c50);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  flex-shrink: 0;
}
.dropdown-info {
  flex: 1;
  min-width: 0;
}
.dropdown-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text-primary);
}
.dropdown-email {
  font-size: 12px;
  color: var(--c-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-divider {
  height: 1px;
  background: var(--c-border);
  margin: 4px 0;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text-primary);
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}
.dropdown-item:hover {
  background: var(--c-bg-secondary);
}
.dropdown-item svg {
  color: var(--c-text-secondary);
  flex-shrink: 0;
}
.dropdown-item.logout {
  color: #ff3b30;
}
.dropdown-item.logout svg {
  color: #ff3b30;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.18s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 移动端隐藏用户名，只显示头像 */
@media (max-width: 768px) {
  .user-name-sm { display: none; }
  .login-btn span { display: none; }
  .login-btn { padding: 7px 10px; }
}
</style>
