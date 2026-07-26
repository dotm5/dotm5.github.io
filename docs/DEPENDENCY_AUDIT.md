# 依赖审计

## 2026-07-26

执行命令：

```bash
corepack pnpm audit --prod
```

上游原始锁文件结果：

- critical：3
- high：82
- moderate：72
- low：15

在不跨越 Astro、Svelte、Tailwind major 的前提下，执行了限定修补：

- Astro `5.13.10` → `5.18.2`
- `@astrojs/rss` `4.0.14` → `4.0.19`
- 将兼容范围内的 `@iconify/tools` 固定为 `4.2.0`
- 将 PostCSS 固定为已修复的 `8.5.18`

修补后结果：

- critical：0
- high：41
- moderate：27
- low：5
- `pnpm audit` 退出码：1（仍有已知告警）

## 风险判断

本项目的生产部署只包含静态 HTML、CSS、JavaScript、图片和 Pagefind 索引；服务器不会安装或运行这些 Node 依赖。`pnpm audit --prod` 仍将 Astro、Vite、图片工具和其他构建工具计入，因为 Fuwari 将构建链放在 `dependencies` 中。

剩余高危项主要位于构建工具的旧传递依赖，部分修复需要突破上游兼容范围，例如 Sharp `0.35`、旧 glob/minimatch 链或更大的框架升级。本站构建只处理仓库内可信内容，不接受用户上传的 CSS、归档或模板，因此多个解析型告警的可利用面受限；但这不等于风险为零。

## 处置

- 已消除全部 critical 项，并通过 frozen install、Astro check、构建和产物验证。
- 未运行 `audit --fix --force`，避免隐式 major 升级。
- Dependabot 每月检查 npm/pnpm 与 Actions 更新，major 单独评估。
- 后续在独立分支评估 Sharp 0.35、Astro 6 及旧 Swup 构建链替换。
- 若未来加入不可信内容上传或服务器端渲染，必须重新评估本报告，不能沿用当前静态站风险判断。
