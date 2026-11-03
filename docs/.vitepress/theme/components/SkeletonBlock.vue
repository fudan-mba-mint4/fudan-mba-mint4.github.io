<script setup>
/**
 * SkeletonBlock · 骨架占位原子组件（动效优化 #20/#4 骨架基建）
 * 用法：<SkeletonBlock variant="line|rect|circle" width="60%" height="16px" />
 * 形状/尺寸与真实内容一致，数据到达后由父组件 v-if 切换原位替换（容器锁高防跳动）。
 * shimmer 动画全局定义于 animations.css（sk-shimmer），reduced-motion 自动停用。
 */
defineProps({
  variant: { type: String, default: 'line' }, // line 圆角长条 | rect 矩形块 | circle 圆形
  width: { type: String, default: '100%' },
  height: { type: String, default: '' },
  radius: { type: String, default: '' },
})
</script>

<template>
  <span
    class="sk-block"
    :class="`sk--${variant}`"
    :style="{ width, height: height || undefined, borderRadius: radius || undefined }"
    aria-hidden="true"
  />
</template>

<style scoped>
.sk-block {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
  background: linear-gradient(
    90deg,
    var(--c-bg-elevated) 25%,
    var(--c-accent-glow) 50%,
    var(--c-bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
}

.sk--line {
  height: 14px;
  border-radius: 7px;
}

.sk--rect {
  border-radius: var(--radius-md, 8px);
}

.sk--circle {
  border-radius: 50%;
}
</style>
