<template>
  <div class="admin-panel">
    <!-- ===== 密码验证 ===== -->
    <div v-if="!authenticated" class="auth-screen">
      <div class="auth-card">
        <div class="auth-icon">🔒</div>
        <h2>班级网站管理后台</h2>
        <p class="auth-desc">仅限管理员访问</p>
        <input type="password" v-model="passwordInput" placeholder="请输入访问密码"
          @keyup.enter="verifyPassword" class="auth-input" />
        <button @click="verifyPassword" class="auth-btn">登 录</button>
        <p v-if="authError" class="auth-error">{{ authError }}</p>
      </div>
    </div>

    <!-- ===== 管理主界面 ===== -->
    <div v-else class="admin-main">
      <header class="admin-header">
        <h2>📋 班级网站管理后台</h2>
        <button @click="logout" class="logout-btn">退出</button>
      </header>

      <!-- GitHub Token -->
      <div class="token-bar">
        <input type="password" v-model="githubToken" placeholder="GitHub Personal Access Token (repo权限)"
          class="token-input" />
        <button @click="testToken" class="token-btn" :disabled="!githubToken">
          {{ tokenStatus === 'testing' ? '验证中...' : tokenStatus === 'valid' ? '✓ 已验证' : '验证Token' }}
        </button>
        <span v-if="tokenStatus === 'invalid'" class="token-error">Token无效</span>
      </div>

      <!-- 类型标签 -->
      <div class="type-tabs">
        <button v-for="t in dataTypes" :key="t.id" @click="currentType = t.id"
          :class="{ active: currentType === t.id }" class="type-tab">
          {{ t.icon }} {{ t.name }}
        </button>
      </div>

      <!-- ===== 公告表单 ===== -->
      <div v-if="currentType === 'announcements'" class="form-section">
        <h3>📢 发布公告</h3>
        <form @submit.prevent="submitAnnouncement" class="data-form">
          <div class="form-row">
            <div class="form-group">
              <label>标题 <span class="required">*</span></label>
              <input v-model="annForm.titleZh" required />
            </div>
            <div class="form-group">
              <label>标签 <span class="required">*</span></label>
              <select v-model="annForm.category">
                <option value="important">🔴 重要</option>
                <option value="academic">📚 教学</option>
                <option value="normal">📌 通知</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>日期 <span class="required">*</span></label>
              <input type="date" v-model="annForm.date" required />
            </div>
            <div class="form-group">
              <label>截止日期（可选）</label>
              <input type="date" v-model="annForm.deadline" />
            </div>
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label"><input type="checkbox" v-model="annForm.pinned" /> 置顶显示</label>
          </div>
          <div class="form-group">
            <label>摘要 <span class="required">*</span></label>
            <input v-model="annForm.summaryZh" required placeholder="一句话摘要" />
          </div>
          <div class="form-group">
            <label>内容主体 <span class="required">*</span></label>
            <textarea v-model="annForm.contentZh" rows="5" required></textarea>
          </div>
          <button type="submit" class="submit-btn" :disabled="submitting || !tokenValid">
            {{ submitting ? '提交中...' : '提交并发布' }}
          </button>
        </form>
      </div>

      <!-- ===== 活动表单 ===== -->
      <div v-if="currentType === 'activities'" class="form-section">
        <h3>🎉 添加活动</h3>
        <form @submit.prevent="submitActivity" class="data-form">
          <div class="form-row">
            <div class="form-group"><label>活动标题 <span class="required">*</span></label><input v-model="actForm.titleZh" required /></div>
            <div class="form-group"><label>日期 <span class="required">*</span></label><input type="date" v-model="actForm.date" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>时间（如 "17:00 - 18:00"）</label><input v-model="actForm.time" placeholder="17:00 - 18:00" /></div>
            <div class="form-group"><label>地点</label><input v-model="actForm.locationZh" placeholder="政立院区 B403" /></div>
          </div>
          <div class="form-group"><label>组织者</label><input v-model="actForm.organizerZh" placeholder="班级筹备组" /></div>
          <div class="form-group"><label>活动描述</label><textarea v-model="actForm.descriptionZh" rows="3"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>报名人数上限</label><input type="number" v-model.number="actForm.capacity" placeholder="84" /></div>
            <div class="form-group"><label>已报名人数</label><input type="number" v-model.number="actForm.registered" placeholder="0" /></div>
          </div>
          <div class="form-row checkbox-row">
            <label class="checkbox-label"><input type="checkbox" v-model="actForm.hasMedia" /> 📷 有相册/图片直播</label>
            <label class="checkbox-label"><input type="checkbox" v-model="actForm.involvesFinance" /> 💰 涉及班费</label>
          </div>
          <button type="submit" class="submit-btn" :disabled="submitting || !tokenValid">
            {{ submitting ? '提交中...' : '提交并发布' }}
          </button>
        </form>
      </div>

      <!-- ===== 课程资料表单 ===== -->
      <div v-if="currentType === 'courseMaterials'" class="form-section">
        <h3>📚 添加课程资料</h3>
        <form @submit.prevent="submitCourseMaterial" class="data-form">
          <div class="form-row">
            <div class="form-group">
              <label>课程 <span class="required">*</span></label>
              <select v-model="cmForm.courseId">
                <option value="dmd">数据、模型与决策（DMD）</option>
                <option value="managerial-economics">管理经济学</option>
                <option value="accounting">会计学</option>
              </select>
            </div>
            <div class="form-group"><label>第几讲 <span class="required">*</span></label><input type="number" v-model.number="cmForm.session" required placeholder="1" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>日期 <span class="required">*</span></label><input type="date" v-model="cmForm.date" required /></div>
            <div class="form-group"><label>本讲标题 <span class="required">*</span></label><input v-model="cmForm.title" required placeholder="第1讲：..." /></div>
          </div>
          <div class="form-group">
            <label>课件PDF <span class="required">*</span></label>
            <input type="file" accept=".pdf" @change="onSlideFile" class="file-input" />
            <span v-if="cmForm.slideFile" class="file-info">📄 {{ cmForm.slideFile.name }} ({{ formatSize(cmForm.slideFile.size) }})</span>
          </div>
          <div class="form-group">
            <label>作业PDF（可选）</label>
            <input type="file" accept=".pdf" @change="onHomeworkFile" class="file-input" />
            <span v-if="cmForm.homeworkFile" class="file-info">📄 {{ cmForm.homeworkFile.name }}</span>
          </div>
          <div v-if="cmForm.homeworkFile" class="form-row">
            <div class="form-group"><label>作业截止日期</label><input type="date" v-model="cmForm.hwDeadline" /></div>
            <div class="form-group"><label>提交方式</label><input v-model="cmForm.hwSubmission" placeholder="纸质版手写" /></div>
          </div>
          <div class="form-group"><label>作业说明（可选）</label><input v-model="cmForm.hwDescription" /></div>
          <div class="form-group">
            <label>参考资料（可选，可多个）</label>
            <div v-for="(ref, idx) in cmForm.references" :key="idx" class="ref-item">
              <input v-model="ref.name" placeholder="资料名称" class="ref-name" />
              <input type="file" accept=".pdf" @change="onRefFile($event, idx)" class="ref-file-input" />
              <input v-if="!ref.file" v-model="ref.desc" placeholder="或填写文字说明（无文件）" class="ref-desc" />
              <button type="button" @click="cmForm.references.splice(idx,1)" class="ref-remove">✕</button>
            </div>
            <button type="button" @click="cmForm.references.push({name:'',file:null,desc:''})" class="add-ref-btn">+ 添加参考资料</button>
          </div>
          <button type="submit" class="submit-btn" :disabled="submitting || !tokenValid || !cmForm.slideFile">
            {{ submitting ? '上传中...（PDF较大请稍候）' : '上传文件并提交' }}
          </button>
        </form>
      </div>

      <!-- ===== 班费表单 ===== -->
      <div v-if="currentType === 'finance'" class="form-section">
        <h3>💰 添加班费收支</h3>
        <form @submit.prevent="submitFinance" class="data-form">
          <div class="form-row">
            <div class="form-group">
              <label>类型 <span class="required">*</span></label>
              <select v-model="finForm.type">
                <option value="income">📈 收入</option>
                <option value="expense">📉 支出</option>
              </select>
            </div>
            <div class="form-group"><label>日期 <span class="required">*</span></label><input type="date" v-model="finForm.date" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类 <span class="required">*</span></label>
              <select v-model="finForm.category">
                <option value="tuition">班费缴纳</option>
                <option value="activity">活动支出</option>
                <option value="material">物资采购</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-group"><label>金额（元）<span class="required">*</span></label><input type="number" step="0.01" v-model.number="finForm.amount" required placeholder="0.00" /></div>
          </div>
          <div class="form-group"><label>描述 <span class="required">*</span></label><input v-model="finForm.description" required placeholder="如：8月1日班级见面会晚宴" /></div>
          <div class="form-group"><label>关联活动ID（可选）</label><input v-model="finForm.activityId" placeholder="如 act-001，不关联留空" /></div>
          <button type="submit" class="submit-btn" :disabled="submitting || !tokenValid">
            {{ submitting ? '提交中...' : '提交并发布' }}
          </button>
        </form>
      </div>

      <!-- ===== 相册表单 ===== -->
      <div v-if="currentType === 'gallery'" class="form-section">
        <h3>🖼️ 添加活动相册</h3>
        <form @submit.prevent="submitAlbum" class="data-form">
          <div class="form-row">
            <div class="form-group"><label>活动标题 <span class="required">*</span></label><input v-model="albForm.title" required /></div>
            <div class="form-group"><label>日期 <span class="required">*</span></label><input type="date" v-model="albForm.date" required /></div>
          </div>
          <div class="form-group"><label>图片直播链接 <span class="required">*</span></label><input v-model="albForm.url" required placeholder="https://live.photoplus.cn/live/..." /></div>
          <div class="form-group"><label>封面图 <span class="required">*</span></label>
            <input type="file" accept="image/*" @change="onCoverFile" class="file-input" />
            <span v-if="albForm.coverFile" class="file-info">🖼️ {{ albForm.coverFile.name }} ({{ formatSize(albForm.coverFile.size) }})</span>
          </div>
          <div class="form-group"><label>描述（可选）</label><input v-model="albForm.description" placeholder="一句话描述活动" /></div>
          <button type="submit" class="submit-btn" :disabled="submitting || !tokenValid || !albForm.coverFile">
            {{ submitting ? '上传中...' : '上传封面并提交' }}
          </button>
        </form>
      </div>

      <!-- ===== 树洞管理 ===== -->
      <div v-if="currentType === 'treehole'" class="form-section">
        <h3>🌳 匿名树洞管理</h3>

        <!-- Admin Token验证 -->
        <div v-if="!treeholeAdminVerified" class="treehole-auth">
          <p class="treehole-auth-desc">操作树洞数据需要管理员Token（当前会话内自动记忆）</p>
          <div class="treehole-auth-row">
            <input type="password" v-model="treeholeTokenInput" placeholder="Admin Token" @keyup.enter="verifyTreeholeToken" class="token-input" />
            <button @click="verifyTreeholeToken" class="token-btn">验证并进入</button>
          </div>
          <p v-if="treeholeTokenError" class="token-error">{{ treeholeTokenError }}</p>
        </div>

        <!-- 管理界面 -->
        <div v-else>
          <!-- 统计卡片 -->
          <div class="treehole-stat-cards">
            <div class="stat-card">
              <div class="stat-card-num">{{ treeholeStats.total }}</div>
              <div class="stat-card-label">总留言</div>
            </div>
            <div class="stat-card stat-card-active">
              <div class="stat-card-num">{{ treeholeStats.active_count }}</div>
              <div class="stat-card-label">正常显示</div>
            </div>
            <div class="stat-card stat-card-deleted">
              <div class="stat-card-num">{{ treeholeStats.deleted_count }}</div>
              <div class="stat-card-label">已删除</div>
            </div>
            <div class="stat-card stat-card-today">
              <div class="stat-card-num">{{ treeholeStats.today_count }}</div>
              <div class="stat-card-label">今日新增</div>
            </div>
          </div>

          <!-- 工具栏 -->
          <div class="treehole-toolbar">
            <input v-model="treeholeSearch" placeholder="🔍 搜索留言内容或昵称（自动搜索）..." @input="onTreeholeSearchInput" class="treehole-search" />
            <label class="treehole-checkbox"><input type="checkbox" v-model="treeholeIncludeDeleted" @change="onIncludeDeletedChange" /> 包含已删除</label>
            <button @click="loadTreeholeMessages" class="token-btn">刷新</button>
            <button @click="exportTreeholeCSV" class="treehole-export-btn">导出CSV</button>
            <div class="treehole-batch-actions" v-if="treeholeSelected.length > 0">
              <span class="treehole-selected-count">已选 {{ treeholeSelected.length }}</span>
              <button @click="batchDeleteTreehole" class="treehole-delete-btn">批量删除</button>
              <button @click="batchRestoreTreehole" class="treehole-restore-btn">批量恢复</button>
            </div>
          </div>

          <!-- 全选栏 -->
          <div v-if="treeholeMessages.length > 0" class="treehole-select-bar">
            <label class="treehole-select-all">
              <input type="checkbox" :checked="getIsAllSelected()" :indeterminate.prop="getIsIndeterminate()" @change="toggleSelectAll" />
              全选本页 ({{ treeholeMessages.length }})
            </label>
            <button v-if="treeholeSelected.length > 0" @click="clearSelection" class="treehole-clear-btn">清除选择</button>
          </div>

          <!-- 留言列表 -->
          <div v-if="treeholeLoading" class="treehole-loading">
            <div class="spinner-sm"></div> 加载中...
          </div>
          <div v-else-if="treeholeMessages.length === 0" class="treehole-empty">空空如也，没有符合条件的留言</div>
          <div v-else class="treehole-list">
            <div v-for="msg in treeholeMessages" :key="msg.id" class="treehole-item" :class="{ deleted: msg.is_deleted, expanded: expandedId === msg.id }">
              <div class="treehole-item-check">
                <input type="checkbox" :value="msg.id" v-model="treeholeSelected" />
              </div>
              <div class="treehole-item-content" @click="toggleExpand(msg.id)">
                <div class="treehole-item-header">
                  <span class="treehole-item-nickname">{{ msg.nickname || '匿名' }}</span>
                  <span class="treehole-item-time">{{ formatTreeholeTime(msg.created_at) }}</span>
                  <span class="treehole-item-ip" title="IP哈希（前16位，用于识别恶意刷号）">IP: {{ msg.ip_hash || '未知' }}</span>
                  <span v-if="msg.is_deleted" class="treehole-item-deleted-badge">已删除</span>
                  <span class="treehole-expand-icon">{{ expandedId === msg.id ? '▲' : '▼' }}</span>
                </div>
                <p class="treehole-item-text">{{ msg.content }}</p>
                <!-- 展开详情 -->
                <div v-if="expandedId === msg.id" class="treehole-item-detail">
                  <div class="detail-row"><span class="detail-label">留言ID：</span><span class="detail-value">#{{ msg.id }}</span></div>
                  <div class="detail-row"><span class="detail-label">精确时间：</span><span class="detail-value">{{ new Date(msg.created_at).toLocaleString('zh-CN') }}</span></div>
                  <div class="detail-row"><span class="detail-label">IP哈希：</span><span class="detail-value mono">{{ msg.ip_hash || '未知' }}</span></div>
                  <div class="detail-row"><span class="detail-label">状态：</span><span class="detail-value" :class="msg.is_deleted ? 'text-red' : 'text-green'">{{ msg.is_deleted ? '已删除' : '正常显示' }}</span></div>
                  <div class="detail-row"><span class="detail-label">完整内容：</span></div>
                  <div class="detail-full-content">{{ msg.content }}</div>
                </div>
              </div>
              <div class="treehole-item-actions">
                <button v-if="!msg.is_deleted" @click.stop="deleteSingleTreehole(msg.id)" class="treehole-single-delete">删除</button>
                <button v-else @click.stop="restoreSingleTreehole(msg.id)" class="treehole-single-restore">恢复</button>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="treeholePagination.totalPages > 1" class="treehole-pagination">
            <button @click="treeholePageChange(treeholePagination.page - 1)" :disabled="treeholePagination.page <= 1" class="treehole-page-btn">上一页</button>
            <span class="treehole-page-info">第 {{ treeholePagination.page }} / {{ treeholePagination.totalPages }} 页 · 共 {{ treeholePagination.total }} 条</span>
            <button @click="treeholePageChange(treeholePagination.page + 1)" :disabled="treeholePagination.page >= treeholePagination.totalPages" class="treehole-page-btn">下一页</button>
          </div>
        </div>
      </div>

      <!-- ===== 提交记录 ===== -->
      <div class="history-section">
        <h3>📜 提交记录 <span class="history-count">({{ submitHistory.length }}条)</span> <span v-if="historyLoading" class="history-loading">加载中...</span></h3>
        <div v-if="submitHistory.length === 0" class="history-empty">暂无提交记录</div>
        <div v-for="record in submitHistory" :key="record.id" class="history-item">
          <div class="history-info">
            <span class="history-time">{{ record.time }}</span>
            <span class="history-badge" :class="'badge-' + record.status">
              {{ record.status === 'success' ? '✓ 成功' : record.status === 'failed' ? '✗ 失败' : '⏳ 进行中' }}
            </span>
            <span class="history-type">{{ record.typeName }}</span>
          </div>
          <div class="history-desc">{{ record.description }}</div>
          <div v-if="record.commitSha" class="history-sha">Commit: <code>{{ record.commitSha.substring(0,7) }}</code></div>
          <div v-if="record.error" class="history-error">{{ record.error }}</div>
          <div v-if="record.reverted" class="reverted-tag">↩ 已撤回</div>
          <button v-if="record.status === 'success' && !record.reverted && record.commitSha"
                  class="revert-btn" @click="revertCommit(record)">↩ 撤回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchHistory, appendHistory, markReverted } from '../utils/adminHistory'

const REPO = 'fudan-mba-mint4/fudan-mba-mint4.github.io'
const PASSWORD_HASH = '0b8a55bb3079977fb8b4e8305b0b8c1c81f162fe1f88525a97de074e800b7ca3'

// ===== 认证 =====
const authenticated = ref(false)
const passwordInput = ref('')
const authError = ref('')
async function sha256(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}
async function verifyPassword() {
  if (await sha256(passwordInput.value) === PASSWORD_HASH) {
    authenticated.value = true; authError.value = ''
  } else authError.value = '密码错误'
}
function logout() { authenticated.value = false; localStorage.removeItem('admin_auth') }

// ===== GitHub Token =====
const githubToken = ref('')
const tokenStatus = ref('idle')
const tokenValid = computed(() => tokenStatus.value === 'valid')
async function testToken() {
  tokenStatus.value = 'testing'; localStorage.setItem('github_token', githubToken.value)
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers: { Authorization: `token ${githubToken.value}` } })
    tokenStatus.value = res.ok ? 'valid' : 'invalid'
    if (res.ok) loadHistoryFromGithub()
  } catch { tokenStatus.value = 'invalid' }
}

// ===== GitHub API 工具 =====
async function ghApi(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, { ...opts, headers: { Authorization: `token ${githubToken.value}`, Accept: 'application/vnd.github.v3+json', ...opts.headers } })
  return res
}
async function getFile(path) {
  const res = await ghApi(`/repos/${REPO}/contents/${path}?ref=main`)
  if (!res.ok) throw new Error(`获取文件失败 ${res.status}`)
  const d = await res.json()
  return { data: JSON.parse(decodeURIComponent(escape(atob(d.content)))), sha: d.sha }
}
async function putFile(path, data, sha, msg) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
  const res = await ghApi(`/repos/${REPO}/contents/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, content, sha, branch: 'main' }) })
  if (!res.ok) throw new Error((await res.json()).message || `提交失败 ${res.status}`)
  return (await res.json()).commit.sha
}
async function uploadBinary(path, file, msg) {
  const buf = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
  const res = await ghApi(`/repos/${REPO}/contents/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, content: base64, branch: 'main' }) })
  if (!res.ok) throw new Error((await res.json()).message || `上传失败 ${res.status}`)
  return (await res.json()).commit.sha
}
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB'
  return (bytes/1048576).toFixed(1) + ' MB'
}

// ===== 自动翻译（Google Translate 免费端点）=====
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`翻译失败 ${res.status}`)
    const data = await res.json()
    // data[0] 是句子数组，每个句子 [译文, 原文, ...]
    return data[0].map(s => s[0]).join('')
  } catch(e) {
    console.warn(`翻译到${targetLang}失败:`, e.message)
    return text // 失败时用原文
  }
}
async function translateBoth(text) {
  if (!text || !text.trim()) return { en: text, th: text }
  const [en, th] = await Promise.all([translateText(text, 'en'), translateText(text, 'th')])
  return { en, th }
}

// ===== 数据类型 =====
const dataTypes = [
  { id: 'announcements', name: '公告', icon: '📢' },
  { id: 'activities', name: '活动', icon: '🎉' },
  { id: 'courseMaterials', name: '课程资料', icon: '📚' },
  { id: 'finance', name: '班费', icon: '💰' },
  { id: 'gallery', name: '相册', icon: '🖼️' },
  { id: 'treehole', name: '树洞管理', icon: '🌳' },
]
const currentType = ref('announcements')
const submitting = ref(false)

// ===== 表单数据 =====
const today = new Date().toISOString().split('T')[0]
const annForm = ref({ titleZh:'', category:'normal', date:today, deadline:'', pinned:false, summaryZh:'', contentZh:'' })
const actForm = ref({ titleZh:'', date:today, time:'', locationZh:'', organizerZh:'', descriptionZh:'', capacity:null, registered:0, hasMedia:false, involvesFinance:false })
const cmForm = ref({ courseId:'dmd', session:1, date:today, title:'', slideFile:null, homeworkFile:null, hwDeadline:'', hwSubmission:'', hwDescription:'', references:[] })
const finForm = ref({ type:'expense', date:today, category:'activity', amount:null, description:'', activityId:'' })
const albForm = ref({ title:'', date:today, url:'', coverFile:null, description:'' })

function onSlideFile(e) { cmForm.value.slideFile = e.target.files[0] }
function onHomeworkFile(e) { cmForm.value.homeworkFile = e.target.files[0] }
function onRefFile(e, idx) { cmForm.value.references[idx].file = e.target.files[0] }
function onCoverFile(e) { albForm.value.coverFile = e.target.files[0] }

// ===== 树洞管理 =====
const treeholeAdminVerified = ref(false)
const treeholeTokenInput = ref('')
const treeholeTokenError = ref('')
const treeholeMessages = ref([])
const treeholeLoading = ref(false)
const treeholeSearch = ref('')
const treeholeIncludeDeleted = ref(true)
const treeholeSelected = ref([])
const treeholePagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const treeholeStats = ref({ total: 0, active_count: 0, deleted_count: 0, today_count: 0 })
const expandedId = ref(null)
let searchDebounceTimer = null

// 页面加载时检查sessionStorage中的Token
if (typeof window !== 'undefined') {
  const savedToken = sessionStorage.getItem('treehole_admin_token')
  if (savedToken) {
    treeholeTokenInput.value = savedToken
    // 延迟验证，等DOM就绪
    setTimeout(() => { verifyTreeholeToken(true) }, 300)
  }
}

async function verifyTreeholeToken(silent = false) {
  if (!treeholeTokenInput.value.trim()) {
    treeholeTokenError.value = '请输入Admin Token'
    return
  }
  treeholeTokenError.value = ''
  try {
    const res = await fetch(`/api/admin/treehole?page=1&limit=1`, {
      headers: { 'Authorization': `Bearer ${treeholeTokenInput.value.trim()}` }
    })
    if (res.ok) {
      treeholeAdminVerified.value = true
      sessionStorage.setItem('treehole_admin_token', treeholeTokenInput.value.trim())
      loadTreeholeMessages()
    } else {
      treeholeTokenError.value = 'Token无效'
      sessionStorage.removeItem('treehole_admin_token')
    }
  } catch (e) {
    if (!silent) treeholeTokenError.value = '验证失败: ' + e.message
  }
}

// 防抖搜索
function onTreeholeSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    treeholePagination.value.page = 1
    loadTreeholeMessages()
  }, 400)
}

function onIncludeDeletedChange() {
  treeholePagination.value.page = 1
  loadTreeholeMessages()
}

async function loadTreeholeMessages() {
  treeholeLoading.value = true
  treeholeSelected.value = []
  expandedId.value = null
  try {
    const params = new URLSearchParams({
      page: treeholePagination.value.page,
      limit: treeholePagination.value.limit,
      includeDeleted: treeholeIncludeDeleted.value,
    })
    if (treeholeSearch.value.trim()) {
      params.set('search', treeholeSearch.value.trim())
    }
    const res = await fetch(`/api/admin/treehole?${params}`, {
      headers: { 'Authorization': `Bearer ${treeholeTokenInput.value.trim()}` }
    })
    const data = await res.json()
    if (res.ok) {
      treeholeMessages.value = data.data || []
      treeholePagination.value = data.pagination || treeholePagination.value
      treeholeStats.value = data.stats || treeholeStats.value
    } else {
      alert('加载失败: ' + (data.error || res.statusText))
    }
  } catch (e) {
    alert('加载失败: ' + e.message)
  } finally {
    treeholeLoading.value = false
  }
}

// 全选逻辑
function getIsAllSelected() {
  if (treeholeMessages.value.length === 0) return false
  return treeholeMessages.value.every(m => treeholeSelected.value.includes(m.id))
}
function getIsIndeterminate() {
  const selectedInPage = treeholeMessages.value.filter(m => treeholeSelected.value.includes(m.id)).length
  return selectedInPage > 0 && selectedInPage < treeholeMessages.value.length
}
function toggleSelectAll() {
  if (getIsAllSelected()) {
    // 取消全选本页
    const pageIds = treeholeMessages.value.map(m => m.id)
    treeholeSelected.value = treeholeSelected.value.filter(id => !pageIds.includes(id))
  } else {
    // 全选本页
    const pageIds = treeholeMessages.value.map(m => m.id)
    treeholeSelected.value = [...new Set([...treeholeSelected.value, ...pageIds])]
  }
}
function clearSelection() {
  treeholeSelected.value = []
}

// 展开/收起详情
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

// 单条删除
async function deleteSingleTreehole(id) {
  if (!confirm('确定删除这条留言吗？删除后可在"包含已删除"中恢复。')) return
  try {
    const res = await fetch(`/api/treehole/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${treeholeTokenInput.value.trim()}` }
    })
    const data = await res.json()
    if (res.ok) {
      loadTreeholeMessages()
    } else {
      alert('删除失败: ' + (data.error || res.statusText))
    }
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

// 单条恢复
async function restoreSingleTreehole(id) {
  try {
    const res = await fetch('/api/admin/treehole/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${treeholeTokenInput.value.trim()}`
      },
      body: JSON.stringify({ ids: [id] })
    })
    const data = await res.json()
    if (res.ok) {
      loadTreeholeMessages()
    } else {
      alert('恢复失败: ' + (data.error || res.statusText))
    }
  } catch (e) {
    alert('恢复失败: ' + e.message)
  }
}

// 批量删除
async function batchDeleteTreehole() {
  if (treeholeSelected.value.length === 0) return
  if (!confirm(`确定批量删除选中的 ${treeholeSelected.value.length} 条留言吗？`)) return
  try {
    const res = await fetch('/api/admin/treehole/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${treeholeTokenInput.value.trim()}`
      },
      body: JSON.stringify({ ids: treeholeSelected.value })
    })
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      loadTreeholeMessages()
    } else {
      alert('删除失败: ' + (data.error || res.statusText))
    }
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

// 批量恢复
async function batchRestoreTreehole() {
  if (treeholeSelected.value.length === 0) return
  if (!confirm(`确定批量恢复选中的 ${treeholeSelected.value.length} 条留言吗？`)) return
  try {
    const res = await fetch('/api/admin/treehole/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${treeholeTokenInput.value.trim()}`
      },
      body: JSON.stringify({ ids: treeholeSelected.value })
    })
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      loadTreeholeMessages()
    } else {
      alert('恢复失败: ' + (data.error || res.statusText))
    }
  } catch (e) {
    alert('恢复失败: ' + e.message)
  }
}

// 导出CSV
function exportTreeholeCSV() {
  if (treeholeMessages.value.length === 0) {
    alert('当前没有可导出的留言')
    return
  }
  const headers = ['ID', '昵称', '内容', '时间', 'IP哈希', '状态']
  const rows = treeholeMessages.value.map(m => [
    m.id,
    m.nickname || '匿名',
    `"${(m.content || '').replace(/"/g, '""')}"`,
    new Date(m.created_at).toLocaleString('zh-CN'),
    m.ip_hash || '',
    m.is_deleted ? '已删除' : '正常',
  ])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `treehole_messages_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function treeholePageChange(page) {
  if (page < 1 || page > treeholePagination.value.totalPages) return
  treeholePagination.value.page = page
  loadTreeholeMessages()
}

function formatTreeholeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ===== 提交记录（数据源：GitHub admin-history.json）=====
const submitHistory = ref([])
const historyLoading = ref(false)
function createRecord(type, desc) {
  const r = { id: Date.now(), type, typeName: dataTypes.find(t=>t.id===type)?.name, description: desc, time: new Date().toLocaleString('zh-CN'), status:'pending', commitSha:null, error:null, reverted:false }
  submitHistory.value.unshift(r); return r
}
async function loadHistoryFromGithub() {
  if (!githubToken.value) return
  historyLoading.value = true
  try {
    const { records } = await fetchHistory(githubToken.value, REPO)
    submitHistory.value = records
  } catch(e) {
    console.warn('加载提交记录失败:', e.message)
  } finally {
    historyLoading.value = false
  }
}

// ===== 撤回提交 =====
const reverting = ref(false)
async function revertCommit(record) {
  if (!record.commitSha || record.reverted || reverting.value) return
  const ok = confirm(`确定要撤回这次提交吗？\n\n${record.description}\n\n注意：如果此次提交包含文件上传（PDF/图片等），已上传的文件不会被自动删除，需在GitHub上手动删除。`)
  if (!ok) return
  reverting.value = true
  try {
    // 1. 获取提交详情
    const commitRes = await ghApi(`/repos/${REPO}/commits/${record.commitSha}`)
    if (!commitRes.ok) throw new Error(`获取提交详情失败 ${commitRes.status}`)
    const commitData = await commitRes.json()
    const parentSha = commitData.parents[0]?.sha
    if (!parentSha) throw new Error('该提交没有parent，无法撤回')
    const files = commitData.files || []
    if (files.length === 0) throw new Error('该提交没有修改任何文件')

    let processed = 0
    for (const file of files) {
      if (file.status === 'modified') {
        // 恢复为parent版本
        const parentRes = await ghApi(`/repos/${REPO}/contents/${file.filename}?ref=${parentSha}`)
        if (!parentRes.ok) continue
        const parentData = await parentRes.json()
        const curRes = await ghApi(`/repos/${REPO}/contents/${file.filename}?ref=main`)
        if (!curRes.ok) continue
        const curData = await curRes.json()
        const putRes = await ghApi(`/repos/${REPO}/contents/${file.filename}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `[Revert] 撤回: ${record.description}`, content: parentData.content, sha: curData.sha, branch: 'main' })
        })
        if (putRes.ok) processed++
      } else if (file.status === 'added') {
        // 删除新增的文件
        const curRes = await ghApi(`/repos/${REPO}/contents/${file.filename}?ref=main`)
        if (!curRes.ok) continue
        const curData = await curRes.json()
        const delRes = await ghApi(`/repos/${REPO}/contents/${file.filename}`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `[Revert] 撤回新增文件: ${file.filename}`, sha: curData.sha, branch: 'main' })
        })
        if (delRes.ok) processed++
      } else if (file.status === 'removed') {
        // 恢复被删除的文件（从parent版本获取内容）
        const parentRes = await ghApi(`/repos/${REPO}/contents/${file.filename}?ref=${parentSha}`)
        if (!parentRes.ok) continue
        const parentData = await parentRes.json()
        const putRes = await ghApi(`/repos/${REPO}/contents/${file.filename}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `[Revert] 恢复文件: ${file.filename}`, content: parentData.content, branch: 'main' })
        })
        if (putRes.ok) processed++
      } else if (file.status === 'renamed') {
        // 重命名：删除新文件，恢复旧文件
        const curRes = await ghApi(`/repos/${REPO}/contents/${file.filename}?ref=main`)
        if (curRes.ok) {
          const curData = await curRes.json()
          await ghApi(`/repos/${REPO}/contents/${file.filename}`, {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `[Revert] 撤回重命名: 删除${file.filename}`, sha: curData.sha, branch: 'main' })
          })
        }
        if (file.previous_filename) {
          const oldRes = await ghApi(`/repos/${REPO}/contents/${file.previous_filename}?ref=${parentSha}`)
          if (oldRes.ok) {
            const oldData = await oldRes.json()
            await ghApi(`/repos/${REPO}/contents/${file.previous_filename}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: `[Revert] 恢复文件: ${file.previous_filename}`, content: oldData.content, branch: 'main' })
            })
          }
        }
        processed++
      }
    }
    if (processed === 0) throw new Error('没有文件被成功撤回')
    record.reverted = true
    try { await markReverted(githubToken.value, REPO, record.id, '管理员') } catch(e) { console.warn('更新撤回状态失败:', e.message) }
    alert(`撤回成功！已处理 ${processed} 个文件变更。\n如有上传的PDF/图片文件，请在GitHub上手动删除。`)
  } catch (e) {
    alert(`撤回失败: ${e.message}`)
  } finally {
    reverting.value = false
  }
}

// ===== 提交公告 =====
async function submitAnnouncement() {
  submitting.value = true
  const rec = createRecord('announcements', `发布公告: ${annForm.value.titleZh}`)
  try {
    // 自动翻译
    const [titleT, summaryT, contentT] = await Promise.all([
      translateBoth(annForm.value.titleZh),
      translateBoth(annForm.value.summaryZh),
      translateBoth(annForm.value.contentZh),
    ])
    const { data, sha } = await getFile('docs/public/data/announcements.json')
    const ann = {
      id: 'ann-' + Date.now(), date: annForm.value.date, category: annForm.value.category, pinned: annForm.value.pinned,
      title: { zh: annForm.value.titleZh, en: titleT.en, th: titleT.th },
      summary: { zh: annForm.value.summaryZh, en: summaryT.en, th: summaryT.th },
      content: { zh: annForm.value.contentZh, en: contentT.en, th: contentT.th },
    }
    if (annForm.value.deadline) ann.deadline = annForm.value.deadline
    data.announcements.unshift(ann)
    rec.commitSha = await putFile('docs/public/data/announcements.json', data, sha, `[Admin] 发布公告: ${annForm.value.titleZh}`)
    rec.status = 'success'
    annForm.value = { titleZh:'', category:'normal', date:today, deadline:'', pinned:false, summaryZh:'', contentZh:'' }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  if (rec.status === 'success') { try { await appendHistory(githubToken.value, REPO, rec) } catch(e) { console.warn('保存记录失败:', e.message) } }
}

// ===== 提交活动 =====
async function submitActivity() {
  submitting.value = true
  const rec = createRecord('activities', `添加活动: ${actForm.value.titleZh}`)
  try {
    // 自动翻译
    const [titleT, locT, descT] = await Promise.all([
      translateBoth(actForm.value.titleZh),
      translateBoth(actForm.value.locationZh || '待定'),
      translateBoth(actForm.value.descriptionZh || ''),
    ])
    const { data, sha } = await getFile('docs/public/data/activities.json')
    const act = {
      id: 'act-' + Date.now(), date: actForm.value.date, time: actForm.value.time || '待定',
      title: { zh: actForm.value.titleZh, en: titleT.en, th: titleT.th },
      location: { zh: actForm.value.locationZh || '待定', en: locT.en, th: locT.th },
      organizer: { zh: actForm.value.organizerZh || '班级筹备组', en: 'Class Committee', th: 'คณะกรรมการชั้นเรียน' },
      description: { zh: actForm.value.descriptionZh || '', en: descT.en, th: descT.th },
      tags: { hasMedia: actForm.value.hasMedia, involvesFinance: actForm.value.involvesFinance, cover: '' },
      capacity: actForm.value.capacity || 84, registered: actForm.value.registered || 0, status: 'upcoming',
    }
    data.activities.push(act)
    rec.commitSha = await putFile('docs/public/data/activities.json', data, sha, `[Admin] 添加活动: ${actForm.value.titleZh}`)
    rec.status = 'success'
    actForm.value = { titleZh:'', date:today, time:'', locationZh:'', organizerZh:'', descriptionZh:'', capacity:null, registered:0, hasMedia:false, involvesFinance:false }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  if (rec.status === 'success') { try { await appendHistory(githubToken.value, REPO, rec) } catch(e) { console.warn('保存记录失败:', e.message) } }
}

// ===== 提交课程资料 =====
async function submitCourseMaterial() {
  submitting.value = true
  const f = cmForm.value
  const rec = createRecord('courseMaterials', `添加${f.courseId}第${f.session}讲资料`)
  try {
    const dateStr = f.date.replace(/-/g, '')
    const basePath = `docs/public/files/courses/${f.courseId}/${dateStr}`
    const webBase = `/files/courses/${f.courseId}/${dateStr}`

    // 1. 上传课件PDF
    const slideName = f.slideFile.name
    await uploadBinary(`${basePath}/${slideName}`, f.slideFile, `[Admin] 上传课件: ${slideName}`)

    // 2. 上传作业PDF（如果有）
    let hwUrl = '', hwName = '', hwSize = ''
    if (f.homeworkFile) {
      hwName = f.homeworkFile.name
      await uploadBinary(`${basePath}/${hwName}`, f.homeworkFile, `[Admin] 上传作业: ${hwName}`)
      hwUrl = `${webBase}/${hwName}`; hwSize = formatSize(f.homeworkFile.size)
    }

    // 3. 上传参考资料
    const refs = []
    for (const ref of f.references) {
      if (ref.file) {
        await uploadBinary(`${basePath}/${ref.file.name}`, ref.file, `[Admin] 上传参考资料: ${ref.file.name}`)
        refs.push({ name: ref.name || ref.file.name, filename: ref.file.name, url: `${webBase}/${ref.file.name}`, size: formatSize(ref.file.size) })
      } else if (ref.desc) {
        refs.push({ name: ref.name, filename: '', url: '', desc: ref.desc })
      }
    }

    // 4. 更新JSON
    const { data, sha } = await getFile('docs/public/data/course-materials.json')
    const course = data.courses.find(c => c.id === f.courseId)
    if (!course) throw new Error('课程不存在')
    const session = {
      session: f.session, date: f.date, title: f.title,
      files: [{ name: f.title + ' 课件', filename: slideName, url: `${webBase}/${slideName}`, size: formatSize(f.slideFile.size), type: 'slide' }],
      references: refs,
    }
    if (f.homeworkFile) {
      session.homework = { name: f.title + ' 作业', deadline: f.hwDeadline, submission: f.hwSubmission || '待通知', description: f.hwDescription || '', filename: hwName, url: hwUrl, size: hwSize }
    }
    course.sessions.push(session)
    course.sessions.sort((a,b) => a.session - b.session)

    rec.commitSha = await putFile('docs/public/data/course-materials.json', data, sha, `[Admin] 添加${course.name}第${f.session}讲资料`)
    rec.status = 'success'
    cmForm.value = { courseId:'dmd', session:1, date:today, title:'', slideFile:null, homeworkFile:null, hwDeadline:'', hwSubmission:'', hwDescription:'', references:[] }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  if (rec.status === 'success') { try { await appendHistory(githubToken.value, REPO, rec) } catch(e) { console.warn('保存记录失败:', e.message) } }
}

// ===== 提交班费 =====
async function submitFinance() {
  submitting.value = true
  const rec = createRecord('finance', `添加班费${finForm.value.type==='income'?'收入':'支出'}: ${finForm.value.description}`)
  try {
    const { data, sha } = await getFile('docs/public/data/finance.json')
    const tx = { id: 'tx-' + Date.now(), date: finForm.value.date, type: finForm.value.type, category: finForm.value.category, amount: finForm.value.amount, description: finForm.value.description, activityId: finForm.value.activityId || null }
    data.transactions.push(tx)
    rec.commitSha = await putFile('docs/public/data/finance.json', data, sha, `[Admin] 添加班费记录: ${finForm.value.description}`)
    rec.status = 'success'
    finForm.value = { type:'expense', date:today, category:'activity', amount:null, description:'', activityId:'' }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  if (rec.status === 'success') { try { await appendHistory(githubToken.value, REPO, rec) } catch(e) { console.warn('保存记录失败:', e.message) } }
}

// ===== 提交相册 =====
async function submitAlbum() {
  submitting.value = true
  const rec = createRecord('gallery', `添加相册: ${albForm.value.title}`)
  try {
    const dateStr = albForm.value.date.replace(/-/g, '')
    const coverExt = albForm.value.coverFile.name.split('.').pop()
    const coverName = `cover-${dateStr}.${coverExt}`
    const coverPath = `docs/public/images/albums/${coverName}`

    // 1. 上传封面
    await uploadBinary(coverPath, albForm.value.coverFile, `[Admin] 上传相册封面: ${coverName}`)

    // 2. 更新JSON
    const { data, sha } = await getFile('docs/public/data/albums.json')
    const newId = Math.max(...data.albums.map(a=>a.id), 0) + 1
    data.albums.push({ id: newId, title: albForm.value.title, date: albForm.value.date, url: albForm.value.url, cover: `/images/albums/${coverName}`, description: albForm.value.description || '' })
    data.albums.sort((a,b) => new Date(b.date) - new Date(a.date))

    rec.commitSha = await putFile('docs/public/data/albums.json', data, sha, `[Admin] 添加相册: ${albForm.value.title}`)
    rec.status = 'success'
    albForm.value = { title:'', date:today, url:'', coverFile:null, description:'' }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  if (rec.status === 'success') { try { await appendHistory(githubToken.value, REPO, rec) } catch(e) { console.warn('保存记录失败:', e.message) } }
}

// ===== 初始化 =====
onMounted(() => {
  const t = localStorage.getItem('github_token'); if (t) { githubToken.value = t; testToken() }
})
</script>

<style scoped>
.admin-panel { max-width: 900px; margin: 0 auto; padding: 40px 20px; min-height: 80vh; }
.auth-screen { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.auth-card { background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 20px; padding: 48px 40px; text-align: center; width: 100%; max-width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); }
.auth-icon { font-size: 48px; margin-bottom: 16px; }
.auth-card h2 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
.auth-desc { color: var(--c-text-secondary); font-size: 14px; margin: 0 0 24px; }
.auth-input { width: 100%; padding: 12px 16px; border: 1.5px solid var(--c-border); border-radius: 12px; font-size: 15px; margin-bottom: 16px; background: var(--c-bg-secondary); color: var(--c-text-primary); box-sizing: border-box; }
.auth-input:focus { outline: none; border-color: var(--c-accent); }
.auth-btn { width: 100%; padding: 12px; background: var(--c-accent); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; }
.auth-btn:hover { opacity: 0.9; }
.auth-error { color: #ff3b30; font-size: 13px; margin-top: 12px; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-header h2 { font-size: 22px; font-weight: 700; margin: 0; }
.logout-btn { padding: 8px 16px; background: transparent; border: 1px solid var(--c-border); border-radius: 10px; color: var(--c-text-secondary); cursor: pointer; font-size: 13px; }
.logout-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }
.token-bar { display: flex; gap: 10px; align-items: center; background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; }
.token-input { flex: 1; padding: 10px 14px; border: 1px solid var(--c-border); border-radius: 10px; font-size: 13px; background: var(--c-bg-secondary); color: var(--c-text-primary); }
.token-btn { padding: 10px 18px; background: var(--c-accent); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.token-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.token-error { color: #ff3b30; font-size: 12px; }
.type-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.type-tab { padding: 10px 18px; background: var(--c-bg-card); border: 1.5px solid var(--c-border); border-radius: 12px; font-size: 14px; font-weight: 500; color: var(--c-text-secondary); cursor: pointer; transition: all 0.2s; }
.type-tab:hover { border-color: var(--c-accent); color: var(--c-accent); }
.type-tab.active { background: var(--c-accent); border-color: var(--c-accent); color: #fff; }
.form-section { background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
.form-section h3 { font-size: 18px; font-weight: 700; margin: 0 0 20px; }
.data-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--c-text-secondary); }
.form-group label .required { color: #ff3b30; margin-left: 2px; }
.form-group input, .form-group select, .form-group textarea { padding: 10px 14px; border: 1px solid var(--c-border); border-radius: 10px; font-size: 14px; background: var(--c-bg-secondary); color: var(--c-text-primary); font-family: inherit; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--c-accent); }
.checkbox-group { justify-content: flex-end; }
.checkbox-row { display: flex; gap: 24px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--c-text-primary); cursor: pointer; }
.file-input { padding: 8px; }
.file-info { font-size: 13px; color: var(--c-accent); margin-top: 4px; }
.i18n-details { border: 1px solid var(--c-border); border-radius: 10px; padding: 12px 16px; }
.i18n-details summary { cursor: pointer; font-size: 13px; font-weight: 600; color: var(--c-text-secondary); }
.i18n-details .form-group { margin-top: 12px; }
.ref-item { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
.ref-name { flex: 1; min-width: 150px; padding: 8px 12px; border: 1px solid var(--c-border); border-radius: 8px; font-size: 13px; background: var(--c-bg-secondary); color: var(--c-text-primary); }
.ref-desc { flex: 1; min-width: 150px; padding: 8px 12px; border: 1px solid var(--c-border); border-radius: 8px; font-size: 13px; background: var(--c-bg-secondary); color: var(--c-text-primary); }
.ref-remove { padding: 6px 10px; background: transparent; border: 1px solid var(--c-border); border-radius: 8px; color: var(--c-text-tertiary); cursor: pointer; font-size: 12px; }
.ref-remove:hover { border-color: #ff3b30; color: #ff3b30; }
.add-ref-btn { padding: 8px 16px; background: transparent; border: 1px dashed var(--c-accent); border-radius: 8px; color: var(--c-accent); cursor: pointer; font-size: 13px; align-self: flex-start; }
.add-ref-btn:hover { background: var(--c-accent-light); }
.submit-btn { padding: 14px; background: var(--c-accent); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.history-section { background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 16px; padding: 24px; }
.history-section h3 { font-size: 18px; font-weight: 700; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
.history-count { font-size: 13px; font-weight: 400; color: var(--c-text-tertiary); }
.history-loading { font-size: 12px; color: var(--c-text-tertiary); font-weight: 400; }
.history-empty { text-align: center; padding: 32px; color: var(--c-text-tertiary); font-size: 14px; }
.history-item { padding: 16px; border: 1px solid var(--c-border); border-radius: 12px; margin-bottom: 12px; background: var(--c-bg-secondary); }
.history-info { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.history-time { font-size: 12px; color: var(--c-text-tertiary); }
.history-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 8px; }
.badge-success { background: rgba(52,199,89,0.15); color: #34c759; }
.badge-failed { background: rgba(255,59,48,0.15); color: #ff3b30; }
.badge-pending { background: rgba(255,149,0,0.15); color: #ff9500; }
.history-type { font-size: 12px; color: var(--c-text-secondary); }
.history-desc { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
.history-sha { font-size: 12px; color: var(--c-text-tertiary); margin-bottom: 4px; }
.history-sha code { background: var(--c-bg-card); padding: 2px 6px; border-radius: 4px; }
.history-error { font-size: 12px; color: #ff3b30; margin-bottom: 4px; }
.reverted-tag { font-size: 12px; color: var(--c-text-tertiary); }
.revert-btn { margin-top: 8px; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 8px; border: 1px solid #ff3b30; color: #ff3b30; background: transparent; cursor: pointer; transition: all 0.2s ease; }
.revert-btn:hover { background: #ff3b30; color: #fff; }
.revert-btn:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 640px) {
  .form-row { grid-template-columns: 1fr; }
  .token-bar { flex-direction: column; align-items: stretch; }
  .admin-panel { padding: 20px 16px; }
  .checkbox-row { flex-direction: column; gap: 8px; }
  .treehole-toolbar { flex-direction: column; align-items: stretch; }
  .treehole-item { flex-direction: column; gap: 8px; }
}

/* ===== 树洞管理样式 ===== */
.treehole-auth { text-align: center; padding: 32px 24px; }
.treehole-auth-desc { font-size: 14px; color: var(--c-text-secondary); margin: 0 0 16px; }
.treehole-auth-row { display: flex; gap: 8px; justify-content: center; }

/* 统计卡片 */
.treehole-stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 12px; padding: 16px; text-align: center; transition: border-color 0.2s; }
.stat-card:hover { border-color: var(--c-accent-light); }
.stat-card-num { font-size: 28px; font-weight: 800; color: var(--c-text-primary); line-height: 1.2; }
.stat-card-label { font-size: 12px; color: var(--c-text-tertiary); margin-top: 4px; }
.stat-card-active .stat-card-num { color: var(--c-accent); }
.stat-card-deleted .stat-card-num { color: #ff3b30; }
.stat-card-today .stat-card-num { color: #ff9500; }

/* 工具栏 */
.treehole-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.treehole-search { flex: 1; min-width: 200px; padding: 10px 14px; border: 1px solid var(--c-border); border-radius: 10px; font-size: 14px; background: var(--c-bg-secondary); color: var(--c-text-primary); transition: border-color 0.2s; }
.treehole-search:focus { outline: none; border-color: var(--c-accent); }
.treehole-checkbox { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--c-text-secondary); cursor: pointer; white-space: nowrap; }
.treehole-export-btn { padding: 10px 16px; background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--c-text-primary); white-space: nowrap; transition: border-color 0.2s; }
.treehole-export-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }
.treehole-batch-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.treehole-selected-count { font-size: 13px; color: var(--c-accent); font-weight: 600; }
.treehole-delete-btn { padding: 8px 14px; background: #ff3b30; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.treehole-delete-btn:hover { opacity: 0.85; }
.treehole-restore-btn { padding: 8px 14px; background: #34c759; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.treehole-restore-btn:hover { opacity: 0.85; }

/* 全选栏 */
.treehole-select-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--c-bg-secondary); border-radius: 8px; margin-bottom: 10px; }
.treehole-select-all { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--c-text-secondary); cursor: pointer; }
.treehole-clear-btn { padding: 4px 12px; background: transparent; border: 1px solid var(--c-border); border-radius: 6px; font-size: 12px; cursor: pointer; color: var(--c-text-tertiary); }
.treehole-clear-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }

/* 列表 */
.treehole-loading { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 32px; color: var(--c-text-tertiary); font-size: 14px; }
.treehole-empty { text-align: center; padding: 40px 20px; color: var(--c-text-tertiary); font-size: 14px; }
.treehole-list { display: flex; flex-direction: column; gap: 8px; }
.treehole-item { display: flex; gap: 12px; padding: 14px 16px; border: 1px solid var(--c-border); border-radius: 12px; background: var(--c-bg-secondary); align-items: flex-start; transition: border-color 0.2s; }
.treehole-item:hover { border-color: var(--c-accent-light); }
.treehole-item.deleted { opacity: 0.55; background: var(--c-bg-card); }
.treehole-item.expanded { border-color: var(--c-accent); background: var(--c-bg-card); }
.treehole-item-check { padding-top: 2px; flex-shrink: 0; }
.treehole-item-content { flex: 1; min-width: 0; cursor: pointer; }
.treehole-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.treehole-item-nickname { font-size: 13px; font-weight: 600; color: var(--c-accent); }
.treehole-item-time { font-size: 12px; color: var(--c-text-tertiary); }
.treehole-item-ip { font-size: 11px; color: var(--c-text-tertiary); font-family: monospace; }
.treehole-item-deleted-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: rgba(255,59,48,0.15); color: #ff3b30; }
.treehole-expand-icon { font-size: 10px; color: var(--c-text-tertiary); margin-left: auto; }
.treehole-item-text { font-size: 14px; line-height: 1.5; color: var(--c-text-primary); margin: 0; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.treehole-item.expanded .treehole-item-text { -webkit-line-clamp: unset; }
.treehole-item-actions { flex-shrink: 0; display: flex; gap: 6px; }
.treehole-single-delete { padding: 6px 12px; background: transparent; border: 1px solid #ff3b30; color: #ff3b30; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.treehole-single-delete:hover { background: #ff3b30; color: #fff; }
.treehole-single-restore { padding: 6px 12px; background: transparent; border: 1px solid #34c759; color: #34c759; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.treehole-single-restore:hover { background: #34c759; color: #fff; }

/* 详情展开 */
.treehole-item-detail { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--c-border); }
.detail-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px; }
.detail-label { color: var(--c-text-tertiary); flex-shrink: 0; }
.detail-value { color: var(--c-text-secondary); word-break: break-all; }
.detail-value.mono { font-family: monospace; }
.detail-value.text-red { color: #ff3b30; font-weight: 600; }
.detail-value.text-green { color: #34c759; font-weight: 600; }
.detail-full-content { background: var(--c-bg-secondary); padding: 10px 12px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: var(--c-text-primary); white-space: pre-wrap; word-break: break-word; margin-top: 4px; }

/* 分页 */
.treehole-pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
.treehole-page-btn { padding: 8px 16px; background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 8px; font-size: 13px; cursor: pointer; color: var(--c-text-primary); }
.treehole-page-btn:hover:not(:disabled) { border-color: var(--c-accent); }
.treehole-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.treehole-page-info { font-size: 13px; color: var(--c-text-secondary); }

.spinner-sm { width: 16px; height: 16px; border: 2px solid var(--c-border); border-top-color: var(--c-accent); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .treehole-stat-cards { grid-template-columns: repeat(2, 1fr); }
  .treehole-toolbar { flex-direction: column; align-items: stretch; }
  .treehole-batch-actions { margin-left: 0; flex-wrap: wrap; }
  .treehole-item { flex-direction: column; gap: 8px; }
  .treehole-item-actions { width: 100%; }
}
</style>
