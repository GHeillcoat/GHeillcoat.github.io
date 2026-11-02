---
title: "概念-StaticWorkflow"
date: 2026-07-01
updated: 2026-07-06
category: "Ch14 Agent原理"
tags: ["workflow", "static", "工作流", "概念"]
aliases: ["静态工作流", "Static Workflow", "固定工作流"]
prerequisites: "工作流基础,AI应用架构"
source: "笔记/Ch14 Agent原理/概念/概念-StaticWorkflow.md"
---
## 一句话理解

Static Workflow（静态工作流）是一种**固定步骤、无分支、每次执行完全相同的流程**。在 AI 应用开发中，它是最简单、最可控的工作流模式：每一步做什么、顺序如何、输入输出是什么，全部在代码中硬编码，不依赖模型的判断，也不依赖外部条件的变化。

> 类比：流水线上的装配工序——第1步拧螺丝，第2步装外壳，第3步贴标签。无论来什么产品，步骤完全一样。

## 核心特征

### 1. 确定性（Determinism）

给定相同的输入，Static Workflow 永远产生相同的输出路径。每一步的执行逻辑是确定的，不会因为模型输出的不同而改变后续步骤。

### 2. 线性执行（Linear Execution）

步骤按固定顺序依次执行，不存在条件分支、循环或跳转。如果 A 步骤失败，整个流程终止，没有备选路径。

### 3. 无模型参与决策（No Model Decision-Making）

模型在 Static Workflow 中只负责**执行具体任务**（如翻译、摘要、分类），而不负责决定"下一步该做什么"。流程控制权完全在代码层面。

### 4. 易于调试和监控（Easy Debugging）

因为每一步的输入输出都是确定的，调试 Static Workflow 就像调试普通函数调用链一样简单。日志记录、断点调试、单元测试都直接适用。

## 适用场景

| 场景 | 说明 | 典型例子 |
|------|------|----------|
| 简单 ETL Pipeline | 数据从源到目标的固定转换流程 | 每日从数据库导出 CSV → 清洗 → 发送邮件 |
| 报告生成 | 固定模板、固定数据源的报告 | 每周自动生成销售周报：拉数据 → 填模板 → 发飞书 |
| 固定格式翻译 | 源格式和目标格式完全确定 | 把 JSON 日志翻译成自然语言摘要 |
| 批量内容处理 | 每篇内容走相同的处理流水线 | 100篇文章 → 每篇提取摘要 → 分类 → 入库 |
| 定时任务 | 固定时间触发、固定流程执行 | 每小时检查服务健康状态 → 记录日志 → 异常时告警 |

## 与其他工作流模式的对比

| 维度 | Static Workflow | [[概念-DynamicWorkflow]] | [[概念-AgenticWorkflow]] |
|------|:---:|:---:|:---:|
| 路径决定方式 | 代码硬编码 | 预定义规则 + 条件分支 | LLM 自主决策 |
| 灵活性 | 无 | 中等（规则覆盖范围内） | 高（开放式决策） |
| 可预测性 | 完全可预测 | 可预测（规则已知） | 低（模型行为不确定） |
| 适合的任务复杂度 | 简单、重复 | 中等、有明确分类 | 复杂、开放 |
| 开发成本 | 低 | 中 | 高 |
| 调试难度 | 低 | 中 | 高 |
| 模型调用次数 | 固定 | 可变（根据分支） | 可变（模型决定） |
| 典型实现 | 顺序函数调用 | if-else/switch 路由 | ReAct / Tool Use / Agent Loop |

## 代码示例

以下是一个典型的 Static Workflow 实现，用于自动生成每日 GitHub 活动摘要：

```python
import requests
from datetime import date

# Step 1: 拉取数据（固定数据源）
def fetch_github_events(username: str, date: str) -> list[dict]:
    url = f"https://api.github.com/users/{username}/events"
    response = requests.get(url)
    return response.json()

# Step 2: 清洗数据（固定清洗逻辑）
def clean_events(events: list[dict]) -> list[dict]:
    cleaned = []
    for event in events:
        cleaned.append({
            "type": event["type"],
            "repo": event["repo"]["name"],
            "created_at": event["created_at"]
        })
    return cleaned

# Step 3: 调用 LLM 生成摘要（固定 Prompt）
def generate_summary(events: list[dict]) -> str:
    prompt = f"请根据以下 GitHub 活动生成一段中文摘要：\n{events}"
    # 调用 LLM API...
    return llm_call(prompt)

# Step 4: 发送到飞书（固定通知渠道）
def send_to_feishu(summary: str):
    webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
    requests.post(webhook_url, json={"content": summary})

# 主流程：步骤固定，顺序固定
def daily_report():
    events = fetch_github_events("user", str(date.today()))
    cleaned = clean_events(events)
    summary = generate_summary(cleaned)
    send_to_feishu(summary)

if __name__ == "__main__":
    daily_report()
```

## Static Workflow 在 AI 应用中的位置

在 AI 应用架构中，Static Workflow 通常位于**最底层**。它是构建更复杂工作流（Dynamic、Agentic）的基础组件。一个 Agentic Workflow 的某个子步骤，可能就是一段 Static Workflow。

```
复杂度递增:
Static Workflow → Dynamic Workflow → Agentic Workflow
    (固定)          (条件分支)         (自主决策)
```

## 何时应该选择 Static Workflow

决定因素：

1. **任务本身是固定的**：不需要根据输入内容改变处理流程
2. **对可靠性要求极高**：不能容忍模型"乱走"导致流程跑偏
3. **成本敏感**：每次模型调用都有成本，固定步数 = 固定成本
4. **团队能力有限**：Static Workflow 的开发和维护最简单

## 2026 年的趋势

随着 LLM 能力的提升和成本的下降，**纯 Static Workflow 的场景在减少**。即使是简单的 ETL 任务，也开始引入动态元素——比如用 LLM 判断数据质量、决定是否需要重试。但 Static Workflow 的思想——"能用简单方案就不用复杂方案"——仍然是 AI 工程的核心原则。

## 相关笔记

- [[概念-DynamicWorkflow]] — 条件分支工作流
- [[概念-AgenticWorkflow]] — 模型自主决策工作流
- [[深挖-工作流模式]] — 三种工作流模式的深度对比
- [[对比-StaticvsDynamicvsAgenticWorkflow]] — 三种模式的横向对比
- [[Ch14 Agent 工作原理]] — Agent 的核心机制

## 来源

- https://www.anthropic.com/engineering/building-effective-agents — Anthropic 官方：构建高效 Agent 的指南
- https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering — Anthropic Prompt Engineering Guide
- https://langchain-ai.github.io/langgraph/ — LangGraph: 工作流编排框架
- https://arxiv.org/abs/2310.04451 — "Building Effective Agents" 相关论文