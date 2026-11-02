---
title: "Embedding (嵌入 / 向量表示)"
description: "Embedding（嵌入）是机器学习中将离散对象（词、句子、文档、图像、用户、商品等）映射到连续稠密向量空间的技术。与传统的 One-Hot 编码（高维稀疏）不同，Embedding 将对象表示为低维稠密向量（通常 128-4096 维），向量之间的距离和方向蕴含了语义信息。Em"
pubDate: 2026-07-01
category: "Ch06 神经网络基础"
tags: ["表示学习", "向量空间", "NLP", "深度学习"]
aliases: ["Embedding", "嵌入", "向量表示", "Dense Vector"]
---
## 概述

Embedding（嵌入）是机器学习中将离散对象（词、句子、文档、图像、用户、商品等）映射到**连续稠密向量空间**的技术。与传统的 One-Hot 编码（高维稀疏）不同，Embedding 将对象表示为低维稠密向量（通常 128-4096 维），向量之间的距离和方向蕴含了语义信息。Embedding 是现代 NLP、推荐系统和多模态学习的基石，几乎所有深度学习模型都依赖 Embedding 来表示输入。

## 为什么需要 Embedding

### One-Hot 编码的局限

| 方法 | 维度 | 稀疏性 | 语义信息 | 存储效率 |
|------|------|--------|---------|---------|
| One-Hot | 词汇量大小（如 50K） | 极高（99.99% 为 0） | 无（任意两个词的距离相同） | 极差 |
| Embedding | 通常 128-4096 | 稠密（非零值） | 丰富（相似词向量接近） | 好 |

### Embedding 的优势

1. **降维**：从高维稀疏空间压缩到低维稠密空间
2. **语义表示**：相似的对象在向量空间中更接近
3. **可迁移**：预训练的 Embedding 可用于下游任务
4. **可计算**：向量间可进行加减乘除运算（如 "国王 - 男人 + 女人 = 女王"）

## Embedding 的类型

| 类型 | 嵌入对象 | 向量维度 | 典型模型 | 应用 |
|------|---------|---------|---------|------|
| **Word Embedding** | 词/Token | 100-768 | Word2Vec, GloVe, FastText | 文本分类、NER |
| **Sentence Embedding** | 句子/段落 | 768-4096 | SBERT, SimCSE, E5, BGE | 语义搜索、聚类 |
| **Document Embedding** | 文档/长文本 | 768-4096 | BGE, GTE, E5 | 文档检索、RAG |
| **Image Embedding** | 图像 | 512-2048 | ViT, ResNet, CLIP | 图像搜索、分类 |
| **Multimodal Embedding** | 图文等 | 512-4096 | CLIP, ImageBind | 跨模态检索 |
| **User/Item Embedding** | 用户/商品 | 32-256 | CF, Two-Tower | 推荐系统 |
| **Graph Embedding** | 图中的节点 | 64-512 | Node2Vec, GCN | 社交网络、知识图谱 |
| **Audio Embedding** | 音频片段 | 512-1024 | Wav2Vec, Whisper | 语音识别、音乐搜索 |

## 核心模型演进

### Word Embedding 时代

| 模型 | 年份 | 核心思想 | 特点 |
|------|------|---------|------|
| **Word2Vec (CBOW/Skip-gram)** | 2013 | 用上下文预测词 / 用词预测上下文 | 浅层网络，训练快 |
| **GloVe** | 2014 | 基于全局词共现矩阵分解 | 结合全局统计信息 |
| **FastText** | 2016 | 子词（subword）级表示 | 处理 OOV 词，字符 n-gram |

### Sentence Embedding 时代

| 模型 | 年份 | 方法 | 特点 |
|------|------|------|------|
| **BERT (CLS)** | 2018 | 取 [CLS] 输出 | 原生支持，但效果一般 |
| **SBERT** | 2019 | 孪生网络 + 池化 | 句向量质量大幅提升 |
| **SimCSE** | 2021 | 对比学习 + Dropout 增强 | 简单高效，无需标注 |
| **E5** | 2023 | 大规模弱监督对比学习 | 通用句向量，多任务 |
| **BGE / BGE-M3** | 2023-2024 | 多阶段训练 + 多语言 | 中文友好，1024 维 |
| **GTE** | 2023 | 大规模对比学习 | 阿里出品，768 维 |

### 2026 年的通用 Embedding 模型

| 模型 | 维度 | 支持语言 | 最大长度 | 特点 |
|------|------|---------|---------|------|
| BGE-M3 | 1024 | 100+ | 8192 | 稠密 + 稀疏混合检索 |
| GTE-Qwen2-7B | 3584 | 多语言 | 32768 | 基于 LLM 的 Embedding |
| E5-Mistral-7B | 4096 | 多语言 | 32768 | 基于 Mistral 的 Embedding |
| NV-Embed-v2 | 4096 | 多语言 | 32768 | NVIDIA 出品，MTEB 榜首 |
| Jina-Embeddings-v3 | 1024 | 多语言 | 8192 | 任务特定 LoRA 适配器 |

## Embedding 的语义空间

在高质量 Embedding 空间中，向量运算具有语义意义：

- **类比推理**：vec("国王") - vec("男人") + vec("女人") ≈ vec("女王")
- **语义相似**：cos(出租车, 计程车) ≈ 1
- **跨语言**：vec_en("cat") ≈ vec_zh("猫")
- **跨模态**：vec_img("猫的照片") ≈ vec_text("猫")

## 评估指标

常用 MTEB (Massive Text Embedding Benchmark) 评估 Embedding 模型：

| 任务类别 | 指标 | 说明 |
|---------|------|------|
| 分类 | Accuracy | 用 Embedding 做分类器输入 |
| 聚类 | V-Measure | 聚类质量 |
| 配对分类 | Average Precision | 判断两个文本是否语义相同 |
| 重排序 | Mean Average Precision | 对候选文档重排序 |
| 检索 | NDCG@10 | 搜索排序质量 |
| STS | Spearman 相关系数 | 语义文本相似度 |

## 2026 年趋势

1. **LLM 驱动的 Embedding**：基于 7B+ 参数的 LLM 生成 Embedding，质量远超小模型
2. **多向量 Embedding**：ColBERT 式的 token-level 多向量表示，兼顾精度和速度
3. **任务自适应 Embedding**：通过 LoRA 或 prompt 调整 Embedding 以适应特定任务
4. **Matryoshka Embedding**：单一模型支持多种维度（如 256/512/1024），灵活权衡精度和效率

## 相关笔记

- [[概念-相似度计算]] - 在 Embedding 空间中计算相似度
- [[概念-BiEncoder]] - 双编码器生成 Embedding 进行检索
- [[概念-对比学习]] - 训练高质量 Embedding 的核心方法
- [[概念-RAG]] - RAG 中 Embedding 的角色

## 来源

- Mikolov et al. (2013) - "Efficient Estimation of Word Representations in Vector Space" (Word2Vec): https://arxiv.org/abs/1301.3781
- Reimers & Gurevych (2019) - "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks": https://arxiv.org/abs/1908.10084
- Wang et al. (2022) - "Text Embeddings by Weakly-Supervised Contrastive Pre-training" (E5): https://arxiv.org/abs/2212.03533
- MTEB Leaderboard: https://huggingface.co/spaces/mteb/leaderboard