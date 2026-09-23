<template>
  <div class="admin-panel">
    <!-- ===== 未登录：班委账号登录 ===== -->
    <div v-if="!isAuthenticated" class="auth-screen">
      <div class="auth-card">
        <div class="auth-icon">🔒</div>
        <h2>班级网站管理后台</h2>
        <p class="auth-desc">班委请用注册账号登录</p>
        <input v-model="loginUsername" placeholder="用户名" class="auth-input"
          @keyup.enter="doLogin" />
        <input type="password" v-model="loginPassword" placeholder="密码" class="auth-input"
          @keyup.enter="doLogin" />
        <button @click="doLogin" class="auth-btn" :disabled="loginLoading">
          {{ loginLoading ? '登录中…' : '登 录' }}
        </button>
        <p v-if="authError" class="auth-error">{{ authError }}</p>
        <p class="auth-hint">还没有账号？请先<a href="/auth/?tab=register">注册</a>，班委注册后系统会自动识别身份</p>
      </div>
    </div>

    <!-- ===== 已登录但非班委：无权限 ===== -->
    <div v-else-if="!currentUser.role" class="auth-screen">
      <div class="auth-card">
        <div class="auth-icon">🚫</div>
        <h2>没有访问权限</h2>
        <p class="auth-desc">管理后台仅班委可使用。<br />当前以「{{ currentUser.name }}」登录。</p>
        <button @click="logout" class="auth-btn">退出登录</button>
      </div>
    </div>

    <!-- ===== 管理主界面 ===== -->
    <div v-else class="admin-main">
      <header class="admin-header">
        <h2>📋 班级网站管理后台</h2>
        <div class="admin-identity">
          <span class="identity-name">{{ currentUser.name }}</span>
          <span class="identity-role">{{ roleLabel }}</span>
          <button @click="logout" class="logout-btn">退出</button>
        </div>
      </header>

      <!-- 数据库与 R2 已就绪 -->
      <div class="token-bar">
        <span class="token-badge">✓ 数据库与 R2 已连接</span>
      </div>

      <!-- 类型标签（按角色过滤，只显示自己管辖的模块） -->
      <div class="type-tabs">
        <button v-for="t in visibleTypes" :key="t.id" @click="currentType = t.id"
          :class="{ active: currentType === t.id }" class="type-tab">
          {{ t.icon }} {{ t.name }}
        </button>
      </div>

      <div class="admin-workspace">
      <div class="workspace-left">
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
                <option value="activity">🎉 活动</option>
                <option value="poll">🗳️ 投票</option>
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
          <button type="submit" class="submit-btn" :disabled="submitting">
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
            <div class="form-group"><label>开始时间</label><input type="time" v-model="actForm.startTime" /></div>
            <div class="form-group"><label>结束时间</label><input type="time" v-model="actForm.endTime" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>地点</label><input v-model="actForm.locationZh" placeholder="政立院区 B403" /></div>
            <div class="form-group"><label>组织者</label><input v-model="actForm.organizerZh" placeholder="班级筹备组" /></div>
          </div>
          <div class="form-group"><label>活动描述</label><textarea v-model="actForm.descriptionZh" rows="3"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>报名人数上限</label><input type="number" v-model.number="actForm.capacity" placeholder="84" /></div>
            <div class="form-group"><label>已报名人数</label><input type="number" v-model.number="actForm.registered" placeholder="0" /></div>
          </div>
          <div class="form-row checkbox-row">
            <label class="checkbox-label"><input type="checkbox" v-model="actForm.hasMedia" /> 📷 有相册/图片直播</label>
            <label class="checkbox-label"><input type="checkbox" v-model="actForm.involvesFinance" /> 💰 涉及班费</label>
          </div>
          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交并发布' }}
          </button>
        </form>
      </div>

      <!-- ===== 投票表单 ===== -->
      <div v-if="currentType === 'polls'" class="form-section">
        <h3>🗳️ 发布投票</h3>
        <form @submit.prevent="submitPoll" class="data-form">
          <div class="form-group"><label>投票标题 <span class="required">*</span></label><input v-model="pollForm.titleZh" placeholder="下次班级聚餐地点投票" /></div>
          <div class="form-group"><label>投票描述</label><textarea v-model="pollForm.descriptionZh" rows="2" placeholder="简单说明投票背景"></textarea></div>
          <div class="form-row">
            <div class="form-group">
              <label>投票类型</label>
              <select v-model="pollForm.type">
                <option value="single">单选</option>
                <option value="multiple">多选</option>
              </select>
            </div>
            <div class="form-group">
              <label>匿名方式</label>
              <select v-model="pollForm.anonymous">
                <option :value="false">实名投票</option>
                <option :value="true">匿名投票</option>
              </select>
            </div>
            <div class="form-group">
              <label>结果可见性</label>
              <select v-model="pollForm.visibility">
                <option value="always">实时可见</option>
                <option value="after_vote">投票后可见</option>
                <option value="after_deadline">截止后可见</option>
                <option value="creator_only">仅发起人可见</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>截止时间 <span class="required">*</span></label><input type="datetime-local" v-model="pollForm.deadline" /></div>

          <div class="form-group">
            <label>投票选项 <span class="required">*</span></label>
            <div class="poll-options-editor">
              <div v-for="(opt, idx) in pollForm.options" :key="idx" class="poll-option-row">
                <span class="poll-option-num">{{ idx + 1 }}</span>
                <input v-model="opt.textZh" :placeholder="`选项 ${idx + 1} 文字`" class="poll-option-input" />
                <label class="poll-option-img-btn">
                  <input type="file" accept="image/*" class="hidden-file" @change="onPollOptionImage($event, idx)" />
                  {{ opt.imageFile ? '✓ 已选图' : '📷 图片' }}
                </label>
                <button type="button" class="poll-option-del" @click="removePollOption(idx)" :disabled="pollForm.options.length <= 2">×</button>
              </div>
            </div>
            <button type="button" class="add-option-btn" @click="addPollOption">+ 添加选项</button>
          </div>

          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? '提交中...' : '发布投票' }}
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
          <button type="submit" class="submit-btn" :disabled="submitting || !cmForm.slideFile">
            {{ submitting ? '上传中...（PDF较大请稍候）' : '上传文件并提交' }}
          </button>
        </form>

        <div class="existing-list">
          <h4>当前课件与资料（{{ cmFiles.length }}）</h4>
          <p v-if="!cmFiles.length" class="empty-hint">暂无资料</p>
          <div v-for="item in cmFiles" :key="item.fileUrl" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">{{ item.name }}</span>
              <span class="existing-meta">{{ item.courseName }} · {{ item.kind }} · {{ item.size }}</span>
            </div>
            <button type="button" class="existing-del" @click="deleteCourseFile(item)">删除</button>
          </div>
        </div>
      </div>

      <!-- ===== 知识库表单 ===== -->
      <div v-if="currentType === 'knowledge'" class="form-section">
        <h3>📖 上传知识库资料</h3>
        <form @submit.prevent="submitKnowledge" class="data-form">
          <div class="form-row">
            <div class="form-group">
              <label>分类 <span class="required">*</span></label>
              <select v-model="kbForm.courseId">
                <option v-for="c in kbCourses" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name?.zh || c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>类型 <span class="required">*</span></label>
              <select v-model="kbForm.type">
                <option value="note">📝 课程笔记</option>
                <option value="summary">🔖 重点总结</option>
                <option value="exam">📋 考题参考</option>
                <option value="resource">📦 学习资源</option>
                <option value="calendar">📅 校历</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>日期 <span class="required">*</span></label><input type="date" v-model="kbForm.date" required /></div>
            <div class="form-group"><label>标题 <span class="required">*</span></label><input v-model="kbForm.title" required placeholder="资料标题" /></div>
          </div>
          <div class="form-group"><label>作者 / 来源</label><input v-model="kbForm.author" placeholder="班级 / 供稿同学" /></div>
          <div class="form-group">
            <label>资料文件（PDF / 图片）<span class="required">*</span></label>
            <input type="file" accept=".pdf,image/*" @change="onKbFile" class="file-input" />
            <span v-if="kbForm.file" class="file-info">📄 {{ kbForm.file.name }} ({{ formatSize(kbForm.file.size) }})</span>
          </div>
          <button type="submit" class="submit-btn" :disabled="submitting || !kbForm.file">
            {{ submitting ? '上传中...（文件较大请稍候）' : '上传文件并提交' }}
          </button>
        </form>

        <div class="existing-list">
          <h4>当前资料（{{ kbDocuments.length }}）</h4>
          <p v-if="!kbDocuments.length" class="empty-hint">暂无资料</p>
          <div v-for="doc in kbDocuments" :key="doc.id" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">{{ doc.title?.zh || doc.title }}</span>
              <span class="existing-meta">{{ doc.courseId }} · {{ doc.date }} · {{ doc.size }}</span>
            </div>
            <button type="button" class="existing-del" @click="deleteKnowledgeDoc(doc)">删除</button>
          </div>
        </div>
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
          <div class="form-group"><label>关联活动（可选）</label>
            <select v-model="finForm.activityId">
              <option value="">不关联任何活动</option>
              <option v-for="act in activitiesList" :key="act.id" :value="act.id">{{ act.date }} · {{ act.title.zh || act.title }}</option>
            </select>
          </div>
          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交并发布' }}
          </button>
        </form>

        <div class="existing-list">
          <h4>当前流水（{{ finTransactions.length }}）</h4>
          <p v-if="!finTransactions.length" class="empty-hint">暂无流水</p>
          <div v-for="tx in finTransactions" :key="tx.id" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">
                <span :class="tx.type==='income' ? 'tx-income' : 'tx-expense'">{{ tx.type==='income' ? '收入' : '支出' }}</span>
                ¥{{ tx.amount }} · {{ tx.description }}
              </span>
              <span class="existing-meta">{{ tx.date }}</span>
            </div>
            <button type="button" class="existing-del" @click="deleteFinanceTx(tx)">删除</button>
          </div>
        </div>
      </div>

      <!-- ===== 相册表单 ===== -->
      <div v-if="currentType === 'gallery'" class="form-section">
        <h3>🖼️ 添加活动相册</h3>
        <form @submit.prevent="submitAlbum" class="data-form">
          <div class="form-row">
            <div class="form-group"><label>活动标题 <span class="required">*</span></label><input v-model="albForm.title" required /></div>
            <div class="form-group"><label>日期 <span class="required">*</span></label><input type="date" v-model="albForm.date" required /></div>
          </div>
          <div class="form-group">
            <label>相册类型 <span class="required">*</span></label>
            <div class="radio-row">
              <label class="radio-label"><input type="radio" value="live" v-model="albForm.albumType" /> 🔗 图片直播链接</label>
              <label class="radio-label"><input type="radio" value="local" v-model="albForm.albumType" /> 📁 本地上传照片</label>
            </div>
          </div>
          <div v-if="albForm.albumType === 'live'" class="form-group"><label>图片直播链接 <span class="required">*</span></label><input v-model="albForm.url" placeholder="https://live.photoplus.cn/live/..." /></div>
          <div v-if="albForm.albumType === 'local'" class="form-group">
            <label>上传照片（超过1M自动压缩，可多选）</label>
            <input type="file" accept="image/*" multiple @change="onLocalPhotos" class="file-input" />
            <div v-if="albForm.localPhotos.length" class="photo-preview-list">
              <div v-for="(p, i) in albForm.localPhotos" :key="i" class="photo-preview-item">
                <img :src="p.previewUrl" class="photo-thumb" />
                <span class="photo-name">{{ p.name }}</span>
                <span class="photo-size">{{ formatSize(p.compressedSize || p.size) }}</span>
                <button type="button" class="photo-remove" @click="removeLocalPhoto(i)">×</button>
              </div>
            </div>
          </div>
          <div class="form-group"><label>封面图 <span class="required">*</span></label>
            <input type="file" accept="image/*" @change="onCoverFile" class="file-input" />
            <span v-if="albForm.coverFile" class="file-info">🖼️ {{ albForm.coverFile.name }} ({{ formatSize(albForm.coverFile.size) }})</span>
          </div>
          <div class="form-group"><label>描述（可选）</label><input v-model="albForm.description" placeholder="一句话描述活动" /></div>
          <button type="submit" class="submit-btn" :disabled="submitting || !albForm.coverFile || (albForm.albumType === 'live' && !albForm.url) || (albForm.albumType === 'local' && albForm.localPhotos.length === 0)">
            {{ submitting ? '上传中...' : '上传并提交' }}
          </button>
        </form>
      </div>

      <!-- ===== 树洞管理 ===== -->
      <div v-if="currentType === 'treehole'" class="form-section treehole-admin">
        <h3>🌳 匿名树洞管理</h3>

        <!-- 管理界面 -->
        <div>
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
      </div><!-- /workspace-left -->

      <div class="workspace-right">
      <!-- ===== 提交记录 ===== -->
      <div class="history-section">
        <h3>📜 提交记录 <span class="history-count">({{ submitHistory.length }}条)</span> <span v-if="historyLoading" class="history-loading">加载中...</span></h3>
        <div v-if="submitHistory.length === 0" class="history-empty">暂无提交记录</div>
        <div v-for="record in submitHistory" :key="record.id" class="history-item">
          <div class="history-card">
            <div class="history-row1">
              <span class="history-badge" :class="'badge-' + record.status">
                {{ record.status === 'success' ? '✓' : record.status === 'failed' ? '✗' : record.status === 'reverted' ? '↩' : '⏳' }}
              </span>
              <span class="history-type">{{ record.typeName }}</span>
              <span class="history-operator">{{ record.operator }}</span>
            </div>
            <div class="history-desc">{{ record.description }}</div>
            <div class="history-time">{{ shortTime(record.time) }}</div>
            <div v-if="record.error" class="history-error">{{ record.error }}</div>
          </div>
          <button v-if="record.status === 'success'" class="revert-btn" @click="revertCommit(record)" title="撤回此提交">↩</button>
        </div>
      </div>
      </div><!-- /workspace-right -->
      </div><!-- /admin-workspace -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { fetchWithRetry } from '../utils/fetchWithRetry.js'

import { API_PREFIX } from '../composables/apiConfig.js'
import { useAuth } from '../composables/useAuth.js'

// ===== 认证（班委实名登录；登录态由 useAuth 用 localStorage 持久化，刷新/重开免登录）=====
const { currentUser, isAuthenticated, login, logout, getToken } = useAuth()
const loginUsername = ref('')
const loginPassword = ref('')
const loginLoading = ref(false)
const authError = ref('')
async function doLogin() {
  if (!loginUsername.value.trim() || !loginPassword.value) {
    authError.value = '请输入用户名和密码'; return
  }
  loginLoading.value = true; authError.value = ''
  const r = await login({ username: loginUsername.value.trim(), password: loginPassword.value })
  loginLoading.value = false
  if (!r.success) authError.value = r.error
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB'
  return (bytes/1048576).toFixed(1) + ' MB'
}

// ===== 自动翻译已停用：英/泰字段暂以中文填充，不请求外部、不阻塞提交；后续需要可人工补译 =====
function translateBoth(text) {
  return Promise.resolve({ en: text, th: text })
}

// ===== 数据类型 =====
const dataTypes = [
  { id: 'announcements', name: '公告', icon: '📢' },
  { id: 'activities', name: '活动', icon: '🎉' },
  { id: 'polls', name: '投票', icon: '🗳️' },
  { id: 'courseMaterials', name: '课程资料', icon: '📚' },
  { id: 'knowledge', name: '知识库', icon: '📖' },
  { id: 'finance', name: '班费', icon: '💰' },
  { id: 'gallery', name: '相册', icon: '🖼️' },
  { id: 'treehole', name: '树洞管理', icon: '🌳' },
]
const currentType = ref('announcements')

// 各模块允许的角色（与 functions/_utils.js 的 MODULE_ROLES 保持一致，改动需同步）
// leader/deputy/supervisor 可见并可写全部模块；其余角色只看到本职能模块。
const MODULE_ROLE_MAP = {
  announcements: ['leader', 'deputy', 'experience', 'finance', 'thinktank', 'memory'],
  activities: ['leader', 'deputy', 'experience'],
  polls: ['leader', 'deputy', 'experience'],
  courseMaterials: ['leader', 'deputy', 'thinktank'],
  knowledge: ['leader', 'deputy', 'thinktank'],
  finance: ['leader', 'deputy', 'finance'],
  gallery: ['leader', 'deputy', 'memory'],
  treehole: ['leader', 'deputy', 'memory'],
}
const ROLE_LABEL_MAP = {
  leader: '班级主理人', deputy: '副主理人', experience: '体验运营官',
  finance: '财务激励官', thinktank: '智库研究员', memory: '记忆主理人',
  supervisor: '独立董事会',
}
// 按当前登录用户角色过滤可见模块：
// 主理人/副主理人/独立董事会看全部（均可写）；其余角色按本职能过滤。
const visibleTypes = computed(() => {
  const role = currentUser.value?.role
  if (!role) return []
  if (role === 'leader' || role === 'deputy' || role === 'supervisor') return dataTypes
  return dataTypes.filter(t => (MODULE_ROLE_MAP[t.id] || []).includes(role))
})
const roleLabel = computed(() => ROLE_LABEL_MAP[currentUser.value?.role] || '')
// 登录/角色变化后，若当前模块不在可见范围，自动切到第一个可见模块
watch(visibleTypes, (list) => {
  if (list.length && !list.some(t => t.id === currentType.value)) {
    currentType.value = list[0].id
  }
}, { immediate: true })

const submitting = ref(false)

// ===== 表单数据 =====
const today = new Date().toISOString().split('T')[0]
const annForm = ref({ titleZh:'', category:'normal', date:today, deadline:'', pinned:false, summaryZh:'', contentZh:'' })
const actForm = ref({ titleZh:'', date:today, startTime:'', endTime:'', locationZh:'', organizerZh:'', descriptionZh:'', capacity:null, registered:0, hasMedia:false, involvesFinance:false })
const cmForm = ref({ courseId:'dmd', session:1, date:today, title:'', slideFile:null, homeworkFile:null, hwDeadline:'', hwSubmission:'', hwDescription:'', references:[] })
const cmFiles = ref([])
const kbForm = ref({ courseId:'general', type:'note', date:today, title:'', author:'', file:null })
const kbDocuments = ref([])
const kbCourses = ref([])
const finForm = ref({ type:'expense', date:today, category:'activity', amount:null, description:'', activityId:'' })
const finTransactions = ref([])
const activitiesList = ref([])
async function loadActivitiesForSelect() {
  try {
    const res = await fetchWithRetry('/data/activities.json')
    if (res.ok) {
      const data = await res.json()
      activitiesList.value = (data.activities || []).slice().sort((a, b) => b.date.localeCompare(a.date))
    }
  } catch (e) { console.warn('加载活动列表失败:', e) }
}
const albForm = ref({ title:'', date:today, url:'', albumType:'live', coverFile:null, localPhotos:[], description:'' })

// 投票表单
const pollForm = ref({
  titleZh: '', descriptionZh: '',
  type: 'single', anonymous: false,
  visibility: 'after_vote',
  deadline: '',
  options: [
    { textZh: '', imageFile: null },
    { textZh: '', imageFile: null },
  ],
})
function addPollOption() { pollForm.value.options.push({ textZh: '', imageFile: null }) }
function removePollOption(idx) { if (pollForm.value.options.length > 2) pollForm.value.options.splice(idx, 1) }
function onPollOptionImage(e, idx) { pollForm.value.options[idx].imageFile = e.target.files[0] }

function onSlideFile(e) { cmForm.value.slideFile = e.target.files[0] }
function onHomeworkFile(e) { cmForm.value.homeworkFile = e.target.files[0] }
function onKbFile(e) { kbForm.value.file = e.target.files[0] }
function onRefFile(e, idx) { cmForm.value.references[idx].file = e.target.files[0] }
function onCoverFile(e) { albForm.value.coverFile = e.target.files[0] }

// ===== 图片压缩（超过1M自动压缩到质量0.8）=====
const MAX_IMAGE_SIZE = 1024 * 1024 // 1MB
async function compressImage(file) {
  if (file.size <= MAX_IMAGE_SIZE) return file
  return new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        // 限制最大边长1920
        let w = img.width, h = img.height
        const maxDim = 1920
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h)
          w = Math.round(w * ratio); h = Math.round(h * ratio)
        }
        canvas.width = w; canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => {
          if (blob) {
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
            resolve(compressed)
          } else resolve(file)
        }, 'image/jpeg', 0.82)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 本地上传照片
async function onLocalPhotos(e) {
  const files = Array.from(e.target.files)
  for (const file of files) {
    const compressed = await compressImage(file)
    albForm.value.localPhotos.push({
      file: compressed,
      name: compressed.name,
      size: file.size,
      compressedSize: compressed.size,
      previewUrl: URL.createObjectURL(compressed),
    })
  }
  e.target.value = ''
}
function removeLocalPhoto(index) {
  URL.revokeObjectURL(albForm.value.localPhotos[index].previewUrl)
  albForm.value.localPhotos.splice(index, 1)
}

// ===== 树洞管理 =====
const treeholeMessages = ref([])
const treeholeLoading = ref(false)
const treeholeSearch = ref('')
const treeholeIncludeDeleted = ref(true)
const treeholeSelected = ref([])
const treeholePagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const treeholeStats = ref({ total: 0, active_count: 0, deleted_count: 0, today_count: 0 })
const expandedId = ref(null)
let searchDebounceTimer = null

// ===== Cloudflare 后端 admin API（直连，不再走 GitHub 代理写文件）=====
// Authorization 使用当前登录班委的个人 token（getToken），原样 Bearer 带上。
function getAdminToken() {
  return getToken() || ''
}
function adminHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}`, ...extra }
}
// 统一处理非 2xx：读出后端错误信息
async function throwIfNotOk(res, action) {
  if (res.ok) return
  let msg = `${action}失败 ${res.status}`
  try { const e = await res.json(); if (e && e.error) msg = e.error } catch {}
  throw new Error(msg)
}
function randomHex(n) {
  const arr = new Uint8Array(n)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr)
  else for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}
function extFromFileName(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || '')
  return m ? m[1].toLowerCase() : 'bin'
}
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = String(reader.result || '')
      resolve(s.includes(',') ? s.slice(s.indexOf(',') + 1) : s)
    }
    reader.onerror = () => reject(reader.error || new Error('FileReader 读取失败'))
    reader.readAsDataURL(file)
  })
}
// 上传图片/PDF：File -> base64 -> POST /api/admin/upload -> { url }
async function uploadFileToAdmin(file, customKey) {
  const key = customKey || `uploads/${Date.now()}-${randomHex(4)}.${extFromFileName(file.name)}`
  const dataBase64 = await readFileAsBase64(file)
  const res = await fetchWithRetry(`${API_PREFIX}/api/admin/upload`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ key, contentType: file.type || 'application/octet-stream', dataBase64 }),
  })
  await throwIfNotOk(res, '上传文件')
  const data = await res.json()
  if (!data.url) throw new Error('上传未返回 url')
  return data.url
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
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/treehole?${params}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
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
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/treehole/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ ids: [id] })
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
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/treehole/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
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
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/treehole/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
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
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/treehole/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
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

// ===== 提交记录（数据源：D1 admin_history 表）=====
const submitHistory = ref([])
const historyLoading = ref(false)
function shortTime(t){ if(!t) return ''; const [d,h]=t.split('T'); return `${d.slice(5)} ${h.slice(0,5)}` }
function createRecord(type, desc, refId = null) {
  const r = {
    id: 'h-' + Date.now() + '-' + randomHex(3),
    type, typeName: dataTypes.find(t => t.id === type)?.name || type,
    description: desc, time: new Date().toLocaleString('zh-CN'),
    status: 'pending', error: null, ref_id: refId,
  }
  submitHistory.value.unshift(r)
  return r
}
// 加载历史记录（DB）
async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/history`, { headers: adminHeaders() })
    if (res.ok) {
      const j = await res.json()
      submitHistory.value = Array.isArray(j.records) ? j.records : []
    }
  } catch (e) {
    console.warn('加载提交记录失败:', e.message)
  } finally {
    historyLoading.value = false
  }
}
// 操作记录已由后端写端点统一写入 admin_history（含真名 operator、准确 action），
// 前端不再重复 POST；此函数保留为空以兼容现有调用点。
async function saveRecord(_rec) { /* no-op：后端 logHistory 已记录 */ }

// ===== 撤回提交（DB：标记 reverted + 按类型删除关联内容）=====
const reverting = ref(false)
async function revertCommit(record) {
  if (record.status === 'reverted' || reverting.value) return
  const supported = ['announcements', 'activities', 'polls']
  const tip = supported.includes(record.type)
    ? '\n\n将同时删除对应的内容。'
    : '\n\n该类型仅标记撤回，具体内容请人工核对。'
  const ok = confirm(`确定要撤回这次提交吗？\n\n${record.description}${tip}`)
  if (!ok) return
  reverting.value = true
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/history/revert`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ id: record.id, type: record.type, ref_id: record.ref_id }),
    })
    await throwIfNotOk(res, '撤回')
    const j = await res.json().catch(() => ({}))
    record.status = 'reverted'
    let msg = '撤回成功'
    if (j.note) msg += '\n' + j.note
    alert(msg)
  } catch (e) {
    alert(`撤回失败: ${e.message}`)
  } finally {
    reverting.value = false
  }
}

// ===== 提交公告（直连 Cloudflare：POST /api/admin/announcements，body 为完整公告对象含 id）=====
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
    const ann = {
      id: 'ann-' + Date.now(), date: annForm.value.date, category: annForm.value.category, pinned: annForm.value.pinned,
      title: { zh: annForm.value.titleZh, en: titleT.en, th: titleT.th },
      summary: { zh: annForm.value.summaryZh, en: summaryT.en, th: summaryT.th },
      content: { zh: annForm.value.contentZh, en: contentT.en, th: contentT.th },
    }
    if (annForm.value.deadline) ann.deadline = annForm.value.deadline
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/announcements`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(ann),
    })
    await throwIfNotOk(res, '发布公告')
    rec.ref_id = ann.id
    rec.status = 'success'
    annForm.value = { titleZh:'', category:'normal', date:today, deadline:'', pinned:false, summaryZh:'', contentZh:'' }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 提交活动（直连 Cloudflare：POST /api/admin/activities，body 为完整活动对象含 id）=====
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
    const act = {
      id: 'act-' + Date.now(), date: actForm.value.date, time: (actForm.value.startTime && actForm.value.endTime) ? `${actForm.value.startTime} - ${actForm.value.endTime}` : '待定',
      title: { zh: actForm.value.titleZh, en: titleT.en, th: titleT.th },
      location: { zh: actForm.value.locationZh || '待定', en: locT.en, th: locT.th },
      organizer: { zh: actForm.value.organizerZh || '班级筹备组', en: 'Class Committee', th: 'คณะกรรมการชั้นเรียน' },
      description: { zh: actForm.value.descriptionZh || '', en: descT.en, th: descT.th },
      tags: { hasMedia: actForm.value.hasMedia, involvesFinance: actForm.value.involvesFinance, cover: '' },
      capacity: actForm.value.capacity || 84, registered: actForm.value.registered || 0, status: 'upcoming',
    }
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/activities`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(act),
    })
    await throwIfNotOk(res, '添加活动')
    rec.ref_id = act.id
    rec.status = 'success'
    actForm.value = { titleZh:'', date:today, startTime:'', endTime:'', locationZh:'', organizerZh:'', descriptionZh:'', capacity:null, registered:0, hasMedia:false, involvesFinance:false }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 提交课程资料（PDF 存 R2，元数据存 D1）=====
async function getCurrentCourseMaterials() {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const r = await fetchWithRetry(`${API_PREFIX}/api/course-materials-db`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (r.ok) {
      const j = await r.json()
      if (Array.isArray(j?.courses)) return j
    }
  } catch (e) { /* 回退静态 */ }
  const res = await fetchWithRetry('/data/course-materials.json')
  if (!res.ok) throw new Error('读取课程资料失败')
  return res.json()
}
async function submitCourseMaterial() {
  submitting.value = true
  const f = cmForm.value
  const rec = createRecord('courseMaterials', `添加${f.courseId}第${f.session}讲资料`)
  try {
    const dateStr = f.date.replace(/-/g, '')
    const r2Base = `files/courses/${f.courseId}/${dateStr}`

    // 1. 课件 PDF → R2
    const slideUrl = await uploadFileToAdmin(f.slideFile, `${r2Base}/${f.slideFile.name}`)

    // 2. 作业 PDF → R2
    let homework = null
    if (f.homeworkFile) {
      const hwUrl = await uploadFileToAdmin(f.homeworkFile, `${r2Base}/${f.homeworkFile.name}`)
      homework = {
        name: f.title + ' 作业', deadline: f.hwDeadline,
        submission: f.hwSubmission || '待通知', description: f.hwDescription || '',
        filename: f.homeworkFile.name, url: hwUrl, size: formatSize(f.homeworkFile.size),
      }
    }

    // 3. 参考资料 → R2 / 纯描述
    const references = []
    for (const ref of f.references) {
      if (ref.file) {
        const u = await uploadFileToAdmin(ref.file, `${r2Base}/${ref.file.name}`)
        references.push({ name: ref.name || ref.file.name, filename: ref.file.name, url: u, size: formatSize(ref.file.size) })
      } else if (ref.desc) {
        references.push({ name: ref.name, filename: '', url: '', desc: ref.desc })
      }
    }

    // 4. 读整包、追加本讲、写回 DB
    const pack = await getCurrentCourseMaterials()
    if (!Array.isArray(pack.courses)) pack.courses = []
    const course = pack.courses.find(c => c.id === f.courseId)
    if (!course) throw new Error('课程不存在')
    if (!Array.isArray(course.sessions)) course.sessions = []
    const session = {
      session: Number(f.session), date: f.date, title: f.title,
      files: [{ name: f.title + ' 课件', filename: f.slideFile.name, url: slideUrl, size: formatSize(f.slideFile.size), type: 'slide' }],
      references,
    }
    if (homework) session.homework = homework
    course.sessions.push(session)
    course.sessions.sort((a, b) => Number(a.session) - Number(b.session))

    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/course-materials`, {
      method: 'PUT', headers: adminHeaders(), body: JSON.stringify(pack),
    })
    await throwIfNotOk(res, '保存课程资料')
    rec.status = 'success'
    cmForm.value = { courseId:'dmd', session:1, date:today, title:'', slideFile:null, homeworkFile:null, hwDeadline:'', hwSubmission:'', hwDescription:'', references:[] }
    await loadCourseFiles()
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 知识库（整包：DB 优先，失败回退静态 JSON）=====
async function getCurrentKnowledgePack() {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const r = await fetchWithRetry(`${API_PREFIX}/api/knowledge-db`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (r.ok) {
      const j = await r.json()
      if (Array.isArray(j?.courses) && j.courses.length) return j
    }
  } catch (e) { /* 回退静态 */ }
  const res = await fetchWithRetry('/data/knowledge-base.json')
  if (!res.ok) throw new Error('读取知识库失败')
  return res.json()
}
async function submitKnowledge() {
  submitting.value = true
  const f = kbForm.value
  const rec = createRecord('knowledge', `上传知识库资料: ${f.title}`)
  try {
    if (!f.file) throw new Error('请选择要上传的文件')
    const dateStr = f.date.replace(/-/g, '')
    const r2Key = `files/knowledge/${f.courseId}/${dateStr}/${f.file.name}`
    const url = await uploadFileToAdmin(f.file, r2Key)

    const pack = await getCurrentKnowledgePack()
    if (!Array.isArray(pack.documents)) pack.documents = []
    const nextId = pack.documents.reduce((m, d) => Math.max(m, Number(d.id) || 0), 0) + 1
    pack.documents.push({
      id: nextId,
      courseId: f.courseId,
      type: f.type,
      title: { zh: f.title, en: f.title, th: f.title },
      author: f.author || '班级',
      date: f.date,
      size: formatSize(f.file.size),
      url,
    })

    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/knowledge`, {
      method: 'PUT', headers: adminHeaders(), body: JSON.stringify(pack),
    })
    await throwIfNotOk(res, '保存知识库资料')
    rec.status = 'success'
    kbForm.value = { courseId:'general', type:'note', date:today, title:'', author:'', file:null }
    await loadKbCourses()
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 提交班费（直连 Cloudflare：整包 PUT /api/admin/finance，body {transactions, activityFinances}）=====
// 先读当前班费包（DB 优先，失败回退静态 JSON），追加新流水后整包写回。
async function getCurrentFinancePack() {
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/finance-db`)
    if (res.ok) {
      const j = await res.json()
      if (Array.isArray(j?.transactions)) {
        return { transactions: j.transactions, activityFinances: Array.isArray(j.activityFinances) ? j.activityFinances : [] }
      }
    }
  } catch (e) { /* 回退静态 */ }
  const res = await fetchWithRetry('/data/finance.json')
  const j = await res.json()
  return { transactions: j.transactions || [], activityFinances: j.activityFinances || [] }
}
async function submitFinance() {
  submitting.value = true
  const rec = createRecord('finance', `添加班费${finForm.value.type==='income'?'收入':'支出'}: ${finForm.value.description}`)
  try {
    const pack = await getCurrentFinancePack()
    const tx = { id: 'tx-' + Date.now(), date: finForm.value.date, type: finForm.value.type, category: finForm.value.category, amount: finForm.value.amount, description: finForm.value.description, activityId: finForm.value.activityId || null }
    pack.transactions.push(tx)
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ transactions: pack.transactions, activityFinances: pack.activityFinances }),
    })
    await throwIfNotOk(res, '添加班费记录')
    rec.status = 'success'
    finForm.value = { type:'expense', date:today, category:'activity', amount:null, description:'', activityId:'' }
    await loadFinanceTransactions()
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 课程资料 / 班费：当前内容列表与单条删除 =====
function flattenCourseFiles(pack) {
  const out = []
  for (const c of pack.courses || []) {
    for (const sess of c.sessions || []) {
      for (const f of sess.files || [])
        out.push({ courseName: c.name, kind: '课件', name: f.name, size: f.size, fileUrl: f.url })
      if (sess.homework?.url)
        out.push({ courseName: c.name, kind: '作业', name: sess.homework.name, size: sess.homework.size, fileUrl: sess.homework.url })
      for (const r of sess.references || []) if (r.url)
        out.push({ courseName: c.name, kind: '参考', name: r.name, size: r.size, fileUrl: r.url })
    }
  }
  return out
}
async function loadCourseFiles() {
  try { const pack = await getCurrentCourseMaterials(); cmFiles.value = flattenCourseFiles(pack) }
  catch (e) { console.warn('加载课件列表失败:', e.message) }
}
async function deleteCourseFile(item) {
  if (!confirm(`确定删除「${item.name}」吗？\n将同时删除 R2 中的文件，并记录操作人。`)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/course-materials`, {
      method: 'DELETE', headers: adminHeaders(), body: JSON.stringify({ fileUrl: item.fileUrl }),
    })
    await throwIfNotOk(res, '删除课件')
    cmFiles.value = cmFiles.value.filter(x => x.fileUrl !== item.fileUrl)
  } catch (e) { alert('删除失败: ' + e.message) }
}
async function loadFinanceTransactions() {
  try { const pack = await getCurrentFinancePack(); finTransactions.value = pack.transactions || [] }
  catch (e) { console.warn('加载流水列表失败:', e.message) }
}
async function deleteFinanceTx(tx) {
  if (!confirm(`确定删除这条${tx.type==='income'?'收入':'支出'}流水吗？\n将记录操作人。`)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance`, {
      method: 'DELETE', headers: adminHeaders(), body: JSON.stringify({ txId: tx.id }),
    })
    await throwIfNotOk(res, '删除流水')
    finTransactions.value = finTransactions.value.filter(t => String(t.id) !== String(tx.id))
  } catch (e) { alert('删除失败: ' + e.message) }
}

// ===== 提交相册（封面/照片存 R2，媒体信息挂到对应活动的 tags 上）=====
async function getCurrentActivities() {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const r = await fetchWithRetry(`${API_PREFIX}/api/activities-db`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (r.ok) {
      const j = await r.json()
      if (Array.isArray(j?.activities)) return j
    }
  } catch (e) { /* 回退静态 */ }
  const res = await fetchWithRetry('/data/activities.json')
  if (!res.ok) throw new Error('读取活动失败')
  return res.json()
}
async function submitAlbum() {
  submitting.value = true
  const f = albForm.value
  const rec = createRecord('gallery', `添加相册: ${f.title}`)
  try {
    const dateStr = f.date.replace(/-/g, '')
    const coverExt = (f.coverFile.name.split('.').pop() || 'jpg').toLowerCase()
    const coverName = `cover-${dateStr}.${coverExt}`

    // 1. 封面 → R2
    const coverUrl = await uploadFileToAdmin(f.coverFile, `images/albums/${coverName}`)

    // 2. 本地照片 → R2
    let localPhotos = []
    if (f.albumType === 'local') {
      for (let i = 0; i < f.localPhotos.length; i++) {
        const fileName = `${String(i + 1).padStart(2, '0')}.jpg`
        localPhotos.push(await uploadFileToAdmin(f.localPhotos[i].file, `images/albums/local-${dateStr}/${fileName}`))
      }
    }

    // 媒体标签（Gallery 读取这些字段）
    const mediaTags = {
      hasMedia: true,
      cover: coverUrl,
      mediaType: f.albumType,
      mediaUrl: f.albumType === 'live' ? f.url : '',
      localPhotos: f.albumType === 'local' ? localPhotos : [],
      photoCount: f.albumType === 'local' ? localPhotos.length : 0,
    }

    // 3. 读活动整包，找同日期活动；没有则新建
    const pack = await getCurrentActivities()
    if (!Array.isArray(pack.activities)) pack.activities = []
    let act = pack.activities.find(a => a.date === f.date)
    if (act) {
      act.tags = { ...(act.tags || {}), ...mediaTags }
    } else {
      act = {
        id: 'act-' + Date.now(), date: f.date, time: '待定',
        title: { zh: f.title, en: f.title, th: f.title },
        location: { zh: '待定', en: 'TBD', th: 'รอแจ้ง' },
        organizer: { zh: '记忆主理', en: 'Memory Steward', th: 'ผู้ดูแลความทรงจำ' },
        description: { zh: f.description || '', en: '', th: '' },
        tags: { involvesFinance: false, ...mediaTags },
        capacity: 84, registered: 0, status: 'upcoming',
      }
    }

    // 4. 单条 upsert 活动
    const actRes = await fetchWithRetry(`${API_PREFIX}/api/admin/activities`, {
      method: 'PUT', headers: adminHeaders(), body: JSON.stringify(act),
    })
    await throwIfNotOk(actRes, '保存相册')
    rec.status = 'success'
    rec.ref_id = act.id
    albForm.value.localPhotos.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl))
    albForm.value = { title:'', date:today, url:'', albumType:'live', coverFile:null, localPhotos:[], description:'' }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 提交投票（直连 Cloudflare：POST /api/admin/polls-admin；选项图走 /api/admin/upload 拿 url）=====
async function submitPoll() {
  submitting.value = true
  const rec = createRecord('polls', `发布投票: ${pollForm.value.titleZh}`)
  try {
    // 自动翻译标题和描述
    const [titleT, descT] = await Promise.all([
      translateBoth(pollForm.value.titleZh),
      translateBoth(pollForm.value.descriptionZh || ''),
    ])
    // 翻译选项文字
    const optionTranslations = await Promise.all(
      pollForm.value.options.map(opt => translateBoth(opt.textZh || ''))
    )

    // 上传选项图片：File -> base64 -> /api/admin/upload -> { url }，不再传 GitHub
    const pollId = 'poll-' + Date.now()
    const optionImages = []
    for (let i = 0; i < pollForm.value.options.length; i++) {
      const opt = pollForm.value.options[i]
      if (opt.imageFile) {
        const url = await uploadFileToAdmin(opt.imageFile)
        optionImages.push(url)
      } else {
        optionImages.push(null)
      }
    }

    const poll = {
      id: pollId,
      title: { zh: pollForm.value.titleZh, en: titleT.en, th: titleT.th },
      description: { zh: pollForm.value.descriptionZh || '', en: descT.en, th: descT.th },
      type: pollForm.value.type,
      anonymous: pollForm.value.anonymous,
      visibility: pollForm.value.visibility,
      deadline: pollForm.value.deadline ? new Date(pollForm.value.deadline).toISOString() : '',
      created_at: new Date().toISOString(),
      creator: 'admin',
      options: pollForm.value.options.map((opt, i) => ({
        id: 'opt-' + (i + 1),
        text: { zh: opt.textZh, en: optionTranslations[i].en, th: optionTranslations[i].th },
        image: optionImages[i],
        votes: 0,
      })),
      voters: [],
    }
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/polls-admin`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(poll),
    })
    await throwIfNotOk(res, '发布投票')
    rec.ref_id = pollId
    rec.status = 'success'
    pollForm.value = {
      titleZh: '', descriptionZh: '', type: 'single', anonymous: false,
      visibility: 'after_vote', deadline: '',
      options: [{ textZh: '', imageFile: null }, { textZh: '', imageFile: null }],
    }
  } catch(e) { rec.status='failed'; rec.error=e.message }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 初始化 =====
async function loadKbCourses() {
  try {
    const pack = await getCurrentKnowledgePack()
    kbCourses.value = Array.isArray(pack.courses) ? pack.courses : []
    kbDocuments.value = Array.isArray(pack.documents) ? pack.documents : []
  } catch (e) { console.warn('加载知识库分类失败:', e) }
}

// 直接删除单条资料（DB 记录 + R2 文件，由后端处理并记录操作人）
async function deleteKnowledgeDoc(doc) {
  const title = typeof doc.title === 'object' ? (doc.title?.zh || doc.title) : doc.title
  if (!confirm(`确定删除「${title}」吗？\n将同时删除 R2 中的文件，并记录操作人。`)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/knowledge`, {
      method: 'DELETE', headers: adminHeaders(), body: JSON.stringify({ docId: doc.id }),
    })
    await throwIfNotOk(res, '删除资料')
    kbDocuments.value = kbDocuments.value.filter(d => String(d.id) !== String(doc.id))
  } catch (e) { alert('删除失败: ' + e.message) }
}
onMounted(() => {
  if (isAuthenticated.value) loadHistory()
})
// 登录成功后加载提交记录
watch(isAuthenticated, (v) => { if (v) loadHistory() })
watch(currentType, (val) => {
  if (val === 'courseMaterials') loadCourseFiles()
  if (val === 'finance') { loadFinanceTransactions(); if (activitiesList.value.length === 0) loadActivitiesForSelect() }
  if (val === 'treehole' && treeholeMessages.value.length === 0) loadTreeholeMessages()
  if (val === 'knowledge' && kbCourses.value.length === 0) loadKbCourses()
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
.auth-hint { color: var(--c-text-tertiary); font-size: 12px; margin-top: 18px; line-height: 1.7; }
.auth-hint a { color: var(--c-accent); text-decoration: none; font-weight: 600; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-header h2 { font-size: 22px; font-weight: 700; margin: 0; }
.logout-btn { padding: 8px 16px; background: transparent; border: 1px solid var(--c-border); border-radius: 10px; color: var(--c-text-secondary); cursor: pointer; font-size: 13px; }
.logout-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }
.admin-identity { display: flex; align-items: center; gap: 12px; }
.identity-name { font-size: 14px; font-weight: 600; color: var(--c-text-primary); }
.identity-role { font-size: 12px; color: #fff; background: var(--c-accent); padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
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
.radio-row { display: flex; gap: 24px; flex-wrap: wrap; }
.radio-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; }
.photo-preview-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.photo-preview-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: var(--c-bg-secondary); border-radius: 10px; }
.photo-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
.photo-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.photo-size { font-size: 12px; color: var(--c-text-tertiary); }
.photo-remove { width: 24px; height: 24px; border: none; background: var(--c-bg-tertiary); border-radius: 50%; cursor: pointer; font-size: 16px; line-height: 1; color: var(--c-text-secondary); }
.photo-remove:hover { background: #ff3b30; color: #fff; }
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

/* 投票选项编辑器 */
.poll-options-editor { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.poll-option-row { display: flex; align-items: center; gap: 10px; }
.poll-option-num { width: 24px; height: 24px; border-radius: 50%; background: var(--c-accent-light); color: var(--c-accent); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.poll-option-input { flex: 1; padding: 9px 12px; border: 1px solid var(--c-border); border-radius: 8px; font-size: 13px; background: var(--c-bg-secondary); color: var(--c-text-primary); }
.poll-option-input:focus { outline: none; border-color: var(--c-accent); }
.poll-option-img-btn { padding: 8px 12px; border: 1px solid var(--c-border); border-radius: 8px; font-size: 12px; color: var(--c-text-secondary); cursor: pointer; white-space: nowrap; background: var(--c-bg-secondary); transition: all 0.2s; }
.poll-option-img-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }
.hidden-file { display: none; }
.poll-option-del { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--c-border); background: transparent; color: var(--c-text-tertiary); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
.poll-option-del:hover:not(:disabled) { border-color: #ff3b30; color: #ff3b30; }
.poll-option-del:disabled { opacity: 0.3; cursor: not-allowed; }
.add-option-btn { padding: 8px 16px; background: transparent; border: 1px dashed var(--c-accent); border-radius: 8px; color: var(--c-accent); cursor: pointer; font-size: 13px; }
.add-option-btn:hover { background: var(--c-accent-light); }

.submit-btn { padding: 14px; background: var(--c-accent); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
/* ===== 左右分栏：左表单 / 右提交记录 ===== */
.admin-workspace { display: grid; grid-template-columns: minmax(0,1.55fr) minmax(300px,0.92fr); gap: 20px; align-items: start; margin-top: 4px; }
.workspace-left { min-width: 0; }
.workspace-right { min-width: 0; position: sticky; top: 76px; max-height: calc(100vh - 92px); overflow-y: auto; }

.history-section { background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 16px; padding: 16px; }
.history-section h3 { font-size: 15px; font-weight: 700; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; position: sticky; top: -16px; background: var(--c-bg-card); padding: 2px 0 10px; z-index: 1; }
.history-count { font-size: 12px; font-weight: 400; color: var(--c-text-tertiary); }
.history-loading { font-size: 12px; color: var(--c-text-tertiary); font-weight: 400; }
.history-empty { text-align: center; padding: 24px; color: var(--c-text-tertiary); font-size: 13px; }

.history-item { display: flex; gap: 8px; align-items: flex-start; padding: 10px; border: 1px solid var(--c-border); border-radius: 10px; margin-bottom: 8px; background: var(--c-bg-secondary); }
.history-card { flex: 1; min-width: 0; }
.history-row1 { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; flex-wrap: wrap; }
.history-badge { font-size: 11px; font-weight: 700; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; flex: none; }
.badge-success { background: rgba(52,199,89,0.16); color: #34c759; }
.badge-failed { background: rgba(255,59,48,0.16); color: #ff3b30; }
.badge-pending { background: rgba(255,149,0,0.16); color: #ff9500; }
.badge-reverted { background: rgba(142,142,147,0.18); color: #8e8e93; }
.history-type { font-size: 12px; font-weight: 600; color: var(--c-text-secondary); }
.history-operator { font-size: 12px; color: var(--c-text-tertiary); margin-left: auto; }
.history-desc { font-size: 13px; font-weight: 500; margin-bottom: 3px; line-height: 1.4; word-break: break-word; }
.history-time { font-size: 11px; color: var(--c-text-tertiary); }
.history-error { font-size: 11px; color: #ff3b30; margin-top: 3px; }
.revert-btn { font-size: 12px; width: 26px; height: 26px; flex: none; border-radius: 8px; border: 1px solid #ff3b30; color: #ff3b30; background: transparent; cursor: pointer; transition: all 0.2s ease; line-height: 1; }
.revert-btn:hover { background: #ff3b30; color: #fff; }
.revert-btn:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 960px) {
  .admin-workspace { grid-template-columns: 1fr; }
  .workspace-right { position: static; max-height: none; overflow: visible; }
  .history-section h3 { position: static; }
}
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

.existing-list { margin-top: 20px; border-top: 1px solid var(--c-border); padding-top: 16px; }
.existing-list h4 { margin: 0 0 10px; font-size: 14px; color: var(--c-text); }
.empty-hint { font-size: 13px; color: var(--c-text-tertiary); }
.existing-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px; border-radius: 10px; background: var(--c-bg-tertiary); margin-bottom: 8px; }
.existing-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.existing-title { font-size: 13px; font-weight: 600; color: var(--c-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.existing-meta { font-size: 11px; color: var(--c-text-tertiary); }
.existing-del { flex-shrink: 0; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 8px; border: 1px solid #ff3b30; color: #ff3b30; background: transparent; cursor: pointer; transition: all .2s; }
.existing-del:hover { background: #ff3b30; color: #fff; }
.tx-income { color: #ff3b30; font-weight: 700; }
.tx-expense { color: #248a3d; font-weight: 700; }
</style>
