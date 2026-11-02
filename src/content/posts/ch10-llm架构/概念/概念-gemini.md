---
title: "Google Gemini 模型家族"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch10 LLM架构"
tags: ["Gemini", "Google", "多模态", "长上下文", "模型家族"]
aliases: ["Google Gemini", "Gemini 模型家族", "Gemini 3.5"]
---
## 概述

Gemini 是 Google DeepMind 开发的多模态大语言模型家族，自 2023 年 12 月首次发布以来，已经发展成为最具竞争力的 AI 模型生态系统之一。Gemini 的独特优势在于其**原生多模态能力**（从一开始就设计为处理文本、图像、音频、视频和代码）和**超长上下文窗口**（最高 2M tokens）。到 2026 年，Gemini 3.5 系列已与 OpenAI GPT-5.5 和 Anthropic Claude Opus 4.8 形成三足鼎立之势。

## Gemini 模型家族演进

### 发展历程

| 版本 | 发布时间 | 关键里程碑 |
|------|----------|-----------|
| Gemini 1.0 Ultra/Pro/Nano | 2023.12 | 首次发布，原生多模态，Ultra 在 MMLU 上首次超越人类专家 |
| Gemini 1.5 Pro/Flash | 2024.02 | 1M token 上下文窗口，MoE 架构，Flash 速度大幅提升 |
| Gemini 1.5 Pro (002) | 2024.09 | 2M token 上下文，性能全面优化 |
| Gemini 2.0 Flash | 2024.12 | Agentic AI 时代，原生工具调用和代码执行 |
| Gemini 2.5 Pro | 2025.03 | Thinking 模式，推理能力大幅提升 |
| Gemini 2.5 Flash | 2025.06 | 高效推理，成本优化 |
| Gemini 3.0 Flash | 2025.10 | 第三代架构，速度与质量的新平衡 |
| Gemini 3.0 Pro | 2025.12 | 旗舰性能，复杂推理和多模态理解 |
| Gemini 3.5 Flash | 2026.03 | 最新高效模型，推理能力接近 Pro |
| Gemini 3.5 Pro | 2026.05 | 当前最强 Gemini 模型，原生多模态推理 |

### 模型定位

| 模型层级 | 定位 | 典型场景 |
|----------|------|----------|
| Ultra | 最强性能（已整合入 Pro） | 最复杂的推理、科学计算 |
| Pro | 旗舰性能与成本的平衡 | 复杂推理、代码生成、多模态分析 |
| Flash | 速度与效率优先 | 高频 API 调用、实时应用、聊天 |
| Nano | 设备端 | 手机、Chromebook 本地推理 |

## 当前主力模型 (2026)

### Gemini 3.5 Pro

| 特性 | 说明 |
|------|------|
| 架构 | 增强 MoE (Mixture of Experts)，推测超 2T 参数，活跃参数约 400B |
| 上下文窗口 | 2M tokens（输入），128K tokens（输出） |
| 多模态 | 原生支持文本、图像、音频、视频、代码 |
| 推理模式 | 支持 Thinking Mode（显式推理链）和 Direct Mode（直接回答） |
| 工具调用 | 原生 Google Search Grounding、Code Execution、Function Calling |
| 输出格式 | JSON Mode, Structured Output, 流式/非流式 |
| API 定价 | $1.25 / 1M input tokens, $10 / 1M output tokens |
| 速度 | 80-150 tokens/s (Flash), 40-80 tokens/s (Pro) |

### Gemini 3.5 Flash

| 特性 | 说明 |
|------|------|
| 定位 | 最高效的 Gemini 模型，推理能力接近 Pro |
| 上下文窗口 | 1M tokens（输入） |
| 速度 | 200-300 tokens/s |
| 成本 | $0.075 / 1M input tokens, $0.30 / 1M output tokens |
| 特色 | 支持 100 万 token 上下文 + 推理能力，性价比极高 |

## 原生多模态能力

Gemini 的核心差异化优势在于其**原生多模态**设计。不同于将图像编码器拼接在文本 LLM 上的方案（如 GPT-4V），Gemini 从训练开始就同时处理多种模态的数据。

### 支持的多模态输入

| 模态 | 支持格式 | 说明 |
|------|----------|------|
| 文本 | 纯文本、Markdown、代码 | 所有层级的标准支持 |
| 图像 | JPEG, PNG, GIF, WebP | 理解图表、截图、照片、文档扫描 |
| 音频 | MP3, WAV, FLAC, OGG | 直接处理音频波形，无需转写 |
| 视频 | MP4, MOV, AVI, WebM | 逐帧理解，支持长视频 |
| PDF | 原生 PDF 解析 | 保留文档结构、表格、图表 |

### 多模态能力对比

| 能力 | Gemini 3.5 Pro | GPT-5.5 | Claude Opus 4.8 |
|------|---------------|---------|-----------------|
| 图像理解 | 优秀 | 优秀 | 优秀 |
| 视频理解 | 最佳（原生支持，逐帧分析） | 好（抽帧） | 中（不支持视频） |
| 音频理解 | 最佳（原生波形处理） | 好（转写后处理） | 不支持 |
| PDF 解析 | 最佳（原生结构化解析） | 好 | 优秀 |
| 跨模态推理 | 最佳（原生多模态训练） | 好 | 中 |
| 多模态生成 | 图像+文本生成（Imagen 集成） | 图像生成 (DALL-E 集成) | 不支持 |
| 代码执行 | 内置 | 内置 | 内置 |

## 超长上下文窗口 (2M Tokens)

Gemini 的 2M token 上下文窗口是当前业界最大之一，相当于约 150 万英文单词或 3000 页文档。

### 超长上下文的应用场景

| 场景 | 说明 | 典型数据量 |
|------|------|-----------|
| 全代码库分析 | 将整个代码仓库放入上下文 | 500K-2M tokens |
| 多文档对比 | 同时分析数十篇论文/报告 | 1M-2M tokens |
| 视频理解 | 1 小时视频的逐帧理解 | 500K-1M tokens |
| 长会议转写 | 数小时的会议录音一次性分析 | 500K-1M tokens |
| 知识库问答 | 整个知识库直接放入上下文 | 1M-2M tokens |

### 长上下文性能

Google 的研究表明，Gemini 在超长上下文中的"大海捞针" (Needle-in-a-Haystack) 测试中表现优异：

| 上下文长度 | 针检索准确率 (Gemini 3.5 Pro) | 针检索准确率 (Gemini 3.0 Pro) |
|-----------|------------------------------|------------------------------|
| 128K | 100% | 100% |
| 512K | 99.8% | 99.5% |
| 1M | 99.5% | 99.0% |
| 2M | 99.0% | 97.0% |

## Gemini vs GPT-5.5 vs Claude Opus 4.8 对比

| 维度 | Gemini 3.5 Pro | GPT-5.5 | Claude Opus 4.8 |
|------|---------------|---------|-----------------|
| 开发商 | Google DeepMind | OpenAI | Anthropic |
| 上下文窗口 | 2M tokens | 256K tokens | 500K tokens |
| 多模态 | 原生（文本+图像+音频+视频） | 图像+文本 | 图像+文本+PDF |
| 推理能力 | 强（Thinking Mode） | 极强（o4 推理） | 极强（Extended Thinking） |
| 编码 | 强 | 极强 | 极强 |
| 创意写作 | 好 | 好 | 优秀 |
| 安全对齐 | 严格 | 中等 | 严格 |
| 速度 | 快 | 快 | 中等 |
| 成本 (input) | $1.25/1M | $1.25/1M | $3/1M |
| 成本 (output) | $10/1M | $10/1M | $15/1M |
| Google 生态整合 | 深度（Search, Workspace, Cloud） | 浅（Bing, Copilot） | 浅（AWS Bedrock） |
| 开源程度 | 部分开放（Gemma 系列） | 闭源 | 闭源 |
| 最佳场景 | 多模态分析、长文档、视频理解 | 通用推理、编程、数学 | 长文档、写作、安全敏感 |

## 2026 年 Gemini 的定位

### 核心优势

1. **原生多模态**：Gemini 是多模态能力最全面的模型，尤其擅长视频和音频的原生理解。
2. **超长上下文**：2M token 上下文窗口使 Gemini 在处理大规模文档和视频时具有独特优势。
3. **Google 生态整合**：与 Google Search、Google Workspace、Google Cloud、Android 等深度集成。
4. **成本效益**：Flash 系列以极低成本提供接近 Pro 级别的性能。
5. **Thinking Mode**：推理能力持续提升，缩小了与 o4 和 Claude Extended Thinking 的差距。

### 主要挑战

1. **推理能力**：在纯文本推理方面，Gemini 3.5 Pro 仍略逊于 OpenAI o4 和 Claude Opus 4.8 Extended Thinking。
2. **编码能力**：在复杂编程任务上，GPT-5.5 和 Claude Opus 4.8 仍有一定优势。
3. **创意写作**：Claude Opus 4.8 在写作质量和风格方面更受创作者青睐。
4. **品牌认知**：在开发者社区中，OpenAI 和 Anthropic 的品牌认知度仍高于 Google。
5. **开源生态**：虽然 Google 有 Gemma 开源系列，但影响力不如 Llama 和 Qwen。

### 典型使用场景

- **视频分析**：自动分析监控视频、体育赛事回放、教育视频内容理解
- **长文档处理**：一次性分析数百页的法律合同、研究报告、医学文献
- **多模态搜索**：结合 Google Search 对多模态信息进行综合分析
- **音频处理**：会议记录、采访分析、音乐分析
- **教育**：多模态教科书理解、视频课程辅助学习
- **企业应用**：通过 Google Cloud Vertex AI 部署，与 Google Workspace 集成

## 相关笔记

- [[Ch10 LLM 原理与架构演进]] — LLM 架构演进，Gemini 的 MoE 架构设计
- [[Ch17 多模态 AI]] — 多模态 AI 全景，Gemini 的原生多模态方案
- [[Ch22 AI 技术全景]] — AI 技术全景图，Gemini 在其中的位置
- [[概念-推理模型]] — 推理模型对比，Gemini Thinking Mode 的分析
- [[概念-DeepSeek]] — DeepSeek 系列与 Gemini 的对比
- [[概念-LLM可观测性]] — 监控 Gemini API 调用的方法

## 来源

- Google Gemini Official Page: https://deepmind.google/technologies/gemini/
- Gemini 3.5 Technical Report: https://arxiv.org/abs/2605.01234
- Gemini 2.0 Announcement: https://blog.google/technology/ai/google-gemini-2-0/
- Gemini 2.5 Pro: https://blog.google/technology/google-deepmind/gemini-2-5-pro/
- Gemini 3.0 Flash: https://blog.google/technology/ai/google-gemini-3-0/
- Gemini API Documentation: https://ai.google.dev/gemini-api/docs
- Google Vertex AI Gemini: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models
- Gemini 1.5 Technical Report: https://arxiv.org/abs/2403.05530