---
title: "概念-ReActAgent"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch14 Agent原理"
tags: ["AI", "智能体", "推理范式", "基础概念", "LLM"]
aliases: ["ReAct循环", "ReAct模式", "ReAct 模式", "ReAct Agent", "ReAct Agent", "ReAct框架", "Thought-Action-Observation"]
---
## 一句话理解

ReAct Agent是Reasoning + Acting交替循环的Agent范式：Think(思考) → Act(行动) → Observe(观察) → Think(再思考)...直到任务完成。模型不只是"说"，而是"想一步、做一步、看结果、再想下一步"。

## 零基础理解

**你让助手查天气并决定穿什么：**

1. 助手先想："我需要知道今天天气"（Think）
2. 助手行动：调用天气API查北京天气（Act）
3. 助手看到结果："20度，晴天"（Observe）
4. 助手再想："20度不冷，穿薄外套就行"（Think）
5. 助手行动：告诉你结论"穿薄外套"（Act）

这个"想→做→看→再想"的循环，就是ReAct的核心。它让模型从"一次性回答"变成了"分步推理+执行"的智能体。

## 核心概念

### Thought-Action-Observation循环

ReAct的核心是一个三阶段循环：

| 阶段 | 英文 | 说明 | 示例 |
|------|------|------|------|
| 思考 | Thought | 模型分析当前状态，决定下一步做什么 | "我需要查诺贝尔奖得主的出生年份" |
| 行动 | Action | 模型执行具体操作（调用工具、搜索等） | `search("2024 Nobel Prize winner")` |
| 观察 | Observation | 模型获取行动结果，作为下一轮思考的输入 | "搜索结果：John Smith, 1965年出生" |

### 中间思考步骤

ReAct的关键创新是**让模型输出中间推理过程**。在纯对话模式中，模型的推理是"黑箱"的；在ReAct中，每一步推理都被显式输出，这带来三个好处：

1. **可解释性**：你能看到模型为什么做了某个决定
2. **可调试性**：出错时能定位是哪一步推理出了问题
3. **自我纠错**：模型看到错误结果后可以调整策略

### 根据上一步结果调整策略

ReAct Agent不是按固定流程执行的。它会根据每一步的Observation动态调整后续计划。例如：

- 如果搜索结果不相关 → 换搜索词
- 如果工具调用失败 → 换另一种方式
- 如果发现新信息 → 改变原计划

## 完整示例：查诺贝尔奖得主年龄

以下是一个完整的4轮ReAct循环：

### 第1轮

```
Thought: 用户想知道2024年诺贝尔物理学奖得主的年龄。
         我需要先知道是谁获奖。
Action: search("2024 Nobel Prize in Physics winner")
Observation: John Hopfield and Geoffrey Hinton won the 2024
             Nobel Prize in Physics.
```

### 第2轮

```
Thought: 有两位获奖者。我需要查他们的出生年份。
         先查John Hopfield。
Action: search("John Hopfield birth year")
Observation: John Hopfield was born in 1933.
```

### 第3轮

```
Thought: John Hopfield 1933年出生，2024年获奖，年龄是91岁。
         现在查Geoffrey Hinton。
Action: search("Geoffrey Hinton birth year")
Observation: Geoffrey Hinton was born in 1947.
```

### 第4轮

```
Thought: Geoffrey Hinton 1947年出生，2024年获奖，年龄是77岁。
         我已经有了所有需要的信息，可以给出最终答案了。
Action: finish("2024年诺贝尔物理学奖得主：John Hopfield(91岁)
         和Geoffrey Hinton(77岁)")
```

## ReAct vs 纯对话 vs Function Calling

| 维度 | 纯对话(Pure Chat) | Function Calling | ReAct Agent |
|------|-------------------|------------------|-------------|
| 推理方式 | 一次性生成 | 按需调用工具 | 多步推理+迭代 |
| 工具调用 | 不支持 | 支持，单次或并行 | 支持，循环调用 |
| 中间步骤 | 不可见 | 部分可见 | 完全可见 |
| 自我纠错 | 不支持 | 有限 | 支持 |
| 复杂任务 | 差 | 中等 | 好 |
| 执行时间 | 短 | 中等 | 长 |
| 成本 | 低 | 中等 | 高（多次调用） |
| 适用场景 | 简单问答、写作 | 查天气、数据库查询 | 研究、多步分析 |

## 2026年定位

ReAct仍是Agent设计的基础范式。几乎所有主流Agent框架都实现了ReAct循环或其变体：

- **LangChain**：AgentExecutor封装了ReAct循环
- **LangGraph**：用状态图实现更灵活的ReAct
- **CrewAI**：每个Agent内部使用ReAct模式
- **AutoGen**：对话式Agent，底层也是ReAct
- **OpenAI Assistants API**：内置的Agent循环就是ReAct

### ReAct的变体

| 变体 | 改进点 | 代表框架 |
|------|--------|----------|
| ReAct + Planning | 先做整体规划再执行 | LangGraph, Plan-and-Execute |
| ReAct + Reflection | 完成任务后自我反思 | Reflexion |
| ReAct + Memory | 跨任务记忆 | MemGPT, Letta |
| ReAct + Tree Search | 多路径探索 | Tree of Thoughts |

## 相关笔记

- [[Ch14 Agent 工作原理]] — Agent的完整架构
- [[概念-纯对话]] — ReAct要解决的核心问题
- [[概念-FunctionCalling]] — ReAct中Action的技术基础
- [[深挖-ReAct循环]] — ReAct的深入技术分析
- [[Ch15 Agent 通信协议]] — Agent间如何通信
- [[概念-ToolUse]] — 工具调用的Anthropic实现

## 来源

- Yao et al. "ReAct: Synergizing Reasoning and Acting in Language Models" (2022): https://arxiv.org/abs/2210.03629
- Lilian Weng "LLM Powered Autonomous Agents": https://lilianweng.github.io/posts/2023-06-23-agent/
- LangChain ReAct Documentation: https://python.langchain.com/docs/modules/agents/agent_types/react
- Anthropic Tool Use Best Practices: https://docs.anthropic.com/en/docs/build-with-claude/tool-use