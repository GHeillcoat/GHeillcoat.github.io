---
title: "概念-vLLM"
description: "vLLM 是高吞吐量的开源 LLM 推理引擎，通过 PagedAttention 技术管理 KV 缓存，实现生产环境下的极致推理性能。如果说 Ollama 是个人跑模型的\"一键工具\"，vLLM 就是企业部署模型的\"涡轮引擎\"。"
date: 2026-07-01
category: "Ch20 推理部署"
tags: ["概念", "模型推理", "推理引擎", "生产部署"]
aliases: ["vLLM", "PagedAttention", "高吞吐推理引擎"]
prerequisites: "大模型基础,模型推理,GPU 计算"
source: "笔记/Ch20 推理部署/概念/概念-vLLM.md"
---
## 一句话理解

**vLLM 是高吞吐量的开源 LLM 推理引擎，通过 PagedAttention 技术管理 KV 缓存，实现生产环境下的极致推理性能**。如果说 Ollama 是个人跑模型的"一键工具"，vLLM 就是企业部署模型的"涡轮引擎"。

## 核心创新

### 1. PagedAttention：虚拟内存式的 KV 缓存管理

vLLM 最重要的创新是 **PagedAttention**（论文发表于 SOSP 2023）。它借鉴了操作系统中虚拟内存的分页机制来管理 Transformer 推理时的 KV 缓存（Key-Value Cache）。

**传统方式的问题**：自回归生成时，每个 token 的 KV 缓存需要预留连续内存，但实际使用的序列长度不确定，导致严重的显存碎片和浪费（通常浪费 60%-80% 的显存）。

**PagedAttention 的解决方案**：
- 将 KV 缓存划分为固定大小的"页"（page/block）
- 页之间不要求物理连续，通过页表映射
- 按需分配页，用完释放
- 类似于操作系统管理虚拟内存

这使得显存利用率从 20%-40% 提升到 **接近 100%**，同等显存下可以服务更多请求。

### 2. Continuous Batching（连续批处理）

传统静态批处理（Static Batching）要求同一批次的所有请求同时开始、同时结束。由于不同请求的生成长度不同，短请求要等长请求完成，GPU 利用率低。

vLLM 的 Continuous Batching 允许请求**动态加入和退出批次**。当一个请求完成生成后，立即从批次中移除，新请求立即加入，GPU 始终满负荷运行。

```
传统批处理：   [Req1 ████████████████]
               [Req2 ████░░░░░░░░░░░░] ← 等待
               [Req3 ██████████░░░░░░] ← 等待

连续批处理：   [Req1 ████████████████]
               [Req2 ████][Req4 ██████][Req5 ████]
               [Req3 ██████████][Req6 ██████████]
```

### 3. 高效显存管理

除了 PagedAttention，vLLM 还实现了：
- **Prefix Caching**：自动识别并缓存共享前缀（如 system prompt），多个请求共享
- **Quantization 支持**：支持 AWQ、GPTQ、FP8、INT8 等多种量化格式
- **Multi-LoRA**：同时加载多个 LoRA 适配器，按请求动态切换

### 4. 分布式推理

vLLM 原生支持张量并行（Tensor Parallelism）和流水线并行（Pipeline Parallelism），可跨多张 GPU 推理超大模型。

## vLLM vs TGI vs TensorRT-LLM 对比

| 维度 | **vLLM** | **TGI (Text Generation Inference)** | **TensorRT-LLM** |
|------|---------|-------------------------------------|-------------------|
| **开发者** | UC Berkeley / 社区 | Hugging Face | NVIDIA |
| **开源协议** | Apache 2.0 | HFOIL（有限制） | Apache 2.0 |
| **核心技术** | PagedAttention | 分页缓存 + 水印调度 | 图优化 + 内核融合 |
| **易用性** | 高，pip install 即用 | 高，Docker 部署 | 低，需要手动构建引擎 |
| **模型支持** | 极广（200+ 架构） | 广（主要 HF 模型） | 有限（需手动转换） |
| **吞吐量** | 极高 | 高 | 极高（理论最优） |
| **推理延迟** | 低 | 低 | 极低（内核级优化） |
| **硬件要求** | NVIDIA GPU | NVIDIA GPU | NVIDIA GPU（限定架构） |
| **社区活跃度** | 极高（2026 年事实标准） | 中等 | 低（NVIDIA 主导） |
| **API 兼容** | OpenAI 兼容 | OpenAI 兼容 | Triton Inference Server |
| **适用场景** | 通用生产部署 | HF 生态用户 | 极致性能优化场景 |

## 2026 年：vLLM 成为开源推理引擎的事实标准

2026 年，vLLM 已经确立了自己作为**开源 LLM 推理引擎事实标准**的地位：

1. **社区统治力**：GitHub Stars 超过 60k，贡献者超过 1000 人
2. **生态整合**：几乎所有 LLM 框架（LangChain、LlamaIndex、Dify）都原生支持 vLLM 作为推理后端
3. **模型覆盖**：支持 200+ 模型架构，包括 Llama 4.1、Qwen 3.7、DeepSeek-V4、Mistral Large 等
4. **企业采用**：Anthropic、Databricks、AWS SageMaker 等都在使用或集成 vLLM
5. **标准制定**：PagedAttention 已成为推理引擎的标配技术，被多个竞品模仿

## 快速部署示例

### 安装

```bash
pip install vllm
```

### 启动推理服务

```bash
# 启动 OpenAI 兼容 API 服务
vllm serve meta-llama/Llama-4.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.95
```

### 调用 API

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="meta-llama/Llama-4.1-8B-Instruct",
    messages=[{"role": "user", "content": "解释 PagedAttention"}]
)
print(response.choices[0].message.content)
```

## 核心概念：KV Cache 与显存效率

理解 vLLM 需要先理解 KV Cache 问题：

1. **自回归生成**：每生成一个 token，需要基于之前所有 token 的 Key 和 Value 矩阵
2. **KV Cache 膨胀**：批次大小 x 序列长度 x 层数 x 隐藏维度 x 2(K+V) x 2字节(FP16)
3. **示例计算**：Llama 4.1 70B, batch=8, seq_len=4096 → KV Cache 约 16GB
4. **传统方案浪费**：预留 max_seq_len 的连续空间，实际只用了 avg_seq_len，浪费 60%+
5. **vLLM 方案**：分页管理，按需分配，利用率接近 100%

## 适用场景

### 最适合的场景

1. **生产环境 API 服务**：面向大量用户提供 LLM 推理 API
2. **高并发推理**：同时处理数十到数百个请求
3. **多 GPU 分布式推理**：跨多卡推理超大模型
4. **企业级部署**：需要稳定、高性能、可扩展的推理服务

### 不适合的场景

1. **个人本地快速体验**：Ollama 更简单
2. **CPU 环境**：vLLM 仅支持 GPU
3. **非 NVIDIA GPU**：对 AMD、Apple Silicon 支持有限

## 相关笔记

- [[Ch20 模型推理部署]] — 模型推理部署的完整知识体系
- [[概念-Ollama]] — 个人本地推理的简易工具
- [[概念-llama.cpp]] — CPU 推理框架
- [[深挖-推测解码]] — 推测解码加速推理
- [[深挖-量化]] — 量化技术降低显存占用

## 来源

- vLLM GitHub: https://github.com/vllm-project/vllm
- vLLM 官方文档: https://docs.vllm.ai
- PagedAttention 论文 (SOSP 2023): https://arxiv.org/abs/2309.06180
- vLLM Blog: https://blog.vllm.ai