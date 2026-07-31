# 附录：未决语义与最小实验路线

本文把尚未闭环的问题留在可复现实验中，不用纹理命名、PSO 名称或单张差分图替代语义证明。采集状态与所需事件见 [CAPTURE_TODO](/research/wuwa-xigelika-rendering-protocol/capture-todo.md)。

优先级含义：

- `P0`：直接阻塞主着色协议或会改变多个模块解释，优先闭环。
- `P1`：影响单个材质族或单个后处理阶段，应在主协议稳定后验证。
- `P2`：属于下游迁移与视觉等价验证，依赖 P0/P1 的语义边界。

所有 A/B 实验都必须固定相机、姿态、动画帧、灯光、曝光、色彩管理、分辨率与裁剪；一次只改变一个变量。原始输出、实验参数、差分指标和失败结果都要保留。

| 议题 | 当前边界 | 优先级 | 最小实验 | 通过标准 | 结果回填 | CAPTURE_TODO |
|---|---|---:|---|---|---|---|
| RGID high nibble | 已确认可从原始 RGID 字节拆出 high/low nibble；high nibble 的业务语义仍为 `unknown`。 | P1 | 选 Cloth、Down、Up 中 high nibble 非零且 low nibble 相同的像素；固定所有输入，仅对 high nibble 做原值/清零/单值扫描，并保存对应 GBuffer 与最终 scene color。 | 同一像素域内出现可重复、与 high nibble 值一致的下游分支或输出变化；若全程无变化，也要记录测试范围，不能据此泛化为“未使用”。 | `data/rgid-summary.json`、claim ledger、逐值 A/B metrics。 | [总采集清单](/research/wuwa-xigelika-rendering-protocol/capture-todo.md) |
| Normal 的 N.B / N.A | 已确认 N.R/N.G 可用于 XY 重建演示；B/A 的消费者与语义未闭环。 | P1 | 保持 N.R/N.G、UV、材质参数不变，分别将 B、A 置为 0/0.5/1；在同一 draw 上导出 MRT、最终光照与 pixel history。 | 能定位到具体 shader 指令或稳定输出差异，并区分 B、A 各自作用；无法定位时保持 `unknown`，不得用常见法线贴图习惯补名。 | normal channel metrics、shader-debug 记录、claim ledger。 | [总采集清单](/research/wuwa-xigelika-rendering-protocol/capture-todo.md) |
| RT1.B consumer | EID 541 的 RT1.B 写入与实际像素差分已确认；消费事件和业务语义仍为 `unknown`。 | P0 | 对同一头脸像素执行 pixel history / shader debug；在 EID 541 后把 RT1.B 受控覆写为 0 与 1，追踪 EID 560、582、1377 的读取和输出变化。 | 建立“EID 541 写入 → 明确 SRV/寄存器读取 → 具体指令/分支 → 可复算输出变化”的完整链；只看到相关性不算通过。 | `data/figure-metrics/F3-2.json`、consumer trace、claim ledger。 | [TODO-RT1B-CONSUMER](/research/wuwa-xigelika-rendering-protocol/capture-todo.md#todo-rt1b-consumer) |
| Bangs PS 差异 | EID 560 与 582 的输出增量域已确认，但不能据此直接把两者命名成某种美术语义。 | P0 | 对两事件的 PS hash、DXIL、root signature、SRV/CBV、stencil predicate 和同一 MRT 增量做逐项差分；在可共用的边界像素上各做一次 shader debug。 | 明确哪些差异来自 shader 代码、常量、纹理绑定、stencil 域或 section；每个结论都能回指指令、绑定或像素指标，不把互斥域误写为同像素串行覆盖。 | shader-family diff、binding diff、F3-3/F3-4 metrics。 | [F3 已完成采集项](/research/wuwa-xigelika-rendering-protocol/capture-todo.md#已完成f3-stencil--bangs) |
| Outline VS | 已确认 outline 事件与 section/index 范围；顶点扩张空间、方向和宽度公式仍为 `unknown`。 | P0 | 补导出 EID 599/608/619/631/642/653 的 VS DXIL 与 VS 输入/输出；固定骨骼姿态，比较 baseline 与 outline event 的同顶点位置、法线、切线和裁剪空间坐标。 | 从指令与同顶点数值共同确认扩张所处空间、方向来源、宽度输入及符号；至少两个不同 section 复现同一规则。 | VS trace、逐 section vertex delta、公式的 fidelity 标记。 | [TODO-F6-OUTLINE-ACTUAL](/research/wuwa-xigelika-rendering-protocol/capture-todo.md#todo-f6-outline-actual) |
| Kuro ID 12 / 13 | ID 12/13 目前只可作为候选 surface/outline 路由；实际 GBuffer 通道和真实像素域尚未闭环。 | P0 | 在 outline build-up 的同资源相邻事件间导出所有 MRT；先由 DXIL/output signature 定位 ID 通道，再对真实字节做 12/13 离散 mask，并检查 Kuro resolve 的读取分支。 | 在真实 GBuffer 中复核 ID 12 与 13，mask 与 outline-only 增量空间一致，并在 resolve 指令中定位各自处理；缺一项即不提升为 `confirmed`。 | ID mask、事件差分、resolve branch trace。 | [TODO-F6-OUTLINE-ACTUAL](/research/wuwa-xigelika-rendering-protocol/capture-todo.md#todo-f6-outline-actual) |
| unnamed MainPS | 可通过事件、shader hash 和资源读写识别候选，但名字本身不提供功能语义。 | P1 | 从候选事件的 shader hash 出发，记录 input/output signature、SRV/CBV、UAV/RT、dispatch/draw 维度及前后资源差分；选一个变化像素做 debug。 | 同一 shader hash 在重复帧中保持稳定角色，且资源 lineage、指令行为和输出差分共同支持一个最小职责描述；否则继续使用 hash/事件编号。 | shader identity card、resource lineage、claim ledger。 | [总采集清单](/research/wuwa-xigelika-rendering-protocol/capture-todo.md) |
| SSR / reflection composite | Kuro baseline 已有；SSR intermediate 与 reflection composite 的 raw 输出仍待补。 | P1 | 固定同一帧，导出 EID 1421 的 `ResourceId::1430965` 和 EID 1432 写回的 `ResourceId::1430956`；验证 1432 的读取绑定，生成共享 HDR 范围的 before/intermediate/after/diff。 | 资源身份、尺寸、格式和 read-after-write 链全部一致；差分只陈述真实观察到的贡献，并记录无变化区域。 | F8 metrics、resource binding trace、HDR display 参数。 | [TODO-F8-SSR-REFLECTION](/research/wuwa-xigelika-rendering-protocol/capture-todo.md#todo-f8-ssr--reflection) |
| Blender 固定条件 A/B | 当前工作是语义/行为重建，不是原 HLSL 恢复，也未证明 pixel parity。 | P2 | 冻结游戏参考 ROI 与 Blender 相机、姿态、灯光、世界、曝光、色彩变换和采样；按 RGID、normal、HM/HN/HR、outline、reflection 逐模块做单变量 off/on。 | A/B 可严格配准、共享显示范围、差分可复算；每个模块分别标注 `exact`、`approximation` 或 `unresolved`，且没有跨模块同时调参。 | Blender render manifest、模块 metrics、最终 fidelity 表。 | [TODO-BLENDER-AB](/research/wuwa-xigelika-rendering-protocol/capture-todo.md#todo-blender-ab) |

## 停止条件

出现以下任一情况时，不继续扩大解释范围：

1. 不能固定实验条件或不能保存原始 before/after。
2. 资源、事件、通道或 shader hash 无法唯一锚定。
3. 差分依赖 resize、warp、独立自动曝光或不同色彩变换。
4. 只有“看起来像”的相关性，没有指令、绑定、真实像素或受控 A/B 支持。

未通过的实验不是空结果：它应作为 `unknown` 或 `unresolved` 回填，并保留最小复现信息。
