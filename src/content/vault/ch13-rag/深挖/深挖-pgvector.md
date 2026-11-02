---
title: "深挖-pgvector"
date: 2026-07-01
updated: 2026-07-06
category: "Ch13 RAG"
tags: ["向量检索", "向量数据库", "pgvector", "PostgreSQL", "AI基础设施"]
aliases: ["pgvector", "pgvector向量扩展", "PostgreSQL向量搜索"]
prerequisites: "了解 PostgreSQL 基础,了解向量嵌入 Embedding 概念,了解 SQL 基础查询"
source: "笔记/Ch13 RAG/深挖/深挖-pgvector.md"
---
## 一句话理解

pgvector 是 PostgreSQL 的开源扩展，由 Supabase 主导维护，让传统关系型数据库原生支持向量存储和 ANN 搜索。它把向量变成了 PostgreSQL 的一种**数据类型**，你可以在同一条 SQL 里同时做 `WHERE` 过滤和 `ORDER BY` 向量距离。

## 零基础理解

PostgreSQL 是你用了十几年的老数据库，MySQL 之外的另一个王者。pgvector 给它加了一个"向量文件夹"——你不需要引入新的数据库、不需要学习新的查询语言、不需要写新的数据同步管道。向量数据和其他业务数据放在同一张表的不同列里，同一个事务里写入，同一个 SQL 里查询。

> 引入一个新的数据库组件，意味着新的部署、监控、备份、故障恢复流程。pgvector 的价值在于：**用你已经熟悉的东西，做你以前做不到的事**。

## 核心概念

### vector 数据类型

pgvector 注册了一个新的 SQL 数据类型 `vector(N)`，其中 N 是向量维度。你可以把它当作 `INTEGER` 或 `TEXT` 一样使用，甚至可以给 vector 列建索引：

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536)  -- OpenAI text-embedding-ada-002 的维度
);
```

### IVFFlat 索引

pgvector 最早支持的 ANN 索引类型。基于 IVF 算法，将向量空间划分为若干个列表，查询时只搜索最近的几个列表。需要先插入一定量的数据再建索引，因为列表的划分依赖已有数据的分布。`lists` 参数控制划分数量——经验值是 `sqrt(行数)` 到 `行数 / 1000`。

### HNSW 索引

pgvector 0.5.0 引入的索引类型，目前是生产环境的首选。相比 IVFFlat，HNSW 的构建时间更长、内存占用更高，但查询速度更快、精度更稳定，且不需要"先插入数据再建索引"。`m` 参数控制图的连接度（默认 16），`ef_construction` 控制构建时的搜索深度（默认 64）。

### 向量 + SQL 过滤

这是 pgvector 最独特的优势：**向量搜索和 SQL 过滤在同一查询中完成**，不需要像专用向量数据库那样先查向量再拿 ID 去业务数据库反查。

```sql
SELECT id, content, 1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM documents
WHERE category = 'tech' AND created_at > '2024-01-01'
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

## pgvector vs 专用向量数据库

| 维度 | pgvector | 专用向量 DB (Pinecone/Milvus/Weaviate) |
|------|:---:|:---:|
| 向量检索速度 | 中等（HNSW 百万级毫秒级） | 快（专用优化，十亿级毫秒级） |
| 运维复杂度 | 极低（已有 PG 零成本） | 高（独立部署、监控、备份） |
| 数据一致性 | 强（向量与业务数据同一事务） | 弱（需额外同步管道） |
| 过滤查询 | 原生 SQL，任意 WHERE 条件 | 有限元数据过滤，复杂条件受限 |
| 分布式扩展 | 依赖 PG 自身扩展方案 | 原生支持水平扩展 |
| 学习成本 | 极低（已会 SQL 即会 pgvector） | 中（需学习新 API 和概念） |
| 适用规模 | 千万级向量 | 亿~十亿级向量 |
| 成本 | 免费开源 | 商业版收费或自建运维成本 |

## 趋势分析

| 趋势 | 说明 |
|------|------|
| 向量数据库"回退"到 PG | 越来越多的团队发现，与其单独维护一个向量数据库，不如在已有的 PostgreSQL 上加 pgvector，推理成本降低后，向量检索不再是瓶颈 |
| Supabase 的推动 | pgvector 由 Supabase 主导开发，Supabase 本身是 Firebase 替代方案，生态繁荣 |
| 混合检索的趋势 | 与 ES 一样，pgvector 也能做"文本搜索 + 向量搜索"的混合，PostgreSQL 的 `tsvector` 全文搜索配合 pgvector 可实现类似 ES 的混合检索 |
| 性能持续提升 | pgvector 0.7.0 引入了 `halfvec` 半精度向量和 `sparsevec` 稀疏向量，存储和计算效率持续优化 |

## 2026 年选型建议

| 你的情况 | 推荐方案 |
|---------|---------|
| 已有 PostgreSQL，向量量级 < 1000 万 | pgvector，零运维成本 |
| 已有 PostgreSQL，向量量级 > 1000 万 | pgvector + 分区表，或评估专用向量 DB |
| 没有 PG，也不想引入新数据库 | pgvector in Docker，轻量起步 |
| 需要极致向量检索性能 | 专用向量 DB，或 FAISS 封装微服务 |
| 需要向量+复杂业务过滤的事务一致性 | pgvector 是唯一选择 |
| 已有 Elasticsearch | ES 8.x 的 kNN + 混合检索，不要引入 pgvector |
| 从零开始的新项目 | pgvector 起步，需要时再迁移到专用向量 DB |

## 相关笔记

- [[深挖-Elasticsearch]] — 全文检索引擎，搜索型场景的混合检索方案
- [[深挖-FAISS]] — 底层向量检索库，pgvector 的索引算法借鉴了 FAISS
- [[概念-向量数据库]] — 专用向量数据库全景对比
- [[深挖-向量数据库选型]] — 从业务需求出发的选型决策框架
- [[Ch13 RAG 进化树]] — RAG 检索技术栈的完整演进路径

## 来源

- pgvector GitHub: https://github.com/pgvector/pgvector
- Supabase pgvector 文档: https://supabase.com/docs/guides/database/extensions/pgvector
- "pgvector vs Pinecone vs Milvus" benchmarks: https://supabase.com/blog/pgvector-vs-pinecone
- pgvector 0.5.0 HNSW 发布说明: https://github.com/pgvector/pgvector/releases/tag/v0.5.0
- PostgreSQL 官方文档: https://www.postgresql.org/docs/current/
- "Why we chose pgvector over Pinecone": https://www.timescale.com/blog/pgvector-vs-pinecone/