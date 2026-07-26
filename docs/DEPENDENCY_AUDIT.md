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

## Pages CMS 接入复核

同日接入 Pages CMS 后重新执行：

```bash
corepack pnpm audit --prod
```

结果为 critical 0、high 41、moderate 26、low 5。新增的直接依赖 `yaml@2.8.2` 未增加 high 或 critical 告警；高危项仍来自 Astro/Vite/Sharp、旧 Swup 构建链及其传递依赖。

CMS 没有改变生产形态：访客仍只访问静态文件。新上传图片固定写入 `public/uploads` 并按静态资源原样发布，不经过 Sharp 转码；提交前验证会拒绝非图片扩展、单文件超过 4 MiB、目录总量超限、危险原始 HTML 和脚本 URL。Pages CMS 邮箱协作者必须视为可信发布者，不能当作不受信任的访客上传入口。

GitHub 的 Dependabot 月度版本更新配置存在，但仓库级 Vulnerability alerts / Dependabot security updates 当前未启用。是否开启属于仓库管理策略变更，本次只记录状态，没有代替所有者修改。
