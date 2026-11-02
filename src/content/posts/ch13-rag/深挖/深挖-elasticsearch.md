---
title: "深挖-Elasticsearch"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch13 RAG"
tags: ["搜索引擎", "向量检索", "Elasticsearch", "中间件", "AI基础设施"]
aliases: ["ES", "Elasticsearch深挖", "Elasticsearch", "ES全文检索"]
---
## 一句话理解

Elasticsearch 是一个**分布式全文检索引擎**，底层基于 Apache Lucene，2010 年由 Shay Banon 发布。它把 Lucene 复杂的 Java API 封装成 RESTful JSON 接口，让全文检索从"只有搜索引擎公司才做得起"变成"一个普通后端工程师也能轻松上手"。本质上是**近乎实时的分布式搜索与数据分析引擎**。

## 零基础理解

如果你需要从图书馆里找到一本讲"倒排索引"的书，你不会一本本翻开去看——你会去查索引卡片，卡片上写着每个关键词对应哪些书、在哪个书架。Elasticsearch 做的事完全一样：它先把文档内容"拆词"建立索引卡片，查询时直接查卡片，所以无论数据量多大，搜索速度都很快。

> 把数据写进 MySQL 再 `LIKE '%keyword%'` 查询，相当于一本本翻书；把数据写进 ES 再查，相当于查索引卡片。

## 核心概念

### 倒排索引

倒排索引是 ES 的基石。传统"正排索引"是文档 ID 到内容的映射（文档 1 包含 "cat" 和 "dog"），而倒排索引是**词到文档 ID 的映射**（"cat" 出现在文档 1、3、7）。查询时直接定位到包含该词的文档，无需遍历全量数据。

### BM25 评分算法

ES 5.0 之后默认的相关性评分算法，取代了早期的 TF-IDF。BM25 的核心思想：

- **词频饱和**：一个词出现 10 次和出现 100 次，对相关性的贡献不会线性增长，避免了"长文档天然比短文档更相关"的偏差
- **文档长度归一化**：同样一个词，出现在短文档里比出现在长文档里更有代表性
- 相比 TF-IDF，BM25 更符合直觉，调参也更简单

### 分词

Analyzer 是 ES 写入和查询时最关键的一环。写入时将文本切分成词条存入倒排索引，查询时同样分词后去匹配。选择错误的分词器会导致"搜不到"（比如中文用 `standard` 分词器会把"中国人"拆成三个字）。ES 内置了 `ik_max_word`、`jieba` 等中文分词插件，也支持自定义词典。

### 分布式架构

ES 天然支持水平扩展，核心构件是 **Shard（分片）** 和 **Replica（副本）**：

- **Primary Shard**：数据分布在不同分片上，每个分片是一个独立的 Lucene 实例，实现并行搜索
- **Replica Shard**：每个主分片可配置多个副本，既提供高可用（主分片宕机，副本自动提升），也提供读扩展（查询可路由到副本）
- 优势：写入请求打到主分片，读取请求主副都可承担，集群规模线性扩展

## ES 在 AI 时代的演进

ES 近年的最大变化是**从纯文本引擎转型为文本+向量混合引擎**：

| 版本 | 向量能力 | 关键变化 |
|------|---------|---------|
| 7.0~7.x | 引入 `dense_vector` 字段类型 | 可以存储向量，但搜索需借助 `script_score` 实现，性能较差 |
| 8.0~8.x | 原生 kNN 搜索 | 专用的 `knn` 查询 DSL，HNSW 索引，性能大幅提升 |
| 8.12+ | 混合检索 `hybrid search` | 一条查询同时执行 BM25 + kNN，通过 RRF 融合结果排序 |
| 2026 现状 | 成熟的混合检索平台 | 多数团队的首选——已有 ES 的基础设施，加向量搜索零运维成本 |

### 混合检索的原理

```
用户查询 → 分词 → BM25 文本检索 ─┐
                                 ├→ RRF 融合排序 → 最终结果
用户查询 → Embedding → kNN 向量检索 ─┘
```

RRF 不是简单加权，而是让两条独立路径产生的结果按排名递归融合，避免了"BM25 得分 0.9 的文档和 kNN 距离 0.1 的文档如何比较"这个难题。

## ES vs FAISS vs 专用向量数据库

| 维度 | Elasticsearch | FAISS | 专用向量 DB (Milvus/Weaviate/Qdrant) |
|------|:---:|:---:|:---:|
| 类型 | 全文检索引擎 + 向量搜索 | C++ 向量检索库 | 纯向量数据库 |
| 文本全文检索 | 原生支持，成熟 | 不支持 | 有限或需额外集成 |
| 向量检索速度 | 中等（与文本检索共用索引） | 最快（纯计算，无存储开销） | 快（专用优化） |
| 运维复杂度 | 已有 ES 的团队零成本 | 需自建服务封装 | 需独立部署运维 |
| 数据一致性 | 向量和业务数据在同一集群 | 需自行保证 | 需额外同步 |
| 适用场景 | 搜索型应用（电商、文档搜索） | 离线批量索引、十亿级检索 | 纯向量检索场景 |
| 索引类型 | HNSW | IVF、HNSW、PQ、多种组合 | HNSW 为主 |

## 2026 年定位

ES 的核心优势在于**混合检索**。大多数生产场景里，用户的需求不是"帮我找最相似的 10 个向量"，而是"帮我找与关键词+语义都相关的结果"。已有 ES 的团队加向量搜索几乎零成本，不需要引入新数据库、不需要学习新运维工具、不需要写新的数据同步管道。对于搜索型应用，ES 是混合检索的首选。

## 相关笔记

- [[深挖-混合检索]] — 混合检索的完整方案与 RRF 融合算法详解
- [[深挖-FAISS]] — 底层向量检索库，ES 的 kNN 实现思路借鉴了 FAISS
- [[深挖-pgvector]] — PostgreSQL 的向量扩展，与 ES 形成互补（事务型 vs 搜索型）
- [[概念-向量数据库]] — 专用向量数据库全景对比
- [[概念-BM25]] — BM25 算法数学原理
- [[Ch13 RAG 进化树]] — RAG 检索阶段的演进路径

## 来源

- Elasticsearch 官方文档: https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
- Elastic "Vector Search Introduction": https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html
- 华为开发者 ES 向量检索发展史: https://developer.huawei.com/consumer/cn/
- BM25 原始论文: Robertson et al., "The Probabilistic Relevance Framework: BM25 and Beyond", 2009
- Elastic Blog — Hybrid Search: https://www.elastic.co/blog/improving-information-retrieval-elastic-stack-hybrid