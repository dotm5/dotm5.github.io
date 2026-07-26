# 图形与创作笔记

一个长期维护的中文个人技术博客，记录 Blender、实时渲染、Shader、Unreal Engine、AI 与个人工具实验。站点基于 Fuwari 与 Astro，构建结果是无需数据库或 Node 服务端的纯静态 `dist/`。

## 技术栈

- Astro 5
- Fuwari 布局与组件体系
- Markdown Content Collections
- Svelte 交互组件
- Pagefind 静态搜索
- Pages CMS 托管写作后台（可选授权）
- pnpm 9
- GitHub Actions / GitHub Pages
- 可选的 Caddy 静态服务器

## 环境要求

- Node.js 24
- Corepack
- Git

仓库的 `packageManager` 字段固定 pnpm 9.14.4，`.nvmrc` 与 `.node-version` 固定 Node 24 主版本。

## 安装与本地开发

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

默认开发地址由 Astro 在终端输出，通常为 `http://localhost:4321/`。

## 新建文章

文章使用目录形式管理：

```bash
corepack pnpm new-post:dir shader-notes
```

命令会创建 `src/content/posts/shader-notes/index.md`、`images/` 目录，并将文章设为草稿。完整规则见 [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)。

原有 `pnpm new-post` 命令仍被保留，但新内容建议使用 `new-post:dir`。

## 图形化后台

仓库已接入 [Pages CMS](https://app.pagescms.org/)：

- 文章可使用所见即所得或 Markdown 源码编辑器。
- 新文章默认草稿，关闭草稿开关后才进入生产站点。
- 站点标题、简介、主题、横幅、目录和安全布局预设可在 GUI 中调整。
- 后台独立于公开博客，不会在站点上增加 `/admin`、登录接口或数据库。

首次使用只需由仓库所有者把 Pages CMS GitHub App 授权给 `dotm5/dotm5.github.io` 这一个仓库。权限模型、第三方信任边界与撤销方法见 [docs/CMS_ADMIN.md](docs/CMS_ADMIN.md)。

## 验证与构建

```bash
corepack pnpm verify
```

该命令依次执行 Astro 检查、只读 lint、生产构建、Pagefind 索引和静态产物验证。单独构建：

```bash
corepack pnpm build
```

输出位于 `dist/`，不提交到 Git。

生产预览启动后，可用 Playwright CLI 复跑响应式、搜索、主题、404 和关键路径检查：

```bash
npx --yes --package @playwright/cli@latest playwright-cli -s=blogqa open http://127.0.0.1:4321/ --browser msedge
npx --yes --package @playwright/cli@latest playwright-cli -s=blogqa run-code --filename scripts/browser-qa.js
```

截图写入已忽略的 `artifacts/qa/`。可按本机情况将 `msedge` 替换为可用浏览器。

## 部署

- GitHub Pages：[docs/DEPLOY_GITHUB_PAGES.md](docs/DEPLOY_GITHUB_PAGES.md)
- 中国大陆静态服务器准备：[docs/DEPLOY_MAINLAND.md](docs/DEPLOY_MAINLAND.md)

GitHub Pages 工作流在 `main` 分支 push 后自动运行。大陆服务器只接收 `dist/`，不需要安装 Node、pnpm 或运行 Astro。

## 主要目录

```text
src/content/posts/       Markdown 文章及其资源
src/pages/               项目页、404 与站点路由
src/styles/              上游样式与集中式主题覆盖
public/branding/         原创占位品牌资源
scripts/                 新文章、品牌资源和产物验证脚本
ops/                     Caddy 与参数化发布模板
docs/                    写作、架构、部署和维护文档
```

## 上游与许可证

代码基于 [saicaca/fuwari](https://github.com/saicaca/fuwari) 的 MIT 许可版本，基线与差异记录见 [docs/UPSTREAM.md](docs/UPSTREAM.md) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。仓库根目录保留原始 `LICENSE`。

文章与原创图片默认保留所有权利，除非具体内容另有说明。
