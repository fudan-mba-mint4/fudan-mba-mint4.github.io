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

      <!-- 统一操作提示（提交成功/失败） -->
      <transition name="toast-fade">
        <div v-if="toastMsg" class="admin-toast" :class="toastType">{{ toastMsg }}</div>
      </transition>

      <!-- 数据库与 R2 已就绪 -->
      <div class="token-bar">
        <span class="token-badge">✓ 数据库与 R2 已连接</span>
      </div>

      <!-- 类型标签（按角色过滤，只显示自己管辖的模块） -->
      <div class="type-tabs">
        <button v-for="t in visibleTypes" :key="t.id" @click="currentType = t.id"
          :class="{ active: currentType === t.id }" class="type-tab">
          {{ t.icon }} {{ t.name }}
          <span v-if="todoBadges[t.id]" class="todo-badge">{{ todoBadges[t.id] > 99 ? '99+' : todoBadges[t.id] }}</span>
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
            <label>摘要（可选）</label>
            <input v-model="annForm.summaryZh" placeholder="一句话摘要（不填则自动取正文开头）" />
          </div>
          <div class="form-group">
            <label>内容主体 <span class="required">*</span></label>
            <textarea v-model="annForm.contentZh" rows="5" required></textarea>
          </div>
          <button type="submit" class="submit-btn" :disabled="submitting || !annCanSubmit">
            {{ submitting ? '提交中...' : '提交并发布' }}
          </button>
        </form>
      </div>

      <!-- ===== 活动模块（统一布局试点：动作栏 + 新建展开 + 现有列表） ===== -->
      <div v-if="currentType === 'activities'" class="module-section">
        <!-- 动作栏：统计（可点击筛选）+ 新建 -->
        <ModuleBar :stats="actStats" :active="actStageFilter" add-label="＋ 新建活动" @toggle="toggleActFilter" @add="openActForm" />

        <!-- 新建/编辑表单（展开式） -->
        <div v-if="actFormOpen" class="module-form">
        <h3>{{ actForm.id ? '✏️ 编辑活动' : '🎉 添加活动' }}</h3>
        <form @submit.prevent="submitActivity" class="data-form">
          <div class="form-row">
            <div class="form-group" style="flex:1.6"><label>活动标题 <span class="required">*</span></label><input v-model="actForm.titleZh" required placeholder="如：11月班级团建" /></div>
            <div class="form-group">
              <label>类型 <span class="required">*</span></label>
              <select v-model="actForm.stage" @change="resetActForm(true)">
                <option v-for="s in ACT_STAGE_OPTIONS" :key="s.key" :value="s.key">{{ s.label }}</option>
              </select>
            </div>
          </div>
          <div class="form-row" v-if="actForm.stage !== 'reminder'">
            <div class="form-group">
              <label>分类</label>
              <select v-model="actForm.category">
                <option v-for="c in ACT_CATEGORY_OPTIONS" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="form-group" v-if="actForm.stage === 'planning'">
              <label>规模</label>
              <select v-model="actForm.scale">
                <option value="">请选择</option>
                <option v-for="s in ACT_SCALE_OPTIONS" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <!-- 已定活动 -->
          <template v-if="actForm.stage === 'dated'">
            <div class="form-row">
              <div class="form-group"><label>开始日期 <span class="required">*</span></label><input type="date" v-model="actForm.date" required /></div>
              <div class="form-group"><label>结束日期（可选，跨天用）</label><input type="date" v-model="actForm.endDate" /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>时间（可选）</label><input v-model="actForm.time" placeholder="如：14:00 - 17:00" /></div>
              <div class="form-group"><label>规模（可选）</label>
                <select v-model="actForm.scale">
                  <option value="">不填</option>
                  <option v-for="s in ACT_SCALE_OPTIONS" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>地点</label><input v-model="actForm.locationZh" placeholder="如：政立院区 B403" /></div>
              <div class="form-group"><label>组织者</label><input v-model="actForm.organizerZh" placeholder="如：班级筹备组" /></div>
            </div>
            <div class="form-group"><label>活动描述</label><textarea v-model="actForm.descriptionZh" rows="2"></textarea></div>
            <div class="form-row">
              <div class="form-group"><label>报名人数上限（0 或留空=不开放报名）</label><input type="number" min="0" v-model.number="actForm.capacity" placeholder="0" /></div>
              <div class="form-group"><label>已报名人数</label><input type="number" min="0" v-model.number="actForm.registered" placeholder="0" /></div>
            </div>
          </template>

          <!-- 待排期 -->
          <template v-if="actForm.stage === 'planning'">
            <div class="form-row">
              <div class="form-group"><label>预计时间（可选）</label><input v-model="actForm.time" placeholder="如：11月中旬 / 周末下午" /></div>
              <div class="form-group"><label>规模（可选）</label>
                <select v-model="actForm.scale">
                  <option value="">不填</option>
                  <option v-for="s in ACT_SCALE_OPTIONS" :key="s.key" :value="s.key">{{ s }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>拟邀地点（可选）</label><input v-model="actForm.locationZh" placeholder="如：政立院区 / 校外" /></div>
              <div class="form-group"><label>组织者（可选）</label><input v-model="actForm.organizerZh" placeholder="如：班级筹备组" /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>报名人数上限（0 或留空=不开放报名）</label><input type="number" min="0" v-model.number="actForm.capacity" placeholder="0" /></div>
              <div class="form-group"><label>已报名人数</label><input type="number" min="0" v-model.number="actForm.registered" placeholder="0" /></div>
            </div>
            <div class="form-group"><label>备注说明（可选）</label><textarea v-model="actForm.descriptionZh" rows="2" placeholder="想办什么、预计时间等，欢迎同学在许愿池提议"></textarea></div>
          </template>

          <!-- 固定每周 -->
          <template v-if="actForm.stage === 'recurring'">
            <div class="form-group">
              <label>每周几 <span class="required">*</span></label>
              <div class="week-chips">
                <button v-for="w in WEEK_OPTIONS" :key="w.key" type="button" class="week-chip" :class="{ on: actForm.recurDays.includes(w.key) }" @click="toggleRecurDay(w.key)">{{ w.label }}</button>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>固定时间（可选）</label><input v-model="actForm.recurTime" placeholder="如：19:00 / 下午" /></div>
              <div class="form-group"><label>地点</label><input v-model="actForm.locationZh" placeholder="如：南操 / 佘山" /></div>
            </div>
            <div class="form-group"><label>活动描述</label><textarea v-model="actForm.descriptionZh" rows="2"></textarea></div>
          </template>

          <!-- 节日提醒 -->
          <template v-if="actForm.stage === 'reminder'">
            <div class="form-group">
              <label>节日类型</label>
              <select v-model="actForm.holidayType">
                <option v-for="h in ACT_HOLIDAY_TYPES" :key="h.key" :value="h.key">{{ h.label }}</option>
              </select>
            </div>
            <div class="form-row" v-if="actForm.holidayType === 'annual'">
              <div class="form-group"><label>月份 <span class="required">*</span></label><input type="number" min="1" max="12" v-model.number="actForm.annualMonth" placeholder="10" /></div>
              <div class="form-group"><label>日期 <span class="required">*</span></label><input type="number" min="1" max="31" v-model.number="actForm.annualDay" placeholder="1" /></div>
            </div>
            <div class="form-row" v-if="actForm.holidayType === 'floating'">
              <div class="form-group"><label>月份 <span class="required">*</span></label><input type="number" min="1" max="12" v-model.number="actForm.floatingMonth" placeholder="5" /></div>
              <div class="form-group"><label>第几个 <span class="required">*</span></label><input type="number" min="1" max="5" v-model.number="actForm.floatingOrdinal" placeholder="2" /></div>
              <div class="form-group">
                <label>星期几 <span class="required">*</span></label>
                <select v-model.number="actForm.floatingWeekday">
                  <option value="">选择</option>
                  <option v-for="w in WEEK_OPTIONS" :key="w.key" :value="w.key">星期{{ w.label }}</option>
                </select>
              </div>
            </div>
            <div class="form-row" v-if="actForm.holidayType === 'lunar'">
              <div class="form-group"><label>农历月 <span class="required">*</span></label><input type="number" min="1" max="12" v-model.number="actForm.lunarMonth" placeholder="8" /></div>
              <div class="form-group"><label>农历日 <span class="required">*</span></label><input type="number" min="1" max="30" v-model.number="actForm.lunarDay" placeholder="15" /></div>
            </div>
            <p v-if="actForm.holidayType === 'lunarEve' || actForm.holidayType === 'calculated'" class="mgr-hint">无需额外参数，将按{{ actForm.holidayType === 'lunarEve' ? '农历年末自动计算除夕' : '节气算法自动计算清明' }}。</p>
            <div class="form-group"><label>说明（可选）</label><textarea v-model="actForm.descriptionZh" rows="2" placeholder="节日祝福文案等"></textarea></div>
          </template>

          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="submitting || !actCanSubmit">
              {{ submitting ? '提交中...' : (actForm.id ? '保存修改' : '发布') }}
            </button>
            <button type="button" class="existing-del" @click="closeActForm">取消</button>
          </div>
        </form>
        </div><!-- /module-form -->

        <!-- 现有活动列表（编辑/删除） -->
        <div class="module-list">
          <div class="module-list-head">
            <h4>现有活动{{ actStageFilter ? ' · ' + actStageLabel(actStageFilter) : '' }}（{{ filteredActList.length }}）</h4>
          </div>
          <p v-if="!filteredActList.length" class="empty-hint">{{ actStageFilter ? '该分类暂无活动，点击统计可切换筛选' : '暂无活动，点上方「新建活动」发布第一个' }}</p>
          <div v-for="a in filteredActList.slice(0, 30)" :key="a.id" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">
                <span :class="'act-stage act-' + (a.stage || 'dated')">{{ actStageLabel(a.stage) }}</span>
                {{ actTitle(a) }}
              </span>
              <span class="existing-meta">{{ actDateRange(a) }}{{ a.category ? ' · ' + a.category : '' }}{{ a.scale ? ' · ' + a.scale : '' }}</span>
            </div>
            <div class="reimb-actions">
              <button type="button" class="existing-del ok" @click="openActEdit(a)">编辑</button>
              <button type="button" class="existing-del" @click="deleteActivity(a)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 投票表单 ===== -->
      <div v-if="currentType === 'polls'" class="form-section">
        <h3>🗳️ 发布投票</h3>
        <form @submit.prevent="submitPoll" class="data-form">
          <div class="form-group"><label>投票标题 <span class="required">*</span></label><input v-model="pollForm.titleZh" placeholder="下次班级聚餐地点投票" /></div>
          <div class="form-group"><label>投票描述 <span class="required">*</span></label><textarea v-model="pollForm.descriptionZh" rows="2" required placeholder="简单说明投票背景"></textarea></div>
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
                <input v-model="opt.textZh" required :placeholder="`选项 ${idx + 1} 文字`" class="poll-option-input" />
                <label class="poll-option-img-btn">
                  <input type="file" accept="image/*" class="hidden-file" @change="onPollOptionImage($event, idx)" />
                  {{ opt.imageFile ? '✓ 已选图' : '📷 图片' }}
                </label>
                <button type="button" class="poll-option-del" @click="removePollOption(idx)" :disabled="pollForm.options.length <= 2">×</button>
              </div>
            </div>
            <button type="button" class="add-option-btn" @click="addPollOption">+ 添加选项</button>
          </div>

          <button type="submit" class="submit-btn" :disabled="submitting || !pollCanSubmit">
            {{ submitting ? '提交中...' : '发布投票' }}
          </button>
        </form>
      </div>

      <!-- ===== 课程资料（双 Tab：当前课件与资料 / 讲次管理） ===== -->
      <div v-if="currentType === 'courseMaterials'" class="module-section">
        <ModuleTabs :tabs="cmTabs" :active="cmTab" @select="cmTab = $event" />

        <template v-if="cmTab === 'files'">
        <!-- 动作栏：统计（可点击筛选）+ 上传 -->
        <ModuleBar :stats="cmStats" :active="cmFilter" add-label="＋ 上传资料" @toggle="toggleCmFilter" @add="openCmForm" />

        <!-- 上传表单（展开式） -->
        <div v-if="cmFormOpen" class="module-form">
        <h3>📚 添加课程资料</h3>
        <form @submit.prevent="submitCourseMaterial" class="data-form">
          <!-- 1. 选课程 -->
          <div class="form-group">
            <label>课程 <span class="required">*</span></label>
            <select v-model="cmForm.courseId" @change="onCmCourseChange">
              <option value="dmd">数据、模型与决策（DMD）</option>
              <option value="managerial-economics">管理经济学</option>
              <option value="accounting">会计学</option>
            </select>
          </div>

          <!-- 2. 选目标讲次 -->
          <div class="form-group">
            <label>目标讲次 <span class="required">*</span></label>
            <div class="seg-control">
              <button type="button" :class="{ active: cmForm.target === 'existing' }" @click="cmForm.target = 'existing'">追加到已有讲次</button>
              <button type="button" :class="{ active: cmForm.target === 'new' }" @click="cmForm.target = 'new'">新建讲次</button>
            </div>
            <select v-if="cmForm.target === 'existing'" v-model="cmForm.sessionKey">
              <option value="" disabled>选择讲次…</option>
              <option v-for="s in cmExistingSessions" :key="s.key" :value="s.key">
                第{{ s.session }}讲 · {{ s.title }} · {{ s.date }}
              </option>
            </select>
            <template v-else>
              <div class="form-row">
                <div class="form-group"><label>第几讲 <span class="required">*</span></label><input type="number" min="1" v-model.number="cmForm.session" placeholder="1" /></div>
                <div class="form-group"><label>日期 <span class="required">*</span></label><input type="date" v-model="cmForm.date" /></div>
              </div>
              <div class="form-group"><label>本讲标题 <span class="required">*</span></label><input v-model="cmForm.title" placeholder="第1讲：..." /></div>
            </template>
          </div>

          <!-- 3. 选内容类型 -->
          <div class="form-group">
            <label>要添加的内容 <span class="required">*</span></label>
            <div class="seg-control">
              <button type="button" :class="{ active: cmForm.itemType === 'slide' }" @click="cmForm.itemType = 'slide'">课件</button>
              <button type="button" :class="{ active: cmForm.itemType === 'homework' }" @click="cmForm.itemType = 'homework'">作业</button>
              <button type="button" :class="{ active: cmForm.itemType === 'reference' }" @click="cmForm.itemType = 'reference'">参考资料</button>
            </div>
          </div>

          <!-- 课件 -->
          <div v-if="cmForm.itemType === 'slide'" class="form-group">
            <label>课件文件 <span class="required">*</span></label>
            <input type="file" accept=".pdf,.ppt,.pptx" @change="onSlideFile" class="file-input" />
            <span v-if="cmForm.slideFile" class="file-info">📄 {{ cmForm.slideFile.name }} ({{ formatSize(cmForm.slideFile.size) }})</span>
          </div>

          <!-- 作业 -->
          <template v-if="cmForm.itemType === 'homework'">
            <div class="form-group">
              <label>作业文件 <span class="required">*</span></label>
              <input type="file" accept=".pdf,.doc,.docx" @change="onHomeworkFile" class="file-input" />
              <span v-if="cmForm.homeworkFile" class="file-info">📄 {{ cmForm.homeworkFile.name }} ({{ formatSize(cmForm.homeworkFile.size) }})</span>
            </div>
            <div class="form-row">
              <div class="form-group"><label>作业截止日期</label><input type="date" v-model="cmForm.hwDeadline" /></div>
              <div class="form-group"><label>提交方式</label><input v-model="cmForm.hwSubmission" placeholder="纸质版手写" /></div>
            </div>
            <div class="form-group"><label>作业说明（可选）</label><input v-model="cmForm.hwDescription" /></div>
          </template>

          <!-- 参考资料 -->
          <template v-if="cmForm.itemType === 'reference'">
            <div class="form-group">
              <label>资料名称 <span class="required">*</span></label>
              <input v-model="cmForm.refName" placeholder="如：演示线性规划" />
            </div>
            <div class="form-group">
              <label>资料文件 <span class="required">*</span></label>
              <input type="file" accept=".pdf,.xls,.xlsx,.doc,.docx,.ppt,.pptx" @change="onRefSingleFile" class="file-input" />
              <span v-if="cmForm.refFile" class="file-info">📄 {{ cmForm.refFile.name }} ({{ formatSize(cmForm.refFile.size) }})</span>
            </div>
            <div class="form-group">
              <label>说明（可选）</label>
              <input v-model="cmForm.refDesc" placeholder="补充说明（可选）" />
            </div>
          </template>

          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="submitting || !cmCanSubmit">{{ submitting ? '上传中…（文件较大请稍候）' : '提交' }}</button>
            <button type="button" class="existing-del" @click="closeCmForm">取消</button>
          </div>
        </form>
        </div><!-- /module-form -->

        <!-- 当前课件与资料列表 -->
        <div class="module-list">
          <div class="module-list-head">
            <h4>当前课件与资料{{ cmFilter ? ' · ' + cmFilter : '' }}（{{ filteredCmFiles.length }}）</h4>
          </div>
          <p v-if="!filteredCmFiles.length" class="empty-hint">{{ cmFilter ? '该类型暂无资料，点击统计可切换筛选' : '暂无资料，点上方「上传资料」添加第一个' }}</p>
          <div v-for="item in filteredCmFiles" :key="item.fileUrl" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">{{ item.name }}</span>
              <span class="existing-meta">{{ item.courseName }} · {{ item.kind }} · {{ item.size }}</span>
            </div>
            <button type="button" class="existing-del" @click="deleteCourseFile(item)">删除</button>
          </div>
        </div>

        <!-- 讲次管理：编辑标题/日期、删除讲次（空讲次也可删） -->
        </template>
        <div v-else class="session-mgr">
          <h4>讲次管理</h4>
          <p class="mgr-hint">可直接修改讲次标题或日期后点「保存」；标题填错、空讲次都可在此处理。删除含文件的讲次会一并删除其文件。</p>
          <div v-for="course in cmMgr" :key="course.id" class="mgr-course">
            <div class="mgr-course-name">{{ course.name }}</div>
            <div v-for="sx in course.sessions" :key="course.id + '@' + sx.session + '@' + sx.date" class="mgr-row">
              <span class="mgr-no">第{{ sx.session }}讲</span>
              <input class="mgr-title" v-model="sx.draftTitle" placeholder="讲次标题" />
              <input class="mgr-date" type="date" v-model="sx.draftDate" />
              <span class="mgr-count">{{ sx.fileCount }} 个文件</span>
              <button type="button" class="mgr-save" :disabled="submitting || (sx.draftTitle.trim() === sx.title && sx.draftDate === sx.date)" @click="saveSession(course, sx)">保存</button>
              <button type="button" class="mgr-del" :disabled="submitting" @click="deleteSession(course, sx)">删除讲次</button>
            </div>
            <p v-if="!course.sessions.length" class="empty-hint">暂无讲次</p>
          </div>
        </div>
      </div>

      <!-- ===== 知识库（动作栏 + 上传展开 + 资料列表） ===== -->
      <div v-if="currentType === 'knowledge'" class="module-section">
        <!-- 动作栏：统计（可点击筛选）+ 上传 -->
        <ModuleBar :stats="kbStats" :active="kbFilter" add-label="＋ 上传资料" @toggle="toggleKbFilter" @add="openKbForm" />

        <!-- 上传表单（展开式） -->
        <div v-if="kbFormOpen" class="module-form">
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
          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="submitting || !kbForm.file">{{ submitting ? '上传中...（文件较大请稍候）' : '上传文件并提交' }}</button>
            <button type="button" class="existing-del" @click="closeKbForm">取消</button>
          </div>
        </form>
        </div><!-- /module-form -->

        <!-- 当前资料列表 -->
        <div class="module-list">
          <div class="module-list-head">
            <h4>当前资料{{ kbFilter ? ' · ' + kbTypeLabel(kbFilter) : '' }}（{{ filteredKbDocs.length }}）</h4>
          </div>
          <p v-if="!filteredKbDocs.length" class="empty-hint">{{ kbFilter ? '该分类暂无资料，点击统计可切换筛选' : '暂无资料，点上方「上传资料」添加第一个' }}</p>
          <div v-for="doc in filteredKbDocs" :key="doc.id" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">{{ doc.title?.zh || doc.title }}</span>
              <span class="existing-meta">{{ doc.courseId }} · {{ doc.date }} · {{ doc.size }}</span>
            </div>
            <button type="button" class="existing-del" @click="deleteKnowledgeDoc(doc)">删除</button>
          </div>
        </div><!-- /module-list -->
      </div><!-- /module-section -->

      <!-- ===== 班费（子 Tab 管理） ===== -->
      <div v-if="currentType === 'finance'" class="form-section">
        <div class="fin-subtabs">
          <button v-for="ft in finTabs" :key="ft.key" type="button" class="type-tab"
            :class="{ active: finTab === ft.key }" @click="finTab = ft.key"
            v-show="ft.key !== 'supervision' || isSupervisorLzy">{{ ft.icon }} {{ ft.name }}</button>
        </div>

        <div v-show="finTab === 'ledger'">
        <!-- 动作栏：流水统计（可筛选）+ 记一笔 -->
        <ModuleBar :stats="finTxStats" :active="finTxFilter" add-label="＋ 记一笔" @toggle="toggleFinTxFilter" @add="openFinForm" />
        <!-- 记一笔表单（展开式） -->
        <div v-if="finFormOpen" class="module-form">
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
          <div class="form-group"><label>收支明细（分类-金额，可多行）<span class="required">*</span></label>
            <div class="fin-items-editor">
              <div v-for="(it, idx) in finForm.items" :key="idx" class="fin-item-row">
                <select v-model="it.category" class="fin-item-cat">
                  <option v-for="c in finCatOptions" :key="c.key" :value="c.key">{{ c.label }}</option>
                </select>
                <input v-model.number="it.amount" type="number" step="0.01" min="0.01" placeholder="金额" class="fin-item-amt" />
                <input v-model="it.description" placeholder="描述（可选）" class="fin-item-desc" />
                <button type="button" class="fin-item-del" @click="finItemsRemove(idx)" :disabled="finForm.items.length <= 1" title="删除该行">删除</button>
              </div>
              <div class="fin-items-foot">
                <button type="button" class="fin-item-add" @click="finItemsAdd">＋ 添加一行</button>
                <span class="fin-items-total">合计 ¥{{ finItemsTotal }}</span>
              </div>
            </div>
          </div>
          <div class="form-group"><label>描述 <span class="required">*</span></label><input v-model="finForm.description" required placeholder="如：8月1日班级见面会晚宴" /></div>
          <div class="form-group"><label>经手人（可选，默认当前操作人）</label><input v-model="finForm.handler" placeholder="实际经办/垫付的同学姓名" /></div>
          <div class="form-group"><label>关联活动（可选）</label>
            <select v-model="finForm.activityId">
              <option value="">不关联任何活动</option>
              <option v-for="act in activitiesList" :key="act.id" :value="act.id">{{ act.date }} · {{ act.title.zh || act.title }}</option>
            </select>
          </div>
          <div class="form-group"><label>关联公示 <span v-if="finForm.type === 'expense'" class="required">*</span>（支出必选）</label>
            <select v-model="finForm.proposalId">
              <option value="">{{ finForm.type === 'expense' ? '请选择本次支出的预算公示（仅已通过可选）' : '不关联公示（如班费缴纳/期初入账）' }}</option>
              <option v-for="b in finBudgets.filter(x => x.status === 'passed')" :key="b.id" :value="b.id">{{ b.title }} · ¥{{ b.amount }}{{ b.proposalNo ? '（' + b.proposalNo + '）' : '' }}</option>
              <option v-for="b in finBudgets.filter(x => x.status !== 'passed')" :key="'x' + b.id" value="" disabled>{{ b.title }} · ¥{{ b.amount }}（{{ b.status }}，未通过不可关联）</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="submitting || !finCanSubmit">{{ submitting ? '提交中...' : '提交并发布' }}</button>
            <button type="button" class="existing-del" @click="closeFinForm">取消</button>
          </div>
        </form>
        </div><!-- /module-form -->

        <div class="module-list">
          <div class="module-list-head">
            <h4>当前流水{{ finTxFilter ? ' · ' + (finTxFilter === 'income' ? '收入' : '支出') : '' }}（{{ filteredFinTx.length }}）</h4>
          </div>
          <p v-if="!filteredFinTx.length" class="empty-hint">{{ finTxFilter ? '该类型暂无流水，点击统计可切换筛选' : '暂无流水，点上方「记一笔」添加第一笔' }}</p>
          <div v-for="tx in filteredFinTx" :key="tx.id" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">
                <span :class="tx.type==='income' ? 'tx-income' : 'tx-expense'">{{ tx.type==='income' ? '收入' : '支出' }}</span>
                ¥{{ tx.amount }} · {{ tx.description }}
              </span>
              <span class="existing-meta">{{ tx.date }} · {{ tx.category }}{{ tx.activityId ? ' · 活动: ' + tx.activityId : '' }}{{ tx.proposalId ? ' · 公示: ' + finBudgetTitle(tx.proposalId) : '' }}</span>
            </div>
            <button type="button" class="existing-del" @click="deleteFinanceTx(tx)">删除</button>
          </div>
        </div>

        </div>

        <div v-show="finTab === 'budgets'">
        <!-- 动作栏：公示统计（可筛选）+ 发公示（仅会计可见） -->
        <ModuleBar :stats="budgetStats" :active="budgetFilter" :add-label="isAccountantView ? '＋ 发公示' : ''" @toggle="toggleBudgetFilter" @add="openBudgetForm" />
        <!-- 公示到期提醒（到期前 24h） -->
        <p v-if="budgetExpiringCount" class="budget-expiring">⏰ 有 {{ budgetExpiringCount }} 条公示将在 24 小时内到期，请注意跟进</p>
        <!-- 发布预算表单（展开式） -->
        <div v-if="budgetFormOpen" class="module-form">
        <h3 style="margin-top:0">📋 发布预算公示（支出前，公示 3 天征集反对）</h3>
        <form @submit.prevent="publishBudget" class="data-form">
          <div class="form-row">
            <div class="form-group"><label>公示标题（事项）<span class="required">*</span></label><input v-model="budgetForm.title" required placeholder="如：9月班级聚餐预算" /></div>
            <div class="form-group"><label>申请方</label><input v-model="budgetForm.proposer" placeholder="活动组 / 申请人" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>公示类型</label>
              <select v-model="budgetForm.exposeType">
                <option value="normal">普通（支出前公示 3 天）</option>
                <option value="emergency">紧急（事后补公示，需批准备注）</option>
              </select>
            </div>
            <div class="form-group"><label>关联活动（可选）</label>
              <select v-model="budgetForm.activityId">
                <option value="">不关联</option>
                <option v-for="act in activitiesList" :key="act.id" :value="act.id">{{ act.date }} · {{ act.title.zh || act.title }}</option>
              </select>
            </div>
            <div class="form-group"><label>预算上限（元）<span class="required">*</span></label><input type="number" step="0.01" v-model.number="budgetForm.amount" required placeholder="0.00" /></div>
          </div>
          <div v-if="budgetForm.exposeType === 'emergency'" class="form-group"><label>紧急批准备注 <span class="required">*</span></label><input v-model="budgetForm.approvalNote" required placeholder="如：班委会 8/12 同意，事后补公示" /></div>
          <div class="form-group"><label>活动说明</label><textarea v-model="budgetForm.description" rows="2" class="input-textarea" placeholder="预计组织什么活动、多少人参加等"></textarea></div>
          <div class="form-group">
            <label>预算明细</label>
            <div v-for="(it, i) in budgetForm.detailItems" :key="i" class="budget-item-row">
              <input v-model="it.item" class="input-inline" placeholder="项目（如：餐费）" />
              <input type="number" step="0.01" v-model.number="it.amount" class="input-inline" placeholder="金额" />
              <button type="button" class="existing-del" @click="removeBudgetItem(i)">×</button>
            </div>
            <button type="button" class="mini-add" @click="addBudgetItem">+ 添加明细项</button>
          </div>
          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="submitting || !budgetCanSubmit">{{ submitting ? '提交中...' : '发布公示（3 天异议期）' }}</button>
            <button type="button" class="existing-del" @click="closeBudgetForm">取消</button>
          </div>
        </form>
        </div><!-- /module-form -->

        <div class="module-list">
          <div class="module-list-head">
            <h4>公示记录{{ budgetFilter ? ' · ' + (budgetFilter === 'ended' ? '已结束' : budgetFilter) : '' }}（{{ filteredFinBudgets.length }}）</h4>
          </div>
          <p v-if="!filteredFinBudgets.length" class="empty-hint">{{ budgetFilter ? '该状态暂无公示，点击统计可切换筛选' : '暂无公示，点上方「发公示」发布第一个' }}</p>
          <div v-for="b in filteredFinBudgets" :key="b.id" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">
                <span :class="'bc-' + b.status">[{{ b.status }}]</span> {{ b.title }} · ¥{{ b.amount }}
                <span v-if="b.proposalNo" class="bc-no">{{ b.proposalNo }}</span>
                <span v-if="parseBudgetAtt(b.attachment)" class="bc-no" title="含活动方案附件">📎</span>
                <span v-if="b.exposeType === 'emergency'" class="emergency-tag">紧急·事后补公示</span>
              </span>
              <span class="existing-meta">
                <template v-if="['submitted','returned'].includes(b.status)">
                  {{ b.groupName || '—' }} · 申请人 {{ b.proposer || '—' }}{{ b.contact ? ' · ' + b.contact : '' }}
                  · {{ b.eventType || '' }}<template v-if="b.activityType"> · {{ b.activityType }}</template>
                  <template v-if="b.payTarget"> · 支付对象:{{ b.payTarget }}</template>
                  <span v-if="b.status === 'returned' && b.returnedReason" class="budget-return-note">退回原因：{{ b.returnedReason }}</span>
                </template>
                <template v-else>
                  赞成 {{ b.forCount ?? 0 }} · 反对 {{ b.againstCount ?? 0 }} · 未表态 {{ b.uncommitted ?? 0 }} · 否决线 {{ b.vetoCount ?? '—' }} · 公示至 {{ (b.exposeEnd || '').slice(0, 10) }}
                </template>
              </span>
              <details v-if="b.detailItems && b.detailItems.length" class="budget-objections">
                <summary>预算明细（{{ b.detailItems.length }}）<template v-if="['submitted','returned'].includes(b.status)"> · 红线: {{ b.redlines?.r1 && b.redlines?.r2 && b.redlines?.r3 ? '已确认' : '未勾选!' }}</template></summary>
                <div v-for="(it, i) in b.detailItems" :key="i" class="obj-row">{{ it.item }}<template v-if="it.qty > 1"> ×{{ it.qty }}</template> · ¥{{ it.amount }}<template v-if="it.category"> · {{ it.category }}</template><template v-if="it.note"> · {{ it.note }}</template></div>
              </details>
              <details v-if="b.reasons && b.reasons.length" class="budget-objections">
                <summary>查看反对留言（匿名 {{ b.reasons.length }} 条）</summary>
                <div v-for="(o, i) in b.reasons" :key="i" class="obj-row">💬 {{ o.reason || '（无理由）' }}</div>
              </details>
            </div>
            <div class="reimb-actions">
              <button type="button" class="existing-del detail" @click="openBudgetDetail(b)">详情</button>
              <template v-if="isAccountantView">
                <button v-if="['submitted','returned'].includes(b.status)" type="button" class="existing-del ok" @click="openBudgetApprove(b)">公开</button>
                <button v-if="b.status === 'submitted'" type="button" class="existing-del" @click="openBudgetReturn(b)">退回</button>
                <button v-if="b.status === 'open'" type="button" class="existing-del ok" @click="settleBudget(b)">结算</button>
                <button v-if="b.status === 'open'" type="button" class="existing-del" @click="cancelBudget(b)">取消</button>
              </template>
              <span v-else class="dim">只读（审批仅会计程枭）</span>
            </div>
          </div>
        </div>

        </div>

        <!-- 公示详情弹层（页面内，完整展示提交字段 + 预算总额 + 审批按钮） -->
        <div v-if="budgetDetail" class="modal-mask" @click.self="closeBudgetDetail">
          <div class="modal bd-modal">
            <div class="modal-head"><span class="modal-title">公示详情</span><button class="modal-close" @click="closeBudgetDetail">×</button></div>
            <div class="modal-body">
              <div class="bd-head">
                <span :class="'bc-' + budgetDetail.status">[{{ budgetDetail.status }}]</span>
                <span class="existing-title" style="font-weight:600">{{ budgetDetail.title }}</span>
                <span v-if="budgetDetail.proposalNo" class="bc-no">{{ budgetDetail.proposalNo }}</span>
                <span v-if="budgetDetail.exposeType === 'emergency'" class="emergency-tag">紧急·事后补公示</span>
                <span class="bd-amount">预算上限 ¥{{ formatAmount(budgetDetail.amount) }}</span>
              </div>
              <div class="bd-grid">
                <div class="bd-field"><span class="bd-label">申请小组</span><span>{{ budgetDetail.groupName || '—' }}</span></div>
                <div class="bd-field"><span class="bd-label">申请人</span><span>{{ budgetDetail.proposer || '—' }}</span></div>
                <div class="bd-field"><span class="bd-label">联系方式</span><span>{{ budgetDetail.contact || '—' }}</span></div>
                <div class="bd-field"><span class="bd-label">事项性质</span><span>{{ budgetDetail.eventType || '—' }}</span></div>
                <div class="bd-field"><span class="bd-label">资金支付对象</span><span>{{ budgetDetail.payTarget || '—' }}</span></div>
                <div class="bd-field"><span class="bd-label">活动类型</span><span>{{ budgetDetail.activityType || '—' }}</span></div>
                <div class="bd-field"><span class="bd-label">关联活动</span><span>{{ bdActivityTitle(budgetDetail.activityId) }}</span></div>
                <div class="bd-field"><span class="bd-label">提交时间</span><span>{{ shortTime(budgetDetail.created_at) }}</span></div>
                <div class="bd-field"><span class="bd-label">活动方案附件</span><span>
                  <template v-if="bdAttachment"><a :href="bdAttachment.url" target="_blank" rel="noopener">📎 {{ bdAttachment.name }}</a><span class="dim">（{{ bdAttachment.size ? formatSize(bdAttachment.size) : '' }}）</span></template>
                  <template v-else>—</template>
                </span></div>
              </div>
              <div v-if="budgetDetail.description" class="bd-section">
                <div class="bd-label-row"><span class="bd-label">活动说明</span></div>
                <p class="bd-text">{{ budgetDetail.description }}</p>
              </div>
              <div class="bd-section">
                <div class="bd-label-row"><span class="bd-label">预算明细（{{ (budgetDetail.detailItems || []).length }} 项）</span></div>
                <table class="bd-table">
                  <thead><tr><th>#</th><th>支出项目</th><th>数量</th><th>单价</th><th>金额</th><th>分类</th><th>备注</th></tr></thead>
                  <tbody>
                    <tr v-for="(it, i) in budgetDetail.detailItems" :key="i">
                      <td>{{ i + 1 }}</td><td>{{ it.item }}</td><td>{{ it.qty }}</td><td>¥{{ formatAmount(it.unitPrice) }}</td><td>¥{{ formatAmount(it.amount) }}</td><td>{{ it.category || '—' }}</td><td>{{ it.note || '' }}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="bd-total">明细合计 ¥{{ formatAmount(bdItemsTotal) }}<template v-if="budgetDetail.amount"> · 预算上限 ¥{{ formatAmount(budgetDetail.amount) }}<span :class="bdDiff >= 0 ? 'ok' : 'bad'">（差额 ¥{{ formatAmount(bdDiff) }}）</span></template></div>
              </div>
              <div class="bd-section">
                <span class="bd-label">财务红线核对 </span>
                <span :class="bdRedlinesOk ? 'bd-redline-ok' : 'bd-redline-bad'">{{ bdRedlinesOk ? '✓ 3 项已确认' : '✗ 未勾选（' + bdUnchecked + ' 项）' }}</span>
              </div>
              <div v-if="budgetDetail.status === 'returned' && budgetDetail.returnedReason" class="bd-section bd-return">
                <div class="bd-label-row"><span class="bd-label">退回原因</span></div>
                <p class="bd-text">{{ budgetDetail.returnedReason }}</p>
              </div>
              <div v-if="!['submitted','returned','draft'].includes(budgetDetail.status)" class="bd-section">
                <div class="bd-label-row"><span class="bd-label">投票进展</span></div>
                <p class="bd-text">赞成 {{ budgetDetail.forCount ?? 0 }} · 反对 {{ budgetDetail.againstCount ?? 0 }} · 未表态 {{ budgetDetail.uncommitted ?? 0 }} · 否决线 {{ budgetDetail.vetoCount ?? '—' }}<template v-if="budgetDetail.exposeEnd"> · 公示至 {{ (budgetDetail.exposeEnd || '').slice(0, 10) }}</template></p>
              </div>
              <div class="form-actions bd-actions">
                <template v-if="isAccountantView">
                  <button v-if="['submitted','returned'].includes(budgetDetail.status)" type="button" class="submit-btn" :disabled="submitting" @click="openBudgetApprove(budgetDetail)">公开</button>
                  <button v-if="budgetDetail.status === 'submitted'" type="button" class="existing-del" @click="openBudgetReturn(budgetDetail)">退回</button>
                </template>
                <button type="button" class="existing-del detail" @click="closeBudgetDetail">关闭</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 公开确认弹层（页面内，非系统弹窗） -->
        <div v-if="budgetApproveConfirm" class="modal-mask" @click.self="closeBudgetApprove">
          <div class="modal">
            <div class="modal-head"><span class="modal-title">公开公示：{{ budgetApproveConfirm.title }}</span><button class="modal-close" @click="closeBudgetApprove">×</button></div>
            <div class="modal-body">
              <p class="modal-tip">公开后进入 3 天全员投票期：</p>
              <ul class="modal-tip" style="padding-left:18px;margin:4px 0">
                <li>自动生成公示编号 MF4-BM-YYYYMMDD-XX 与投票截止时间；</li>
                <li>同步通知全班同学到前台投票；</li>
                <li>请确认该笔预算资料已齐全（红线 3 项确认、明细合计 ≤ 预算上限）。</li>
              </ul>
              <div class="form-actions">
                <button class="submit-btn" :disabled="submitting" @click="doBudgetApprove">确认公开</button>
                <button class="existing-del" @click="closeBudgetApprove">取消</button>
              </div>
            </div>
          </div>
        </div>
        <!-- 退回原因弹层 -->
        <div v-if="budgetReturn" class="modal-mask" @click.self="closeBudgetReturn">
          <div class="modal">
            <div class="modal-head"><span class="modal-title">退回公示：{{ budgetReturn.title }}</span><button class="modal-close" @click="closeBudgetReturn">×</button></div>
            <div class="modal-body">
              <p class="modal-tip">请说明缺少的资料 / 需修改的内容。发起人会收到站内通知，修改后重新提交。</p>
              <textarea v-model="budgetReturn.reason" rows="3" class="input-textarea" placeholder="如：缺少活动人数说明、明细备注不完整"></textarea>
              <div class="form-actions">
                <button class="submit-btn" :disabled="submitting || !budgetReturn.reason.trim()" @click="doBudgetReturn">确认退回</button>
                <button class="existing-del" @click="closeBudgetReturn">取消</button>
              </div>
            </div>
          </div>
        </div>
        <!-- 公开成功提醒：同步微信群公告 -->
        <div v-if="budgetApproved" class="modal-mask" @click.self="budgetApproved = null">
          <div class="modal">
            <div class="modal-head"><span class="modal-title">✅ 已公开：{{ budgetApproved.title }}</span><button class="modal-close" @click="budgetApproved = null">×</button></div>
            <div class="modal-body">
              <p class="modal-tip">公示编号：<b>{{ budgetApproved.proposalNo }}</b>，已进入 3 天全员投票期。</p>
              <p class="modal-tip" style="font-weight:600;color:var(--c-text-primary)">📣 请把公示链接同步到班级微信群，让全班同学去投票：</p>
              <p class="voucher-link"><a :href="budgetApproved.url" target="_blank" rel="noopener">{{ budgetApproved.url }}</a></p>
              <div class="form-actions"><button class="submit-btn" @click="budgetApproved = null">知道了</button></div>
            </div>
          </div>
        </div>

        <div v-show="finTab === 'reimb'">
        <!-- 报销审批（支出后） -->
        <h3 style="margin-top:30px">🧾 报销审批（提交 → 审批 → 线下打款 → 入账公示）</h3>
        <div class="existing-list">
          <p v-if="!finReimbursements.length" class="empty-hint">暂无报销单</p>
          <div v-for="r in finReimbursements" :key="r.id" class="existing-item">
            <div class="existing-info">
              <span class="existing-title">
                <span :class="'bc-' + r.status">[{{ r.status }}]</span> {{ r.applicant }} · {{ r.description }} · ¥{{ r.amount }}
              </span>
              <span class="existing-meta">
                消费 {{ (r.expenseDate || '').slice(0, 10) }} · 提交 {{ (r.createdAt || '').slice(0, 10) }}<template v-if="r.proposalId"> · 关联公示: {{ finBudgetTitle(r.proposalId) }}</template>{{ r.auditNote ? ' · 审批意见: ' + r.auditNote : '' }}
              </span>
              <details v-if="r.vouchers && r.vouchers.length" class="budget-objections">
                <summary>查看凭证（{{ r.vouchers.length }}）</summary>
                <div v-for="(v, i) in r.vouchers" :key="i" class="obj-row"><a :href="v.url" target="_blank" rel="noopener">{{ v.type }} · {{ v.name }}</a></div>
              </details>
            </div>
            <div class="reimb-actions">
              <button v-if="r.status === 'submitted'" type="button" class="existing-del ok" @click="openReimbAudit(r, 'approve')">通过</button>
              <button v-if="r.status === 'submitted'" type="button" class="existing-del" @click="openReimbAudit(r, 'revision')">退回补正</button>
              <button v-if="r.status === 'submitted'" type="button" class="existing-del" @click="openReimbAudit(r, 'reject')">驳回</button>
              <button v-if="r.status === 'approved'" type="button" class="existing-del ok" @click="openReimbAudit(r, 'pay')">确认打款</button>
            </div>
            <!-- 审批意见输入（二次确认） -->
            <div v-if="reimbAudit && reimbAudit.id === r.id" class="reject-box reimb-audit-box">
              <input v-model="reimbAuditNote" :placeholder="reimbAuditNotePh" />
              <button type="button" class="audit-no" @click="doReimbAudit(r)" :disabled="submitting || !reimbAuditNote.trim()">确认{{ reimbAuditLabel }}</button>
              <button type="button" class="audit-cancel" @click="closeReimbAudit">取消</button>
            </div>
          </div>
        </div>

        </div>

        <div v-show="finTab === 'config'">
        <!-- 财务参数配置（班委可见；主理人/副主理人/监督人可修改） -->
        <div class="form-section" style="margin-top:26px">
          <h3>⚙️ 财务参数配置</h3>
          <div v-if="finConfig" class="fin-config-grid">
            <div class="form-group"><label>班级人数（投票分母）</label><input type="number" :value="69" disabled title="财务制度写死：69 人，不可修改" /></div>
            <div class="form-group"><label>否决线（反对票数）</label><input type="number" :value="23" disabled title="财务制度写死：23 票（69 的 1/3），不可修改" /></div>
            <div class="form-group"><label>公示天数</label><input type="number" :value="3" disabled title="财务制度写死：公示 3 天，不可修改" /></div>
            <div class="form-group"><label>大额阈值（元）</label><input type="number" v-model.number="finConfig.largeAmount" /></div>
            <div class="form-group"><label>余额预警线（元）</label><input type="number" v-model.number="finConfig.warnLine" /></div>
            <div class="form-group"><label>期初班费（元）</label><input type="number" v-model.number="finConfig.initialBalance" /></div>
            <div class="form-group"><label>报销时限（工作日）</label><input type="number" v-model.number="finConfig.reimbDays" /></div>
            <div class="form-group"><label>审核时限（工作日）</label><input type="number" v-model.number="finConfig.auditDays" /></div>
            <div class="form-group"><label>付款时限（工作日）</label><input type="number" v-model.number="finConfig.payDays" /></div>
          </div>
          <h4 style="margin:16px 0 8px">财务角色（按真名，注册后自动关联）</h4>
          <div v-if="finRoles.length" class="fin-roles-list">
            <div v-for="(r, i) in finRoles" :key="i" class="fin-role-row">
              <span class="fin-role-name">{{ r.name }}</span>
              <span class="fin-role-f">{{ r.f_role }}</span>
              <span v-if="r.user_id" class="fin-role-linked">已关联 ✓</span>
              <span v-else class="fin-role-unlinked">未注册</span>
              <button type="button" class="existing-del" @click="removeFinanceRole(i)">×</button>
            </div>
          </div>
          <div class="fin-role-add">
            <input v-model="roleNameInput" class="token-input" style="flex:1" placeholder="同学真名" />
            <select v-model="roleSelect" class="token-input" style="flex:0 0 auto; width:auto">
              <option value="accountant">会计</option>
              <option value="cashier">出纳</option>
              <option value="supervisor">监督人</option>
              <option value="treasury_staff">财务组</option>
            </select>
            <button type="button" class="token-btn" @click="addFinanceRole">添加</button>
          </div>
          <div class="fin-config-actions">
            <span v-if="finConfigMsg" class="oppose-msg">{{ finConfigMsg }}</span>
            <button class="submit-btn" @click="saveFinanceConfig" :disabled="submitting">保存财务配置</button>
          </div>
        </div>

        </div>

        <div v-show="finTab === 'supervision'">
        <!-- 监督视图（仅雷振宇可见；票向实名明细） -->
        <div v-if="isSupervisorLzy" class="form-section" style="margin-top:26px">
          <h3>🔍 监督视图（仅本人可见）</h3>
          <p class="empty-hint">票向实名明细：显示每条公示的赞成/反对名单与留言人身份，仅本人可查看。</p>
          <div v-if="supervisionMsg" class="empty-hint">{{ supervisionMsg }}</div>
          <div v-else-if="!finSupervision" class="empty-hint">加载中…</div>
          <template v-else>
            <div v-if="finSupervision.supervision && finSupervision.supervision.length" class="existing-list">
              <div v-for="b in finSupervision.supervision" :key="b.id" class="existing-item supervision-item">
                <div class="existing-info">
                  <span class="existing-title">{{ b.title }} · ¥{{ b.amount }}</span>
                  <span class="existing-meta">状态 {{ b.status }} · 公示至 {{ (b.exposeEnd || '').slice(0, 10) }}</span>
                  <div v-if="b.forVotes && b.forVotes.length" class="obj-row ok">✅ 赞成（{{ b.forVotes.length }}）：<span v-for="(v, i) in b.forVotes" :key="i">{{ i > 0 ? '、' : '' }}{{ v.name }}</span></div>
                  <div v-if="b.againstVotes && b.againstVotes.length" class="obj-row">
                    <span>⛔ 反对（{{ b.againstVotes.length }}）：</span>
                    <div v-for="(a, i) in b.againstVotes" :key="i" class="obj-reason">· {{ a.name }}{{ a.reason ? '：' + a.reason : '（无理由）' }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-hint">暂无公示记录</div>
          </template>
        </div>
        </div>
      </div>

      <!-- ===== 薄荷币（子 Tab：申报审核 / 规则配置） ===== -->
      <div v-if="currentType === 'coins'" class="form-section">
        <div class="fin-subtabs">
          <button v-for="ct in coinsTabs" :key="ct.key" type="button" class="type-tab"
            :class="{ active: coinsTab === ct.key }" @click="coinsTab = ct.key">{{ ct.icon }} {{ ct.name }}</button>
        </div>

        <div v-show="coinsTab === 'claims'">
          <h3>🧾 薄荷币申报审核</h3>
          <p class="empty-hint">通过后按获币名单批量入账；驳回必须填写原因。全部操作留痕可追溯。</p>
          <div v-if="coinClaimsMsg" class="empty-hint">{{ coinClaimsMsg }}</div>
          <div v-else-if="!coinClaims.length" class="empty-hint">暂无待审核申报</div>
          <div v-else class="existing-list">
            <div v-for="c in coinClaims" :key="c.id" class="existing-item">
              <div class="existing-info">
                <span class="existing-title">{{ c.applicant }} · {{ c.title }}（+{{ c.total }} 币）</span>
                <span v-if="c.isDemo" class="demo-chip">演示</span>
                <span class="existing-meta">{{ coinShortDate(c.createdAt) }} · {{ coinRuleName(c.ruleId) }}</span>
                <span v-if="c.description" class="existing-meta">说明：{{ c.description }}</span>
                <div v-if="c.proofs && c.proofs.length" class="proofs-mini">
                  <a v-for="(u, i) in c.proofs" :key="i" :href="u" target="_blank" rel="noopener">证明 {{ i + 1 }}</a>
                </div>
                <div v-if="c.recipients && c.recipients.length" class="existing-meta">
                  获币名单（{{ c.recipients.length }} 人）：{{ c.recipients.map(r => r.name + ' +' + r.amount).join('、') }}
                </div>
              </div>
              <div class="audit-actions">
                <button type="button" class="audit-ok" @click="approveClaim(c)" :disabled="approvingId === c.id">
                  {{ approvingId === c.id ? '入账中...' : '✓ 通过入账' }}</button>
                <button type="button" class="audit-no" @click="openReject(c)" :disabled="rejectingId === c.id">✗ 驳回</button>
              </div>
              <div v-if="rejectingId === c.id" class="reject-box">
                <input v-model="rejectNote" placeholder="驳回原因（必填）" />
                <button type="button" class="audit-no" @click="doReject(c)" :disabled="!rejectNote.trim()">确认驳回</button>
                <button type="button" class="audit-cancel" @click="rejectingId = ''; rejectNote = ''">取消</button>
              </div>
            </div>
          </div>
        </div>

        <div v-show="coinsTab === 'rules'">
        <!-- 动作栏：规则统计（可筛选）+ 添加 -->
        <ModuleBar :stats="coinRuleStats" :active="coinRuleFilter" add-label="＋ 添加规则" @toggle="toggleCoinRuleFilter" @add="openRuleForm" />
        <!-- 添加规则表单（展开式） -->
        <div v-if="ruleFormOpen" class="module-form">
        <h3>⚙️ 奖励规则配置</h3>
        <form @submit.prevent="createRule" class="data-form">
            <div class="form-row">
              <div class="form-group"><label>规则名称（中文）<span class="required">*</span></label><input v-model="ruleForm.nameZh" required placeholder="如：参与班级活动" /></div>
              <div class="form-group"><label>单次奖励币数 <span class="required">*</span></label><input v-model.number="ruleForm.amount" type="number" min="1" step="1" required /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>英文名</label><input v-model="ruleForm.nameEn" placeholder="Attend class activity" /></div>
              <div class="form-group"><label>泰文名</label><input v-model="ruleForm.nameTh" placeholder="เข้าร่วมกิจกรรม" /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>类型</label>
                <select v-model="ruleForm.unit">
                  <option value="fixed">固定（每次固定奖励）</option>
                  <option value="per_activity">按活动（组织者统一提交名单）</option>
                </select>
              </div>
              <div class="form-group"><label>分类</label>
                <select v-model="ruleForm.category">
                  <option value="contribution">参与贡献</option>
                  <option value="organize">组织筹备</option>
                  <option value="resource">提供资源</option>
                  <option value="help">互助帮助</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group checkbox-group"><label class="checkbox-label"><input type="checkbox" v-model="ruleForm.isRoutine" /> 常规规则（快速复核）</label></div>
              <div class="form-group"><label>备注</label><input v-model="ruleForm.note" placeholder="选填" /></div>
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn" :disabled="submitting">添加规则</button>
              <button type="button" class="existing-del" @click="closeRuleForm">取消</button>
            </div>
          </form>
        </div><!-- /module-form -->

        <div class="module-list">
          <div class="module-list-head">
            <h4>当前规则{{ coinRuleFilter ? ' · ' + (coinRuleFilter === 'routine' ? '常规' : '自定义') : '' }}（{{ filteredCoinRules.length }}）</h4>
          </div>
          <p v-if="!filteredCoinRules.length" class="empty-hint">{{ coinRuleFilter ? '该分类暂无规则' : '暂无规则，点上方「添加规则」创建第一个' }}</p>
          <div v-for="r in filteredCoinRules" :key="r.id" class="existing-item">
              <div class="existing-info">
                <span class="existing-title">{{ r.name_zh }}（+{{ r.amount }} 币）<span :class="r.status ? 'tx-income' : 'tx-expense'">{{ r.status ? '启用' : '停用' }}</span></span>
                <span class="existing-meta">{{ r.category }} · {{ r.unit === 'per_activity' ? '按活动' : '固定' }}{{ r.is_routine ? ' · 常规' : ' · 非常规' }}{{ r.note ? ' · ' + r.note : '' }}</span>
              </div>
              <div class="audit-actions">
                <button type="button" class="audit-ok" @click="toggleRule(r)">{{ r.status ? '停用' : '启用' }}</button>
                <button type="button" class="audit-no" @click="deleteRule(r)">删除</button>
              </div>
            </div>
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
                  <span class="treehole-item-nickname">{{ msg.anonymous === 1 ? '匿名同学' : (msg.nickname || '匿名') }}</span>
                  <span v-if="msg.anonymous === 1" class="treehole-anon-badge" title="匿名留言，普通管理员仅可见不可逆匿名标识">🕵️ 匿名</span>
                  <span v-else class="treehole-real-badge" title="实名留言">👤 实名</span>
                  <span v-if="isTreeholeGod && msg.anonymous === 1" class="treehole-item-realname" title="真实发布者（仅主理人可见）">{{ msg.user_name || '未知' }}</span>
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
                  <div class="detail-row"><span class="detail-label">发布方式：</span><span class="detail-value">{{ msg.anonymous === 1 ? '匿名（前台显示「匿名同学」）' : '实名' }}</span></div>
                  <div v-if="msg.anonymous === 1" class="detail-row"><span class="detail-label">匿名标识：</span><span class="detail-value mono">{{ msg.anon_hash ? msg.anon_hash.slice(0, 16) + '…（不可逆，无法反查身份）' : '无' }}</span></div>
                  <div v-if="isTreeholeGod" class="detail-row"><span class="detail-label">真实发布者：</span><span class="detail-value">{{ msg.user_name || '未知' }}</span></div>
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
        <h3>📜 {{ currentTypeLabel }}·操作记录 <span class="history-count">({{ currentHistory.length }}条)</span> <span v-if="historyLoading" class="history-loading">加载中...</span></h3>
        <div v-if="currentHistory.length === 0" class="history-empty">该模块暂无提交记录</div>
        <div v-for="record in currentHistory" :key="record.id" class="history-item">
          <div class="history-card">
            <div class="history-row1">
              <span class="history-badge" :class="'badge-' + record.status">
                {{ record.status === 'success' ? '✓' : record.status === 'failed' ? '✗' : record.status === 'reverted' ? '↩' : '⏳' }}
              </span>
              <span class="history-type">{{ record.typeName }}</span>
              <span class="history-operator">{{ record.operator }}</span>
            </div>
            <div class="history-desc" :class="{ expanded: record.expanded }" :title="record.description" @click="record.expanded = !record.expanded">{{ record.description }}</div>
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
import { invalidateResource } from '../composables/useData.js'
import { dbKeyOf, HISTORY_TYPE_TO_RESOURCE } from '../composables/resourceRegistry.js'
import { todayStr } from '../utils/dateUtils.js'
import { dataTypes, finTabs, coinsTabs, MODULE_ROLE_MAP, COIN_AUDITORS, ROLE_LABEL_MAP } from '../utils/admin/constants.js'
import { formatSize, translateBoth, randomHex, extFromFileName, readFileAsBase64, formatTreeholeTime, shortTime, coinShortDate, flattenCourseFiles, sessionUrls, buildCmMgrRows } from '../utils/admin/utils.js'
import { getAdminToken, adminHeaders, throwIfNotOk, uploadFileToAdmin } from '../utils/admin/api.js'
import ModuleBar from './admin/ModuleBar.vue'
import ModuleTabs from './admin/ModuleTabs.vue'

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

// ===== 数据类型（常量见 utils/admin/constants.js） =====
const currentType = ref('announcements')

// 班费模块内部子 Tab（选"班费"后按模块分开管理）
const finTab = ref('ledger')

// 薄荷币模块内部子 Tab（申报审核 / 规则配置）
const coinsTab = ref('claims')

// 各模块角色映射 / 审批人 / 角色名（常量见 utils/admin/constants.js，与 functions/_utils.js 同步）
// 按当前登录用户过滤可见模块：
// 主理人/副主理人/独立董事会看全部（均可写）；薄荷币审批人（高晓梅/叶宏颖）额外放行薄荷币；其余角色按本职能过滤。
const visibleTypes = computed(() => {
  const role = currentUser.value?.role
  const name = currentUser.value?.name
  if (!role) return []
  if (role === 'leader' || role === 'deputy' || role === 'supervisor') return dataTypes
  const base = dataTypes.filter(t => (MODULE_ROLE_MAP[t.id] || []).includes(role))
  if (COIN_AUDITORS.includes(name) && !base.some(t => t.id === 'coins')) {
    return [...base, dataTypes.find(t => t.id === 'coins')]
  }
  return base
})
const roleLabel = computed(() => ROLE_LABEL_MAP[currentUser.value?.role] || '')
// 登录/角色变化后，若当前模块不在可见范围，自动切到第一个可见模块
watch(visibleTypes, (list) => {
  if (list.length && !list.some(t => t.id === currentType.value)) {
    currentType.value = list[0].id
  }
}, { immediate: true })

const submitting = ref(false)

// ===== 统一操作提示（toast）=====
const toastMsg = ref('')
const toastType = ref('success')
let toastTimer = null
function showToast(msg, type = 'success') {
  toastMsg.value = msg
  toastType.value = type
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2600)
}

// ===== 表单数据 =====
const today = todayStr()
const annForm = ref({ titleZh:'', category:'normal', date:today, deadline:'', pinned:false, summaryZh:'', contentZh:'' })
// ===== 活动表单（对应新版日历字段：stage/category/date/endDate/time/location/scale/capacity + recurrence/节日规则）=====
const ACT_STAGE_OPTIONS = [
  { key: 'dated', label: '已定活动' },
  { key: 'planning', label: '待排期' },
  { key: 'recurring', label: '固定每周' },
  { key: 'reminder', label: '节日提醒' },
]
const ACT_CATEGORY_OPTIONS = ['运动', '社交', '分享', '综合', '节日']
const ACT_SCALE_OPTIONS = ['小活动', '机动活动', '重点活动']
const WEEK_OPTIONS = [
  { key: 1, label: '一' }, { key: 2, label: '二' }, { key: 3, label: '三' }, { key: 4, label: '四' },
  { key: 5, label: '五' }, { key: 6, label: '六' }, { key: 0, label: '日' },
]
const ACT_HOLIDAY_TYPES = [
  { key: 'annual', label: '公历固定（如国庆 10.1）' },
  { key: 'floating', label: '浮动（如母亲节）' },
  { key: 'lunar', label: '农历（如春节）' },
  { key: 'lunarEve', label: '除夕（农历年末最后一天）' },
  { key: 'calculated', label: '清明（节气计算）' },
]
function resetActForm(keepTitle = false) {
  const t = actForm.value?.titleZh || ''
  actForm.value = {
    id: null, titleZh: t, stage: 'dated', category: '社交', status: 'upcoming', tags: null,
    date: today, endDate: '', time: '', locationZh: '', organizerZh: '', descriptionZh: '',
    scale: '', capacity: null, registered: 0, recurDays: [], recurTime: '',
    holidayType: 'annual', annualMonth: '', annualDay: '', floatingMonth: '', floatingWeekday: '', floatingOrdinal: '',
    lunarMonth: '', lunarDay: '',
  }
}
const actForm = ref({ titleZh:'', date:today, startTime:'', endTime:'', locationZh:'', organizerZh:'', descriptionZh:'', capacity:null, registered:0 })
resetActForm()
const cmForm = ref({
  courseId: 'dmd',
  target: 'existing',         // existing | new
  sessionKey: '',             // existing 时选中讲次的 key（N@date）
  session: 1, date: today, title: '',   // new 时使用
  itemType: 'slide',          // slide | homework | reference
  slideFile: null,
  homeworkFile: null, hwDeadline: '', hwSubmission: '', hwDescription: '',
  refName: '', refFile: null, refDesc: '',
})
const cmFiles = ref([])
const cmPack = ref(null)
// 所选课程的已有讲次（下拉用），按讲次倒序
const cmExistingSessions = computed(() => {
  const c = cmPack.value?.courses?.find(x => x.id === cmForm.value.courseId)
  return (c?.sessions || []).slice().sort((a, b) => Number(b.session) - Number(a.session)).map(s => ({
    key: `${s.session}@${s.date}`, session: s.session, title: s.title || '', date: s.date,
  }))
})
function onCmCourseChange() { cmForm.value.sessionKey = '' }
// 提交校验：必填项随目标讲次与内容类型动态变化
const cmCanSubmit = computed(() => {
  const f = cmForm.value
  if (f.target === 'new') {
    if (!f.session || !f.date || !f.title.trim()) return false
  } else if (!f.sessionKey) return false
  if (f.itemType === 'slide') return !!f.slideFile
  if (f.itemType === 'homework') return !!f.homeworkFile
  if (f.itemType === 'reference') return !!f.refName.trim() && !!f.refFile
  return false
})
function resetCmForm() {
  const courseId = cmForm.value.courseId
  cmForm.value = {
    courseId, target: 'existing', sessionKey: '',
    session: 1, date: today, title: '', itemType: 'slide',
    slideFile: null, homeworkFile: null, hwDeadline: '', hwSubmission: '', hwDescription: '',
    refName: '', refFile: null, refDesc: '',
  }
}
const kbForm = ref({ courseId:'general', type:'note', date:today, title:'', author:'', file:null })
const kbDocuments = ref([])
const kbCourses = ref([])
const finForm = ref({ type:'expense', date:today, category:'dining', amount:null, description:'', activityId:'', proposalId:'', handler:'', items:[{ category:'dining', amount:null, description:'' }] })
const finItemsAdd = () => { finForm.value.items.push({ category: finForm.value.type === 'income' ? 'tuition' : 'dining', amount: null, description: '' }) }
const finItemsRemove = (i) => { if (finForm.value.items.length > 1) finForm.value.items.splice(i, 1) }
const finItemsTotal = computed(() => Number(finForm.value.items.reduce((s, it) => s + (Number(it.amount) || 0), 0).toFixed(2)))
const finTransactions = ref([])
const activitiesList = ref([])
const actList = ref([])
const actStageLabel = (s) => ({ dated: '已定', planning: '待排期', recurring: '固定每周', reminder: '节日' }[s] || '其他')
const actTitle = (a) => typeof a.title === 'string' ? a.title : (a.title?.zh || a.title?.en || a.id)
const actDateRange = (a) => a.endDate ? `${a.date || '?'} ~ ${a.endDate}` : (a.date || (a.stage === 'recurring' ? '每周固定' : '—'))
async function loadActivityList() {
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/activities-db`)
    if (res.ok) {
      const j = await res.json()
      const list = Array.isArray(j) ? j : (j.activities || [])
      actList.value = list.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      activitiesList.value = actList.value
    }
  } catch (e) { console.warn('加载活动列表失败:', e) }
}
function editActivity(a) {
  const f = actForm.value
  f.id = a.id
  f.titleZh = typeof a.title === 'string' ? a.title : (a.title?.zh || '')
  f.stage = a.stage || 'dated'
  f.category = a.category || '社交'
  f.status = a.status || 'upcoming'
  f.tags = a.tags || null
  f.date = a.date || today
  f.endDate = a.endDate || ''
  f.time = a.time || ''
  f.locationZh = typeof a.location === 'string' ? a.location : (a.location?.zh || '')
  f.organizerZh = typeof a.organizer === 'string' ? a.organizer : (a.organizer?.zh || '')
  f.descriptionZh = typeof a.description === 'string' ? a.description : (a.description?.zh || '')
  f.scale = a.scale || ''
  f.capacity = a.capacity ?? null
  f.registered = a.registered ?? 0
  f.recurDays = Array.isArray(a.recurrence?.days) ? [...a.recurrence.days] : []
  f.recurTime = a.recurrence?.time || ''
  if (a.annual) { f.holidayType = 'annual'; f.annualMonth = a.annual.month; f.annualDay = a.annual.day }
  else if (a.floating) { f.holidayType = 'floating'; f.floatingMonth = a.floating.month; f.floatingWeekday = a.floating.weekday; f.floatingOrdinal = a.floating.ordinal }
  else if (a.lunar) { f.holidayType = 'lunar'; f.lunarMonth = a.lunar.month; f.lunarDay = a.lunar.day }
  else if (a.lunarEve) f.holidayType = 'lunarEve'
  else if (a.calculated) f.holidayType = 'calculated'
  else f.holidayType = 'annual'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function cancelEditActivity() { resetActForm() }
// 活动模块：新建表单展开状态（统一布局试点）
const actFormOpen = ref(false)
function openActForm() { resetActForm(); actFormOpen.value = true }
function openActEdit(a) { editActivity(a); actFormOpen.value = true }
function closeActForm() { resetActForm(); actFormOpen.value = false }
// 活动模块：按阶段筛选（统计 chip 点击切换，再点取消）
const actStageFilter = ref('')
const filteredActList = computed(() => {
  if (!actStageFilter.value) return actList.value
  return actList.value.filter(a => (a.stage || 'dated') === actStageFilter.value)
})
const actStageCount = (s) => actList.value.filter(a => (a.stage || 'dated') === s).length
function toggleActFilter(s) { actStageFilter.value = actStageFilter.value === s ? '' : s }
const actStats = computed(() => [
  { key: '', label: '全部', count: actList.value.length },
  { key: 'dated', label: '已定', count: actStageCount('dated') },
  { key: 'planning', label: '待排期', count: actStageCount('planning') },
  { key: 'recurring', label: '固定每周', count: actStageCount('recurring') },
  { key: 'reminder', label: '节日', count: actStageCount('reminder') },
])
function toggleRecurDay(d) {
  const arr = actForm.value.recurDays
  const i = arr.indexOf(d)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(d)
}
async function deleteActivity(a) {
  if (!confirm(`确定删除活动「${actTitle(a)}」吗？\n将记录操作人。`)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/activities`, {
      method: 'DELETE', headers: adminHeaders(), body: JSON.stringify({ id: a.id }),
    })
    await throwIfNotOk(res, '删除活动')
    invalidateResource('/api/activities-db')
    await loadActivityList()
    if (actForm.value.id === a.id) resetActForm()
    loadTodoBadges()
  } catch (e) { alert('删除失败: ' + e.message) }
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

// 各表单提交校验：必填未满足时提交按钮置灰（与课程资料/知识库体验一致，也避免提交空数据）
const annCanSubmit = computed(() => {
  const f = annForm.value
  return !!(f.titleZh.trim() && f.date && f.contentZh.trim())
})
const actCanSubmit = computed(() => {
  const f = actForm.value
  if (!f.titleZh.trim()) return false
  if (f.stage === 'dated') return !!f.date
  if (f.stage === 'planning') return true
  if (f.stage === 'recurring') return f.recurDays.length > 0
  if (f.holidayType === 'annual') return !!(f.annualMonth && f.annualDay)
  if (f.holidayType === 'floating') return !!(f.floatingMonth && f.floatingWeekday !== '' && f.floatingOrdinal)
  if (f.holidayType === 'lunar') return !!(f.lunarMonth && f.lunarDay)
  return true // lunarEve / calculated
})
const pollCanSubmit = computed(() => {
  const f = pollForm.value
  return !!(f.titleZh.trim() && f.deadline && f.options.length >= 2 && f.options.every(o => o.textZh.trim()))
})
const finCanSubmit = computed(() => {
  const f = finForm.value
  if (!(f.date && f.description.trim())) return false
  if (!f.items || !f.items.length) return false
  for (const it of f.items) { const a = Number(it.amount); if (!a || a <= 0) return false }
  // 财务制度：支出必须关联预算公示（事前公示）
  if (f.type === 'expense' && !f.proposalId) return false
  return true
})
const finBudgetTitle = (id) => {
  if (!id) return ''
  const b = finBudgets.value.find(x => x.id === id)
  return b ? `${b.title} · ¥${b.amount}` : String(id)
}

function onSlideFile(e) { cmForm.value.slideFile = e.target.files[0] }
function onHomeworkFile(e) { cmForm.value.homeworkFile = e.target.files[0] }
function onKbFile(e) { kbForm.value.file = e.target.files[0] }
function onRefSingleFile(e) { cmForm.value.refFile = e.target.files[0] }
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

// 上帝视角：仅网站最高权限者（雷振宇）一人可见每条留言的真实发布者；其余任何人仅见匿名标识
const isTreeholeGod = computed(() => currentUser.value?.name === '雷振宇')

// ===== Cloudflare 后端 admin API（封装见 utils/admin/api.js）=====
// Authorization 使用当前登录班委的个人 token（getToken），原样 Bearer 带上。

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

// ===== 提交记录（数据源：D1 admin_history 表）=====
const submitHistory = ref([])
const historyLoading = ref(false)
// 右列操作记录：仅显示当前模块（admin_history 的 type 与模块 id 一一对应）
const currentHistory = computed(() => submitHistory.value.filter(r => r.type === currentType.value))
const currentTypeLabel = computed(() => dataTypes.find(t => t.id === currentType.value)?.name || currentType.value)
function createRecord(type, desc, refId = null) {
  const r = {
    id: 'h-' + Date.now() + '-' + randomHex(3),
    type, typeName: dataTypes.find(t => t.id === type)?.name || type,
    description: desc, time: new Date().toISOString(),
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

// ===== 模块待办红点（未处理事项计数，登录后拉取、写操作后刷新） =====
const todoBadges = ref({ activities: 0, finance: 0, coins: 0 })
async function loadTodoBadges() {
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/todos`, { headers: adminHeaders() })
    if (!res.ok) return
    const j = await res.json()
    todoBadges.value = { activities: 0, finance: 0, coins: 0, ...(j.todos || {}) }
  } catch (e) { console.warn('加载待办计数失败:', e.message) }
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
    const revertedResource = HISTORY_TYPE_TO_RESOURCE[record.type]
    if (revertedResource) invalidateResource(dbKeyOf(revertedResource))
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
    // 摘要可选：不填则自动取正文开头 30 字
    const summaryZh = annForm.value.summaryZh.trim() || annForm.value.contentZh.trim().slice(0, 30)
    // 自动翻译
    const [titleT, summaryT, contentT] = await Promise.all([
      translateBoth(annForm.value.titleZh),
      translateBoth(summaryZh),
      translateBoth(annForm.value.contentZh),
    ])
    const ann = {
      id: 'ann-' + Date.now(), date: annForm.value.date, category: annForm.value.category, pinned: annForm.value.pinned,
      title: { zh: annForm.value.titleZh, en: titleT.en, th: titleT.th },
      summary: { zh: summaryZh, en: summaryT.en, th: summaryT.th },
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
    invalidateResource('/api/announcements')
    annForm.value = { titleZh:'', category:'normal', date:today, deadline:'', pinned:false, summaryZh:'', contentZh:'' }
    showToast('公告已发布')
  } catch(e) { rec.status='failed'; rec.error=e.message; showToast('发布失败：' + e.message, 'error') }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 提交/编辑活动（POST/PUT /api/admin/activities；按 stage 组装新版日历字段）=====
function buildActPayload() {
  const f = actForm.value
  const base = { id: f.id || 'act-' + Date.now(), stage: f.stage, category: f.stage === 'reminder' ? '节日' : f.category, status: f.status || 'upcoming' }
  if (f.tags) base.tags = f.tags
  if (f.stage === 'dated') {
    base.date = f.date
    if (f.endDate) base.endDate = f.endDate
    if (f.time) base.time = f.time
    if (f.locationZh) base.location = { zh: f.locationZh }
    if (f.organizerZh) base.organizer = { zh: f.organizerZh }
    if (f.descriptionZh) base.description = { zh: f.descriptionZh }
    if (f.scale) base.scale = f.scale
    if (typeof f.capacity === 'number' && f.capacity > 0) base.capacity = f.capacity
    if (typeof f.registered === 'number' && f.registered > 0) base.registered = f.registered
  } else if (f.stage === 'planning') {
    base.scale = f.scale || '小活动'
    if (f.time) base.time = f.time
    if (f.locationZh) base.location = { zh: f.locationZh }
    if (f.organizerZh) base.organizer = { zh: f.organizerZh }
    if (f.descriptionZh) base.description = { zh: f.descriptionZh }
    if (typeof f.capacity === 'number' && f.capacity > 0) base.capacity = f.capacity
    if (typeof f.registered === 'number' && f.registered > 0) base.registered = f.registered
  } else if (f.stage === 'recurring') {
    base.recurrence = { days: [...f.recurDays].sort(), time: f.recurTime || '' }
    if (f.locationZh) base.location = { zh: f.locationZh }
    if (f.descriptionZh) base.description = { zh: f.descriptionZh }
  } else { // reminder 节日提醒
    if (f.holidayType === 'annual') { base.annual = { month: Number(f.annualMonth), day: Number(f.annualDay) }; base.cadence = `每年 ${f.annualMonth} 月 ${f.annualDay} 日` }
    else if (f.holidayType === 'floating') { base.floating = { month: Number(f.floatingMonth), weekday: Number(f.floatingWeekday), ordinal: Number(f.floatingOrdinal) }; base.cadence = `每年 ${f.floatingMonth} 月第 ${f.floatingOrdinal} 个星期${'日一二三四五六'[Number(f.floatingWeekday)]}` }
    else if (f.holidayType === 'lunar') { base.lunar = { month: Number(f.lunarMonth), day: Number(f.lunarDay) }; base.cadence = `农历 ${f.lunarMonth} 月 ${f.lunarDay} 日` }
    else if (f.holidayType === 'lunarEve') { base.lunarEve = true; base.cadence = '农历年末最后一天' }
    else { base.calculated = 'qingming'; base.cadence = '每年清明节气' }
    if (f.descriptionZh) base.description = { zh: f.descriptionZh }
  }
  return base
}
async function submitActivity() {
  submitting.value = true
  const isEdit = !!actForm.value.id
  const rec = createRecord('activities', `${isEdit ? '编辑活动' : '添加活动'}: ${actForm.value.titleZh}`)
  try {
    const base = buildActPayload()
    const zhTitle = actForm.value.titleZh
    // 自动翻译（标题/地点/描述）
    const [titleT, locT, descT] = await Promise.all([
      translateBoth(zhTitle),
      translateBoth(base.location?.zh || '待定'),
      translateBoth(base.description?.zh || ''),
    ])
    base.title = { zh: zhTitle, en: titleT.en, th: titleT.th }
    if (base.location) { base.location.en = locT.en; base.location.th = locT.th }
    if (base.description) { base.description.en = descT.en; base.description.th = descT.th }
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/activities`, {
      method: isEdit ? 'PUT' : 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(base),
    })
    await throwIfNotOk(res, isEdit ? '编辑活动' : '添加活动')
    rec.ref_id = base.id
    rec.status = 'success'
    invalidateResource('/api/activities-db')
    resetActForm()
    actFormOpen.value = false
    await loadActivityList()
    showToast(isEdit ? '活动已保存' : '活动已发布')
    loadTodoBadges()
  } catch(e) { rec.status='failed'; rec.error=e.message; showToast('提交失败：' + e.message, 'error') }
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
  const rec = createRecord('courseMaterials', `更新${f.courseId}课程资料`)
  try {
    // 1. 读整包
    const pack = await getCurrentCourseMaterials()
    if (!Array.isArray(pack.courses)) pack.courses = []
    const course = pack.courses.find(c => c.id === f.courseId)
    if (!course) throw new Error('课程不存在')
    if (!Array.isArray(course.sessions)) course.sessions = []

    // 2. 定位目标讲次（已有 / 新建）
    let session
    if (f.target === 'existing') {
      const [sn, sdate] = f.sessionKey.split('@')
      session = course.sessions.find(s => Number(s.session) === Number(sn) && s.date === sdate)
      if (!session) throw new Error('目标讲次不存在，请刷新后重试')
      if (!Array.isArray(session.files)) session.files = []
      if (!Array.isArray(session.references)) session.references = []
    } else {
      if (course.sessions.some(s => Number(s.session) === Number(f.session)))
        throw new Error(`第${f.session}讲已存在，请改用「追加到已有讲次」`)
      session = { session: Number(f.session), date: f.date, title: f.title, files: [], references: [] }
      course.sessions.push(session)
    }

    // 3. 按内容类型局部合并；R2 路径统一用该讲日期
    const dateStr = session.date.replace(/-/g, '')
    const r2Base = `files/courses/${f.courseId}/${dateStr}`
    if (f.itemType === 'slide') {
      const url = await uploadFileToAdmin(f.slideFile, `${r2Base}/${f.slideFile.name}`)
      session.files.push({ name: (session.title || '') + ' 课件', filename: f.slideFile.name, url, size: formatSize(f.slideFile.size), type: 'slide', addedAt: new Date().toISOString() })
    } else if (f.itemType === 'homework') {
      const url = await uploadFileToAdmin(f.homeworkFile, `${r2Base}/${f.homeworkFile.name}`)
      session.homework = {
        name: (session.title || '') + ' 作业', deadline: f.hwDeadline || '',
        submission: f.hwSubmission || '待通知', description: f.hwDescription || '',
        filename: f.homeworkFile.name, url, size: formatSize(f.homeworkFile.size),
        addedAt: new Date().toISOString(),
      }
    } else if (f.itemType === 'reference') {
      if (f.refFile) {
        const url = await uploadFileToAdmin(f.refFile, `${r2Base}/${f.refFile.name}`)
        session.references.push({ name: f.refName.trim(), filename: f.refFile.name, url, size: formatSize(f.refFile.size), addedAt: new Date().toISOString() })
      } else {
        session.references.push({ name: f.refName.trim(), filename: '', url: '', desc: f.refDesc.trim() })
      }
    }
    course.sessions.sort((a, b) => Number(a.session) - Number(b.session))

    // 4. 整包写回
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/course-materials`, {
      method: 'PUT', headers: adminHeaders(), body: JSON.stringify(pack),
    })
    await throwIfNotOk(res, '保存课程资料')
    rec.status = 'success'
    invalidateResource('/api/course-materials-db')
    resetCmForm()
    await loadCourseFiles()
    cmFormOpen.value = false
    showToast('资料已上传')
  } catch(e) { rec.status='failed'; rec.error=e.message; showToast('上传失败：' + e.message, 'error') }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 课程资料：表单展开 + 按类型筛选 =====
const cmFormOpen = ref(false)
function openCmForm() { cmFormOpen.value = true }
function closeCmForm() { cmFormOpen.value = false }
const cmTab = ref('files') // 'files' = 当前课件与资料 | 'sessions' = 讲次管理
const cmTabs = [
  { key: 'files', label: '当前课件与资料' },
  { key: 'sessions', label: '讲次管理' },
]
const cmFilter = ref('')
const cmKindCount = (k) => cmFiles.value.filter(f => f.kind === k).length
const filteredCmFiles = computed(() => cmFilter.value ? cmFiles.value.filter(f => f.kind === cmFilter.value) : cmFiles.value)
function toggleCmFilter(s) { cmFilter.value = cmFilter.value === s ? '' : s }
const cmStats = computed(() => [
  { key: '', label: '全部', count: cmFiles.value.length },
  { key: '课件', label: '课件', count: cmKindCount('课件') },
  { key: '作业', label: '作业', count: cmKindCount('作业') },
  { key: '参考', label: '参考', count: cmKindCount('参考') },
])

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
    invalidateResource('/api/knowledge-db')
    kbForm.value = { courseId:'general', type:'note', date:today, title:'', author:'', file:null }
    await loadKbCourses()
    kbFormOpen.value = false
    showToast('资料已上传')
  } catch(e) { rec.status='failed'; rec.error=e.message; showToast('上传失败：' + e.message, 'error') }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 知识库：表单展开 + 按类型筛选 =====
const kbFormOpen = ref(false)
function openKbForm() { kbFormOpen.value = true }
function closeKbForm() { kbFormOpen.value = false }
const kbFilter = ref('')
const kbTypeCount = (t) => kbDocuments.value.filter(d => d.type === t).length
const kbTypeLabel = (t) => ({ note: '课程笔记', summary: '重点总结', exam: '考题参考', resource: '学习资源' }[t] || t)
const filteredKbDocs = computed(() => kbFilter.value ? kbDocuments.value.filter(d => d.type === kbFilter.value) : kbDocuments.value)
function toggleKbFilter(s) { kbFilter.value = kbFilter.value === s ? '' : s }
const kbStats = computed(() => [
  { key: '', label: '全部', count: kbDocuments.value.length },
  { key: 'note', label: '笔记', count: kbTypeCount('note') },
  { key: 'summary', label: '总结', count: kbTypeCount('summary') },
  { key: 'exam', label: '考题', count: kbTypeCount('exam') },
  { key: 'resource', label: '资源', count: kbTypeCount('resource') },
])

// ===== 提交班费（结构化流水 POST /api/admin/finance/transactions）=====
async function submitFinance() {
  submitting.value = true
  const rec = createRecord('finance', `添加班费${finForm.value.type==='income'?'收入':'支出'}: ${finForm.value.description}`)
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/transactions`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        date: finForm.value.date, type: finForm.value.type, category: finForm.value.category,
        amount: finItemsTotal.value, description: finForm.value.description,
        items: finForm.value.items.map(it => ({ category: it.category, amount: Number(it.amount), description: it.description || '' })),
        activityId: finForm.value.activityId || null,
        proposalId: finForm.value.proposalId || null,
        handler: finForm.value.handler || null,
      }),
    })
    await throwIfNotOk(res, '添加班费记录')
    rec.status = 'success'
    invalidateResource('/api/finance-v2')
    finForm.value = { type:'expense', date:today, category:'dining', amount:null, description:'', activityId:'', proposalId:'', handler:'', items:[{ category:'dining', amount:null, description:'' }] }
    await loadFinanceTransactions()
    finFormOpen.value = false
    showToast('收支已入账')
  } catch(e) { rec.status='failed'; rec.error=e.message; showToast('入账失败：' + e.message, 'error') }
  submitting.value = false
  await saveRecord(rec)
}

// ===== 班费：流水表单展开 + 类型筛选；预算表单展开 + 状态筛选 =====
const finFormOpen = ref(false)
function openFinForm() { finFormOpen.value = true }
function closeFinForm() { finFormOpen.value = false }
const finTxFilter = ref('')
const finTxKindCount = (k) => finTransactions.value.filter(t => t.type === k).length
const filteredFinTx = computed(() => finTxFilter.value ? finTransactions.value.filter(t => t.type === finTxFilter.value) : finTransactions.value)
function toggleFinTxFilter(s) { finTxFilter.value = finTxFilter.value === s ? '' : s }
const finTxStats = computed(() => [
  { key: '', label: '全部', count: finTransactions.value.length },
  { key: 'income', label: '收入', count: finTxKindCount('income') },
  { key: 'expense', label: '支出', count: finTxKindCount('expense') },
])
const budgetFormOpen = ref(false)
function openBudgetForm() { budgetFormOpen.value = true }
function closeBudgetForm() { budgetFormOpen.value = false }
const budgetFilter = ref('')
const budgetKindCount = (s) => finBudgets.value.filter(b => b.status === s).length
// 公示到期前 24h 提醒计数（仅 open 且 exposeEnd 在 now ~ now+24h）
const budgetExpiringCount = computed(() => {
  const now = Date.now()
  return finBudgets.value.filter(b => {
    if (b.status !== 'open' || !b.exposeEnd) return false
    const end = new Date(b.exposeEnd).getTime()
    return end > now && end <= now + 24 * 3600 * 1000
  }).length
})
const budgetEndedCount = computed(() => finBudgets.value.filter(b => !['open', 'passed', 'submitted', 'returned'].includes(b.status)).length)
const filteredFinBudgets = computed(() => {
  const f = budgetFilter.value
  if (!f) return finBudgets.value
  if (f === 'ended') return finBudgets.value.filter(b => !['open', 'passed', 'submitted', 'returned'].includes(b.status))
  return finBudgets.value.filter(b => b.status === f)
})
function toggleBudgetFilter(s) { budgetFilter.value = budgetFilter.value === s ? '' : s }
const budgetStats = computed(() => [
  { key: '', label: '全部', count: finBudgets.value.length },
  { key: 'submitted', label: '待审批', count: budgetKindCount('submitted') },
  { key: 'open', label: '公示中', count: budgetKindCount('open') },
  { key: 'passed', label: '已通过', count: budgetKindCount('passed') },
  { key: 'returned', label: '已退回', count: budgetKindCount('returned') },
  { key: 'ended', label: '已结束', count: budgetEndedCount },
])

// ===== 预算公示 v2 审批：公开 / 退回（仅会计程枭，其他主理人只读）=====
const isAccountantView = computed(() => (currentUser.value?.name || '') === '程枭')
const budgetReturn = ref(null) // { id, title, reason }
const budgetApproved = ref(null) // { title, proposalNo, url }
const budgetApproveConfirm = ref(null) // { id, title }
// 公示详情弹层（完整展示提交字段 + 预算总额 + 审批按钮）
const budgetDetail = ref(null) // 当前查看的公示对象
function openBudgetDetail(b) { budgetDetail.value = b }
function closeBudgetDetail() { budgetDetail.value = null }
const bdItemsTotal = computed(() => {
  const items = budgetDetail.value?.detailItems || []
  return Math.round(items.reduce((s, it) => s + (Number(it.amount) || 0), 0) * 100) / 100
})
const bdDiff = computed(() => Math.round((Number(budgetDetail.value?.amount || 0) - bdItemsTotal.value) * 100) / 100)
const bdRedlinesOk = computed(() => { const r = budgetDetail.value?.redlines || {}; return !!(r.r1 && r.r2 && r.r3) })
const bdUnchecked = computed(() => { const r = budgetDetail.value?.redlines || {}; return [r.r1, r.r2, r.r3].filter(v => !v).length })
const bdAttachment = computed(() => {
  const a = budgetDetail.value?.attachment
  if (!a) return null
  if (typeof a === 'string') { try { const o = JSON.parse(a); return o && o.url ? o : null } catch { return null } }
  return a && a.url ? a : null
})
function bdActivityTitle(id) {
  if (!id) return '—'
  const a = actList.value.find(x => String(x.id) === String(id))
  return a ? actTitle(a) : id
}
const formatAmount = (n) => (Number(n) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
// 公示附件兼容解析：历史数据 attachment 为空 / 非法 JSON 均视为无附件
function parseBudgetAtt(att) {
  if (!att) return null
  if (typeof att === 'string') {
    try {
      const o = JSON.parse(att)
      return o && o.url ? o : null
    } catch { return null }
  }
  return att && att.url ? att : null
}
function openBudgetApprove(b) { budgetApproveConfirm.value = { id: b.id, title: b.title } }
function closeBudgetApprove() { budgetApproveConfirm.value = null }
async function doBudgetApprove() {
  const c = budgetApproveConfirm.value
  if (!c) return
  submitting.value = true
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/budgets/${c.id}`, {
      method: 'PATCH', headers: adminHeaders(), body: JSON.stringify({ action: 'approve' }),
    })
    const j = await res.json().catch(() => ({}))
    await throwIfNotOk(res, '公开公示')
    invalidateResource('/api/finance-v2')
    await loadFinanceTransactions()
    loadTodoBadges()
    budgetApproveConfirm.value = null
    budgetApproved.value = { title: c.title, proposalNo: j.proposalNo || '', url: `${window.location.origin}/finance/budgets/` }
  } catch (e) { alert('公开失败: ' + e.message) }
  submitting.value = false
}
function openBudgetReturn(b) { budgetReturn.value = { id: b.id, title: b.title, reason: '' } }
function closeBudgetReturn() { budgetReturn.value = null }
async function doBudgetReturn() {
  const r = budgetReturn.value
  if (!r || !r.reason.trim()) { alert('请填写退回原因（告知发起人缺什么资料）'); return }
  submitting.value = true
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/budgets/${r.id}`, {
      method: 'PATCH', headers: adminHeaders(), body: JSON.stringify({ action: 'return', reason: r.reason.trim() }),
    })
    await throwIfNotOk(res, '退回公示')
    invalidateResource('/api/finance-v2')
    await loadFinanceTransactions()
    loadTodoBadges()
    budgetReturn.value = null
    showToast('已退回，发起人可修改后重新提交')
  } catch (e) { alert('退回失败: ' + e.message) }
  submitting.value = false
}

// ===== 课程资料 / 班费：当前内容列表与单条删除（flatten/build 纯函数见 utils/admin/utils.js） =====
async function loadCourseFiles() {
  try {
    const pack = await getCurrentCourseMaterials()
    cmPack.value = pack
    cmFiles.value = flattenCourseFiles(pack)
    cmMgr.value = buildCmMgrRows(pack)
  } catch (e) { console.warn('加载课件列表失败:', e.message) }
}
async function deleteCourseFile(item) {
  if (!confirm(`确定删除「${item.name}」吗？\n将同时删除 R2 中的文件，并记录操作人。`)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/course-materials`, {
      method: 'DELETE', headers: adminHeaders(), body: JSON.stringify({ fileUrl: item.fileUrl }),
    })
    await throwIfNotOk(res, '删除课件')
    invalidateResource('/api/course-materials-db')
    cmFiles.value = cmFiles.value.filter(x => x.fileUrl !== item.fileUrl)
  } catch (e) { alert('删除失败: ' + e.message) }
}
// ===== 讲次管理（编辑标题/日期、删除讲次；行构建见 utils/admin/utils.js buildCmMgrRows） =====
const cmMgr = ref([])
async function saveSession(course, sx) {
  if (!sx.draftTitle.trim()) { alert('讲次标题不能为空'); return }
  submitting.value = true
  try {
    const pack = await getCurrentCourseMaterials()
    const co = pack.courses.find(c => c.id === course.id)
    const target = (co?.sessions || []).find(x => Number(x.session) === Number(sx.session) && x.date === sx.date)
    if (!target) throw new Error('未找到该讲次，请刷新后重试')
    target.title = sx.draftTitle.trim()
    target.date = sx.draftDate
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/course-materials`, {
      method: 'PUT', headers: adminHeaders(), body: JSON.stringify(pack),
    })
    await throwIfNotOk(res, '保存讲次')
    invalidateResource('/api/course-materials-db')
    await loadCourseFiles()
  } catch (e) { alert('保存讲次失败: ' + e.message) }
  submitting.value = false
}
async function deleteSession(course, sx) {
  const has = sx.urls.length > 0
  if (!confirm(`确定删除「${course.name} 第${sx.session}讲」吗？` +
    (has ? `\n该讲次下 ${sx.urls.length} 个文件将一并从云存储删除，且不可恢复。` : '\n该讲次为空，可安全删除。'))) return
  submitting.value = true
  try {
    for (const u of sx.urls) {
      try {
        await fetchWithRetry(`${API_PREFIX}/api/admin/course-materials`, {
          method: 'DELETE', headers: adminHeaders(), body: JSON.stringify({ fileUrl: u }),
        })
      } catch { /* 继续，最后整包清理 */ }
    }
    const pack = await getCurrentCourseMaterials()
    const co = pack.courses.find(c => c.id === course.id)
    if (co) {
      co.sessions = (co.sessions || []).filter(x =>
        !(Number(x.session) === Number(sx.session) && x.date === sx.date))
    }
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/course-materials`, {
      method: 'PUT', headers: adminHeaders(), body: JSON.stringify(pack),
    })
    await throwIfNotOk(res, '删除讲次')
    invalidateResource('/api/course-materials-db')
    await loadCourseFiles()
  } catch (e) { alert('删除讲次失败: ' + e.message) }
  submitting.value = false
}

async function loadFinanceTransactions() {
  try {
    const [pubRes, adminRes] = await Promise.all([
      fetchWithRetry(`${API_PREFIX}/api/finance-v2`, { headers: adminHeaders() }),
      fetchWithRetry(`${API_PREFIX}/api/admin/finance/budgets`, { headers: adminHeaders() }),
    ])
    if (pubRes.ok) {
      const j = await pubRes.json()
      finTransactions.value = j.transactions || []
      finReimbursements.value = j.reimbursements || []
    }
    if (adminRes.ok) {
      const j = await adminRes.json()
      finBudgets.value = j.budgets || []
    }
  } catch (e) { console.warn('加载班费数据失败:', e.message) }
}
async function deleteFinanceTx(tx) {
  if (!confirm(`确定删除这条${tx.type==='income'?'收入':'支出'}流水吗？\n将记录操作人。`)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/transactions`, {
      method: 'DELETE', headers: adminHeaders(), body: JSON.stringify({ id: tx.id }),
    })
    await throwIfNotOk(res, '删除流水')
    invalidateResource('/api/finance-v2')
    finTransactions.value = finTransactions.value.filter(t => String(t.id) !== String(tx.id))
  } catch (e) { alert('删除失败: ' + e.message) }
}

// ===== 预算公示 / 报销审批（班费线上化）=====
const finBudgets = ref([])
const finReimbursements = ref([])
const budgetForm = ref({ activityId:'', title:'', description:'', detailItems:[{item:'',amount:null}], amount:null, proposer:'', exposeType:'normal', approvalNote:'' })
function addBudgetItem() { budgetForm.value.detailItems.push({ item:'', amount:null }) }
function removeBudgetItem(i) { if (budgetForm.value.detailItems.length > 1) budgetForm.value.detailItems.splice(i, 1) }
const budgetCanSubmit = computed(() => {
  const f = budgetForm.value
  return !!(f.title.trim() && Number(f.amount) > 0)
})
const finCatOptions = computed(() => {
  const expenseCats = ['dining','marketing','transport','venue','speaker','lodging','ticket','prize','insurance','supplies','other']
  const incomeCats = ['tuition','sponsor','interest','other']
  const labels = {
    dining:'餐饮费', marketing:'宣传物料', transport:'交通费', venue:'场地设备', speaker:'讲师嘉宾',
    lodging:'住宿', ticket:'门票', prize:'奖品纪念品', insurance:'保险', supplies:'物资文具', other:'其他',
    tuition:'班费缴纳', sponsor:'赞助/奖金收入', interest:'利息收入',
  }
  const src = finForm.value.type === 'income' ? incomeCats : expenseCats
  return src.map(c => ({ key: c, label: labels[c] || c }))
})
watch(() => finForm.value.type, (v) => { finForm.value.category = v === 'income' ? 'tuition' : 'dining' })
async function publishBudget() {
  submitting.value = true
  const rec = createRecord('finance', `发布预算公示: ${budgetForm.value.title}`)
  try {
    const items = budgetForm.value.detailItems.filter(i => i.item && String(i.item).trim()).map(i => ({ item: String(i.item).trim(), amount: Number(i.amount) || 0 }))
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/budgets`, {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({
        activityId: budgetForm.value.activityId || null, title: budgetForm.value.title,
        description: budgetForm.value.description, detailItems: items,
        amount: Number(budgetForm.value.amount), proposer: budgetForm.value.proposer,
        exposeType: budgetForm.value.exposeType,
        approvalNote: budgetForm.value.exposeType === 'emergency' ? budgetForm.value.approvalNote : '',
      }),
    })
    await throwIfNotOk(res, '发布预算公示')
    rec.status = 'success'
    invalidateResource('/api/finance-v2')
    budgetForm.value = { activityId:'', title:'', description:'', detailItems:[{item:'',amount:null}], amount:null, proposer:'', exposeType:'normal', approvalNote:'' }
    await loadFinanceTransactions()
    budgetFormOpen.value = false
    showToast('预算公示已发布')
    loadTodoBadges()
  } catch(e) { rec.status='failed'; rec.error=e.message; showToast('发布失败：' + e.message, 'error') }
  submitting.value = false
  await saveRecord(rec)
}
async function settleBudget(b) {
  if (!confirm(`结算「${b.title}」？\n当前反对 ${b.objectionCount} 人，将按反对 ≥ 1/3 自动判定。`)) return
  submitting.value = true
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/budgets/${b.id}/settle`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ action: 'settle' }),
    })
    await throwIfNotOk(res, '结算预算')
    invalidateResource('/api/finance-v2')
    await loadFinanceTransactions()
    loadTodoBadges()
  } catch (e) { alert('结算失败: ' + e.message) }
  submitting.value = false
}
async function cancelBudget(b) {
  if (!confirm(`取消「${b.title}」的公示？`)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/budgets/${b.id}/settle`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ action: 'cancel' }),
    })
    await throwIfNotOk(res, '取消预算')
    invalidateResource('/api/finance-v2')
    await loadFinanceTransactions()
    loadTodoBadges()
  } catch (e) { alert('取消失败: ' + e.message) }
}
// ===== 报销审批：二次确认 + 审批人意见（通过/退回/驳回/打款均留痕）=====
const reimbAudit = ref(null) // { id, action }
const reimbAuditNote = ref('')
const reimbAuditLabel = computed(() => reimbAudit.value
  ? ({ approve: '通过', reject: '驳回', revision: '退回补正', pay: '确认打款' }[reimbAudit.value.action] || '')
  : '')
const reimbAuditNotePh = computed(() => {
  if (!reimbAudit.value) return ''
  const a = reimbAudit.value.action
  if (a === 'pay') return '打款留言（已按规范预填，可修改）'
  if (a === 'approve') return '通过意见（必填，如：同意报销，凭证齐全）'
  if (a === 'revision') return '退回补正意见（必填，请说明需要修改的内容）'
  return '驳回原因（必填）'
})
function openReimbAudit(r, action) {
  reimbAudit.value = { id: r.id, action }
  reimbAuditNote.value = action === 'pay' ? `李浩鹏写小荷包付给${r.applicant}` : ''
}
function closeReimbAudit() { reimbAudit.value = null; reimbAuditNote.value = '' }
async function doReimbAudit(r) {
  const a = reimbAudit.value
  if (!a || a.id !== r.id) return
  const action = a.action
  const note = reimbAuditNote.value.trim()
  if (!note) { showToast('请填写审批意见', 'error'); return }
  if (!confirm(`确认${reimbAuditLabel.value}报销「${r.description}」（¥${r.amount}）？\n\n审批意见：${note}`)) return
  submitting.value = true
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/reimbursements/${r.id}/audit`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ action, note }),
    })
    await throwIfNotOk(res, '报销处理')
    invalidateResource('/api/finance-v2')
    await loadFinanceTransactions()
    closeReimbAudit()
    showToast(`报销${reimbAuditLabel.value}成功`)
    loadTodoBadges()
  } catch (e) { showToast('操作失败: ' + e.message, 'error') }
  submitting.value = false
}

// ===== 财务参数配置（班委可见；leader/deputy/监督人可改）=====
const finConfig = ref(null)
const finConfigMsg = ref('')
const finRoles = ref([])
const roleNameInput = ref('')
const roleSelect = ref('accountant')
async function loadFinanceConfig() {
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/config`, { headers: adminHeaders() })
    if (!res.ok) return
    const j = await res.json()
    finConfig.value = { ...(j.config || {}) }
    finRoles.value = j.roles || []
  } catch (e) { console.warn('加载财务配置失败:', e.message) }
}
async function saveFinanceConfig() {
  finConfigMsg.value = ''
  try {
    // 制度写死三项（69 人 / 23 票 / 公示 3 天）不随配置保存，后端同样忽略
    const cfg = { ...(finConfig.value || {}) }
    delete cfg.classSize
    delete cfg.vetoCount
    delete cfg.exposeDays
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/config`, {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({ config: cfg, roles: finRoles.value.map(r => ({ name: r.name, f_role: r.f_role })) }),
    })
    await throwIfNotOk(res, '保存财务配置')
    finConfigMsg.value = '已保存'
    await loadFinanceConfig()
    invalidateResource('/api/finance-v2')
    setTimeout(() => { finConfigMsg.value = '' }, 2500)
  } catch (e) { alert('保存失败: ' + e.message) }
}
async function addFinanceRole() {
  const name = String(roleNameInput.value || '').trim()
  if (!name) return
  if (finRoles.value.some(r => r.name === name && r.f_role === roleSelect.value)) { roleNameInput.value = ''; return }
  finRoles.value.push({ name, f_role: roleSelect.value, user_id: null })
  roleNameInput.value = ''
}
function removeFinanceRole(i) { finRoles.value.splice(i, 1) }

// ===== 薄荷币（申报审核 / 规则配置）=====
const coinClaims = ref([])
const coinClaimsMsg = ref('')
const coinRules = ref([])
const approvingId = ref('')
const rejectingId = ref('')
const rejectNote = ref('')
const ruleForm = ref({ nameZh: '', nameEn: '', nameTh: '', amount: 1, unit: 'fixed', category: 'contribution', isRoutine: true, note: '' })

// 薄荷币规则：表单展开 + 常规/自定义筛选
const ruleFormOpen = ref(false)
function openRuleForm() { ruleFormOpen.value = true }
function closeRuleForm() { ruleFormOpen.value = false }
const coinRuleFilter = ref('')
const coinRuleKindCount = (k) => coinRules.value.filter(r => k === 'routine' ? r.isRoutine : !r.isRoutine).length
const coinRuleCustomCount = computed(() => coinRules.value.filter(r => !r.isRoutine).length)
const filteredCoinRules = computed(() => {
  const f = coinRuleFilter.value
  if (!f) return coinRules.value
  return coinRules.value.filter(r => f === 'routine' ? r.isRoutine : !r.isRoutine)
})
function toggleCoinRuleFilter(s) { coinRuleFilter.value = coinRuleFilter.value === s ? '' : s }
const coinRuleStats = computed(() => [
  { key: '', label: '全部', count: coinRules.value.length },
  { key: 'routine', label: '常规', count: coinRuleKindCount('routine') },
  { key: 'custom', label: '自定义', count: coinRuleCustomCount },
])

async function loadCoinClaims() {
  coinClaimsMsg.value = ''
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/coins/claims`, { headers: adminHeaders() })
    if (!res.ok) { coinClaimsMsg.value = '加载申报失败'; return }
    const j = await res.json()
    coinClaims.value = j.claims || []
  } catch (e) { coinClaimsMsg.value = '网络错误' }
}
async function loadCoinRules() {
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/coins/rules`, { headers: adminHeaders() })
    if (!res.ok) return
    const j = await res.json()
    coinRules.value = j.rules || []
  } catch (e) {}
}
async function approveClaim(c) {
  if (!confirm(`确认通过「${c.title}」并发放 ${c.total} 币给 ${c.recipients.length} 人？`)) return
  approvingId.value = c.id
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/coins/claims/${c.id}`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ action: 'approve' }),
    })
    await throwIfNotOk(res, '审核通过')
    coinClaims.value = coinClaims.value.filter(x => x.id !== c.id)
    loadHistory()
    loadTodoBadges()
  } catch (e) { alert(e.message) }
  finally { approvingId.value = '' }
}
function openReject(c) { rejectingId.value = c.id; rejectNote.value = '' }
async function doReject(c) {
  const note = rejectNote.value.trim()
  if (!note) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/coins/claims/${c.id}`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ action: 'reject', note }),
    })
    await throwIfNotOk(res, '驳回')
    coinClaims.value = coinClaims.value.filter(x => x.id !== c.id)
    rejectingId.value = ''
    rejectNote.value = ''
    loadHistory()
    loadTodoBadges()
  } catch (e) { alert(e.message) }
}
async function createRule() {
  if (!ruleForm.value.nameZh.trim() || !ruleForm.value.amount) return
  submitting.value = true
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/coins/rules`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ ...ruleForm.value }),
    })
    await throwIfNotOk(res, '添加规则')
    ruleForm.value = { nameZh: '', nameEn: '', nameTh: '', amount: 1, unit: 'fixed', category: 'contribution', isRoutine: true, note: '' }
    loadCoinRules()
    loadHistory()
    ruleFormOpen.value = false
    showToast('规则已添加')
  } catch (e) { showToast('添加失败：' + e.message, 'error') }
  finally { submitting.value = false }
}
async function toggleRule(r) {
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/coins/rules/${r.id}`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ action: 'toggle' }),
    })
    await throwIfNotOk(res, '切换状态')
    loadCoinRules()
    loadHistory()
  } catch (e) { alert(e.message) }
}
async function deleteRule(r) {
  if (!confirm(`确定删除规则「${r.name_zh}」？历史流水不受影响。`)) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/coins/rules/${r.id}`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify({ action: 'delete' }),
    })
    await throwIfNotOk(res, '删除规则')
    loadCoinRules()
    loadHistory()
  } catch (e) { alert(e.message) }
}
function coinRuleName(id) {
  const r = coinRules.value.find(x => x.id === id)
  return r ? r.name_zh : (id || '—')
}

// ===== 监督视图（仅雷振宇可见；票向实名明细 + 对账 + 全局流水）=====
const isSupervisorLzy = computed(() => (currentUser.value?.name || '') === '雷振宇')
const finSupervision = ref(null)
const supervisionMsg = ref('')
async function loadFinanceSupervision() {
  if (!isSupervisorLzy.value) return
  try {
    const res = await fetchWithRetry(`${API_PREFIX}/api/admin/finance/supervision`, { headers: adminHeaders() })
    if (!res.ok) { supervisionMsg.value = '监督视图加载失败（可能无权限）'; return }
    finSupervision.value = await res.json()
  } catch (e) { supervisionMsg.value = '监督视图加载失败' }
}
watch(isSupervisorLzy, v => { if (v) loadFinanceSupervision() }, { immediate: true })

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
    invalidateResource('/api/activities-db')
    albForm.value.localPhotos.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl))
    albForm.value = { title:'', date:today, url:'', albumType:'live', coverFile:null, localPhotos:[], description:'' }
    showToast('相册已发布')
  } catch(e) { rec.status='failed'; rec.error=e.message; showToast('发布失败：' + e.message, 'error') }
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
    invalidateResource('/api/polls-admin')
    pollForm.value = {
      titleZh: '', descriptionZh: '', type: 'single', anonymous: false,
      visibility: 'after_vote', deadline: '',
      options: [{ textZh: '', imageFile: null }, { textZh: '', imageFile: null }],
    }
    showToast('投票已发布')
  } catch(e) { rec.status='failed'; rec.error=e.message; showToast('发布失败：' + e.message, 'error') }
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
    invalidateResource('/api/knowledge-db')
    kbDocuments.value = kbDocuments.value.filter(d => String(d.id) !== String(doc.id))
  } catch (e) { alert('删除失败: ' + e.message) }
}
onMounted(() => {
  if (isAuthenticated.value) { loadHistory(); loadTodoBadges() }
})
// 登录成功后加载提交记录与待办红点
watch(isAuthenticated, (v) => { if (v) { loadHistory(); loadTodoBadges() } })
watch(currentType, (val) => {
  if (val === 'courseMaterials') loadCourseFiles()
  if (val === 'finance') { loadFinanceTransactions(); loadFinanceConfig(); if (isSupervisorLzy.value) loadFinanceSupervision(); if (activitiesList.value.length === 0) loadActivityList() }
  if (val === 'coins') { loadCoinClaims(); loadCoinRules() }
  if (val === 'activities' && actList.value.length === 0) loadActivityList()
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
.type-tab { position: relative; padding: 10px 18px; background: var(--c-bg-card); border: 1.5px solid var(--c-border); border-radius: 12px; font-size: 14px; font-weight: 500; color: var(--c-text-secondary); cursor: pointer; transition: all 0.2s; }
.todo-badge { position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #ff3b30; color: #fff; font-size: 11px; font-weight: 700; line-height: 18px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
.type-tab:hover { border-color: var(--c-accent); color: var(--c-accent); }
.type-tab.active { background: var(--c-accent); border-color: var(--c-accent); color: #fff; }
.fin-subtabs { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; padding-bottom: 14px; border-bottom: 1px dashed var(--c-border); }
.fin-subtabs .type-tab { padding: 7px 14px; border-radius: 10px; font-size: 13px; }
/* ===== 模块统一布局（动作栏/tab 条见 components/admin/ModuleBar.vue、ModuleTabs.vue）===== */
.module-section { background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
.budget-expiring { margin: 0 0 14px; padding: 8px 12px; border-radius: 8px; background: rgba(255, 149, 0, .12); border: 1px solid rgba(255, 149, 0, .4); color: #e8890c; font-size: 13px; }
.module-form { background: var(--c-bg-secondary); border: 1px dashed var(--c-border-accent); border-radius: 14px; padding: 18px; margin-bottom: 18px; }
.module-form h3 { font-size: 16px; font-weight: 700; margin: 0 0 16px; }
.module-list { }
.module-list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.module-list-head h4 { font-size: 15px; font-weight: 700; margin: 0; }
.module-list .empty-hint { padding: 28px 0; text-align: center; color: var(--c-text-tertiary); font-size: 13px; }

/* ===== 统一操作提示 toast ===== */
.admin-toast { position: fixed; top: 84px; left: 50%; transform: translateX(-50%); z-index: 9999; max-width: 90%; padding: 11px 22px; border-radius: 12px; font-size: 14px; font-weight: 600; color: #fff; box-shadow: 0 6px 24px rgba(0,0,0,.18); }
.admin-toast.success { background: var(--c-accent, #2D7A6C); }
.admin-toast.error { background: #ff3b30; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .25s ease, transform .25s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translate(-50%, -8px); }

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

.submit-btn { padding: 7px 16px; background: var(--c-accent); color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
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
.history-desc { font-size: 13px; font-weight: 500; margin-bottom: 3px; line-height: 1.4; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; cursor: pointer; transition: background .15s; border-radius: 6px; padding: 2px 4px; margin-left: -4px; }
.history-desc:hover { background: var(--c-bg-elevated); }
.history-desc.expanded { -webkit-line-clamp: unset; display: block; }
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
.treehole-anon-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: rgba(94,196,172,0.15); color: var(--c-accent); }
.treehole-real-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: rgba(0,122,255,0.12); color: #0a84ff; }
.treehole-item-realname { font-size: 12px; font-weight: 600; color: #ff9500; background: rgba(255,149,0,0.12); padding: 2px 8px; border-radius: 6px; }
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
.demo-chip {
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  color: #b78a1a;
  background: rgba(255, 214, 102, 0.18);
  border: 0.5px solid rgba(183, 138, 26, 0.35);
  border-radius: 999px;
  padding: 3px 8px;
  margin-left: 4px;
}
.existing-del { flex-shrink: 0; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 8px; border: 1px solid #ff3b30; color: #ff3b30; background: transparent; cursor: pointer; transition: all .2s; }
.existing-del:hover { background: #ff3b30; color: #fff; }
.existing-del.ok { border-color: #34c759; color: #2f9e44; }
.existing-del.ok:hover { background: #34c759; color: #fff; }

/* 薄荷币审核 */
.audit-actions { display: flex; gap: 8px; flex-shrink: 0; }
.audit-ok, .audit-no, .audit-cancel {
  flex-shrink: 0; font-size: 12px; font-weight: 600; padding: 5px 12px;
  border-radius: 8px; background: transparent; cursor: pointer; transition: all .2s;
}
.audit-ok { border: 1px solid #34c759; color: #2f9e44; }
.audit-ok:hover:not(:disabled) { background: #34c759; color: #fff; }
.audit-ok:disabled { opacity: 0.5; cursor: not-allowed; }
.audit-no { border: 1px solid #ff3b30; color: #ff3b30; }
.audit-no:hover:not(:disabled) { background: #ff3b30; color: #fff; }
.audit-no:disabled { opacity: 0.5; cursor: not-allowed; }
.audit-cancel { border: 1px solid var(--c-border, #e5e5ea); color: var(--c-text-secondary, #6e6e73); }
.audit-cancel:hover { border-color: var(--c-text-secondary, #6e6e73); }
.reject-box { display: flex; gap: 8px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
.reject-box input { flex: 1; min-width: 180px; padding: 7px 10px; border: 1px solid #ff3b30; border-radius: 8px; font-size: 13px; background: var(--c-bg-secondary); color: var(--c-text-primary); }
.proofs-mini { display: flex; gap: 8px; flex-wrap: wrap; }
.proofs-mini a { font-size: 12px; color: #2d7a6c; text-decoration: underline; }
.proofs-mini a:hover { opacity: 0.8; }
/* 班费线上化（预算公示 / 报销审批） */
.input-textarea { width: 100%; padding: 8px 12px; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-bg-tertiary); color: var(--c-text); font-size: 13px; font-family: inherit; resize: vertical; box-sizing: border-box; }
.input-inline { flex: 1; min-width: 120px; padding: 7px 12px; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-bg-tertiary); color: var(--c-text); font-size: 13px; font-family: inherit; box-sizing: border-box; }
.budget-item-row { display: flex; gap: 8px; margin-bottom: 6px; align-items: center; }
.mini-add { background: none; border: 1px dashed var(--c-accent); color: var(--c-accent); border-radius: 10px; padding: 5px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }
.budget-objections { margin-top: 4px; }
.budget-objections summary { font-size: 12px; color: var(--c-accent); cursor: pointer; }
.obj-row { font-size: 12px; color: var(--c-text-secondary); padding: 2px 0; }
.obj-row a { color: var(--c-accent); text-decoration: none; word-break: break-all; }
.reimb-actions { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
.bc-open { color: var(--c-accent); } .bc-passed { color: #2f9e44; } .bc-rejected { color: #ff3b30; }
.bc-cancelled, .bc-spent { color: var(--c-text-tertiary); } .bc-pending { color: #b45309; }
.bc-submitted { color: #b45309; } .bc-approved { color: var(--c-accent); }
.bc-paid { color: #2f9e44; } .bc-rejected { color: #ff3b30; }
.bc-need_revision { color: #b45309; }
.bc-returned { color: #b45309; }
.budget-return-note { display: block; margin-top: 4px; color: #b45309; font-weight: 600; }
.bc-no { font-size: 11px; font-weight: 600; color: var(--c-text-tertiary); margin-left: 6px; border: 1px solid var(--c-border); border-radius: 6px; padding: 0 6px; }
/* 下拉/选择框：固定宽度，框内截断，点开下拉可看全部选项 */
.module-form select, .data-form select, .existing-list select { max-width: 100%; }
.module-form .form-group select, .data-form .form-group select { width: 100%; text-overflow: ellipsis; }
/* 财务 v2：参数配置 / 监督视图 */
.fin-config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.fin-config-grid .form-group { display: flex; flex-direction: column; gap: 6px; }
.fin-config-grid input { padding: 8px 12px; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-bg-tertiary); color: var(--c-text); font-size: 13px; font-family: inherit; box-sizing: border-box; }
.fin-roles-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.fin-role-row { display: flex; align-items: center; gap: 10px; background: var(--c-bg-tertiary); border-radius: 10px; padding: 8px 12px; font-size: 13px; }
.fin-role-name { font-weight: 600; color: var(--c-text-primary); }
.fin-role-f { color: var(--c-text-secondary); font-size: 12px; }
.fin-role-linked { color: #2f9e44; font-size: 12px; }
.fin-role-unlinked { color: #b45309; font-size: 12px; }
.fin-role-add { display: flex; gap: 8px; margin-bottom: 14px; }
.fin-config-actions { display: flex; align-items: center; gap: 12px; }
.supervision-item { align-items: flex-start; }
.obj-reason { font-size: 12px; color: var(--c-text-secondary); padding-left: 12px; }
.emergency-tag { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 10px; background: rgba(255,159,10,.15); color: #b45309; font-size: 11px; font-weight: 600; }
.ok { color: #2f9e44; }
/* 活动管理（新版日历字段） */
.form-actions { display: flex; gap: 10px; align-items: center; }
.week-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.week-chip {
  min-width: 38px; height: 34px; border-radius: var(--radius-full);
  border: 1px solid var(--c-border); background: var(--c-bg-tertiary);
  color: var(--c-text-secondary); font-size: 14px; cursor: pointer; font-family: inherit;
  transition: all .15s;
}
.week-chip.on { background: var(--c-accent); border-color: var(--c-accent); color: #fff; }
.act-stage {
  display: inline-block; font-size: 11px; font-weight: 600;
  padding: 1px 8px; border-radius: var(--radius-full); margin-right: 6px;
}
.act-dated { background: var(--c-accent-light); color: var(--c-accent); }
.act-planning { background: #fff7e6; color: #b45309; }
.act-recurring { background: #e8f4ec; color: #2f9e44; }
.act-reminder { background: #ffecec; color: #ff3b30; }
.session-mgr { margin-top: 16px; border-top: 1px dashed var(--c-border); padding-top: 14px; }
.session-mgr h4 { margin: 0 0 4px; font-size: 14px; color: var(--c-text-primary); }
.mgr-hint { margin: 0 0 10px; font-size: 12px; color: var(--c-text-tertiary); line-height: 1.5; }
.mgr-course { margin-bottom: 12px; }
.mgr-course-name { font-size: 13px; font-weight: 600; color: var(--c-text-primary); margin-bottom: 6px; }
.mgr-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.mgr-no { flex-shrink: 0; font-size: 12px; color: var(--c-text-tertiary); min-width: 46px; }
.mgr-title { flex: 1 1 180px; min-width: 140px; padding: 6px 9px; border-radius: 8px; border: 1px solid var(--c-border); background: var(--c-bg-primary); color: var(--c-text-primary); font-size: 13px; }
.mgr-date { flex-shrink: 0; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--c-border); background: var(--c-bg-primary); color: var(--c-text-primary); font-size: 12px; }
.mgr-count { flex-shrink: 0; font-size: 11px; color: var(--c-text-tertiary); }
.mgr-save { flex-shrink: 0; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 8px; border: 1px solid var(--c-accent); color: var(--c-accent); background: transparent; cursor: pointer; transition: all .2s; }
.mgr-save:hover:not(:disabled) { background: var(--c-accent); color: #fff; }
.mgr-save:disabled { opacity: .45; cursor: not-allowed; }
.mgr-del { flex-shrink: 0; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 8px; border: 1px solid #ff3b30; color: #ff3b30; background: transparent; cursor: pointer; transition: all .2s; }
.mgr-del:hover:not(:disabled) { background: #ff3b30; color: #fff; }
.mgr-del:disabled { opacity: .45; cursor: not-allowed; }
.tx-income { color: #ff3b30; font-weight: 700; }
.tx-expense { color: #248a3d; font-weight: 700; }

.seg-control { display: flex; gap: 4px; padding: 3px; background: var(--c-bg-tertiary); border-radius: 10px; margin-bottom: 10px; }
.seg-control button { flex: 1; padding: 7px 10px; font-size: 13px; font-weight: 600; border: none; border-radius: 8px; background: transparent; color: var(--c-text-secondary); cursor: pointer; transition: all .2s; white-space: nowrap; }
.seg-control button.active { background: var(--c-bg); color: var(--c-accent); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
.seg-control button:hover:not(.active) { color: var(--c-text); }
.fin-items-editor { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.fin-item-row { display: flex; gap: 6px; align-items: center; width: 100%; }
.fin-item-cat { flex: 0 0 104px; min-width: 0; font-size: 13px; }
.fin-item-amt { flex: 0 0 80px; min-width: 0; font-size: 13px; }
.fin-item-desc { flex: 1 1 auto; min-width: 0; width: auto; }
.fin-item-del { flex: 0 0 auto; white-space: nowrap; padding: 4px 10px; font-size: 12px; color: #ff3b30; background: rgba(255,59,48,.08); border: 1px solid rgba(255,59,48,.25); border-radius: 8px; cursor: pointer; transition: all .15s; }
.fin-item-del:hover:not(:disabled) { background: rgba(255,59,48,.16); border-color: #ff3b30; }
.fin-item-del:disabled { opacity: .35; cursor: not-allowed; }
.fin-item-add { align-self: flex-start; background: var(--c-bg-tertiary); border: 1px dashed var(--c-border-accent); color: var(--c-accent); border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer; }
.fin-item-add:hover { background: var(--c-accent-light); }
.fin-items-foot { display: flex; align-items: center; gap: 12px; }
.fin-items-total { font-size: 13px; font-weight: 700; color: var(--c-accent); }

/* ===== 公示详情弹窗 ===== */
.bd-modal { max-width: 760px; }
.bd-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-bottom: 10px; border-bottom: 1px solid var(--c-border); }
.bd-head .bd-amount { margin-left: auto; font-weight: 700; color: var(--c-accent); white-space: nowrap; }
.bd-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 16px; margin: 10px 0 4px; }
.bd-field { display: flex; gap: 6px; font-size: 13px; min-width: 0; }
.bd-label { flex-shrink: 0; color: var(--c-text-tertiary); }
.bd-field > span:last-child { overflow-wrap: anywhere; }
.bd-section { margin-top: 10px; font-size: 13px; }
.bd-label-row { margin-bottom: 4px; }
.bd-text { margin: 4px 0 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.bd-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.bd-table th, .bd-table td { border: 1px solid var(--c-border); padding: 5px 8px; text-align: left; vertical-align: top; }
.bd-table th { background: var(--c-bg-secondary); font-weight: 600; white-space: nowrap; }
.bd-table td:first-child { width: 28px; color: var(--c-text-tertiary); }
.bd-total { margin-top: 6px; font-size: 13px; font-weight: 600; }
.bd-total .ok { color: #16a34a; }
.bd-total .bad { color: #c92a2a; }
.bd-redline-ok { color: #16a34a; font-weight: 600; }
.bd-redline-bad { color: #c92a2a; font-weight: 600; }
.bd-return { padding: 8px 10px; background: var(--c-bg-secondary); border: 1px solid var(--c-border); border-radius: 8px; }
.bd-actions { margin-top: 14px; border-top: 1px solid var(--c-border); padding-top: 12px; }
.existing-del.detail { border-color: var(--c-border-accent); color: var(--c-text-secondary); }
.existing-del.detail:hover { border-color: var(--c-accent); color: var(--c-accent); }
@media (max-width: 640px) { .bd-grid { grid-template-columns: 1fr; } }
</style>
