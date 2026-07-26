# 个性化待办

当前公开安全配置：

- 站点标题：图形与创作笔记
- 副标题：Blender · Rendering · Shader · AI
- 作者显示名：Tao
- GitHub：https://github.com/dotm5
- 临时站点 URL：https://dotm5.github.io
- 默认时区：Asia/Singapore

以下项目需要由站点所有者最终决定：

1. 是否替换作者显示名、简介、头像和横幅。
2. 文章是否继续默认“保留所有权利”，或采用单独的内容许可证。
3. 正式域名及其备案后的部署位置。
4. ICP / 公安备案完成后，页脚要展示的真实备案号。

修改身份时优先编辑 `src/config.ts`，然后重新运行：

```bash
corepack pnpm generate:assets
corepack pnpm verify
```

如果启用自定义域名：

1. 把 `astro.config.mjs` 的 `site` 改成正式 HTTPS URL。
2. 用户站或独立服务器保持 `base: "/"`。
3. 将 `public/CNAME.example` 复制为 `public/CNAME` 并写入真实域名。
4. 不要提交占位域名作为有效 `CNAME`。
