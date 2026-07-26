# 架构说明

## 构建链

```text
Markdown / Assets
       ↓
Astro Content Collection
       ↓
Fuwari Layout + Components
       ↓
Astro static build
       ↓
Pagefind indexing
       ↓
dist/
       ├─ GitHub Pages
       └─ Mainland Caddy
```

生产环境只有静态文件，不包含数据库、服务端 API、登录或运行中的 Node 进程。

## 关键入口

- 站点身份与导航：`src/config.ts`
- Astro URL、集成与 Markdown 插件：`astro.config.mjs`
- 文章 schema：`src/content/config.ts`
- 全局元数据：`src/layouts/Layout.astro`
- 项目页：`src/pages/projects.astro`
- 404：`src/pages/404.astro`
- 自定义主题层：`src/styles/site-overrides.css`
- 品牌资源脚本：`scripts/generate-brand-assets.mjs`
- 生产产物检查：`scripts/validate-dist.mjs`

## 上游与本项目定制

Fuwari 的布局、卡片、侧栏、Swup 页面切换、搜索 UI、Markdown 渲染和大部分主题变量保持原结构。本项目主要修改配置、内容、元数据、图片替代文本、质量门禁和部署层。

`src/components/GlobalStyles.astro` 负责按顺序装载上游样式，再装载 `site-overrides.css`。新增视觉规则应优先放在覆盖文件，不复制整份上游 CSS。

## 内容模型

每篇文章是 `src/content/posts/<ascii-slug>/index.md`，同目录可放 `cover.webp` 与 `images/`。`src/content/config.ts` 继续使用 Fuwari 现有 Content Collection API，并增加可选 `imageAlt` 字段；没有图片时组件不渲染空 `<img>`。

生产构建通过 `draft !== true` 排除草稿。`style-sandbox` 仅用于本地视觉回归。

## 部署模型

GitHub Pages 使用官方 Astro Action 构建并上传 `dist/`。大陆服务器方案同样只发布 `dist/`，通过时间戳 release 目录与 `current` 软链接完成原子切换和回滚。

## 未来升级的高风险区域

- Astro Content Collection schema 与图片动态导入
- Svelte 组件 hydration 和 Svelte major 版本
- Swup 页面切换时的 head、事件和滚动状态
- Tailwind 组件层之间的 `@apply`
- Pagefind 输出结构及搜索初始化
- Astro / Svelte / Tailwind 的 major 升级
- 严格 CSP；当前上游包含内联脚本，启用前必须先审计
