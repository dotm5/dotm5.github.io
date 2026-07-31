# Capture / Experiment TODO

本清单区分已经由离线 RenderDoc replay 完成的采集义务与仍需补采的项目。`completed-from-offline-replay` 表示 raw 输入已经存在；由这些输入生成最终 plate 不再属于 capture 缺口。

## 已完成：F3 Stencil / Bangs

### F3-1：Stencil 演化

- Status：`completed-from-offline-replay`
- Events：503 → 519 → 530 → 541 → 560 → 582
- Resource：Depth/Stencil `ResourceId::1430934`
- Channel：Stencil
- Source：
  - `fig/raw/capture/eid-503/stencil.png`
  - `fig/raw/capture/eid-519/stencil.png`
  - `fig/raw/capture/eid-530/stencil.png`
  - `fig/raw/capture/eid-541/stencil.png`
  - `fig/raw/capture/eid-560/stencil.png`
  - `fig/raw/capture/eid-582/stencil.png`
- Before/after nodes：普通 Up 表面 → Eye writer → Face writer → Bangs RT1.B control → Bangs partition A → Bangs partition B
- Crop：一次确定角色头脸/刘海 ROI，六个面板使用相同整数坐标
- Display：离散 nearest-neighbor palette；不得连续插值
- Pass criteria：六张输入均为 2560×1440；裁剪坐标一致；像素值按原 Stencil byte 分类；图注说明不能单凭颜色命名所有 bit

### F3-2：EID 541 RT1.B Before / After / Diff / Zoom

- Status：`completed-from-offline-replay`
- Events：Before = 530；After = 541
- Resource：RT1 `ResourceId::1430951`
- Channel：B
- Source：
  - `fig/raw/capture/eid-530/rt01.png`
  - `fig/raw/capture/eid-541/rt01.png`
- Before/after nodes：Face writer 完成后 → Bangs control write 完成后
- Crop：同一头脸/刘海 ROI；Zoom 必须是该 ROI 的整数子区域
- Display：Before/After 共用原始显示范围；Diff 为确定性绝对差，显示上限使用 p99.5；不做静默 resize、crop 或 warp
- Pass criteria：源尺寸相同；ResourceId 与通道相同；差分能复算；metrics JSON 记录 nonzero ratio、MAE、RMSE、max、p99.5；图注只声称“RT1.B control write”

### F3-3：EID 560 / 582 可观测 output-change coverage

- Status：`completed-from-offline-replay`
- Event pairs：
  - 560 的 pre-state：EID 541 后
  - 582 的 pre-state：supplemental EID 571 后
- Resources：两组事件的同资源 MRT0–MRT6
- Channel：每个可读 attachment 的 RGBA 字节；任一通道变化后再跨 attachment 求并集
- Source：
  - `fig/raw/capture/eid-541/rt00..rt06.png`
  - `fig/raw/capture/eid-560/rt00..rt06.png`
  - `fig/raw/capture/eid-571/rt00..rt06.png`
  - `fig/raw/capture/eid-582/rt00..rt06.png`
- Crop：与 F3-1 相同
- Display：560-only `#E69F00`；582-only `#0072B2`；overlap `#CC79A7`；neither `#D9D9D9`
- Pass criteria：同资源精确对齐、逐字节绝对差、二值 mask 使用 nearest-neighbor；图注必须写明“可观测输出变化”，不得称完整 tested coverage 或 invocation mask
- Known limitation：EID 582 的 RT3 导出为零字节并被排除；写回同值的 fragment 也会被差分漏掉

### F3-4：EID 560 / 582 Event Output

- Status：`completed-from-offline-replay`
- Events：560、582
- Resources：
  - RT0 `ResourceId::1430956`
  - RT1 `ResourceId::1430951`
  - RT2 `ResourceId::1430954`
  - RT3 `ResourceId::1430953`
  - RT4 `ResourceId::1430939`
  - RT5 `ResourceId::1430940`
  - RT6 `ResourceId::1430952`
- Channels：按相同 MRT 和相同 RGBA/channel 进行比较；不得跨 MRT 组合
- Source：`fig/raw/capture/eid-560/rt00..rt06.png`、`fig/raw/capture/eid-582/rt00..rt06.png`
- Crop：与 F3-1 相同
- Display：每个被选 MRT 使用共享范围；离散/掩码通道使用 nearest-neighbor
- Pass criteria：最终 figure manifest 明确写出所选 ResourceId、通道、范围和“不证明什么”；若没有单个 MRT 能直接代表合成结果，正文必须说明而不能替换概念

## 已完成：F7 Standard Deferred / Kuro Toon 分流

### F7-1：1363 / 1377 Tested Domains

- Status：`completed-from-offline-replay`
- Events：1363、1377
- Resource：Depth/Stencil `ResourceId::1430934`
- Channel：Stencil
- Predicates：
  - 1363：`(S & 0x02) == 0x00`
  - 1377：`(S & 0x02) == 0x02`
- Source：
  - `fig/raw/capture/eid-1363/stencil.png`
  - `fig/raw/capture/eid-1377/stencil.png`
- Crop：固定角色全身 ROI，另设一个相同头脸局部 ROI
- Display：两种互斥颜色与透明背景；不使用暗色 dashboard
- Pass criteria：实际 Stencil byte 经 predicate 计算；两个 mask 在同一输入域上互斥；图注不得写成同像素串行覆盖

### F7-2：1363 / 1377 Branch Output

- Status：`completed-from-offline-replay`
- Events：1363、1377
- Resource：Scene color `ResourceId::1430956`
- Channel：linear RGBA
- Source：
  - `fig/raw/capture/eid-1363/rt00.exr`
  - `fig/raw/capture/eid-1377/rt00.exr`
- Before/after nodes：standard-domain event output 与 Toon-domain event output；不是同像素 A/B
- Crop：同一角色 ROI 与相同整数坐标
- Display：共享 HDR normalization；若生成 absolute diff，必须同时显示互斥域 mask
- Pass criteria：EXR 尺寸、通道和显示变换一致；图注明确“不同 stencil domain outputs”，不声称 1377 覆盖 1363 的同一角色像素

## 待补：F6 Outline / ID 12–13

### TODO-F6-OUTLINE-ACTUAL

- Status：`pending-capture`
- Events：baseline 582；outline 599、608、619、631、642、653
- Candidate resources：`ResourceId::1430956`、`1430951`、`1430954`、`1430953`、`1430939`、`1430940`、`1430952`
- Required channel：先由 output signature / DXIL 确认实际 shading ID 通道；在确认前记为 `unknown`，不得猜测
- Before/after nodes：
  - Off / baseline：EID 582 后
  - Per-section build-up：599 → 608 → 619 → 631 → 642 → 653
  - Composite：EID 653 后
- Crop：至少固定头发边缘、脸轮廓、布料边缘三个 ROI
- Display：ID 使用离散 nearest-neighbor；edge diff 使用相同视口、裁剪、缩放和共享范围
- Pass criteria：
  1. 实际 GBuffer 中能复核 surface ID 12 与 outline ID 13；
  2. outline-only 来自同资源的真实 before/after，不是手绘轮廓；
  3. 逐 section 结果与六个已确认索引范围对应；
  4. 图注仍把 VS 扩张公式标为 unknown

## 待补：F8 SSR / Reflection

### TODO-F8-SSR-REFLECTION

- Status：`pending-capture`
- Events：Kuro baseline 1377；SSR 1421；reflection composite 1432
- Resources：
  - 1377 result：`ResourceId::1430956`，已有 `fig/raw/capture/eid-1377/rt00.exr`
  - 1421 SSR intermediate：`ResourceId::1430965`，`R16G16B16A16_FLOAT`，2560×1440
  - 1432 composite output：`ResourceId::1430956`，线性 scene color
- Channels：linear RGBA；若只展示亮度或 alpha，必须同时保留 RGBA 源并在 manifest 记录操作
- Before/after nodes：Kuro Toon result → SSR intermediate → reflection composite
- Crop：固定角色全身 ROI，并为高反射部件选择一个整数局部 ROI
- Display：三个面板共用线性色彩管理；差分使用确定性 absolute diff 与 p99.5 显示上限
- Pass criteria：
  1. 1421 输出资源身份、尺寸和格式与结构化记录一致；
  2. 1432 确认读取 1430965 并写回 1430956；
  3. 所有面板同 ROI、无 rescale/warp；
  4. 只陈述实际观察到的贡献，不泛化“所有角色材质都有明显 SSR”

## 待补：RT1.B 消费语义

### TODO-RT1B-CONSUMER

- Status：`pending-debug-experiment`
- Events：541 writer；560/582 surface consumers；1377 Toon resolve candidate
- Resource：RT1 `ResourceId::1430951`
- Channel：B
- Required experiment：pixel history、shader debug 或受控 0/1 override
- Fixed conditions：相机、姿态、动画帧、灯光、曝光、后处理和输出尺寸
- Pass criteria：建立从 EID 541 写入到具体 consumer 指令/输出变化的闭环；在此之前业务语义保持 unknown

## 待补：Blender 固定条件 A/B

### TODO-BLENDER-AB

- Status：`pending-reconstruction-validation`
- Events：不适用；这是离线重建验证
- Resources：
  - 游戏参考：冻结的角色 frame/ROI 与线性或明确显示变换后的输出
  - Blender：同尺寸 EXR/PNG 及完整色彩管理记录
- Channels：beauty RGB、normal、RGID region、hair highlight、outline mask；按模块分别输出
- A/B nodes：
  - ToonCommon：低 nibble region off/on、normal XY flat/reconstructed
  - ToonHair：HM/HN/HR 各自 ablation
  - Outline：off/on 与 outline-only
  - Final：material-only / lighting / reflection / color-managed composite
- Fixed conditions：相机内外参、分辨率、骨骼姿态、灯光方向和强度、世界环境、曝光、Filmic/AgX/自定义 transform、采样数
- Pass criteria：
  1. 每次只改变一个变量；
  2. A/B 可配准且共享显示范围；
  3. 差分可由源图确定性复算；
  4. 结果分别标记 exact、approximation 或 unresolved；
  5. 未达到固定条件前不得声称 pixel parity 或原 HLSL 复刻
