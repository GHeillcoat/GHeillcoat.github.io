---
title: "Bi-Encoder (双塔模型/双编码器)"
date: 2026-07-01
updated: 2026-07-06
category: "Ch13 RAG"
tags: ["概念", "深度学习", "信息检索", "双塔模型", "检索增强"]
aliases: ["Bi-Encoder", "双塔模型", "双编码器", "Dual Encoder"]
prerequisites: "概念-Embedding,概念-Transformer,概念-相似度计算"
source: "笔记/Ch13 RAG/概念/概念-BiEncoder.md"
---
## 概述

Bi-Encoder (双编码器) 是一种**双塔架构**的神经网络模型，核心思想是将两个输入 (如 Query 和 Document、User 和 Item) 分别通过独立的编码器编码为向量表示，然后通过向量相似度计算来判断两者的匹配程度。

Bi-Encoder is the de facto standard architecture for retrieval-augmented generation (RAG) systems, recommendation systems, and any application requiring efficient large-scale similarity search.

## 架构原理

### 双塔结构

```
Query: "什么是Transformer"  →  [Query Encoder]  →  q_vec (768维)
Document: "Transformer是..."  →  [Doc Encoder]  →  d_vec (768维)

Score = cosine_similarity(q_vec, d_vec) = q_vec · d_vec / (|q_vec| * |d_vec|)
```

两个编码器共享或不共享权重，取决于具体任务。在检索场景中，通常使用相同的预训练模型分别编码 Query 和 Document。

### 训练目标

通常使用对比学习 (Contrastive Learning) 目标：

- **正例**: 相关的 Query-Document 对 — 拉近其向量距离
- **负例**: 不相关的 Query-Document 对 — 推远其向量距离
- **损失函数**: InfoNCE Loss / Triplet Loss / Multiple Negatives Ranking Loss

```
L = -log[ exp(sim(q, d+)/τ) / Σ exp(sim(q, di)/τ) ]
```

## Bi-Encoder vs Cross-Encoder 对比

| 维度 | Bi-Encoder | Cross-Encoder |
|------|-----------|---------------|
| 编码方式 | Query 和 Doc 分别编码 | Query 和 Doc 拼接后一起编码 |
| 计算方式 | 向量点积/余弦相似度 | 完整前向传播 |
| 交互方式 | 浅层交互 (仅向量内积) | 深层交互 (Transformer 层间交互) |
| 检索速度 | 极快 (可预先计算文档向量) | 慢 (每对都要重新计算) |
| 精度 | 较低 (交互不充分) | 较高 (充分交互) |
| 索引能力 | 支持向量索引 (FAISS/Milvus) | 不支持预索引 |
| 典型场景 | RAG 第一阶段检索 | RAG 重排序 (Reranker) |
| 代表模型 | Sentence-BERT, DPR, BGE | monoBERT, cross-encoder/ms-marco |

## 典型应用场景

### 1. RAG 检索阶段

在 RAG (Retrieval-Augmented Generation) 系统中，Bi-Encoder 用于第一阶段的大规模召回：

```
用户问题 → Query Encoder → 查询向量 → FAISS 向量检索 → Top-K 文档 → Reranker → LLM 生成
```

### 2. 语义搜索 (Semantic Search)

企业知识库搜索、电商商品搜索等场景，Bi-Encoder 可以预先将百万级文档编码为向量并建立索引。

### 3. 推荐系统 (Recommendation)

双塔模型 (User Tower + Item Tower) 在推荐系统中广泛应用，如 YouTube DNN 召回模型。

### 4. 文本去重与聚类

编码后的向量可用于计算文本间相似度，完成去重、聚类、话题发现等任务。

## 训练策略

### 负样本构造

Bi-Encoder 的效果很大程度上取决于负样本质量：

- **In-Batch Negatives**: 同一批次内其他样本作为负例 (高效但可能漏掉困难负例)
- **Hard Negatives**: 使用 BM25 或上一轮模型挖掘出的困难负例
- **Cross-Batch Negatives**: 跨批次共享负例 (GradCache 技术)

### 常用模型

- **Sentence-BERT (SBERT)**: 基于 BERT 的 Siamese 双塔结构
- **DPR (Dense Passage Retrieval)**: Facebook 的开放域问答检索模型
- **BGE (BAAI General Embedding)**: 智源研究院的通用 Embedding 模型
- **E5 / GTE**: 微软和阿里巴巴的 Embedding 模型系列
- **Cohere Embed / OpenAI Embeddings**: 商业 Embedding API

## 优缺点

### 优点
- 检索速度极快，支持百万至十亿级向量检索
- 文档向量可预先计算和索引，支持实时更新
- 架构简单，易于部署和扩展
- 与向量数据库 (FAISS, Milvus, Qdrant) 天然兼容

### 缺点
- 精度不如 Cross-Encoder (缺少深层交互)
- 对 Embedding 模型质量要求高
- 领域适应需要额外微调
- 不擅长处理需要精确匹配或复杂逻辑的查询

## 相关笔记

- [[概念-Cross-Encoder]] — 对比学习
- [[概念-Embedding]] — 向量表示基础
- [[概念-相似度计算]] — 余弦相似度、欧氏距离等
- [[概念-Transformer]] — 编码器基础架构
- [[概念-RAG]] — 检索增强生成
- [[概念-对比学习]] — 训练方法论

## 来源

- Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. EMNLP-IJCNLP. https://arxiv.org/abs/1908.10084
- Karpukhin, V., et al. (2020). Dense Passage Retrieval for Open-Domain Question Answering. EMNLP. https://arxiv.org/abs/2004.04906
- BGE: https://github.com/FlagOpen/FlagEmbedding
- Sentence Transformers: https://www.sbert.net/