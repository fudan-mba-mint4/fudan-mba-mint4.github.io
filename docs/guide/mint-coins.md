---
layout: page
---

<PageHeader
  title="薄荷币指南"
  description="班级虚拟积分：记录每一份参与和贡献。"
  slogan="点滴积累，静待开花"
  icon="🪙"
/>

<GuideDocShell
  topic="mint-coins"
  :headings="[
    { id: 'what', text: '什么是薄荷币', level: 2 },
    { id: 'places', text: '三个位置：在哪里看、在哪里操作', level: 2 },
    { id: 'claim', text: '赚币：贡献申报 → 审核 → 入账', level: 2 },
    { id: 'auditors', text: '谁来审批', level: 2 },
    { id: 'faq', text: '常见问题', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: '指南中心', link: '/guide/' }, { label: '薄荷币' }]" />
  </template>

  <GuideCallout variant="warning" title="常驻声明：不可兑换现金">
    薄荷币是纯虚拟班级激励积分，与班费现金严格隔离，不可兑换现金；页面常驻「不可兑换现金」标注，两套体系互不充值、互不抵扣。
  </GuideCallout>

  <GuideSectionHead
    id="what"
    title="什么是薄荷币"
    lead="记录班级参与与贡献的成长积分。"
  />

  <div class="guide-grid">
    <div class="guide-span-6">
      <GuideRoleCard
        compact
        icon="🪙"
        level="student"
        role="注册即得初始 1 币"
        desc="注册成功即获得 1 枚初始薄荷币，以现行初始口径为准。"
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        compact
        icon="🌱"
        level="student"
        role="200 币开花 · 500 币结果"
        desc="小组累计 200 币进入开花，500 币进入结果；未达 200 币为生长中，会随进度持续生长。"
      />
    </div>
    <div class="guide-span-12">
      <GuideRoleCard
        compact
        icon="🔒"
        level="student"
        role="与班费现金严格隔离"
        desc="薄荷币是纯虚拟班级激励积分，不可兑换现金；班费是班级公共资金，两者互不充值、互不抵扣。"
      />
    </div>
  </div>

  <GuideInfoTable
    caption="个人四档成长标识（按累计获得的币数判定，不是当前剩余币）"
    :columns="[{ key: 'range', title: '币数区间' }, { key: 'name', title: '成长标识' }]"
    :rows="[
      { range: '1–5', name: '薄荷芽' },
      { range: '6–10', name: '薄荷叶' },
      { range: '11–15', name: '薄荷丛' },
      { range: '16+', name: '薄荷王' }
    ]"
  />

  <GuideSectionHead
    id="places"
    title="在哪里看、在哪里操作"
    lead="公开页和个人钱包各管一块。"
  />

  <div class="guide-grid">
    <div class="guide-span-6">
      <GuideRoleCard
        level="student"
        role="公开页「薄荷币」"
        title="四个板块，全班可见"
        desc="薄荷园（6 个小组的成长树）、排行榜（总榜 / 年度榜 / 月度榜）、公开账本、荣誉墙（领奖台、成就与薄荷王名单）；自动展示，无需手动操作。"
        :link="{ text: '打开薄荷币公开页', href: '/mint-coins/' }"
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="student"
        role="个人主页钱包"
        title="我的余额与申报"
        desc="登录后点击头像进入个人资料，查看我的余额、成长标识、我的申报与收支明细。"
      />
    </div>
  </div>

  <GuideSectionHead
    id="claim"
    title="赚币：贡献申报 → 审核 → 入账"
    lead="班级里的参与和贡献，通过申报进入审核流程。"
  />

  <GuideStepList
    :steps="[
      { title: '发起申报', desc: '在班级里的参与和贡献（活动、分享、帮助同学等）可发起申报：填写做了什么、依据哪条奖励规则、获币名单、说明、证明材料。' },
      { title: '字数与数量限制', desc: '标题不超过 60 字；说明不超过 500 字；证明图最多 3 张；批量获币名单最多 20 人（批量申报需班委账号，单人申报本人即可）。' },
      { title: '提交本身不发币', desc: '提交申报本身不会扣任何人的币，也不会自动发币；只有审核通过才真正发币。' },
      { title: '审批通过自动入账', desc: '审批通过后，系统按获币名单给每位同学自动加币，写入公开账本流水；申报人在个人页与首页弹窗收到「已通过」通知。' },
      { title: '驳回带原因，可修改重报', desc: '驳回时审批人必须填写驳回原因；申报人能看到原因，可在个人页修改后重新申报。' },
      { title: '名单与币数要核对一致', desc: '获币名单必须是真实注册同学；人数与总币数一致（例如 3 人各 +3，总币数应为 9）；同一事项不要重复申报、重复发放。' },
      { title: '班主任 / 传承人不可申报', desc: '班主任贺婧与传承人不可发起薄荷币申报。' }
    ]"
  />

  <GuideSectionHead
    id="auditors"
    title="谁来审批"
    lead="薄荷币申报由专门的审批人负责。"
  />

  <GuideCallout variant="info" title="审批人">
    你的申报提交后，由高晓梅、叶宏颖两位同学负责审批：通过后币会自动到账，驳回时会写明原因，你可以修改后重新申报。
  </GuideCallout>

  <GuideFaq
    id="faq"
    :items="[
      { q: '薄荷币可以兑换现金吗？', aHtml: '不能。薄荷币是<strong>纯虚拟班级激励积分</strong>，与班费现金<strong>严格隔离、不可兑换现金</strong>，两套体系互不充值、互不抵扣。' },
      { q: '谁能审批薄荷币申报？', aHtml: '薄荷币申报由<strong>高晓梅、叶宏颖</strong>两位同学负责审批。' },
      { q: '申报被驳回怎么办？', aHtml: '审批人会写明驳回原因；你能在个人页看到原因，<strong>按原因修改后重新申报</strong>即可。' },
      { q: '开花 / 结果是什么意思？', aHtml: '小组累计 <strong>200 币开花</strong>、<strong>500 币结果</strong>；未达 200 币为生长中，会随进度持续生长。' }
    ]"
  />

  <GuideEmptyState
    variant="planned"
    title="当前版本提供的功能"
    desc="当前版本提供薄荷园、排行榜、公开账本、荣誉墙与个人钱包；其余玩法待后续版本规划，开放后将在此更新。"
  />

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '🎉', title: '班级互动', desc: '活动、分享与帮助同学，都是申报赚币的场景来源。', link: '/guide/community' },
        { icon: '👥', title: '同学与治理', desc: '个人资料与钱包入口、注册登录实名口径。', link: '/guide/people' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
