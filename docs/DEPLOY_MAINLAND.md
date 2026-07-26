# 中国大陆静态服务器迁移

## 前提

在把正式域名解析到中国大陆 Web 服务之前，先完成域名实名认证和适用的 ICP 备案。不要在备案完成前把未备案域名接入大陆服务器，也不要填写虚构备案号。

## 部署模型

```text
pnpm verify / pnpm build
          ↓
        dist/
          ↓
  /srv/blog/releases/<timestamp>
          ↓
  /srv/blog/current 软链接
          ↓
       Caddy
```

服务器只需要 Caddy、SSH 与静态文件目录，不需要 Node、pnpm 或 Astro。

## 上线前配置

1. 将 `astro.config.mjs` 的 `site` 改为正式 HTTPS 域名。
2. 保持 `base: "/"`。
3. 根据真实域名修改 `ops/caddy/Caddyfile.example`。
4. 在服务器创建发布根目录并保证部署用户可写。
5. 检查 80/443、防火墙、DNS 与 Caddy 自动证书条件。

如果 GitHub Pages 保留为镜像，使用不同子域名；不要让同一域名同时指向两个部署目标。

## Caddy

模板：`ops/caddy/Caddyfile.example`。

它包含：

- `/srv/blog/current` 静态根目录
- zstd / gzip
- 目录索引与自定义 404
- `_astro` 与 Pagefind 长缓存
- HTML/其他文件短缓存
- `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`

严格 CSP 暂未启用，因为 Fuwari 使用内联脚本；应在后续独立审计后再加入。

## 参数化发布

PowerShell 默认只做 dry run：

```powershell
$env:SERVER_HOST = "server.example"
$env:SERVER_USER = "deploy"
$env:SERVER_PATH = "/srv/blog"
pwsh -File .\ops\deploy\deploy-mainland.ps1
```

确认计划后显式执行：

```powershell
pwsh -File .\ops\deploy\deploy-mainland.ps1 -Execute
```

Linux/macOS：

```bash
SERVER_HOST=server.example \
SERVER_USER=deploy \
SERVER_PATH=/srv/blog \
bash ops/deploy/deploy-mainland.sh

bash ops/deploy/deploy-mainland.sh \
  --host server.example \
  --user deploy \
  --path /srv/blog \
  --execute
```

脚本会先运行 `pnpm verify`，上传到时间戳 release，确认 `index.html` 与 `404.html` 后切换 `current`，默认保留最近 5 个 release。

## 验证

发布后检查：

```bash
curl -I https://blog.example.com/
curl -I https://blog.example.com/archive/
curl -I https://blog.example.com/projects/
curl -I https://blog.example.com/rss.xml
curl -I https://blog.example.com/pagefind/pagefind.js
```

同时在手机和桌面检查主题切换、搜索、文章页和 404。

## 回滚

列出 release：

```bash
ls -1dt /srv/blog/releases/*
```

将 `current` 指向上一版本：

```bash
ln -sfn /srv/blog/releases/<previous-timestamp> /srv/blog/current
```

切换软链接后无需重启 Caddy。删除旧 release 前先确认 `current` 的真实目标。

## 备案号预留

页脚未来可增加 ICP / 公安备案链接，但只有获得真实编号后才能填写。当前代码不显示占位号码。
