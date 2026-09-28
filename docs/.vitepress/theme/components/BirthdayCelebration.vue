<template>
  <div class="bd-overlay" aria-hidden="true">
    <canvas ref="fwRef" class="bd-canvas"></canvas>
    <canvas ref="cfRef" class="bd-canvas"></canvas>
    <div class="cannon left" :class="{ firing: cannonsOn }">
      <div class="tube"></div><div class="stripes"></div><div class="mouth"></div><div class="base"></div>
    </div>
    <div class="cannon right" :class="{ firing: cannonsOn }">
      <div class="tube"></div><div class="stripes"></div><div class="mouth"></div><div class="base"></div>
    </div>
    <div class="greeting" :class="greetState">
      <div class="to">— 祝 —</div>
      <div class="name">{{ displayNames }}</div>
      <div class="wish">生日快乐</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  names: { type: Array, default: () => [] },
})
const displayNames = computed(() => props.names.join('｜'))

const fwRef = ref(null)
const cfRef = ref(null)
const cannonsOn = ref(false)
const greetState = ref('')

let fw = null, cf = null, ctx = null, cctx = null
let W = 0, H = 0
let rockets = [], particles = [], confetti = []
let rafFw = 0, rafCf = 0, timers = [], active = false

function resize() {
  W = window.innerWidth
  H = window.innerHeight
  if (fw) { fw.width = W; fw.height = H }
  if (cf) { cf.width = W; cf.height = H }
}

function launch() {
  rockets.push({
    x: W * (0.18 + Math.random() * 0.64), y: H + 12,
    vy: -(H * 0.011 + 7), targetY: H * (0.16 + Math.random() * 0.26),
    hue: Math.floor(Math.random() * 360),
  })
}
function explode(x, y, hue) {
  const n = 78 + Math.floor(Math.random() * 46)
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = Math.random() * 7.5 + 1.4
    particles.push({
      x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      hue: hue + (Math.random() * 160 - 80),
      life: 1, decay: Math.random() * 0.014 + 0.008,
      size: Math.random() * 2 + 1,
    })
  }
}
function tickFW() {
  if (!active) return
  ctx.clearRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'lighter'
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i]
    r.y += r.vy; r.vy += 0.07
    ctx.lineWidth = 2.4
    ctx.strokeStyle = 'hsla(' + r.hue + ',100%,62%,.7)'
    ctx.beginPath(); ctx.moveTo(r.x, r.y + 14); ctx.lineTo(r.x, r.y - 4); ctx.stroke()
    ctx.fillStyle = 'hsl(' + r.hue + ',100%,60%)'
    ctx.beginPath(); ctx.arc(r.x, r.y, 2.6, 0, 7); ctx.fill()
    if (r.y <= r.targetY || r.vy >= 0) { explode(r.x, r.y, r.hue); rockets.splice(i, 1) }
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.px = p.x; p.py = p.y
    p.x += p.vx; p.y += p.vy
    p.vx *= 0.98; p.vy *= 0.98; p.vy += 0.055
    p.life -= p.decay
    ctx.lineWidth = p.size
    ctx.strokeStyle = 'hsla(' + p.hue + ',100%,62%,' + (p.life * .8) + ')'
    ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke()
    ctx.fillStyle = 'hsla(' + p.hue + ',100%,68%,' + p.life + ')'
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill()
    if (p.life <= 0) particles.splice(i, 1)
  }
  rafFw = requestAnimationFrame(tickFW)
}

function showCannons(on) { cannonsOn.value = on }
function cannonBurst() {
  showCannons(true)
  const sides = [
    { x: 52, y: H - 168, dir: 1 },
    { x: W - 52, y: H - 168, dir: -1 },
  ]
  sides.forEach(function (s) {
    for (let i = 0; i < 95; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.15
      const sp = Math.random() * 13 + 6.5
      confetti.push({
        x: s.x, y: s.y,
        vx: Math.cos(ang) * sp * s.dir + s.dir * 4.5,
        vy: Math.sin(ang) * sp,
        w: Math.random() * 8 + 6, h: Math.random() * 7 + 8,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.32,
        hue: Math.floor(Math.random() * 360),
        sway: Math.random() * 2.2, t: Math.random() * Math.PI * 2,
      })
    }
  })
}
function tickCF() {
  if (!active) return
  cctx.clearRect(0, 0, W, H)
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i]
    c.t += 0.1
    c.x += c.vx + Math.sin(c.t) * c.sway
    c.y += c.vy; c.vy += 0.27; c.vx *= 0.99
    c.rot += c.vr
    if (c.y > H + 24) { confetti.splice(i, 1); continue }
    cctx.save()
    cctx.translate(c.x, c.y); cctx.rotate(c.rot)
    cctx.fillStyle = 'hsl(' + c.hue + ',88%,' + (48 + Math.sin(c.t) * 9) + '%)'
    cctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h)
    cctx.restore()
  }
  rafCf = requestAnimationFrame(tickCF)
}

function clearAll() {
  rockets = []; particles = []; confetti = []
  ctx.clearRect(0, 0, W, H); cctx.clearRect(0, 0, W, H)
  showCannons(false)
}
function at(ms, fn) { timers.push(setTimeout(fn, ms)) }
function play() {
  clearAll()
  greetState.value = ''
  at(0, launch)
  at(320, launch)
  at(640, launch)
  at(950, function () { cannonBurst(); greetState.value = 'show' })
  at(1750, launch)
  at(2350, launch)
  at(6500, function () { greetState.value = 'hide'; showCannons(false) })
}

onMounted(() => {
  fw = fwRef.value
  cf = cfRef.value
  ctx = fw.getContext('2d')
  cctx = cf.getContext('2d')
  active = true
  resize()
  window.addEventListener('resize', resize)
  rafFw = requestAnimationFrame(tickFW)
  rafCf = requestAnimationFrame(tickCF)
  play()
})
onUnmounted(() => {
  active = false
  cancelAnimationFrame(rafFw)
  cancelAnimationFrame(rafCf)
  timers.forEach(clearTimeout)
  timers = []
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.bd-overlay {
  position: fixed; inset: 0; z-index: 10000;
  pointer-events: none; overflow: hidden;
}
.bd-canvas {
  position: absolute; inset: 0;
  width: 100%; height: 100%; display: block;
}

.greeting {
  position: absolute; left: 50%; top: 42%; max-width: 90%;
  transform: translate(-50%, -50%); text-align: center; opacity: 0;
  padding: 24px 46px; border-radius: 26px;
  background: rgba(255, 255, 255, .10);
  -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, .08);
  box-shadow: 0 22px 60px rgba(0, 0, 0, .2);
}
.greeting.show { animation: pop .95s cubic-bezier(.2, 1.45, .4, 1) forwards; }
.greeting.hide { animation: fadeOut .6s ease forwards; }
@keyframes fadeOut { to { opacity: 0; } }
@keyframes pop {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(.4); filter: blur(14px); }
  62%  { opacity: 1; transform: translate(-50%, -50%) scale(1.08); filter: blur(0); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
.greeting .to {
  color: #0e7a5e; font-size: clamp(16px, 2.3vw, 26px); font-weight: 700;
  letter-spacing: 6px; margin-bottom: 10px; white-space: nowrap;
  text-shadow: 0 1px 6px rgba(255, 255, 255, .6);
}
.greeting .name {
  font-size: clamp(28px, 4vw, 50px); font-weight: 800; line-height: 1.1; white-space: nowrap;
  background: linear-gradient(90deg, #0e7a5e, #1f6fc4, #d83a86, #e07b1f, #0e7a5e);
  background-size: 300% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: shine 3.2s linear infinite;
}
@keyframes shine { to { background-position: 300% 0; } }
.greeting .wish {
  color: #1d1d1f; font-size: clamp(14px, 2vw, 23px); font-weight: 600;
  letter-spacing: 10px; margin-top: 12px; white-space: nowrap; padding-left: 10px;
}

:global(html.dark) .greeting {
  background: rgba(20, 24, 32, .30);
  border-color: rgba(255, 255, 255, .12);
  box-shadow: 0 22px 60px rgba(0, 0, 0, .5);
}
:global(html.dark) .greeting .to { color: #3adbb0; text-shadow: 0 0 14px rgba(58, 219, 176, .55); }
:global(html.dark) .greeting .name {
  background: linear-gradient(90deg, #3adbb0, #4aa8ff, #ff6ab0, #ffb04a, #3adbb0);
  background-size: 300% 100%;
  -webkit-background-clip: text; background-clip: text;
}
:global(html.dark) .greeting .wish { color: #eef2f5; }

@media (max-width: 560px) {
  .greeting { padding: 18px 24px; }
  .greeting .to { letter-spacing: 4px; }
  .greeting .wish { letter-spacing: 5px; padding-left: 5px; }
}

.cannon {
  position: absolute; bottom: -1vh; z-index: 4;
  width: 150px; height: 230px; opacity: 0; transition: opacity .35s ease;
}
.cannon.firing { opacity: .92; }
.cannon.left  { left: -26px; transform: rotate(24deg); transform-origin: 18% 100%; }
.cannon.right { right: -26px; transform: rotate(-24deg); transform-origin: 82% 100%; }
.cannon .tube {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(90deg, #8f150f 0%, #d83b2c 42%, #f06a55 55%, #9c1a12 100%);
  clip-path: polygon(34% 100%, 66% 100%, 100% 0, 0 0);
  filter: drop-shadow(0 14px 30px rgba(0, 0, 0, .45));
}
.cannon .stripes {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
  clip-path: polygon(34% 100%, 66% 100%, 100% 0, 0 0);
  background: repeating-linear-gradient(115deg,
    rgba(255, 215, 0, .95) 0 12px, rgba(255, 255, 255, 0) 12px 26px,
    rgba(46, 204, 113, .95) 26px 38px, rgba(255, 255, 255, 0) 38px 52px,
    rgba(52, 152, 219, .95) 52px 64px, rgba(255, 255, 255, 0) 64px 78px,
    rgba(232, 90, 155, .95) 78px 90px, rgba(255, 255, 255, 0) 90px 104px);
}
.cannon .mouth {
  position: absolute; top: -4px; left: 6px; width: calc(100% - 12px); height: 30px;
  background: radial-gradient(ellipse at center, #2a0c08 55%, #c4382b 60%, #7d150f 100%);
  border-radius: 50%;
}
.cannon .base {
  position: absolute; bottom: -6px; left: 28%; width: 44%; height: 26px;
  background: #5c0f0a; border-radius: 6px 6px 10px 10px;
}
</style>
