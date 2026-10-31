---
layout: page
---

<PageHeader
  title="Classmates & Governance Guide"
  description="Directory, career development, footprint, toolbox, committee system and account rules."
  slogan="Know each other, build the class together"
  icon="👥"
/>

<GuideDocShell
  topic="people"
  :headings="[
    { id: 'account', text: 'Registration and account', level: 2 },
    { id: 'directory', text: 'Class directory', level: 2 },
    { id: 'career', text: 'Career development', level: 2 },
    { id: 'footprint', text: 'City footprint', level: 2 },
    { id: 'tools', text: 'Toolbox', level: 2 },
    { id: 'governance', text: 'Committee and governance', level: 2 },
    { id: 'faq', text: 'Frequently asked questions', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: 'Guide Center', link: '/en/guide/' }, { label: 'Classmates & Governance' }]" />
  </template>

  <GuideSectionHead
    id="account"
    title="Registration and account"
    lead="Learn the account rules before browsing the other modules."
  />

  <GuideInfoTable
    caption="Registration rules"
    :columns="[{ key: 'field', title: 'Field' }, { key: 'rule', title: 'Rule' }]"
    :rows="[
      { field: { text: 'Username', strong: true }, rule: 'Letters, digits and underscore only, at least 2 characters, unique across the site.' },
      { field: { text: 'Password', strong: true }, rule: 'At least 6 characters; both entries must match; you can change it yourself after signing in.' },
      { field: { text: 'Real name', strong: true }, rule: 'You must be an enrolled member of this class; real names are unique across the site. Committee roles are matched automatically by real name; ordinary classmates have no committee role.' },
      { field: { text: 'Group', strong: true }, rule: 'Groups are assigned automatically by the system according to real name (Orientation groups 1–6); no selection is needed at registration and groups cannot be changed manually afterward; the head teacher He Jing and the mentor leader have no group.' },
      { field: { text: 'Account elements', strong: true }, rule: 'No email or student ID is required; you are signed in immediately after registration, and the sign-in state is kept on this device for 7 days.' },
      { field: { text: 'Registration / sign-in', strong: true }, rule: 'Registration and sign-in are completed on the same page; the operation is simple.' }
    ]"
  />

  <GuideCallout variant="warning" title="Forgot your password">
    <ul>
      <li>There is no email recovery; if you forget your password, contact the administrator Lei Zhenyu to reset it; after signing in you can change it yourself.</li>
      <li>This guide will not publish any account or password.</li>
    </ul>
  </GuideCallout>

  <GuideCallout variant="permission" title="Head teacher / mentors are view-only">
    He Jing and the mentors can only browse; they cannot take part in voting, claims, reimbursements, sign-up and so on; participation buttons are hidden and a “View only” notice is shown.
  </GuideCallout>

  <GuideSectionHead
    id="directory"
    title="Class directory"
    lead="A grouped browsing area for the public information of currently enrolled classmates."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry and browsing', desc: 'Shows public information of currently enrolled classmates (name, gender, group, role, and so on), browsed by Orientation groups 1–6, with search supported.', link: { text: 'Open the class directory', href: '/en/directory/' } },
      { title: 'Status filtering', desc: 'Classmates who have withdrawn or suspended their studies are hidden automatically; their information is retained and can be shown again if they return or resume.' },
      { title: 'Directory sections', desc: 'Head teacher, mentor leader, 6 groups of mentors, enrolled students; mentor names are shown publicly with thanks.' },
      { title: 'Sensitive information is not public', desc: 'Industry, hobbies, contact details and other sensitive information are not public in the directory; they enter the private resource library.' },
      { title: 'Name authority', desc: 'Names follow the user / committee roster as the source of truth.' }
    ]"
  />

  <GuideSectionHead
    id="career"
    title="Career development"
    lead="Currently the public-version area for anonymized industry statistics and resource matching."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry and public content', desc: 'Currently the public version: anonymized industry-distribution statistics, industry list, resource matching and referrals, learning / career resources; no personal sensitive background is shown.', link: { text: 'Open career development', href: '/en/career/' } },
      { title: 'Sensitive information kept separate', desc: 'Classmates’ industry, hobbies, contact details, MBTI and other sensitive information do not enter the directory or the public career page; they are stored in the private resource library.' },
      { title: 'How internal resources are provided', desc: 'Internal career resources are provided in a targeted way by committee members.' }
    ]"
  />

  <GuideCallout variant="permission" title="Password rules">
    This guide will not publish any password; please ask committee members directly for access to private resources.
  </GuideCallout>

  <GuideSectionHead
    id="footprint"
    title="City footprint"
    lead="Map light-up and list display of city distribution when visiting the site."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry and display', desc: 'Records the city distribution when visiting the site, lighting up glowing points on a world map centered on China, with the Chinese city list on the left.', link: { text: 'Open city footprint', href: '/en/city-footprint/' } },
      { title: 'City recognition', desc: 'The system recognizes the visiting city automatically, filters out non-real visits such as server rooms and cloud hosts, and displays city names uniformly in Chinese.' }
    ]"
  />

  <GuideCallout variant="info" title="Known tips">
    <ul>
      <li>If a VPN was used when visiting, it may affect city recognition and display; this is normal.</li>
      <li>Classmates visiting normally from abroad are also lit up and will not be missed.</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="tools"
    title="Toolbox"
    lead="An aggregation page for tool entries, currently presented as planned placeholder cards."
  />

  <GuideEmptyState
    variant="planned"
    title="Toolbox: planned"
    desc="The toolbox is an aggregation page for tool entries; it currently shows placeholder category cards for PDF, image, text, design, calculation and so on. All 18 tools are not online yet; cards appear in a “Planned” state and do not mean they are available. The entry-test knowledge base is covered in the Study guide; this page only repeats the entry reference."
  />

  <GuideSectionHead
    id="governance"
    title="Committee and governance"
    lead="The current committee division of labor, permission boundaries and governance page entries."
  />

  <div class="guide-grid">
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="Class lead"
        members="Peng Haoning"
        title="All modules"
        desc="Can use and manage all modules."
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="Deputy class lead"
        members="Xiang Wanling, Lei Zhenyu"
        title="All modules"
        desc="Can use and manage all modules."
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="Experience operations officer"
        members="Cheng Fangfang, Wang Weize, Peng Zeyun, Shi Chun, Pan Yunyi, Wang Yulu"
        title="Activities, polls"
        desc="Manages this module only."
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="Finance & incentive officer"
        members="Gao Xiaomei, Ye Hongying, Li Haopeng, Cheng Xiao"
        title="Class-funds module"
        desc="See the Class Funds & Finance Guide for the detailed roles and approval boundaries."
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="Thinktank researcher"
        members="Meng Weihan, Zou Zhiyu, Liu Ruilin"
        title="Course materials, knowledge base"
        desc="Manages this module only."
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="admin"
        role="Memory steward"
        members="Yang Min, Chen Piaoyi, Xu Zheming, Li Tian, Xu Peiying, Xia Ye"
        title="Gallery, tree hole"
        desc="Manages this module only."
      />
    </div>
    <div class="guide-span-12">
      <GuideRoleCard
        level="viewer"
        role="Independent board"
        members="Zhou Nanqi, Li Hao, Wang Xingran, Wang Sheng"
        title="Read-only oversight of all modules"
        desc="Can view all pages and data; does not take part in daily writing, editing, deleting or uploading."
      />
    </div>
  </div>

  <GuideCallout variant="info" title="General notes">
    <ul>
      <li>All committee members can publish announcements.</li>
      <li>Committee roles are matched automatically by real name; after the roster changes, the change takes effect on the next sign-in or refresh.</li>
    </ul>
  </GuideCallout>

  <GuideStepList
    :steps="[
      { title: 'Committee introduction page', desc: 'Class lead, deputy lead and the list and duties of each functional committee member.', link: { text: 'Open the committee introduction page', href: '/en/governance/' } },
      { title: 'Class culture', desc: 'The class culture introduction page.', link: { text: 'Open class culture', href: '/en/about/culture/' } },
      { title: 'Vision and mission', desc: 'The class vision and mission introduction page.', link: { text: 'Open vision and mission', href: '/en/about/vision/' } },
      { title: 'Functional structure', desc: 'The class functional structure introduction page.', link: { text: 'Open functional structure', href: '/en/about/structure/' } }
    ]"
  />

  <GuideCallout variant="info" title="Policy-type pages not yet developed">
    Static policy-type pages such as the class covenant, term and re-election rules, duty requirements, and recall / exit / replacement / handover are not yet developed; this page only introduces the current committee division of labor and does not invent policy chapters.
  </GuideCallout>

  <GuideFaq
    id="faq"
    :items="[
      { q: 'Can I change my group myself?', aHtml: 'No. Groups are <strong>assigned automatically</strong> by the system according to real names in the class directory; no manual selection is needed, and groups cannot be changed manually.' },
      { q: 'Forgot my password?', aHtml: 'There is no email recovery; please contact the administrator <strong>Lei Zhenyu</strong> to reset it; after signing in you can change it yourself.' },
      { q: 'Why are withdrawn or suspended classmates not in the directory?', aHtml: 'Withdrawn and suspended classmates are <strong>hidden automatically</strong>; their information is retained and can be shown again if they return or resume.' }
    ]"
  />

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '📚', title: 'Study', desc: 'Entry test and course material entries.', link: '/en/guide/study' },
        { icon: '🧭', title: 'Guide Center', desc: 'Review the registration prerequisites and the usage conditions of each module.', link: '/en/guide/' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
