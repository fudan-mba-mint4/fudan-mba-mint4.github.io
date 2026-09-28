<template>
  <!-- Teleport 到 body：脱离 VPContent(z:1) 层叠上下文，保证按钮/动效在根上下文、永远压过 VPFooter(z:10)/m-tabbar(z:1000)；ClientOnly 避免 SSG hydration 问题 -->
  <ClientOnly>
    <Teleport to="body">
      <!-- 当天有寿星：首次进首页自动播放，悬浮按钮全天在、可随时重播；无寿星则零元素 -->
      <div v-if="hasBirthday" class="bd-module">
        <button
          type="button"
          class="bd-fab"
          :disabled="playing"
          @click="replay"
        >生 日 快 乐 🎂</button>
        <BirthdayCelebration v-if="playing" :names="names" @done="onDone" />
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BirthdayCelebration from './BirthdayCelebration.vue'
import { useAuth } from '../composables/useAuth.js'

const BDAY_KEY_PREFIX = 'mint4_bday_shown_'

const { currentUser, authToken } = useAuth()
const hasBirthday = ref(false)
const names = ref([])
const playing = ref(false)
let dayKey = ''

function authHeaders() {
  const h = {}
  if (authToken.value) h.Authorization = 'Bearer ' + authToken.value
  return h
}
// 自动播放开始即落“当天已自动播放”，保证刷新/再次进入不重复自动播放
function markViewed() {
  if (currentUser.value) {
    fetch('/api/birthday/view', { method: 'POST', headers: authHeaders() }).catch(() => {})
  } else if (dayKey) {
    localStorage.setItem(BDAY_KEY_PREFIX + dayKey, '1')
  }
}
function startPlayback() {
  if (playing.value) return
  playing.value = true
}

onMounted(async () => {
  try {
    const res = await fetch('/api/birthday/today', { headers: authHeaders() })
    if (!res.ok) return
    const data = await res.json()
    if (!data.celebrate || !Array.isArray(data.names) || !data.names.length) return

    dayKey = data.day
    names.value = data.names
    hasBirthday.value = true

    // 当天首次：自动播放并落已看；之后只保留悬浮按钮供重播
    const alreadyAuto = currentUser.value
      ? !!data.viewed
      : localStorage.getItem(BDAY_KEY_PREFIX + dayKey) === '1'
    if (!alreadyAuto) {
      startPlayback()
      markViewed()
    }
  } catch (e) {
    // 静默降级：网络异常 / 无寿星时不渲染任何生日元素
  }
})

// 悬浮按钮：随时重播（不受“已看”限制）
function replay() { startPlayback() }
function onDone() { playing.value = false }
</script>

<style scoped>
.bd-fab {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%);
  z-index: 9000;
  padding: 10px 26px;
  border-radius: 999px;
  font-size: 14px; font-weight: 700; white-space: nowrap;
  color: #1d1d1f; cursor: pointer;
  background: rgba(255, 255, 255, .10);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  border: 0;
  isolation: isolate;
}
.bd-fab::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px;
  background: conic-gradient(from var(--ba),
    #ff3b6b, #ff9f0a, #ffd60a, #34c759, #0a84ff, #bf5af2, #ff3b6b);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  animation: bspin 1.2s linear infinite;
}
@property --ba { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
@keyframes bspin { to { --ba: 360deg; } }
.bd-fab:hover:not(:disabled) { filter: brightness(1.12); }
.bd-fab:disabled { cursor: default; opacity: .85; }

:global(html.dark) .bd-fab {
  color: #eef2f5;
  background: rgba(28, 32, 40, .18);
}

@media (max-width: 768px) {
  .bd-fab {
    bottom: calc(78px + env(safe-area-inset-bottom));
    padding: 9px 20px; font-size: 13px;
  }
}
</style>
