# 上游基线

## 来源

- 上游项目：[saicaca/fuwari](https://github.com/saicaca/fuwari)
- 采用方式：直接克隆官方模板仓库；未使用 npm 上名称相近但来源不同的第三方脚手架
- 基线提交：`6d39b0dec41282e7852e23e032998a5789abee28`
- 初始化日期：2026-07-26
- 上游许可证：MIT，原始 `LICENSE` 保留在仓库根目录

## 已验证工具

- Windows 11 / PowerShell 7.6.3
- Node.js 24.13.1
- pnpm 9.14.4（遵循 `package.json#packageManager`）
- Astro 5.13.10

## 原始基线结果

`pnpm install --frozen-lockfile` 成功。原始 `pnpm check` 未通过，包含两个上游类型错误：

1. `src/components/Navbar.astro` 中 `LightDarkSwitch` 的 hydration 指令类型不兼容。
2. `src/pages/archive.astro` 传入的 `category: string | null` 与 Svelte 组件声明的 `category?: string` 不一致。

原始 `pnpm build` 也未通过：`src/styles/markdown.css` 使用 `@apply link`，Tailwind 无法从另一个组件层规则展开该自定义类。浏览器预览因此未在原始基线上启动。

本项目在后续定制提交中对上述三处做最小兼容修复，不升级 Astro、Svelte 或 Tailwind 大版本。Node 24 本身可以完成依赖安装和 Astro 内容同步，没有证据表明需要回退 Node 22。

## 升级策略

- 将本仓库视为长期维护的自有派生项目。
- 上游更新先在独立分支中审阅，再按需移植；不直接追随所有依赖更新。
- Astro、Svelte、Tailwind 的 major 升级必须单独评估。
- 自定义站点样式集中在 `src/styles/site-overrides.css`，优先减少未来合并冲突。
- 高风险区域包括内容 schema、图片动态导入、Swup 页面切换、Svelte hydration、Pagefind 构建链和 Tailwind 组件层。
