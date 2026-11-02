---
title: "概念-Embedding模型"
date: 2026-07-01
updated: 2026-07-06
category: "Ch13 RAG"
tags: ["embedding", "向量", "语义搜索", "检索增强"]
aliases: ["Embedding", "嵌入模型", "向量表示模型", "Embedding 模型", "概念-BiEncoder"]
prerequisites: "机器学习基础,自然语言处理"
source: "笔记/Ch13 RAG/概念/概念-Embedding模型.md"
---
## 一句话理解

将文本、图像、音频等非结构化数据映射为**稠密向量**（Dense Vector）的模型。语义相近的输入在向量空间中距离近，语义不相关的输入距离远。

## 零基础理解

给每个词、每句话分配一个"坐标"——比如一个包含768个数字的数组。意思相近的词，坐标也相近。"苹果手机"和"iPhone"在向量空间里几乎重叠；而"苹果手机"和"香蕉"则相距很远。Embedding模型就是负责学习这种坐标映射的引擎。

## 核心概念

```mermaid
graph LR
    Text[文本/图片/音频] --> Model[Embedding 模型]
    Model --> Vector["稠密向量<br/>[0.23, -0.45, 0.78, ...]"]
    Vector --> Space[向量空间]
    Space --> Semantic["语义相近 = 距离近<br/>语义不同 = 距离远"]
```

### 1. 稠密向量 vs 稀疏向量

最常见的场景。将一段文本（词、句子、段落、文档）转换成一个固定维度的向量。典型流程：

1. Tokenizer 将文本切分为 token
2. 模型（通常是 Transformer 架构）处理 token 序列
3. 取最后一层的某种聚合（如 CLS token、mean pooling）作为输出向量
4. 也可使用 L2 归一化，使所有向量落在单位超球面上

### 图像 Embedding (CLIP)

OpenAI 的 CLIP（Contrastive Language-Image Pre-training）将图像和文本映射到**同一个向量空间**。这意味着你可以用文字搜索图片，也可以用图片搜索文字。CLIP 的训练方式是图文对比学习：拉近匹配的图文对，推远不匹配的。

### 多模态 Embedding

2025-2026 年的趋势是将文本、图像、音频、视频统一映射到同一个语义空间。代表性工作包括：

- **ImageBind** (Meta): 6 种模态绑定到同一个空间
- **Jina CLIP v2**: 文本+图像联合 embedding
- **Uni-MoE**: 多模态混合专家模型

### Embedding 维度

维度越高，理论表达能力越强，但存储和计算成本也越高：

| 维度 | 典型模型 | 适用场景 |
|------|---------|---------|
| 768 | bge-base, all-MiniLM-L6 | 轻量部署、边缘设备 |
| 1024 | bge-large, Cohere embed v3 | 通用场景、多语言 |
| 1536 | text-embedding-ada-002 | 旧版 OpenAI |
| 3072 | text-embedding-3-large | 高质量通用 |
| 4096 | E5-mistral | 高精度、学术研究 |
| 8192 | Jina embeddings v3 | 长文本、多任务 |

## 2026 年主流 Embedding 模型对比

| 模型 | 开发者 | 维度 | 最大输入长度 | 多语言 | 开源 | MTEB 平均分 | 特点 |
|------|--------|------|-------------|--------|------|-----------|------|
| text-embedding-3-large | OpenAI | 3072 (可缩减) | 8191 tokens | 是 | 否 | 64.6 | 维度可调，API 成熟，生态完善 |
| bge-large-v1.5 | BAAI | 1024 | 512 tokens | 中英为主 | 是 | 64.2 | 中文效果最佳，可本地部署 |
| Jina embeddings v3 | Jina AI | 8192 (可缩减) | 8192 tokens | 是 | 是 | 65.0 | 支持任务特定 LoRA，长文本处理强 |
| Cohere embed v3 | Cohere | 1024 | 512 tokens | 是 (100+ 语言) | 否 | 64.0 | 多语言最优，压缩类型可选 |
| E5-mistral | Microsoft | 4096 | 32768 tokens | 是 | 是 | 66.6 | 基于 Mistral-7B，长文本最强 |
| GTE-Qwen3-7B | Alibaba | 3584 | 32768 tokens | 是 | 是 | 66.3 | 基于 Qwen3，中文长文本优秀 |

> 注：MTEB (Massive Text Embedding Benchmark) 分数截至 2025 年底，具体数值可能因评测版本有差异。

## 选型建议

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| 中文为主 | bge-large-v1.5 或 GTE-Qwen3 | 中文语义理解最佳 |
| 多语言 (100+ 语言) | Cohere embed v3 | 多语言覆盖面最广 |
| 长文本 (文档级) | E5-mistral 或 Jina v3 | 32K token 上下文 |
| 通用、快速上线 | text-embedding-3-large | API 调用，无需运维 |
| 本地部署、数据安全 | bge-large-v1.5 或 Jina v3 | 开源，可私有化 |
| 高精度、不计成本 | E5-mistral | MTEB 榜首 |

## Embedding 模型训练

### 对比学习 (Contrastive Learning)

当前主流 Embedding 模型的核心训练范式：

1. **正样本（Positive Pair）**：语义相近的文本对，如 (query, 相关文档)、原句与其改写
2. **负样本（Negative Pair）**：语义不相关的文本对，同一个 batch 内其他样本、hard negatives
3. **损失函数**：InfoNCE / Contrastive Loss，拉近正样本，推远负样本

### 正负样本构造策略

- **自然配对**：标题-正文、问题-答案、(query, click)
- **数据增强**：回译、同义词替换、随机删除
- **Hard Negative Mining**：使用 BM25 或已有模型召回相似但不相关的文本
- **跨语言对齐**：平行语料 (翻译对) 用作正样本

## 相关笔记

- [[概念-向量数据库]] -- Embedding 向量的存储和检索基础设施
- [[深挖-稠密检索]] -- 基于 Embedding 的检索方法详解
- [[Ch13 RAG 进化树]] -- RAG 系统中 Embedding 的角色
- [[概念-CLIP]] -- 图像与文本的联合 Embedding 模型
- [[概念-重排序]] -- Embedding 初检后的精排环节
- [[深挖-FAISS]] -- Meta 开源的高效向量相似度搜索库

## 来源

- MTEB Leaderboard: [https://huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)
- OpenAI Embeddings 文档: [https://platform.openai.com/docs/guides/embeddings](https://platform.openai.com/docs/guides/embeddings)
- BAAI bge GitHub: [https://github.com/FlagOpen/FlagEmbedding](https://github.com/FlagOpen/FlagEmbedding)
- Jina AI 技术博客: [https://jina.ai/news/](https://jina.ai/news/)
- Cohere Embed 文档: [https://docs.cohere.com/docs/cohere-embed](https://docs.cohere.com/docs/cohere-embed)
- E5-mistral: [https://huggingface.co/intfloat/e5-mistral-7b-instruct](https://huggingface.co/intfloat/e5-mistral-7b-instruct)