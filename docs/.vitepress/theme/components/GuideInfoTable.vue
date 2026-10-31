<script setup>
/**
 * GuideInfoTable · 信息表格 + 横向滚动包裹（蓝图 §5.13，E 根治件）
 * columns: [{ key, title, align?: 'left' | 'right' | 'center' }]
 * rows:    Record<string, string | { text, strong?: boolean }>
 * 强调由 strong 布尔字段交给组件 <strong> 渲染（蓝图 §7.2），表格内禁止 markdown **。
 */
import { computed } from 'vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  caption: { type: String, default: '' },
  dense: { type: Boolean, default: false },
})

function cellValue(cell) {
  if (cell && typeof cell === 'object') return cell.text
  return cell ?? ''
}
function cellStrong(cell) {
  return !!(cell && typeof cell === 'object' && cell.strong)
}

const alignClass = (align) => align ? `guide-table__cell--${align}` : ''
</script>

<template>
  <figure class="guide-table" :class="{ 'guide-table--dense': dense }">
    <figcaption v-if="caption" class="guide-table__caption">{{ caption }}</figcaption>
    <div class="guide-table-scroll">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="alignClass(col.align)"
            >{{ col.title }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in rows" :key="r">
            <td
              v-for="col in columns"
              :key="col.key"
              :class="alignClass(col.align)"
            >
              <slot :name="`cell-${r}-${col.key}`" :row="row" :col="col" :index="r">
                <strong v-if="cellStrong(row[col.key])">{{ cellValue(row[col.key]) }}</strong>
                <template v-else>{{ cellValue(row[col.key]) }}</template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>

<style scoped>
.guide-table {
  margin: 0;
  min-width: 0;
}

.guide-table__caption {
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}

.guide-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius-xl);
  border: 0.5px solid var(--c-separator);
  background: var(--c-bg-card);
}

table {
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
}

th {
  background: var(--c-bg-secondary);
  color: var(--c-text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 0.5px solid var(--c-separator);
  white-space: nowrap;
}

td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 0.5px solid var(--c-border-light);
  color: var(--c-text-secondary);
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  transition: background var(--transition-fast);
  vertical-align: top;
}

.guide-table--dense td,
.guide-table--dense th { padding: var(--space-2) var(--space-3); }

tbody tr:hover td { background: var(--c-bg-secondary); }
tbody tr:last-child td { border-bottom: none; }

.guide-table__cell--right { text-align: right; }
.guide-table__cell--center { text-align: center; }

td strong {
  font-weight: var(--font-semibold);
  color: var(--c-text-primary);
}
</style>
