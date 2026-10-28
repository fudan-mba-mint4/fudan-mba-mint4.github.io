/**
 * Admin 重构回归测试：保证从 AdminPanel.vue 抽取的常量/纯函数与重构前逐字一致
 * 运行：node --test docs/.vitepress/theme/utils/admin/__tests__/
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  dataTypes, finTabs, coinsTabs, MODULE_ROLE_MAP, COIN_AUDITORS, ROLE_LABEL_MAP,
} from '../constants.js'
import {
  formatSize, translateBoth, randomHex, extFromFileName,
  formatTreeholeTime, shortTime, coinShortDate,
  flattenCourseFiles, sessionUrls, buildCmMgrRows,
} from '../utils.js'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(here, '../../../../../..') // utils/admin/__tests__ -> 项目根
const backendSrc = readFileSync(join(projectRoot, 'functions/_utils.js'), 'utf8')

// 从后端源码中安全提取纯字面量对象/数组（仅字符串键值，无函数/副作用）
function extractLiteral(regex, name) {
  const m = backendSrc.match(regex)
  assert.ok(m, `后端 _utils.js 中未找到 ${name}`)
  // 在受限上下文中求值对象字面量（内容为源码内固定字符串，非外部输入）
  const value = Function(`"use strict"; return (${m[1]});`)()
  return value
}

test('constants: dataTypes 9 个模块且 id 唯一', () => {
  assert.equal(dataTypes.length, 9)
  const ids = dataTypes.map(t => t.id)
  assert.equal(new Set(ids).size, 9)
  for (const t of dataTypes) {
    assert.ok(t.name && t.icon, `模块 ${t.id} 缺 name/icon`)
  }
})

test('constants: finTabs 5 个、coinsTabs 2 个且 key 唯一', () => {
  assert.equal(finTabs.length, 5)
  assert.equal(new Set(finTabs.map(t => t.key)).size, 5)
  assert.equal(coinsTabs.length, 2)
  assert.equal(new Set(coinsTabs.map(t => t.key)).size, 2)
})

test('constants: MODULE_ROLE_MAP 与后端 MODULE_ROLES 逐字一致', () => {
  const backend = extractLiteral(/export const MODULE_ROLES = (\{[\s\S]*?\n\})/, 'MODULE_ROLES')
  assert.deepEqual(MODULE_ROLE_MAP, backend)
})

test('constants: COIN_AUDITORS 与后端一致', () => {
  const backend = extractLiteral(/export const COIN_AUDITORS = (\[[^\]]*\])/, 'COIN_AUDITORS')
  assert.deepEqual(COIN_AUDITORS, backend)
})

test('constants: ROLE_LABEL_MAP 与后端 ROLE_LABELS 一致', () => {
  const backend = extractLiteral(/export const ROLE_LABELS = (\{[\s\S]*?\n\})/, 'ROLE_LABELS')
  assert.deepEqual(ROLE_LABEL_MAP, backend)
})

test('utils: formatSize 边界', () => {
  assert.equal(formatSize(0), '0 B')
  assert.equal(formatSize(1023), '1023 B')
  assert.equal(formatSize(1024), '1.0 KB')
  assert.equal(formatSize(1048575), '1024.0 KB')
  assert.equal(formatSize(1048576), '1.0 MB')
})

test('utils: translateBoth 中文原样返回', async () => {
  const r = await translateBoth('测试')
  assert.deepEqual(r, { en: '测试', th: '测试' })
})

test('utils: randomHex 长度与字符集', () => {
  for (const n of [1, 3, 4, 8]) {
    const s = randomHex(n)
    assert.equal(s.length, n * 2)
    assert.match(s, /^[0-9a-f]+$/)
  }
})

test('utils: extFromFileName 大小写与缺省', () => {
  assert.equal(extFromFileName('a.PDF'), 'pdf')
  assert.equal(extFromFileName('slide.pptx'), 'pptx')
  assert.equal(extFromFileName('无扩展名'), 'bin')
  assert.equal(extFromFileName(''), 'bin')
})

test('utils: shortTime 格式化与非法输入', () => {
  assert.equal(shortTime('2026-10-28T14:05:00Z'), '10-28 22:05') // UTC+8
  assert.equal(shortTime(''), '')
  assert.equal(shortTime('不是时间'), '不是时间')
})

test('utils: formatTreeholeTime / coinShortDate 空输入返回空、非法串与原实现同行为', () => {
  assert.equal(formatTreeholeTime(''), '')
  assert.equal(coinShortDate(''), '')
  // 原实现 new Date('bad-date') 不抛错，toLocale 输出 'Invalid Date...'（保持原行为，不静默改判）
  assert.match(coinShortDate('bad-date'), /Invalid/)
})

test('utils: flattenCourseFiles 结构与类型映射', () => {
  const pack = {
    courses: [{
      name: 'DMD',
      sessions: [{
        files: [{ name: 'a.pdf', size: '1 MB', url: 'u1' }],
        homework: { name: 'hw.pdf', size: '2 MB', url: 'u2' },
        references: [{ name: 'ref.pdf', size: '3 MB', url: 'u3' }, { name: 'no-url', size: '1 B', url: '' }],
      }],
    }],
  }
  const out = flattenCourseFiles(pack)
  assert.equal(out.length, 3)
  assert.equal(out[0].kind, '课件')
  assert.equal(out[1].kind, '作业')
  assert.equal(out[2].kind, '参考')
  assert.equal(out[2].name, 'ref.pdf')
})

test('utils: sessionUrls 去重且仅收录有效 url', () => {
  const sess = {
    files: [{ url: 'a' }, { url: '' }, { url: 'a' }],
    references: [{ url: 'b' }, { url: null }],
    homework: { url: 'c' },
  }
  assert.deepEqual(sessionUrls(sess), ['a', 'b', 'c'])
})

test('utils: buildCmMgrRows 按讲次升序并生成 draft 字段', () => {
  const pack = {
    courses: [{
      id: 'dmd', name: 'DMD',
      sessions: [
        { session: 2, date: '2026-09-20', title: '第二讲', files: [{ url: 'x' }], references: [], homework: null },
        { session: 1, date: '2026-09-13', title: '', files: [], references: [], homework: null },
      ],
    }],
  }
  const rows = buildCmMgrRows(pack)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].sessions.length, 2)
  assert.equal(rows[0].sessions[0].session, 1) // 升序
  assert.equal(rows[0].sessions[0].fileCount, 0)
  assert.equal(rows[0].sessions[0].draftTitle, '')
  assert.equal(rows[0].sessions[1].fileCount, 1)
  assert.deepEqual(rows[0].sessions[1].urls, ['x'])
})
