---
layout: page
---

<PageHeader
  title="Class Funds & Finance Guide"
  description="The complete flow for class funds: budget disclosure, voting, approval, reimbursement and posting — who can submit, how to fill in the form, how long results take, and which vouchers are required."
  slogan="Transparent and open, every entry on record"
  icon="💰"
/>

<GuideDocShell
  topic="finance"
  :headings="[
    { id: 'ledger', text: 'How to check the ledger', level: 2 },
    { id: 'budget', text: 'Submit a budget disclosure (key topic)', level: 2 },
    { id: 'submit', text: 'Fill in the disclosure form', level: 3 },
    { id: 'approve', text: 'Accountant review and publication', level: 3 },
    { id: 'vote', text: '3-day voting period', level: 2 },
    { id: 'result', text: 'Auto result when the period ends', level: 2 },
    { id: 'reimb', text: 'Reimbursement (after approval)', level: 2 },
    { id: 'faq', text: 'Frequently asked questions', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: 'Guide Center', link: '/en/guide/' }, { label: 'Finance' }]" />
  </template>

  <GuideCallout variant="prerequisite" title="Prerequisites">
    <ul>
      <li>Submitting a budget disclosure, voting and filing a reimbursement all require registration and sign-in; voting is anonymous and the voter's identity is not shown.</li>
      <li>The head teacher He Jing and the mentors cannot submit budget disclosures or file reimbursements.</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="ledger"
    title="How to check the ledger"
    lead="The class-funds ledger is a read-only public record; anyone can view all income and expense entries."
  />

  <GuideStepList
    :steps="[
      { title: 'Open the class-funds ledger', desc: 'Open the ledger from the navigation or homepage to view all income and expense entries.', link: { text: 'Open the ledger', href: '/en/finance/' } },
      { title: 'View income and expense details', desc: 'Every income and expense entry is recorded here; linked reimbursement requests can be opened for details.' },
      { title: 'View summaries and categories', desc: 'Monthly and semester summaries and category groupings appear below the ledger.' },
      { title: 'View vouchers and linked records', desc: 'Vouchers can be viewed in a popup; linked disclosures, reimbursement requests and activities can be clicked through.' },
      { title: 'Low-balance reminder', desc: 'When the class-funds balance runs low, the page shows a reminder badge so you can pay attention in time.' },
      { title: 'Clear income and expense categories', desc: 'Income and expenses are sorted clearly by category, easy to tell apart at a glance.' }
    ]"
  />

  <GuideSectionHead
    id="budget"
    title="Submit a budget disclosure (key topic)"
    lead="Any registered classmate can submit one; no committee role is required."
  />

  <GuideStepFlow
    :steps="[
      { icon: '✏️', title: 'Submit', desc: 'Submit or save a draft', state: 'done' },
      { icon: '🧑‍💼', title: 'Accountant review', desc: 'Approved by Cheng Xiao alone', state: 'todo' },
      { icon: '📢', title: 'Publish', desc: 'Auto number + 3-day voting period', state: 'todo' },
      { icon: '🗳️', title: 'Auto result', desc: 'System settles after 3 days', state: 'todo' },
      { icon: '🧾', title: 'Link reimbursement', desc: 'Reimburse only after approval', state: 'todo' }
    ]"
  />

  <GuideCallout variant="permission" title="Permission note">
    <ul>
      <li>Any registered classmate can submit a budget disclosure; no committee role is required.</li>
      <li>The head teacher / mentors cannot submit budget disclosures.</li>
      <li>A post-hoc disclosure after an emergency expense can only be initiated by the accountant Cheng Xiao; individuals cannot file one themselves.</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="submit"
    level="3"
    title="Fill in the disclosure form"
    lead="When starting a new disclosure, first understand what the two tabs mean."
  />

  <GuideStepList
    :steps="[
      { title: 'Open the budget disclosure page', desc: 'After signing in, click “Submit a new disclosure” to start filling in.', link: { text: 'Open budget disclosures', href: '/en/finance/budgets' } },
      { title: 'Switch between the two tabs', desc: '“All disclosures” shows disclosures public to the whole class; “My submissions” includes drafts, returned items and all of your historical records.' }
    ]"
  />

  <GuideInfoTable
    caption="Required fields"
    :columns="[{ key: 'field', title: 'Field' }, { key: 'rule', title: 'Rule' }]"
    :rows="[
      { field: 'Activity / item name', rule: 'State briefly what the activity is.' },
      { field: 'Applying group / department', rule: 'Choose from the dropdown: Experience group, Memory group, Academic group, Life group, Finance group, Other project group.' },
      { field: 'Applicant', rule: 'The signed-in real name is filled in automatically and cannot be edited.' },
      { field: 'Nature of the matter', rule: 'Routine matter (recurring, foreseeable); non-routine matter (temporary, added on short notice).' },
      { field: 'Payment recipient', rule: 'Taobao merchant; venue lessor; personal advance reimbursement; other.' },
      { field: 'Activity type', rule: 'Choose from the 10-item list (see the table below).' },
      { field: 'Total budget cap', rule: 'The maximum amount this budget may spend; the running subtotal is compared with the cap in real time, and any excess is marked in red.' },
      { field: 'Budget line items', rule: 'At least 1 row; each row contains an expense item, quantity (greater than 0), unit price (greater than 0), and expense category; notes are optional; rows can be added or removed, and the system always keeps at least 1 row.' },
      { field: '3 finance red lines', rule: { text: 'All three must be checked before submission (see the table below).', strong: true } }
    ]"
  />

  <GuideInfoTable
    caption="The 10 activity types (single choice in the dropdown)"
    :columns="[{ key: 'group', title: 'Category' }, { key: 'type', title: 'Activity type' }]"
    :rows="[
      { group: 'Pure meeting / enablement', type: 'Lecture' },
      { group: 'Pure meeting / enablement', type: 'Sharing session' },
      { group: 'Pure meeting / enablement', type: 'Company visit' },
      { group: 'Social / cohesion', type: 'Dinner party' },
      { group: 'Social / cohesion', type: 'Trip' },
      { group: 'Social / cohesion', type: 'Team building' },
      { group: 'Social / cohesion', type: 'Ju-Jin Week' },
      { group: 'Daily operations', type: 'Standard promotional materials' },
      { group: 'Daily operations', type: 'Class public supplies' },
      { group: 'Daily operations', type: 'Teacher appreciation' }
    ]"
  />

  <GuideCallout variant="warning" title="Please note">
    Although the dropdown contains “dinner party / trip”, the line-item categories “Meals and tea breaks” and “Accommodation” cannot be selected: dinner, travel, accommodation and tea-break costs are split AA among participants and are not covered by class funds; if entered, the system will prompt that class funds cannot be used.
  </GuideCallout>

  <GuideInfoTable
    caption="The three finance red lines you must all check before submission"
    :columns="[{ key: 'code', title: 'Code' }, { key: 'rule', title: 'Red line' }]"
    :rows="[
      { code: { text: 'R1', strong: true }, rule: 'This budget excludes meal and accommodation costs for dinner parties, trips and similar events; such costs are split AA among participants and must never be paid from class funds.' },
      { code: { text: 'R2', strong: true }, rule: 'This budget already includes all related public expenses (promotional materials, planning fees, photography and video, and so on).' },
      { code: { text: 'R3', strong: true }, rule: 'All expenses for the same activity have been merged into this disclosure; splitting proposals to evade public review is strictly prohibited.' }
    ]"
  />

  <GuideCallout variant="tip" title="Tip: optional fields">
    <ul>
      <li>Contact information (optional).</li>
      <li>Notes / line-item explanations (optional).</li>
      <li>Linked activity: choose one if the disclosure links to a specific activity (optional).</li>
      <li>Activity plan attachment: optional; you may add a document or image as supplementary material for the activity plan.</li>
    </ul>
  </GuideCallout>

  <GuideCallout variant="info" title="Draft stage">
    <ul>
      <li>You can “Save draft” first; drafts use loose validation and do not require completed red lines or line items.</li>
      <li>A draft is visible only to the initiator: it appears in “My submissions”, where you can keep filling it in; other classmates cannot see it.</li>
      <li>A draft can be edited further and then sent in; the submit button reads “Submit disclosure” or “Edit and resubmit” depending on the draft status.</li>
    </ul>
  </GuideCallout>

  <GuideSectionHead
    id="approve"
    level="3"
    title="Accountant review and publication"
    lead="The review and publication after submission are handled solely by the accountant Cheng Xiao."
  />

  <GuideStepList
    :steps="[
      { title: 'Wait for review after submission', desc: 'After submission the item enters pending review, awaiting approval by the accountant Cheng Xiao.' },
      { title: 'Review handled by one person', desc: 'Budget disclosure approval belongs exclusively to Cheng Xiao, ensuring a consistent standard.' },
      { title: 'Complete materials: publish', desc: 'Once the materials are complete, Cheng Xiao confirms publication; the system automatically generates the disclosure number and opens the 3-day voting period. After publication the link is posted to the class WeChat group to notify the whole class to vote; only then does the disclosure take effect.' },
      { title: 'Incomplete materials: return', desc: 'When materials are incomplete, Cheng Xiao states the return reason; the initiator receives the reason under “My submissions”, can revise and resubmit, and the item returns to pending review.' }
    ]"
  />

  <GuideSectionHead
    id="vote"
    title="Step 3 · 3-day voting period"
    lead="After publication the item enters a 3-day voting period; signed-in classmates vote directly on the disclosure card."
  />

  <GuideStepList
    :steps="[
      { title: 'Vote directly', desc: 'On the public disclosure card you can vote “For” or “Against”; after signing in you vote anonymously, one vote per person, and your voting identity is not shown.' },
      { title: 'You may add a reason when voting against', desc: 'When voting against you may enter a reason of up to 200 characters; against reasons are shown publicly and anonymously — only the reason and time appear, not the voter’s identity.' },
      { title: 'One vote per person, non-withdrawable', desc: 'Each person can vote only once; repeated votes are invalid; after voting the vote cannot be withdrawn or changed.' },
      { title: 'View details', desc: 'The details popup shows the budget breakdown, subtotal / cap / difference, red-line check status, attachments and the voting area.' },
      { title: 'In-page popup confirmation', desc: 'Voting is confirmed in an in-page popup, not a browser system dialog; statuses sync in real time after voting.' }
    ]"
  />

  <GuideSectionHead
    id="result"
    title="Step 4 · Auto result when the period ends"
    lead="After the disclosure has been open for 3 full days the system settles automatically; no manual action is needed."
  />

  <GuideStepList
    :steps="[
      { title: 'Auto settlement after 3 days', desc: 'After 3 full days the system settles the disclosure automatically; no manual action is needed.' },
      { title: 'Veto line', desc: 'When against votes reach or exceed 23 (one third of the class’s 69 members), the proposal is vetoed; the disclosure closes and class funds cannot be used.' },
      { title: 'Approval', desc: 'Fewer than 23 against votes means approval; the budget cap is locked, and only then can reimbursements link to this disclosure.' },
      { title: 'Handling special cases', desc: 'If special circumstances arise during a disclosure, Cheng Xiao settles or cancels it manually; settlement cannot happen early before the period ends.' }
    ]"
  />

  <GuideInfoTable
    caption="Explanation of disclosure statuses"
    :columns="[{ key: 'status', title: 'Status' }, { key: 'meaning', title: 'Meaning' }]"
    :rows="[
      { status: { text: 'Draft', strong: true }, meaning: 'Visible only to you; keep editing or submit.' },
      { status: { text: 'Pending review', strong: true }, meaning: 'Sent in, awaiting approval by Cheng Xiao.' },
      { status: { text: 'Returned', strong: true }, meaning: 'Returned by Cheng Xiao with a reason; the initiator can revise and resubmit.' },
      { status: { text: 'Open for disclosure', strong: true }, meaning: 'Published and within the 3-day voting period.' },
      { status: { text: 'Approved', strong: true }, meaning: 'Voted through; the budget cap is locked and reimbursements can be linked.' },
      { status: { text: 'Vetoed', strong: true }, meaning: 'Against votes reached 23; the process ends and class funds cannot be used.' },
      { status: { text: 'Executed', strong: true }, meaning: 'The budget has been executed and filed in the archive.' },
      { status: { text: 'Cancelled', strong: true }, meaning: 'Manually cancelled by Cheng Xiao.' }
    ]"
  />

  <GuideSectionHead
    id="reimb"
    title="Reimbursement (after approval)"
    lead="Get a disclosure approved first, then advance money and claim it; expenses without a published and approved disclosure can never be reimbursed from class funds."
  />

  <GuideCallout variant="prerequisite" title="Reimbursement prerequisites">
    <ul>
      <li>After signing in, click “New reimbursement” to start filling in.</li>
      <li>Only approved disclosures can be linked; the dropdown lists approved disclosures only.</li>
      <li>The reimbursement amount cannot exceed that disclosure’s budget cap; the excess is not paid. To add money you must publish a new budget disclosure; splitting or routing around the cap is not allowed.</li>
      <li>The head teacher / mentors cannot submit reimbursements.</li>
    </ul>
  </GuideCallout>

  <GuideInfoTable
    caption="Tiered voucher requirements (if vouchers are incomplete, the system states which one is missing; you must complete the set before submitting)"
    :columns="[{ key: 'amount', title: 'Amount' }, { key: 'receipt', title: 'Required vouchers' }]"
    :rows="[
      { amount: 'Single transaction ≥500 CNY (large)', receipt: 'Invoice + payment proof' },
      { amount: 'Single transaction <500 CNY (small)', receipt: 'Payment proof + receipt / sales slip' },
      { amount: '≥500 CNY without an invoice', receipt: 'Payment proof + stamped receipt + the handler in person + 1 committee member’s signed endorsement' }
    ]"
  />

  <GuideStepFlow
    :steps="[
      { icon: '🧾', title: 'Classmate submits reimbursement', desc: 'Link approved disclosure + tiered vouchers', state: 'done' },
      { icon: '🧑‍💼', title: 'Accountant Cheng Xiao reviews', desc: 'Approve / return for revision / reject', state: 'todo' },
      { icon: '💵', title: 'Cashier Li Haopeng confirms payment', desc: 'Confirm after offline payment', state: 'todo' },
      { icon: '🗂️', title: 'System posts the entry', desc: 'Expense entry generated, ledger linked', state: 'todo' }
    ]"
  />

  <GuideStepList
    :steps="[
      { title: 'Cheng Xiao reviews', desc: 'Vouchers complete and amount correct: approve and move to awaiting payment; vouchers missing: return for revision, and after the claimant revises it the claim can be sent in again; over cap, not linked to a disclosure, or outside class-fund scope: reject with a reason and the process ends.' },
      { title: 'Li Haopeng confirms payment', desc: 'After cashier Li Haopeng pays offline, he confirms payment on the page and the system records this expense automatically.' },
      { title: 'Reimbursement statuses', desc: 'Pending review → returned for revision / approved, awaiting payment / rejected / paid.' }
    ]"
  />

  <GuideCallout variant="info" title="Time-limit reminder">
    Submission, review and payment each have a default time limit; if a deadline is missed, an in-site notification reminds the relevant committee member. Every payment leaves a record in the ledger that you can check at any time. Default limits: 7 working days for reimbursement submission, 3 working days for accountant review, 3 working days for cashier payment.
  </GuideCallout>

  <GuideFaq
    id="faq"
    :items="[
      { q: 'Where did my draft go?', aHtml: 'Drafts are saved only under “My submissions”, <strong>visible to you alone</strong>; you can keep editing or submit it; other classmates and the public lists cannot see it.' },
      { q: 'What does the disclosure number mean?', a: 'Class budget disclosures are numbered automatically in the format MF4-BM-year-month-day-two-digit daily sequence; the number is generated and effective once the accountant publishes the disclosure.' },
      { q: 'Why can’t I submit a reimbursement?', aHtml: 'It can link only to an <strong>approved</strong> disclosure, and the amount must not exceed that disclosure’s budget cap; check these two first, and verify the tiered vouchers are complete.' },
      { q: 'Why was my disclosure returned?', a: 'Read the return reason, complete the materials, then click “Edit and resubmit” under “My submissions”; this does not affect re-review.' },
      { q: 'How long until payment?', a: 'After the reimbursement is approved, cashier Li Haopeng pays offline; in-site time-limit reminders nudge the committee when deadlines are missed.' },
      { q: 'The cap is not enough / I want to add money?', a: 'The amount locks once the disclosure passes; the excess is not paid. To add money you must publish a new budget disclosure; splitting or routing around the cap is not allowed.' },
      { q: 'I spent money first in an emergency?', a: 'A post-hoc disclosure after an emergency expense can only be initiated by the accountant Cheng Xiao; individuals cannot file one themselves.' },
      { q: 'Can dinners, trips or accommodation be paid from class funds?', a: 'No; these are split AA among participants. Line items containing “Meals and tea breaks” or “Accommodation” are blocked directly by the system.' },
      { q: 'Where do I see the disclosures I filed?', a: 'On the budget disclosure page, open the “My submissions” tab to check each status (draft / pending review / returned / open for disclosure / approved / vetoed).' }
    ]"
  />

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '🎉', title: 'Community', desc: 'Activity sign-up: budget disclosures often link to a specific activity.', link: '/en/guide/community' },
        { icon: '👥', title: 'Classmates & Governance', desc: 'Real-name rules for registration and sign-in.', link: '/en/guide/people' },
        { icon: '🪙', title: 'Mint Coins', desc: 'Strictly separated from class funds; not redeemable for cash.', link: '/en/guide/mint-coins' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
