---
title: "号码搬家记：从 giffgaff 到 CTExcel，打通 Wi‑Fi Calling"
published: 2026-08-03
description: "记录从 giffgaff 账户暂停、PAC 携号转网、可切换 eUICC，到 iPhone、IPCC、UDP/IPsec 和漫游链路排障，最终激活 CTExcel UK Wi‑Fi Calling 的过程。"
tags:
  - Wi-Fi Calling
  - eSIM
  - CTExcel
  - iPhone
  - IPCC
  - UDP
  - PAC
category: "日常"
draft: true
lang: "zh_CN"
---

本文是一次个人实测记录，记录从 giffgaff 迁移号码、准备 CTExcel UK profile，到最终拉起 Wi‑Fi Calling 的完整排障过程。文章中的成功结果依赖具体的运营商配置、eSIM profile、iOS 版本、设备状态和网络出口，适用的设备范围有限。

下面会区分已经观察到的结果、根据现象提出的工作假设，以及目前仍然缺少证据的部分。

## 1. 起点：迁移号码的起因

迁移的直接原因是 giffgaff 的风控。账户被暂停后，决定将号码转移到另一家运营商。

目标运营商是 CTExcel UK。需要先正常注册 CTExcel 服务，注册完成后 CTExcel 会分配一个临时的英国手机号，随后提交原 giffgaff 账户提供的 PAC，并选择号码转入日期。

本次流程中，转入最早安排在一个正常工作日之后完成。号码转入后，原来的英国号码会替换 CTExcel 账户中的临时号码，临时号码则被取消。PAC 迁移号码本身；原运营商账户中的套餐、余额和其他服务另行处理。[Ofcom 对英国移动号码携号转网流程有具体说明](https://www.ofcom.org.uk/phones-and-broadband/switching-provider/switching-mobile-phone-provider?language=en)。

号码迁移和 Wi‑Fi Calling 激活是两个独立问题：

1. PAC 解决号码归属迁移。
2. CTExcel 账户和 eSIM profile 解决用户身份配置。
3. IPCC、设备和运营商配置决定手机是否暴露 Wi‑Fi Calling 相关功能。
4. 网络路径决定 Wi‑Fi Calling 是否能够完成注册和通话。

这几个环节分别排查。

## 2. 实体卡与可切换 eSIM 卡片

在了解 CTExcel 的过程中，实体卡路径的实际操作不便，因此转向可以把 eSIM profile 写入实体形态卡片的方案。

当时比较过 XESIM、Beesim 等方案，最终选择了 9eSIM。原因是它保留了相对开放的工具链：运营商提供 eSIM 二维码，LPA 负责下载和写入 profile，卡片本身则作为可移动的 eUICC 使用。已经写入的 profile 还可以通过 STK/USIM 菜单切换。

这里的“实体卡”是可以插入手机的可移动 eUICC。根据 [9eSIM 官方页面](https://www.9esim.com/)，其产品支持写入多个 eSIM profile，并支持通过 STK 菜单进行切换；[9eSIM 也公开维护了相关工具项目](https://github.com/9esim)。

这里开放的是工具链，整个 eSIM 系统仍由厂商与运营商组件构成。

常规消费级 eSIM 大致由三部分组成：

- eUICC：保存运营商 profile 的安全芯片。
- LPA：手机侧的 Local Profile Assistant，负责下载、安装、启用和删除 profile。
- SM-DP+：运营商侧的 profile 准备与分发服务。

[GSMA SGP.22 规范](https://www.gsma.com/esim/wp-content/uploads/2023/12/SGP.22-v3.1.pdf)定义了消费级 eSIM 的 Remote SIM Provisioning 架构、接口和安全机制。

可开放的部分集中在工具链和客户端实现：

- 可以使用 [OpenEUICC](https://github.com/estkme-group/openeuicc)、EasyEUICC 或 [lpac](https://github.com/estkme-group/lpac) 等开放源代码 LPA 管理兼容的 eUICC。
- 设备厂商或卡片厂商的安全芯片固件、Java Card applet 通常以闭源固件发布。
- 运营商的 SM-DP+ 服务、profile 生成以及加密签名仍由运营商或其供应商控制。
- 开源 LPA 仍需要运营商发放 profile；可注册网络的号码只能来自运营商。

选择 9eSIM，是为了给未来保留一条后路：即使厂商停止维护自己的 App，只要卡片硬件仍然兼容、社区工具仍然可用，管理程序就可以替换。这条路留在工具链层，eSIM 生态的控制权仍在运营商与厂商手里。

## 3. 写入 CTExcel profile

实际操作过程比较直接：

1. 正常注册 CTExcel UK 服务，获得临时号码。
2. 提交 PAC 并预约号码转入日期。
3. 获取运营商提供的 eSIM 二维码或 profile 信息。
4. 使用手机 App 和 9eSIM 卡片，将 profile 写入可移动 eUICC。
5. 将卡片插入设备 A。
6. 通过 STK/USIM 卡片菜单切换到 CTExcel profile。

这一步覆盖 profile 的写入与启用；Wi‑Fi Calling 激活属于下一层。eSIM profile 能够注册网络、手机能够显示运营商名称，以及 Wi‑Fi Calling 能够完成 IMS 注册，是三个不同层次的状态。

Apple 的说明是，插入新 SIM 或设置新 eSIM 后，设备可能需要下载对应的运营商设置，更新可以增加包括 Wi‑Fi Calling 在内的网络功能。[Apple 关于运营商设置的说明](https://support.apple.com/en-gb/109324)。

## 4. Wi‑Fi Calling 激活

Wi‑Fi Calling 激活需要同时满足数个条件：

- 运营商账户允许使用 Wi‑Fi Calling。
- SIM/eSIM profile 已经正确启用。
- 手机的运营商配置暴露了对应功能。
- 地区、语言、定位和运营商归属条件满足要求。
- 手机能够访问运营商的 IMS/ePDG 网络。
- 网络出口能够承载所需的 UDP/IPsec 流量。

Apple 的常规流程是进入“设置 → 蜂窝网络 → Wi‑Fi Calling”并启用功能。如果运营商或设备不支持，开关可能根本不会出现，或者出现后无法完成注册。[Apple 的 Wi‑Fi Calling 使用说明](https://support.apple.com/en-mide/108066)也明确说明，功能是否可用取决于运营商、设备、系统和网络条件。

这里还要区分两个状态：

1. 系统显示 Wi‑Fi Calling 开关。
2. 设备实际完成 Wi‑Fi Calling 的 IMS 注册，并能够在相应网络路径上建立通话。

本次的目标是第二种状态。

## 5. UDP 端口背后的 IKE/IPsec

实际网络建立过程中，关键路径涉及 IKE/IPsec 和运营商的 ePDG。

本次重点检查了两个 UDP 端口：

- UDP 500：常规 IKE 协商。
- UDP 4500：NAT-T 场景下的 IKE，以及 UDP 封装后的 ESP/IPsec 流量。

这里的 UDP 4500 是 IKE/IPsec 在 NAT 穿透场景下使用的封装端口，承载 IPsec 隧道流量；“语音信道”只是其中一部分。[RFC 7296 对 IKEv2 的端口和 NAT 穿透行为有明确说明](https://www.rfc-editor.org/rfc/rfc7296)。

某些代理协议在配置名称上写着“支持 UDP”，实际无法承载 Wi‑Fi Calling，原因通常是：

- 把 UDP 封装进 TCP，也就是 UDP over TCP；
- 只支持 DNS 或少数固定 UDP 服务；
- 通过服务器端转发，但没有保留端到端 UDP 行为；
- 在 NAT、MTU 或 IPv4/IPv6 转换上破坏 IPsec；
- 能建立普通连接，但不能让 IKE 重传和 NAT-T 正常工作。

因此，“端口是否开放”只覆盖第一层：需要确认实际 UDP 数据报能否往返，以及目标设备能否完成 IKE 协商和后续 IPsec 注册。

也考虑过 STUN 或 WebRTC 泄漏；Wi‑Fi Calling 不属于 WebRTC 应用，当时没有抓包证据支持这个方向，它只作为代理或虚拟定位环境中的旁支假设。可能的失败因素还包括本地地址、DNS、NAT、MTU、IPv4/IPv6 和出口地理信息等。

## 6. Android 路径：多次尝试后放弃

首先尝试了 Android 设备，但多次尝试都没有稳定拉起 Wi‑Fi Calling。

Android 设备的问题可能同时涉及：

- 厂商对 IMS 和 Wi‑Fi Calling 的限制；
- 运营商配置是否允许该设备；
- SIM Toolkit 和 carrier config 是否正确；
- 设备是否能完成运营商侧的注册。

这部分没有得到足够证据去定位单一原因，因此记录为一个实验结果：在尝试过的 Android 设备和配置组合上，Wi‑Fi Calling 没有稳定拉起；继续投入的排障成本高于更换设备的成本。

这个结果描述测试过的组合；其他 Android 设备的结论需要各自的记录。

## 7. iPhone 12 + iOS 26：功能可行，路径复杂

之后尝试了 iPhone 12 + iOS 26 的组合。

这一路径的问题在于，最新系统下的虚拟定位不够稳定。为了让部分 Apple 服务按照预期工作，还需要额外使用代理软件和 MITM 方式对部分服务进行重定向。

这条路可以继续研究，代价是引入更多变量：

- Apple 服务的域名和请求路径；
- 系统版本差异；
- 虚拟定位与服务端判断的关系；
- 代理软件对 TLS 和连接行为的影响；
- Wi‑Fi Calling 本身的 UDP/IPsec 流量是否被干扰。

目标是完成一次稳定激活；整套 Apple 服务重定向属于另一个课题，最终放弃这条路径。

## 8. iPhone SE 第二代 + iOS 16.7.2：最终成功的设备组合

最后改用一台无运营商锁的 iPhone SE 第二代，系统版本为 iOS 16.7.2。

最开始的问题是，Wi‑Fi Calling 并没有按预期出现或工作。进一步排查后，问题落在运营商配置包上，手机硬件不在怀疑范围。

设备原有的运营商配置版本为 24。从 [iniwex5/tools](https://github.com/iniwex5/tools/tree/main) 获取了 O2_Giffgaff_UK_64.bundle.ipcc，并使用爱思助手将运营商配置更新到版本 64。[该 IPCC 文件目前位于仓库主分支](https://github.com/iniwex5/tools/blob/main/O2_Giffgaff_UK_64.bundle.ipcc)。

在这组设备、iOS、9eSIM profile 和网络条件下，更新运营商配置后，Wi‑Fi Calling 的可用性发生了变化。这个结果与 Apple 关于运营商设置可以增加 Wi‑Fi Calling 支持的说明一致，适用范围限于这组条件。

另外，文件名本身是 O2/Giffgaff 配置。本文记录它在本次 CTExcel profile 实验中的兼容结果；CTExcel 官方发布和通用配置另有来源。

之后又做了两项地区相关设置：

- 系统语言调整为 English (UK)；
- 系统地区设置为 United Kingdom，并使用常规虚拟定位方式处理位置条件。

这些设置属于可能影响激活的条件；地区、系统语言、定位和网络出口在运营商流程中共同作用，单变量测试尚未完成。

## 9. 代理网络路径：UDP 声明与实际结果

在本地测试了多个常规 VPS 代理方案，但都没有完成激活。

初步候选解释包括：

1. 代理只是配置层面声明支持 UDP，实际实现是 UDP over TCP。
2. UDP 500/4500 的回包或重传被代理层丢弃。
3. NAT-T 或 IPsec 封装被中间设备破坏。
4. DNS、IPv4/IPv6 或 ePDG 选择结果不符合运营商预期。
5. 出口地理位置与手机定位、蜂窝注册状态不一致。
6. MTU 或分片处理导致隧道建立失败。
7. 本地网络地址或其他服务信息暴露，触发了运营商侧的条件判断。

目前没有抓包或运营商日志能定位单一原因，因此它们都保留为候选解释。

## 10. 最终成功路径：使用 giffgaff 漫游数据

本次成功路径实际涉及两台设备：

- **设备 A**：iPhone SE 第二代，iOS 16.7.2，无运营商锁；9eSIM 中写入并启用 CTExcel profile，负责拉起 Wi‑Fi Calling。
- **设备 B**：使用 giffgaff 漫游数据，并通过个人热点为设备 A 提供网络。

成功组合大致是：

1. 在 CTExcel 侧注册账户并获得临时号码。
2. 提交 PAC，预约原号码转入。
3. 在 9eSIM 中写入并启用 CTExcel profile。
4. 使用设备 A：iPhone SE 第二代 + iOS 16.7.2。
5. 将设备 A 的运营商配置从版本 24 更新到版本 64。
6. 设置 English (UK) 和英国地区。
7. 使用设备 B 的 giffgaff 真实漫游数据链路。
8. 设备 B 作为热点时开启“最大兼容性”。
9. 按 CTExcel 的正常流程拨打 888 完成激活。

CTExcel 官方页面列出了 888 服务入口。[CTExcel UK 官方页面](https://www.ctexcel.com/uk/home?language=en)。

“最大兼容性”会改变热点的无线兼容性和连接行为；单变量 A/B 尚未完成，可以确认的是在这组成功条件中，开启后热点路径表现更稳定。

拨打 888 属于运营商侧的激活流程；通话是否经 Wi‑Fi Calling 建立，由手机状态确认。本文记录的成功结果，是这套组合最终能够完成 Wi‑Fi Calling 的拉起和使用。

## 11. 代价：激活成功，但漫游流量很贵

这条路径的主要代价是资费。

当时使用 giffgaff 漫游数据时，实际承担的成本大约是 20p/MB。该数字来自当时账户与账单条件，其他地区、套餐和漫游状态按各自资费计算。

事后才了解到，账户中可能存在约 £10、15GB 左右的流量方案；具体套餐、适用地区和有效期以账户页面或官方资费记录为准，长期固定价格需要重新核对。giffgaff 的漫游资费会随套餐和地区变化，[官方漫游说明](https://help.giffgaff.com/en/articles/229458-everything-you-need-to-know-about-roaming-in-the-eu)可以作当前规则的参考。

这次经历留下一条成本规则：网络排障既要看协议能否打通，也要先算清失败测试的流量代价。

如果要重复类似激活流程，前置步骤包括：

- 开启消费上限；
- 确认漫游区域和费率；
- 准备合适的流量包；
- 记录激活前后的余额；
- 避免让手机在后台消耗大量漫游数据。

## 12. 最终结果

最终，CTExcel profile 在 9eSIM 上正常写入并启用。设备 A 使用 iPhone SE 第二代、iOS 16.7.2、版本 64 的运营商配置，以及英国地区相关设置；设备 B 使用 giffgaff 漫游数据提供热点。通过这套组合，Wi‑Fi Calling 成功拉起，并按 CTExcel 的正常流程拨打 888 完成激活。

这次排障的实际链条可以概括为：

~~~text
注册 CTExcel 临时号码
    ↓
提交 PAC，预约号码转入
    ↓
原 giffgaff 号码替换 CTExcel 临时号码
    ↓
CTExcel eSIM profile 写入 9eSIM
    ↓
设备 A：iPhone SE 2 + iOS 16.7.2 + 无锁机
    ↓
运营商配置 24 → 64
    ↓
English (UK) + United Kingdom 地区设置
    ↓
设备 B：giffgaff 漫游数据 + 个人热点
    ↓
UDP 500/4500 与 IMS/IPsec 注册
    ↓
拨打 888 完成运营商侧激活
~~~

这次排障说明，eSIM profile 写入成功、手机显示运营商名称、Wi‑Fi Calling 开关出现，以及真正能够完成 Wi‑Fi Calling 注册，是四个不同层次的状态。

## 13. 目前仍然未知的部分

- 9eSIM 的具体型号和固件版本；
- 9eSIM App 的版本号；
- CTExcel 的具体套餐和 profile 类型；
- iPhone SE 第二代的完整型号、运营商版本和更详细的系统构建信息；
- O2_Giffgaff_UK_64.bundle.ipcc 对应仓库的具体 commit；
- giffgaff 漫游时所在地区、接入网络和实际账单；
- VPS 测试所使用的代理协议；
- 失败时 UDP 500/4500 的抓包结果；
- Wi‑Fi Calling 成功前后的状态栏、运营商设置和系统截图。

最初“远程基站归属地”曾被列为可能影响激活的因素，但目前没有足够证据把它与漫游出口、手机定位或运营商侧策略单独区分。因此，本文只把已经确认的事实写成：设备 B 通过 giffgaff 漫游数据为设备 A 提供了成功的网络路径。

在这些信息补齐之前，本文的结论限定在这组条件：特定运营商、特定 profile、特定 iPhone、特定 iOS、特定运营商配置和特定漫游网络的组合。这组条件可以工作；其他 Android 设备、VPS UDP 代理和 9eSIM 卡片需要各自的测试。

公开内容在隐私与可复现性之间取舍：真实手机号、PAC、eSIM 二维码、激活码、ICCID、IMSI、账户截图中的完整个人信息，以及正在使用的代理地址均不公开。IPCC 文件固定到具体仓库 commit，避免只引用会变化的 main 分支。
