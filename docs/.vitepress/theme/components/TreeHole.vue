<template>
  <div class="treehole-page">
    <div class="treehole-construction">
      <div class="construction-icon">🌳</div>
      <h2>匿名树洞正在装修中</h2>
      <p>我们想把它做成一个真正敢说真话的地方，但又不会变成一个宣泄的垃圾桶。</p>
      <p>具体怎么平衡"匿名"和"负责"，班委会讨论出一个方案再开放。</p>
      <p class="construction-thanks">感谢等待，好的东西值得等。</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.treehole-page {
  min-height: 60vh;
}
.treehole-construction {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 24px;
  max-width: 560px;
  margin: 0 auto;
}
.construction-icon {
  font-size: 56px;
  margin-bottom: 24px;
}
.treehole-construction h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 16px;
}
.treehole-construction p {
  font-size: 15px;
  line-height: 1.7;
  color: var(--c-text-secondary);
  margin: 0 0 8px;
}
.construction-thanks {
  margin-top: 16px !important;
  color: var(--c-text-tertiary) !important;
}
</style>
