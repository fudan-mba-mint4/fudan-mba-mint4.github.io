---
layout: page
---

<PageHeader
  title="Study Materials Guide"
  description="Study materials covering the schedule, slides, knowledge base and entry-test knowledge base."
  slogan="Materials in hand, study with ease"
  icon="📚"
/>

<GuideDocShell
  topic="study"
  :headings="[
    { id: 'schedule', text: 'Schedule', level: 2 },
    { id: 'slides', text: 'Slides / course materials', level: 2 },
    { id: 'knowledge', text: 'Knowledge base', level: 2 },
    { id: 'quiz', text: 'Entry-test knowledge base', level: 2 },
    { id: 'faq', text: 'Frequently asked questions', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: 'Guide Center', link: '/en/guide/' }, { label: 'Study' }]" />
  </template>

  <GuideSectionHead
    id="schedule"
    title="Schedule"
    lead="Upcoming classes, countdown and auxiliary course views."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry', desc: 'The schedule page shows upcoming classes and the countdown to the next class.', link: { text: 'Open the schedule', href: '/en/schedule' } },
      { title: 'Course information', desc: 'Each class lists time, classroom and instructor; click to view details.' },
      { title: 'Shared data with the homepage', desc: 'The homepage “Homework to-dos” and “Next class / unread” flags share live data with the schedule and slides.' },
      { title: 'Auxiliary views', desc: 'The semester highway map and the next-session pill are auxiliary views on the schedule page.' },
      { title: 'Add to calendar', desc: 'The schedule page lets you scan a QR code or add the schedule to your phone calendar with one tap (iPhone / Android / HarmonyOS); Alipay Campus supports link import.' },
      { title: 'How updates are made', desc: 'When classes are rescheduled or a substitute instructor is needed, committee members update the schedule information promptly.' }
    ]"
  />

  <GuideSectionHead
    id="slides"
    title="Slides / course materials"
    lead="Browse course slide PDFs, homework and reference materials by course and session."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry', desc: 'Browse course slide PDFs, homework and reference materials by course and session.', link: { text: 'Open course materials', href: '/en/slides/' } },
      { title: 'Latest session on top', desc: 'The latest session always appears on top, arranged by session number, so you will not open the wrong page.' },
      { title: 'Online preview', desc: 'Click a file to view it online; you may also download and save it; download is not forced.' },
      { title: 'Unread red dot', desc: 'The homepage slides entry carries an unread red dot, cleared once you enter the slides page.' },
      { title: 'Current semester courses', desc: 'Current semester courses include: Data, Models and Decisions (DMD), Managerial Economics, and Accounting.' },
      { title: 'Maintenance ownership', desc: 'Course materials are maintained and updated by the thinktank researchers.' }
    ]"
  />

  <GuideSectionHead
    id="knowledge"
    title="Knowledge base"
    lead="The knowledge repository maintained by thinktank researchers."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry', desc: 'The knowledge base is the knowledge repository maintained by thinktank researchers, supporting filtering by category and search.', link: { text: 'Open the knowledge base', href: '/en/knowledge/' } },
      { title: 'Update pace', desc: 'Content is updated continuously as the course progresses.' },
      { title: 'Maintenance method', desc: 'Adding and organizing content is handled by the thinktank committee members and will continue to be updated.' }
    ]"
  />

  <GuideInfoTable
    caption="Knowledge base content categories"
    :columns="[{ key: 'label', title: 'Content category' }]"
    :rows="[
      { label: 'Course notes' },
      { label: 'Key-point summaries' },
      { label: 'Exam references' },
      { label: 'Learning resources' },
      { label: 'School-calendar category (separate)' }
    ]"
  />

  <GuideSectionHead
    id="quiz"
    title="Entry-test knowledge base"
    lead="Compiled knowledge and preparation quizzes for the entry test."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry and purpose', desc: 'The entry-test knowledge base collects compiled knowledge and preparation quizzes for the entry test, for review.', link: { text: 'Open the entry-test knowledge base', href: '/en/quiz/' } }
    ]"
  />

  <GuideFaq
    id="faq"
    :items="[
      { q: 'Can’t find a session’s slides?', aHtml: 'Course materials are filed by session — <strong>check the latest session first</strong>; if it is truly missing, contact the thinktank researchers to add it.' },
      { q: 'Where do I see homework to-dos?', aHtml: 'Check the “Homework to-dos” card on the homepage; the data shares a <strong>live source</strong> with the slides.' }
    ]"
  />

  <GuideCallout variant="info" title="Current version scope">
    The current version provides the schedule, slides / course materials, knowledge base and entry-test knowledge base; other study-related features are planned for later versions and will be updated here once opened.
  </GuideCallout>

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '👥', title: 'Classmates & Governance', desc: 'Toolbox entry and the account prerequisites for the entry test.', link: '/en/guide/people' },
        { icon: '🎉', title: 'Community', desc: 'Entry for course-related activity sign-up and notices.', link: '/en/guide/community' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
