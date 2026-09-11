# 复旦MBA 薄荷4班 官方主页

基于 VitePress 构建的班级静态网站，部署在 GitHub Pages。

## 功能

- 📅 课表查询
- 📢 公告通知
- 📚 知识库（课程笔记、学习资料）
- 📥 课程资料

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev

# 构建生产版本
npm run docs:build

# 预览构建结果
npm run docs:preview
```

## 部署

推送代码到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

网站地址：https://fudan-mba-mint4.github.io/

## 目录结构

```
docs/
├── .vitepress/
│   └── config.mjs          # VitePress 配置
├── public/
│   └── images/             # 图片资源
├── index.md                 # 首页
├── schedule.md              # 课表
├── announcements/
│   └── index.md             # 公告通知
├── knowledge/
│   └── index.md             # 知识库
└── slides/
    └── index.md             # 课程资料
```

## 维护者

薄荷4班 智库研究员
