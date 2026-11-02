---
title: "深挖 LangSmith"
date: 2026-07-01
updated: 2026-07-06
category: "Ch21 MLOps"
tags: ["AI/Agent", "工具/LangSmith", "可观测性", "调试", "评估"]
aliases: ["LangSmith", "Agent调试平台", "LLM可观测性"]
source: "笔记/Ch21 MLOps/深挖/深挖-LangSmith.md"
---
## 一句话理解

LangSmith 是 **LangChain 生态的调试、评估、监控平台**，相当于 Agent 的**可观测层（Observability Layer）**。它追踪每一次 LLM 调用、记录每一步决策、评估每一次输出质量，让你在 Agent 的"黑盒"中看清发生了什么。

## 为什么 Agent 需要可观测性

传统软件调试相对简单：输入确定，输出确定，加断点就能定位问题。Agent 则完全不同：

| 传统软件 | AI Agent |
|----------|----------|
| 输入输出确定 | LLM 输出有随机性（temperature） |
| 代码路径固定 | 根据 LLM 决策动态选择路径 |
| 错误可复现 | 相同输入可能产生不同结果 |
| 单步调试即可 | 需要追踪多步 LLM 调用链 |
| 日志已经足够 | 需要结构化 Trace + 评估 |

Agent 的决策过程是一个**黑盒**：
- 为什么选择了这个工具而不是那个？
- 为什么在这一步重试了 3 次？
- 最终输出的质量如何？有没有幻觉？
- 哪个环节是性能瓶颈？

LangSmith 就是为解决这些问题而生的。

## 核心概念

### Trace（追踪）

Trace 是 LangSmith 的核心概念。每一次 LLM 调用、工具调用、Chain 执行都会被记录为一条 Trace。

一个典型的 Agent Trace 包含：

```
Run: "回答用户关于2026年AI趋势的问题"
  |-- Run: LLM Call (思考) - 1.2s, 350 tokens
  |-- Run: Tool Call (搜索) - 0.8s, 120 tokens
  |-- Run: LLM Call (整合) - 0.9s, 280 tokens
  |-- Run: Tool Call (搜索) - 0.7s, 100 tokens
  |-- Run: LLM Call (最终输出) - 1.5s, 500 tokens
  Total: 5.1s, 1350 tokens, 5 steps
```

在每个 Trace 中你可以看到：
- 输入 (Input) 和输出 (Output)
- 耗时 (Latency)
- Token 消耗
- 中间状态
- 错误信息

### Dataset（测试数据集）

Dataset 是用于评估的测试用例集合：

| 元素 | 说明 |
|------|------|
| Example | 一个测试用例，包含 input 和 expected_output |
| Dataset | 多个 Example 的集合 |
| Split | 数据集划分（train / test / validation） |

### Evaluation（自动评估）

LangSmith 支持多种评估方式：

| 评估类型 | 说明 | 示例 |
|----------|------|------|
| 正确性评估 | 对比输出与标准答案 | `correctness_evaluator` |
| 质量评估 | LLM-as-Judge 打分 | 用 GPT-5.5 评估输出质量 |
| 自定义评估 | 用户定义的评估函数 | 检查输出是否包含特定关键词 |
| 对比评估 | 比较两个模型/配置的输出 | A/B Test |

### Hub（提示词仓库）

LangSmith Hub 是社区共享的 Prompt Template 仓库，类似 Docker Hub 但用于 Prompt：

```python
from langchain import hub
prompt = hub.pull("rlm/rag-prompt")  # 拉取社区 Prompt
```

## 可观测性功能全景

| 功能 | 说明 | 解决的问题 |
|------|------|------------|
| Trace 查看 | 可视化每次调用的完整链路 | "这次调用发生了什么？" |
| 延迟分析 | 每个步骤的耗时分布 | "哪个环节最慢？" |
| Token 统计 | 每次调用的 Token 消耗 | "这个月的 API 成本是多少？" |
| 错误追踪 | 捕获和展示错误信息 | "为什么这次调用失败了？" |
| 数据集管理 | 创建和管理测试集 | "如何回归测试？" |
| 在线评估 | 实时评估线上输出质量 | "用户收到的回复质量如何？" |
| A/B 测试 | 对比不同模型/配置 | "GPT-5.5 和 Claude Opus 4.8 哪个更好？" |
| 标注队列 | 人工标注输出质量 | "如何收集人工反馈？" |

## LangSmith 与其他工具对比

| 维度 | LangSmith | LangFuse | Weights & Biases | MLflow |
|------|-----------|----------|------------------|--------|
| 定位 | LLM 应用专属可观测性 | LLM 应用可观测性（开源） | 通用 ML 实验追踪 | 通用 ML 生命周期 |
| LLM 深度集成 | 最深入（LangChain/LangGraph） | 中等 | 中等 | 较浅 |
| 自托管 | 付费版支持 | 开源自托管 | 混合 | 开源 |
| 价格 | 免费层 + 付费 | 开源免费 | 免费层 + 付费 | 开源免费 |
| 2026 年推荐 | LangChain 用户首选 | 开源首选 | 通用 ML 首选 | 企业 ML 首选 |

## 2026 年定位

LangSmith 在 2026 年的定位是：**Agent 开发调试的必备工具，LangChain 生态的核心基础设施**。

- 为什么必备：
  - Agent 越来越复杂，没有 Trace 根本没法调试
  - 生产环境 Agent 需要持续监控质量
  - 评估 (Evaluation) 成为 Agent 开发的标准流程
  - 企业级部署需要审计追踪 (Audit Trail)
- 局限：
  - 深度绑定 LangChain 生态，非 LangChain 项目集成较浅
  - 高级功能需要付费
  - 自托管功能受限（对比 LangFuse 的开源自由）
- 典型场景：Agent 开发调试、线上质量监控、Prompt 迭代优化、团队协作

## 相关笔记

- [[深挖-LangChain]] — LangChain 框架，LangSmith 的默认集成对象
- [[深挖-LangGraph]] — LangGraph 的 Trace 也通过 LangSmith 查看
- [[深挖-Lang家族]] — Lang 家族全景
- [[Ch21 MLOps 基础]] — MLOps 基础，评估和监控的通用概念
- [[深挖-LangChain]] — LangChain 深度对比
- [[深挖-LangGraph]] — LangGraph 深度对比

## 来源

- https://docs.smith.langchain.com/ — LangSmith 官方文档
- https://www.langchain.com/langsmith — LangSmith 产品页面
- https://blog.langchain.dev/langsmith/ — LangSmith 官方博客
- https://github.com/langchain-ai/langsmith-sdk — LangSmith SDK GitHub
- https://langfuse.com/ — LangFuse (竞品对比参考)