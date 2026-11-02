---
title: "LangChain: 链式思维"
date: 2026-07-01
updated: 2026-07-06
category: "Ch15 Agent通信协议"
tags: ["对比", "Agent框架", "LangChain", "LangGraph"]
aliases: ["LangChain vs LangGraph", "LangChain对比LangGraph"]
prerequisites: "LangChain,LangGraph,Agent 框架"
source: "笔记/Ch15 Agent通信协议/对比/对比-LangChainvsLangGraph.md"
---
## 概述

LangChain 和 LangGraph 是 Lang 生态中两个核心框架。LangChain 面向链式编排，LangGraph 面向有状态图编排，两者定位互补。

## 核心对比

| 维度 | LangChain | LangGraph |
|------|-----------|-----------|
| 核心抽象 | Chain（链）：串联一组步骤 | Graph（图）：节点 + 边 + 状态 |
| 控制流 | 线性为主，支持简单分支（RouterChain） | 循环、条件分支、并行、子图嵌套 |
| 状态管理 | 无内置状态，数据沿链传递 | 显式 State 对象，支持持久化、检查点 |
| 循环/迭代 | 不支持原生循环，需手动 while 包裹 | 原生支持，通过条件边回到上游节点 |
| Agent 模式 | 基础 ReAct Agent，Action → Observation 循环 | 自定义 Agent 图，灵活控制推理循环 |
| Human-in-the-loop | 有限支持，需手动中断 | 内置 interrupt 机制，支持审批/编辑/继续 |
| 流式支持 | 链式流式，每步输出 | 节点级流式 + 状态变更事件 |
| 学习曲线 | 较低，直觉简单 | 较高，需理解图、状态、边概念 |
| 适用场景 | 简单 RAG、固定流程、快速原型 | 复杂 Agent、多步推理、人机协作 |
| 2026 推荐 | 简单任务用 LangChain，复杂 Agent 用 LangGraph |

## 关系与演进

LangGraph 是 LangChain 的进化而非替代。LangChain 的 Chain 可以嵌入 LangGraph 的节点中，两者可混合使用。2026 年的趋势是：
- 新项目如需复杂 Agent 逻辑，直接选 LangGraph
- 已有 LangChain 项目可逐步将关键流程迁移到 LangGraph
- 简单 RAG pipeline 仍用 LangChain 最快

## 代码直觉

```python

chain = prompt | llm | output_parser

# LangGraph: 图式思维
graph = StateGraph(State)
graph.add_node("think", think_node)
graph.add_node("act", act_node)
graph.add_conditional_edges("think", decide, {"act": "act", "end": END})
```

## 相关笔记

- [[深挖-LangChain]] — LangChain 框架详解
- [[深挖-LangGraph]] — LangGraph 框架详解
- [[深挖-Lang家族]] — Lang 生态全景分析
- [[对比-StaticvsDynamicvsAgenticWorkflow]] — 工作流模式对比
- [[Ch15 Agent 通信协议]] — Agent 通信协议章节

## 来源

- LangChain 官方文档 (langchain.com)
- LangGraph 官方文档 (langchain-ai.github.io/langgraph)
- LangGraph 论文: "LangGraph: Building Stateful, Multi-Actor Applications with LLMs"