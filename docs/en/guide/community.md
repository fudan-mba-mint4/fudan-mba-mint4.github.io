---
layout: page
---

<PageHeader
  title="Community Guide"
  description="Daily class interaction covering announcements, activity sign-up, polls, wish wall, tree hole and gallery."
  slogan="Play together, grow together"
  icon="🎉"
/>

<GuideDocShell
  topic="community"
  :headings="[
    { id: 'announce', text: 'Announcements', level: 2 },
    { id: 'activities', text: 'Activity sign-up', level: 2 },
    { id: 'polls', text: 'Class polls', level: 2 },
    { id: 'wishes', text: 'Wish wall', level: 2 },
    { id: 'treehole', text: 'Tree hole (anonymous tree hole)', level: 2 },
    { id: 'gallery', text: 'Activity gallery', level: 2 },
    { id: 'faq', text: 'Frequently asked questions', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: 'Guide Center', link: '/en/guide/' }, { label: 'Community' }]" />
  </template>

  <GuideCallout variant="prerequisite" title="Sign-in rules">
    <ul>
      <li>Publishing activities, activity sign-up, wish wall posts, tree hole posts / comments / step-on, and polls all require registration and sign-in; public browsing does not.</li>
      <li>The head teacher He Jing and the mentors cannot sign up, vote or post comments.</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="announce"
    title="Announcements"
    lead="The unified entry for publishing and viewing class notices."
  />

  <GuideStepList
    :steps="[
      { title: 'Where to read', desc: 'The “Latest announcements” card on the homepage, or the announcements page.', link: { text: 'Open announcements', href: '/en/announcements/' } },
      { title: 'Three categories', desc: 'Divided into Important, Notice and Teaching; important announcements can be pinned to the top.' },
      { title: 'Publishing permission', desc: 'All committee members can publish, edit and delete; ordinary classmates can view but cannot publish.' },
      { title: 'Unread red dot', desc: 'The homepage announcements entry carries an unread red dot, cleared once you enter the announcements page.' }
    ]"
  />

  <GuideSectionHead
    id="activities"
    title="Activity sign-up"
    lead="The full rules for the activity calendar, sign-up and cancellation."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry and three views', desc: 'The activity calendar offers three views: month calendar (default), timeline and wish wall; the wish wall is a separate page reached from the entry at the top of the activities page.', link: { text: 'Open the activity calendar', href: '/en/activities/' } },
      { title: 'Information on each activity', desc: 'Includes date, end date (multi-day activities), time, location, organizer, capacity, registered count and tags.' },
      { title: 'Sign up after signing in', desc: 'Sign-up requires sign-in and shows your real name; duplicate sign-up prompts “You have already signed up for this activity”; you can cancel yourself; the activity card shows remaining spots.' },
      { title: 'The head teacher / mentors cannot sign up', desc: 'The head teacher He Jing and the mentors cannot sign up; the button shows “View only”.' },
      { title: 'Calendar browsing', desc: 'Click a date on the month calendar to view that day’s activity details.' },
      { title: 'Maintenance ownership', desc: 'Activity content, organizer, capacity and tags are maintained by the experience operations committee members.' }
    ]"
  />

  <GuideSectionHead
    id="polls"
    title="Class polls"
    lead="Participate after signing in; identity is recognized by the system from your sign-in information."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry', desc: 'Open the polls page to take part in class polls.', link: { text: 'Open polls', href: '/en/polls/' } },
      { title: 'Sign-in required to vote', desc: 'You must be signed in to vote (to prevent ballot stuffing through link spread); logged-out users do not see the submit area.' },
      { title: 'Supported option settings', desc: 'Real name / anonymous, single / multiple choice, text / image options, and a deadline.' },
      { title: 'Four tiers of result visibility', desc: 'Visible only to the initiator / published after the deadline / visible after voting / visible in real time.' },
      { title: 'One vote per person', desc: 'Repeated votes are blocked by the system; voting identity is recognized from your sign-in information and cannot be forged as someone else.' },
      { title: 'Past polls can be reviewed', desc: 'Historical polls are retained and can be reviewed anytime; the head teacher and mentors cannot vote.' },
      { title: 'In-page popup confirmation', desc: 'Voting is confirmed in an in-page popup, not a browser system dialog.' }
    ]"
  />

  <GuideCallout variant="permission" title="Permission note">
    The head teacher He Jing and the mentors cannot take part in voting; the participation button is hidden and a “View only” notice is shown.
  </GuideCallout>

  <GuideSectionHead
    id="wishes"
    title="Wish wall"
    lead="A feed-style place to post activity requests and interact."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry', desc: 'The wish wall is a feed-style activity request area.', link: { text: 'Open the wish wall', href: '/en/wishes/' } },
      { title: 'Content and limits', desc: 'You may post text and up to 3 images; video is not supported; text up to 1000 characters.' },
      { title: 'Sign-in rules', desc: 'Posting requires sign-in; browsing can be anonymous.' },
      { title: 'Comment rules', desc: 'Comments up to 300 characters; each card shows up to 3 comments, and beyond that click “View all N comments” to open the popup with the full thread and post comments there.' },
      { title: 'Like rules', desc: 'Each person can like the same wish only once (toggle; click again to unlike); likers are listed in time order, separated by commas.' },
      { title: 'Delete permission', desc: 'A wish or comment can be deleted only by its author or a committee member; deleting a wish cascades to remove its likes and comments.' }
    ]"
  />

  <GuideSectionHead
    id="treehole"
    title="Tree hole (anonymous tree hole)"
    lead="You can currently browse posts, comments and step-on; the write-post entry is not open yet."
  />

  <GuideEmptyState
    variant="disabled"
    title="The write-post entry is not open yet"
    desc="Currently you can browse posts, comments and step-on; the “Write post” button is greyed out and cannot be clicked. Opening it requires a class decision, and it will not open before that."
  />

  <GuideCallout variant="info" title="Rules that take effect once the entry opens">
    <ul>
      <li>Posting requires sign-in; logged-out users can only browse.</li>
      <li>You may choose real name or anonymous; anonymous is the default (shown as “Anonymous classmate”), and choosing real name shows your real name. Once anonymous, identity cannot be reverse-looked-up, and the choice cannot be changed after posting.</li>
      <li>Post body up to 500 characters.</li>
      <li>Comments: after signing in you may choose real name or anonymous, up to 200 characters; the card shows the latest 3, and clicking “View all” shows the full comments; a comment can be deleted only by its author or a committee member.</li>
      <li>Step-on: each person may step on 1 time per day; the count accumulates, and the side panel shows classmates who recently stepped on.</li>
      <li>Committee members can delete illegal, rule-breaking, abusive or otherwise inappropriate posts.</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="gallery"
    title="Activity gallery"
    lead="The public browsing area for class activity photos."
  />

  <GuideStepList
    :steps="[
      { title: 'Entry', desc: 'Classmates can browse class activity photos anytime.', link: { text: 'Open the activity gallery', href: '/en/gallery/' } },
      { title: 'Management ownership', desc: 'Photo uploads and management are handled by the memory steward committee members; other classmates can browse.' },
      { title: 'Current scope', desc: 'The gallery currently supports images only; it does not carry illustrated columns or video.' }
    ]"
  />

  <GuideFaq
    id="faq"
    :items="[
      { q: 'What if I signed up for the same activity twice?', aHtml: 'Duplicate sign-up is blocked by the system with a prompt that you have already signed up; <strong>cancel your current sign-up on the activity card first</strong>, after which you can sign up again.' },
      { q: 'Why can’t I post to the tree hole?', aHtml: 'The write-post entry is <strong>not open yet</strong>; for now you can only browse posts, comments and step-on; opening it requires a class decision, and it will not open before that.' },
      { q: 'Can I post a video to the wish wall?', aHtml: 'Video is not supported; the wish wall supports only <strong>text plus up to 3 images</strong>, text ≤1000 characters.' }
    ]"
  />

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '📚', title: 'Study', desc: 'The coordinated entry for course- and session-related activities.', link: '/en/guide/study' },
        { icon: '💰', title: 'Finance', desc: 'Activity expenses must be approved through disclosure before advance reimbursement.', link: '/en/guide/finance' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
