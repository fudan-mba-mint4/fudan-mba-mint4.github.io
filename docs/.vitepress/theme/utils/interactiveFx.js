/**
 * interactiveFx · 全局交互动效（2026-11-01 · 动效优化 #20/#4）
 *
 * ① 按钮按压回弹：pointerdown 缩至 0.95，pointerup 弹簧回弹 0.95 → 1.05 → 1
 *    —— 所有按钮（<button> / [role="button"] / 按钮形态的 <a class*="btn">）
 * ② 波纹跟手：从手指/鼠标按下位置生成圆形波纹向外扩散（仅操作按钮，排除 Tab / 筛选片）
 *    —— 波纹用 z-index:-1 + isolation 落到按钮背景之上、内容之下，不遮挡文字
 * ③ 大卡片跟手高亮：.fx-spotlight 元素跟随鼠标的微弱薄荷光（仅 hover 设备）
 *
 * 所有动效尊重 prefers-reduced-motion：开启时全部跳过（不创建动画、不绑定）。
 * 实现只依赖 Web Animations API + Pointer Events，不引第三方库。
 */

const BTN_SELECTOR = 'button, [role="button"], a[class*="btn"]'

// 非"操作按钮"：Tab 切换器 / 筛选片（分段选择控件）不做波纹
const NO_RIPPLE_SELECTOR =
  '.fp-tab, .budget-tab, .mc-subtab, .view-tab, .type-tab, .module-tab, .stat-chip, .week-chip'

const reduceMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isDisabled = (el) => el.disabled || el.getAttribute('aria-disabled') === 'true'

/** 波纹：以落点为圆心生成圆形 span，动画结束自移除 */
function spawnRipple(btn, clientX, clientY) {
  if (btn.matches(NO_RIPPLE_SELECTOR)) return
  const rect = btn.getBoundingClientRect()
  const size = Math.hypot(rect.width, rect.height) * 1.05
  const span = document.createElement('span')
  span.className = 'fx-ripple-el'
  span.style.left = `${clientX - rect.left - size / 2}px`
  span.style.top = `${clientY - rect.top - size / 2}px`
  span.style.width = `${size}px`
  span.style.height = `${size}px`
  btn.appendChild(span)
  span.addEventListener('animationend', () => span.remove())
}

/** 按压：0.95 且保持（fill:forwards，直到松手） */
function pressBtn(btn) {
  btn.getAnimations().forEach((a) => a.cancel())
  btn.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }],
    { duration: 120, easing: 'ease-out', fill: 'forwards' }
  )
}

/** 松手：弹簧回弹 0.95 → 1.05 → 1，动画结束清理自身（不残留 fill） */
function releaseBtn(btn) {
  btn.getAnimations().forEach((a) => a.cancel())
  const anim = btn.animate(
    [
      { transform: 'scale(0.95)' },
      { transform: 'scale(1.05)', offset: 0.45 },
      { transform: 'scale(1)' },
    ],
    { duration: 340, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
  )
  anim.addEventListener('finish', () => anim.cancel())
}

/** 取消（拖出/滚动中断）：直接回到原尺寸，不弹跳 */
function restoreBtn(btn) {
  btn.getAnimations().forEach((a) => a.cancel())
}

/**
 * 全局初始化：document 级事件委托（Layout onMounted 调用一次）。
 * 返回清理函数，组件卸载时调用避免泄漏。
 */
export function initInteractiveFx() {
  if (typeof window === 'undefined') return () => {}
  if (reduceMotion()) return () => {}

  // pointerId → 处于按压中的按钮（支持多指/多按钮并行）
  const pressing = new Map()

  const onPointerDown = (e) => {
    const btn = e.target.closest(BTN_SELECTOR)
    if (!btn || isDisabled(btn)) return
    pressing.set(e.pointerId, btn)
    pressBtn(btn)
    spawnRipple(btn, e.clientX, e.clientY)
  }

  const onPointerUp = (e) => {
    const btn = pressing.get(e.pointerId)
    if (!btn) return
    pressing.delete(e.pointerId)
    releaseBtn(btn)
  }

  const onPointerCancel = (e) => {
    const btn = pressing.get(e.pointerId)
    if (!btn) return
    pressing.delete(e.pointerId)
    restoreBtn(btn)
  }

  // 键盘激活（Enter / Space）：从按钮中心回弹 + 波纹（无指针落点）
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const btn = document.activeElement && document.activeElement.closest(BTN_SELECTOR)
    if (!btn || isDisabled(btn)) return
    const rect = btn.getBoundingClientRect()
    spawnRipple(btn, rect.left + rect.width / 2, rect.top + rect.height / 2)
    releaseBtn(btn)
  }

  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerCancel)
  document.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('pointercancel', onPointerCancel)
    document.removeEventListener('keydown', onKeyDown)
  }
}

/**
 * 大卡片跟手高亮：为当前 DOM 中所有 .fx-spotlight 绑定鼠标跟踪。
 * 路由切换后新渲染的卡片需再次调用（Layout 页面 watch 中调用）。
 */
export function bindSpotlights() {
  if (typeof window === 'undefined') return
  if (reduceMotion()) return
  if (!window.matchMedia('(hover: hover)').matches) return

  document.querySelectorAll('.fx-spotlight').forEach((el) => {
    if (el.dataset.fxSpot) return
    el.dataset.fxSpot = '1'

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      el.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }
    el.addEventListener('pointerenter', () => el.classList.add('fx-spotlight-on'))
    el.addEventListener('pointerleave', () => el.classList.remove('fx-spotlight-on'))
    el.addEventListener('pointermove', onMove)
  })
}
