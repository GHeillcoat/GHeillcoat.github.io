---
title: "对比-稠密检索vs稀疏检索"
description: "稠密检索（Dense Retrieval）和稀疏检索（Sparse Retrieval）是信息检索的两大范式。稠密检索基于语义向量相似度，稀疏检索基于关键词匹配，2026 年的标配是两者混合。"
pubDate: 2026-07-01
category: "Ch13 RAG"
tags: ["对比", "检索", "RAG", "稠密检索", "稀疏检索"]
aliases: ["Dense vs Sparse Retrieval", "语义检索vs关键词检索"]
---
## 概述

稠密检索（Dense Retrieval）和稀疏检索（Sparse Retrieval）是信息检索的两大范式。稠密检索基于语义向量相似度，稀疏检索基于关键词匹配，2026 年的标配是两者混合。

## 核心对比

| 维度 | 稠密检索 (Dense) | 稀疏检索 (Sparse) |
|------|------------------|--------------------|
| 原理 | 将 query 和文档编码为稠密向量（768/1024/4096 维），通过余弦相似度或内积匹配 | 基于词频统计（BM25/TF-IDF），将 query 和文档表示为稀疏向量，通过倒排索引匹配 |
| 优势 | 语义理解强，能匹配同义词、近义词、改写；对模糊查询友好 | 精确匹配好，对专有名词、数字、代码、ID 等精确值鲁棒；不需要训练 |
| 劣势 | 对罕见实体、数字、精确值匹配弱；需训练 embedding 模型；索引更新成本高 | 语义理解弱，同义词/改写无法匹配；对长尾查询效果差 |
| 检索速度 | 依赖向量索引（如 HNSW），近似最近邻搜索 | 倒排索引，极快，工程成熟 |
| 索引大小 | 大（每个向量 768/1024 维 float） | 小（仅存储词项 → 文档映射） |
| 数据需求 | 需训练或微调 embedding 模型 | 零样本，无需训练 |
| 适用场景 | 语义搜索、问答、RAG 中大多数查询 | 精确匹配、代码搜索、法律/医疗文档 |
| 2026 标配 | 混合检索：先稀疏粗筛，再稠密精排，或两者分数加权融合 |

## 混合检索：取长补短

混合检索（Hybrid Retrieval）是 2026 年 RAG 系统的标准配置：

1. **并行检索**：同时执行稀疏和稠密检索
2. **分数融合**：通过 RRF（Reciprocal Rank Fusion）或线性加权合并结果
3. **重排序**：对融合结果用 Cross-Encoder 做精排

典型技术栈：BM25 + BGE/Cohere Embed + BGE Reranker

## 相关笔记

- [[深挖-稠密检索]] — Dense Retrieval 原理与模型
- [[深挖-稀疏检索]] — BM25/TF-IDF 与倒排索引
- [[深挖-混合检索]] — 混合检索策略与实践
- [[Ch13 RAG 进化树]] — RAG 技术全景
- [[对比-RAGvs微调]] — RAG 与微调对比

## 来源

- Dense Passage Retrieval for Open-Domain QA (Karpukhin et al., EMNLP 2020)
- BM25: The Probabilistic Relevance Framework (Robertson & Zaragoza, 2009)
- RRF 分数融合方法 (Cormack et al., SIGIR 2009)