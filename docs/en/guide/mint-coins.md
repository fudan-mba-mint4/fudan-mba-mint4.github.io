---
layout: page
---

<PageHeader
  title="Mint Coins Guide"
  description="Class virtual points that record every participation and contribution."
  slogan="Small steps accumulate, wait for the bloom"
  icon="🪙"
/>

<GuideDocShell
  topic="mint-coins"
  :headings="[
    { id: 'what', text: 'What are Mint Coins', level: 2 },
    { id: 'places', text: 'Three sections: where to view and where to operate', level: 2 },
    { id: 'claim', text: 'Earn coins: contribution claim → review → credit', level: 2 },
    { id: 'auditors', text: 'Who approves', level: 2 },
    { id: 'faq', text: 'Frequently asked questions', level: 2 }
  ]"
>
  <template #breadcrumb>
    <GuideBreadcrumb :items="[{ label: 'Guide Center', link: '/en/guide/' }, { label: 'Mint Coins' }]" />
  </template>

  <GuideCallout variant="warning" title="Standing notice: not redeemable for cash">
    Mint Coins are purely virtual class incentive points, strictly separated from class-funds cash and not redeemable for cash; the page keeps a standing “not redeemable for cash” notice, and the two systems neither top up nor offset each other.
  </GuideCallout>

  <GuideSectionHead
    id="what"
    title="What are Mint Coins"
    lead="Growth points that record class participation and contributions."
  />

  <div class="guide-grid">
    <div class="guide-span-6">
      <GuideRoleCard
        compact
        icon="🪙"
        level="student"
        role="1 coin on registration"
        desc="You receive 1 initial Mint Coin as soon as registration succeeds; the current initial rule applies."
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        compact
        icon="🌱"
        level="student"
        role="200 coins bloom · 500 coins bear fruit"
        desc="When a group totals 200 coins it enters bloom, and at 500 coins it enters fruit; below 200 coins it keeps developing as progress accumulates."
      />
    </div>
    <div class="guide-span-12">
      <GuideRoleCard
        compact
        icon="🔒"
        level="student"
        role="Strictly separated from class-funds cash"
        desc="Mint Coins are purely virtual class incentive points and cannot be exchanged for cash; class funds are public class money, and the two systems neither top up nor offset each other."
      />
    </div>
  </div>

  <GuideInfoTable
    caption="Personal four-tier growth badges (based on total coins earned, not your current remaining balance)"
    :columns="[{ key: 'range', title: 'Coin range' }, { key: 'name', title: 'Growth badge' }]"
    :rows="[
      { range: '1–5', name: 'Mint Sprout' },
      { range: '6–10', name: 'Mint Leaf' },
      { range: '11–15', name: 'Mint Bush' },
      { range: '16+', name: 'Mint King' }
    ]"
  />

  <GuideSectionHead
    id="places"
    title="Where to view and where to operate"
    lead="The public page and your personal wallet each cover their own area."
  />

  <div class="guide-grid">
    <div class="guide-span-6">
      <GuideRoleCard
        level="student"
        role="Public Mint Coins page"
        title="Four sections, visible to the whole class"
        desc="Mint Garden (the growth trees of the 6 groups), Leaderboard (all-time / yearly / monthly), Public Ledger, Honors wall (podium, achievements and Mint King list); shown automatically with no manual operation."
        :link="{ text: 'Open the Mint Coins public page', href: '/en/mint-coins/' }"
      />
    </div>
    <div class="guide-span-6">
      <GuideRoleCard
        level="student"
        role="Personal profile wallet"
        title="My balance and claims"
        desc="After signing in, click your avatar to open your profile to view my balance, growth badge, my claims and income / expense details."
      />
    </div>
  </div>

  <GuideSectionHead
    id="claim"
    title="Earn coins: contribution claim → review → credit"
    lead="Participation and contributions to the class enter the review process through a claim."
  />

  <GuideStepList
    :steps="[
      { title: 'File a claim', desc: 'Participation and contributions to the class (activities, sharing, helping classmates, and so on) can be claimed: fill in what you did, which reward rule it falls under, the recipient list, an explanation and proof materials.' },
      { title: 'Character and quantity limits', desc: 'Title up to 60 characters; explanation up to 500 characters; up to 3 proof images; batch recipient list up to 20 people (batch claims require a committee account; a single-person claim only needs yourself).' },
      { title: 'Submitting issues no coins yet', desc: 'Submitting a claim neither deducts anyone’s coins nor issues coins automatically; coins are only actually issued after approval.' },
      { title: 'Coins credited automatically on approval', desc: 'After approval the system credits each classmate automatically according to the recipient list and writes the entry into the public ledger; the claimant receives an “Approved” notice on the personal page and in the homepage popup.' },
      { title: 'Rejection carries a reason; revise and resubmit', desc: 'On rejection the approver must fill in a rejection reason; the claimant can see the reason, revise on the personal page and resubmit.' },
      { title: 'The list and coin count must match', desc: 'The recipient list must be real registered classmates; headcount must match the total coin count (for example, 3 people +3 each means 9 coins in total); do not claim or issue the same matter twice.' },
      { title: 'The head teacher / mentors cannot claim', desc: 'The head teacher He Jing and the mentors cannot file Mint Coins claims.' }
    ]"
  />

  <GuideSectionHead
    id="auditors"
    title="Who approves"
    lead="Mint Coins claims are handled by dedicated approvers."
  />

  <GuideCallout variant="info" title="Approvers">
    After you submit a claim, classmates Gao Xiaomei and Ye Hongying handle approval: once approved the coins arrive automatically; on rejection a reason is stated, and you can revise and resubmit.
  </GuideCallout>

  <GuideFaq
    id="faq"
    :items="[
      { q: 'Can Mint Coins be exchanged for cash?', aHtml: 'No. Mint Coins are <strong>purely virtual class incentive points</strong>, <strong>strictly separated from class-funds cash and not redeemable for cash</strong>; the two systems neither top up nor offset each other.' },
      { q: 'Who approves Mint Coins claims?', aHtml: 'Mint Coins claims are approved by classmates <strong>Gao Xiaomei and Ye Hongying</strong>.' },
      { q: 'What if my claim is rejected?', aHtml: 'The approver states the rejection reason; you can see it on your personal page and <strong>revise according to the reason and resubmit</strong>.' },
      { q: 'What do bloom / fruit mean?', aHtml: 'A group totals <strong>200 coins to bloom</strong> and <strong>500 coins to bear fruit</strong>; below 200 coins it keeps developing as progress accumulates.' }
    ]"
  />

  <GuideEmptyState
    variant="planned"
    title="Features provided in the current version"
    desc="The current version provides the Mint Garden, Leaderboard, Public Ledger, Honors wall and personal wallet; other features are planned for later versions and will be updated here once opened."
  />

  <template #related>
    <GuideRelatedLinks
      :links="[
        { icon: '🎉', title: 'Community', desc: 'Activities, sharing and helping classmates are the contribution scenarios behind claims.', link: '/en/guide/community' },
        { icon: '👥', title: 'Classmates & Governance', desc: 'Personal profile and wallet entry, real-name registration and sign-in rules.', link: '/en/guide/people' }
      ]"
    />
  </template>

  <template #footer>
    <GuideMaintenanceBar date="2026-10-30" />
  </template>
</GuideDocShell>
