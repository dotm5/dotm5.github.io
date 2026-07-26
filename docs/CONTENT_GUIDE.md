# 内容写作指南

## 新建文章

slug 只使用小写 ASCII、数字和连字符：

```bash
corepack pnpm new-post:dir eevee-shadow-notes
```

生成结构：

```text
src/content/posts/eevee-shadow-notes/
├─ index.md
└─ images/
```

## Frontmatter

```yaml
---
title: "文章标题"
published: 2026-07-26
updated: 2026-07-26
description: "用于列表、RSS 与 SEO 的准确摘要"
image: "./cover.webp"
imageAlt: "描述画面内容和信息用途，不写“图片”二字"
tags:
  - Blender
  - NPR
category: "Blender"
draft: true
lang: "zh_CN"
---
```

- 新文章默认 `draft: true`。
- 首次发布前检查日期并改为 `draft: false`。
- 只有正文产生实质变化时才增加或更新 `updated`。
- `description` 应能独立说明文章内容，避免堆关键词。

## 分类与标签

首轮分类固定为：

- Blender
- Rendering
- Unreal Engine
- Shader
- AI
- Projects
- Notes

每篇文章选择一个粗粒度分类。更具体的软件、技术和项目名使用 tags；标签保持稳定写法，避免同义词重复。

## 图片

- 封面：16:9，建议 1600 × 900，WebP 或 AVIF。
- 正文图片：长边通常不超过 2400 px，并进行适度压缩。
- 封面放在文章目录；正文图放在 `images/`。
- 使用相对路径，让文章与资源一起移动。
- 每张信息性图片必须提供准确 alt；纯装饰图使用空 alt。
- 原始 4K/8K 图、Blender 工程、模型、视频和大型压缩包不要进入仓库。

示例：

```markdown
![节点编辑器中高亮显示的法线转换节点](./images/normal-transform.webp)
```

## 代码、公式与提示框

代码块必须标明语言：

````markdown
```glsl
vec3 n = normalize(normalWS);
```
````

行内公式使用 `$E = mc^2$`，独立公式使用：

```markdown
$$
L_o = L_e + \int_\Omega f_r L_i \cos\theta\,d\omega
$$
```

提示框：

```markdown
> [!NOTE]
> 补充上下文。

> [!WARNING]
> 写明可能造成错误结论或数据损失的条件。
```

## 引用与外部链接

- 优先链接官方文档、论文、源码或原作者页面。
- 明确区分直接引用与自己的转述。
- 不复制大段受版权保护内容。
- 链接文字应说明目的，不使用大量“点这里”。
- 外部资料可能变化时记录访问日期或适用版本。

## 草稿工作流

1. 用 `new-post:dir` 创建草稿。
2. 本地运行 `pnpm dev` 检查内容。
3. 用 `style-sandbox` 对升级后的复杂样式做回归。
4. 补齐摘要、分类、标签、图片 alt、引用与限制。
5. 改为 `draft: false`。
6. 运行 `corepack pnpm verify`。
7. 只提交文章所需资源，不提交 `dist/` 或 QA 截图。

## 发布前检查表

- [ ] slug 为 ASCII kebab-case
- [ ] 标题、发布日期与摘要准确
- [ ] 分类属于固定集合，标签没有重复变体
- [ ] 事实、观察和个人判断有清楚边界
- [ ] 命令、版本和关键参数足以复现
- [ ] 所有图片有合适 alt，路径在本地构建中有效
- [ ] 代码块有语言标识，公式和表格未撑破移动端
- [ ] 外部引用指向可靠来源
- [ ] 没有账号、Token、私钥、内部地址或个人隐私
- [ ] `pnpm verify` 通过
