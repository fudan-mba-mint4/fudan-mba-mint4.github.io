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
    overviewTitle: '架构总览',
    overview: '班级采用六大职能模块的扁平化治理架构，以"班级主理人 + 副主理人"为协调核心，五大职能模块并行运作，各模块之间既独立负责又协同联动。',
    modulesTitle: '六大职能模块',
    modules: [
      { icon: '🎯', name: '班级主理人', count: '1人', color: '#2D7A6C', duties: ['学院对接', '全局统筹', '跨组资源撮合', '信息降噪'], link: '/announcements/', linkText: '公告' },
      { icon: '📋', name: '副主理人', count: '2人', color: '#3A8F7E', duties: ['日常事务', '班委会组织', '事项日历', '进度跟进'], link: '/announcements/', linkText: '公告' },
      { icon: '🎉', name: '体验运营官', count: '2人+', color: '#45A390', duties: ['活动孵化', '生活情报', '班级氛围维护', '人人被看见'], link: '/activities/', linkText: '活动' },
      { icon: '💰', name: '财务激励官', count: '2人+', color: '#50B7A2', duties: ['班费透明', '台账公示', '班级币体系', '预算与激励'], link: '/finance/', linkText: '班费' },
      { icon: '📸', name: '记忆主理人', count: '2人+', color: '#5CCBB4', duties: ['影像记录', '内容输出', '班级品牌建设', '物料产出'], link: '/gallery/', linkText: '回忆' },
      { icon: '🔬', name: '智库研究员', count: '2人+', color: '#68DFC6', duties: ['课程拆解', '知识库建设', 'AI工具赋能', '学习资源供给'], link: '/knowledge/', linkText: '知识库' },
    ],
    collaborationTitle: '模块间协作关系',
    collaboration: [
      { scene: '班级活动策划与执行', modules: '体验运营官 + 记忆主理人 + 财务激励官', way: '体验运营官策划，记忆主理人记录，财务激励官保障预算' },
      { scene: '课程知识沉淀', modules: '智库研究员 + 记忆主理人', way: '智库研究员拆解内容，记忆主理人产出可视化物料' },
      { scene: '班级品牌建设', modules: '记忆主理人 + 体验运营官', way: '记忆主理人主导品牌视觉，体验运营官融入活动体验' },
      { scene: '同学激励与认可', modules: '财务激励官 + 体验运营官 + 副主理人', way: '财务激励官提供物资，体验运营官发现亮点，副主理人跟进落地' },
    ],
    principlesTitle: '治理原则',
    principles: [
      { icon: '↔️', title: '扁平化', desc: '没有层级壁垒，任何同学都可以直接联系任何模块负责人' },
      { icon: '🔍', title: '透明化', desc: '所有决策过程和财务信息对全班公开' },
      { icon: '🤲', title: '服务化', desc: '班委的存在是为了服务同学，而非管理同学' },
      { icon: '🔄', title: '迭代化', desc: '治理机制持续优化，根据班级实际需求调整' },
    ],
  },
  en: {
    overviewTitle: 'Architecture Overview',
    overview: 'The class adopts a flat governance structure with six functional modules. "Class Lead + Deputy Leads" serve as the coordination core, with five functional modules operating in parallel — each independently responsible yet collaboratively linked.',
    modulesTitle: 'Six Functional Modules',
    modules: [
      { icon: '🎯', name: 'Class Lead', count: '1 person', color: '#2D7A6C', duties: ['School liaison', 'Global coordination', 'Cross-group resource matching', 'Information filtering'], link: '/en/announcements/', linkText: 'Announcements' },
      { icon: '📋', name: 'Deputy Leads', count: '2 people', color: '#3A8F7E', duties: ['Daily operations', 'Committee organization', 'Task calendar', 'Progress tracking'], link: '/en/announcements/', linkText: 'Announcements' },
      { icon: '🎉', name: 'Experience Officers', count: '2+ people', color: '#45A390', duties: ['Event incubation', 'Life intel', 'Class atmosphere', 'Everyone seen'], link: '/en/activities/', linkText: 'Activities' },
      { icon: '💰', name: 'Finance Officers', count: '2+ people', color: '#50B7A2', duties: ['Fund transparency', 'Ledger publication', 'Class coin system', 'Budget & incentives'], link: '/en/finance/', linkText: 'Finance' },
      { icon: '📸', name: 'Memory Curators', count: '2+ people', color: '#5CCBB4', duties: ['Photo & video', 'Content output', 'Brand building', 'Material production'], link: '/en/gallery/', linkText: 'Gallery' },
      { icon: '🔬', name: 'Research Fellows', count: '2+ people', color: '#68DFC6', duties: ['Course breakdown', 'Knowledge base', 'AI tool empowerment', 'Learning resources'], link: '/en/knowledge/', linkText: 'Knowledge' },
    ],
    collaborationTitle: 'Inter-Module Collaboration',
    collaboration: [
      { scene: 'Class Event Planning & Execution', modules: 'Experience + Memory + Finance', way: 'Experience plans, Memory records, Finance ensures budget' },
      { scene: 'Course Knowledge Curation', modules: 'Research + Memory', way: 'Research breaks down content, Memory produces visual materials' },
      { scene: 'Class Brand Building', modules: 'Memory + Experience', way: 'Memory leads brand visuals, Experience integrates event experience' },
      { scene: 'Student Incentive & Recognition', modules: 'Finance + Experience + Deputy', way: 'Finance provides resources, Experience finds highlights, Deputy follows up' },
    ],
    principlesTitle: 'Governance Principles',
    principles: [
      { icon: '↔️', title: 'Flat', desc: 'No hierarchy barriers — any student can directly contact any module lead' },
      { icon: '🔍', title: 'Transparent', desc: 'All decision processes and financial information are open to the entire class' },
      { icon: '🤲', title: 'Service-Oriented', desc: 'The committee exists to serve students, not to manage them' },
      { icon: '🔄', title: 'Iterative', desc: 'Governance mechanisms continuously optimize based on actual class needs' },
    ],
  },
  th: {
    overviewTitle: 'ภาพรวมโครงสร้าง',
    overview: 'ชั้นเรียนใช้โครงสร้างการปกครองแบนด์กับหกโมดูลฟังก์ชัน "ผู้นำชั้น + รองผู้นำ" ทำหน้าที่เป็นแกนกลางการประสานงาน โดยมีห้าโมดูลฟังก์ชันทำงานคู่ขนาน — แต่ละโมดูลรับผิดชอบอย่างอิสระแต่เชื่อมโยงร่วมมือกัน',
    modulesTitle: 'หกโมดูลฟังก์ชัน',
    modules: [
      { icon: '🎯', name: 'ผู้นำชั้น', count: '1 คน', color: '#2D7A6C', duties: ['ติดต่อโรงเรียน', 'ประสานงานรวม', 'จับคู่ทรัพยากรข้ามกลุ่ม', 'กรองข้อมูล'], link: '/th/announcements/', linkText: 'ประกาศ' },
      { icon: '📋', name: 'รองผู้นำ', count: '2 คน', color: '#3A8F7E', duties: ['งานประจำวัน', 'จัดตั้งคณะกรรมการ', 'ปฏิทินงาน', 'ติดตามความคืบหน้า'], link: '/th/announcements/', linkText: 'ประกาศ' },
      { icon: '🎉', name: 'เจ้าหน้าที่ประสบการณ์', count: '2+ คน', color: '#45A390', duties: ['孵化กิจกรรม', 'ข้อมูลชีวิต', 'บรรยากาศชั้นเรียน', 'ทุกคนถูกมองเห็น'], link: '/th/activities/', linkText: 'กิจกรรม' },
      { icon: '💰', name: 'เจ้าหน้าที่การเงิน', count: '2+ คน', color: '#50B7A2', duties: ['ความโปร่งใสของกองทุน', 'เผยแพร่สมุดรายวัน', 'ระบบเหรียญชั้นเรียน', 'งบประมาณและสิ่งจูงใจ'], link: '/th/finance/', linkText: 'การเงิน' },
      { icon: '📸', name: 'ผู้ดูแลความทรงจำ', count: '2+ คน', color: '#5CCBB4', duties: ['ถ่ายภาพและวิดีโอ', 'ผลิตเนื้อหา', 'สร้างแบรนด์', 'ผลิตสื่อ'], link: '/th/gallery/', linkText: 'อัลบั้ม' },
      { icon: '🔬', name: 'นักวิจัย', count: '2+ คน', color: '#68DFC6', duties: ['แยกย่อยรายวิชา', 'คลังความรู้', 'AI tool', 'ทรัพยากรการเรียนรู้'], link: '/th/knowledge/', linkText: 'ความรู้' },
    ],
    collaborationTitle: 'ความร่วมมือระหว่างโมดูล',
    collaboration: [
      { scene: 'วางแผนและดำเนินกิจกรรมชั้นเรียน', modules: 'ประสบการณ์ + ความทรงจำ + การเงิน', way: 'ประสบการณ์วางแผน ความทรงจำบันทึก การเงินดูแลงบประมาณ' },
      { scene: 'การจัดทำความรู้จากรายวิชา', modules: 'วิจัย + ความทรงจำ', way: 'วิจัยแยกย่อยเนื้อหา ความทรงจำผลิตสื่อภาพ' },
      { scene: 'สร้างแบรนด์ชั้นเรียน', modules: 'ความทรงจำ + ประสบการณ์', way: 'ความทรงจำนำภาพแบรนด์ ประสบการณ์ผสานประสบการณ์กิจกรรม' },
      { scene: 'สิ่งจูงใจและการยอมรับนักเรียน', modules: 'การเงิน + ประสบการณ์ + รองผู้นำ', way: 'การเงินจัดหาทรัพยากร ประสบการณ์ค้นหาจุดเด่น รองผู้นำติดตามผล' },
    ],
    principlesTitle: 'หลักการการปกครอง',
    principles: [
      { icon: '↔️', title: 'แบนด์', desc: 'ไม่มีกำแพงลำดับชั้น — นักเรียนคนใดก็สามารถติดต่อผู้นำโมดูลใดก็ได้โดยตรง' },
      { icon: '🔍', title: 'โปร่งใส', desc: 'กระบวนการตัดสินใจและข้อมูลการเงินทั้งหมดเปิดให้ทั้งชั้นเห็น' },
      { icon: '🤲', title: 'เน้นการให้บริการ', desc: 'คณะกรรมการมีอยู่เพื่อให้บริการนักเรียน ไม่ใช่เพื่อจัดการ' },
      { icon: '🔄', title: 'ทำซ้ำและปรับปรุง', desc: 'กลไกการปกครองปรับปรุงอย่างต่อเนื่องตามความต้องการจริงของชั้นเรียน' },
    ],
  }
}

const t = computed(() => i18n[currentLang.value])
</script>

<template>
  <div class="structure-page">
    <!-- 架构总览 -->
    <section class="overview-section">
      <p class="overview-text">{{ t.overview }}</p>
    </section>

    <!-- 六大职能模块 -->
    <section class="section">
      <h2 class="section-title">{{ t.modulesTitle }}</h2>
      <div class="modules-grid">
        <div v-for="(mod, i) in t.modules" :key="i" class="module-card">
          <div class="module-header">
            <div class="module-icon" :style="{ background: mod.color + '20', color: mod.color }">{{ mod.icon }}</div>
            <div class="module-title-wrap">
              <h3 class="module-name">{{ mod.name }}</h3>
              <span class="module-count">{{ mod.count }}</span>
            </div>
          </div>
          <div class="module-duties">
            <span v-for="(duty, j) in mod.duties" :key="j" class="duty-tag">{{ duty }}</span>
          </div>
          <a :href="mod.link" class="module-link">{{ mod.linkText }} →</a>
        </div>
      </div>
    </section>

    <!-- 协作关系 -->
    <section class="section section--alt">
      <h2 class="section-title">{{ t.collaborationTitle }}</h2>
      <div class="collab-list">
        <div v-for="(item, i) in t.collaboration" :key="i" class="collab-item">
          <div class="collab-scene">{{ item.scene }}</div>
          <div class="collab-modules">{{ item.modules }}</div>
          <div class="collab-way">{{ item.way }}</div>
        </div>
      </div>
    </section>

    <!-- 治理原则 -->
    <section class="section">
      <h2 class="section-title">{{ t.principlesTitle }}</h2>
      <div class="principles-grid">
        <div v-for="(p, i) in t.principles" :key="i" class="principle-card">
          <div class="principle-icon">{{ p.icon }}</div>
          <h3 class="principle-title">{{ p.title }}</h3>
          <p class="principle-desc">{{ p.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.structure-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 总览 */
.overview-section {
  padding: 40px 0 30px;
}

.overview-text {
  font-size: 15px;
  line-height: 1.9;
  color: var(--c-text-secondary);
  margin: 0;
  text-align: center;
  max-width: 700px;
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

/* 职能模块卡片 */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.module-card {
  padding: 22px 20px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
}

.module-card:hover {
  border-color: var(--c-accent-light);
  transform: translateY(-3px);
}

.module-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.module-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.module-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.module-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0;
}

.module-count {
  font-size: 11px;
  color: var(--c-text-tertiary);
}

.module-duties {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  flex: 1;
}

.duty-tag {
  font-size: 11px;
  padding: 4px 10px;
  background: var(--c-bg-elevated);
  border-radius: 8px;
  color: var(--c-text-secondary);
}

.module-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.module-link:hover {
  opacity: 0.8;
}

/* 协作关系 */
.collab-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collab-item {
  padding: 18px 22px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 16px;
  align-items: center;
  transition: all 0.25s ease;
}

.collab-item:hover {
  border-color: var(--c-accent-light);
}

.collab-scene {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.collab-modules {
  font-size: 12px;
  color: var(--c-accent);
  font-weight: 600;
}

.collab-way {
  font-size: 13px;
  color: var(--c-text-secondary);
  line-height: 1.6;
}

/* 治理原则 */
.principles-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.principle-card {
  padding: 22px 18px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  text-align: center;
  transition: all 0.25s ease;
}

.principle-card:hover {
  border-color: var(--c-accent-light);
  transform: translateY(-2px);
}

.principle-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.principle-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 8px 0;
}

.principle-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.7;
  margin: 0;
}

/* 响应式 */
@media (max-width: 900px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .collab-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .principles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }

  .principles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
