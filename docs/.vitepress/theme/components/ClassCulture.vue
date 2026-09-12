<script setup>
import { useLang } from '../composables/useLang'

const i18n = {
  zh: {
    slogan: '4 the Best, for the Future.',
    sloganDesc: '既是对"4班"的巧妙嵌入，也表达了我们追求卓越、面向未来的共同信念。',
    valuesTitle: '核心价值观',
    values: [
      { icon: '📚', title: '学习成长', desc: '以开放心态持续学习，在MBA旅程中不断突破认知边界，将课堂知识转化为实践能力。' },
      { icon: '🤝', title: '资源共享', desc: '每个人都是资源的贡献者和受益者。倡导信息互通、经验分享、机会共建，让集体智慧放大个体价值。' },
      { icon: '💚', title: '团结互助', desc: '同学之间真诚相待、彼此支持。无论是学业压力还是生活挑战，我们都是彼此最可靠的伙伴。' },
      { icon: '⭐', title: '追求卓越', desc: '不满足于"差不多"，在每一件事上追求更高标准。卓越不是终点，而是我们共同的生活方式。' },
    ],
    badgeAlt: '班徽',
    badgeTitle: '班徽含义',
    badgeElements: [
      { element: '圆形徽章', meaning: '象征团结与完整，代表班级是一个紧密相连的整体' },
      { element: '帆船图案', meaning: '寓意扬帆起航、乘风破浪，象征MBA旅程的探索精神' },
      { element: '薄荷绿主题色', meaning: '代表清新、活力与成长，呼应"薄荷"班级名称' },
      { element: 'FUDAN UNIVERSITY', meaning: '标明所属院校，体现复旦人的身份认同' },
      { element: 'MBA 2026', meaning: '标注届别，记录我们共同的两年时光' },
    ],
    nameTitle: '班级名称由来',
    nameContent: '"薄荷"象征清新、活力与成长——正如我们这群在职业发展关键阶段选择重返校园的同学，带着对新知的渴望和对未来的期许，在复旦MBA的课堂上重新出发。薄荷绿是我们的主题色，它既不过于张扬，又充满生命力，恰如我们班级的气质：低调但有力量，温和但有方向。"4"不仅是班级编号，更与口号"4 the Best"形成谐音双关，寓意我们追求最好的自己、最好的班级、最好的未来。',
    atmosphereTitle: '文化氛围',
    atmosphereTags: [
      { tag: '真诚', desc: '不装、不端，以真实面目相处' },
      { tag: '开放', desc: '包容不同背景和观点，鼓励多元表达' },
      { tag: '温暖', desc: '彼此关心、互相托底，让每个人都有归属感' },
      { tag: '向上', desc: '互相激励、共同进步，不让任何一个人掉队' },
    ],
    footer: '在这里，每个人都能被看见、被需要、被记得。',
  },
  en: {
    slogan: '4 the Best, for the Future.',
    sloganDesc: 'A clever play on "Class 4" that expresses our shared belief in pursuing excellence and embracing the future.',
    valuesTitle: 'Core Values',
    values: [
      { icon: '📚', title: 'Learning & Growth', desc: 'Continuously learn with an open mind, push cognitive boundaries, and turn classroom knowledge into practical ability.' },
      { icon: '🤝', title: 'Resource Sharing', desc: 'Everyone is both a contributor and beneficiary. We advocate information exchange, experience sharing, and opportunity co-creation.' },
      { icon: '💚', title: 'Unity & Support', desc: 'Classmates treat each other sincerely and support one another through academic pressure and life challenges.' },
      { icon: '⭐', title: 'Pursuit of Excellence', desc: 'Never settle for "good enough." Excellence is not a destination but our shared way of life.' },
    ],
    badgeAlt: 'Class Badge',
    badgeTitle: 'Badge Meaning',
    badgeElements: [
      { element: 'Circular Badge', meaning: 'Symbolizes unity and completeness, representing the class as a closely connected whole' },
      { element: 'Sailboat', meaning: 'Signifies setting sail and braving waves, embodying the exploratory spirit of the MBA journey' },
      { element: 'Mint Green', meaning: 'Represents freshness, vitality, and growth, echoing the "Mint" class name' },
      { element: 'FUDAN UNIVERSITY', meaning: 'Identifies our institution and reflects Fudan identity' },
      { element: 'MBA 2026', meaning: 'Marks our cohort year, recording our two-year journey together' },
    ],
    nameTitle: 'Origin of Class Name',
    nameContent: '"Mint" symbolizes freshness, vitality, and growth — just like us, returning to campus at a critical career stage with a thirst for knowledge and hope for the future. Mint green is our theme color: not too flashy, yet full of life, just like our class temperament — low-key but powerful, gentle but directed. "4" is not just a class number; it forms a pun with our slogan "4 the Best," symbolizing our pursuit of the best selves, the best class, and the best future.',
    atmosphereTitle: 'Class Atmosphere',
    atmosphereTags: [
      { tag: 'Sincere', desc: 'No pretense, just genuine connection' },
      { tag: 'Open', desc: 'Embrace diverse backgrounds and perspectives' },
      { tag: 'Warm', desc: 'Care for each other, everyone belongs' },
      { tag: 'Upward', desc: 'Motivate each other, no one left behind' },
    ],
    footer: 'Here, everyone can be seen, needed, and remembered.',
  },
  th: {
    slogan: '4 the Best, for the Future.',
    sloganDesc: 'การเล่นคำที่ชาญฉลาดของ "ชั้น 4" ที่แสดงความเชื่อร่วมในการแสวงหาความเป็นเลิศและก้าวไปสู่อนาคต',
    valuesTitle: 'ค่านิยมหลัก',
    values: [
      { icon: '📚', title: 'การเรียนรู้และการเติบโต', desc: 'เรียนรู้อย่างต่อเนื่องด้วยใจเปิด ขยายขอบเขตความรู้ และเปลี่ยนความรู้ในชั้นเรียนเป็นความสามารถทางปฏิบัติ' },
      { icon: '🤝', title: 'การแบ่งปันทรัพยากร', desc: 'ทุกคนเป็นทั้งผู้สนับสนุนและผู้รับประโยชน์ เราส่งเสริมการแลกเปลี่ยนข้อมูล การแบ่งปันประสบการณ์ และการสร้างโอกาสร่วมกัน' },
      { icon: '💚', title: 'ความสามัคคีและการสนับสนุน', desc: 'เพื่อนร่วมชั้นปฏิบัติต่อกันด้วยความจริงใจและสนับสนุนซึ่งกันและกัน ไม่ว่าจะเป็นความกดดันทางการเรียนหรือความท้าทายในชีวิต' },
      { icon: '⭐', title: 'การแสวงหาความเป็นเลิศ', desc: 'ไม่พอใจกับ "พอใช้" ความเป็นเลิศไม่ใช่จุดหมายแต่เป็นวิถีชีวิตร่วมกันของเรา' },
    ],
    badgeAlt: 'เครื่องหมายชั้น',
    badgeTitle: 'ความหมายของเครื่องหมายชั้น',
    badgeElements: [
      { element: 'เข็มกลัดวงกลม', meaning: 'สื่อถึงความสามัคคีและความสมบูรณ์ แทนชั้นเรียนที่เชื่อมต่อแน่นแฟ้น' },
      { element: 'รูปเรือใบ', meaning: 'สื่อถึงการออกเดินทางและเผชิญคลื่น ล้วนแล้วแต่เป็นจิตวิญญาณแห่งการสำรวจในการเดินทาง MBA' },
      { element: 'สีเขียวมินต์', meaning: 'แทนความสดใหม่ ความมีชีวิตชีวา และการเติบโต สะท้อนชื่อชั้น "มินต์"' },
      { element: 'FUDAN UNIVERSITY', meaning: 'ระบุสถาบันของเราและสะท้อนอัตลักษณ์ของคนฝูด่าน' },
      { element: 'MBA 2026', meaning: 'ทำเครื่องหมายรุ่นของเรา บันทึกการเดินทางสองปีของเราด้วยกัน' },
    ],
    nameTitle: 'ที่มาของชื่อชั้นเรียน',
    nameContent: '"มินต์" สื่อถึงความสดใหม่ ความมีชีวิตชีวา และการเติบโต — เช่นเดียวกับเรา ที่กลับมาศึกษาในช่วงวิกฤตอาชีพ ด้วยความกระหายความรู้และความหวังสำหรับอนาคต สีเขียวมินต์เป็นสีธีมของเรา: ไม่โดดเด่นเกินไป แต่เต็มไปด้วยชีวิต เช่นเดียวกับอากาศของชั้นเรา — เรียบง่ายแต่มีพลัง อ่อนโยนแต่มีทิศทาง "4" ไม่ใช่แค่เลขชั้น แต่ยังสร้างคำเล่นคำกับสโลแกน "4 the Best" อีกด้วย',
    atmosphereTitle: 'บรรยากาศชั้นเรียน',
    atmosphereTags: [
      { tag: 'จริงใจ', desc: 'ไม่แสร้งทำ ทำตัวตามตัวตนจริง' },
      { tag: 'เปิดใจ', desc: 'ยอมรับความหลากหลายของภูมิหลังและมุมมอง' },
      { tag: 'อบอุ่น', desc: 'เอาใจใส่ซึ่งกันและกัน ทุกคนมีความรู้สึกเป็นส่วนหนึ่ง' },
      { tag: 'ก้าวหน้า', desc: 'กระตุ้นซึ่งกันและกัน ไม่ทิ้งใครไว้ข้างหลัง' },
    ],
    footer: 'ที่นี่ ทุกคนสามารถถูกมองเห็น ถูกต้องการ และถูกจดจำ',
  },
}

const { t } = useLang(i18n)
</script>

<template>
  <div class="culture-page">
    <!-- 口号 -->
    <section class="slogan-section">
      <h1 class="slogan-text">{{ t.slogan }}</h1>
      <p class="slogan-desc">{{ t.sloganDesc }}</p>
    </section>

    <!-- 核心价值观 -->
    <section class="section">
      <h2 class="section-title">{{ t.valuesTitle }}</h2>
      <div class="values-grid">
        <div v-for="(v, i) in t.values" :key="i" class="value-card">
          <div class="value-icon">{{ v.icon }}</div>
          <h3 class="value-title">{{ v.title }}</h3>
          <p class="value-desc">{{ v.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 班徽含义 -->
    <section class="section section--alt">
      <h2 class="section-title">{{ t.badgeTitle }}</h2>
      <div class="badge-section">
        <div class="badge-display">
          <img src="/images/logo.webp" :alt="t.badgeAlt" class="badge-img-large" />
        </div>
        <div class="badge-elements">
          <div v-for="(b, i) in t.badgeElements" :key="i" class="badge-element">
            <span class="badge-dot"></span>
            <div class="badge-element-content">
              <span class="badge-element-name">{{ b.element }}</span>
              <span class="badge-element-meaning">{{ b.meaning }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 班级名称由来 -->
    <section class="section">
      <h2 class="section-title">{{ t.nameTitle }}</h2>
      <p class="name-content">{{ t.nameContent }}</p>
    </section>

    <!-- 文化氛围 -->
    <section class="section section--alt">
      <h2 class="section-title">{{ t.atmosphereTitle }}</h2>
      <div class="atmosphere-grid">
        <div v-for="(a, i) in t.atmosphereTags" :key="i" class="atmosphere-card">
          <span class="atmosphere-tag">{{ a.tag }}</span>
          <p class="atmosphere-desc">{{ a.desc }}</p>
        </div>
      </div>
      <p class="culture-footer">{{ t.footer }}</p>
    </section>
  </div>
</template>

<style scoped>
.culture-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

/* 口号 */
.slogan-section {
  text-align: center;
  padding: 60px 20px 50px;
}

.slogan-text {
  font-size: 42px;
  font-weight: 800;
  color: var(--c-accent);
  letter-spacing: -0.5px;
  line-height: 1.2;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, var(--c-accent) 0%, var(--c-accent-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.slogan-desc {
  font-size: 15px;
  color: var(--c-text-secondary);
  line-height: 1.7;
  max-width: 560px;
  margin: 0 auto;
}

/* 通用section */
.section {
  padding: 40px 0;
}

.section--alt {
  background: var(--c-bg-secondary);
  margin: 0 -24px;
  padding: 40px 24px;
  border-radius: 0;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 28px 0;
  text-align: center;
}

/* 价值观卡片 */
.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.value-card {
  padding: 24px;
  background: var(--c-bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  transition: all 0.25s ease;
}

.value-card:hover {
  border-color: var(--c-accent-light);
  transform: translateY(-3px);
}

.value-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.value-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 8px 0;
}

.value-desc {
  font-size: 13px;
  color: var(--c-text-secondary);
  line-height: 1.7;
  margin: 0;
}

/* 班徽 */
.badge-section {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.badge-display {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-img-large {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.badge-elements {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.badge-element {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c-accent);
  margin-top: 6px;
  flex-shrink: 0;
}

.badge-element-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.badge-element-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.badge-element-meaning {
  font-size: 13px;
  color: var(--c-text-secondary);
  line-height: 1.6;
}

/* 名称由来 */
.name-content {
  font-size: 15px;
  line-height: 1.9;
  color: var(--c-text-secondary);
  margin: 0;
  text-align: justify;
}

/* 文化氛围 */
.atmosphere-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.atmosphere-card {
  padding: 20px 16px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  text-align: center;
  transition: all 0.25s ease;
}

.atmosphere-card:hover {
  border-color: var(--c-accent);
  transform: translateY(-2px);
}

.atmosphere-tag {
  display: inline-block;
  font-size: 18px;
  font-weight: 800;
  color: var(--c-accent);
  margin-bottom: 8px;
}

.atmosphere-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.culture-footer {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .slogan-text {
    font-size: 28px;
  }

  .values-grid {
    grid-template-columns: 1fr;
  }

  .badge-section {
    flex-direction: column;
    align-items: center;
    gap: 28px;
  }

  .badge-img-large {
    width: 140px;
    height: 140px;
  }

  .atmosphere-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
