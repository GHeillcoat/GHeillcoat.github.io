---
title: "LangChain、LangGraph 和 LangSmith（深挖）"
description: "你在很多 AI 教程里都会看到这几个名字。它们经常一起出现，但做的事完全不同。这篇一次讲清楚。"
date: 2026-06-30
updated: 2026-07-22
category: "Ch14 Agent原理"
tags: ["框架", "LangChain"]
prerequisites: "Ch14 Agent 工作原理"
source: "笔记/Ch14 Agent原理/深挖/深挖-Lang家族.md"
---
你在很多 AI 教程里都会看到这几个名字。它们经常一起出现，但做的事完全不同。这篇一次讲清楚。

## LangChain：搭积木

LangChain 是 2022 年底出现的工具库。它的核心思想很简单：**把 AI 操作拆成一块块"积木"，你可以像搭乐高一样把它们串起来。**

比如你要做一个"翻译 + 总结"工具：
1. 先让 AI 把英文翻译成中文（一块积木）
2. 再把中文总结成三句话（另一块积木）
3. 两块积木串在一起，就完成了

LangChain 把提示词、工具调用、记忆、检索都封装成了标准积木。你只需要把这些积木按顺序连起来。

适合：**线性任务**——步骤固定，做完第一步做第二步。比如生成报告、翻译文档、提取信息 ^[LangChain, https://langchain.com]。

## LangGraph：指挥交通

LangChain 的问题是：它只能走直线。如果你需要"根据第一步的结果，决定第二步走 A 路线还是 B 路线"，LangChain 不够灵活。

2024 年，同一个团队推出了 LangGraph。它不是"串积木"，而是"画地图"——定义节点（每个节点是一块积木）和边（节点之间怎么连接）。

比如做一个客服系统：
- 节点 A：分析用户问题
- 如果用户是来投诉的 -> 走边到节点 B（转人工）
- 如果用户是来咨询的 -> 走边到节点 C（AI 自动回答）
- 节点 C 回答完 -> 走边到节点 D（满意度调查）

LangGraph 支持循环——AI 回答完之后，如果用户不满意，可以回到节点 A 重新分析。这是 LangChain 做不到的。

适合：**有分支、有循环的复杂任务**。比如客服路由、多步推理、Agent（能自己干活的 AI）的工作流 ^[LangGraph, https://langchain.com/langgraph]。

## LangSmith：监控和调试

LangChain 和 LangGraph 让你"搭"AI 应用。LangSmith 让你"看"AI 应用跑得好不好。

你搭好一个 Agent 之后，它开始自动处理用户请求。但你怎么知道它每一步决策对不对？比如它调用了搜索工具，搜出来的结果相关吗？它卡在某个步骤了怎么办？

LangSmith 记录每一步的输入、输出、调用链。你可以回放任何一次对话，看 AI 在每一步做了什么决策、花了多少时间、花了多少钱。

适合：**生产环境监控**。就像汽车的仪表盘——油温、转速、故障灯 ^[LangSmith, https://langchain.com/langsmith]。

## 一张表分清

| | LangChain | LangGraph | LangSmith |
|---|---|---|---|
| 做什么 | 搭积木（串行） | 画地图（分支+循环） | 看仪表盘（监控） |
| 什么时候用 | 步骤固定的任务 | 有判断、有循环的任务 | 上生产后需要监控 |
| 比喻 | 乐高积木 | 交通指挥 | 汽车仪表盘 |

## 跟你有什么关系

- 用 LangChain 搭一个检索增强生成（RAG，让 AI 查资料再回答）
- 用 LangGraph 搭一个 Agent
- 用 LangSmith 看 Agent 跑得怎么样

这三个工具代表了 AI 应用开发的三个层次：**搭**（LangChain）、**编排**（LangGraph）、**监控**（LangSmith）。

## 相关笔记

- [[Ch14 Agent 工作原理]] — LangGraph 是 Agent 工作流的实现工具
- [[深挖-工作流模式]] — LangChain=固定流程，LangGraph=岔路口+自主
- [[Ch13 RAG 进化树]] — LangChain 是最常用的检索增强生成框架

## 来源

- LangChain, https://langchain.com
- LangGraph, https://langchain.com/langgraph
- LangSmith, https://langchain.com/langsmith
