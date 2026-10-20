---
title: "RenderDoc 显示 API: None 时，我在查什么"
published: 2026-08-17
updated: 2026-08-17
description: "区分模块加载、Target Control 连接与图形捕获，解释首次设备创建、私有函数表和启动器上下文如何影响 RenderDoc。"
image: ""
imageAlt: ""
coverPreset: "default"
banner: ""
bannerPosition: "center"
tags:
  - RenderDoc
  - D3D11
  - DXGI
  - Windows
category: "Rendering"
draft: false
lang: "zh_CN"
---

`renderdoc.dll` 已出现在模块列表，GUI 也能连接，界面却仍显示 `API: None`。这个状态表示控制平面已经部分建立，图形 API 尚未进入 RenderDoc 的包装链。

重命名 DLL、把轮询间隔从 10 ms 改成 1 ms，或只检查模块地址，都停在模块层；捕获链成立需要另外的信号。

## 模块加载、控制连接与图形捕获

| 状态 | 可见信号 | 可以确认的范围 |
| --- | --- | --- |
| DLL loaded | 模块列表出现 Core DLL | 操作系统完成模块加载 |
| Target Control connected | GUI 能看到运行实例 | 控制服务可以与前端通信 |
| Graphics API captured | API 显示 D3D11/D3D12，叠加层和 RDC 可用 | Device、Context、SwapChain 已进入包装链 |

`API: None` 位于第二行和第三行之间。GUI 连接只覆盖控制服务。

RenderDoc 的[应用内 API 文档](https://github.com/baldurk/renderdoc/blob/v1.x/docs/in_application_api.rst)说明，程序通常先按模块名查找 `renderdoc.dll`，再取得唯一导出的 `RENDERDOC_GetAPI`。任意改名可能破坏自识别路径；名称一致只是必要条件，错过的图形初始化仍需在 Hook 阶段补回。

## 从 DLL 加载到前端协作

上游 Windows 实现在加载 Core DLL 后，还会设置捕获文件、日志和捕获选项，并取得 Target Control 标识；相关过程可以在 [win32_process.cpp](https://github.com/baldurk/renderdoc/blob/v1.x/renderdoc/os/win32/win32_process.cpp) 中看到。单独调用 LoadLibrary 只走完第一层，前端与 Core 的协作还需要后续步骤。

一个只显示 PID 和窗口标题的最小 DLL 可以作为对照：

- 如果它也无法加载，应先检查位数、路径、权限和进程身份；
- 如果它可以加载而 RenderDoc 仍为 `None`，问题已经收窄到 RenderDoc 初始化、命名、配置或图形时序；
- 它只能验证一般 DLL 加载路径，图形接管另有验收阶梯。

## 首次图形对象创建的时序

在典型路径中，RenderDoc 需要在 `CreateDXGIFactory*`、`D3D11CreateDevice*` 或对应的 D3D12 初始化之前建立 Hook。`dxgi.dll` 已加载并不判定早晚，截止线在程序解析入口并创建 Factory、Device 或 SwapChain 之前。

某些程序会把 DXGI/D3D 导出写入私有函数表：

```text
加载系统图形 DLL
→ 解析导出地址
→ 写入私有函数表
→ 后续一直调用缓存地址
```

如果捕获工具在第三步之后才安装 IAT、`GetProcAddress` 或模块加载 Hook，已缓存的函数指针不会自动回写。控制服务仍可连接，图形设备却继续绕过包装层。

代理 DLL 也依赖目标的实际导入路径。程序直接解析系统导出时，代理预期的入口可能从未被调用。

## 启动器上下文与图形初始化

由正常启动器创建 Shipping EXE，与从调试器直接运行 EXE，可能形成不同的初始化环境。除命令行外，子进程还可能依赖：

- 父进程和会话拓扑；
- 当前工作目录与环境块；
- 继承句柄、事件、管道或 Job；
- `STARTUPINFOEX` 属性；
- 创建后的父子通信。

如果一份直接启动样本在入口断点后发生多次首轮异常，随后以退出码 0 结束，而且尚未加载 DXGI/D3D，这说明该次启动没有进入渲染初始化；入口断点与兼容性需要各自的证据。

观察启动器时，可以保留正常拓扑，只记录它传给 `CreateProcessW` 的启动条件。在自有测试程序中，捕获流程可以固定为：

```text
CREATE_SUSPENDED
→ 注入并设置捕获选项
→ 确认 Core 与 Target Control
→ ResumeThread
```

微软的[进程创建标志文档](https://learn.microsoft.com/en-us/windows/win32/procthread/process-creation-flags)说明，`CREATE_SUSPENDED` 会让主线程在 `ResumeThread` 前保持未运行状态。这个边界比事后轮询更明确。

## 轮询暂停的时序边界

CE Lua 的 10 ms 定时器可以用于快速实验，但该数值只是名义周期。系统调度、进程枚举、前端响应和目标启动速度都会增加延迟。改成 1 ms 仍在竞速：私有函数表填充与 Device 创建可能更早发生。

轮询覆盖子进程发现、一般暂停/恢复和诊断 DLL 加载；稳定的捕获入口需要提前挂点。如果测试触发内核级故障，应停止重复运行并保留转储；故障模块以转储中的故障栈与模块身份为准。

## 图形捕获成立的信号

图形捕获成立时，API 会从 `None` 变为 D3D11 或 D3D12，叠加层能够显示捕获状态，并且生成的非空 RDC 可以重新打开和回放。PID、位数、Core 与前端构建需要互相对应，信号才归属同一个进程和同一套工具组合。

一份自有 UE D3D11 测试程序已经生成明确叠加层、捕获计数和可读取 RDC。这组成功样本区分了分叉构建本身的捕获能力与特定启动拓扑的时序问题。

## 捕获后的事件与资源分析

RDC 是帧分析的起点。跨捕获定位事件时，应组合几何 index range、PSO、Shader 指纹、资源绑定、固定功能状态和相对顺序。EID 会随帧内容移动；稳定身份由事件签名承担。

UE4SS 和 FModel 提供对象及资源候选，RenderDoc 展开当前帧的绑定和数据流。固定条件 A/B 再用于判断某个解释是否能在相同条件下复现。

系列导航：[工具流总览](/posts/ue4ss-renderdoc-toolchain-index/) · [UE4SS 选择性 USMAP](/posts/ue4ss-selective-usmap-practice/) · [RenderDox 运行时合同](/posts/renderdox-runtime-contract/)
