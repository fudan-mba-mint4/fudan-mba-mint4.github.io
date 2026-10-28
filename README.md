# 复旦MBA 薄荷4班 官方主页

> 2026 级复旦大学 MBA 薄荷 4 班班级网站 ·「4 the Best, for the Future」
> 前端 VitePress + Vue 3，后端 Cloudflare Pages Functions，数据存 Cloudflare D1，文件存 Cloudflare R2。

## 网站地址

- 正式站：**https://mint4.cn**
- 备用域名：https://mint4.pages.dev
- 文件公开域名：https://files.mint4.cn
- 班委管理后台：https://mint4.cn/admin/ （页面无入口，仅直接访问，需班委账号登录）

## 核心功能

- 🏠 **首页**：Bento 网格、下节课/作业待办、下一场活动、班费、最新公告、未读红点、生日全屏祝贺
- 📅 **活动日历**：月历 / 时间线双视图，含固定活动、星期重复、中外节日（农历/节气），活动报名与名额，ICS 导出、文字计划
- 🙏 **许愿池**：朋友圈式活动需求，发文字 + 最多 3 张图，可实名点赞、评论（反映热度/预估规模），独立页面瀑布流
- 📊 **班级投票**：实名/匿名、多选、图文选项，投票须登录
- 📢 **公告通知**：分类、置顶、重要标记，多语言
- 📚 **课程资料 / 知识库**：课件、作业、参考资料按课程讲次排序，最新在最上；课程笔记
- 💰 **班费公开**：余额、收支明细、活动财务关联
- 🖼️ **活动相册**、🌍 **城市足迹**（IP 点亮，中文城市名）、🌳 **匿名树洞**、👥 **同学名录**
- 🎂 **生日祝贺**：当天寿星全屏烟花（农历/公历自动换算），独立定时 Worker 每天预热
- 📝 **入学测试题库**（172 题）、🛠️ **实用工具**
- 🔐 **实名账户体系**：班委按真名自动授予后台权限（RBAC），所有发布/删除后端留痕
- 🌐 中文 / English / ภาษาไทย 三语；🌙 深色模式（跟随系统）

## 技术栈

- **前端**：VitePress（Markdown 站点）+ Vue 3 单文件组件，苹果 HIG 风格、薄荷绿主题
- **托管**：Cloudflare Pages（连接本仓库 `main` 分支，push 即自动构建部署，约 30–60s）
- **后端**：Cloudflare Pages Functions（Edge 运行时，`functions/` 目录）
- **数据库**：Cloudflare D1（边缘 SQLite，binding `DB`）
- **文件存储**：Cloudflare R2（bucket `mint4-files`，binding `R2`，经 files.mint4.cn 公开）
- **定时任务**：独立 Cloudflare Worker（`cron-worker/`，Pages Functions 不支持 Cron）

## 本地开发

```bash
npm install              # 安装依赖（首次/换机才需要）

# 纯前端开发（无后端）
npm run docs:dev         # http://localhost:5173

# 全栈本地开发（含 Functions + 本地 D1 + 本地 R2，推荐）
npm run docs:build
npx wrangler pages dev docs/.vitepress/dist --port 8888   # http://localhost:8888

npm run docs:build       # 构建到 docs/.vitepress/dist
bash scripts/pre-deploy.sh   # push 前的构建校验
```

> 本地密钥放 `.dev.vars`（已 gitignore）；本地 D1/R2 数据存在 `.wrangler/`（gitignore），不影响线上。
> 数据库表结构见 `scripts/d1-schema.sql`，权威 schema 定义在 `functions/_utils.js`。

## 部署

```bash
git add .
git commit -m "..."
git push origin main     # Cloudflare Pages 自动构建上线 mint4.cn
```

- 访问/上传到 mint4.cn（CF Pages/Functions/R2）**无需 VPN**，国内直连；仅向 GitHub `push` 代码通常需要代理。
- Pages 构建：Framework preset=None，Build=`npm run docs:build`，Output=`docs/.vitepress/dist`；
  D1/R2 绑定由 `wrangler.toml` 声明，无需在面板手配。

## 目录结构

```
class-homepage/
├── docs/                        # ── 前端（VitePress 站点源码）──
│   ├── .vitepress/
│   │   ├── config.mjs           # 站点/导航/多语言（zh/en/th）配置
│   │   └── theme/
│   │       ├── index.js         # 主题入口
│   │       ├── Layout.vue       # 全局布局（导航/页脚/底部 Tab）
│   │       ├── components/      # 各页面对应的 Vue 组件（命名即页面，见下）
│   │       ├── composables/     # 组合式逻辑（核心，见下）
│   │       ├── styles/          # 全局样式、变量、动画
│   │       └── utils/           # dateUtils、fetchWithRetry
│   ├── public/
│   │   ├── data/                # 静态降级 JSON（DB 不可用时兜底，内容与 D1 对齐）
│   │   ├── images/ fonts/       # 静态图片、本地字体（含泰文）
│   │   └── favicon.png 等
│   ├── index.md                 # 首页
│   ├── activities/  wishes/     # 活动日历、许愿池
│   ├── announcements/ polls/    # 公告、投票
│   ├── finance/ knowledge/ slides/ gallery/ treehole/ city-footprint/
│   ├── directory/ career/ quiz/ tools/ admin/ auth/ about/ governance/
│   ├── schedule.md              # 课表
│   ├── en/  th/                 # 英文、泰文镜像页面（同构）
│
├── functions/                   # ── 后端（Cloudflare Pages Functions）──
│   ├── _d1.js                   # D1 适配层：neon 风格 sql`` 模板 → prepare/bind
│   ├── _utils.js                # 公共：DB schema、鉴权、RBAC 角色、logHistory、R2
│   ├── _roster.js               # 班级名录（注册白名单、真名唯一校验、班主任/传承人只读判定）
│   ├── _coins.js                # 薄荷币：配置、生长阶段（200 开花/500 结果）、森林
│   ├── _cache.js                # 公开接口边缘缓存（Cache API）+ 写后失效
│   ├── _birthday.js  _lunar.js  # 生日计算、农历（lunar-javascript）
│   └── api/
│       ├── auth/[[route]].js    # 注册/登录/资料
│       ├── activities-db/、activities/[id]/[action].js   # 活动列表、报名/取消
│       ├── wishes/              # 许愿池：发布/点赞/评论/删除/游标分页
│       ├── upload/              # 全体登录用户图片上传（许愿池）
│       ├── announcements/ polls/ polls-admin/  finance-db/
│       ├── knowledge-db/ course-materials-db/  treehole/
│       ├── city-footprint/ notifications/ birthday/  db-health/
│       └── admin/               # 班委后台：各模块写操作、上传、历史撤回、知识库
│
├── cron-worker/                 # ── 生日预热定时 Worker（独立部署）──
│   ├── src/index.js             # 每天 00:10（北京）计算寿星写入 birthday_today
│   └── wrangler.toml
│
├── scripts/
│   ├── d1-schema.sql            # D1 表结构（初始化用，入 git）
│   ├── d1-data.sql              # 数据导出（含密码哈希，仅本地，gitignore）
│   ├── optimize-images.mjs      # 图片压缩（sharp）
│   └── pre-deploy.sh            # push 前构建校验
│
├── wrangler.toml                # Pages 构建输出目录 + D1/R2 绑定声明
├── package.json / package-lock.json
├── .gitignore
├── 班委协作手册.md / .pdf        # 班委协作规范（入 git，随仓库分发）
├── README.md                    # 本文件
│
└── （以下仅本地，均 gitignore，不进仓库）
    ├── PROJECT_MEMORY.md        # 项目记忆中枢：架构/规范/凭据位置/决策记录/排障
    ├── .dev.vars                # 本地环境变量（ADMIN_TOKEN、R2_PUBLIC_DOMAIN、CITY_TRACK）
    ├── local-docs/              # 本地运维文档（部署拓扑、班委网站操作指引）
    ├── .local-backups/          # 数据迁移 SQL、本地演示种子
    └── .wrangler/ node_modules/ # 本地运行状态、依赖
```

### `theme/composables/` 组合式逻辑（核心）

| 文件 | 作用 |
|---|---|
| `useAuth.js` | 注册/登录/登录态（localStorage 持久化，token 同步恢复） |
| `useData.js` | 统一数据访问：DB 优先 + 静态降级 + 缓存，`invalidateResource()` 写入后全局自动刷新 |
| `resourceRegistry.js` | 6 类资源清单、读取端点、静态降级、模块依赖图 |
| `useActivities.js` | 活动统一选择器，自动派生 hasMedia / involvesFinance |
| `useUnread.js` | 首页快速入口未读红点（已见条目集合，进入模块即清零） |
| `useLang.js` | 三语言切换；`useNow.js` 实时时钟；`useScrollReveal.js` 滚动显现；`apiConfig.js` API 基址 |

## 维护

- 日常内容（公告/活动/投票/班费/课件/知识库/相册/树洞）由班委登录 `/admin/` 发布，直接写 D1/R2，**不产生 git commit**。
- 代码与页面结构改动由维护者在本地完成、验证后 `git push`。
- 详细架构、数据模型、角色权限、决策记录与排障手册见本地 `PROJECT_MEMORY.md`（不入库）。

---

2026 级 复旦 MBA 薄荷 4 班 · 维护者：雷振宇（副班级主理人）
