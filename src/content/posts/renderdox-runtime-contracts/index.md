---
title: "把 RenderDoc 分叉做成工具"
published: 2026-08-17
updated: 2026-08-17
description: "一次 RenderDoc 分叉如何把产品身份、API、Hook、一级子进程传播、静态 Core、双工具链构建与自动发布固化为可检查的合同。"
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
  - Validation
category: "Projects"
draft: true
lang: "zh_CN"
---

定制 RenderDoc 最容易低估的一步是“改名”。把 `renderdoc.dll` 改成另一个文件名，只改变了一个目录项；真正的产品身份还散落在 Core、GUI、命令行、Shim、Vulkan Layer、配置目录、日志、IPC、安装器、PE 资源与函数入口中。任何一个生产者和消费者没有同步，都会产生“能启动、能连接，但某一段悄悄回退”的半兼容状态。

RenderDox/DComp 分支把这些约束写成运行时合同，跳过了一次性搜索替换。

本文描述 2026-08-17 的 `dgcore-main` 快照。RenderDox 是独立维护的开发分支，不是上游 RenderDoc 官方发布，最新状态以[公开仓库](https://github.com/dotm5/renderdox)为准。

## 1. 产品身份来自单一来源

当前身份表的核心关系是：

| 职责 | 身份 |
| --- | --- |
| 产品/配置命名空间 | `DComp` |
| 捕获 Core | `dgcore.dll` |
| GUI | `dgcoreui.exe` |
| CLI | `dgcorecmd.exe` |
| Stub | `dgcorestub.exe` |
| 32/64 位 Shim | `dgcoreshim32/64.dll` |
| Vulkan Layer | `VK_LAYER_DCOMP_Capture` |
| 运行时入口 | `DCOMP_GetAPI` |

身份源生成 props、头文件与相关资源，合同检查再扫描源码和二进制，旧名重新出现时会被拦下。关键在入口双方一致：Core 只导出 `DCOMP_GetAPI`，GUI、CLI 与回放路径也只查找同一个入口。保留 ABI 兼容 typedef 只覆盖类型层，导出表只保留新入口。

这种隔离解决了两类问题：

1. 自定义 Core 不会被官方前端或另一套安装误识别；
2. 日志、配置、IPC、文件关联与 Vulkan 注册不会共享同一命名空间。

## 2. Hook 策略是分层的

项目保留标准的模块/IAT/`LoadLibrary*`/`GetProcAddress` Hook，同时增加已注册 DXGI、D3D11、D3D12 入口的内联 detour。原因在目标程序的调用路径：它可能直接从导出表解析地址并保存到私有函数表，后续 `GetProcAddress` 不在这条路径上。

另一条定制是子进程传播：

```text
启动器已加载 Core
→ 创建真实游戏子进程
→ Core 自动传播一次
→ 真实游戏不再继续传播到登录器/辅助进程
```

这就是 `OneGeneration`。它解决启动器与真实渲染进程分离的问题，同时把捕获 Core 的传播范围限制在一级子进程。诊断构建仍可显式选择 `AllGenerations`，发布默认只传播一代。

## 3. 依赖边界：注入 Core 与桌面套件

注入 DLL 与完整 GUI 套件的依赖边界各自独立：

- `dgcore.dll` 及其静态链接图使用 `/MT`，不依赖目标进程目录里的动态 VC CRT；
- GUI、CLI、Qt 与 Python 仍可能需要动态运行库；
- 便携包继续携带这些运行时文件，Core 仍是 `/MT`。

早期普通 Visual Studio `Release` 输出曾覆盖经过验收的 Core，生成依赖 `MSVCP140/VCRUNTIME140` 的 `/MD` DLL，而专用发布脚本仍能产出正确版本。问题出在配置默认值：“普通 Release”和“交付 Release”使用了两套合同。

[提交 `4876e14`](https://github.com/dotm5/renderdox/commit/4876e147b08a0b50e09f8d9021540b55e460fc28)把以下四项变成普通 Release 的可覆盖默认值：

- 一级子进程 Hook；
- Core 静态运行库；
- 图形入口内联 Hook；
- 子进程只传播一代。

Development 仍保留原行为，命令行显式参数仍可覆盖默认值。发布的默认值与诊断实验的可变性因此各自保留。

## 4. 五层验收

MSBuild 成功只覆盖编译。当前验收分为五层：

| 层 | 检查 |
| --- | --- |
| 配置求值 | Release、Development、显式覆盖三组属性 |
| 源码身份 | 文件名、API、Vulkan、资源、IPC 与安装器一致性 |
| 二进制身份 | 导入表、导出表、架构、嵌入资源与版本 |
| 功能烟测 | 自有 D3D11 程序生成并重新打开 RDC |
| 发布产物 | manifest、SHA-256、双工具链 ZIP 与构建证明 |

该快照的本地 Core 重建记录中，382 条相关编译命令使用 `/MT`，0 条使用 `/MD`；二进制只有预期系统依赖，并导出 `DCOMP_GetAPI` 与必要的 COM 入口。这个计数描述该次构建，项目常量按最新输出更新。

持续集成同时覆盖 CMake 平台验证和 Windows MSVC/ClangCL 完整 Release。自动发布只在同一提交的前置工作流都成功后运行，生成：

- MSVC 与 ClangCL 两套 Windows x64 包；
- 构建 manifest；
- `SHA256SUMS.txt`；
- GitHub 构建来源证明。

[对应开发快照](https://github.com/dotm5/renderdox/releases/tag/continuous-4876e147b08a)明确标为 pre-release，并说明它不是上游 RenderDoc 发布。

## 5. 两条使用路径

### DXGI/bootstrap 路径

适合能通过预加载/代理入口自然进入图形初始化的自有程序。它依赖文件布局和入口身份，优点是启动方式简单。

### 前端直接注入路径

由匹配的 DComp 前端或 CLI 完成 Core 加载、捕获选项、日志和 Target Control 设置。“把 DLL 改名后用官方 GUI 连接”在这条路径上失效：模块名、运行时入口和内部身份已经隔离。

两条路径最终共享相同验收：API 显示 D3D11/D3D12、D3D Device/SwapChain 被包装、叠加层可见、RDC 能保存并重新打开。

## 6. 上游同步的复核清单

分叉项目仍需合并上游 RenderDoc 修复。每次同步后至少复核：

1. 产品身份生成物是否仍一致；
2. `DCOMP_GetAPI` 的生产者与消费者是否对齐；
3. Windows Hook 与后加载模块刷新路径是否保留；
4. Release 默认和静态 Core 是否被工程文件覆盖；
5. MSVC、ClangCL、CMake 与实际捕获烟测是否同时通过；
6. 自动发布指向当前提交，旧产物不计入。

这也是把合同写成脚本的意义：上游一次项目文件调整需要显式覆盖，才会改变子进程传播与静态 Core。

## 7. 对其他原生工具分叉的启示

一个可维护的原生分叉至少需要四张表：

- **身份表**：文件、入口、资源、配置、IPC 与安装器；
- **运行表**：加载方式、Hook 层、子进程传播和停止边界；
- **依赖表**：注入 Core 与桌面套件分别需要什么；
- **验收表**：源码合同、二进制合同、功能烟测和发布来源。

这些信息只存在于某次聊天或某条构建命令时，下一次普通 Release、上游合并或 UI 分支合并就会覆盖它们。把它们变成默认值、可覆盖参数、自动检查和公开发布说明，定制分支才能从“能用的一套二进制”过渡到“可以继续维护的工具”。

系列导航：[总览](/posts/ue4ss-renderdoc-toolchain-index/) · [UE4SS 选择性 USMAP](/posts/ue4ss-selective-usmap-practice/) · [RenderDoc 捕获边界](/posts/renderdoc-api-none-capture-boundary/)
