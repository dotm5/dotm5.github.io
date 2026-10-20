---
title: "只导出需要的类"
published: 2026-08-17
updated: 2026-08-17
description: "从 UE4SS 初始化停点、选择性资产加载到 FModel 回归，记录一份 UE4.25 USMAP 的生成过程与适用边界。"
image: ""
imageAlt: ""
coverPreset: "default"
banner: ""
bannerPosition: "center"
tags:
  - UE4SS
  - FName
  - USMAP
  - FModel
  - CUE4Parse
category: "Unreal Engine"
draft: false
lang: "zh_CN"
---

`GUObjectArray`、`GMalloc`、`FName::ToString` 与 `FName(wchar_t*)` 均已通过初始化检查；流程实际停在后续的 `KismetSystemLibrary` CDO 定位。这个区别把后续工作定在对象布局和加载路径上，FName 重建已经完成。

文中的数字对应 2026-08-15 的 UE4.25 构建快照。游戏或 UE4SS 更新后，需要重新核对初始化停点和映射结果。

## 定位 UE4SS 初始化停点

UE4SS 初始化日志可以按下面的阶段阅读：

```text
模块与构建身份
→ GUObjectArray
→ GMalloc
→ FName::ToString / FName constructor
→ UObject 与反射布局
→ 关键 CDO / UFunction
→ Lua Mod 与 Dumper
```

这份日志已经越过 FName 发现阶段，而当前可执行文件暴露的是 UE4.25 构建标识。归档配置却强制使用 UE4.26，并把 `DefaultFNameToStringMethod` 固定为 `Conv_NameToString`。

[UE4SS 自定义游戏配置文档](https://docs.ue4ss.com/custom-game-configs.html)指出，旧配置可能随游戏或 UE4SS 更新而失效。诊断时先保留当前配置，再建立不带强制引擎覆盖的基线；基线仍失败时，才逐项恢复必要的自定义签名或布局。每次只改变一个变量，并记录新的停点。

后置停点描述后续阶段；前置阶段的结论以各自锚点为准。

## 选择性加载与全量加载的边界

[UE4SS Dumper 文档](https://docs.ue4ss.com/dev/feature-overview/dumpers.html)提供 `.usmap` 生成能力，并将 `LoadAllAssetsBeforeDumpingObjects` 默认设为 `0`。强制加载全部资产可能占用数 GB 内存并导致不稳定。

这套流程只为既定资产集合补足反射覆盖，分为以下环节：

| 环节 | 作用 |
| --- | --- |
| 目标清单 | 保存完整对象路径、期望类型、来源和去重键 |
| 选择性加载 | 只请求清单内资产，并限制并发、内存和慢加载 |
| 加载结果 | 为每个目标记录 loaded、failed 或 mismatch 及原因 |
| 映射生成 | 所有分片结束后调用 USMAP Dumper |
| 离线比较 | 独立解析 USMAP，并与既有 FModel 参考集比较 |

每个候选都应有明确结果，成功数与失败数之和应等于清单总数。一次全量实验处理约 21 万个包，并把近 19 万个对象长期保留在 Root 集合中；进程提交内存接近 200 GB，随后出现黑屏和系统失稳。这次运行说明，全量保留对象不适合作为这类导出流程。

## `AssetRegistry` 不可用时的原生加载路径

当前运行中，预期的 `AssetRegistry` 接口返回空值，UE4SS 内置便利加载路线无法使用。加载链改为通过对象调用关系闭合：

1. 用修正后的成员布局找到实际的 `KismetSystemLibrary` 默认对象；
2. 取得原生 `LoadAsset_Blocking` UFunction；
3. Lua 编排清单、批次、状态和守卫；
4. 原生桥执行加载，并把必要反射对象放入受控的 Root/ObjectReferencer 生命周期；
5. 每批结束后保存进度，支持失败恢复和分片重跑。

还需要处理对象名冲突和继承类型过滤。短对象名在候选中出现约两千组冲突，因此清单保存完整对象路径。类型过滤需要接受继承关系：只匹配类恰好等于 `UClass` 的对象，会漏掉 `UBlueprintGeneratedClass` 及其继承属性。

“继承感知 USMAP”保留直接属性，并沿类型关系组织父类字段；它不是运行时对象数量的简单汇总。

## 手动 F6 作为编排入口

延迟 `EngineTick` 回调曾在执行前失去生命周期，注册完成后导出并没有开始。当前控制流程为：

```text
重新启动并加载 UE4SS
→ 进入稳定场景
→ 手动按一次 F6
→ 按清单选择性加载
→ 生成并解析 USMAP
```

上游 USMAP Dumper 的默认快捷键另有一套；这里的 F6 是定制编排入口，把目标加载、状态记录、资源守卫和 Dumper 串在一起，并把导出开始时机固定为明确的人机同步点。

## 一轮选择性导出的结果

| 指标 | 结果 |
| --- | ---: |
| 清单目标 | 22,865 |
| 有明确结果的目标 | 22,865 |
| 加载成功 | 17,802 |
| 加载失败 | 5,063 |
| 类型不匹配 | 0 |
| 未知属性 | 0 |
| 引用错误 | 0 |
| USMAP 大小 | 6,490,706 bytes |
| 解析类型 | 27,917 |
| Blueprint 类型 | 15,118 |
| 直接属性 | 116,388 |
| 枚举 | 1,871 |
| 参考集保留率（排除 Lua 保留项） | 99.9242% |

`22,865 / 22,865` 表示清单没有静默丢项；`17,802` 与 `5,063` 分别保留成功和失败结果；`0 unknown properties` 表示当前解析器没有遇到未识别的属性标签。`99.9242%` 只针对既定 FModel 参考集；全游戏正确率需要另行测量。

这些数字描述覆盖范围，映射仍需结合解析统计和代表性资产回归。

## FModel 中的映射回归

FModel 回归同时保留两条基线：当前构建动态生成的映射作为主候选，已知可用的 FModel v2 映射作为参考。类型数、Blueprint 类型和直接属性数量的增加只表示覆盖面变化，仍需打开预先选择的角色、材质、动画和音频包装资产，检查：

1. 对象路径是否稳定；
2. 继承属性是否落在对应类型；
3. SoftObjectPath 和数组、Map 引用是否可遍历；
4. 旧映射可读取的代表性资产是否发生回退；
5. 解析输出是否出现未知属性或类型错配。

FModel 底层使用的 [CUE4Parse](https://github.com/FabianFG/CUE4Parse) 是包体解析库。USMAP 为它补充未版本化属性布局，但不会恢复游戏业务代码。

## USMAP 与 Wwise 内部语义的边界

新映射可以让 `AkAudioEvent`、bank/media 引用、SoftObjectPath 和事件路径显示得更清楚。它改善 UE 包装资产及其引用关系；BNK 内部的 ShortID、HIRC 与音频内部名称保持原样。

HIRC 或 ShortID 的显示变化由 `Init.bnk`、STID、`SoundBanksInfo`、缓存和游戏版本共同解释，USMAP 只负责属性布局。

同一边界也适用于 Shader。USMAP 能补足材质实例、纹理参数和对象引用；当前帧的像素数据流由 RenderDoc 回答。

## USMAP 的表达边界

USMAP 描述反射可见的未版本化属性布局，仍有两类信息需要与它分开：

- 原生类型中的非 `UPROPERTY` 私有成员超出 USMAP 的表达范围；
- 某些通用 `UObject` 已有映射，但 CUE4Parse 缺少对应的专用 serializer，此时解析不足的原因分散在映射与 serializer 两侧。

映射覆盖、解析器实现、业务语义和当前帧贡献是四个不同问题。前一个通过只覆盖映射层，后三个各自验收。

系列导航：[工具流总览](/posts/ue4ss-renderdoc-toolchain-index/) · [RenderDoc 显示 API: None](/posts/renderdoc-api-none/) · [RenderDox 运行时合同](/posts/renderdox-runtime-contract/)
