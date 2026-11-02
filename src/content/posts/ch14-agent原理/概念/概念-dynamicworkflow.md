---
title: "概念-DynamicWorkflow"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch14 Agent原理"
tags: ["workflow", "dynamic", "工作流", "概念"]
aliases: ["动态工作流", "Dynamic Workflow", "条件工作流"]
---
## 一句话理解

Dynamic Workflow（动态工作流）是一种**条件分支、路径根据输入变化，但分支逻辑是预定义的**工作流模式。与 Static Workflow 的"一条路走到黑"不同，Dynamic Workflow 在关键节点上设置了"岔路口"，根据输入内容或中间结果选择不同的后续路径——但所有可能的分支和选择规则，都是由开发者在代码中预先定义好的。

> 类比：机场的行李分拣系统——行李进入传送带后，根据标签上的目的地（国内/国际/转机）被分到不同的通道。通道是固定的，但每件行李走哪条通道取决于行李本身。

## 核心特征

### 1. 预定义的分支逻辑（Predefined Branching）

所有可能的路径在代码中已经写好。模型的职责是**执行分类或判断**，输出一个标签或分数，代码根据这个输出来选择分支。模型不决定"有哪些分支"，只决定"走哪条分支"。

### 2. 输入驱动的路径选择（Input-Driven Routing）

同一段代码，输入不同，走的路径可能完全不同。这种"输入驱动"的特性使得 Dynamic Workflow 比 Static Workflow 灵活得多，但又比 Agentic Workflow 可控。

### 3. 有限状态空间（Finite State Space）

因为分支是预定义的，整个工作流的状态空间是有限的、可枚举的。理论上可以穷举所有可能的执行路径，这使得测试和验证成为可能。

### 4. 模型调用次数可变（Variable LLM Calls）

与 Static Workflow 的固定调用次数不同，Dynamic Workflow 的 LLM 调用次数取决于走了哪条分支。不同分支可能需要不同数量的模型调用。

## 适用场景

| 场景 | 说明 | 典型例子 |
|------|------|----------|
| 客服路由（Customer Service Routing） | 根据用户意图将问题分派到不同处理流程 | 退款 → 财务流程；技术问题 → 技术支持流程；投诉 → 升级流程 |
| 内容审核（Content Moderation） | 根据风险等级走不同的审核路径 | 低风险 → 自动通过；中风险 → 人工复核；高风险 → 直接拦截 |
| 多级分类（Multi-Level Classification） | 大类 → 小类 → 专项处理的漏斗式路由 | 文档 → 合同/报告/邮件 → 合同类型 → 对应处理 |
| 条件数据增强（Conditional Augmentation） | 根据数据质量决定是否需要增强步骤 | 数据完整 → 直接使用；数据缺失 → 触发 RAG 补充 |
| 多模型编排（Multi-Model Orchestration） | 根据任务复杂度选择不同模型 | 简单任务 → Haiku；复杂任务 → Sonnet；超复杂 → Opus |

## 与其他工作流模式的对比

| 维度 | [[概念-StaticWorkflow]] | Dynamic Workflow | [[概念-AgenticWorkflow]] |
|------|:---:|:---:|:---:|
| 路径决定方式 | 代码硬编码 | 预定义规则 + 条件分支 | LLM 自主决策 |
| 分支数量 | 0 | 有限（开发者定义） | 无限（模型生成） |
| 灵活性 | 无 | 中等（规则覆盖范围内） | 高（开放式决策） |
| 可预测性 | 完全可预测 | 可预测（规则已知） | 低（模型行为不确定） |
| 适合的任务复杂度 | 简单、重复 | 中等、有明确分类 | 复杂、开放 |
| 开发成本 | 低 | 中 | 高 |
| 调试难度 | 低 | 中 | 高 |
| 状态空间 | 1条路径 | 有限条路径 | 无限条路径 |
| 典型实现 | 顺序函数调用 | if-else/switch 路由 | ReAct / Tool Use / Agent Loop |

## 代码示例：if-else 路由实现客服系统

```python
from enum import Enum

class Intent(str, Enum):
    REFUND = "refund"
    TECH_SUPPORT = "tech_support"
    COMPLAINT = "complaint"
    GENERAL = "general"

# Step 1: 意图分类（LLM 做判断，但分类结果是预定义的枚举）
def classify_intent(user_message: str) -> Intent:
    prompt = f"""
    将以下用户消息分类为以下意图之一：
    - refund: 退款相关
    - tech_support: 技术问题
    - complaint: 投诉
    - general: 一般咨询

    用户消息：{user_message}
    只返回意图标签，不要其他内容。
    """
    result = llm_call(prompt).strip().lower()
    return Intent(result)

# Step 2: 根据意图路由到不同的处理流程（分支逻辑是预定义的）
def handle_refund(user_message: str) -> str:
    # 退款流程：验证订单 → 计算退款金额 → 发起退款
    order_id = extract_order_id(user_message)
    order = fetch_order(order_id)
    amount = calculate_refund(order)
    result = initiate_refund(order_id, amount)
    return f"退款已处理：订单 {order_id}，金额 {amount}"

def handle_tech_support(user_message: str) -> str:
    # 技术支持流程：搜索知识库 → 生成回复
    articles = search_knowledge_base(user_message)
    response = generate_support_response(user_message, articles)
    return response

def handle_complaint(user_message: str) -> str:
    # 投诉流程：记录 → 升级 → 通知主管
    ticket_id = create_ticket(user_message, priority="high")
    escalate_to_supervisor(ticket_id)
    return f"您的投诉已记录（工单 {ticket_id}），我们将尽快处理"

def handle_general(user_message: str) -> str:
    # 一般咨询：直接回复
    return llm_call(f"回答用户问题：{user_message}")

# 主路由函数：预定义的分支逻辑
def route_customer_service(user_message: str) -> str:
    intent = classify_intent(user_message)

    # if-else 路由：所有分支都是预定义的
    if intent == Intent.REFUND:
        return handle_refund(user_message)
    elif intent == Intent.TECH_SUPPORT:
        return handle_tech_support(user_message)
    elif intent == Intent.COMPLAINT:
        return handle_complaint(user_message)
    elif intent == Intent.GENERAL:
        return handle_general(user_message)
    else:
        return "无法识别您的意图，请重新描述"

# 使用
response = route_customer_service("我要退款，订单号12345")
```

## Dynamic Workflow 与 Router 模式

Dynamic Workflow 的核心机制通常被称为 **Router 模式**（路由模式）。Router 负责：

1. **接收输入**：用户的原始消息或上一步的输出
2. **调用 LLM 做判断**：通常是一个分类任务
3. **返回路由键**：一个枚举值或标签
4. **代码根据路由键选择分支**：纯代码逻辑，不依赖 LLM

这种"LLM 判断 + 代码路由"的组合，是 Dynamic Workflow 区别于 Agentic Workflow（LLM 判断 + LLM 路由）的关键。

## 2026 年的趋势

Dynamic Workflow 是当前 AI 应用开发中最常用的模式。它平衡了**灵活性**和**可控性**，适用于大多数中等复杂度的业务场景。随着 LangGraph、CrewAI 等工作流框架的成熟，Dynamic Workflow 的实现变得越来越简单。

但边界在模糊：一些 Dynamic Workflow 开始引入"fallback 分支"——当预定义分支都无法处理时，自动切换到 Agentic 模式，让 LLM 自主处理。这种"Dynamic + Agentic 混合"可能是未来的主流。

## 相关笔记

- [[概念-StaticWorkflow]] — 固定步骤工作流
- [[概念-AgenticWorkflow]] — 模型自主决策工作流
- [[深挖-工作流模式]] — 三种工作流模式的深度对比
- [[对比-StaticvsDynamicvsAgenticWorkflow]] — 三种模式的横向对比
- [[Ch14 Agent 工作原理]] — Agent 中 Router 的使用

## 来源

- https://www.anthropic.com/engineering/building-effective-agents — Anthropic 官方：构建高效 Agent 的指南（Router 模式详解）
- https://langchain-ai.github.io/langgraph/ — LangGraph 文档：条件边与动态路由
- https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering — Prompt Engineering 中的分类任务设计
- https://arxiv.org/abs/2402.11651 — "Router-Based Architectures for LLM Applications"