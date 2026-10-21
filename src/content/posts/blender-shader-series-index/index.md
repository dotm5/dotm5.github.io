---
title: "Blender Shader 系列总目录"
published: 2026-08-03
description: "把 Blender shader 项目会话中的图形学与工程方法拆成可独立阅读的文章，并预先标注主题、难度、证据边界与配图状态。"
tags:
  - Blender
  - Shader
  - NPR
  - Rendering
  - Notes
category: "Notes"
draft: false
lang: "zh_CN"
---

这是一组从 Blender shader 项目会话中整理出来的公开技术稿。它们讨论的是可迁移的图形学思路：如何读一帧渲染、如何设计角色材质、如何把行为映射到 Eevee、如何验证视觉结果。

文章不复述目标程序的内部定位信息，也不把分析中的内部身份、指令、寄存器、偏移、哈希或资源路径写进正文。这里的“重建”指语义与行为重建，即恢复可见行为，而非声称恢复原始着色器源码。

## 文章地图

| 文章 | 主题 | 难度 | 适合读者 | 配图状态 |
| --- | --- | --- | --- | --- |
| [从一帧画面到材质行为](/posts/from-frame-to-behavior/) | 证据链与分析方法 | 中 | 想建立分析框架的人 | 架构图、材质图、结果预览 |
| [GBuffer 不是最终颜色](/posts/gbuffer-as-contract/) | 延迟渲染与数据合同 | 中高 | 图形程序员、技术美术 | 载荷预览、模块图 |
| [Face SDF 与 Ramp](/posts/face-sdf-and-ramp/) | 面部风格化明暗 | 中 | Blender 材质作者 | SDF、Ramp、结果预览 |
| [Eye Shading Stack](/posts/eye-shading-stack/) | 眼睛独立材质与视差 | 中 | 角色技术美术 | 眼睛贴图、遮罩 |
| [Hair Directional Highlights](/posts/hair-directional-highlights/) | 头发方向场与带状高光 | 中高 | NPR/角色 Shader 作者 | 方向场、高光遮罩 |
| [Cloth FX Layers](/posts/cloth-fx-layers/) | 布料的多层材质职责 | 中 | 材质与效果作者 | Flowmap、Matcap、结果 |
| [Outline as Geometry](/posts/outline-as-geometry/) | 几何描边与屏幕空间互补 | 中 | Blender/实时渲染作者 | 描边预览、几何架构 |
| [NPR to Eevee Architecture](/posts/npr-to-eevee-architecture/) | Profile 化迁移与模块边界 | 中高 | 做跨项目工具的人 | 节点/模块连接图 |
| [Strict Fallback](/posts/strict-fallback/) | 证据不足时的保守重建 | 中 | 研究型工作流使用者 | 证据等级图 |
| [Fixed-Condition Validation](/posts/fixed-condition-validation/) | 固定条件 A/B 验收 | 中 | 需要稳定迭代的人 | 验证架构、结果预览 |

## 推荐阅读顺序

先读[从一帧画面到材质行为](/posts/from-frame-to-behavior/)，建立事实、推断、候选与未知的分层；接着读 [GBuffer](/posts/gbuffer-as-contract/)、[Face](/posts/face-sdf-and-ramp/)、[Eye](/posts/eye-shading-stack/)、[Hair](/posts/hair-directional-highlights/) 和 [Cloth](/posts/cloth-fx-layers/)，理解角色材质如何拆职责；再读[描边](/posts/outline-as-geometry/)与 [Eevee 架构](/posts/npr-to-eevee-architecture/)，把这些职责放回 Blender 的材质、几何节点与合成器；最后用 [Strict Fallback](/posts/strict-fallback/) 和 [Fixed-Condition Validation](/posts/fixed-condition-validation/) 约束结论。

## 标签约定

- Blender：使用 Blender 或 Eevee 的实现。
- Shader：涉及材质输入、光照模型或通道语义。
- NPR：非写实、Toon、Ramp、风格化高光与轮廓。
- Evidence：强调证据等级和可复核过程。
- Validation：强调固定条件、A/B、差分或回滚。
- Geometry Nodes：涉及反壳、局部几何层或持久网格属性。

## 配图说明

新稿优先使用会话中已经生成的材质预览和模块示意图。带有内部身份信息的旧图不直接作为公开插图；后续如需展示更具体的帧阶段，另做一套只保留“输入—处理—输出”关系的通用图。

## 当前配图缺口

现有配图已用于第一版发布，以下位置仍适合后续补一套完全通用的示意图：

- Face：一张不带项目标识的“头部空间 → SDF → Ramp → Face Mask”流程图；
- Hair：一张“区域 × 方向 × 响应”的三段式高光图；
- Cloth：一张基础层、区域层、视角层、Flowmap 和 FX 的分层图；
- Outline：一张反壳轮廓与屏幕空间边缘的并排对照；
- Validation：一张固定相机/灯光下的 Baseline、A/B、差分接触表。

本目录与以上 10 篇文章已于 2026 年 10 月 20 日发布。当前文章中的原始纹理预览用于帮助理解材质形态；通用流程图、Blender 版本说明与可运行示例将在后续更新中补充。
