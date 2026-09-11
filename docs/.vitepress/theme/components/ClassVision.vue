<script setup>
import { useLang } from '../composables/useLang'

const i18n = {
  zh: {
    visionTitle: '愿景陈述',
    vision: '打造一个让每个同学都能被看见、被需要、被记得的班级生态，在两年半MBA旅程中共同成长，在毕业后成为彼此终身的资源与伙伴。',
    formulaTitle: '心动公式',
    formula: '心动 = 被看见 × 被需要 × 被记得',
    formulaDesc: '这是我们定义"令人心动的班级"的核心公式。三个要素相乘，缺一不可：只有被看见，个体才有存在感；只有被需要，能力才有价值感；只有被记得，情谊才有延续感。',
    pillarsTitle: '四大建设方向',
    pillars: [
      { icon: '🚀', title: '挖潜释能 · 个体发展', desc: '打造激发同学们学习潜能的平台，培养终身学习力，为实现和个体发展相关的各种探索创造实践机会。' },
      { icon: '🤝', title: '凝心聚力 · 班级生态', desc: '推动建设生态型的班级组织架构，构建易于同学们深度交流的场域，使班级在未来具备持续发展的可能性。' },
      { icon: '🌐', title: '开放共创 · 外部链接', desc: '建立起和其他班级以及各类学生组织的链接通道，提供整合外部资源的机会，更好地给班级成员赋能。' },
      { icon: '💡', title: '创新驱动 · 科创未来', desc: '整合班级建设内与科创力有关的环节，建立创新思维，提升行业洞察力，培育和倡导创新与变革的班级文化。' },
    ],
    journeyTitle: '两年半旅程 · 从组织共建到顶峰相见',
    journey: [
      { period: '第一学期', time: '2026.08 - 2027.01', theme: '扎根与连接', items: ['班级见面会、开学典礼、聚劲Orientation', '班委竞聘与组织架构搭建', '班级文化共识与治理机制建立', '26级班级凝聚力建设工作坊'] },
      { period: '第二学期', time: '2027.03 - 2027.06', theme: '深化与绽放', items: ['将知识应用于实践，从理论到行动', '深化专业领域，形成差异化优势', '26级班级凝聚力建设工作坊', '聚动周-班级活动'] },
      { period: '第三学期', time: '2027.08 - 2028.01', theme: '拓展与链接', items: ['拓展职业网络，链接更广阔资源', '26级令人心动的班级比赛开启', '聚动周-班级活动', '班级品牌建设深化'] },
      { period: '第四学期', time: '2028.03 - 2028.06', theme: '沉淀与收官', items: ['主攻实践成果/论文', '答辩准备与完成', '沉淀班级记忆，为毕业做准备', '毕业旅行策划'] },
      { period: '第五学期', time: '2028.08 - 2029.01', theme: '荣耀与传承', items: ['毕业典礼（学院组织）', '毕业晚会（项目组织）', '毕业旅行（班级自组织）', '班级品牌传承与校友链接'] },
    ],
    afterTitle: '毕业后期望',
    afterGrad: [
      { icon: '🎓', title: '终身学习共同体', items: ['持续分享行业洞察和职业经验', '定期组织重聚和交流活动', '维护班级知识库，持续沉淀集体智慧'] },
      { icon: '🤝', title: '彼此的资源与伙伴', items: ['在职业发展中互相推荐、互相支持', '在创业和项目中寻找合作机会', '在人生重要时刻彼此见证和祝福'] },
      { icon: '🏆', title: '薄荷4班的品牌传承', items: ['以班级名义参与校友活动', '为后续届别的同学提供经验和指导', '让"薄荷4班"成为有温度、有影响力的集体符号'] }
    ],
    closing: '两年半很短，情谊很长。愿我们在复旦MBA的时光里，都能成为更好的自己，也都能拥有一群值得托付的伙伴。'
  },
  en: {
    visionTitle: 'Our Vision',
    vision: 'To build a class ecosystem where every student can be seen, needed, and remembered — growing together during our two-and-a-half-year MBA journey, and becoming lifelong resources and partners after graduation.',
    formulaTitle: 'The Heartbeat Formula',
    formula: 'Heartbeat = Seen × Needed × Remembered',
    formulaDesc: 'This is our core formula for defining a "class that makes hearts beat." Three elements multiplied together, none dispensable: only when seen does the individual feel existence; only when needed does ability find value; only when remembered does friendship find continuity.',
    pillarsTitle: 'Four Pillars of Class Building',
    pillars: [
      { icon: '🚀', title: 'Potential Unlocking · Individual Growth', desc: 'Build platforms that ignite students\' learning potential, cultivate lifelong learning ability, and create practical opportunities for various explorations related to individual development.' },
      { icon: '🤝', title: 'Cohesion Building · Class Ecosystem', desc: 'Promote the construction of an ecological class organization structure, build venues for in-depth exchange among students, and enable the class to have sustainable development potential in the future.' },
      { icon: '🌐', title: 'Open Co-creation · External Links', desc: 'Establish link channels with other classes and various student organizations, provide opportunities to integrate external resources, and better empower class members.' },
      { icon: '💡', title: 'Innovation Driving · Tech Future', desc: 'Integrate tech innovation-related elements in class building, establish innovative thinking, enhance industry insight, and cultivate and advocate a class culture of innovation and change.' },
    ],
    journeyTitle: 'Two-and-a-Half-Year Journey · From Co-building to Peak Reunion',
    journey: [
      { period: 'Semester 1', time: '2026.08 - 2027.01', theme: 'Rooting & Connecting', items: ['Class meeting, opening ceremony, Orientation', 'Committee election and organization setup', 'Class culture consensus and governance establishment', 'Class cohesion workshop'] },
      { period: 'Semester 2', time: '2027.03 - 2027.06', theme: 'Deepening & Blooming', items: ['Apply knowledge to practice, from theory to action', 'Deepen expertise and build competitive advantage', 'Class cohesion workshop', 'Class activity week'] },
      { period: 'Semester 3', time: '2027.08 - 2028.01', theme: 'Expanding & Linking', items: ['Expand professional networks and broader resources', '"Heartbeat Class" competition begins', 'Class activity week', 'Deepen class brand building'] },
      { period: 'Semester 4', time: '2028.03 - 2028.06', theme: 'Consolidating & Closing', items: ['Focus on practical results/thesis', 'Thesis defense preparation and completion', 'Preserve class memories, prepare for graduation', 'Graduation trip planning'] },
      { period: 'Semester 5', time: '2028.08 - 2029.01', theme: 'Glory & Legacy', items: ['Graduation ceremony (school organized)', 'Graduation gala (program organized)', 'Graduation trip (class self-organized)', 'Class brand legacy and alumni links'] },
    ],
    afterTitle: 'Post-Graduation Expectations',
    afterGrad: [
      { icon: '🎓', title: 'Lifelong Learning Community', items: ['Continuously share industry insights and career experience', 'Organize regular reunions and networking events', 'Maintain class knowledge base and collective wisdom'] },
      { icon: '🤝', title: 'Resources & Partners for Life', items: ['Recommend and support each other in career development', 'Find collaboration opportunities in startups and projects', 'Witness and bless each other at important life moments'] },
      { icon: '🏆', title: 'Mint 4 Brand Legacy', items: ['Participate in alumni events under the class name', 'Provide experience and guidance to future classes', 'Make "Mint 4" a warm and influential collective symbol'] }
    ],
    closing: 'Two and a half years is short, but friendship is long. May we all become better versions of ourselves during our time at Fudan MBA, and may we all have a group of partners worth trusting.'
  },
  th: {
    visionTitle: 'วิสัยทัศน์ของเรา',
    vision: 'สร้างระบบนิเวศชั้นเรียนที่ทุกคนสามารถถูกมองเห็น ถูกต้องการ และถูกจดจำ — เติบโตด้วยกันในระหว่างการเดินทาง MBA สองปีครึ่ง และกลายเป็นทรัพยากรและคู่หูตลอดชีวิตหลังจบการศึกษา',
    formulaTitle: 'สูตรหัวใจเต้น',
    formula: 'หัวใจเต้น = ถูกมองเห็น × ถูกต้องการ × ถูกจดจำ',
    formulaDesc: 'นี่คือสูตรหลักของเราในการนิยาม "ชั้นเรียนที่ทำให้หัวใจเต้น" สามองค์ประกอบคูณกัน ไม่มีอะไรขาดได้: เมื่อถูกมองเห็น บุคคลจึงรู้สึกมีอยู่; เมื่อถูกต้องการ ความสามารถจึงมีค่า; เมื่อถูกจดจำ มิตรภาพจึงมีความต่อเนื่อง',
    pillarsTitle: 'เสาหลักสี่ประการของการสร้างชั้นเรียน',
    pillars: [
      { icon: '🚀', title: 'ปลดปล่อยศักยภาพ · การเติบโตของบุคคล', desc: 'สร้างแพลตฟอร์มที่กระตุ้นศักยภาพการเรียนรู้ของนักเรียน ปลูกฝังความสามารถในการเรียนรู้ตลอดชีวิต และสร้างโอกาสทางปฏิบัติสำหรับการสำรวจต่างๆ ที่เกี่ยวข้องกับการพัฒนาบุคคล' },
      { icon: '🤝', title: 'สร้างความสามัคคี · ระบบนิเวศชั้นเรียน', desc: 'ส่งเสริมการสร้างโครงสร้างองค์กรชั้นเรียนแบบนิเวศ สร้างพื้นที่สำหรับการแลกเปลี่ยนเชิงลึกระหว่างนักเรียน และทำให้ชั้นเรียนมีศักยภาพในการพัฒนาอย่างยั่งยืนในอนาคต' },
      { icon: '🌐', title: 'ร่วมสร้างแบบเปิด · การเชื่อมโยงภายนอก', desc: 'สถาปนาช่องทางการเชื่อมโยงกับชั้นเรียนอื่นๆ และองค์กรนักเรียนต่างๆ ให้โอกาสในการรวมทรัพยากรภายนอก และมอบอำนาจให้สมาชิกชั้นเรียนได้ดีขึ้น' },
      { icon: '💡', title: 'ขับเคลื่อนด้วยนวัตกรรม · อนาคตเทคโนโลยี', desc: 'รวมองค์ประกอบที่เกี่ยวข้องกับนวัตกรรมเทคโนโลยีในการสร้างชั้นเรียน สถาปนาความคิดสร้างสรรค์ เพิ่มความเข้าใจอุตสาหกรรม และปลูกฝังและส่งเสริมวัฒนธรรมชั้นเรียนแห่งนวัตกรรมและการเปลี่ยนแปลง' },
    ],
    journeyTitle: 'การเดินทางสองปีครึ่ง · จากการร่วมสร้างถึงการพบกันที่จุดสูงสุด',
    journey: [
      { period: 'เทอม 1', time: '2026.08 - 2027.01', theme: 'หยั่งรากและเชื่อมโยง', items: ['การประชุมชั้นเรียน พิธีเปิดภาคเรียน Orientation', 'การเลือกตั้งคณะกรรมการและการจัดตั้งองค์กร', 'ความร่วมมือทางวัฒนธรรมชั้นเรียนและการสถาปนาการปกครอง', 'เวิร์กชอปสร้างความสามัคคีชั้นเรียน'] },
      { period: 'เทอม 2', time: '2027.03 - 2027.06', theme: 'ลึกซึ้งและเบ่งบาน', items: ['นำความรู้ไปใช้ในปฏิบัติ จากทฤษฎีสู่การกระทำ', 'ลึกซึ้งในความเชี่ยวชาญและสร้างข้อได้เปรียบ', 'เวิร์กชอปสร้างความสามัคคีชั้นเรียน', 'สัปดาห์กิจกรรมชั้นเรียน'] },
      { period: 'เทอม 3', time: '2027.08 - 2028.01', theme: 'ขยายและเชื่อมโยง', items: ['ขยายเครือข่ายอาชีพและทรัพยากรที่กว้างขวาง', 'การประกวด "ชั้นเรียนที่ทำให้หัวใจเต้น" เริ่มต้น', 'สัปดาห์กิจกรรมชั้นเรียน', 'ลึกซึ้งการสร้างแบรนด์ชั้นเรียน'] },
      { period: 'เทอม 4', time: '2028.03 - 2028.06', theme: 'รวบรวมและปิดฉาก', items: ['เน้นผลลัพธ์ทางปฏิบัติ/วิทยานิพนธ์', 'การเตรียมความพร้อมและการทำวิทยานิพนธ์', 'เก็บรักษาความทรงจำชั้นเรียน เตรียมตัวสำหรับการจบการศึกษา', 'การวางแผนทริปจบการศึกษา'] },
      { period: 'เทอม 5', time: '2028.08 - 2029.01', theme: 'เกียรติยศย์และมรดก', items: ['พิธีจบการศึกษา (จัดโดยโรงเรียน)', 'งานเลี้ยงจบการศึกษา (จัดโดยโปรแกรม)', 'ทริปจบการศึกษา (ชั้นเรียนจัดเอง)', 'มรดกแบรนด์ชั้นเรียนและการเชื่อมโยงศิษย์เก่า'] },
    ],
    afterTitle: 'ความคาดหวังหลังจบการศึกษา',
    afterGrad: [
      { icon: '🎓', title: 'ชุมชนการเรียนรู้ตลอดชีวิต', items: ['แชร์ข้อมูลเชิงลึกอุตสาหกรรมและประสบการณ์อาชีพอย่างต่อเนื่อง', 'จัดงานรวมตัวและเครือข่ายเป็นประจำ', 'ดูแลคลังความรู้ชั้นเรียนและสติปัญญารวม'] },
      { icon: '🤝', title: 'ทรัพยากรและคู่หูตลอดชีวิต', items: ['แนะนำและสนับสนุนซึ่งกันและกันในการพัฒนาอาชีพ', 'หาโอกาสร่วมมือในการสร้างธุรกิจและโครงการ', 'เป็นสักขีพยานและอวยพรซึ่งกันและกันในช่วงเวลาสำคัญของชีวิต'] },
      { icon: '🏆', title: 'มรดกแบรนด์มินต์ 4', items: ['เข้าร่วมกิจกรรมศิษย์เก่าภายใต้ชื่อชั้นเรียน', 'ให้ประสบการณ์และคำแนะนำแก่ชั้นเรียนในอนาคต', 'ทำให้ "มินต์ 4" เป็นสัญลักษณ์รวมที่อบอุ่นและมีอิทธิพล'] }
    ],
    closing: 'สองปีครึ่งสั้น แต่มิตรภาพยาวนาน ขอให้พวกเราทุกคนกลายเป็นตัวเองที่ดีขึ้นในช่วงเวลาที่ Fudan MBA และขอให้พวกเราทุกคนมีกลุ่มคู่หูที่คุ้มค่าที่จะไว้วางใจ'
  }
}

const { t } = useLang(i18n)
</script>

<template>
  <div class="vision-page">
    <!-- 愿景陈述 -->
    <section class="vision-hero">
      <div class="vision-card">
        <h2 class="vision-label">{{ t.visionTitle }}</h2>
        <p class="vision-text">{{ t.vision }}</p>
      </div>
    </section>

    <!-- 心动公式 -->
    <section class="section">
      <h2 class="section-title">{{ t.formulaTitle }}</h2>
      <div class="formula-card">
        <p class="formula-text">{{ t.formula }}</p>
        <p class="formula-desc">{{ t.formulaDesc }}</p>
      </div>
    </section>

    <!-- 四大建设方向 -->
    <section class="section section--alt">
      <h2 class="section-title">{{ t.pillarsTitle }}</h2>
      <div class="pillars-grid">
        <div v-for="(pillar, i) in t.pillars" :key="i" class="pillar-card">
          <div class="pillar-icon">{{ pillar.icon }}</div>
          <h3 class="pillar-title">{{ pillar.title }}</h3>
          <p class="pillar-desc">{{ pillar.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 两年半旅程 -->
    <section class="section">
      <h2 class="section-title">{{ t.journeyTitle }}</h2>
      <div class="journey-timeline">
        <div v-for="(stage, i) in t.journey" :key="i" class="journey-item" :class="{ 'journey-item--left': i % 2 === 0, 'journey-item--right': i % 2 === 1 }">
          <div class="journey-dot"></div>
          <div class="journey-content">
            <div class="journey-header">
              <span class="journey-period">{{ stage.period }}</span>
              <span class="journey-time">{{ stage.time }}</span>
            </div>
            <h3 class="journey-theme">{{ stage.theme }}</h3>
            <ul class="journey-items">
              <li v-for="(item, j) in stage.items" :key="j">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 毕业后期望 -->
    <section class="section section--alt">
      <h2 class="section-title">{{ t.afterTitle }}</h2>
      <div class="after-grid">
        <div v-for="(item, i) in t.afterGrad" :key="i" class="after-card">
          <div class="after-icon">{{ item.icon }}</div>
          <h3 class="after-title">{{ item.title }}</h3>
          <ul class="after-items">
            <li v-for="(sub, j) in item.items" :key="j">{{ sub }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 结尾 -->
    <section class="closing-section">
      <p class="closing-text">{{ t.closing }}</p>
    </section>
  </div>
</template>

<style scoped>
.vision-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 愿景陈述 */
.vision-hero {
  padding: 40px 0 30px;
}

.vision-card {
  padding: 36px 32px;
  background: linear-gradient(135deg, var(--c-accent-light) 0%, var(--c-bg-secondary) 100%);
  border: 1px solid var(--c-accent-light);
  border-radius: 20px;
  text-align: center;
}

.vision-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 16px 0;
}

.vision-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-text-primary);
  line-height: 1.8;
  margin: 0;
  max-width: 680px;
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

/* 心动公式 */
.formula-card {
  padding: 32px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}

.formula-text {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--c-accent) 0%, var(--c-accent-dark) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 16px 0;
  letter-spacing: -0.5px;
}

.formula-desc {
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.9;
  margin: 0;
}

/* 四大建设方向 */
.pillars-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.pillar-card {
  padding: 24px 22px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  transition: all 0.25s ease;
}

.pillar-card:hover {
  border-color: var(--c-accent-light);
  transform: translateY(-3px);
}

.pillar-icon {
  font-size: 28px;
  margin-bottom: 12px;
}

.pillar-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 10px 0;
}

.pillar-desc {
  font-size: 13px;
  color: var(--c-text-secondary);
  line-height: 1.8;
  margin: 0;
}

/* 两年半旅程时间线 */
.journey-timeline {
  position: relative;
  padding: 20px 0;
}

.journey-timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--c-border);
  transform: translateX(-50%);
}

.journey-item {
  position: relative;
  width: 50%;
  padding: 16px 32px;
  margin-bottom: 8px;
}

.journey-item--left {
  left: 0;
  text-align: right;
}

.journey-item--right {
  left: 50%;
  text-align: left;
}

.journey-dot {
  position: absolute;
  top: 28px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--c-accent);
  border: 3px solid var(--c-bg-card);
  box-shadow: 0 0 0 2px var(--c-accent-light);
}

.journey-item--left .journey-dot {
  right: -7px;
}

.journey-item--right .journey-dot {
  left: -7px;
}

.journey-content {
  padding: 18px 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  transition: all 0.25s ease;
}

.journey-content:hover {
  border-color: var(--c-accent-light);
}

.journey-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.journey-item--left .journey-header {
  justify-content: flex-end;
}

.journey-period {
  font-size: 13px;
  font-weight: 700;
  color: var(--c-accent);
}

.journey-time {
  font-size: 11px;
  color: var(--c-text-tertiary);
}

.journey-theme {
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 10px 0;
}

.journey-items {
  margin: 0;
  padding-left: 18px;
}

.journey-item--left .journey-items {
  padding-left: 0;
  padding-right: 18px;
  list-style: none;
}

.journey-items li {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.8;
  margin-bottom: 2px;
}

.journey-item--left .journey-items li::before {
  content: '·';
  margin-left: 6px;
  color: var(--c-accent);
}

/* 毕业后期望 */
.after-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.after-card {
  padding: 22px 18px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  text-align: center;
  transition: all 0.25s ease;
}

.after-card:hover {
  border-color: var(--c-accent-light);
  transform: translateY(-2px);
}

.after-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.after-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 12px 0;
}

.after-items {
  margin: 0;
  padding-left: 16px;
  text-align: left;
}

.after-items li {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.8;
  margin-bottom: 4px;
}

/* 结尾 */
.closing-section {
  padding: 40px 0 20px;
  text-align: center;
}

.closing-text {
  font-size: 15px;
  font-style: italic;
  color: var(--c-text-secondary);
  line-height: 1.9;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* 响应式 */
@media (max-width: 768px) {
  .pillars-grid {
    grid-template-columns: 1fr;
  }

  .after-grid {
    grid-template-columns: 1fr;
  }

  /* 时间线改为单列 */
  .journey-timeline::before {
    left: 20px;
  }

  .journey-item {
    width: 100%;
    left: 0 !important;
    text-align: left !important;
    padding: 12px 0 12px 48px;
  }

  .journey-dot {
    left: 13px !important;
    right: auto !important;
  }

  .journey-header {
    justify-content: flex-start !important;
  }

  .journey-items {
    padding-left: 18px !important;
    padding-right: 0 !important;
    list-style: disc !important;
  }

  .journey-items li::before {
    content: none !important;
  }

  .formula-text {
    font-size: 20px;
  }
}
</style>
