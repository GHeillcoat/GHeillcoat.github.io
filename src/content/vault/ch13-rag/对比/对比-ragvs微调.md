---
title: "对比-RAGvs微调"
date: 2026-07-01
updated: 2026-07-06
category: "Ch13 RAG"
tags: ["对比", "RAG", "微调", "知识增强"]
aliases: ["RAG vs Fine-tuning", "检索增强vs模型微调"]
prerequisites: "RAG,Fine-tuning,检索增强生成"
source: "笔记/Ch13 RAG/对比/对比-RAGvs微调.md"
---
## 概述

RAG（Retrieval-Augmented Generation）和 Fine-tuning 是让 LLM 掌握特定领域知识的两种正交手段。RAG 给模型"查资料"，微调是"改模型参数"。

## 核心对比

| 维度 | RAG | Fine-tuning |
|------|-----|-------------|
| 核心机制 | 检索外部知识 → 拼入 prompt → 模型基于上下文回答 | 在领域数据上更新模型参数，将知识内化到权重中 |
| 知识更新方式 | 更新向量库/知识库即可，秒级生效 | 需重新训练，成本高且可能灾难性遗忘 |
| 计算成本 | 低（检索+推理），无训练开销 | 较高（需 GPU 训练，参数越多越贵） |
| 推理延迟 | 增加检索步骤，延迟约 +100-500ms | 无额外延迟，与基础推理一致 |
| 幻觉控制 | 较好，答案可溯源到检索到的文档 | 一般，模型可能编造"学到的知识" |
| 知识容量 | 理论上无限（取决于知识库规模） | 受限于模型参数量，存在容量上限 |
| 风格/格式控制 | 弱，模型行为不变，仅知识来源变 | 强，可改变输出风格、格式、推理模式 |
| 适用场景 | 知识密集型问答、事实核查、实时信息 | 领域风格适应、任务格式定制、行为对齐 |
| 最佳实践 | 知识更新频繁、需可溯源、预算有限 | 需改变模型行为、风格、推理模式时 |
| 2026 趋势 | 两者结合（RAFT）：微调让模型学会"如何用检索结果" |

## 互补关系

RAG 和微调不是二选一。2026 年的最佳实践是两者结合：
- 用微调让模型学会"阅读检索结果并正确引用"
- 用 RAG 提供最新、最准确的领域知识
- RAFT（Retrieval-Augmented Fine-Tuning）在微调时混入检索文档，让模型学会处理不完美检索结果

## 相关笔记

- [[Ch13 RAG 进化树]] — RAG 技术全景
- [[Ch11 模型微调]] — 微调方法对比
- [[深挖-LoRA]] — 低成本微调首选
- [[深挖-RAFT]] — 检索增强微调
- [[对比-稠密检索vs稀疏检索]] — 检索方案选型

## 来源

- Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al., NeurIPS 2020)
- RAFT: Adapting Language Model to Domain Specific RAG (Zhang et al., 2024)
- LlamaIndex / LangChain RAG 最佳实践指南