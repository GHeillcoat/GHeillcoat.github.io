---
title: "对比-AgenticRAGvsGraphRAG"
description: "Agentic RAG 和 Graph RAG 是 RAG 进化树上的两个高级分支。Agentic RAG 让模型动态决定检索策略，Graph RAG 利用知识图谱的结构化推理能力增强检索。"
date: 2026-07-01
category: "Ch13 RAG"
tags: ["对比", "RAG", "Agent", "图谱", "检索策略"]
aliases: ["Agentic RAG vs Graph RAG", "自主检索RAGvs图谱检索RAG"]
prerequisites: "Agentic RAG,Graph RAG,RAG"
source: "笔记/Ch13 RAG/对比/对比-AgenticRAGvsGraphRAG.md"
---
## 概述

Agentic RAG 和 Graph RAG 是 RAG 进化树上的两个高级分支。Agentic RAG 让模型动态决定检索策略，Graph RAG 利用知识图谱的结构化推理能力增强检索。

## 核心对比

| 维度 | Agentic RAG | Graph RAG |
|------|-------------|-----------|
| 检索策略 | 动态决策：模型自主选择何时检索、检索什么、检索几次 | 图谱推理：沿知识图谱边遍历，利用实体间结构化关系 |
| 核心技术 | Tool Use + 检索循环 + Self-Reflection | 知识图谱构建 + 图遍历 + 实体链接 |
| 检索粒度 | 灵活：可在 query 级、chunk 级、甚至 token 级检索 | 实体级：以实体和关系为检索单元 |
| 适用问题类型 | 需要多步推理、动态信息收集的复杂问题 | 多跳推理、关系型问题、需要全局结构理解的问题 |
| 基础设施需求 | LLM + 向量库 + 工具调用框架 | LLM + 知识图谱（Neo4j/NebulaGraph） + 实体链接 |
| 知识表示 | 非结构化文本 chunks | 结构化三元组 (head, relation, tail) |
| 可解释性 | 中，可追踪检索路径但未必结构化 | 高，推理路径可精确追溯为图谱路径 |
| 构建成本 | 低，标准 RAG 管道即可 | 高，需构建和维护知识图谱 |
| 2026 趋势 | 更通用，应用更广 | 特定领域（医疗、法律、科研）优势明显 |

## 互补与融合

Agentic Graph RAG 是 2026 年的前沿方向：让 Agent 自主决定何时走图谱推理路径、何时走向量检索路径，将两者融合为统一检索决策框架。

典型流程：
1. Agent 解析问题，判断需要哪些信息
2. 简单事实 → 向量检索；关系推理 → 图谱遍历
3. 多轮迭代，动态调整检索策略
4. 综合结果生成最终答案

## 相关笔记

- [[深挖-自主检索RAG]] — Agentic RAG 详解
- [[深挖-图谱检索RAG]] — Graph RAG 详解
- [[Ch13 RAG 进化树]] — RAG 技术全景
- [[对比-稠密检索vs稀疏检索]] — 基础检索方案对比
- [[对比-RAGvs微调]] — RAG 与微调对比

## 来源

- GraphRAG: Unsupervised Graph-Based RAG (Microsoft Research, 2024)
- Self-RAG: Learning to Retrieve, Generate, and Critique (Asai et al., 2024)
- Agentic RAG: A Survey on Agent-Based Retrieval-Augmented Generation (2025)