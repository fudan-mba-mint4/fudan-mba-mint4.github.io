---
layout: page
---

<PageHeader
  title="User Guide"
  description="Practical guides for every module of the site — submitting budgets, reimbursements, sign-ups, polls, the tree hole, and more. When you are stuck, start here."
  slogan="When in doubt, check the guide"
  icon="🧭"
/>

<GuideLanding>
  <div class="guide-span-12">
    <GuideHomeSearch />
  </div>

  <div class="guide-span-12">
    <GuideSectionHead
      title="Module guides"
      lead="Five topics cover class funds, Mint Coins, class interaction, study materials, and classmates & governance; find the guide that matches your situation first."
    />
  </div>

  <div class="guide-span-12">
    <GuideCards />
  </div>

  <div class="guide-span-12">
    <GuideSectionHead
      title="Before you start"
      lead="Review the account prerequisites and how these guides are maintained before opening the module guides."
    />
  </div>

  <div class="guide-span-6">
    <GuideCallout variant="prerequisite" title="Prerequisites">
      <ul>
        <li>Register and sign in first: voting, publishing activities, activity sign-up, wish wall posts, tree hole posts / comments / step-on, Mint Coins claims, budget disclosure submission and voting, reimbursements and other interactive features all require sign-in; public browsing does not.</li>
        <li>Groups are assigned automatically by the system according to real name (Orientation groups 1–6); no manual selection is needed, and groups cannot be changed after registration.</li>
        <li>There is no email password recovery; please contact the administrator Lei Zhenyu to reset your password. After signing in you can change it yourself.</li>
        <li>The site works on both mobile and desktop; open mint4.cn in your phone browser.</li>
      </ul>
    </GuideCallout>
  </div>

  <div class="guide-span-6">
    <GuideCallout variant="info" title="Maintenance note">
      <ul>
        <li>This guide is maintained by Lei Zhenyu; it is updated promptly whenever site features or operational details change. The live site prevails.</li>
        <li>If you find a mismatch between the guide and the site, or a feature you cannot figure out, feel free to report it to the committee.</li>
      </ul>
    </GuideCallout>
  </div>

  <div class="guide-span-3">
    <GuideRoleCard
      compact
      icon="🔐"
      level="student"
      role="Sign in to participate"
      desc="Public browsing needs no account; voting, sign-ups, claims, reimbursements and other interactions require registration and sign-in."
    />
  </div>

  <div class="guide-span-3">
    <GuideRoleCard
      compact
      icon="👁️"
      level="viewer"
      role="Head teacher and mentors are view-only"
      desc="He Jing and the mentors cannot take part in voting, claims, sign-ups, reimbursements or other interactions."
    />
  </div>

  <div class="guide-span-3">
    <GuideRoleCard
      compact
      icon="📭"
      level="student"
      role="Empty lists show None yet"
      desc="When any list has no content it uniformly shows None yet; you will not see load failures or error messages."
    />
  </div>

  <div class="guide-span-3">
    <GuideRoleCard
      compact
      icon="🌗"
      level="student"
      role="Dark mode follows the system"
      desc="Light and dark themes switch automatically with your device system settings; no manual choice is needed."
    />
  </div>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideLanding>
