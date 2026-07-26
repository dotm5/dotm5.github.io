---
title: "中文长文视觉回归沙盒"
published: 2026-07-26
updated: 2026-07-26
description: "仅用于本地检查标题、表格、代码、公式、提示框和图片的草稿文章。"
image: ""
imageAlt: ""
tags:
  - Visual QA
  - Markdown
category: "Notes"
draft: true
lang: "zh_CN"
---

这篇文章是 `draft: true` 的本地样式沙盒，不应出现在生产构建中。它覆盖常见中文技术文章需要的排版元素，方便升级主题或依赖后进行视觉回归。

## 二级标题与长中文段落

中文正文需要在桌面和移动端都保持稳定的行高与可读字号。测试段落会包含较长的复合句、英文术语、版本号和路径，例如 `src/content/posts/example/index.md`，同时也包含一个很长的链接以检查自动换行：https://example.com/a/very/long/path/that/should/not/create-horizontal-overflow/on/mobile-devices

### 三级标题

1. 有序列表第一项
2. 有序列表第二项
3. 含有 **粗体**、*斜体* 和 `inline code` 的项目

- 无序列表
- [外部链接](https://astro.build/)
- 相对图片与替代文本

![由节点、轨道和网格组成的抽象流程示意图](./images/diagram.webp)

## 表格

| 项目 | 条件 | 结果 | 备注 |
| --- | --- | --- | --- |
| 桌面正文 | 1440 × 900 | 待检查 | 内容宽度与目录 |
| 平板正文 | 768 × 1024 | 待检查 | 导航与表格 |
| 手机正文 | 390 × 844 | 待检查 | 字号与横向溢出 |

## 代码块

```ts title="verify.ts"
type ValidationResult = {
  ok: boolean;
  details: string[];
};

export function verifySite(files: string[]): ValidationResult {
  return {
    ok: files.length > 0,
    details: files.map((file) => `checked: ${file}`),
  };
}
```

```powershell title="本地验证"
corepack pnpm install --frozen-lockfile
corepack pnpm verify
```

## 数学公式

行内公式用于检查基线位置：$L_o = L_e + \int_\Omega f_r L_i \cos\theta\,d\omega$。

$$
\operatorname{softmax}(x_i)=\frac{e^{x_i}}{\sum_j e^{x_j}}
$$

## 提示框

> [!NOTE]
> 这是普通说明，用于补充上下文。

> [!TIP]
> 小范围、可重复的验证通常比一次性的大改更容易定位问题。

:::important[创作]
玫瑰色强调只用于创作重点与编辑批注，不承担普通正文信息。
:::

> [!WARNING]
> 升级 Astro、Svelte 或 Tailwind 的 major 版本前，需要单独建立验证分支。

:::caution[风险]
删除内容、覆盖资源或重写历史前，必须先确认目标与可恢复路径。
:::

## 引用

> 保留假设、限制和失败路径，是让技术记录在未来仍然有用的重要条件。

沙盒末尾再放置一段较长中文，用于检查段落间距、标点挤压、英文与中文混排以及深浅主题对比度。页面在窄屏中不应出现横向滚动；代码块和表格可以在自身容器中横向滚动，但不应撑开整个布局。
