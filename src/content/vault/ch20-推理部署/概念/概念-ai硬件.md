---
title: "AI 硬件：GPU 不是唯一的选择"
description: "2026 年，AI 硬件市场正在经历从 NVIDIA 一家独大到多元竞争的转变。AMD MI300X、AWS Trainium、Intel Gaudi、Cerebras、Groq LPU 等替代方案正在各自的场景中证明自己的价值。选择什么硬件，取决于你的工作负载是训练还是推理、是"
date: 2026-07-01
category: "Ch20 推理部署"
source: "笔记/Ch20 推理部署/概念/概念-AI硬件.md"
---
## 一句话理解

2026 年，AI 硬件市场正在经历从 NVIDIA 一家独大到多元竞争的转变。AMD MI300X、AWS Trainium、Intel Gaudi、Cerebras、Groq LPU 等替代方案正在各自的场景中证明自己的价值。选择什么硬件，取决于你的工作负载是训练还是推理、是大规模集群还是边缘部署。

## 为什么需要替代硬件

### NVIDIA 的优势与瓶颈

NVIDIA 在 AI 训练市场占据约 90% 的份额，其 CUDA 软件生态是二十年来积累的护城河。但 NVIDIA 面临两个问题：

1. **供应紧张**：H100/B200 的交付周期长，价格高
2. **成本**：一张 H100 约 $25,000-$30,000，B200 更高，大规模集群的硬件成本极高

这给了替代硬件厂商进入市场的机会窗口。

### 芯片类型速览

| 类型 | 代表产品 | 核心特点 | 适用场景 |
|------|---------|---------|---------|
| GPU (通用图形处理器) | NVIDIA H100/B200, AMD MI300X | 通用计算，CUDA 生态 | 训练 + 推理 |
| TPU (张量处理器) | Google TPU v5p/v6 | 大规模矩阵乘法优化 | 训练 + 推理 (Google Cloud) |
| LPU (语言处理器) | Groq LPU | 超低延迟推理 | 实时推理 |
| ASIC (专用芯片) | AWS Trainium/Inferentia | 极致能效比 | 特定场景训练/推理 |
| Wafer-Scale (晶圆级) | Cerebras CS-3 | 超大规模单芯片 | 大规模训练 |
| 可编程加速器 | Intel Gaudi 3 | 通用加速 | 训练 + 推理 |

## 主流替代硬件详解

### AMD MI300X

AMD 最直接的 NVIDIA 挑战者。MI300X 是 CDNA3 架构的数据中心 GPU，2024 年发布。

| 维度 | AMD MI300X | NVIDIA H100 | NVIDIA H200 |
|------|-----------|------------|------------|
| 显存容量 | 192 GB HBM3 | 80 GB HBM3 | 141 GB HBM3e |
| 显存带宽 | 5.3 TB/s | 3.35 TB/s | 4.8 TB/s |
| FP16 算力 | 1.3 PFLOPS | 990 TFLOPS | 990 TFLOPS |
| 互联 | Infinity Fabric | NVLink 4.0 | NVLink 4.0 |
| 软件生态 | ROCm (追赶中) | CUDA (成熟) | CUDA (成熟) |
| 价格 | ~$15,000-20,000 | ~$25,000-30,000 | ~$30,000-35,000 |

AMD 的最大优势是**显存容量和带宽**——192 GB 显存可以加载更大的模型，5.3 TB/s 的带宽对推理吞吐量有直接帮助。最大劣势是软件生态：ROCm 虽然快速追赶，但相比 CUDA 的成熟度和社区支持仍有差距。2026 年，ROCm 6.x 已经支持 PyTorch、vLLM、TensorRT-LLM 等主流框架，差距在缩小。

### AWS Trainium / Inferentia

AWS 自研的 AI 芯片，仅供 AWS 云上使用。

| 芯片 | 定位 | 核心规格 | 适用场景 |
|------|------|---------|---------|
| Trainium 2 | 训练 | 最高 65 EFLOPS (集群), 96 GB HBM | 大规模分布式训练 |
| Inferentia 2 | 推理 | 最高 380 TFLOPS (12 芯片), 32 GB HBM | 低成本推理 |
| Inferentia 3 | 推理 (2026) | 更高吞吐，更低延迟 | 下一代推理 |

Trainium 的核心价值主张是**成本**：AWS 声称 Trainium 的训练成本比 GPU 实例低 30-40%。Inferentia 的推理成本更低。但限制也很明显——只能在 AWS 上使用，软件生态（Neuron SDK）比 CUDA 窄。

### Intel Gaudi 3

Intel 通过收购 Habana Labs 进入 AI 芯片市场。Gaudi 3 是 2024 年发布的第三代产品。

| 维度 | Intel Gaudi 3 | NVIDIA H100 |
|------|-------------|------------|
| 制造工艺 | 5nm | 4nm (TSMC) |
| 显存 | 128 GB HBM2e | 80 GB HBM3 |
| 互联 | 24x 200 GbE RoCE | NVLink + InfiniBand |
| 软件 | SynapseAI (PyTorch 原生) | CUDA |
| 价格 | 低于 H100 | ~$25,000-30,000 |

Gaudi 3 的独特之处在于**网络架构**：集成 24 个 200 GbE 端口，不需要额外的 NIC 就能实现大规模互联。Intel 放弃了自研编程语言，直接支持 PyTorch 原生 API，降低了迁移成本。2026 年，Intel 正在推进 Falcon Shores（融合 GPU+Gaudi 架构的下一代产品）。

### Cerebras CS-3

Cerebras 走了一条完全不同的路：**晶圆级芯片（Wafer-Scale Engine）**。一个芯片有整个晶圆那么大，集成了 4 万亿个晶体管和 90 万个计算核心。

| 维度 | Cerebras CS-3 | NVIDIA H100 (8-GPU 节点) |
|------|-------------|------------------------|
| 芯片面积 | 46,225 mm² (整片晶圆) | 814 mm² x 8 |
| 片上内存 | 44 GB SRAM | 640 GB HBM (聚合) |
| 内存带宽 | 21 PB/s | 26.8 TB/s (聚合) |
| 互联 | 片上 (零延迟) | NVLink + NVSwitch |
| 功耗 | ~23 kW | ~5.6 kW (8x 700W) |

Cerebras 的独特优势是**片上内存带宽**——21 PB/s，比 H100 的 HBM 高近 1000 倍。这意味着内存受限的操作（如 attention 中的 softmax）可以在极短时间内完成。但限制也很明显：44 GB 片上 SRAM 相对较小，需要特殊的模型分片策略。

### Groq LPU

Groq 的 LPU (Language Processing Unit) 是专门为 LLM 推理设计的芯片，以**超低延迟**著称。

| 维度 | Groq LPU | NVIDIA H100 (推理) |
|------|---------|-------------------|
| 架构 | 确定性张量流处理器 | SIMT GPU |
| 内存 | ~230 MB SRAM (per chip) | 80 GB HBM |
| 每个 token 延迟 | 极低 (<10ms) | 较高 (20-50ms) |
| 吞吐量 | 中 | 高 |
| 编译器 | 确定性编译器 (无调度开销) | 通用编译器 |
| 适合场景 | 实时交互 | 批量离线推理 |

Groq LPU 的设计哲学是**用编译器替代调度器**——所有计算在编译时确定，运行时没有动态调度开销。这使得延迟极低且可预测。但 ~230 MB SRAM 的片上内存是一大限制，处理大模型时需要大量芯片（例如 Llama 3 70B 需要约 500 个 LPU）。

### Google TPU v5p/v6

Google 的 TPU 是最早的 AI 专用芯片之一，目前已到第六代。

| 维度 | TPU v5p | TPU v6 (2025-2026) |
|------|---------|-------------------|
| 架构 | 脉动阵列 (Systolic Array) | 增强脉动阵列 |
| 互联 | ICI (Inter-Chip Interconnect) | 下一代 ICI |
| 软件 | JAX, TensorFlow, PyTorch (XLA) | 原生多框架 |
| 可用性 | Google Cloud 独占 | Google Cloud 独占 |

TPU 的独特优势是与 Google 的软件栈（JAX、XLA 编译器）深度集成，在大规模训练中表现出色。Gemini 等 Google 模型都是在 TPU 上训练的。但 TPU 只能在 Google Cloud 上使用，限制了选择范围。

## GPU vs TPU vs LPU vs ASIC：全面对比

| 维度 | GPU (NVIDIA) | TPU (Google) | LPU (Groq) | ASIC (Trainium) | Wafer-Scale (Cerebras) |
|------|-------------|-------------|-----------|----------------|----------------------|
| 灵活性 | 最高 | 高 | 低 (仅推理) | 中 | 中 |
| 训练性能 | 最高 | 很高 | N/A | 高 | 最高 (特定场景) |
| 推理延迟 | 中 | 低 | 极低 | 低 | 极低 |
| 推理吞吐 | 高 | 高 | 中 | 高 | 中 |
| 能效比 | 中 | 高 | 很高 | 最高 | 高 |
| 软件生态 | 最成熟 (CUDA) | 成熟 (JAX/TF) | 有限 | 有限 (Neuron) | 有限 |
| 云可用性 | 所有云 | 仅 Google Cloud | Groq Cloud | 仅 AWS | Cerebras Cloud |
| 购买成本 | 高 | 按时租用 | 按时租用 | 按时租用 | 按时租用 |
| 适合场景 | 通用 | Google 生态 | 实时推理 | 成本敏感 | 科学计算 |

## 2026 年：NVIDIA 的统治地位正在被挑战

2026 年 AI 硬件市场的变化：

1. **AMD 在推理市场崛起**：MI300X 的大显存和高带宽使其在 LLM 推理场景中表现优异，许多云厂商（Microsoft Azure、Oracle Cloud）开始提供 MI300X 实例
2. **自研芯片成为大厂标配**：Google (TPU)、Amazon (Trainium)、Microsoft (Maia)、Meta (MTIA) 都在自研 AI 芯片，减少对 NVIDIA 的依赖
3. **Groq 和 Cerebras 在特定场景中找到位置**：超低延迟推理和超大规模科学计算
4. **FP4/FP8 原生支持成为新硬件的标配**：B200 的 FP4、MI300X 的 FP8 原生支持，让低精度推理成为默认
5. **CUDA 护城河在变浅**：PyTorch 2.x 的 torch.compile 和 OpenAI Triton 让跨硬件编程变得更容易，减少了对 CUDA 的依赖

## 选择指南

| 场景 | 推荐硬件 | 原因 |
|------|---------|------|
| 大规模训练 (千卡级) | NVIDIA H100/B200 | CUDA 生态最成熟，分布式训练最稳定 |
| 大规模训练 (Google 生态) | TPU v5p/v6 | JAX 原生支持，成本可控 |
| 大规模推理 (高吞吐) | AMD MI300X | 大显存 + 高带宽，性价比高 |
| 实时推理 (低延迟) | Groq LPU | 确定性低延迟 |
| 成本敏感推理 | AWS Inferentia | 云上最低成本 |
| 科学计算/超大规模模型 | Cerebras CS-3 | 片上内存带宽优势 |

## 相关笔记

- [[Ch20 模型推理部署]] — 推理优化与部署方案
- [[Ch10 LLM 原理与架构演进]] — LLM 架构与计算需求
- [[Ch22 AI 技术全景]] — AI 技术全局视图
- [[概念-vLLM]] — 推理引擎与硬件利用
- [[概念-llama.cpp]] — 消费级硬件推理
- [[概念-SmoothQuant]] — 量化技术与硬件加速

## 来源

- AMD MI300X Official — https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html
- AWS Trainium/Inferentia — https://aws.amazon.com/machine-learning/trainium/
- Intel Gaudi 3 — https://habana.ai/products/gaudi3/
- Cerebras CS-3 — https://www.cerebras.net/product-system/
- Groq LPU — https://groq.com/
- Google Cloud TPU — https://cloud.google.com/tpu
- NVIDIA H100 — https://www.nvidia.com/en-us/data-center/h100/
- NVIDIA B200 — https://www.nvidia.com/en-us/data-center/b200/