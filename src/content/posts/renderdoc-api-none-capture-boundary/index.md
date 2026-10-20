---
title: "DLL 明明加载了，RenderDoc 还是 API: None"
published: 2026-08-17
updated: 2026-08-17
description: "区分模块加载、Target Control 连接与 D3D 接管，解释启动器、私有函数表和首次设备创建怎样共同决定 RenderDoc 能否真正截帧。"
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
  - Capture
  - Validation
category: "Rendering"
draft: false
lang: "zh_CN"
---

“DLL 已经出现在模块列表，GUI 也能连接，但显示 `API: None`，没有叠加层，也截不到帧。”这个组合对应两层状态：控制平面已经部分运行，图形 API 的数据平面没有被包装。

理解这个区别之后，很多无效尝试都可以提前停止：继续重命名 DLL、把轮询间隔从 10 ms 改成 1 ms、只检查模块地址，都停留在模块层。

## 0. 适用范围与授权边界

以下方法只用于自有、离线或获授权的测试程序。保护机制阻止调试或注入时应停止，改用测试构建、开发者集成或离线捕获。

## 1. 三个成功状态

| 状态 | 可见信号 | 可以确认的范围 |
| --- | --- | --- |
| DLL loaded | 模块列表出现核心 DLL | 操作系统完成了模块加载 |
| Target Control connected | GUI 能看到运行实例 | 控制服务与前端可以通信 |
| Graphics API captured | API 显示 D3D11/D3D12，叠加层与 RDC 可用 | Device/Context/SwapChain 已进入包装链 |

`API: None` 位于第二行和第三行之间。GUI 连接只覆盖控制服务。

RenderDoc 的[应用内 API 文档](https://github.com/baldurk/renderdoc/blob/v1.x/docs/in_application_api.rst)也说明，程序通常先按模块名查找 `renderdoc.dll`，再取得唯一导出的 `RENDERDOC_GetAPI`。这解释了为什么任意改名会破坏一部分自识别路径。名称正确之外，还需要在图形初始化之前进入包装链。

## 2. 正式注入不只是 LoadLibrary

上游 Windows 实现会在加载核心 DLL 后继续设置捕获文件、日志、捕获选项，并取得 Target Control 标识；源码可见 [win32_process.cpp](https://github.com/baldurk/renderdoc/blob/v1.x/renderdoc/os/win32/win32_process.cpp)。因此一个最小 LoadLibrary 测试回答的是“这个 DLL 能否进入目标进程”，完整前端协议另算。

项目里曾构建过一个只显示 PID 与窗口标题的最小 DLL，可以直接作为对照组：

- 若它都不能加载，先修通用位数、路径、权限或进程身份问题；
- 若它能加载而 RenderDoc 仍为 `None`，问题已收窄到 RenderDoc 初始化、命名、配置或图形时序；
- 它验证一般 DLL 加载路径，渲染接管另有验收阶梯。

## 3. 真正的截止线是首次图形对象创建

在典型路径中，RenderDoc 需要在 `CreateDXGIFactory*`、`D3D11CreateDevice*` 或对应 D3D12 初始化之前建立 Hook。`dxgi.dll` 已加载并不判定早晚，截止线在程序解析入口并创建 Factory、Device 或 SwapChain 之前。

某些程序还会把 DXGI/D3D 导出解析到自己的函数表中：

```text
加载系统图形 DLL
→ 解析导出地址
→ 写入私有函数表
→ 后续一直调用缓存地址
```

如果捕获工具在第三步之后才安装 IAT、`GetProcAddress` 或模块加载 Hook，已经缓存的函数指针不会自动回写。此时控制服务照常出现，图形设备却绕过包装层，最终就是 `API: None`。

这也是代理 DLL 的适用边界：目标从不走代理预期的导入路径时，代理不会被调用。

## 4. 启动器上下文也是捕获合同的一部分

直接从调试器运行 Shipping EXE，与由正常启动器创建它，会形成两个实验。命令行之外，子进程还可能依赖：

- 父进程与会话拓扑；
- 当前工作目录；
- 环境块；
- 继承句柄、事件、管道或 Job；
- `STARTUPINFOEX` 属性；
- 创建后的父子通信。

一次失败样本曾在入口断点后记录多次首轮异常，最终以退出码 0 主动结束，而且尚未加载 DXGI/D3D。这次直接启动没有进入渲染初始化；入口断点与兼容性需要各自的证据。

更可靠的观察方式是保留正常启动拓扑，只记录启动器传给 `CreateProcessW` 的合同，不立即改寄存器或创建标志。只有在自有测试程序中，才把流程工程化为：

```text
CREATE_SUSPENDED
→ 注入并设置捕获选项
→ 验证核心与 Target Control
→ ResumeThread
```

微软文档明确说明，[`CREATE_SUSPENDED`](https://learn.microsoft.com/en-us/windows/win32/procthread/process-creation-flags) 会让主线程在 `ResumeThread` 前不运行。这比事后定时轮询更能定义“第一条用户代码之前”的边界。

## 5. 轮询暂停的边界

CE Lua 的 10 ms 定时器可以做快速实验，但 10 ms 只是名义周期。调度、进程枚举、前端响应和目标启动速度都会扩大延迟。即使改成 1 ms，仍在与私有函数表填充和 Device 创建竞速。

轮询方案最多适合回答：

- 能否发现正确的子进程；
- 通用暂停/恢复是否工作；
- 一个无副作用的诊断 DLL 能否加载。

它适合实验，不适合发布级捕获入口。出现过内核级蓝屏时，正确动作是停止重复测试并保存 dump。故障模块以 dump 中的故障栈与模块身份为准。

## 6. 按成本排序的验收阶梯

按成本从低到高检查：

1. **进程身份**：PID、位数、真实渲染子进程与启动上下文正确；
2. **核心身份**：DLL 名称、导出和前端来自同一构建；
3. **控制连接**：前端取得 Target Control 标识；
4. **图形包装**：API 从 `None` 变为 D3D11/D3D12；
5. **可见信号**：叠加层能报告捕获状态；
6. **持久证据**：生成非空 RDC，可重新打开并回放；
7. **内容验收**：目标事件、资源和输出能在固定条件下复现。

在自有 UE D3D11 测试工程中，这套链路最终取得了明确叠加层、捕获计数、可读取 RDC 和哈希记录。这个阳性对照很重要：它把“分叉构建本身不能捕获”和“特定启动拓扑没有赶上时序”区分开了。

## 7. 从捕获成功进入证据分析

RDC 只是起点。后续结论以事件签名为准：几何 index range、PSO、shader 指纹、资源绑定、固定功能状态和相对顺序。事件编号会随帧内容移动，行为签名才是可迁移身份。

最终分析链回到本系列总览：UE4SS/FModel 提供对象和资源候选，RenderDoc 证明这一帧的绑定与数据流，再用固定条件 A/B 决定结论是 Confirmed、Inference 还是 Unknown。

系列导航：[总览](/posts/ue4ss-renderdoc-toolchain-index/) · [UE4SS 选择性 USMAP](/posts/ue4ss-reflection-usmap-workflow/) · [RenderDox 运行时合同](/posts/renderdox-runtime-contracts/)
