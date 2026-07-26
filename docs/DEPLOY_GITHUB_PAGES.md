# GitHub Pages 部署

## 当前目标

- GitHub 用户：`dotm5`
- 首选公开仓库：`dotm5.github.io`
- 站点 URL：`https://dotm5.github.io`
- Astro `site`：`https://dotm5.github.io`
- Astro `base`：`/`

## 自动部署

`.github/workflows/deploy.yml` 在 `main` push 后：

1. 使用官方 `withastro/action` 在 Node 24 / pnpm 9.14.4 下运行 `pnpm verify`。
2. 上传经过验证的 `dist/`。
3. 使用官方 `actions/deploy-pages` 发布到 `github-pages` environment。

截至 2026-07-26，工作流使用 GitHub 或 Astro 官方当前稳定 major：

- `actions/checkout@v7`
- `actions/setup-node@v7`
- `pnpm/action-setup@v6`
- `withastro/action@v6`
- `actions/deploy-pages@v5`

## Pages 设置

在仓库中打开：

```text
Repository → Settings → Pages → Build and deployment → Source → GitHub Actions
```

CLI 具备权限时也可通过 API 设置 Actions build source。

## 手动建立远程

仅在仓库不存在时创建：

```bash
gh repo create dotm5/dotm5.github.io --public --source . --remote origin --push
```

如果同名仓库已有未知内容，先停止并检查，禁止 force push 或覆盖。

## 普通项目仓库

如果未来改用 `dotm5.github.io/repository-name/`：

```js
site: "https://dotm5.github.io",
base: "/repository-name",
```

用户站仓库 `dotm5.github.io` 不需要子路径。

## 自定义域名

1. 将 `site` 改为正式域名。
2. 保持 `base: "/"`。
3. 创建真实的 `public/CNAME`。
4. 在 Pages 设置中配置域名和 HTTPS。

占位文件 `public/CNAME.example` 不会影响当前 Pages。
