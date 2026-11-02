---
title: "概念-CrossEncoder"
date: 2026-07-01
updated: 2026-07-06
category: "Ch13 RAG"
tags: ["概念", "信息检索", "重排序", "检索增强", "文本匹配"]
aliases: ["Cross-Encoder", "交叉编码器", "重排序模型", "Reranker"]
prerequisites: "BERT,文本匹配,RAG基础,信息检索"
source: "笔记/Ch13 RAG/概念/概念-CrossEncoder.md"
---
## 一句话理解

**Cross-Encoder（交叉编码器）是同时输入 query 和 document、通过 Transformer 的全注意力机制进行深度交互、输出一个相关性分数的模型**。它是检索系统中精度最高的组件，但也是最慢的，因此通常只用于重排序（Reranking）阶段，对少量候选文档做精细打分。

## Cross-Encoder 的工作原理

### 输入方式

与 Bi-Encoder 的关键区别在于输入方式：

**Bi-Encoder**：
```
输入1: [CLS] 什么是深度学习 [SEP]  → 编码器1 → Query向量
输入2: [CLS] 深度学习是机器学习... [SEP]  → 编码器2 → Doc向量
→ 两个向量独立计算，没有交互
```

**Cross-Encoder**：
```
输入: [CLS] 什么是深度学习 [SEP] 深度学习是机器学习... [SEP]
→ Query 和 Doc 拼接在一起
→ 编码器同时处理两者
→ 每一层 Transformer 的注意力都在 query 和 doc 之间自由流动
→ 最终用 [CLS] token 的输出预测相关性分数
```

### 为什么精度最高

Cross-Encoder 精度的来源是**全交互（Full Interaction）**：

1. **词级交互**：Query 的每个词都能直接关注 Doc 的每个词，捕捉精确的语义对应
2. **上下文感知**：Query 和 Doc 的词在对方的上下文中重新理解，消除歧义
3. **深层语义匹配**：多层 Transformer 可以建模复杂的语义关系（同义、反义、蕴含、矛盾）
4. **端到端优化**：整个模型为相关性判断任务端到端训练，不需要中间表示

### 为什么最慢

Cross-Encoder 的代价是**无法预计算**：

- 对于每个 query，需要将它和每个候选 doc 拼接后送入模型
- 如果有 N 个候选文档，就需要 N 次完整推理
- 每次推理都经过完整的 Transformer 前向传播
- 无法像 Bi-Encoder 那样预计算 doc 向量

**时间复杂度对比**：
- Bi-Encoder 检索：O(1) 编码 query + O(N) 向量点积（N 可到百万级）
- Cross-Encoder 重排序：O(K) 次完整推理（K 通常 10-100）

## 在 RAG 中的角色：重排序阶段

在 RAG 系统中，Cross-Encoder 的标准位置是**重排序（Reranking）**阶段：

```
完整 RAG 检索流程：

1. 粗筛（召回/Retrieval）
   ├── 使用 Bi-Encoder 或 BM25
   ├── 从海量文档中召回 Top-K（K = 100-1000）
   └── 速度快，精度较低

2. 精筛（重排序/Reranking）  ← Cross-Encoder 在这里
   ├── 使用 Cross-Encoder
   ├── 对 Top-K 文档逐一打分
   ├── 重新排序，选出 Top-M（M = 5-20）
   └── 速度慢，精度最高

3. 生成（Generation）
   ├── LLM 基于 Top-M 文档生成回答
   └── 文档质量直接影响回答质量
```

### 为什么需要重排序

- **召回阶段**：Bi-Encoder 把文档压缩成单向量，会丢失信息，排序不够精确
- **重排序阶段**：Cross-Encoder 在少量候选上做精细判断，大幅提升最终文档质量
- **性价比**：只对 100-1000 个候选做重排序，而不是全量检索，兼顾精度和速度

## 2026 年主流 Cross-Encoder 模型

| 模型 | 开发者 | 参数量 | 语言 | 特点 |
|------|--------|--------|------|------|
| **BGE-Reranker-v2-m3** | BAAI | 568M | 多语言 | 2026年最流行的开源Reranker |
| **Cohere Rerank v3** | Cohere | 未公开 | 多语言 | 商业API，精度极高 |
| **Jina Reranker v2** | Jina AI | 278M | 多语言 | 开源，轻量高效 |
| **bge-reranker-large** | BAAI | 560M | 中英 | 经典版本，广泛使用 |
| **mxbai-rerank-large** | MixedBread | 435M | 英文 | 速度快，精度高 |
| **gte-rerank** | Alibaba | 306M | 多语言 | 支持多语言，中文表现好 |
| **gte-multilingual-reranker** | Alibaba | 306M | 多语言 | 多语言重排序 |

## Cross-Encoder vs Bi-Encoder vs ColBERT 对比

| 维度 | **Bi-Encoder** | **ColBERT** | **Cross-Encoder** |
|------|---------------|------------|-------------------|
| **输入方式** | 分别编码 | 分别编码（保留 token 向量） | 拼接编码 |
| **交互方式** | 无交互（向量点积） | Late Interaction（token 级） | Full Interaction（全注意力） |
| **预计算** | 可以（单向量） | 可以（多向量，存储大） | 不可以 |
| **推理速度** | 极快 | 快 | 慢 |
| **精度** | 较低 | 高 | 最高 |
| **存储开销** | 低 | 高 | 无 |
| **RAG 阶段** | 召回 | 召回/重排序 | 重排序 |
| **典型 K 值** | 10K-1M | 100-10K | 10-100 |
| **推理时间/文档** | < 0.01ms | ~0.1ms | ~10ms |
| **2026年定位** | 大规模召回 | 高精度召回 | 精细重排序 |

## 使用示例

### 使用 BGE-Reranker

```python
from transformers import AutoModelForSequenceClassification, AutoTokenizer

model = AutoModelForSequenceClassification.from_pretrained(
    "BAAI/bge-reranker-v2-m3"
)
tokenizer = AutoTokenizer.from_pretrained("BAAI/bge-reranker-v2-m3")

query = "什么是深度学习"
documents = [
    "深度学习是机器学习的一个分支...",
    "深度学习使用多层神经网络...",
    "Python 是一种编程语言..."
]

pairs = [[query, doc] for doc in documents]
inputs = tokenizer(pairs, padding=True, truncation=True, return_tensors="pt")
scores = model(**inputs, return_dict=True).logits.view(-1)

# 按分数排序
ranked = sorted(zip(scores, documents), key=lambda x: x[0], reverse=True)
```

### 典型 RAG Pipeline

```python
# 阶段1: 召回（Bi-Encoder）
candidates = bi_encoder.search(query, top_k=100)

# 阶段2: 重排序（Cross-Encoder）
pairs = [[query, doc] for doc in candidates]
scores = cross_encoder.predict(pairs)
ranked_docs = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)[:10]

# 阶段3: 生成
answer = llm.generate(query, context=ranked_docs)
```

## 适用场景

### 最适合的场景

1. **RAG 重排序**：从召回的候选文档中精选最优文档
2. **搜索质量优化**：对搜索引擎的 Top-K 结果做精细排序
3. **问答系统**：判断哪个段落最可能包含答案
4. **文本匹配**：语义相似度判断、文本蕴含识别
5. **内容审核**：判断内容是否匹配特定标准

### 不适合的场景

1. **大规模召回**：太慢，应使用 Bi-Encoder
2. **实时性要求极高**：每次推理都需要 10-100ms，不适合要求毫秒级响应的场景
3. **全量文档排序**：N 很大的场景，计算成本过高

## 相关笔记

- [[深挖-重排序]] — 重排序技术详解
- [[概念-ColBERT]] — 延迟交互检索模型
- [[Ch13 RAG 进化树]] — RAG 技术知识体系
- [[概念-BiEncoder]] — 双塔检索模型
- [[深挖-稠密检索]] — 稠密检索技术详解

## 来源

- BGE-Reranker: https://github.com/FlagOpen/FlagEmbedding
- Cohere Rerank: https://docs.cohere.com/docs/rerank-2
- Jina Reranker: https://jina.ai/reranker
- BGE-Reranker-v2 论文: https://arxiv.org/abs/2408.15348
- Sentence-BERT Cross-Encoder: https://www.sbert.net/examples/applications/cross-encoder/README.html