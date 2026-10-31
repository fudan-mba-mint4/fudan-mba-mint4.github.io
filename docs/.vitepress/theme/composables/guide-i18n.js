/**
 * 使用指南中心 · 共享词条（蓝图 §5.19）
 * 全部指南组件公共文案集中在此维护，zh / en / th 三语逐键齐备；
 * 组件在 useLang(guideI18n) 之上叠加自身 dict，禁止在组件内散落复制公共文案。
 * 人名 / 编号 / 金额 / 阈值 / 路由不译（02 §5.4、03 §7.1）。
 */

/** 当前语言对应的站内链接前缀（zh 无前缀） */
export function guidePrefix(lang) {
  return lang === 'zh' ? '' : `/${lang}`
}

/**
 * 五主题固定顺序（蓝图 §2.1）：finance → mint-coins → community → study → people
 * 供 GuideCards / GuideTopicRail / GuideDocFooter / GuideRelatedLinks 复用，避免三份重复数据。
 */
export const guideTopicOrder = ['finance', 'mint-coins', 'community', 'study', 'people']

export const guideI18n = {
  zh: {
    backToIndex: '返回指南中心',
    breadcrumbHome: '指南中心',
    onThisPage: '本页目录',
    prev: '上一篇',
    next: '下一篇',
    relatedTopics: '相关主题',
    lastUpdated: '最后更新',
    maintainedBy: '本指南由雷振宇维护，功能变更时会及时更新，请以网站实际为准。',
    openInPage: '打开页面',
    empty: '暂无',
    screenshotPlaceholder: '界面截图位置，将随版本更新补充',
    viewOnlyNote: '班主任与传承人仅可查看，不可参与投票、申报、报名、报销等互动。',
    loginRequired: '此功能需要先注册并登录。',

    feedback: {
      question: '本页对您有帮助吗？',
      yes: '有帮助',
      no: '没帮助',
      reasonsYes: ['讲得清楚', '步骤好懂', '截图 / 示例有用'],
      reasonsNo: ['和实际页面不符', '步骤不全', '太难懂'],
      notePlaceholder: '补充说明（可选）',
      submit: '提交反馈',
      thanks: '感谢反馈！',
      contact: '仍有疑问？联系班委补充',
      note: '反馈仅用于改进本指南，不会公开您的身份。',
    },

    callout: {
      prerequisite: '使用前提',
      permission: '权限说明',
      admin: '班委 / 审批人视角',
      tip: '小提示',
      note: '备忘',
      warning: '请注意',
      info: '补充说明',
    },

    role: {
      student: '同学',
      admin: '班委',
      auditor: '审批人',
      viewer: '仅可查看',
    },

    state: {
      done: '已完成',
      current: '当前步骤',
      todo: '待办理',
    },

    faqTitle: '常见问题',

    emptyState: {
      empty: '暂无',
      disabledTitle: '该入口暂未开放',
      disabledDesc: '功能正在等待班级讨论拍板，开放后将在此更新。',
      plannedTitle: '规划中',
      plannedDesc: '该工具尚未上线，敬请期待。',
      searchEmptyTitle: '找不到相关结果',
      backHome: '返回指南中心',
    },

    search: {
      placeholder: '搜索指南主题…',
      emptyTitle: '找不到相关指南',
      emptyDesc: '换个关键词试试，或联系班委补充。',
      contact: '联系班委',
      clear: '清除搜索',
    },

    aria: {
      topicNav: '指南主题目录',
      breadcrumb: '面包屑',
      toc: '本页目录',
      search: '搜索指南主题',
    },

    topics: {
      finance: {
        title: '班费财务',
        desc: '预算公示、投票、报销、账页查询',
      },
      'mint-coins': {
        title: '薄荷币',
        desc: '个人钱包、申报、公开榜与森林',
      },
      community: {
        title: '班级互动',
        desc: '公告、活动报名、投票、许愿池、树洞、相册',
      },
      study: {
        title: '学习资料',
        desc: '课表、课件、知识库、入学测验',
      },
      people: {
        title: '同学与治理',
        desc: '名录、职业发展、足迹、工具箱、班委制度、账号',
      },
    },
  },

  en: {
    backToIndex: 'Back to guide home',
    breadcrumbHome: 'Guide Center',
    onThisPage: 'On this page',
    prev: 'Previous',
    next: 'Next',
    relatedTopics: 'Related topics',
    lastUpdated: 'Last updated',
    maintainedBy: 'This guide is maintained by Lei Zhenyu and updated whenever features change; the live site prevails.',
    openInPage: 'Open page',
    empty: 'None yet',
    screenshotPlaceholder: 'Screenshot will be added with a future release',
    viewOnlyNote: 'The head teacher and mentors are view-only and cannot vote, claim coins, register for activities, or submit reimbursements.',
    loginRequired: 'Please register and sign in first to use this feature.',

    feedback: {
      question: 'Was this page helpful?',
      yes: 'Yes',
      no: 'No',
      reasonsYes: ['Clear explanation', 'Easy steps', 'Screenshots / examples help'],
      reasonsNo: ['Does not match the live page', 'Steps are incomplete', 'Hard to follow'],
      notePlaceholder: 'Additional note (optional)',
      submit: 'Submit feedback',
      thanks: 'Thank you for your feedback!',
      contact: 'Still have questions? Contact a committee member for help.',
      note: 'Feedback is only used to improve this guide; your identity will not be disclosed.',
    },

    callout: {
      prerequisite: 'Before you start',
      permission: 'Permission note',
      admin: 'Committee / approver view',
      tip: 'Tip',
      note: 'Note',
      warning: 'Please note',
      info: 'Additional context',
    },

    role: {
      student: 'Classmate',
      admin: 'Committee',
      auditor: 'Approver',
      viewer: 'View only',
    },

    state: {
      done: 'Done',
      current: 'Current step',
      todo: 'Pending',
    },

    faqTitle: 'Frequently asked questions',

    emptyState: {
      empty: 'None yet',
      disabledTitle: 'This entry is not open yet',
      disabledDesc: 'The feature awaits a class decision; it will appear here once opened.',
      plannedTitle: 'Planned',
      plannedDesc: 'This tool has not launched yet. Stay tuned.',
      searchEmptyTitle: 'No results found',
      backHome: 'Back to guide home',
    },

    search: {
      placeholder: 'Search guide topics…',
      emptyTitle: 'No guide found',
      emptyDesc: 'Try another keyword, or contact a committee member.',
      contact: 'Contact committee',
      clear: 'Clear search',
    },

    aria: {
      topicNav: 'Guide topic navigation',
      breadcrumb: 'Breadcrumb',
      toc: 'On this page',
      search: 'Search guide topics',
    },

    topics: {
      finance: {
        title: 'Finance',
        desc: 'Public budget proposals, voting, reimbursement, ledger',
      },
      'mint-coins': {
        title: 'Mint Coins',
        desc: 'Personal wallet, claims, public leaderboard and forest',
      },
      community: {
        title: 'Community',
        desc: 'Announcements, activities, polls, wish wall, tree hole, gallery',
      },
      study: {
        title: 'Study',
        desc: 'Schedule, course materials, knowledge base, entry quiz',
      },
      people: {
        title: 'Classmates & Governance',
        desc: 'Directory, career development, footprint, tools, committee roles, accounts',
      },
    },
  },

  th: {
    backToIndex: 'กลับไปหน้าคู่มือ',
    breadcrumbHome: 'ศูนย์คู่มือ',
    onThisPage: 'ในหน้านี้',
    prev: 'หน้าก่อน',
    next: 'หน้าถัดไป',
    relatedTopics: 'หัวข้อที่เกี่ยวข้อง',
    lastUpdated: 'อัปเดตล่าสุด',
    maintainedBy: 'คู่มือนี้ดูแลโดย Lei Zhenyu และจะอัปเดตทุกครั้งที่ฟีเจอร์เปลี่ยนแปลง พร้อมใช้งานตามเว็บไซต์จริง',
    openInPage: 'เปิดหน้า',
    empty: 'ยังไม่มี',
    screenshotPlaceholder: 'จะเพิ่มภาพหน้าจอในการอัปเดตครั้งต่อไป',
    viewOnlyNote: 'ครูประจำชั้นและที่ปรึกษาเข้าชมได้อย่างเดียว ไม่สามารถโหวต ขอเหรียญ ลงทะเบียนกิจกรรม หรือเบิกจ่ายได้',
    loginRequired: 'ฟีเจอร์นี้ต้องลงทะเบียนและเข้าสู่ระบบก่อน',

    feedback: {
      question: 'หน้านี้มีประโยชน์กับคุณไหม?',
      yes: 'มีประโยชน์',
      no: 'ไม่มีประโยชน์',
      reasonsYes: ['อธิบายชัดเจน', 'ขั้นตอนเข้าใจง่าย', 'ภาพ / ตัวอย่างมีประโยชน์'],
      reasonsNo: ['ไม่ตรงกับหน้าจริง', 'ขั้นตอนไม่ครบ', 'เข้าใจยาก'],
      notePlaceholder: 'ข้อความเพิ่มเติม (ไม่บังคับ)',
      submit: 'ส่งความคิดเห็น',
      thanks: 'ขอบคุณสำหรับความคิดเห็น!',
      contact: 'ยังมีข้อสงสัย? ติดต่อคณะกรรมการเพื่อขอคำแนะนำ',
      note: 'ความคิดเห็นใช้ปรับปรุงคู่มือเท่านั้น จะไม่เปิดเผยตัวตนของคุณ',
    },

    callout: {
      prerequisite: 'ก่อนเริ่มต้น',
      permission: 'ข้อกำหนดสิทธิ์',
      admin: 'มุมมองคณะกรรมการ / ผู้อนุมัติ',
      tip: 'เคล็ดลับ',
      note: 'บันทึก',
      warning: 'โปรดทราบ',
      info: 'คำอธิบายเพิ่มเติม',
    },

    role: {
      student: 'เพื่อนร่วมชั้น',
      admin: 'คณะกรรมการ',
      auditor: 'ผู้อนุมัติ',
      viewer: 'เข้าชมอย่างเดียว',
    },

    state: {
      done: 'เสร็จสิ้น',
      current: 'ขั้นตอนปัจจุบัน',
      todo: 'รอดำเนินการ',
    },

    faqTitle: 'คำถามที่พบบ่อย',

    emptyState: {
      empty: 'ยังไม่มี',
      disabledTitle: 'ช่องทางนี้ยังไม่เปิดใช้งาน',
      disabledDesc: 'ฟีเจอร์รอการตัดสินใจของชั้นเรียน จะแสดงตรงนี้เมื่อเปิดใช้งาน',
      plannedTitle: 'อยู่ในแผน',
      plannedDesc: 'เครื่องมือนี้ยังไม่เปิดให้ใช้งาน โปรดติดตาม',
      searchEmptyTitle: 'ไม่พบผลลัพธ์',
      backHome: 'กลับไปหน้าคู่มือ',
    },

    search: {
      placeholder: 'ค้นหาหัวข้อคู่มือ…',
      emptyTitle: 'ไม่พบคู่มือ',
      emptyDesc: 'ลองคำอื่น หรือติดต่อคณะกรรมการ',
      contact: 'ติดต่อคณะกรรมการ',
      clear: 'ล้างการค้นหา',
    },

    aria: {
      topicNav: 'เมนูนำทางหัวข้อคู่มือ',
      breadcrumb: 'เส้นทางหน้า',
      toc: 'สารบัญในหน้านี้',
      search: 'ค้นหาหัวข้อคู่มือ',
    },

    topics: {
      finance: {
        title: 'การเงิน',
        desc: 'การเผยแพร่งบประมาณ โหวต เบิกจ่าย ดูบัญชี',
      },
      'mint-coins': {
        title: 'เหรียญมินต์',
        desc: 'กระเป๋าส่วนตัว ยื่นคำขอ อันดับสาธารณะและป่า',
      },
      community: {
        title: 'ปฏิสัมพันธ์ในชั้นเรียน',
        desc: 'ประกาศ กิจกรรม โหวต กระดานคำขอ กระบอกไม้ไผ่ อัลบั้ม',
      },
      study: {
        title: 'การเรียนรู้',
        desc: 'ตารางเรียน เอกสารรายวิชา คลังความรู้ ข้อสอบเข้า',
      },
      people: {
        title: 'เพื่อนร่วมชั้นและการปกครอง',
        desc: 'รายชื่อ พัฒนาอาชีพ ร่องรอยเมือง เครื่องมือ บทบาทคณะกรรมการ บัญชีผู้ใช้',
      },
    },
  },
}

/** 五主题图标（本期沿用 emoji，02 §3.5-20） */
export const guideTopicIcons = {
  finance: '💰',
  'mint-coins': '🪙',
  community: '🎉',
  study: '📚',
  people: '👥',
}
