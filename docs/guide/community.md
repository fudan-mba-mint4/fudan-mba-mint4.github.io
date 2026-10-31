---
layout: page
---

<PageHeader
  title="班级互动指南"
  description="覆盖公告、活动报名、投票、许愿池、树洞、相册的班级日常互动说明。"
  slogan="一起玩，一起成长"
  icon="🎉"
/>

<GuideDocShell
  topic="community"
  :headings="[
    { id: 'announce', text: '公告', level: 2 },
    { id: 'activities', text: '活动报名', level: 2 },
    { id: 'polls', text: '班级投票', level: 2 },
    { id: 'wishes', text: '许愿池', level: 2 },
    { id: 'treehole', text: '树洞（匿名树洞）', level: 2 },
    { id: 'gallery', text: '活动相册', level: 2 },
    { id: 'faq', text: '常见问题', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: '指南中心', link: '/guide/' }, { label: '班级互动' }]" />
  </template>

  <GuideCallout variant="prerequisite" title="登录口径">
    <ul>
      <li>发布活动、活动报名、许愿池发布、树洞留言 / 评论 / 踩一踩、投票均需先注册并登录；公开浏览不需要登录。</li>
      <li>班主任贺婧与传承人不可报名、不可投票、不可留言。</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="announce"
    title="公告"
    lead="班级通知的统一发布与查看入口。"
  />

  <GuideStepList
    :steps="[
      { title: '哪里看', desc: '首页「最新公告」卡片，或公告页。', link: { text: '打开公告页', href: '/announcements/' } },
      { title: '三类分类', desc: '分为重要、通知、教学三类；重要公告可以置顶。' },
      { title: '发布权限', desc: '全体班委都可以发布、编辑、删除；普通同学可以查看，不能发布。' },
      { title: '未读红点', desc: '首页公告入口带未读红点，进入公告页即清零。' }
    ]"
  />

  <GuideSectionHead
    id="activities"
    title="活动报名"
    lead="活动日历、报名与取消的完整口径。"
  />

  <GuideStepList
    :steps="[
      { title: '入口与三视图', desc: '活动日历提供月历（默认）/ 时间线 / 许愿池三视图；许愿池为独立页，活动页顶部入口跳转。', link: { text: '打开活动日历', href: '/activities/' } },
      { title: '每条活动信息', desc: '包含日期、结束日期（跨天活动）、时间、地点、组织者、容量、已报名人数、标签。' },
      { title: '登录后报名', desc: '报名需要登录并显示真名；重复报名会提示「您已报名此活动」；可以主动取消；活动卡片会展示剩余名额。' },
      { title: '班主任 / 传承人不可报名', desc: '班主任贺婧与传承人不可报名，按钮显示「仅可查看」。' },
      { title: '日历查看', desc: '在月历上点击日期即可查看当天的活动详情。' },
      { title: '维护归属', desc: '活动内容、组织者、容量、标签由体验运营组班委维护。' }
    ]"
  />

  <GuideSectionHead
    id="polls"
    title="班级投票"
    lead="登录后参与，身份由系统按登录信息识别。"
  />

  <GuideStepList
    :steps="[
      { title: '入口', desc: '进入投票页参与班级投票。', link: { text: '打开投票页', href: '/polls/' } },
      { title: '必须登录才能投票', desc: '必须登录才能投票（防止链接扩散刷票）；未登录看不到提交区。' },
      { title: '选项支持范围', desc: '实名 / 匿名、单选 / 多选、文字选项 / 图片选项、截止时间。' },
      { title: '结果可见规则四档', desc: '仅发起人可见 / 截止后公布 / 投票后可见 / 实时可见。' },
      { title: '每人一票', desc: '重复投票会被系统拦截；投票身份由系统按登录信息识别，不可伪造他人身份。' },
      { title: '历史投票可回看', desc: '历史投票会保留，可以随时回看；班主任与传承人不可投票。' },
      { title: '页面内弹窗确认', desc: '投票确认走页面内弹窗，不是浏览器系统确认框。' }
    ]"
  />

  <GuideCallout variant="permission" title="权限说明">
    班主任贺婧与传承人不可参与投票，参与按钮会隐藏并提示「仅可查看」。
  </GuideCallout>

  <GuideSectionHead
    id="wishes"
    title="许愿池"
    lead="朋友圈式的活动需求发布与互动。"
  />

  <GuideStepList
    :steps="[
      { title: '入口', desc: '许愿池是朋友圈式活动需求发布区。', link: { text: '打开许愿池', href: '/wishes/' } },
      { title: '内容与上限', desc: '可以发文字和最多 3 张图，不支持视频；文字不超过 1000 字。' },
      { title: '登录口径', desc: '发布必须登录；浏览可匿名。' },
      { title: '评论规则', desc: '评论 ≤300 字；每张卡片最多显示 3 条评论，超出点「查看全部 N 条评论」弹层查看全部并发评论。' },
      { title: '点赞规则', desc: '每人对同一许愿只能点赞一次（切换式，再点取消）；点赞人按时间顺序用顿号「、」排队展示姓名。' },
      { title: '删除权限', desc: '许愿 / 评论限本人或班委删除；删除许愿会级联清理点赞与评论。' }
    ]"
  />

  <GuideSectionHead
    id="treehole"
    title="树洞（匿名树洞）"
    lead="当前可浏览留言、评论、踩一踩；写留言入口暂未开放。"
  />

  <GuideEmptyState
    variant="disabled"
    title="写留言入口暂未开放"
    desc="当前可使用浏览留言、评论、踩一踩；「写留言」按钮置灰不可点。开放需班级讨论拍板，在此之前不会开放。"
  />

  <GuideCallout variant="info" title="入口开放后生效的规则">
    <ul>
      <li>留言需要登录，未登录只能浏览。</li>
      <li>实名 / 匿名可以自己选择，默认匿名（显示「匿名同学」），选择实名会显示真实姓名；匿名后无法反查身份，发出后不能更改。</li>
      <li>留言正文不超过 500 字。</li>
      <li>评论：登录后可选实名 / 匿名，不超过 200 字；卡片显示最近 3 条，点「查看全部」可看完整评论；评论仅限本人或班委删除。</li>
      <li>踩一踩：每人每天可以踩 1 次，次数会累计；侧边展示最近踩过的同学。</li>
      <li>班委可以删除违法、违规、辱骂等不当留言。</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="gallery"
    title="活动相册"
    lead="班级活动照片的公开浏览区。"
  />

  <GuideStepList
    :steps="[
      { title: '入口', desc: '同学可随时浏览班级活动照片。', link: { text: '打开活动相册', href: '/gallery/' } },
      { title: '管理归属', desc: '照片的上传和管理由记忆主理模块的班委负责，其他同学可以浏览。' },
      { title: '当前承载范围', desc: '相册当前仅支持图片，不承载图文专栏与视频。' }
    ]"
  />

  <GuideFaq
    id="faq"
    :items="[
      { q: '重复报名同一个活动怎么办？', aHtml: '重复报名会被系统拦截并提示「您已报名此活动」；先在活动卡片上<strong>主动取消</strong>，之后可再报名。' },
      { q: '树洞为什么不能写留言？', aHtml: '写留言入口<strong>暂未开放</strong>，目前只能浏览留言、评论与踩一踩；开放需班级讨论拍板，在此之前不会开放。' },
      { q: '许愿池可以发视频吗？', aHtml: '不支持视频；许愿池仅支持<strong>文字 + 最多 3 张图</strong>，文字 ≤1000 字。' }
    ]"
  />

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '📚', title: '学习资料', desc: '课程与讲次相关活动的协同入口。', link: '/guide/study' },
        { icon: '💰', title: '班费财务', desc: '活动经费先公示通过，再垫付报销。', link: '/guide/finance' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
