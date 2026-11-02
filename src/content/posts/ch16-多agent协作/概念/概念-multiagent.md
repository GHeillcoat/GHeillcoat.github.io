---
title: "概念-MultiAgent"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch16 多Agent协作"
tags: ["AI", "智能体", "多Agent系统", "协作", "基础概念"]
aliases: ["多Agent协作", "Multi-Agent System", "Multi-Agent", "Multi-Agent", "MAS", "Agent协作"]
---
## 一句话理解

Multi-Agent系统是多个Agent角色分工协作，每个Agent专注一件事，通过通信协调完成复杂任务的架构模式。就像软件开发团队中的产品经理、架构师、前端工程师、后端工程师、测试工程师各司其职，通过会议和文档沟通协作。

## 零基础理解

**软件开发团队类比：**

一个完整的软件产品，不可能由一个人完成所有工作。你需要：

- **产品经理**：理解需求，拆分任务
- **架构师**：设计系统结构
- **前端工程师**：实现用户界面
- **后端工程师**：实现业务逻辑
- **测试工程师**：验证质量

每个人各司其职，通过会议、邮件、文档沟通，最终交付产品。Multi-Agent系统就是把这个模式搬到AI领域：每个Agent扮演一个角色，专注自己的任务，通过消息传递协作完成复杂目标。

## 核心概念

### 角色定义

每个Agent有明确的角色和职责边界：

| 角色类型 | 职责 | 示例 |
|----------|------|------|
| Planner | 任务分解、制定计划 | "分析用户需求，拆分为5个子任务" |
| Executor | 执行具体任务 | "根据设计文档编写代码" |
| Reviewer | 检查质量、发现错误 | "审查代码，指出3个潜在bug" |
| Coordinator | 协调Agent间通信 | "汇总各Agent结果，解决冲突" |
| Researcher | 信息收集和分析 | "搜索相关技术方案，给出对比分析" |

### 任务分解

复杂任务需要被分解为多个子任务，分配给不同的Agent：

```
用户需求: "分析竞品并生成市场报告"
  ├─→ Researcher Agent: 搜索竞品信息
  ├─→ Analyst Agent: 分析数据，提取洞察
  ├─→ Writer Agent: 撰写报告
  └─→ Reviewer Agent: 审核报告质量
```

### Agent间通信

Agent之间的通信方式决定了协作效率：

| 通信方式 | 说明 | 优点 | 缺点 |
|----------|------|------|------|
| 消息传递 | Agent直接发送消息 | 灵活、实时 | 需要消息格式标准化 |
| 共享内存 | 所有Agent读写共享空间 | 简单、透明 | 并发冲突风险 |
| 黑板模式 | 公共知识库，Agent发布/订阅 | 解耦、可扩展 | 延迟较高 |
| 事件驱动 | 事件触发Agent行为 | 异步、松耦合 | 调试困难 |

### 协调机制

| 协调方式 | 说明 | 适用场景 |
|----------|------|----------|
| 顺序执行 | Agent按固定顺序执行 | 流水线任务 |
| 并行执行 | 多个Agent同时执行 | 独立子任务 |
| 投票机制 | 多个Agent给出方案，投票决定 | 需要多视角的任务 |
| 层级控制 | 上级Agent分配任务给下级 | 复杂项目 |
| 辩论机制 | Agent互相辩论，达成共识 | 需要严谨推理的任务 |

## Multi-Agent框架对比

| 框架 | 协作模式 | 核心特点 | 适用场景 | 学习曲线 |
|------|----------|----------|----------|----------|
| CrewAI | 角色扮演(Role-based) | 定义角色、任务、流程，按顺序执行 | 内容生成、研究分析 | 低 |
| AutoGen | 对话式协作(Chat-based) | Agent间通过对话协作，支持人工介入 | 代码生成、数据分析 | 中 |
| LangGraph | 图编排(Graph-based) | 用状态图定义Agent协作流程，最灵活 | 复杂多步骤工作流 | 高 |
| MetaGPT | 软件公司模拟(SOP-based) | 模拟软件公司SOP，多角色协作 | 软件开发 | 中 |
| OpenAI Swarm | 轻量级编排 | 极简的Agent切换和交接 | 实验和原型 | 低 |

## 什么时候需要Multi-Agent

### 需要Multi-Agent的信号

| 场景 | 说明 | 示例 |
|------|------|------|
| 任务可分解 | 任务天然可以拆分为独立子任务 | 市场调研+报告撰写 |
| 需要不同视角 | 单一视角不够全面 | 代码审查(安全+性能+可读性) |
| 单人无法完成 | 单Agent上下文窗口不够 | 分析大量文档 |
| 需要质量保证 | 需要独立的质量检查环节 | 生成代码+代码审查 |
| 需要专业知识 | 不同领域需要不同专业知识 | 法律+技术的合规审查 |

### 单Agent就够了的情况

| 场景 | 原因 |
|------|------|
| 简单问答 | 不需要分工 |
| 单步工具调用 | 一个Agent就能完成 |
| 上下文足够小 | 不需要并行处理 |
| 快速原型 | Multi-Agent增加复杂度 |

## Multi-Agent的挑战

### 通信开销

每个Agent之间的消息传递都需要消耗token和时间。如果协调不当，大部分成本会花在Agent间的"开会"上，而不是实际产出。

### 错误传播

一个Agent的错误输出会传递给下游Agent，导致连锁错误。需要Reviewer Agent或验证机制来阻断错误传播。

### 协调复杂度

| 挑战 | 表现 | 缓解方法 |
|------|------|----------|
| 任务分配 | 任务分给谁？如何分？ | 明确的角色定义和任务描述 |
| 结果合并 | 多个Agent的结果如何整合？ | Coordinator Agent统一汇总 |
| 冲突解决 | Agent意见不一致怎么办？ | 投票、权重、层级决策 |
| 死锁 | Agent互相等待 | 超时机制、任务优先级 |

## 2026年定位

Multi-Agent在生产环境中越来越普遍，但"简单优先"原则仍然适用：能用一个Agent解决的，不要用多个。Multi-Agent的价值在于处理真正需要分工协作的复杂任务。

当前的趋势是：
- **MCP + A2A**：MCP统一工具连接，A2A统一Agent间通信
- **框架收敛**：CrewAI、AutoGen、LangGraph各自找到了自己的niche
- **生产化**：从demo走向生产，稳定性、可观测性成为重点

## 相关笔记

- [[Ch16 多 Agent 协作]] — 多Agent协作的深入分析
- [[深挖-CrewAI]] — 角色扮演式Multi-Agent框架
- [[深挖-AutoGen]] — 对话式Multi-Agent框架
- [[深挖-LangGraph]] — 图编排式Agent框架
- [[Ch14 Agent 工作原理]] — 单Agent架构基础
- [[概念-A2A]] — Agent间通信标准协议
- [[概念-MCP]] — 工具连接标准协议

## 来源

- CrewAI Documentation: https://docs.crewai.com/
- AutoGen (Microsoft): https://microsoft.github.io/autogen/
- LangGraph Documentation: https://langchain-ai.github.io/langgraph/
- MetaGPT Paper: https://arxiv.org/abs/2308.00352
- Google A2A Protocol: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/