---
title: "游戏底层研究笔记，挑一篇开始读"
published: 2026-10-20
updated: 2026-10-20
description: "把近期游戏组件分析整理为六个专题：IL2CPP 运行期结构、UE 类型布局、IDA 导入、驱动证据、Unity 资源容器和渲染参数对齐。"
image: ""
imageAlt: ""
coverPreset: "technical"
tags: [Reverse Engineering, Evidence, Workflow]
category: "Notes"
draft: false
lang: "zh_CN"
---

最近几轮分析跨过了几种完全不同的数据：磁盘上的可执行文件、运行期对象、IDA 数据库、资源容器和 GPU 帧。它们都能提供“名字和地址”，回答的问题各不相同。

把材料重新串起来之后，最有用的成果是几条能够继续验证的联系：某个类属于哪个程序集，某个字段是否真的位于反编译器显示的偏移，某张纹理是否参与了当前 draw，以及某个参数最终经哪条通道进入 GPU。

这一组笔记保留这些联系，也保留已经被后续实验推翻的判断。记录范围主要是 2026 年 10 月，数字对应各篇注明的样本与数据批次。

## 按问题选择文章

| 想解决的问题 | 文章 | 分类与标签 |
| --- | --- | --- |
| 常规 IL2CPP 工具读不到元数据时，现有对象还能提供什么 | [metadata 被保护之后](/posts/il2cpp-runtime-metadata-evidence/) | Notes · Unity3D · IL2CPP |
| 导入了几千个类型，为什么反编译字段仍可能错位 | [导入 9,146 个声明之后，反编译还是错](/posts/ue-types-need-real-layouts/) | Unreal Engine · IDA |
| 名字表和入口表都有了，如何判断是否正确导入 | [符号导进 IDA，又变回 sub_](/posts/ida-symbol-import-contracts/) | Notes · IDA |
| 组件存在、API 被导入、回调被注册分别说明什么 | [一个驱动三个版本](/posts/driver-analysis-evidence-boundaries/) | Notes · Windows · Static Analysis |
| 资源工具报告成功，为什么仍可能没有读到目标内容 | [导出了 11 项资源，算成功吗](/posts/unity-containers-and-asset-validation/) | Rendering · Unity3D · Assets |
| 如何把 draw、材质参数和 C++ 设置器接起来 | [这张脸是谁画的](/posts/render-draw-to-native-parameters/) | Rendering · Render · RenderDoc |

## 标签的分工

`Unity3D` 聚合 Unity 引擎、IL2CPP、程序集和资源系统相关内容。它表达研究对象；GPU 渲染相关内容归 `Render`。

`Render` 用于更细的渲染分析，包括 draw、材质输入、光照、后处理和参数传递。识别一个名为 Renderer 的类只完成第一步，结论还需要绘制与参数证据。分类保持较宽，标签负责把同一问题在不同引擎中的研究串起来。

## 资料之间怎样互相补足

磁盘镜像保留静态代码和常量，运行期快照提供已经构造的对象与指针。IDA 把这些材料组织成可追踪的调用关系，资产工具解释纹理、网格和材质，帧捕获则说明当前画面真正使用了什么。

同一个结论可能需要经过几层证据。例如，“存在面部阴影配置”来自类型与资产；“当前面部 draw 绑定了相关纹理”来自帧；“某个设置器控制这个材质常量”还需要写入路径和值的对齐。前一层有成果时先记录下来，后一层验收单独进行。

## 后续整理的方向

IL2CPP 侧继续关注名字覆盖率和导入质量，UE 侧优先复核继承、位域与共享函数，渲染侧优先补齐参数值的对应关系。比起继续扩大候选清单，这些工作更能减少下一次分析中的歧义。
