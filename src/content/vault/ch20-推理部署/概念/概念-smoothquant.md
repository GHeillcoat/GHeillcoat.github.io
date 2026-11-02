---
title: "SmoothQuant: 平滑量化消除激活异常值"
date: 2026-07-06
category: "Ch20 推理部署"
source: "笔记/Ch20 推理部署/概念/概念-SmoothQuant.md"
---
## 一句话理解

SmoothQuant 解决 LLM 量化的核心难题：激活值（activation）中存在少数异常大的值（outlier），这些异常值让 INT8 量化几乎不可用。SmoothQuant 通过数学上等价的"平滑"变换，将量化的难度从激活迁移到权重，使 INT8 量化在几乎不损失精度的情况下可行。

## 问题背景：为什么激活量化这么难

### 权重量化 vs 激活量化

LLM 推理的瓶颈在 GPU 显存带宽。量化可以减少模型大小，但传统的量化方法只对权重做 INT8，对激活值仍然保持 FP16——因为激活值太难量化。

| 维度 | 权重量化 (W8) | 激活量化 (A8) |
|------|-------------|-------------|
| 值分布 | 均匀、平滑 | 存在极端异常值 |
| 量化难度 | 低 | 高 |
| 常见方案 | GPTQ, AWQ, per-channel | 此前无有效方案 |
| 无损量化 | 2023 年已成熟 | 2023 年 SmoothQuant 突破 |

### 激活异常值的特征

在 LLM 的激活值中，约 0.1% 的值是异常值——它们的绝对值比 99.9% 的其他值大 100 倍以上。这些异常值出现在固定的通道（channel）上，且位置跨 token 保持一致。

```
Token 1:  [0.1, 0.2, 0.05, 0.3,  ..., 150.0, 0.4, 0.15]
Token 2:  [0.12, 0.18, 0.06, 0.28, ..., 145.0, 0.42, 0.13]
Token 3:  [0.09, 0.22, 0.04, 0.32, ..., 152.0, 0.38, 0.16]
                                        ↑
                                    异常值出现在同一通道
```

如果直接对激活值做 INT8 量化，量化因子（scale）会被异常值撑得很大，导致 99.9% 的正常值在量化后全部变成 0 或很小的值，信息完全丢失。

## SmoothQuant 的核心思想

### 数学等价变换

SmoothQuant 利用了矩阵乘法的线性性质：

$$
Y = X \cdot W
$$

其中 $X$ 是激活矩阵（量化困难），$W$ 是权重矩阵（量化容易）。

SmoothQuant 引入一个平滑因子（smoothing factor）$s \in \mathbb{R}^{C}$，其中 $C$ 是通道数：

$$
Y = (X \cdot \text{diag}(s)^{-1}) \cdot (\text{diag}(s) \cdot W)
$$

即：

$$
Y = \hat{X} \cdot \hat{W}
$$

其中：
- $\hat{X} = X \cdot \text{diag}(s)^{-1}$：激活值被"平滑"了，异常值被缩小
- $\hat{W} = \text{diag}(s) \cdot W$：权重被相应放大，但权重原本分布就很均匀，放大了也不影响量化

**关键洞察**：将量化的难度从激活迁移到权重。权重本身就容易量化，所以放大后仍然可以 INT8 量化。

### 平滑因子 $s$ 的计算

平滑因子 $s_j$ 对第 $j$ 个通道的计算方式：

$$
s_j = \max(|X_j|)^{\alpha} / \max(|W_j|)^{1-\alpha}
$$

其中 $\alpha$ 是迁移强度（migration strength），控制将多少量化难度从激活迁移到权重：

- $\alpha = 0.5$：激进迁移，激活和权重各承担一半
- $\alpha = 0.3$：保守迁移，更多保留在激活侧
- 论文推荐 $\alpha = 0.5$ 作为默认值

## SmoothQuant vs ZeroQuant vs LLM.int8()

### 三种量化方案对比

| 维度 | SmoothQuant | ZeroQuant | LLM.int8() |
|------|-----------|-----------|------------|
| 发布时间 | 2023 (ICML) | 2022 (NeurIPS) | 2022 (ICML) |
| 核心方法 | 平滑迁移 + INT8 | per-token + per-channel INT8 | 混合精度分解 |
| 激活量化 | W8A8 (INT8) | W8A8 (INT8) | 异常值 FP16 + 其余 INT8 |
| 权重量化 | INT8 per-channel | INT8 per-channel | INT8 |
| 精度损失 | 几乎无损 (<0.5%) | 轻微损失 (<1%) | 完全无损 |
| 推理加速 | 1.5-2x | 1.3-1.7x | 几乎无加速 |
| 硬件兼容 | 通用 GPU | 需要 custom kernel | 需要 custom kernel |
| 实现难度 | 低 | 中 | 高 |

### 各方案详解

**LLM.int8()**：不改变激活值分布，而是识别出异常值所在的 token 和 feature，对这些异常值使用 FP16 矩阵乘法，其余 99.9% 使用 INT8。优点是数学上完全等价（无精度损失），但缺点是混合精度导致计算效率低——FP16 部分拖慢了整体速度，实际部署中几乎没有加速效果。

**ZeroQuant**：使用 per-token 量化（每个 token 独立计算 scale）和 per-channel 量化（每个通道独立计算 scale），通过 group-wise 量化进一步细粒度控制。但问题在于，per-token 量化需要一个特殊的 kernel 来实现高效的 INT8 矩阵乘法，部署成本高。

**SmoothQuant**：不需要特殊的 kernel，不需要混合精度，直接使用标准的 INT8 GEMM。通过数学上等价的平滑变换，在保持精度的同时实现真正的 W8A8 推理加速。这是它最大的实用优势。

### 2023-2024 量化技术演进全景

| 技术 | 年份 | 位数 | 核心思路 | 精度保留 | 部署难度 | 代表框架 |
|------|------|------|---------|---------|---------|---------|
| GPTQ | 2023 | W4/W8 | 基于 OBQ 的逐层量化 | 高 (W4 98%+) | 中 | AutoGPTQ |
| AWQ | 2023 | W4 | 权重重要性感知量化 | 高 (W4 98%+) | 低 | vLLM, TGI |
| SmoothQuant | 2023 | W8A8 | 平滑迁移激活到权重 | 高 (W8A8 99%+) | 低 | vLLM, TensorRT-LLM |
| ZeroQuant | 2022 | W8A8 | per-token + per-channel | 中 (W8A8 98%+) | 高 | DeepSpeed |
| LLM.int8() | 2022 | W8A8混合 | 异常值 FP16 分解 | 完美 (100%) | 高 | HuggingFace |
| QLoRA | 2023 | NF4 | 4-bit NormalFloat + 双重量化 | 高 (NF4 97%+) | 低 | PEFT, bitsandbytes |
| AQLM | 2024 | 2-bit | 加法量化 + 码本 | 中 (2-bit 95%+) | 高 | 学术 |
| QuIP# | 2024 | 2-bit | 非相干处理 + 矢量量化 | 中 (2-bit 96%+) | 高 | 学术 |
| HQQ | 2024 | 1-8 bit | 无数据校准快速量化 | 中 | 低 | HuggingFace |
| FP8 (NVIDIA) | 2024 | FP8 | 原生 FP8 硬件支持 | 高 (FP8 99%+) | 极低 | TensorRT-LLM, vLLM |

## 2026 年：量化的现状

2026 年，量化格局已经清晰分层：

- **W4A16** (AWQ/GPTQ)：消费级 GPU 部署的主流方案，4-bit 权重 + 16-bit 激活
- **W8A8** (SmoothQuant/FP8)：服务端部署的主流方案，H100/B200 原生 FP8 支持让 SmoothQuant 的软件平滑不再是必须，但 SmoothQuant 的数学洞察仍然影响 FP8 量化方案的设计
- **W2A16** (AQLM/QuIP#)：学术前沿，2-bit 量化在特定场景下可用，但尚未成为工业标准
- **FP4**：NVIDIA B200 引入原生 FP4 支持，2026 年 QLoRA 的 NF4 和原生 FP4 开始融合

SmoothQuant 的核心贡献不是具体算法，而是**"将量化难度从激活迁移到权重"的数学洞察**——这个洞察影响了后续所有 W8A8 方案的设计思路。

## 相关笔记

- [[深挖-量化]] — 量化技术的完整体系
- [[深挖-模型量化]] — 量化方法深入对比
- [[深挖-QLoRA]] — 4-bit 量化的微调方案
- [[Ch20 模型推理部署]] — 推理优化与部署
- [[概念-vLLM]] — 推理引擎中的量化支持
- [[概念-llama.cpp]] — 消费级量化推理
- [[概念-AWQ]] — 权重重要性感知量化

## 来源

- Xiao et al., "SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models" (ICML 2023) — https://arxiv.org/abs/2211.10438
- Dettmers et al., "LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale" (NeurIPS 2022) — https://arxiv.org/abs/2208.07339
- Yao et al., "ZeroQuant: Efficient and Affordable Post-Training Quantization for Large-Scale Transformers" (NeurIPS 2022) — https://arxiv.org/abs/2206.01861
- Frantar et al., "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers" (ICLR 2023) — https://arxiv.org/abs/2210.17323
- Lin et al., "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration" (MLSys 2024) — https://arxiv.org/abs/2306.00978
- NVIDIA TensorRT-LLM SmoothQuant Documentation — https://github.com/NVIDIA/TensorRT-LLM