---
title: "UE4SS 看对象，RenderDoc 看像素"
published: 2026-08-17
updated: 2026-08-17
description: "UE4SS、USMAP、FModel 与 RenderDoc 分别看见什么，以及如何把运行时对象、离线资产和一帧渲染连接起来。"
image: ""
imageAlt: ""
coverPreset: "default"
banner: ""
bannerPosition: "center"
tags:
  - UE4SS
  - RenderDoc
  - Unreal Engine
  - USMAP
category: "Notes"
draft: true
lang: "zh_CN"
---

UE4SS 解释进程里的对象世界，RenderDoc 记录 GPU 实际执行的一帧。前者能列出类、对象、属性和引用，后者能展开 Draw、Shader、绑定资源与渲染目标。当前构建的 USMAP 和离线资产解析把这两个世界连接起来，也限定了每种工具能够支持的结论。

本系列包括三篇专题文章：

1. [只导出需要的类](/posts/ue4ss-selective-usmap-practice/)
2. [RenderDoc 显示 API: None](/posts/renderdoc-api-none/)
3. [魔改 RenderDoc 的第一课](/posts/renderdox-runtime-contract/)

## 对象、包体与 GPU 执行的分工

| 问题 | 主要工具 | 可以直接看到 | 仍需其他证据 |
| --- | --- | --- | --- |
| 当前进程里有哪些类、对象和属性 | UE4SS | 已加载对象、反射关系和当前可见字段 | 某个字段是否影响这一帧像素 |
| 未版本化属性怎样被离线解析 | USMAP + CUE4Parse/FModel | 包体字段布局和对象引用 | 原始 C++ 业务逻辑或 GPU 数据流 |
| 某个 Draw 实际使用了什么 | RenderDoc | PSO、固定功能状态、Shader、资源绑定和输出 | 业务字段的正式名称与上层对象来源 |
| 某项行为能否迁移到 Blender 或其他工具 | 固定条件 A/B | 限定条件下的可见行为 | 原始实现是否已被逐指令恢复 |

材质实例中存在一张纹理，当前帧是否采样它需要绑定证据；RenderDoc 槽位里的临时资源编号同样随捕获变化。UE4SS 提供对象和语义候选，RenderDoc 再确认这些候选是否进入当前帧的数据流。

## 从运行时对象落到离线资产

UE4SS 日志首先用于定位初始化阶段。已经通过的 `GUObjectArray`、`GMalloc` 或 FName 锚点是稳定基线；停点位于 CDO、UFunction 或 Lua Mod 阶段时，修改 FName 签名解释不了问题。

初始化稳定后，目标资产应从已知模型、角色和对象路径开始。选择性加载先限制候选范围，再由当前构建生成的 USMAP 补充未版本化属性布局。[CUE4Parse](https://github.com/FabianFG/CUE4Parse) 或 FModel 随后可以沿 SoftObjectPath、材质、骨骼和动画引用继续解析。

这条链得到的是离线身份与对象关系。USMAP 覆盖未版本化属性布局；原始业务代码与当前帧执行分支另由 UE4SS 与 RenderDoc 提供。

## 从候选 Draw 反查像素来源

RenderDoc 捕获成立后，分析顺序为：

```text
候选事件
→ PSO 与固定功能状态
→ Shader 指纹、reflection 与反汇编
→ 资源绑定与输出反向数据流
→ 资源生产者/消费者沿革
→ 离线模型、材质和纹理匹配
→ 固定条件 A/B
```

单个 EID 只属于一份捕获。跨帧定位应结合几何 index range、PSO、Shader 指纹、资源绑定、固定功能状态和相对顺序。资源语义也应沿 writer/consumer 关系确认：先确定输出由哪个 Pass 写入，再追踪后续哪些 Pass 读取，最后与离线对象路径闭合。

如果身份、绑定和数据流能够闭合，可以直接描述当前捕获中的行为。仍有替代解释时，应把限定写在结论附近；无法唯一命名的资源继续保持未确定。跨引擎重建说明的是限定条件下的行为接近；Blender 输出与原帧像素、原始 HLSL 各自属于不同层次。

## Morph、Wwise 与曲线迁移的边界

Morph、Wwise、Blender 曲线和 CPU 代码分析覆盖了不同的下游环节：

- Morph 运行时记录可以对齐反射对象、最终 CPU 消费者和离线曲线；GPU 使用的 Shader 另由 RenderDoc 确认。
- UEFormat 曲线需要经过实际 Blender 导入和逐帧回读，才能说明数据已经迁移到目标工具。
- USMAP 可以改善 `AkAudioEvent` 等 UE 包装资产及其引用关系；BNK 内部的 ShortID、HIRC 与音频内部名称保持原样。
- 一个只显示 PID 或窗口标题的诊断 DLL 验证一般 DLL 加载路径；RenderDoc 是否包装图形设备由 `API` 字段判断。
- CPU 代码与运行时对象的对齐只覆盖 CPU 侧。
- 既有 DXBC 可以作为离线 Shader 基线；当前帧实际绑定的 Shader 需要当前构建身份和有效 RDC。

## 停止外推的六种状态

出现以下状态时，结论停在当前层：

1. 游戏构建或映射版本不一致；
2. UE4SS 初始化停点尚未定位，却开始重建 FName 或批量加载全部资产；
3. RenderDoc 只有控制连接，图形 API 仍显示 `None`；
4. 事件身份只依赖屏幕位置或单帧 EID；
5. 资源出现在配置中，却没有运行时采样或输出贡献；
6. A/B 对照同时改变相机、曝光、色彩管理或 LOD。

这套流程分段呈现对象身份、离线结构和 GPU 执行；结论落在证据闭合的位置。
