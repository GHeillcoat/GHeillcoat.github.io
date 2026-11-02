---
title: "深挖 AutoGen"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch16 多Agent协作"
tags: ["AI/Agent", "框架/AutoGen", "多Agent协作", "微软"]
aliases: ["AutoGen", "微软AutoGen", "对话式Agent"]
---
## 一句话理解

AutoGen 是**微软开源的对话式多 Agent 框架**。它的核心设计是：Agent 之间通过**对话（Conversation）**来协作完成任务。每个 Agent 可以发送和接收消息，通过多轮对话达成共识或完成目标。与 CrewAI 的"角色扮演"不同，AutoGen 更强调 Agent 之间的**对话流**。

## 核心概念

### ConversableAgent（可对话 Agent）

AutoGen 的核心抽象是 `ConversableAgent`。所有 Agent 都继承自它，具备发送消息、接收消息、处理回复的能力。

| 属性 | 说明 |
|------|------|
| name | Agent 名称 |
| system_message | 系统提示词，定义 Agent 的角色和行为 |
| llm_config | LLM 配置（模型、温度等） |
| human_input_mode | 人工介入模式：NEVER / TERMINATE / ALWAYS |
| code_execution_config | 代码执行配置（如 Docker 沙箱） |
| function_map | 可调用的函数映射 |

### GroupChat（群聊）

`GroupChat` 是 AutoGen 中多 Agent 协作的核心机制。多个 Agent 加入一个群聊，由一个 `GroupChatManager` 管理发言顺序。

```
User -> GroupChatManager -> Agent A -> GroupChatManager -> Agent B -> ...
```

### 对话驱动的工作流

AutoGen 的工作流是**对话驱动**的，而不是预定义的 DAG（有向无环图）。Agent 之间通过自然语言对话来协商、传递信息、触发动作。

### 人工介入（Human-in-the-Loop）

AutoGen 原生支持人工介入，这是其核心设计之一：

| 模式 | 行为 |
|------|------|
| `NEVER` | 从不询问人类 |
| `TERMINATE` | 仅在终止时询问人类 |
| `ALWAYS` | 每次 Agent 回复前都询问人类 |

## AutoGen vs CrewAI：协作模式对比

| 维度 | AutoGen | CrewAI |
|------|---------|--------|
| 协作方式 | 对话驱动，Agent 通过消息交流 | 角色扮演，Agent 按流程执行任务 |
| 控制流 | 对话轮次决定，灵活但不确定 | 顺序 (Sequential) 或层级 (Hierarchical)，确定性强 |
| 人工介入 | 原生支持，核心设计 | 支持但非核心 |
| 代码执行 | 原生支持 Docker 沙箱执行代码 | 通过工具 (Tool) 支持 |
| 生态 | 微软 Azure、VS Code 集成 | 独立生态，社区活跃 |
| 适合场景 | 企业级、需要人工审核的工作流 | 快速原型、内容生成流水线 |

## 代码示例：2 个 Agent 对话解决任务

```python
import autogen

# 配置 LLM
config_list = [{"model": "gpt-5.5", "api_key": "..."}]  # 2026年推荐使用 GPT-5.5 或 Claude Opus 4.8

llm_config = {"config_list": config_list, "temperature": 0}

# Agent 1: 助手 (Assistant)
assistant = autogen.AssistantAgent(
    name="assistant",
    system_message="你是一个专业的 Python 数据分析师。收到任务后，先分析需求，再编写代码，最后解释结果。",
    llm_config=llm_config,
)

# Agent 2: 代码执行者 (UserProxy)
user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="TERMINATE",  # 仅在终止时征求人类意见
    max_consecutive_auto_reply=10,
    code_execution_config={
        "work_dir": "coding",
        "use_docker": False,  # 本地执行
    },
    system_message="你是用户代理，负责执行代码并报告结果。",
)

# 启动对话
user_proxy.initiate_chat(
    assistant,
    message="分析 iris 数据集：加载数据、计算各类别的平均特征值、绘制散点图矩阵。",
)
```

## 2026 年定位

AutoGen 在 2026 年的定位是：**微软 Azure 生态下的企业级多 Agent 框架**。

- 优点：
  - 人工介入 (Human-in-the-loop) 设计成熟，适合需要审批的工作流
  - 原生代码执行支持（Docker 沙箱），安全性好
  - 与 Azure 生态深度集成（Azure OpenAI Service、Azure Functions）
  - 群聊模式灵活，Agent 数量可以动态变化
- 缺点：
  - 对话驱动意味着控制流不够确定，调试困难
  - 学习曲线比 CrewAI 高
  - 对话轮次消耗大，token 成本较高
- 典型场景：企业数据分析、自动化报表生成、需要人工审核的决策流程、代码生成与执行

## 相关笔记

- [[深挖-CrewAI]] — 角色扮演式多 Agent 框架
- [[深挖-LangGraph]] — 图编排引擎，生产级 Agent 首选
- [[概念-MultiAgent]] — 多 Agent 系统综述
- [[Ch16 多 Agent 协作]] — 多 Agent 协作的通用概念和模式
- [[深挖-CrewAI]] — CrewAI 深度对比

## 来源

- https://microsoft.github.io/autogen/ — AutoGen 官方文档
- https://github.com/microsoft/autogen — AutoGen GitHub 仓库
- https://arxiv.org/abs/2308.08155 — AutoGen 论文 "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation"
- https://learn.microsoft.com/en-us/azure/ai-services/openai/ — Azure OpenAI Service