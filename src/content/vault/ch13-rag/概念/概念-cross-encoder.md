---
title: "Cross-Encoder (交叉编码器)"
date: 2026-07-01
updated: 2026-07-06
category: "Ch13 RAG"
tags: ["信息检索", "检索增强", "双编码器", "语义搜索"]
aliases: ["Cross-Encoder", "交叉编码器", "交互式编码器"]
prerequisites: "概念-BiEncoder,概念-Embedding"
source: "笔记/Ch13 RAG/概念/概念-Cross-Encoder.md"
---
## 概述

Cross-Encoder（交叉编码器）是一种将查询（Query）和文档（Document）**同时输入**同一个编码器进行联合编码的架构。与 Bi-Encoder 不同，Cross-Encoder 不对查询和文档进行独立编码，而是将两者拼接后一并送入 Transformer 模型，通过注意力机制让查询和文档在每一层都进行充分的交互。这种全交互设计使其精度最高，但速度最慢，通常用于 RAG 系统的重排序（Reranking）阶段。

## 工作原理

Cross-Encoder 的处理流程：

1. **输入拼接**：将 query 和 document 拼接为 `[CLS] query [SEP] document [SEP]`
2. **联合编码**：整个拼接序列一起送入 Transformer，自注意力机制在每个 token 之间计算
3. **相关性分数**：取 `[CLS]` token 的输出向量，通过一个线性层映射为相关性分数（0~1）
4. **分类/回归**：输出可用于二分类（相关/不相关）或回归（相关性分数）

## 数学表达

给定查询 $q$ 和文档 $d$，Cross-Encoder 的输出为：

$$ s(q, d) = \text{Linear}(\text{Transformer}([q; d])_{[CLS]}) $$

其中 $[q; d]$ 表示拼接后的序列，$[CLS]$ 表示取分类 token 的输出。

## 与 Bi-Encoder 的详细对比

| 维度 | Cross-Encoder | Bi-Encoder |
|------|--------------|------------|
| 编码方式 | Query 和 Doc 同时输入，联合编码 | Query 和 Doc 分别独立编码 |
| 交互方式 | 全交互（每层注意力覆盖所有 token） | 无交互（仅在最后点积/余弦相似度） |
| 精度 | **高**（充分交互，捕获细粒度匹配） | 中等（独立编码，信息压缩） |
| 推理速度 | **极慢**（每个 query-doc 对都要重新编码） | 快（文档可预先编码并存入向量库） |
| 存储需求 | 无需存储向量（在线计算） | 需要存储文档向量（离线索引） |
| 计算复杂度 | $O(n \cdot m \cdot L^2)$ | $O(n \cdot L^2 + m \cdot L^2)$ |
| 典型应用 | Reranking（重排序） | Retrieval（召回） |
| 支持的文档量 | 数百到数千 | 百万到数十亿 |
| 模型示例 | monoBERT, monoT5, RankLLaMA | SBERT, DPR, BGE, E5 |

注：$n$ 为查询数，$m$ 为文档数，$L$ 为序列长度。

## 在 RAG 中的应用

RAG 系统通常采用**两阶段检索**策略：

1. **第一阶段（召回 / Retrieval）**：使用 Bi-Encoder 从海量文档中快速召回 Top-K 候选（如 K=100）
2. **第二阶段（重排序 / Reranking）**：使用 Cross-Encoder 对 Top-K 候选逐一打分，重排序后取 Top-N（如 N=5）

这种组合既保证了速度（Bi-Encoder 处理海量文档），又保证了精度（Cross-Encoder 精细筛选）。

## 典型 Cross-Encoder 模型

| 模型 | 基座 | 参数量 | 特点 |
|------|------|--------|------|
| monoBERT | BERT-base | 110M | 最早的 Cross-Encoder 重排序模型 |
| monoT5 | T5-base | 220M | 基于 Seq2Seq，输出"true/false"概率 |
| RankT5 | T5-large | 770M | monoT5 的改进版，排序效果更好 |
| RankLLaMA | LLaMA-7B | 7B | 基于 LLM 的重排序模型，2024 年 SOTA |
| BGE-Reranker-v2 | BGE-M3 | 568M | 支持多语言，中文友好 |
| Cohere Rerank v3 | 专有 | 未公开 | 商业 API，效果优秀 |

## 2026 年趋势

1. **LLM 作为 Cross-Encoder**：使用 GPT-4、Claude 等 LLM 直接进行 relevance judgment，通过 prompt 控制输出格式
2. **多阶段级联**：Bi-Encoder -> Cross-Encoder -> LLM 三级架构，每一级更精确但更慢
3. **蒸馏优化**：用 Cross-Encoder 作为教师模型，蒸馏训练 Bi-Encoder，提升召回阶段精度
4. **延迟优化**：模型量化、TensorRT 推理、连续批处理等技术大幅降低 Cross-Encoder 延迟

## 相关笔记

- [[概念-BiEncoder]] - 双编码器架构与 Cross-Encoder 互补
- [[概念-RAG]] - RAG 系统中 Cross-Encoder 的角色
- [[概念-Embedding]] - 向量表示的基础概念
- [[概念-相似度计算]] - 相似度度量方法

## 来源

- Nogueira & Cho (2019) - "Passage Re-ranking with BERT": https://arxiv.org/abs/1901.04085
- Nogueira et al. (2020) - "Document Ranking with a Pretrained Sequence-to-Sequence Model": https://arxiv.org/abs/2003.06713
- Ma et al. (2024) - "RankLLaMA" (Listwise Reranking): https://arxiv.org/abs/2309.15088
- BGE 官方文档 - BGE Reranker: https://github.com/FlagOpen/FlagEmbedding