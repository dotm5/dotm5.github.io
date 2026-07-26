# Pages CMS 后台与权限边界

## 使用入口

后台使用托管版 [Pages CMS](https://app.pagescms.org/)，不部署在博客域名下，也不会生成公开的 `/admin` 路由。

首次启用需要仓库所有者手动完成一次 GitHub 授权：

1. 登录 Pages CMS。
2. 安装 Pages CMS GitHub App。
3. 在 Repository access 中选择 **Only select repositories**。
4. 只勾选 `dotm5/dotm5.github.io`。
5. 回到 Pages CMS，打开 `dotm5/dotm5.github.io` 的 `main` 分支。

`.pages.yml` 已在仓库中，授权完成后无需再用向导生成配置。

## 可以在 GUI 中做什么

- 新建和编辑 Markdown 文章。
- 在所见即所得与 Markdown 源码模式之间切换。
- 上传 AVIF、GIF、JPEG、PNG、WebP 图片到 `public/uploads/`。
- 修改站点标题、简介、主题色、横幅开关、目录层级。
- 选择内容宽度、卡片圆角和卡片质感预设。

新文章默认 `draft: true`。保存草稿会产生 Git 提交，但生产构建不会把它加入页面、RSS 或搜索；关闭草稿开关后才会发布。

GUI 新文章默认使用平铺的 `yyyy-mm-dd-topic.md` 文件。复杂文章仍可用 `pnpm new-post:dir <slug>` 创建目录式 page bundle；两种形式都由 Astro 支持。Pages CMS 新上传的图片使用 `/uploads/<文件名>`，已有文章中的相对图片继续保留。

## 已实施的安全约束

- CMS 可编辑路径只有 `src/content/posts` 与 `src/data/site.json`。
- CMS 没有 Actions 按钮，不能从界面触发任意工作流。
- 文章和设置禁止重命名、删除；设置文件也禁止创建副本。
- 设置页在 Pages CMS 中隐藏，`.pages.yml` 只能由有 GitHub 仓库权限的用户管理。
- 保存结构化内容时启用 merge，未展示的 frontmatter 不会被意外删除。
- 提交使用 App 身份，不向提交元数据写入编辑者私人邮箱。
- 图片上传扩展名受白名单限制，不允许 SVG、HTML、脚本、压缩包和可执行文件。
- `pnpm verify` 会拒绝危险原始 HTML、脚本 URL、超限文件和被放宽的 CMS 路径/权限。
- GitHub Pages 只允许 `main` 分支部署；部署构建运行完整 `pnpm verify`，失败时保留上一版站点。
- 公开产物验证会确认没有 `/admin` 或 `.pages.yml` 被发布。

为了保留 Pages CMS 的直接保存体验，`main` 当前没有启用“必须经 Pull Request”分支保护。`.github/CODEOWNERS` 会在 Pull Request 中提示所有者审查敏感文件，但在没有分支保护时不是强制权限边界。当前只有 `dotm5` 拥有仓库写权限，因此单人使用可接受；增加任何 GitHub 写入协作者前，应先切换到受保护分支和 PR 发布流程。

## 访客与编辑者权限

| 身份 | 读取公开博客 | 修改文章 | 修改外观 | 修改 CMS 配置或工作流 |
| --- | --- | --- | --- | --- |
| 匿名访客 | 可以 | 不可以 | 只能在本机切换允许的主题偏好 | 不可以 |
| GitHub 仓库所有者 `dotm5` | 可以 | 可以 | 可以 | 可以 |
| Pages CMS 邮箱协作者 | 可以 | 可以 | 可以 | 不可以通过 Pages CMS |

当前 GitHub 仓库只有 `dotm5` 一个管理员，也没有配置 Pages CMS 邮箱协作者。

Pages CMS 的“协作者”应视为**发布者**而不是普通访客：协作者能直接改文章、上传媒体，并能修改本配置暴露的站点外观。Pages CMS 目前没有按集合分配细粒度角色的模型，因此不要邀请不受信任的人；临时投稿更适合使用 GitHub Pull Request。

## 第三方信任边界

托管版 Pages CMS 是第三方服务。其 GitHub App 为完成认证、内容提交、状态与工作流集成，会请求比“只写 Markdown”更宽的仓库权限。仓库级选择能够限制它只接触本博客，但不能把 App 的技术权限进一步缩小到某几个目录。

因此：

- 安装时只授权这一个仓库，不选择 All repositories。
- GitHub 账号开启双因素认证，定期检查已安装 GitHub Apps。
- 不在 Pages CMS 中保存 Token、密钥、内网地址或个人隐私。
- 不添加不受信任的邮箱协作者。
- 如果未来需要多人、分角色或合规审计，改用受保护分支 + PR，或自托管 CMS。

撤销入口：GitHub → Settings → Applications → Installed GitHub Apps → Pages CMS → Uninstall。撤销后博客仍是普通静态站点，现有内容与部署不受影响。

仓库依赖审计仍存在上游构建链高危告警；它们不会进入静态生产服务器，但会影响本地和 GitHub Actions 构建边界。当前 CMS 上传图片放在 `public/uploads`，不会交给 Sharp 转码，并由扩展名、单文件 4 MiB 与目录总量限制保护。完整结果见 [DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md)。

## 本地 GUI 备用方案

VS Code 已推荐 Front Matter CMS 扩展，仓库也保留 `frontmatter.json`。它只操作本地文件，不需要授予第三方 GitHub App 权限；适合离线写作、复杂 Markdown 和提交前预览。
