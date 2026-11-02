---
title: "概念-Neo4j"
date: 2026-07-01
updated: 2026-07-06
category: "Ch13 RAG"
tags: ["graph-database", "neo4j", "图数据库", "概念"]
aliases: ["Neo4j图数据库", "Neo4j Graph Database", "Neo4j"]
prerequisites: "概念-图数据库与知识图谱,数据库基础,Cypher查询语言"
source: "笔记/Ch13 RAG/概念/概念-Neo4j.md"
---
## 一句话理解

Neo4j 是**最流行的图数据库，使用 Cypher 查询语言，是 Graph RAG 的常见基础设施**。自 2007 年首次发布以来，Neo4j 已经从一个学术项目发展为全球装机量最大的图数据库，被数千家企业用于知识图谱、推荐系统、反欺诈、网络分析等场景。在 AI 时代，Neo4j 找到了新的角色——作为 Graph RAG 的结构化知识存储层，与向量数据库互补。

> 类比：如果关系型数据库（如 MySQL）是 Excel 表格，那么 Neo4j 就是思维导图——它天生适合表达"谁和谁有什么关系"这种网状结构。

## 核心概念

### 1. 节点 Label（Node Label）

Label 是节点的"类型标签"，类似于关系数据库中的"表名"。一个节点可以有多个 Label。

```cypher
-- 创建一个 Label 为 Person 的节点
CREATE (:Person {name: 'Dario Amodei', role: 'CEO'})

-- 创建一个 Label 为 Company 的节点
CREATE (:Company {name: 'Anthropic', founded: 2021})

-- 一个节点可以有多个 Label
CREATE (:Person:Researcher:Author {name: 'Ashish Vaswani'})
```

### 2. 关系 Type（Relationship Type）

关系 Type 定义了两个节点之间关系的"种类"。关系必须有方向（有向边），但查询时可以忽略方向。

```cypher
-- 创建关系：Dario Amodei 任职于 Anthropic
MATCH (p:Person {name: 'Dario Amodei'})
MATCH (c:Company {name: 'Anthropic'})
CREATE (p)-[:WORKS_AT {role: 'CEO', since: 2021}]->(c)

-- 关系类型示例
-- (:Person)-[:KNOWS]->(:Person)
-- (:Person)-[:WORKS_AT]->(:Company)
-- (:Company)-[:HEADQUARTERED_IN]->(:City)
-- (:Paper)-[:CITES]->(:Paper)
-- (:Concept)-[:RELATES_TO]->(:Concept)
```

### 3. Cypher 查询语言

Cypher 是 Neo4j 的声明式查询语言，语法设计灵感来自 SQL 和 ASCII 艺术（用 `-->` 表示关系方向）：

```cypher
-- 基础查询：查找所有与 Anthropic 相关的公司和个人
MATCH (p:Person)-[r:WORKS_AT]->(c:Company {name: 'Anthropic'})
RETURN p.name, r.role, c.name

-- 多跳查询：查找 Dario 的同事的同事（2跳关系）
MATCH (dario:Person {name: 'Dario Amodei'})-[:WORKS_AT]->(c:Company)
MATCH (dario)-[:KNOWS]->(colleague)-[:KNOWS]->(friend_of_colleague)
RETURN friend_of_colleague.name

-- 最短路径：查找两个概念之间的最短关系路径
MATCH path = shortestPath(
  (a:Concept {name: 'Transformer'})-[*..5]-(b:Concept {name: 'GPT-5.5'})
)
RETURN path

-- 聚合查询：统计每个公司有多少员工
MATCH (p:Person)-[:WORKS_AT]->(c:Company)
RETURN c.name, count(p) AS employee_count
ORDER BY employee_count DESC
```

### 4. 图算法库（GDS - Graph Data Science）

Neo4j 的 GDS 库提供了 60+ 种图算法，涵盖：

| 算法类别 | 代表算法 | 应用场景 |
|---------|---------|---------|
| 中心性（Centrality） | PageRank, Betweenness, Degree | 找出图中最重要的节点 |
| 社区检测（Community Detection） | Louvain, Label Propagation, Weakly Connected Components | 发现图中的社群/聚类 |
| 相似度（Similarity） | Node Similarity, KNN | 发现相似的节点 |
| 路径查找（Path Finding） | Dijkstra, A*, Yen's k-shortest | 最短路径、最优路径 |
| 嵌入（Embedding） | Node2Vec, GraphSAGE, FastRP | 将图节点转为向量，用于 ML 模型 |

## Neo4j 在 Graph RAG 中的角色

在 Graph RAG 架构中，Neo4j 承担以下角色：

```
                ┌──────────────────┐
                │   用户问题        │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │  实体识别 (NER)   │
                │  提取问题中的实体  │
                └────────┬─────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
   ┌────────────┐ ┌──────────┐ ┌──────────┐
   │  Neo4j     │ │ 向量数据库 │ │ 传统搜索  │
   │  图查询    │ │  语义检索 │ │  关键词   │
   │  (Cypher)  │ │  (ANN)   │ │  (BM25)  │
   └────────────┘ └──────────┘ └──────────┘
            │            │            │
            └────────────┼────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │   结果融合        │
                │   (Rerank/合并)   │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │   LLM 生成回答    │
                └──────────────────┘
```

Neo4j 的典型查询场景：

```cypher
-- Graph RAG 场景：查询某个概念的所有相关概念及其关系
MATCH (c:Concept {name: 'RAG'})-[r:RELATES_TO]-(related:Concept)
RETURN c.name, type(r) AS relationship, related.name, r.description
LIMIT 20

-- 多跳推理：查找"RAG 使用了哪些技术，这些技术的基础是什么"
MATCH (rag:Concept {name: 'RAG'})-[:USES]->(tech:Technology)-[:BASED_ON]->(foundation:Concept)
RETURN rag.name, tech.name, foundation.name
```

## Neo4j 与 pgvector 的互补使用

| 维度 | Neo4j | pgvector |
|------|-------|----------|
| 数据库类型 | 图数据库 | 关系型数据库 + 向量扩展 |
| 核心能力 | 图遍历、关系查询、图算法 | 向量相似度搜索、SQL 查询 |
| 查询语言 | Cypher | SQL + 向量操作符 |
| 适用场景 | 结构化关系查询 | 语义相似度 + 结构化数据 |
| 部署复杂度 | 独立服务 | PostgreSQL 插件 |
| 典型组合 | Neo4j 做关系推理 + pgvector 做语义匹配 | 单库同时处理关系和向量 |

### 互补架构示例

```python
# 混合检索：Neo4j + pgvector

def hybrid_search(question: str, top_k: int = 10) -> list:
    # 1. Neo4j: 图结构检索
    entities = extract_entities(question)
    graph_results = neo4j_query("""
        MATCH (e:Entity)-[r:RELATED_TO]-(related:Entity)
        WHERE e.name IN $entities
        RETURN related.name, type(r) as relation, r.weight as score
        ORDER BY score DESC
        LIMIT $top_k
    """, entities=entities, top_k=top_k)

    # 2. pgvector: 语义相似度检索
    question_embedding = embed(question)
    vector_results = db_query("""
        SELECT content, 1 - (embedding <=> $embedding) AS similarity
        FROM documents
        ORDER BY embedding <=> $embedding
        LIMIT $top_k
    """, embedding=question_embedding, top_k=top_k)

    # 3. 融合结果
    return merge_and_rerank(graph_results, vector_results)
```

## 2026 年：Neo4j 的 AI 生态

1. **Neo4j + LLM 集成**：Neo4j 推出了原生 LangChain 集成和 GraphRAG 包，简化了图数据库与 LLM 的对接
2. **向量支持**：Neo4j 5.x 版本原生支持向量索引，可以同时存储图结构和向量嵌入
3. **知识图谱构建自动化**：使用 LLM 从非结构化文本中自动提取实体和关系，构建知识图谱
4. **Graph-Native Learning**：在图上直接进行机器学习，不需要将图数据转为表格数据

## 相关笔记

- [[概念-图数据库与知识图谱]] — 图数据库与知识图谱的综述
- [[深挖-图谱检索RAG]] — Graph RAG 的深度解析
- [[深挖-pgvector]] — PostgreSQL 向量扩展
- [[概念-ObsidianGraphView]] — Obsidian 的图谱可视化
- [[知识图谱]] — 知识图谱构建与应用
- [[深挖-向量数据库]] — 向量数据库深度解析

## 来源

- https://neo4j.com/docs/ — Neo4j 官方文档
- https://neo4j.com/docs/cypher-manual/current/ — Cypher 查询语言手册
- https://neo4j.com/docs/graph-data-science/current/ — Neo4j GDS 图算法库文档
- https://neo4j.com/developer-blog/graphrag-manifesto/ — Neo4j GraphRAG 宣言
- https://github.com/neo4j/neo4j — Neo4j 开源仓库
- https://arxiv.org/abs/2404.16130 — Microsoft Graph RAG 论文