---
layout: page
---

<PageHeader
  title="班费财务指南"
  description="班费从预算公示、投票、审批到报销入账的完整流程：谁能发起、怎么填、多久出结果、票据要哪些。"
  slogan="透明公开，每一笔都有据可查"
  icon="💰"
/>

<GuideDocShell
  topic="finance"
  :headings="[
    { id: 'ledger', text: '怎么查账', level: 2 },
    { id: 'budget', text: '发起预算公示（重点）', level: 2 },
    { id: 'submit', text: '填写公示表单', level: 3 },
    { id: 'approve', text: '会计审批与公开', level: 3 },
    { id: 'vote', text: '3 天投票期', level: 2 },
    { id: 'result', text: '到期自动出结果', level: 2 },
    { id: 'reimb', text: '报销（公示通过之后）', level: 2 },
    { id: 'faq', text: '常见问题', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: '指南中心', link: '/guide/' }, { label: '班费财务' }]" />
  </template>

  <GuideCallout variant="prerequisite" title="使用前提">
    <ul>
      <li>参与预算公示发起、投票、报销提交，都需要先注册并登录；投票对外匿名，不显示投票人身份。</li>
      <li>班主任贺婧与传承人不可发起预算公示，也不可提交报销。</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="ledger"
    title="怎么查账"
    lead="班费账页是只读的公开记录，任何人都能查看全部收支流水。"
  />

  <GuideStepList
    :steps="[
      { title: '进入班费账页', desc: '从导航或首页进入班费账页，查看全部收入与支出流水。', link: { text: '打开班费账页', href: '/finance/' } },
      { title: '查看收支明细', desc: '每笔收入与支出都记在这里；关联的报销单可点开查看详情。' },
      { title: '查看汇总与分类', desc: '月、学期汇总与大类归集展示在账页下方。' },
      { title: '查看凭证与关联记录', desc: '凭证可在弹层中查看；关联的公示、报销单、活动可点击跳转。' },
      { title: '余额偏低提醒', desc: '当班费余额偏低时，页面会显示提醒标识，方便及时关注。' },
      { title: '收支分类清晰', desc: '收入与支出按类别清晰归类，一眼就能区分。' }
    ]"
  />

  <GuideSectionHead
    id="budget"
    title="发起预算公示（重点）"
    lead="任何注册同学都可以发起，不需要是班委。"
  />

  <GuideStepFlow
    :steps="[
      { icon: '✏️', title: '发起', desc: '提交或存草稿', state: 'done' },
      { icon: '🧑‍💼', title: '会计审批', desc: '程枭一人审批', state: 'todo' },
      { icon: '📢', title: '公开', desc: '自动编号 + 3 天投票期', state: 'todo' },
      { icon: '🗳️', title: '自动出结果', desc: '3 天到期系统结算', state: 'todo' },
      { icon: '🧾', title: '关联报销', desc: '通过后才可报销', state: 'todo' }
    ]"
  />

  <GuideCallout variant="permission" title="权限说明">
    <ul>
      <li>任何注册同学都可以发起预算公示，不需要是班委。</li>
      <li>班主任 / 传承人不可发起预算公示。</li>
      <li>紧急支出事后补公示只能由会计程枭发起，个人无法发起。</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="submit"
    level="3"
    title="填写公示表单"
    lead="发起新公示时，先确认页面两个标签页的含义。"
  />

  <GuideStepList
    :steps="[
      { title: '进入预算公示页', desc: '登录后点「发起新公示」即可开始填写。', link: { text: '打开预算公示', href: '/finance/budgets' } },
      { title: '切换两个标签页', desc: '「全部公示」展示公开给全班的公示；「我提交的公示」包含草稿、退回与我的全部历史记录。' }
    ]"
  />

  <GuideInfoTable
    caption="必填内容说明"
    :columns="[{ key: 'field', title: '项目' }, { key: 'rule', title: '说明' }]"
    :rows="[
      { field: '活动 / 事项名称', rule: '简短写清是什么活动。' },
      { field: '申请小组 / 部门', rule: '下拉选择：体验组、记忆组、学术组、生活组、财务组、其他项目组。' },
      { field: '申请人', rule: '自动带出登录真名，不可修改。' },
      { field: '事项性质', rule: '常规事项（例行性、可预见）；非常规事项（临时发生、额外增加）。' },
      { field: '资金支付对象', rule: '淘宝商家；场地租赁方；个人垫付报销；其他。' },
      { field: '活动类型', rule: '从 10 项清单中选择（见下表）。' },
      { field: '预算总上限金额', rule: '这笔预算最多花多少钱；实时显示明细合计与上限对比，超出标红。' },
      { field: '预算明细清单', rule: '至少 1 行；每行含支出项目、数量（大于 0）、单价（大于 0）、费用性质分类；备注选填；可增删，系统始终保留至少 1 行。' },
      { field: '财务红线 3 条', rule: { text: '必须全部勾选，否则不能提交（见下表）。', strong: true } }
    ]"
  />

  <GuideInfoTable
    caption="活动类型 10 项（下拉单选）"
    :columns="[{ key: 'group', title: '大类' }, { key: 'type', title: '活动类型' }]"
    :rows="[
      { group: '纯会务 / 赋能类', type: '讲座' },
      { group: '纯会务 / 赋能类', type: '分享' },
      { group: '纯会务 / 赋能类', type: '企业参访' },
      { group: '联谊 / 凝聚类', type: '聚餐' },
      { group: '联谊 / 凝聚类', type: '旅行' },
      { group: '联谊 / 凝聚类', type: '团建' },
      { group: '联谊 / 凝聚类', type: '聚劲周' },
      { group: '日常运营类', type: '常规宣传物料' },
      { group: '日常运营类', type: '班级公共用品' },
      { group: '日常运营类', type: '教师慰问' }
    ]"
  />

  <GuideCallout variant="warning" title="请注意">
    下拉里虽有「聚餐 / 旅行」字样，但费用明细分类中「餐饮与茶歇」「住宿费」两类无法提交：聚餐、旅行、住宿、茶歇由参加人 AA，班费不承担，填入后系统会提示不能使用班费。
  </GuideCallout>

  <GuideInfoTable
    caption="提交前必须勾选的三条财务红线"
    :columns="[{ key: 'code', title: '编号' }, { key: 'rule', title: '红线内容' }]"
    :rows="[
      { code: { text: 'R1', strong: true }, rule: '本预算不含聚餐、旅行类活动的餐饮费、住宿费（此类费用参加人 AA，严禁使用班费）。' },
      { code: { text: 'R2', strong: true }, rule: '本预算已包含所有相关的公共支出（宣传物料、策划费、摄影摄像等）。' },
      { code: { text: 'R3', strong: true }, rule: '同一活动的多笔支出已全部合并在此公示中（严禁拆分规避公示）。' }
    ]"
  />

  <GuideCallout variant="tip" title="小提示：选填内容">
    <ul>
      <li>联系方式（选填）。</li>
      <li>备注 / 明细说明（选填）。</li>
      <li>关联活动：能关联到具体活动就选（选填）。</li>
      <li>活动方案附件：可选，可添加文档或图片，作为活动方案的补充材料。</li>
    </ul>
  </GuideCallout>

  <GuideCallout variant="info" title="草稿阶段">
    <ul>
      <li>表单可先「保存草稿」，草稿阶段为宽松校验，不要求红线与明细完整。</li>
      <li>草稿仅发起人本人可见：在「我提交的公示」里可见并可继续填写，其他同学都看不到。</li>
      <li>草稿可继续编辑后提交；提交按钮按草稿状态显示「提交公示」或「修改并重新提交」。</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="approve"
    level="3"
    title="会计审批与公开"
    lead="提交后的审核与公开环节由会计程枭一人完成。"
  />

  <GuideStepList
    :steps="[
      { title: '提交后等待审批', desc: '提交后进入待审批状态，等待会计程枭审批。' },
      { title: '审批专人负责', desc: '预算公示的审批由程枭一人负责，确保口径统一。' },
      { title: '资料齐全：公开', desc: '资料齐全后，程枭确认公开，系统自动生成公示编号并开启 3 天投票期；公开后会把链接发到班级微信群，通知全班投票，公示才算真正生效。' },
      { title: '资料不全：退回', desc: '资料不全时，程枭会写明退回原因；发起人在「我提交的公示」收到原因，可修改后重新提交，回到待审批。' }
    ]"
  />

  <GuideSectionHead
    id="vote"
    title="第三步 · 3 天投票期"
    lead="公开后进入 3 天投票期，登录同学在公示卡片上直接投票。"
  />

  <GuideStepList
    :steps="[
      { title: '直接投票', desc: '公开公示卡片上可直接投「赞成 / 反对」；需登录后匿名投票，每人一票，不会显示你的投票身份。' },
      { title: '反对可留理由', desc: '反对可填写不超过 200 字的理由；反对理由匿名公开展示，只显示理由与时间，不显示投票人身份。' },
      { title: '每人一票不可撤回', desc: '每人只能投一次，重复投票无效；投票后不可撤回、不可改投。' },
      { title: '查看详情', desc: '详情弹窗可见预算明细、合计 / 上限 / 差额、红线校验状态、附件与投票区。' },
      { title: '页面内弹窗确认', desc: '投票确认走页面内弹窗，不是浏览器系统确认框；投票后状态实时同步。' }
    ]"
  />

  <GuideSectionHead
    id="result"
    title="第四步 · 到期自动出结果"
    lead="公示满 3 天由系统自动结算，无需任何人手动操作。"
  />

  <GuideStepList
    :steps="[
      { title: '满 3 天自动结算', desc: '公示满 3 天由系统自动结算，无需任何人手动操作。' },
      { title: '否决线', desc: '反对票达到或超过 23 票（全班 69 人的三分之一）即否决，公示结束，班费不可动用。' },
      { title: '通过', desc: '反对少于 23 票即通过，预算上限锁定，之后报销才可关联这份公示。' },
      { title: '特殊情况处理', desc: '公示中如遇特殊情况，由程枭手动结算或取消；未到期满不能提前结算。' }
    ]"
  />

  <GuideInfoTable
    caption="公示的各个状态说明"
    :columns="[{ key: 'status', title: '状态' }, { key: 'meaning', title: '含义' }]"
    :rows="[
      { status: { text: '草稿', strong: true }, meaning: '仅本人可见，可继续编辑或提交。' },
      { status: { text: '待审批', strong: true }, meaning: '已提交，等待程枭审批。' },
      { status: { text: '已退回', strong: true }, meaning: '程枭退回并写明原因，发起人可修改后重新提交。' },
      { status: { text: '公示中', strong: true }, meaning: '已公开，处于 3 天投票期内。' },
      { status: { text: '已通过', strong: true }, meaning: '投票通过，预算上限锁定，可关联报销。' },
      { status: { text: '已否决', strong: true }, meaning: '反对达到 23 票，流程终止，不可动用班费。' },
      { status: { text: '已执行', strong: true }, meaning: '预算已执行，归入档案。' },
      { status: { text: '已取消', strong: true }, meaning: '由程枭手动取消。' }
    ]"
  />

  <GuideSectionHead
    id="reimb"
    title="报销（公示通过之后）"
    lead="先公示通过，再垫付报销；未公示或未通过的支出一律不得走班费报销。"
  />

  <GuideCallout variant="prerequisite" title="报销前提">
    <ul>
      <li>登录后点「新建报销」即可开始填写。</li>
      <li>只能关联已经通过的公示，下拉里只会列出已通过的公示。</li>
      <li>报销金额不能超过该公示的预算上限，超出部分不予支付；要加钱只能重新公示一份新预算，不能拆分、不能绕过。</li>
      <li>班主任 / 传承人不可提交报销。</li>
    </ul>
  </GuideCallout>

  <GuideInfoTable
    caption="分级凭证要求（凭证不全时会提示缺少哪张，补齐后才能提交）"
    :columns="[{ key: 'amount', title: '金额' }, { key: 'receipt', title: '必备凭证' }]"
    :rows="[
      { amount: '单笔 ≥500 元（大额）', receipt: '发票 + 付款凭证' },
      { amount: '单笔 <500 元（小额）', receipt: '付款凭证 + 收据 / 小票' },
      { amount: '≥500 元但无法提供发票', receipt: '付款凭证 + 盖章收据 + 经办人本人 + 1 名班委签字背书' }
    ]"
  />

  <GuideStepFlow
    :steps="[
      { icon: '🧾', title: '同学提交报销', desc: '关联已通过公示 + 分级凭证', state: 'done' },
      { icon: '🧑‍💼', title: '会计程枭审批', desc: '通过 / 退回补正 / 驳回', state: 'todo' },
      { icon: '💵', title: '出纳李浩鹏确认打款', desc: '线下付款后点确认', state: 'todo' },
      { icon: '🗂️', title: '系统入账', desc: '生成支出流水，账页联动', state: 'todo' }
    ]"
  />

  <GuideStepList
    :steps="[
      { title: '程枭审批', desc: '凭证齐全、金额相符：通过并转入待打款；凭证缺失：退回补正，本人修改后可重新提交；超预算、未关联公示或不属班费范围：驳回并写明原因，流程终止。' },
      { title: '李浩鹏确认打款', desc: '出纳李浩鹏线下打款后，在页面上确认打款，系统自动记录这笔支出。' },
      { title: '报销的各个状态', desc: '待审核 → 退回补正 / 已通过待付款 / 已驳回 / 已打款。' }
    ]"
  />

  <GuideCallout variant="info" title="时限提醒">
    提交、审批、打款各环节都有默认时限，超时会通过站内通知提醒对应班委；每笔打款都在账页留下记录，随时可查。默认时限：报销提交 7 个工作日、会计审核 3 个工作日、出纳打款 3 个工作日。
  </GuideCallout>

  <GuideFaq
    id="faq"
    :items="[
      { q: '我的草稿去哪了？', aHtml: '草稿只保存在「我提交的公示」，<strong>仅你本人可见</strong>，可继续编辑或提交；其他同学和公开列表都看不到。' },
      { q: '公示的编号是什么意思？', a: '班级预算公示自动编号，格式为 MF4-BM-年月日-当天两位序号，会计公开后即生成生效。' },
      { q: '为什么报销提交不了？', aHtml: '只能关联<strong>已通过</strong>的公示，且金额不能超过该公示预算上限；先检查这两项；凭证分级是否齐全。' },
      { q: '为什么我的公示被退回？', a: '看退回原因，补齐资料后在「我提交的公示」点「修改并重新提交」，不影响重新审批。' },
      { q: '打款要等多久？', a: '报销审批通过后由出纳李浩鹏线下打款，站内有时限提醒，超时会提醒班委。' },
      { q: '额度不够 / 想加钱？', a: '公示通过后金额即锁定，超出部分不予支付；要加钱只能重新公示一份新预算，不能拆分、不能绕过。' },
      { q: '事出紧急先花了钱？', a: '紧急事后补公示只能由会计程枭发起，个人无法发起。' },
      { q: '聚餐 / 旅行 / 住宿能走班费吗？', a: '不能，由参加人 AA；明细里出现「餐饮与茶歇」「住宿费」会被系统直接拦截。' },
      { q: '在哪里看我发过的公示？', a: '预算公示页 →「我提交的公示」标签页，查看每条状态（草稿 / 待审批 / 已退回 / 公示中 / 已通过 / 已否决）。' }
    ]"
  />

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '🎉', title: '班级互动', desc: '活动报名：预算公示常关联具体活动。', link: '/guide/community' },
        { icon: '👥', title: '同学与治理', desc: '注册与登录的实名口径。', link: '/guide/people' },
        { icon: '🪙', title: '薄荷币', desc: '与班费严格隔离，不可兑换现金。', link: '/guide/mint-coins' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
