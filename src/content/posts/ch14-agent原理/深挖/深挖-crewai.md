---
title: "深挖 CrewAI"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch14 Agent原理"
tags: ["AI/Agent", "框架/CrewAI", "多Agent协作"]
aliases: ["CrewAI", "CrewAI框架", "角色扮演Agent"]
---
## 一句话理解

CrewAI 是一个**角色扮演式多 Agent 框架**。它的核心思路是：定义 Agent 角色 --> 分配 Task（任务）--> Agent 组成 Crew（团队）协作完成。每个 Agent 像一个拥有特定职位和背景故事的员工，Crew 则是整个项目团队。

## 零基础理解

想象你要做一份市场研究报告。传统做法是一个人从头做到尾，或者你手动协调多个 LLM 对话。CrewAI 的做法是：给每个 Agent 发一张"角色卡"——

- **你是数据分析师**：擅长从数据中提取洞察，用 Python 处理数据
- **你是研究员**：擅长搜索和整理信息，写出结构化的研究报告
- **你是写手**：擅长把研究发现转化为流畅的 Markdown 文章

然后你告诉 CrewAI："按顺序执行：先让研究员调研，研究员完成后把结果交给数据分析师验证，最后让写手整合成报告。"Agent 们就像真正的团队一样协作。

## 核心概念

### Agent（智能体）

Agent 是 CrewAI 的基本执行单元。每个 Agent 由以下要素定义：

| 属性 | 说明 | 示例 |
|------|------|------|
| role | 角色名称 | "Senior Data Analyst" |
| goal | 角色的目标 | "从数据中提取可执行的商业洞察" |
| backstory | 背景故事 | "你在一家顶级咨询公司工作了10年，擅长数据驱动的决策" |
| llm | 使用的 LLM 模型 | `ChatOpenAI(model="gpt-5.5")`  # 2026年推荐 |
| tools | 可使用的工具列表 | `[SerperDevTool(), ScrapeWebsiteTool()]` |
| verbose | 是否输出详细日志 | `True` |
| allow_delegation | 是否允许委托给其他 Agent | `False` |

### Task（任务）

Task 定义 Agent 需要完成的工作：

| 属性 | 说明 |
|------|------|
| description | 任务描述，越具体越好 |
| expected_output | 期望的输出格式和内容 |
| agent | 分配给哪个 Agent |
| context | 依赖的其他 Task 的输出 |
| async_execution | 是否异步执行 |

### Crew（团队）

Crew 是 Agent 和 Task 的集合，以及执行流程的定义。

### Process（执行流程）

| 流程类型 | 说明 |
|----------|------|
| Process.sequential | 顺序执行：Task 按定义顺序依次执行 |
| Process.hierarchical | 层级执行：一个 Manager Agent 分配任务给其他 Agent，类似项目经理 |

## 代码示例：2 个 Agent 协作完成研究报告

```python
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, ScrapeWebsiteTool

# 定义工具
search_tool = SerperDevTool()
scrape_tool = ScrapeWebsiteTool()

# Agent 1: 研究员
researcher = Agent(
    role="Research Analyst",
    goal="深入调研{ topic }的最新发展，撰写调研报告",
    backstory="你是一位资深研究员，擅长信息搜集和整理。你注重事实准确性，会交叉验证多个来源。",
    tools=[search_tool, scrape_tool],
    verbose=True,
    allow_delegation=False,
)

# Agent 2: 写手
writer = Agent(
    role="Technical Writer",
    goal="将研究结果转化为结构清晰、可读性强的 Markdown 文章",
    backstory="你是一位技术写手，擅长将复杂信息转化为易于理解的文字。你的文章结构清晰、逻辑严密。",
    tools=[],
    verbose=True,
    allow_delegation=False,
)

# Task 1: 研究
research_task = Task(
    description="调研{ topic }的最新进展，包括核心技术、主要玩家、市场趋势",
    expected_output="一份结构化的调研笔记，包含关键发现、数据来源、对比分析",
    agent=researcher,
)

# Task 2: 写作
write_task = Task(
    description="基于研究结果，撰写一篇 1500 字的 Markdown 文章",
    expected_output="一篇结构完整的 Markdown 文章，包含标题、引言、主体段落、结论",
    agent=writer,
    context=[research_task],  # 依赖 research_task 的输出
)

# 组建 Crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential,
    verbose=True,
)

# 启动
result = crew.kickoff(inputs={"topic": "2026年AI Agent框架"})
print(result)
```

## CrewAI vs AutoGen vs LangGraph 对比

| 维度 | CrewAI | AutoGen | LangGraph |
|------|--------|---------|-----------|
| 设计哲学 | 角色扮演，团队协作 | 对话驱动，Agent 通过聊天协作 | 图编排，用有向图定义工作流 |
| 主要维护方 | CrewAI Inc. | Microsoft | LangChain |
| 执行模式 | 顺序 (Sequential) / 层级 (Hierarchical) | 对话轮次，支持 GroupChat | 有向图（节点+边），支持循环和分支 |
| Human-in-the-loop | 支持（通过 human_input） | 原生支持（核心设计） | 支持（通过 interrupt） |
| 学习曲线 | 低，概念直观 | 中，对话模式需理解 | 高，需要理解图编程 |
| 适合场景 | 快速原型、角色扮演类任务 | 企业级、需要人工审核的工作流 | 生产级复杂 Agent 系统 |
| 2026 年生态 | 社区活跃，文档完善 | 微软 Azure 生态集成 | LangChain 生态，LangSmith 可观测 |

## 2026 年定位

CrewAI 在 2026 年的定位是：**最适合快速原型和角色扮演类任务的多 Agent 框架**。

- 优点：概念直观（角色、任务、团队），上手极快，适合演示和 PoC
- 缺点：控制流不如 LangGraph 灵活，复杂场景下需要更多自定义
- 典型场景：研究报告生成、内容创作流水线、简单的多 Agent 协作

如果你需要在 30 分钟内搭出一个多 Agent Demo，CrewAI 是首选。如果要做生产级系统，应该考虑 LangGraph。

## 相关笔记

- [[Ch16 多 Agent 协作]] — 多 Agent 协作的通用概念和模式
- [[深挖-AutoGen]] — 微软的对话式多 Agent 框架
- [[深挖-LangGraph]] — LangChain 的图编排引擎
- [[概念-MultiAgent]] — 多 Agent 系统综述
- [[Ch14 Agent 工作原理]] — Agent 的核心工作机制

## 来源

- https://docs.crewai.com/ — CrewAI 官方文档
- https://github.com/crewAIInc/crewAI — CrewAI GitHub 仓库
- https://www.crewai.com/ — CrewAI 官网
- https://arxiv.org/abs/2308.11432 — AutoGen 论文 (多 Agent 框架对比参考)