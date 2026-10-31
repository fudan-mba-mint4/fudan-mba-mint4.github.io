---
layout: page
---

<PageHeader
  title="学习资料指南"
  description="覆盖课表、课件、知识库、入学测试的学习资料说明。"
  slogan="资料在手，学习不愁"
  icon="📚"
/>

<GuideDocShell
  topic="study"
  :headings="[
    { id: 'schedule', text: '课表', level: 2 },
    { id: 'slides', text: '课件 / 课程资料', level: 2 },
    { id: 'knowledge', text: '知识库', level: 2 },
    { id: 'quiz', text: '入学测试知识库', level: 2 },
    { id: 'faq', text: '常见问题', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: '指南中心', link: '/guide/' }, { label: '学习资料' }]" />
  </template>

  <GuideSectionHead
    id="schedule"
    title="课表"
    lead="近期课程、倒计时与课程辅助视图。"
  />

  <GuideStepList
    :steps="[
      { title: '入口', desc: '课表页展示近期课程与距离下次上课的倒计时。', link: { text: '打开课表', href: '/schedule' } },
      { title: '课程信息', desc: '每节课含时间、教室、授课教师，点击可查看详情。' },
      { title: '首页数据同源', desc: '首页「作业待办」「下节课 / 未读」与课表 / 课件数据实时同源。' },
      { title: '辅助视图', desc: '学期高速公路图、下一讲胶囊为课表页辅助视图。' },
      { title: '更新方式', desc: '遇到调课、代课，由班委及时更新课表信息。' }
    ]"
  />

  <GuideSectionHead
    id="slides"
    title="课件 / 课程资料"
    lead="按课程与讲次浏览课件 PDF、作业与参考资料。"
  />

  <GuideStepList
    :steps="[
      { title: '入口', desc: '按课程与讲次浏览课件 PDF、作业、参考资料。', link: { text: '打开课程资料', href: '/slides/' } },
      { title: '最新讲置顶', desc: '最新一讲始终排在最上面，按讲次排列，不会翻错页。' },
      { title: '在线预览', desc: '点击文件即可在线查看，也可以下载保存，不强制下载。' },
      { title: '未读红点', desc: '首页课件入口带未读红点，进入课件页即清零。' },
      { title: '当前学期课程', desc: '当前学期课程包括：数据、模型与决策（DMD）、管理经济学、会计学。' },
      { title: '维护归属', desc: '课程资料由智库研究员负责维护和更新。' }
    ]"
  />

  <GuideSectionHead
    id="knowledge"
    title="知识库"
    lead="智库研究员维护的知识沉淀区。"
  />

  <GuideStepList
    :steps="[
      { title: '入口', desc: '知识库为智库研究员维护的知识沉淀区，支持按类别筛选与搜索。', link: { text: '打开知识库', href: '/knowledge/' } },
      { title: '更新节奏', desc: '内容随课程进度持续更新。' },
      { title: '维护方式', desc: '内容的新增和整理由智库班委负责，会持续更新。' }
    ]"
  />

  <GuideInfoTable
    caption="知识库内容类别"
    :columns="[{ key: 'label', title: '内容类别' }]"
    :rows="[
      { label: '课程笔记' },
      { label: '重点总结' },
      { label: '考题参考' },
      { label: '学习资源' },
      { label: '校历类别（另有）' }
    ]"
  />

  <GuideSectionHead
    id="quiz"
    title="入学测试知识库"
    lead="入学测试相关知识整理与备考测验。"
  />

  <GuideStepList
    :steps="[
      { title: '入口与用途', desc: '入学测试知识库收录入学测试相关知识整理与备考测验，供复习使用。', link: { text: '打开入学测试知识库', href: '/quiz/' } }
    ]"
  />

  <GuideFaq
    id="faq"
    :items="[
      { q: '某节课的课件没找到怎么办？', aHtml: '课程资料按讲次归档，<strong>先看最新讲次</strong>；若确实缺失，联系智库研究员补充。' },
      { q: '作业待办在哪里看？', aHtml: '在首页「作业待办」卡片查看，数据与课件<strong>实时同源</strong>。' }
    ]"
  />

  <GuideCallout variant="info" title="当前版本范围">
    当前版本提供课表、课件 / 课程资料、知识库与入学测试知识库；其余学习相关功能待后续版本规划，开放后将在此更新。
  </GuideCallout>

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '👥', title: '同学与治理', desc: '工具箱入口与入学测验的账号前置口径。', link: '/guide/people' },
        { icon: '🎉', title: '班级互动', desc: '与课程相关的活动报名与通知入口。', link: '/guide/community' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
