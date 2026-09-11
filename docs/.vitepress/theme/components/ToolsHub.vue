<template>
  <div class="tools-hub">
    <PageHeader
      :icon="icon"
      :title="t.title"
      :subtitle="t.subtitle"
    />

    <div class="tools-container">
      <div
        v-for="category in toolCategories"
        :key="category.id"
        class="tool-category"
      >
        <div class="category-header">
          <div class="category-icon" :style="{ background: category.color + '22', color: category.color }">
            <span>{{ category.emoji }}</span>
          </div>
          <div class="category-info">
            <h3 class="category-title">{{ category.name[lang] }}</h3>
            <p class="category-desc">{{ category.desc[lang] }}</p>
          </div>
          <span class="category-count">{{ category.tools.length }} {{ t.tools }}</span>
        </div>

        <div class="tools-grid">
          <div
            v-for="tool in category.tools"
            :key="tool.id"
            class="tool-card"
            :class="{ 'tool-card--disabled': !tool.available }"
            @click="tool.available && handleToolClick(tool)"
          >
            <div class="tool-icon" :style="{ color: category.color }">
              <span>{{ tool.emoji }}</span>
            </div>
            <div class="tool-info">
              <h4 class="tool-name">{{ tool.name[lang] }}</h4>
              <p class="tool-desc">{{ tool.desc[lang] }}</p>
            </div>
            <div class="tool-status">
              <span v-if="tool.available" class="status-badge status--online">{{ t.online }}</span>
              <span v-else class="status-badge status--soon">{{ t.comingSoon }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="tools-footer">
      <p>{{ t.footerText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from './PageHeader.vue'
import { useLang } from '../composables/useLang'

const icon = '🔧'

const i18n = {
  zh: {
    title: '实用小工具',
    subtitle: '同学们日常学习与生活的效率工具箱',
    tools: '个工具',
    online: '已上线',
    comingSoon: '开发中',
    footerText: '更多工具持续开发中，有需求欢迎在班级群提出',
  },
  en: {
    title: 'Utilities',
    subtitle: 'Efficiency toolbox for study and daily life',
    tools: 'tools',
    online: 'Online',
    comingSoon: 'Coming Soon',
    footerText: 'More tools under development. Suggestions welcome in class group chat.',
  },
  th: {
    title: 'เครื่องมือที่มีประโยชน์',
    subtitle: 'กล่องเครื่องมือเพื่อการเรียนรู้และชีวิตประจำวัน',
    tools: 'เครื่องมือ',
    online: 'พร้อมใช้',
    comingSoon: 'กำลังพัฒนา',
    footerText: 'เครื่องมือเพิ่มเติมกำลังอยู่ในการพัฒนา',
  },
}

const { lang, t } = useLang(i18n)

const toolCategories = [
  {
    id: 'pdf',
    name: { zh: 'PDF 工具', en: 'PDF Tools', th: 'เครื่องมือ PDF' },
    desc: { zh: 'PDF 压缩、合并、拆分、转换', en: 'Compress, merge, split, convert PDF', th: 'บีบอัด รวม แยก แปลง PDF' },
    color: '#FF3B30',
    emoji: '📄',
    tools: [
      { id: 'pdf-compress', emoji: '🗜️', available: false, name: { zh: 'PDF 压缩', en: 'Compress PDF', th: 'บีบอัด PDF' }, desc: { zh: '减小 PDF 文件体积', en: 'Reduce PDF file size', th: 'ลดขนาดไฟล์ PDF' } },
      { id: 'pdf-merge', emoji: '🔗', available: false, name: { zh: 'PDF 合并', en: 'Merge PDF', th: 'รวม PDF' }, desc: { zh: '多个 PDF 合并为一个', en: 'Combine multiple PDFs into one', th: 'รวมไฟล์ PDF หลายไฟล์เป็นไฟล์เดียว' } },
      { id: 'pdf-split', emoji: '✂️', available: false, name: { zh: 'PDF 拆分', en: 'Split PDF', th: 'แยก PDF' }, desc: { zh: '按页面拆分 PDF', en: 'Split PDF by pages', th: 'แยก PDF ตามหน้า' } },
      { id: 'pdf-to-image', emoji: '🖼️', available: false, name: { zh: 'PDF 转图片', en: 'PDF to Images', th: 'PDF เป็นรูปภาพ' }, desc: { zh: 'PDF 每页导出为图片', en: 'Export each PDF page as image', th: 'ส่งออกแต่ละหน้า PDF เป็นรูปภาพ' } },
      { id: 'image-to-pdf', emoji: '📑', available: false, name: { zh: '图片转 PDF', en: 'Images to PDF', th: 'รูปภาพเป็น PDF' }, desc: { zh: '多张图片合并为 PDF', en: 'Combine images into PDF', th: 'รวมรูปภาพหลายรูปเป็น PDF' } },
    ],
  },
  {
    id: 'image',
    name: { zh: '图片工具', en: 'Image Tools', th: 'เครื่องมือรูปภาพ' },
    desc: { zh: '图片压缩、格式转换、尺寸调整', en: 'Compress, convert, resize images', th: 'บีบอัด แปลง ปรับขนาดรูปภาพ' },
    color: '#34C759',
    emoji: '🖼️',
    tools: [
      { id: 'image-compress', emoji: '🗜️', available: false, name: { zh: '图片压缩', en: 'Compress Image', th: 'บีบอัดรูปภาพ' }, desc: { zh: '减小图片文件体积', en: 'Reduce image file size', th: 'ลดขนาดไฟล์รูปภาพ' } },
      { id: 'image-convert', emoji: '🔄', available: false, name: { zh: '格式转换', en: 'Format Convert', th: 'แปลงรูปแบบ' }, desc: { zh: 'JPG/PNG/WebP 互转', en: 'Convert between JPG/PNG/WebP', th: 'แปลงระหว่าง JPG/PNG/WebP' } },
      { id: 'image-resize', emoji: '📐', available: false, name: { zh: '尺寸调整', en: 'Resize Image', th: 'ปรับขนาดรูป' }, desc: { zh: '按宽高或百分比调整尺寸', en: 'Resize by dimensions or percentage', th: 'ปรับขนาดตามความกว้างสูงหรือเปอร์เซ็นต์' } },
      { id: 'image-crop', emoji: '✂️', available: false, name: { zh: '图片裁剪', en: 'Crop Image', th: 'ตัดรูปภาพ' }, desc: { zh: '自由裁剪图片区域', en: 'Crop image area freely', th: 'ตัดพื้นที่รูปภาพอย่างอิสระ' } },
    ],
  },
  {
    id: 'text',
    name: { zh: '文本工具', en: 'Text Tools', th: 'เครื่องมือข้อความ' },
    desc: { zh: '字数统计、格式清理、大小写转换', en: 'Word count, format clean, case convert', th: 'นับคำ ทำความสะอาดรูปแบบ แปลงตัวพิมพ์' },
    color: '#007AFF',
    emoji: '📝',
    tools: [
      { id: 'word-count', emoji: '🔢', available: false, name: { zh: '字数统计', en: 'Word Count', th: 'นับคำ' }, desc: { zh: '统计字符数、词数、段落数', en: 'Count characters, words, paragraphs', th: 'นับอักขระ คำ ย่อหน้า' } },
      { id: 'text-diff', emoji: '🔍', available: false, name: { zh: '文本对比', en: 'Text Diff', th: 'เปรียบเทียบข้อความ' }, desc: { zh: '对比两段文本的差异', en: 'Compare differences between two texts', th: 'เปรียบเทียบความแตกต่างระหว่างข้อความสองชุด' } },
      { id: 'case-convert', emoji: 'Aa', available: false, name: { zh: '大小写转换', en: 'Case Convert', th: 'แปลงตัวพิมพ์' }, desc: { zh: '大写、小写、首字母大写', en: 'UPPERCASE, lowercase, Title Case', th: 'ตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวแรกใหญ่' } },
    ],
  },
  {
    id: 'color',
    name: { zh: '设计工具', en: 'Design Tools', th: 'เครื่องมือออกแบบ' },
    desc: { zh: '颜色拾取、渐变生成、二维码', en: 'Color picker, gradient, QR code', th: 'ตัวเลือกสี การไล่สี คิวอาร์โค้ด' },
    color: '#AF52DE',
    emoji: '🎨',
    tools: [
      { id: 'color-picker', emoji: '🎨', available: false, name: { zh: '颜色拾取', en: 'Color Picker', th: 'ตัวเลือกสี' }, desc: { zh: '从图片拾取颜色，HEX/RGB 转换', en: 'Pick colors from image, HEX/RGB convert', th: 'เลือกสีจากรูปภาพ แปลง HEX/RGB' } },
      { id: 'gradient', emoji: '🌈', available: false, name: { zh: '渐变生成', en: 'Gradient Maker', th: 'สร้างการไล่สี' }, desc: { zh: '生成 CSS 渐变代码', en: 'Generate CSS gradient code', th: 'สร้างโค้ดการไล่สี CSS' } },
      { id: 'qrcode', emoji: '📱', available: false, name: { zh: '二维码生成', en: 'QR Code', th: 'สร้างคิวอาร์โค้ด' }, desc: { zh: '文本或链接生成二维码', en: 'Generate QR code from text or link', th: 'สร้างคิวอาร์โค้ดจากข้อความหรือลิงก์' } },
    ],
  },
  {
    id: 'calc',
    name: { zh: '计算工具', en: 'Calculators', th: 'เครื่องคิดเลข' },
    desc: { zh: 'GPA、日期、单位换算', en: 'GPA, date, unit converter', th: 'GPA วันที่ แปลงหน่วย' },
    color: '#FF9500',
    emoji: '🧮',
    tools: [
      { id: 'gpa-calc', emoji: '📊', available: false, name: { zh: 'GPA 计算器', en: 'GPA Calculator', th: 'เครื่องคิดเลข GPA' }, desc: { zh: '按学分和成绩计算 GPA', en: 'Calculate GPA by credits and grades', th: 'คำนวณ GPA จากหน่วยกิตและเกรด' } },
      { id: 'date-calc', emoji: '📅', available: false, name: { zh: '日期计算', en: 'Date Calculator', th: 'คำนวณวันที่' }, desc: { zh: '计算两个日期间隔、加减天数', en: 'Calculate date difference, add/subtract days', th: 'คำนวณช่วงวันที่ บวกลบวัน' } },
      { id: 'unit-convert', emoji: '🔄', available: false, name: { zh: '单位换算', en: 'Unit Converter', th: 'แปลงหน่วย' }, desc: { zh: '长度、重量、温度等单位换算', en: 'Length, weight, temperature converter', th: 'แปลงหน่วยความยาว น้ำหนัก อุณหภูมิ' } },
    ],
  },
]

function handleToolClick(tool) {
  // 工具上线后跳转对应工具页面
  console.log('Tool clicked:', tool.id)
}
</script>

<style scoped>
.tools-hub {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px 60px;
}

.tools-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.tool-category {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 24px;
  transition: border-color 0.2s ease;
}

.tool-category:hover {
  border-color: var(--c-accent-light);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.category-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0 0 2px 0;
}

.category-desc {
  font-size: 13px;
  color: var(--c-text-tertiary);
  margin: 0;
}

.category-count {
  font-size: 12px;
  color: var(--c-text-tertiary);
  background: var(--c-bg-secondary);
  padding: 4px 10px;
  border-radius: 10px;
  flex-shrink: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.tool-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--c-bg-secondary);
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tool-card:hover:not(.tool-card--disabled) {
  border-color: var(--c-accent-light);
  background: var(--c-bg-elevated);
  transform: translateY(-2px);
}

.tool-card--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.tool-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0 0 3px 0;
}

.tool-desc {
  font-size: 12px;
  color: var(--c-text-tertiary);
  margin: 0;
  line-height: 1.4;
}

.tool-status {
  flex-shrink: 0;
}

.status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.status--online {
  background: var(--c-green-light, rgba(52, 199, 89, 0.12));
  color: var(--c-green);
}

.status--soon {
  background: var(--c-orange-light, rgba(255, 149, 0, 0.12));
  color: var(--c-orange);
}

.tools-footer {
  text-align: center;
  margin-top: 40px;
  padding: 20px;
  color: var(--c-text-tertiary);
  font-size: 13px;
}

@media (max-width: 640px) {
  .tools-hub {
    padding: 0 16px 40px;
  }
  .tool-category {
    padding: 18px;
  }
  .tools-grid {
    grid-template-columns: 1fr;
  }
  .category-count {
    display: none;
  }
}
</style>
