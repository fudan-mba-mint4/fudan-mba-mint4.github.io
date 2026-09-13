# 复旦MBA 薄荷4班 官方主页

基于 VitePress 构建的班级静态网站，部署在 GitHub Pages。

## 网站地址

https://fudan-mba-mint4.github.io/

## 核心功能

- 📅 **课表查询** — 周视图 / 课程视图 / 月历，下节课提醒，校历查阅
- 📢 **公告通知** — 多语言支持，置顶与分类，重要通知一目了然
- 💰 **班费公开** — 当前余额、收支明细、活动财务详情可追溯
- 🎉 **活动日历** — 倒计时与进行中状态，时间线展示，相册与班费关联
- 🖼️ **活动相册** — 活动封面展示，按月归档，一键跳转图片直播
- 📚 **知识库** — 按学科分类的课程笔记、重点总结、参考资料、校历
- 📥 **课程资料** — 课件、作业、参考资料按课程与讲次整理下载
- 👥 **同学名录** — 小组展示，搜索过滤，花名与传承人致谢
- 📝 **入学测试题库** — 172题完整题库，三语言支持
- 🛠️ **实用小工具** — PDF压缩、图片压缩等日常实用工具集合
- 🌐 **三语言** — 中文 / English / ภาษาไทย 全站支持
- 🌙 **深色模式** — 跟随系统设置，独立配色优化

## 技术栈

- **框架**：VitePress + Vue 3
- **部署**：GitHub Pages（push 到 main 分支自动部署）
- **数据驱动**：JSON 数据文件，内容与展示分离
- **设计风格**：苹果 HIG 设计语言，薄荷绿主题色
- **性能优化**：WebP 图片格式、字体本地化、资源预加载

## 本地开发

```bash
npm install          # 安装依赖
npm run docs:dev     # 启动开发服务器 (localhost:5173)
npm run docs:build   # 构建生产版本
npm run docs:preview # 预览构建结果
```

## 目录结构

```
docs/
├── .vitepress/
│   ├── config.mjs              # VitePress 配置（导航、多语言）
│   └── theme/
│       ├── index.js            # 主题入口
│       ├── Layout.vue          # 全局布局
│       ├── styles/             # 全局样式
│       └── components/         # Vue 组件
├── public/
│   ├── data/                   # JSON 数据文件
│   ├── images/                 # 图片资源
│   ├── fonts/                  # 本地化字体
│   └── files/courses/          # 课件 PDF
├── index.md                    # 首页
├── schedule.md                 # 课表
├── announcements/              # 公告
├── finance/                    # 班费
├── activities/                 # 活动日历
├── gallery/                    # 相册
├── knowledge/                  # 知识库
├── slides/                     # 课程资料
├── directory/                  # 同学名录
├── quiz/                       # 入学测试
├── tools/                      # 实用小工具
├── about/                      # 主理团页面
├── en/                         # 英文页面
└── th/                         # 泰文页面
```

## 维护

班级内容通过内部管理后台更新，代码与结构变更由维护者提交。

---

2026级 复旦MBA 薄荷4班 · "4 the Best, for the Future"
