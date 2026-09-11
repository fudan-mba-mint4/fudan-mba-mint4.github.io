<script setup>
import { ref, computed, onMounted } from 'vue'

const currentLang = ref('zh')
onMounted(() => {
  const path = window.location.pathname
  if (path.startsWith('/en/')) currentLang.value = 'en'
  else if (path.startsWith('/th/')) currentLang.value = 'th'
})

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
    committeeNote: '具体委员名单待确认后更新。本页面当前为架构展示版本，职能模块划分已确定，人员信息将在班委会确认后补充。',
    tableHeaders: ['职能模块', '姓名', '主要职责'],
    pending: '待补充',
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
    committeeNote: 'Specific member names will be updated after confirmation. This page currently shows the architecture — module divisions are finalized, personnel info will be added after committee confirmation.',
    tableHeaders: ['Module', 'Name', 'Key Responsibilities'],
    pending: 'TBD',
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
        duties: ['孵化กิจกรรมและข้อมูลชีวิต: วางแผนกิจกรรมชั้นเรียนและรวบรวม/แชร์ข้อมูลที่เกี่ยวข้องกับชีวิต', 'ดูแลบรรยากาศชั้นเรียน: ติดตามอารมณ์และบรรยากาศโดยรวมของชั้นเรียน ปรับเปลี่ยนตามความจำเป็น', 'ทุกคนถูกมองเห็น: ใส่ใจเป็นพิเศษกับนักเรียนที่ค่อนข้างเงียบ สร้างโอกาสให้ทุกคนได้แสดงออก']
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
        duties: ['แยกย่อยรายวิชาและคลังความรู้: จัดระเบียบและแยกย่อยเนื้อหารายวิชา สร้างและดูแลคลังความรู้ชั้นเรียน', 'AI tool และการเรียนรู้: สำรวจและส่งเสริม AI tool เพื่อปรับปรุงประสิทธิภาพการเรียนรู้ของทั้งชั้น', 'ทรัพยากรการเรียนรู้ตามความต้องการ: จัดหาทรัพยากรและวิธีการเรียนรู้อย่างแม่นยำตามความต้องการจริงของนักเรียน']
      },
    ],
    committeeTitle: 'สมาชิกคณะกรรมการ',
    committeeNote: 'ชื่อสมาชิกจะได้รับการอัปเดตหลังการยืนยัน หน้านี้ปัจจุบันแสดงโครงสร้าง — การแบ่งโมดูลเสร็จสิ้นแล้ว ข้อมูลบุคคลจะถูกเพิ่มหลังการยืนยันจากคณะกรรมการ',
    tableHeaders: ['โมดูล', 'ชื่อ', 'หน้าที่หลัก'],
    pending: 'รอดำเนินการ',
  }
}

const t = computed(() => i18n[currentLang.value])
</script>

<template>
  <div class="governance-page">
    <!-- 治理理念 -->
    <section class="philosophy-section">
      <div class="philosophy-card">
        <p class="philosophy-text">{{ t.philosophy }}</p>
        <p class="philosophy-desc">{{ t.philosophyDesc }}</p>
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

    <!-- 委员名单 -->
    <section class="section section--alt">
      <h2 class="section-title">{{ t.committeeTitle }}</h2>
      <div class="committee-note">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>{{ t.committeeNote }}</p>
      </div>
      <div class="committee-table-wrap">
        <table class="committee-table">
          <thead>
            <tr>
              <th v-for="(h, i) in t.tableHeaders" :key="i">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mod, i) in t.modules" :key="i">
              <td class="cell-module">{{ mod.name }}</td>
              <td class="cell-name">{{ t.pending }}</td>
              <td class="cell-duty">{{ mod.duties[0] }}</td>
            </tr>
          </tbody>
        </table>
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
}
</style>
