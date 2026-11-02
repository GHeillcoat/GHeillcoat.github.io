---
title: "RAG (Retrieval-Augmented Generation)"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch13 RAG"
tags: ["检索增强", "LLM应用", "信息检索", "生成式AI"]
aliases: ["检索增强", "Retrieval-Augmented Generation", "检索增强生成"]
---
## 概述

RAG（Retrieval-Augmented Generation，检索增强生成）是一种将**信息检索**与**文本生成**相结合的 AI 技术架构。在 RAG 中，LLM 在生成回答之前，先从外部知识库中检索相关文档，然后将检索到的文档作为上下文注入到 prompt 中，再生成回答。这种方式解决了 LLM 的三大核心问题：知识截止日期（缺乏最新信息）、幻觉（生成不准确内容）和领域知识不足（缺乏私有/专业数据）。

## 为什么需要 RAG

| 问题 | 纯 LLM | RAG 方案 |
|------|--------|---------|
| **知识截止日期** | 训练数据截止后无法知晓新信息 | 实时检索最新文档 |
| **幻觉 (Hallucination)** | 可能编造事实 | 基于检索到的文档回答，可溯源 |
| **领域知识不足** | 缺乏私有数据/专业领域知识 | 检索私有知识库 |
| **长尾知识** | 训练数据中低频知识可能遗忘 | 精确检索长尾信息 |
| **可解释性** | 无法验证信息来源 | 可引用出处，逐条验证 |
| **更新成本** | 需重新训练/RFT | 更新知识库即可，无需重训模型 |

## RAG 的基本流程

```
用户问题
    |
    v
[1] 查询处理 (Query Processing)
    |  - 改写、扩展、分解
    v
[2] 检索 (Retrieval)
    |  - 向量检索 (Bi-Encoder)
    |  - 关键词检索 (BM25)
    |  - 混合检索 (Hybrid)
    v
[3] 重排序 (Reranking)
    |  - Cross-Encoder 精排
    v
[4] 上下文构建 (Context Assembly)
    |  - 文档拼接、去重、排序
    v
[5] 生成 (Generation)
    |  - LLM 基于检索结果生成回答
    v
最终回答 + 引用来源
```

## RAG 的核心组件

### 1. 索引 (Indexing)

| 步骤 | 描述 | 关键技术 |
|------|------|---------|
| 文档解析 | 提取文本、表格、图片 | PDF 解析、OCR、文档布局分析 |
| 文本分块 (Chunking) | 将长文档切分为合适大小的块 | 固定大小、语义分块、递归分块 |
| 向量化 (Embedding) | 将文本块转换为向量 | BGE, E5, OpenAI Embedding |
| 索引存储 | 存储向量并建立索引 | FAISS, Milvus, Pinecone, Qdrant |

### 2. 检索策略

| 策略 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| 稠密检索 (Dense) | 基于向量相似度 | 语义理解好 | 对专有名词可能不敏感 |
| 稀疏检索 (Sparse) | 基于关键词匹配 (BM25) | 精确匹配好 | 无语义理解 |
| 混合检索 (Hybrid) | 稠密 + 稀疏 | 兼顾两者优点 | 实现复杂 |
| 多轮检索 | 根据前一轮结果调整查询 | 召回率高 | 延迟高 |
| 父文档检索 | 检索小块，返回大块上下文 | 精度和上下文兼顾 | 存储大 |

### 3. 生成策略

| 策略 | 描述 | 适用场景 |
|------|------|---------|
| 直接生成 | 将检索文档拼接后直接生成 | 简单问答 |
| 摘要后生成 | 先对检索文档摘要，再生成 | 文档量大时 |
| 逐步推理 | 检索 -> 推理 -> 检索 -> 推理 | 多跳推理 |
| 自我反思 | 生成后检查是否需要补充检索 | 复杂问题 |

## RAG 架构演进

| 阶段 | 名称 | 特点 | 年份 |
|------|------|------|------|
| 1.0 | Naive RAG | 简单的 Retrieve-Read 流水线 | 2020 |
| 2.0 | Advanced RAG | 查询改写、重排序、混合检索 | 2023 |
| 3.0 | Modular RAG | 可编排的模块化检索-生成流程 | 2024 |
| 4.0 | Agentic RAG | LLM Agent 自主规划检索策略 | 2025 |
| 5.0 | Cognitive RAG | 多步推理、自我验证、知识图谱融合 | 2026 |

## 2026 年 RAG 技术栈

| 组件 | 常用技术 | 选型建议 |
|------|---------|---------|
| 向量数据库 | Milvus, Qdrant, Weaviate, Pinecone | 百万级以下用 Qdrant，大规模用 Milvus |
| Embedding 模型 | BGE-M3, GTE-Qwen2, E5-Mistral | 中文优先 BGE-M3 |
| Reranker | BGE-Reranker-v2, Cohere Rerank | Cross-Encoder 精排 |
| 文档解析 | LlamaParse, Unstructured, Marker | 复杂 PDF 用 LlamaParse |
| 分块策略 | LangChain, LlamaIndex | 推荐语义分块 |
| 编排框架 | LangChain, LlamaIndex, Dify | 快速原型用 Dify |

## 相关笔记

- [[概念-Embedding]] - 向量表示与相似度计算
- [[概念-BiEncoder]] - 检索阶段的双编码器
- [[概念-Cross-Encoder]] - 重排序阶段的交叉编码器
- [[概念-相似度计算]] - 检索中的相似度度量
- [[概念-上下文压缩]] - 长检索结果的上下文压缩

## 来源

- Lewis et al. (2020) - "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks": https://arxiv.org/abs/2005.11401
- Gao et al. (2023) - "Retrieval-Augmented Generation for Large Language Models: A Survey": https://arxiv.org/abs/2312.10997
- LangChain 文档 - RAG: https://python.langchain.com/docs/tutorials/rag/
- LlamaIndex 文档 - RAG: https://docs.llamaindex.ai/en/stable/understanding/rag/