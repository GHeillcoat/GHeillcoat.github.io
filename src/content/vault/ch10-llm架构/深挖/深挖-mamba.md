---
title: "深挖-Mamba"
date: 2026-07-01
updated: 2026-07-06
category: "Ch10 LLM架构"
tags: ["序列模型", "SSM", "Transformer替代", "长序列"]
aliases: ["Mamba", "状态空间模型", "Structured State Space", "Mamba架构", "Mamba", "深挖-状态空间模型"]
source: "笔记/Ch10 LLM架构/深挖/深挖-Mamba.md"
---
## 一句话理解

基于**状态空间模型 (State Space Model, SSM)** 的序列建模架构，通过在 SSM 中引入**输入依赖的选择性机制 (Selective Scan)**，实现了与 Transformer 相当的建模能力，同时将计算复杂度从 $O(N^2)$ 降至 $O(N)$，是 Transformer 最有力的替代候选之一。

## 零基础理解

想象一个 10 万字的文档，需要理解它。Transformer 的做法是：让文档中**每两个词之间都互相"打招呼"**——"你好，我是第 3 个词，你是第 89999 个词，我们之间有关系吗？" 这句话一共要做 $(10^5)^2 = 100$ 亿次"打招呼"，这也是为什么 GPT 处理超长文本时成本极高。

Mamba 的做法完全不同：它像一个人**按顺序读书**，每读到一个新词，只根据当前的状态（已经读过的内容的压缩记忆）来决定如何理解这个词，然后更新自己的状态。每增加一个 token，计算量只是增加一个常数——就像你不需要把整本书每页之间都贴一张便签，只需要持续更新你的理解。

**类比**：Transformer 是一场"圆桌会议"，每个参会者都要和所有人交流；Mamba 是一条"接力赛"，每个跑者只需要从前一棒接过棒子，加上自己的贡献，再传给下一棒。

这种"按顺序处理"听起来像 RNN/LSTM 的退化，但关键区别在于：Mamba 的 SSM 参数是**输入依赖的**——模型会根据当前 token 的内容，动态调整状态转移的规则，这赋予了它比传统 RNN 强得多的建模能力。

## 核心概念

### 1. 状态空间模型 (SSM)

状态空间模型源自控制理论，用于描述动态系统的演化。一个线性时不变 SSM 由以下方程定义：

$$
\begin{aligned}
h'(t) &= A h(t) + B x(t) \quad &\text{(状态方程)} \\
y(t) &= C h(t) + D x(t) \quad &\text{(观测方程)}
\end{aligned}
$$

其中：
- $h(t)$ 是隐藏状态（系统的"记忆"）
- $x(t)$ 是输入信号
- $y(t)$ 是输出信号
- $A$ 是状态转移矩阵（控制记忆如何演化）
- $B, C$ 是输入/输出投影矩阵
- $D$ 是前馈矩阵（通常省略）

为了在深度学习中使用，需要将连续时间 SSM **离散化**。给定一个步长 $\Delta$，通过零阶保持 (Zero-Order Hold, ZOH) 规则得到离散参数 $\bar{A}, \bar{B}$。然后整个序列可以通过**卷积模式**高效并行计算：SSM 等价于一个全局卷积核。

### 2. S4 (Structured State Space Sequence Model, 2021)

S4 是 Mamba 的前身，核心贡献是提出了一种特殊的 $A$ 矩阵参数化——**HiPPO 矩阵 (High-order Polynomial Projection Operators)**。HiPPO 矩阵使得 SSM 能够以数学上最优的方式压缩长序列的历史信息，解决了传统 SSM 在长序列上建模能力不足的问题。

HiPPO 的直觉：假设你想用一个固定维度的向量来"记住"一段无限长的信号，什么样的记忆方式是最好的？HiPPO 证明了用勒让德多项式 (Legendre Polynomials) 的系数来编码历史是最优的——这等价于一个特定的 $A$ 矩阵结构。

S4 还提出了高效的卷积计算算法，使得 SSM 在训练时可以并行化（像 Transformer 一样），在推理时又可以切换为递归模式（像 RNN 一样逐 token 生成）。

### 3. 选择性扫描 (Selective Scan) —— Mamba 的核心创新

S4 及之前的 SSM 模型都是**线性时不变 (Linear Time-Invariant, LTI)** 的：$A, B, C, \Delta$ 对所有输入 token 都相同。这意味着模型无法根据 token 内容进行"选择性关注"——它对待"的"和"量子力学"这两个词的方式完全一样。

Mamba 的核心突破是**让 $B, C, \Delta$ 成为输入的函数**（即 $B_t = s_B(x_t)$，$C_t = s_C(x_t)$，$\Delta_t = s_{\Delta}(x_t)$），其中 $s_B, s_C, s_{\Delta}$ 是小型神经网络。这使得模型可以：

- **选择性忽略**：对于不重要的 token（如"的"、"是"），$\Delta_t$ 变小，该 token 对状态的影响被抑制。
- **选择性记忆**：对于关键 token（如专有名词、核心概念），$\Delta_t$ 变大，将更多信息写入状态。
- **内容感知**：$B_t, C_t$ 根据 token 的语义内容动态调整如何从状态中读取和写入。

这种"选择性"机制是 Mamba 能够在语言建模、DNA 序列等任务上媲美 Transformer 的关键原因。

### 4. 硬件感知算法设计

Mamba 的另一大贡献是**硬件层面的优化**。选择性 SSM 不再是卷积形式（因为参数是时变的），无法直接使用 S4 的高效卷积算法。Mamba 提出了：

- **Parallel Scan (并行扫描)**：一种高效的并行前缀和算法，使得递归计算可以在 GPU 上并行化。
- **Kernel Fusion (核融合)**：将 SSM 的计算步骤融合到单个 CUDA kernel 中，避免反复读写 GPU 显存（HBM），在 SRAM 中完成关键计算。
- **Recomputation (重计算)**：前向传播时不保存中间激活值，反向传播时重新计算——类似 Flash Attention 的策略。

这些优化使得 Mamba 的实际推理速度远超同等规模的 Transformer，尤其是在长序列场景下。

## Mamba vs Transformer 对比

| 维度 | Mamba (SSM-based) | Transformer (Self-Attention) |
|---|---|---|
| **计算复杂度** | $O(N \cdot D^2)$ —— 对序列长度 $N$ 线性 | $O(N^2 \cdot D)$ —— 对序列长度 $N$ 平方级 |
| **长序列推理效率** | 极快，逐 token 递归生成，理论上无长度限制 | 需 KV Cache，序列越长缓存越大，速度越慢 |
| **训练并行性** | 通过 Parallel Scan 实现并行，但不如 Attention 直接 | 天然并行（Attention 矩阵一次性计算），训练效率极高 |
| **建模能力** | 在 1M+ token 长序列上表现出色，短序列接近 Transformer | 目前仍是短-中序列建模的 SOTA（State of the Art） |
| **生态成熟度** | 较新（2023 年底提出），库和工具链仍在建设中 | 极度成熟，PyTorch/HuggingFace/JAX/vLLM 全面支持 |
| **KV Cache** | 无需 KV Cache，仅需维护固定大小的隐藏状态 $h_t$ | 需要缓存所有历史 token 的 Key 和 Value |
| **上下文窗口** | 天然支持超长上下文（理论上无限） | 受限于训练时的位置编码和显存，扩展成本高 |
| **推理硬件需求** | 低，固定大小状态，长序列友好 | 高，KV Cache 随序列长度线性增长 |
| **2026 年应用场景** | 长文档理解、DNA/蛋白质序列、实时流式处理 | 对话、代码生成、翻译、绝大多数 NLP 任务 |

## Mamba 变体系列

### Mamba-2 (2024)

Mamba 原作者（Tri Dao & Albert Gu）提出的升级版，核心贡献：

1. **与 Attention 的理论统一**：证明了 SSM 和线性注意力本质上是同一框架（结构化掩码注意力，Structured Masked Attention, SMA）的不同特例。SSM 对应因果半可分矩阵，线性注意力对应低秩矩阵。
2. **状态空间对偶性 (State Space Duality, SSD)**：揭示了 SSM 的递归形式和 Attention 的矩阵乘法形式之间的数学对偶关系，使得模型可以在训练时用矩阵乘法（快），推理时用递归（省显存）。
3. **架构简化**：将 Mamba 的 SSM 层简化为更接近标准 Attention 的形式，进一步提升了训练效率。

### Jamba (2024)

AI21 Labs 提出，将 **Mamba + Transformer 混合**架构：

- 大部分层使用 Mamba 层（处理长距离依赖，高效）
- 每隔几层插入一个全局 Attention 层（增强局部上下文建模）
- 混合 MoE (Mixture of Experts) 进一步扩展参数规模

Jamba 证明了"混合"是当前最实用的路径：Mamba 负责长序列效率，Attention 负责短距离精确建模，两者互补而非互斥。

### 其他值得关注的变体

| 模型 | 年份 | 核心贡献 |
|---|---|---|
| **S4** | 2021 | SSM 引入 HiPPO 矩阵，提出高效卷积计算 |
| **H3** | 2022 | SSM + Attention 混合，填补 SSM 与 Attention 的差距 |
| **Hyena** | 2023 | 用长卷积替代自注意力，达到亚平方复杂度 |
| **RWKV** | 2023 | 线性注意力 + 类 RNN 架构，开源社区推动 |
| **Mamba** | 2023 | 选择性 SSM，输入依赖参数，线性复杂度 |
| **Mamba-2** | 2024 | SSD 框架，统一 SSM 与 Attention |
| **Jamba** | 2024 | Mamba + Transformer + MoE 混合架构 |
| **RetNet** | 2023 | 保留网络，训练并行（Transformer 模式）+ 推理递归（RNN 模式） |

## 2026 年定位

**Mamba 是 Transformer 最有潜力的替代方案，但短期内不会"取代" Transformer。**

**Mamba 的优势场景**：
- **超长序列**：DNA 序列建模（单条染色体可达 2.5 亿碱基对）、长文档处理、代码库级理解（整个 repo 的代码一次性建模）
- **实时推理**：流式语音识别、实时对话系统，基于固定大小状态的递归推理天然适合
- **资源受限部署**：边缘设备、手机端推理，无需 KV Cache = 显存占用恒定

**Transformer 的护城河**：
- **生态壁垒**：PyTorch、HuggingFace、vLLM、TensorRT-LLM 等全套工具链已经高度优化，Mamba 的生态还处于早期阶段
- **训练效率**：Attention 的矩阵乘法可以利用 GPU Tensor Core 的极致优化，Mamba 的 Parallel Scan 尚未达到同等水平
- **模型规模已验证**：GPT-5.5、Claude Opus 4.8、Gemini 3.5 Pro 等千亿/万亿参数模型已经验证了 Transformer 的扩展性，Mamba 的大规模扩展仍在探索中
- **混合架构可能是终局**：Jamba 等模型表明，混合 Mamba + Attention 可能比纯 Mamba 更好，这反而延续了 Transformer 的生命力

**2026 年整体判断**：Mamba 及其变体在长序列和实时推理场景已占据一席之地，但 Transformer 凭借其生态优势和已验证的扩展性，仍然是主流 LLM 的默认架构。未来更可能是"混合架构"的天下，而非某一种架构的绝对胜利。

## 相关笔记

- [[Ch10 LLM 原理与架构演进]] — LLM 架构的整体演进脉络，从 RNN 到 Transformer 到 SSM
- [[Ch09 Transformer 架构精讲]] — 自注意力机制的数学原理和计算复杂度分析
- [[深挖-ViT]] — Vision Transformer，Transformer 在 CV 领域的应用
- [[深挖-ViT]] — ViT 的深度分析，与 CNN 的对比
- [[概念-RWKV]] — 另一种线性复杂度的 Transformer 替代方案
- [[概念-Jamba]] — Mamba + Transformer 混合架构
- [[概念-Mamba]] — Mamba 的快速参考卡片

## 来源

- [Mamba: Linear-Time Sequence Modeling with Selective State Spaces (Gu & Dao, 2023)](https://arxiv.org/abs/2312.00752)
- [Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality (Dao & Gu, 2024)](https://arxiv.org/abs/2405.21060)
- [Efficiently Modeling Long Sequences with Structured State Spaces (Gu et al., 2021)](https://arxiv.org/abs/2111.00396) — S4 论文
- [Jamba: A Hybrid Transformer-Mamba Language Model (Lieber et al., 2024)](https://arxiv.org/abs/2403.19887)
- [Hungry Hungry Hippos: Towards Language Modeling with State Space Models (Fu et al., 2022)](https://arxiv.org/abs/2212.14052) — H3 论文
- [Hyena Hierarchy: Towards Larger Convolutional Language Models (Poli et al., 2023)](https://arxiv.org/abs/2302.10866)
- [RWKV: Reinventing RNNs for the Transformer Era (Peng et al., 2023)](https://arxiv.org/abs/2305.13048)
- [Mamba 官方代码仓库](https://github.com/state-spaces/mamba)
- [The Annotated S4 (Sasha Rush 的 S4 逐行解析)](https://srush.github.io/annotated-s4/)
- [A Visual Guide to Mamba and State Space Models (Maarten Grootendorst)](https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-mamba-and-state)