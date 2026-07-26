# Spring Folio 设计系统

## 视觉方向

站点采用 “Spring Folio / 春日书笺” 配色：米色纸张承载正文，柔和墨色建立层级，玫瑰、叶绿、浅青、日光黄和珊瑚色只承担明确语义。页面不依赖访客自定义 hue，也不使用大面积纯白 SaaS 卡片或全局毛玻璃。

色彩令牌集中在 `src/styles/design-tokens.css`。组件优先使用 `paper-*`、`ink-*`、`line-*` 与语义色；`clay`、`sage`、`ochre` 仅作为旧组件的兼容别名。

浅色 `rose-ink` 从参考值 `#9c4c68` 轻微加深为 `#994862`，使它在 `rose-wash` 上作为小号文字时达到 WCAG AA；品牌实色 `accent-solid` 仍保留 `#9c4c68`。

## 核心令牌

| 角色 | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `paper-canvas` | `#f4eddc` | `#1e191a` | 页面底色 |
| `paper-surface` | `#fffaf0` | `#282123` | 文章与卡片 |
| `paper-raised` | `#fffdf7` | `#30272a` | 浮起区域 |
| `paper-soft` | `#ece2ce` | `#352d2b` | 控件与轻分区 |
| `ink-strong` | `#2f2925` | `#f4ebdd` | 标题 |
| `ink` | `#4a423a` | `#ded3c7` | 正文 |
| `ink-muted` | `#6b625a` | `#b9aca2` | 日期、摘要、元数据 |

## 语义色

| 语义 | Wash | Line | Ink | 用途 |
| --- | --- | --- | --- | --- |
| Rose | `rose-wash` | `rose-line` | `rose-ink` | Blender、艺术、创作与编辑重点 |
| Leaf | `leaf-wash` | `leaf-line` | `leaf-ink` | AI、工具、项目、建议与成功 |
| Sky | `sky-wash` | `sky-line` | `sky-ink` | Shader、Rendering、UE 与信息 |
| Sun | `sun-wash` | `sun-line` | `sun-ink` | Notes、Review、Pending 与警告 |
| Danger | `danger-wash` | `danger-line` | `danger-ink` | 风险与破坏性动作 |

每个语义色都必须同时使用底色、边线或文字/图标中的至少两个通道，不能只靠颜色区分含义。提示框保留图标与文字标签。

## 文章栏目强调色

`src/utils/accent-utils.ts` 是唯一栏目映射入口：

- Blender / Art / 创作 → Rose
- Shader / Rendering / UE → Sky
- AI / Tools / Projects → Leaf
- Notes / Review / Pending → Sun
- 未匹配 → Rose

文章页、文章卡、元数据、前后篇导航和目录通过 `data-accent` 继承同一组 `--accent-wash`、`--accent-line`、`--accent-ink`，不要在组件里复制判断。

## 排版与表面

- 标题使用现代中文衬线体 Noto Serif SC Variable 的 `700–720` 权重；正文与 UI 使用高可读的 Noto Sans SC Variable，不再回退到 `Songti SC`、`STSong` 等旧式系统宋体。
- Noto Serif SC Variable 与 Noto Sans SC Variable `5.3.0` 均通过 Fontsource 的 `unicode-range` 版本自托管在 `src/assets/fonts/`；OFL 许可证分别保留在 `docs/licenses/Noto-Serif-SC-OFL.txt` 与 `docs/licenses/Noto-Sans-SC-OFL.txt`。
- 代码使用 JetBrains Mono；KaTeX 公式保留其自带的 Computer Modern 系列字形，并通过 `--font-math` 提供 Latin Modern / Computer Modern 回退。
- 正文行高为 `1.82`；小号元数据使用 `ink-muted`，不使用低透明度黑白文字。
- 卡片半径控制在 `8–12px`，使用 `1px line-soft` 与纸张阴影。
- 普通卡片不使用 `backdrop-filter`；只有导航栏和浮动面板允许 `12px` 模糊。
- 焦点轮廓使用 `2px focus-ring`；文字选择使用 Rose wash 与强墨色。
- 代码块使用暖炭底，行内代码使用纸张深一级的底色。

## 提示框

提示框使用 `8–12px` 圆角、`1px` 边线和 `4px` 左侧标签：

- Note → Sky
- Tip → Leaf
- Important → Rose
- Warning → Sun
- Caution → Danger

深色模式使用更深的 wash 与更亮的 ink，结构和标签保持不变。

## 品牌资源与验证

品牌 SVG、favicon、OG 图、首篇文章封面和样式沙盒示意图由 `scripts/generate-brand-assets.mjs` 从同一色板生成。更新脚本后执行：

```powershell
npm.cmd run generate:assets
npm.cmd run check:contrast
npm.cmd run verify
```

`src/components/PaletteSwatches.astro` 只在 `draft: true` 的样式沙盒文章中渲染，用于对照纸张、语义色、按钮、标签、提示框、代码和页边批注。
