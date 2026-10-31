---
layout: page
---

<PageHeader
  title="同学与治理指南"
  description="覆盖名录、职业发展、足迹、工具箱、班委制度与账号规则的说明。"
  slogan="认识彼此，共建班级"
  icon="👥"
/>

<GuideDocShell
  topic="people"
  :headings="[
    { id: 'account', text: '注册与账号', level: 2 },
    { id: 'directory', text: '同学名录', level: 2 },
    { id: 'career', text: '职业发展', level: 2 },
    { id: 'footprint', text: '城市足迹', level: 2 },
    { id: 'tools', text: '工具箱', level: 2 },
    { id: 'governance', text: '班委与治理', level: 2 },
    { id: 'faq', text: '常见问题', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: '指南中心', link: '/guide/' }, { label: '同学与治理' }]" />
  </template>

  <GuideSectionHead
    id="account"
    title="注册与账号"
    lead="先了解账号规则，再浏览其它模块。"
  />

  <GuideInfoTable
    caption="注册规则"
    :columns="[{ key: 'field', title: '项目' }, { key: 'rule', title: '口径' }]"
    :rows="[
      { field: { text: '用户名', strong: true }, rule: '仅字母、数字、下划线，≥2 字符，全站唯一。' },
      { field: { text: '密码', strong: true }, rule: '不少于 6 位，两次输入一致；登录后可以自行修改。' },
      { field: { text: '真实姓名', strong: true }, rule: '必须是本班在册同学，真名全站唯一；班委角色由系统按真名自动匹配，普通同学没有班委角色。' },
      { field: { text: '分组', strong: true }, rule: '分组由系统按真名自动分配（Orientation 第 1~6 组），注册时无需选择、注册后不可自行修改；班主任贺婧与传承人组长不设分组。' },
      { field: { text: '账号要素', strong: true }, rule: '无需邮箱、学号；注册成功即登录，登录状态在本机保留 7 天。' },
      { field: { text: '注册 / 登录', strong: true }, rule: '注册和登录在同一个页面完成，操作简单。' }
    ]"
  />

  <GuideCallout variant="warning" title="忘记密码">
    <ul>
      <li>没有邮箱找回功能；忘记密码联系管理员雷振宇重置；登录后可自行改密。</li>
      <li>本指南不会公布任何账号或密码。</li>
    </ul>
  </GuideCallout>

  <GuideCallout variant="permission" title="班主任 / 传承人仅可查看">
    贺婧与传承人只能浏览，不能参与投票、申报、报销、报名等；参与按钮会隐藏并提示「仅可查看」。
  </GuideCallout>

  <GuideSectionHead
    id="directory"
    title="同学名录"
    lead="全班在读同学公开信息的分组浏览区。"
  />

  <GuideStepList
    :steps="[
      { title: '入口与浏览', desc: '展示全班在读同学公开信息（姓名、性别、分组、角色等），按 Orientation 第 1~6 组浏览，支持搜索。', link: { text: '打开同学名录', href: '/directory/' } },
      { title: '状态过滤', desc: '退学和休学的同学会自动隐藏；他们的信息会保留，将来复学或恢复时可以重新显示。' },
      { title: '名录分区', desc: '班主任、传承人组长、6 组传承人、在读学生；传承人姓名公开并致谢。' },
      { title: '敏感信息不公开', desc: '行业、爱好、联系方式等敏感信息不在名录公开，进入私有资源库。' },
      { title: '人名口径', desc: '人名以用户 / 班委口径为准。' }
    ]"
  />

  <GuideSectionHead
    id="career"
    title="职业发展"
    lead="当前为公开版的行业统计与资源对接区。"
  />

  <GuideStepList
    :steps="[
      { title: '入口与公开内容', desc: '当前为公开版：行业分布匿名化统计、行业列表、资源对接引荐、学习 / 职业资源；不展示个人敏感背景。', link: { text: '打开职业发展', href: '/career/' } },
      { title: '敏感信息隔离', desc: '同学行业、爱好、联系方式、MBTI 等敏感信息不进入名录与公开职业页，存私有资源库。' },
      { title: '内部资源提供方式', desc: '内部职业资源由班委定向提供。' }
    ]"
  />

  <GuideCallout variant="permission" title="密码口径">
    本指南不会公布任何密码；私有资源的访问方式请直接咨询班委。
  </GuideCallout>

  <GuideSectionHead
    id="footprint"
    title="城市足迹"
    lead="访问网站时城市分布的地图点亮与列表展示。"
  />

  <GuideStepList
    :steps="[
      { title: '入口与展示', desc: '记录访问网站时的城市分布，在以中国为中心的世界地图上点亮发光点，左侧为中文城市列表。', link: { text: '打开城市足迹', href: '/city-footprint/' } },
      { title: '城市识别', desc: '系统会自动识别访问城市，过滤机房、云主机等非真实访问，并统一显示中文城市名。' }
    ]"
  />

  <GuideCallout variant="info" title="已知小提示">
    <ul>
      <li>如果访问时使用了 VPN，可能影响城市的识别与显示，这是正常现象。</li>
      <li>在国外正常访问的同学也会被点亮，不会被遗漏。</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="tools"
    title="工具箱"
    lead="工具入口聚合页，当前以规划中占位卡片呈现。"
  />

  <GuideEmptyState
    variant="planned"
    title="工具箱：规划中"
    desc="工具箱为工具入口聚合页，当前展示 PDF、图片、文本、设计、计算等分类占位卡片；18 个工具全部未上线，卡片以「规划中」状态呈现，不代表已可用。入学测试知识库在学习资料指南中详述，本页仅重复入口引用。"
  />

  <GuideSectionHead
    id="governance"
    title="班委与治理"
    lead="现有班委分工、权限边界与治理页面入口。"
  />

  <div class="guide-grid">
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="主理人"
        members="彭皓宁"
        title="全部模块"
        desc="全部模块都可以使用和管理。"
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="副主理人"
        members="相婉玲、雷振宇"
        title="全部模块"
        desc="全部模块都可以使用和管理。"
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="体验运营官"
        members="程芳芳、王炜泽、彭泽云、施纯、潘芸怡、王雨露"
        title="活动、投票"
        desc="只管本模块。"
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="财务激励官"
        members="高晓梅、叶宏颖、李浩鹏、程枭"
        title="班费模块"
        desc="细分角色与审批边界见班费财务指南。"
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="智库研究员"
        members="孟维翰、邹智宇、刘瑞霖"
        title="课程资料、知识库"
        desc="只管本模块。"
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="记忆主理人"
        members="杨旻、陈飘逸、徐哲明、李甜、徐珮莹、夏叶"
        title="相册、树洞"
        desc="只管本模块。"
      />
    </div>
    <div class="guide-span-12">
      <GuideRoleCard
        level="viewer"
        role="独立董事会"
        members="周楠骐、李浩、王星然、王胜"
        title="全部模块只读监督"
        desc="可以查看全部页面与数据，不参与日常的写、改、删、上传。"
      />
    </div>
  </div>

  <GuideCallout variant="info" title="通用说明">
    <ul>
      <li>全体班委都可以发布公告。</li>
      <li>班委角色按真名自动匹配；名单调整后，下次登录或刷新即生效。</li>
    </ul>
  </GuideCallout>

  <GuideStepList
    :steps="[
      { title: '班委介绍页', desc: '主理人、副主理人、各职能班委名单与职责。', link: { text: '打开班委介绍页', href: '/governance/' } },
      { title: '班级文化', desc: '班级文化介绍页面。', link: { text: '打开班级文化', href: '/about/culture/' } },
      { title: '愿景使命', desc: '班级愿景与使命介绍页面。', link: { text: '打开愿景使命', href: '/about/vision/' } },
      { title: '职能架构', desc: '班级职能架构介绍页面。', link: { text: '打开职能架构', href: '/about/structure/' } }
    ]"
  />

  <GuideCallout variant="info" title="尚未开发的制度类页面">
    班级公约、任期改选、履职要求、罢免 / 退出 / 补位 / 交接等制度类静态页尚未开发；本页只介绍现有班委分工，不虚构制度章节。
  </GuideCallout>

  <GuideFaq
    id="faq"
    :items="[
      { q: '分组能自己改吗？', aHtml: '不能。分组由系统按同学名录的真名<strong>自动分配</strong>，无需手动选择，也不能自行修改。' },
      { q: '忘记密码怎么办？', aHtml: '没有邮箱找回功能，请联系管理员<strong>雷振宇</strong>重置；登录后可自行修改密码。' },
      { q: '休学 / 退学同学为什么不在名录里？', aHtml: '退学和休学的同学会<strong>自动隐藏</strong>；他们的信息会保留，将来复学或恢复时可以重新显示。' }
    ]"
  />

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '📚', title: '学习资料', desc: '入学测验与课程资料入口。', link: '/guide/study' },
        { icon: '🧭', title: '指南中心', desc: '回顾注册前提与各模块使用条件。', link: '/guide/' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
