<script setup>
import { useLang } from '../composables/useLang'

const i18n = {
  zh: {
    philosophy: '班委不是管理者，是生态赋能者 —— 每个同学都能被看见·被需要·被记得',
    philosophyDesc: '我们相信，一个优秀的班级不是靠少数人"管理"出来的，而是靠一套赋能机制让每个人都能参与、贡献和成长。班委的角色是搭建平台、降低协作成本、激活个体能量，而非自上而下的指令传达。',
    modulesTitle: '六大职能模块',
    modules: [
      {
        icon: '🎯', name: '班级主理人（1人）',
        duties: ['学院对接：作为班级与学院之间的官方联络人，传达学院要求，反馈班级诉求', '全局统筹：把握班级整体发展方向，协调各模块工作节奏', '跨组资源撮合：在不同职能模块、不同同学之间牵线搭桥，促进资源流动', '信息降噪·定调学期氛围主题：过滤冗余信息，为每个学期设定核心氛围与主题']
      },
      {
        icon: '📋', name: '副主理人（2人）',
        duties: ['日常事务·进度跟进：处理班级日常运营事务，跟踪各项工作的执行进度', '班委会组织：定期组织班委会，确保各模块信息同步、问题及时解决', '事项日历·跟进落地进度：维护班级事项日历，确保重要事项不遗漏、有闭环']
      },
      {
        icon: '🎉', name: '体验运营官（2人以上）',
        duties: ['活动孵化·生活情报：策划和组织班级活动，收集并分享同学生活相关信息', '班级氛围维护：关注班级整体情绪与氛围，及时调节和引导', '人人被看见·引导沉默同学发声：特别关注较少发言的同学，创造机会让每个人都能被看见和听见']
      },
      {
        icon: '💰', name: '财务激励官（2人以上）',
        duties: ['班费透明·台账公示：管理班费收支，定期公示台账，确保财务完全透明', '班级币体系运营：设计和运营班级内部激励积分体系，鼓励正向行为', '预算机制·小额激励物资：建立班级预算机制，采购小额激励物资，认可同学贡献']
      },
      {
        icon: '📸', name: '记忆主理人（2人以上）',
        duties: ['影像记录·内容输出：记录课堂、活动和日常瞬间，产出照片、视频等内容', '班级品牌建设：塑造和传播班级品牌形象，提升班级辨识度和凝聚力', '物料产出·结合班级文化：设计和制作班级周边物料，融入班级文化元素']
      },
      {
        icon: '🔬', name: '智库研究员（2人以上）',
        duties: ['课程拆解·知识库：梳理和拆解课程内容，建设和维护班级知识库', 'AI工具·学习赋能：探索和推广AI工具，提升全班学习效率', '学习资源·按同学需求供给：根据同学实际需求，精准供给学习资源和方法']
      },
    ],
    committeeTitle: '委员名单',
    boardTitle: '独立董事会',
    boardDesc: '落选同学自动纳入，拥有提案权，负责观察和监督班委工作及收集班级成员意见，可自由参与项目，无淘汰。',
    committeeNote: '具体委员名单待确认后更新。本页面当前为架构展示版本，职能模块划分已确定，人员信息将在班委会确认后补充。',
    tableHeaders: ['职能模块', '姓名', '主要职责'],
    pending: '待补充',
    rulesTitle: '治理制度',
    termTitle: '任期制度与改选连任',
    termIntro: '每届班委任期一学年。学年末按「原任者意愿 + 是否有竞选者」分三种情形处理：',
    termCases: [
      { name: '直接连任', desc: '原任者愿意连任，且无他人参与竞选' },
      { name: '动员竞选 / 改选投票', desc: '原任者愿意连任，但有同学参与竞选，组织全班投票表决' },
      { name: '公开竞选改选', desc: '原任者不再连任，公开征集竞选者后组织全班投票' },
    ],
    termFlow: '改选流程：提名 / 自荐 → 全班投票 → 计票公示 → 新旧交接',
    dutyTitle: '履职要求',
    duties: [
      { name: '启动', desc: '上任即定计划，明确学期目标与工作节奏' },
      { name: '定岗', desc: '分工到人，责任清晰、不悬空' },
      { name: '复盘', desc: '阶段性回顾，及时调整方向与做法' },
      { name: '沉淀', desc: '过程与结果留档，经验可传承、可追溯' },
      { name: '使命必达', desc: '承诺的事按时完成，遇阻提前沟通' },
      { name: '接受监督', desc: '主动公开进展，接受独立董事会与全班监督' },
    ],
    oversightTitle: '罢免 · 主动退出 · 补位 · 交接监督',
    oversight: [
      { name: '主动退出', desc: '因故无法履职，提前向主理人团及班主任提出，经批准后办理交接' },
      { name: '补位补选', desc: '班委空缺时由班委提名候选人，全班表决通过后补位' },
      { name: '交接监督', desc: '账目双签、档案移交、班主任签字存档，过程留痕、责任清晰' },
      { name: '罢免表决', desc: '罢免提案须全班不信任票过半方可通过对' },
    ],
  },
  en: {
    philosophy: 'Committee members are enablers, not managers — every student can be seen, needed, and remembered',
    philosophyDesc: 'We believe an excellent class is not "managed" by a few, but built through an enabling system that lets everyone participate, contribute, and grow. The committee\'s role is to build platforms, reduce collaboration costs, and activate individual energy — not to issue top-down directives.',
    modulesTitle: 'Six Functional Modules',
    modules: [
      {
        icon: '🎯', name: 'Class Lead (1 person)',
        duties: ['School liaison: Official contact between class and school, conveying requirements and feedback', 'Global coordination: Setting overall class direction and coordinating module work rhythm', 'Cross-group resource matching: Connecting different modules and students to promote resource flow', 'Information filtering & theme setting: Filtering noise and setting core atmosphere theme each semester']
      },
      {
        icon: '📋', name: 'Deputy Leads (2 people)',
        duties: ['Daily operations & progress tracking: Handling daily class operations and tracking work execution', 'Committee organization: Organizing regular committee meetings to ensure info sync and problem resolution', 'Task calendar & follow-up: Maintaining class task calendar to ensure nothing is missed']
      },
      {
        icon: '🎉', name: 'Experience Officers (2+ people)',
        duties: ['Event incubation & life intel: Planning class activities and collecting/sharing life-related info', 'Class atmosphere maintenance: Monitoring overall class mood and atmosphere, adjusting as needed', 'Everyone seen: Paying special attention to quieter students, creating opportunities for everyone to be heard']
      },
      {
        icon: '💰', name: 'Finance Officers (2+ people)',
        duties: ['Fund transparency & ledger publication: Managing class fund income/expenses and publishing ledgers regularly', 'Class coin system: Designing and operating internal incentive points system to encourage positive behavior', 'Budget & incentive materials: Establishing budget mechanism and purchasing small incentive items to recognize contributions']
      },
      {
        icon: '📸', name: 'Memory Curators (2+ people)',
        duties: ['Photo/video & content output: Recording classes, events, and daily moments, producing photos and videos', 'Class brand building: Shaping and promoting class brand image, enhancing recognition and cohesion', 'Material production with class culture: Designing class merchandise incorporating cultural elements']
      },
      {
        icon: '🔬', name: 'Research Fellows (2+ people)',
        duties: ['Course breakdown & knowledge base: Organizing and breaking down course content, building and maintaining class knowledge base', 'AI tools & learning empowerment: Exploring and promoting AI tools to improve class learning efficiency', 'Learning resources on demand: Precisely providing learning resources and methods based on actual student needs']
      },
    ],
    committeeTitle: 'Committee Members',
    boardTitle: 'Independent Advisory Board',
    boardDesc: 'Candidates who were not elected automatically join. They have proposal rights, observe and supervise committee work, collect class member feedback, and may freely participate in projects — no elimination.',
    committeeNote: 'Specific member names will be updated after confirmation. This page currently shows the architecture — module divisions are finalized, personnel info will be added after committee confirmation.',
    tableHeaders: ['Module', 'Name', 'Key Responsibilities'],
    pending: 'TBD',
    rulesTitle: 'Governance Rules',
    termTitle: 'Term System & Re-election',
    termIntro: 'Each committee term lasts one academic year. At year-end, three scenarios apply based on the incumbent\'s willingness and whether there are challengers:',
    termCases: [
      { name: 'Direct Continuation', desc: 'The incumbent is willing to continue and no one else runs.' },
      { name: 'Motivated Election / Re-vote', desc: 'The incumbent is willing to continue but classmates also run; a class-wide vote is held.' },
      { name: 'Open Election', desc: 'The incumbent steps down; candidates are openly solicited and a class-wide vote is held.' },
    ],
    termFlow: 'Re-election process: Nomination / Self-nomination → Class vote → Tally & announcement → Handover',
    dutyTitle: 'Duties of the Committee',
    duties: [
      { name: 'Kick-off', desc: 'Set a plan upon taking office; clarify semester goals and working pace.' },
      { name: 'Role Assignment', desc: 'Allocate responsibilities to individuals; clear ownership, no gaps.' },
      { name: 'Review', desc: 'Reflect periodically and adjust direction and approach in time.' },
      { name: 'Documentation', desc: 'Keep records of process and results; experience is inheritable and traceable.' },
      { name: 'Deliver on Commitments', desc: 'Complete promised work on time; communicate early when obstacles arise.' },
      { name: 'Accept Oversight', desc: 'Proactively share progress and accept oversight from the Independent Board and the whole class.' },
    ],
    oversightTitle: 'Removal · Voluntary Exit · Replacement · Handover Oversight',
    oversight: [
      { name: 'Voluntary Exit', desc: 'If unable to serve, raise it with the Leadership Team and head teacher in advance; complete handover after approval.' },
      { name: 'Replacement Election', desc: 'When a committee seat is vacant, the committee nominates candidates and the class votes to fill the seat.' },
      { name: 'Handover Oversight', desc: 'Dual signatures on accounts, archive transfer, head teacher\'s signed record; the process is traceable with clear accountability.' },
      { name: 'Removal Vote', desc: 'A removal proposal requires more than half of the class\'s no-confidence votes to pass.' },
    ],
  },
  th: {
    philosophy: 'คณะกรรมการเป็นผู้สนับสนุน ไม่ใช่ผู้จัดการ — ทุกคนสามารถถูกมองเห็น ถูกต้องการ และถูกจดจำ',
    philosophyDesc: 'เราเชื่อว่าชั้นเรียนที่ยอดเยี่ยมไม่ได้ถูก "จัดการ" โดยคนไม่กี่คน แต่ถูกสร้างขึ้นผ่านระบบการสนับสนุนที่ให้ทุกคนมีส่วนร่วม มีส่วนร่วม และเติบโต บทบาทของคณะกรรมการคือการสร้างแพลตฟอร์ม ลดต้นทุนการทำงานร่วมกัน และกระตุ้นพลังงานของแต่ละคน — ไม่ใช่การสั่งการจากบนลงล่าง',
    modulesTitle: 'หกโมดูลฟังก์ชัน',
    modules: [
      {
        icon: '🎯', name: 'ผู้นำชั้น (1 คน)',
        duties: ['ติดต่อโรงเรียน: เป็นผู้ติดต่อทางการระหว่างชั้นเรียนและโรงเรียน ถ่ายทอดข้อกำหนดและข้อเสนอแนะ', 'ประสานงานรวม: กำหนดทิศทางรวมของชั้นเรียนและประสานจังหวะการทำงานของโมดูล', 'จับคู่ทรัพยากรข้ามกลุ่ม: เชื่อมต่อโมดูลต่างๆ และนักเรียนเพื่อส่งเสริมการไหลเวียนของทรัพยากร', 'กรองข้อมูลและกำหนดธีม: กรองสิ่งรบกวนและกำหนดธีมบรรยากาศหลักในแต่ละเทอม']
      },
      {
        icon: '📋', name: 'รองผู้นำ (2 คน)',
        duties: ['งานประจำวันและติดตามความคืบหน้า: จัดการงานประจำวันของชั้นเรียนและติดตามการดำเนินงาน', 'จัดตั้งคณะกรรมการ: จัดประชุมคณะกรรมการเป็นประจำเพื่อให้แน่ใจว่าข้อมูลซิงโครไนซ์และปัญหาได้รับการแก้ไข', 'ปฏิทินงานและติดตามผล: ดูแลปฏิทินงานของชั้นเรียนเพื่อให้แน่ใจว่าไม่มีอะไรหลุดลอย']
      },
      {
        icon: '🎉', name: 'เจ้าหน้าที่ประสบการณ์ (2+ คน)',
        duties: ['วางแผนกิจกรรมและข้อมูลชีวิต: วางแผนกิจกรรมชั้นเรียนและรวบรวม/แชร์ข้อมูลที่เกี่ยวข้องกับชีวิต', 'ดูแลบรรยากาศชั้นเรียน: ติดตามอารมณ์และบรรยากาศโดยรวมของชั้นเรียน ปรับเปลี่ยนตามความจำเป็น', 'ทุกคนถูกมองเห็น: ใส่ใจเป็นพิเศษกับนักเรียนที่ค่อนข้างเงียบ สร้างโอกาสให้ทุกคนได้แสดงออก']
      },
      {
        icon: '💰', name: 'เจ้าหน้าที่การเงิน (2+ คน)',
        duties: ['ความโปร่งใสของกองทุนและเผยแพร่สมุดรายวัน: จัดการรายรับ-รายจ่ายกองทุนชั้นเรียนและเผยแพร่สมุดรายวันเป็นประจำ', 'ระบบเหรียญชั้นเรียน: ออกแบบและดำเนินงานระบบคะแนนกระตุ้นภายในชั้นเรียนเพื่อส่งเสริมพฤติกรรมเชิงบวก', 'งบประมาณและสิ่งจูงใจ: สถาปนากลไกงบประมาณและจัดซื้อสิ่งจูงใจมูลค่าเล็กน้อยเพื่อยอมรับการมีส่วนร่วม']
      },
      {
        icon: '📸', name: 'ผู้ดูแลความทรงจำ (2+ คน)',
        duties: ['ถ่ายภาพ/วิดีโอและผลิตเนื้อหา: บันทึกชั้นเรียน กิจกรรม และช่วงเวลาประจำวัน ผลิตรูปภาพและวิดีโอ', 'สร้างแบรนด์ชั้นเรียน: ปั้นและส่งเสริมภาพลักษณ์แบรนด์ชั้นเรียน เพิ่มการรู้จักและความสามัคคี', 'ผลิตสื่อที่มีวัฒนธรรมชั้นเรียน: ออกแบบสินค้าโภคภัณฑ์ชั้นเรียนที่ผสานองค์ประกอบวัฒนธรรม']
      },
      {
        icon: '🔬', name: 'นักวิจัย (2+ คน)',
        duties: ['แยกย่อยรายวิชาและคลังความรู้: จัดระเบียบและแยกย่อยเนื้อหารายวิชา สร้างและดูแลคลังความรู้ชั้นเรียน', 'เครื่องมือ AI และการเรียนรู้: สำรวจและส่งเสริมเครื่องมือ AI เพื่อปรับปรุงประสิทธิภาพการเรียนรู้ของทั้งชั้น', 'ทรัพยากรการเรียนรู้ตามความต้องการ: จัดหาทรัพยากรและวิธีการเรียนรู้อย่างแม่นยำตามความต้องการจริงของนักเรียน']
      },
    ],
    committeeTitle: 'สมาชิกคณะกรรมการ',
    boardTitle: 'คณะกรรมการที่ปรึกษาอิสระ',
    boardDesc: 'ผู้สมัครที่ไม่ได้รับเลือกเข้าร่วมโดยอัตโนมัติ มีสิทธิ์เสนอข้อเสนอ เฝ้าดูแลและกำกับงานคณะกรรมการ รวบรวมความคิดเห็นของสมาชิกชั้นเรียน และสามารถเข้าร่วมโครงการได้อย่างอิสระ — ไม่มีการตัดออก',
    committeeNote: 'ชื่อสมาชิกจะได้รับการอัปเดตหลังการยืนยัน หน้านี้ปัจจุบันแสดงโครงสร้าง — การแบ่งโมดูลเสร็จสิ้นแล้ว ข้อมูลบุคคลจะถูกเพิ่มหลังการยืนยันจากคณะกรรมการ',
    tableHeaders: ['โมดูล', 'ชื่อ', 'หน้าที่หลัก'],
    pending: 'รอดำเนินการ',
    rulesTitle: 'กฎการปกครอง',
    termTitle: 'ระบบวาระการดำรงตำแหน่งและการเลือกตั้งใหม่',
    termIntro: 'คณะกรรมการชุดหนึ่งมีวาระหนึ่งปีการศึกษา ปลายปีการศึกษาจัดการตามสามกรณีจากความสมัครใจของผู้ดำรงตำแหน่งเดิมและมีผู้ลงสมัครแข่งขันหรือไม่:',
    termCases: [
      { name: 'ดำรงตำแหน่งต่อโดยตรง', desc: 'ผู้ดำรงตำแหน่งเดิมสมัครใจอยู่ต่อ และไม่มีผู้อื่นลงสมัครแข่งขัน' },
      { name: 'ชวนลงสมัคร / ลงคะแนนเลือกตั้งใหม่', desc: 'ผู้ดำรงตำแหน่งเดิมสมัครใจอยู่ต่อ แต่มีเพื่อนร่วมชั้นลงสมัครแข่งขัน จัดให้ทั้งชั้นลงคะแนน' },
      { name: 'เลือกตั้งแบบเปิด', desc: 'ผู้ดำรงตำแหน่งเดิมไม่ต่อวาระ ประกาศรับสมัครผู้แข่งขันอย่างเปิดเผยแล้วให้ทั้งชั้นลงคะแนน' },
    ],
    termFlow: 'ขั้นตอนการเลือกตั้งใหม่: เสนอชื่อ / สมัครเอง → ลงคะแนนทั้งชั้น → นับคะแนนและประกาศ → ส่งมอบงานระหว่างรุ่น',
    dutyTitle: 'ข้อกำหนดในการปฏิบัติหน้าที่',
    duties: [
      { name: 'เริ่มต้น', desc: 'วางแผนทันทีเมื่อรับตำแหน่ง กำหนดเป้าหมายภาคการศึกษาและจังหวะการทำงาน' },
      { name: 'กำหนดตำแหน่ง', desc: 'แบ่งงานให้ชัดเจนถึงบุคคล รับผิดชอบชัดเจน ไม่ปล่อยค้าง' },
      { name: 'ทบทวน', desc: 'ทบทวนเป็นระยะ ปรับทิศทางและวิธีการให้ทันการณ์' },
      { name: 'สะสม', desc: 'บันทึกกระบวนการและผลลัพธ์ ประสบการณ์ถ่ายทอดและตรวจสอบย้อนกลับได้' },
      { name: 'ทำตามสัญญา', desc: 'ทำงานที่รับปากให้เสร็จตรงเวลา หากติดขัดให้สื่อสารล่วงหน้า' },
      { name: 'รับการตรวจสอบ', desc: 'เปิดเผยความคืบหน้าอย่างจริงจัง และรับการตรวจสอบจากคณะกรรมการอิสระและทั้งชั้น' },
    ],
    oversightTitle: 'ถอดถอน · ลาออกโดยสมัครใจ · เติมตำแหน่ง · กำกับดูแลการส่งมอบ',
    oversight: [
      { name: 'ลาออกโดยสมัครใจ', desc: 'หากไม่สามารถปฏิบัติหน้าที่ได้ ให้แจ้งคณะผู้นำและอาจารย์ที่ปรึกษาล่วงหน้า หลังได้รับอนุมัติจึงดำเนินการส่งมอบ' },
      { name: 'เติมตำแหน่งโดยเลือกตั้ง', desc: 'เมื่อตำแหน่งว่าง คณะกรรมการเสนอชื่อผู้สมัคร ให้ทั้งชั้นลงคะแนนเห็นชอบจึงเติมตำแหน่ง' },
      { name: 'กำกับดูแลการส่งมอบ', desc: 'บัญชีเซ็นกำกับสองคน ส่งมอบเอกสาร อาจารย์ที่ปรึกษาเซ็นเก็บไว้ กระบวนการมีร่องรอยและความรับผิดชอบชัดเจน' },
      { name: 'ลงคะแนนถอดถอน', desc: 'ญัตติถอดถอนต้องได้คะแนนไม่ไว้วางใจเกินครึ่งของทั้งชั้นจึงจะผ่าน' },
    ],
  }
}

const { t } = useLang(i18n)

// 委员名单（按 t.modules 顺序：主理人、副主理人、体验运营、财务激励、记忆主理、智库研究）
const committeeMembers = [
  ['彭皓宁'],
  ['相婉玲', '雷振宇'],
  ['程芳芳', '王炜泽', '彭泽云', '施纯', '潘芸怡', '王雨露'],
  ['高晓梅', '叶宏颖', '李浩鹏', '程枭'],
  ['杨旻', '陈飘逸', '徐哲明', '李甜', '徐珮莹', '夏叶'],
  ['孟维翰', '邹智宇', '刘瑞霖'],
]

// 独立董事会（落选同学自动纳入，负责监督班委）
const boardMembers = ['周楠骐', '李浩', '王星然', '王胜']
</script>

<template>
  <div class="governance-page">
    <!-- 委员名单（放在最上面） -->
    <section class="committee-hero">
      <h2 class="committee-hero-title">{{ t.committeeTitle }}</h2>
      <p class="committee-hero-sub">2026级薄荷4班 · 班委团队</p>
      <div class="committee-grid committee-grid--top">
        <!-- 独立董事会 -->
        <div class="committee-card committee-card--board">
          <div class="committee-card-header">
            <span class="committee-card-icon">⚖️</span>
            <h3 class="committee-card-name">{{ t.boardTitle }}</h3>
          </div>
          <div class="committee-card-members">
            <span v-for="(name, i) in boardMembers" :key="i" class="member-chip">{{ name }}</span>
          </div>
        </div>
        <!-- 主理人 -->
        <div class="committee-card committee-card--lead">
          <div class="committee-card-header">
            <span class="committee-card-icon">{{ t.modules[0].icon }}</span>
            <h3 class="committee-card-name">{{ t.modules[0].name.replace(/（.*?）|\(.*?\)/g, '') }}</h3>
          </div>
          <div class="committee-card-members">
            <span v-for="(name, j) in committeeMembers[0]" :key="j" class="member-chip">{{ name }}</span>
          </div>
        </div>
        <!-- 副主理人 -->
        <div class="committee-card committee-card--deputy">
          <div class="committee-card-header">
            <span class="committee-card-icon">{{ t.modules[1].icon }}</span>
            <h3 class="committee-card-name">{{ t.modules[1].name.replace(/（.*?）|\(.*?\)/g, '') }}</h3>
          </div>
          <div class="committee-card-members">
            <span v-for="(name, j) in committeeMembers[1]" :key="j" class="member-chip">{{ name }}</span>
          </div>
        </div>
      </div>
      <div class="committee-grid committee-grid--bottom">
        <div
          v-for="(mod, i) in t.modules.slice(2)"
          :key="i"
          class="committee-card"
        >
          <div class="committee-card-header">
            <span class="committee-card-icon">{{ mod.icon }}</span>
            <h3 class="committee-card-name">{{ mod.name.replace(/（.*?）|\(.*?\)/g, '') }}</h3>
          </div>
          <div class="committee-card-members">
            <span v-for="(name, j) in committeeMembers[i + 2]" :key="j" class="member-chip">{{ name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 治理理念 -->
    <section class="philosophy-section">
      <div class="philosophy-card">
        <p class="philosophy-text">{{ t.philosophy }}</p>
        <p class="philosophy-desc">{{ t.philosophyDesc }}</p>
      </div>
    </section>

    <!-- 治理制度 -->
    <section class="section">
      <h2 class="section-title">{{ t.rulesTitle }}</h2>

      <h3 class="rules-subtitle">🗓️ {{ t.termTitle }}</h3>
      <p class="rules-intro">{{ t.termIntro }}</p>
      <div class="term-grid">
        <div v-for="(c, i) in t.termCases" :key="i" class="term-card">
          <span class="term-index">{{ i + 1 }}</span>
          <div class="term-content">
            <h4 class="term-name">{{ c.name }}</h4>
            <p class="term-desc">{{ c.desc }}</p>
          </div>
        </div>
      </div>
      <p class="rules-flow">{{ t.termFlow }}</p>

      <h3 class="rules-subtitle">📋 {{ t.dutyTitle }}</h3>
      <div class="duty-grid">
        <div v-for="(d, i) in t.duties" :key="i" class="duty-card">
          <span class="duty-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <h4 class="duty-name">{{ d.name }}</h4>
          <p class="duty-desc">{{ d.desc }}</p>
        </div>
      </div>

      <h3 class="rules-subtitle">⚖️ {{ t.oversightTitle }}</h3>
      <div class="oversight-grid">
        <div v-for="(o, i) in t.oversight" :key="i" class="oversight-card">
          <h4 class="oversight-name">{{ o.name }}</h4>
          <p class="oversight-desc">{{ o.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 六大职能模块 -->
    <section class="section">
      <h2 class="section-title">{{ t.modulesTitle }}</h2>
      <div class="modules-accordion">
        <div v-for="(mod, i) in t.modules" :key="i" class="module-block">
          <div class="module-block-header">
            <span class="module-block-icon">{{ mod.icon }}</span>
            <h3 class="module-block-name">{{ mod.name }}</h3>
          </div>
          <ul class="module-block-duties">
            <li v-for="(duty, j) in mod.duties" :key="j">{{ duty }}</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.governance-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 委员名单（顶部） */
.committee-hero {
  padding: 40px 0 32px;
}
.committee-hero-title {
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}
.committee-hero-sub {
  font-size: 14px;
  color: var(--c-text-secondary);
  text-align: center;
  margin: 0 0 28px;
}
.committee-grid {
  display: grid;
  gap: 14px;
}
.committee-grid--top {
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 14px;
}
.committee-grid--bottom {
  grid-template-columns: repeat(2, 1fr);
}
.committee-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 20px 18px;
  transition: all 0.25s ease;
}
.committee-card:hover {
  border-color: var(--c-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.committee-card--lead {
  /* 主理人：正常1列，不特殊 */
}
.committee-card--deputy {
  /* 副主理人：正常1列 */
}
.committee-card--board {
  /* 独立董事会：正常1列 */
}
.committee-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.committee-card-icon {
  font-size: 22px;
}
.committee-card-name {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.committee-card-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.member-chip {
  display: inline-block;
  padding: 6px 14px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-primary);
}
.committee-card--lead .member-chip {
  /* 主理人：字体大小与其他班委一致 */
}
.committee-card--deputy .member-chip {
  /* 副主理人：字体大小与其他班委一致 */
}

@media (max-width: 768px) {
  .committee-grid { grid-template-columns: 1fr; }
  .committee-card--lead, .committee-card--deputy, .committee-card--board { grid-column: span 1; }
  .committee-hero-title { font-size: 22px; }
  .term-grid, .duty-grid { grid-template-columns: repeat(2, 1fr); }
  .oversight-grid { grid-template-columns: 1fr; }
}

/* 治理理念 */
.philosophy-section {
  padding: 40px 0 30px;
}

.philosophy-card {
  padding: 36px 32px;
  background: linear-gradient(135deg, var(--c-accent-light) 0%, var(--c-bg-secondary) 100%);
  border: 1px solid var(--c-accent-light);
  border-radius: 20px;
  text-align: center;
}

.philosophy-text {
  font-size: 20px;
  font-weight: 800;
  color: var(--c-text-primary);
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.philosophy-desc {
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.9;
  margin: 0;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

/* 治理制度 */
.rules-subtitle {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 32px 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rules-intro {
  font-size: 13px;
  color: var(--c-text-secondary);
  line-height: 1.8;
  margin: 0 0 16px;
}

.term-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.term-card {
  display: flex;
  gap: 10px;
  padding: 16px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  transition: border-color 0.25s ease;
}

.term-card:hover {
  border-color: var(--c-accent-light);
}

.term-index {
  font-size: 14px;
  font-weight: 800;
  color: var(--c-accent);
  flex-shrink: 0;
  line-height: 1.4;
}

.term-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 4px;
}

.term-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.rules-flow {
  font-size: 12px;
  color: var(--c-text-tertiary);
  margin: 14px 0 0;
}

.duty-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.duty-card {
  padding: 16px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  transition: border-color 0.25s ease;
}

.duty-card:hover {
  border-color: var(--c-accent-light);
}

.duty-index {
  font-size: 12px;
  font-weight: 700;
  color: var(--c-accent);
}

.duty-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 4px 0 4px;
}

.duty-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.oversight-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.oversight-card {
  padding: 16px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  transition: border-color 0.25s ease;
}

.oversight-card:hover {
  border-color: var(--c-accent-light);
}

.oversight-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 4px;
}

.oversight-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 通用section */
.section {
  padding: 36px 0;
}

.section--alt {
  background: var(--c-bg-secondary);
  margin: 0 -24px;
  padding: 36px 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 28px 0;
  text-align: center;
}

/* 职能模块手风琴 */
.modules-accordion {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-block {
  padding: 22px 24px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  transition: all 0.25s ease;
}

.module-block:hover {
  border-color: var(--c-accent-light);
}

.module-block-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.module-block-icon {
  font-size: 24px;
}

.module-block-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0;
}

.module-block-duties {
  margin: 0;
  padding-left: 20px;
}

.module-block-duties li {
  font-size: 13px;
  color: var(--c-text-secondary);
  line-height: 1.8;
  margin-bottom: 4px;
}

/* 委员名单 */
.committee-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  margin-bottom: 20px;
}

.committee-note svg {
  color: var(--c-accent);
  flex-shrink: 0;
  margin-top: 2px;
}

.committee-note p {
  font-size: 13px;
  color: var(--c-text-secondary);
  line-height: 1.7;
  margin: 0;
}

.committee-table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--c-border);
}

.committee-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--c-bg-card);
}

.committee-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text-primary);
  background: var(--c-bg-elevated);
  border-bottom: 1px solid var(--c-border);
}

.committee-table td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--c-text-secondary);
  border-bottom: 1px solid var(--c-border);
}

.committee-table tr:last-child td {
  border-bottom: none;
}

.committee-table tr:hover td {
  background: var(--c-bg-secondary);
}

.cell-module {
  font-weight: 600;
  color: var(--c-text-primary) !important;
  white-space: nowrap;
}

.cell-name {
  color: var(--c-text-tertiary) !important;
  font-style: italic;
}

.cell-duty {
  font-size: 12px !important;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 640px) {
  .philosophy-text {
    font-size: 16px;
  }

  .module-block {
    padding: 18px 16px;
  }

  .term-grid, .duty-grid {
    grid-template-columns: 1fr;
  }
}
</style>
