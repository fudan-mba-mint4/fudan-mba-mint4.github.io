---
layout: page
---

<PageHeader
  title="使用指南"
  description="网站各功能模块的实用操作指南——提预算、报销、报名、投票、树洞……遇到不会的，先来这里看看。"
  slogan="遇到不会，先看指南"
  icon="🧭"
/>

<GuideLanding>
  <div class="guide-span-12">
    <GuideHomeSearch />
  </div>

  <div class="guide-span-12">
    <GuideSectionHead
      title="模块指南"
      lead="五个主题覆盖班费、薄荷币、班级互动、学习资料与同学治理，先按场景找到对应指南。"
    />
  </div>

  <div class="guide-span-12">
    <GuideCards />
  </div>

  <div class="guide-span-12">
    <GuideSectionHead
      title="开始之前"
      lead="先了解账号前提与维护方式，再进入各模块指南。"
    />
  </div>

  <div class="guide-span-6">
    <GuideCallout variant="prerequisite" title="使用前提">
      <ul>
        <li>先注册并登录：投票、发布活动、活动报名、许愿池、树洞留言 / 评论 / 踩一踩、薄荷币申报、预算公示发起与投票、报销等互动功能都需要登录；公开浏览不需要登录。</li>
        <li>分组由系统按真名自动分配（Orientation 第 1~6 组），无需手动选择，注册后不可修改。</li>
        <li>忘记密码没有邮箱找回功能，请联系管理员雷振宇重置；登录后可自行修改密码。</li>
        <li>手机与电脑均可访问，手机浏览器打开 mint4.cn 即可。</li>
      </ul>
    </GuideCallout>
  </div>

  <div class="guide-span-6">
    <GuideCallout variant="info" title="维护说明">
      <ul>
        <li>本指南由雷振宇维护；网站功能或操作细节变更时会及时更新，请以网站实际为准。</li>
        <li>发现指南与网站不一致，或对某个功能不清楚，欢迎反馈给班委。</li>
      </ul>
    </GuideCallout>
  </div>

  <div class="guide-span-3">
    <GuideRoleCard
      compact
      icon="🔐"
      level="student"
      role="登录后才能参与互动"
      desc="公开浏览无需登录；投票、报名、申报、报销等互动需先注册登录。"
    />
  </div>

  <div class="guide-span-3">
    <GuideRoleCard
      compact
      icon="👁️"
      level="viewer"
      role="班主任与传承人仅可查看"
      desc="贺婧与传承人不可参与投票、申报、报名、报销等互动。"
    />
  </div>

  <div class="guide-span-3">
    <GuideRoleCard
      compact
      icon="📭"
      level="student"
      role="空列表显示暂无"
      desc="任何列表没有内容时统一显示暂无，不会出现加载失败或报错。"
    />
  </div>

  <div class="guide-span-3">
    <GuideRoleCard
      compact
      icon="🌗"
      level="student"
      role="深色模式跟随系统"
      desc="界面深浅色随设备系统设置自动切换，无需手动选择。"
    />
  </div>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideLanding>
