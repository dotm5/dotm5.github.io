---
title: "魔改 RenderDoc 的第一课"
published: 2026-08-17
updated: 2026-08-17
description: "RenderDox 如何统一产品身份、图形入口 Hook、一级子进程传播，以及 Core 与桌面套件的构建依赖。"
image: ""
imageAlt: ""
coverPreset: "default"
banner: ""
bannerPosition: "center"
tags:
  - RenderDoc
  - RenderDox
  - DComp
  - Windows
  - MSBuild
category: "Projects"
draft: false
lang: "zh_CN"
---

把 `renderdoc.dll` 换成另一个文件名，只改变了一个目录项。产品身份还分布在 Core、GUI、CLI、Shim、Vulkan Layer、配置目录、日志、IPC、安装器、PE 资源和函数入口中。生产者与消费者使用不同身份时，工具可能可以启动和连接，却在部分路径上回退。

RenderDox/DComp 分支将这些约束组织为运行时合同。以下说明对应 2026-08-17 的分支快照。RenderDox 是独立维护的开发分支，最新状态以[公开仓库](https://github.com/dotm5/renderdox)为准。

## 产品身份与运行时入口

| 职责 | 身份 |
| --- | --- |
| 产品与配置命名空间 | `DComp` |
| 捕获 Core | `dgcore.dll` |
| GUI | `dgcoreui.exe` |
| CLI | `dgcorecmd.exe` |
| Stub | `dgcorestub.exe` |
| 32/64 位 Shim | `dgcoreshim32/64.dll` |
| Vulkan Layer | `VK_LAYER_DCOMP_Capture` |
| 运行时入口 | `DCOMP_GetAPI` |

统一的身份源生成构建属性、头文件和相关资源，检查同时覆盖源码与二进制。Core 只导出 `DCOMP_GetAPI`，GUI、CLI 和回放路径也查找同一个入口。保留 ABI 兼容 typedef 只覆盖类型层，导出表以 `DCOMP_GetAPI` 为准。

独立命名空间还隔离了日志、配置、IPC、文件关联和 Vulkan 注册，避免自定义 Core 被官方前端或另一套安装误识别。

## 图形入口 Hook 与子进程传播

项目保留模块、IAT、`LoadLibrary*` 和 `GetProcAddress` Hook，同时为已注册的 DXGI、D3D11、D3D12 入口增加内联 detour。目标程序可能直接从导出表解析地址并写入私有函数表；只观察后续的 `GetProcAddress` 已经太晚。

子进程传播采用 `OneGeneration`：

```text
启动器已加载 Core
→ 创建真实游戏子进程
→ Core 自动传播一次
→ 游戏进程不再继续传播到登录器或辅助进程
```

`OneGeneration` 覆盖启动器与真实渲染进程分离的场景，并把传播范围限制为一级子进程。诊断构建仍可显式选择 `AllGenerations`。

## Core 与桌面套件的依赖边界

注入 DLL 的依赖边界与完整桌面套件不同：

- `dgcore.dll` 及其静态链接图使用 `/MT`，不依赖目标进程目录中的动态 VC CRT；
- GUI、CLI、Qt 和 Python 仍可能需要动态运行库；
- 便携目录携带这些运行库，Core 仍使用 `/MT`。

普通 Visual Studio `Release` 曾生成依赖 `MSVCP140`、`VCRUNTIME140` 的 `/MD` Core，而专用构建配置仍能生成静态运行库版本。差异来自两套 `Release` 配置使用了不同默认值。

[提交 `4876e14`](https://github.com/dotm5/renderdox/commit/4876e147b08a0b50e09f8d9021540b55e460fc28)将四项设置变成普通 `Release` 的可覆盖默认值：一级子进程 Hook、Core 静态运行库、图形入口内联 Hook，以及只传播一代。`Development` 保留原行为，命令行显式参数仍可覆盖默认值。

## 构建与功能检查

MSBuild 成功只覆盖编译步骤，运行时关系还需要从不同层面观察：

| 层面 | 检查内容 |
| --- | --- |
| 配置求值 | `Release`、`Development` 与显式覆盖得到预期属性 |
| 源码身份 | 文件名、API、Vulkan、资源、IPC 和安装器使用同一身份 |
| 二进制身份 | 导入表、导出表、架构、嵌入资源和版本相符 |
| 功能烟测 | 自有 D3D11 程序可以生成并重新打开 RDC |

该次 Core 重建中，382 条相关编译命令使用 `/MT`，0 条使用 `/MD`；二进制只保留预期系统依赖，并导出 `DCOMP_GetAPI` 与必要的 COM 入口。`382/0` 描述该次构建结果，其他构建按各自输出统计。

CMake 平台检查与 Windows MSVC、ClangCL 构建覆盖相同的身份和功能关系。

## 两条启动路径

### DXGI/bootstrap

这条路径适合能够通过预加载或代理入口进入图形初始化的自有程序。它依赖文件布局和入口身份，启动步骤较少。

### DComp 前端或 CLI

匹配的 DComp 前端或 CLI 负责加载 Core，并设置捕获选项、日志和 Target Control。该路径必须使用与 Core 身份匹配的前端；模块名、运行时入口和内部命名空间已经与官方工具隔离。

两条路径需要得到相同结果：API 显示 D3D11/D3D12，Device 和 SwapChain 进入包装链，叠加层可见，RDC 可以保存并重新打开。

## 上游同步后的回归重点

分支合并上游 RenderDoc 修复后，需要重新检查身份生成物和 `DCOMP_GetAPI` 的生产者、消费者，确认 Windows Hook 与后加载模块刷新路径仍然存在，并核对 `Release` 默认值、静态 Core、MSVC/ClangCL 构建和实际捕获烟测。

这些约束写入构建配置和自动检查后，上游项目文件调整需要显式覆盖才能改变子进程传播和静态 Core 设置。

产品身份、运行路径、依赖边界和功能结果共同构成分叉工具的维护基础。只同步文件名覆盖不到这些关系；Core、前端和构建配置共用同一组运行时约束。

系列导航：[工具流总览](/posts/ue4ss-renderdoc-toolchain-index/) · [UE4SS 选择性 USMAP](/posts/ue4ss-selective-usmap-practice/) · [RenderDoc 显示 API: None](/posts/renderdoc-api-none/)
