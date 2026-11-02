---
title: "概念-Ollama"
description: "Ollama 是本地运行大模型的最简单工具。一条命令 ollama run llama4.1 就能下载模型、启动推理服务、进入交互式对话。它把模型权重管理、量化、推理、API 服务全部封装好，用户不需要关心 GGUF 格式、CUDA 配置、tokenizer 等底层细节。"
date: 2026-07-01
category: "Ch20 推理部署"
tags: ["概念", "模型推理", "本地部署", "大模型"]
aliases: ["Ollama", "本地运行大模型", "一键部署LLM"]
prerequisites: "大模型基础,模型推理"
source: "笔记/Ch20 推理部署/概念/概念-Ollama.md"
---
## 一句话理解

**Ollama 是本地运行大模型的最简单工具**。一条命令 `ollama run llama4.1` 就能下载模型、启动推理服务、进入交互式对话。它把模型权重管理、量化、推理、API 服务全部封装好，用户不需要关心 GGUF 格式、CUDA 配置、tokenizer 等底层细节。

## 核心能力

### 1. 一键下载并运行模型

```bash
ollama run llama4.1:8b    # 下载并运行 Llama 4.1 8B
ollama run qwen3.7:14b    # 下载并运行 Qwen 3.7 14B
ollama run deepseek-v4    # 下载并运行 DeepSeek V4
```

Ollama 的模型库（ollama.com/library）托管了数百个预量化模型，用户只需指定模型名和参数量，Ollama 自动处理下载、量化配置和加载。

### 2. 本地 API 服务（OpenAI 兼容）

Ollama 启动后会暴露一个本地 HTTP API（默认 `http://localhost:11434`），接口与 OpenAI API 兼容。这意味着任何用 OpenAI SDK 写的应用，只需改 `base_url` 就能切换到本地模型。

```bash
curl http://localhost:11434/v1/chat/completions \
  -d '{"model": "llama4.1", "messages": [{"role": "user", "content": "Hello"}]}'
```

### 3. Modelfile 自定义模型

Ollama 提供 `Modelfile`，允许用户自定义系统提示词、温度参数、上下文长度等，甚至可以基于已有模型创建微调版本。

```dockerfile
FROM llama4.1:8b
PARAMETER temperature 0.7
SYSTEM "你是一个专业的代码审查助手"
```

然后用 `ollama create my-coder -f Modelfile` 生成自定义模型。

### 4. 量化支持

Ollama 默认使用 Q4_K_M 量化（4-bit），在模型质量和推理速度之间取得平衡。用户也可以指定其他量化级别。

## 2026 年支持的主流模型

| 模型系列 | 代表模型 | 参数量范围 | 适用场景 |
|---------|---------|-----------|---------|
| **Llama 4.1** | llama4.1:8b, llama4.1:70b | 8B ~ 405B | 通用对话、代码生成 |
| **Qwen 3.7** | qwen3.7:7b, qwen3.7:72b | 0.5B ~ 72B | 多语言、长文本 |
| **DeepSeek-V4** | deepseek-v4:16b, deepseek-v4:236b | 16B ~ 236B | 推理、编程、数学 |
| **Mistral Large** | mistral-large:123b | 123B | 多语言、企业级 |
| **Phi-4** | phi4:14b | 14B | 边缘设备、推理效率 |
| **Gemma 3** | gemma3:12b, gemma3:27b | 12B ~ 27B | 轻量级、移动端 |
| **Command R+** | command-r-plus:104b | 104B | RAG、工具使用 |

## Ollama vs vLLM vs llama.cpp 对比

| 维度 | **Ollama** | **vLLM** | **llama.cpp** |
|------|-----------|---------|-------------|
| **定位** | 个人本地推理工具 | 生产级推理引擎 | CPU 推理框架/库 |
| **易用性** | 极高，一条命令 | 中等，需要配置 | 中等，命令行工具 |
| **推理性能** | 中（基于 llama.cpp） | 高（PagedAttention） | 中（CPU 优化） |
| **GPU 利用率** | 一般 | 极高（Continuous Batching） | 可选（Metal/CUDA） |
| **并发能力** | 低（单用户为主） | 高（生产级） | 低 |
| **吞吐量** | 低~中 | 极高 | 低~中 |
| **API 兼容** | OpenAI 兼容 | OpenAI 兼容 | 需自行封装 |
| **量化格式** | GGUF | 多种（AWQ/GPTQ/FP8） | GGUF |
| **适用场景** | 个人开发、本地实验 | 生产部署、高并发 | 消费级硬件、CPU推理 |
| **底层依赖** | llama.cpp | 自研 | 自研 |
| **2026年状态** | 个人本地部署首选 | 开源推理引擎事实标准 | 本地生态底层基础 |

## 适用场景

### 最适合的场景

1. **个人开发者**：在本地电脑上运行开源模型，无需 GPU 服务器或云 API
2. **隐私敏感数据**：所有推理在本地完成，数据不出本机
3. **离线环境**：下载模型后完全离线运行，不依赖网络
4. **快速原型验证**：测试不同模型的效果，无需搭建复杂推理环境
5. **本地 AI 应用开发**：作为本地 AI 服务的后端，配合 Continue、Open WebUI 等工具

### 不适合的场景

1. **高并发生产环境**：Ollama 的并发能力有限，不适合面向大量用户的在线服务
2. **极致推理性能**：需要高吞吐量时，vLLM 是更好的选择
3. **纯 CPU 大模型推理**：虽然 Ollama 支持 CPU，但对于超大模型，直接使用 llama.cpp 更灵活

## 技术架构

Ollama 的核心架构分为三层：

1. **CLI 层**：用户交互界面，处理 `ollama run`、`ollama pull`、`ollama create` 等命令
2. **服务层**：后台守护进程，管理模型加载、请求队列、API 服务
3. **推理层**：底层基于 llama.cpp，负责实际的模型推理计算

```
┌─────────────────────────────────┐
│         Ollama CLI              │
│  ollama run / pull / create     │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│       Ollama Server (Daemon)    │
│  模型管理 / API 服务 / 调度      │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│       llama.cpp (推理引擎)       │
│  GGUF 加载 / CPU推理 / GPU加速   │
└─────────────────────────────────┘
```

## 2026 年生态地位

Ollama 已成为**个人本地 AI 部署的事实标准**。几乎所有面向个人开发者的 AI 工具（Continue、Open WebUI、Page Assist、AnythingLLM）都支持以 Ollama 作为本地模型后端。它与 llama.cpp 共同构成了本地 AI 推理生态的基础层。

## 相关笔记

- [[Ch20 模型推理部署]] — 模型推理部署的完整知识体系
- [[概念-vLLM]] — 生产级高吞吐推理引擎
- [[概念-llama.cpp]] — Ollama 的底层推理引擎
- [[在自己的电脑上跑 AI]] — 实践指南
- [[深挖-量化]] — 量化技术详解

## 来源

- Ollama 官方网站: https://ollama.com
- Ollama GitHub: https://github.com/ollama/ollama
- Ollama 模型库: https://ollama.com/library
- Ollama API 文档: https://github.com/ollama/ollama/blob/main/docs/api.md