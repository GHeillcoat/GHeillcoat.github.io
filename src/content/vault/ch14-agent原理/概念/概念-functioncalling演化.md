---
title: "Function Calling 演化"
date: 2026-07-01
updated: 2026-07-06
category: "Ch14 Agent原理"
tags: ["FunctionCalling", "ToolUse", "MCP", "演化", "Agent", "API"]
aliases: ["FC演化", "Function Calling发展史", "Tool Calling演化"]
prerequisites: "Function Calling,Tool Use,MCP"
source: "笔记/Ch14 Agent原理/概念/概念-FunctionCalling演化.md"
---
## 一句话理解

从无 Function Calling 时代的提示词注入 Hack，到 2026 年 MCP (Model Context Protocol) 标准化——Function Calling 经历了四次重大跃迁：无 FC 时代（Prompt Injection / Hook）→ OpenAI Function Calling (JSON Schema) → Tool Use（标准化+并行+流式）→ MCP（跨模型统一协议），每一次跃迁都让 Agent 的工具调用能力更加可靠、高效和通用。

## 四个阶段

### 阶段一：无 FC 时代（2022-2023）

在 Function Calling API 出现之前，开发者通过"欺骗"模型来让它"调用工具"：

**技术手段**：
- **提示词注入 (Prompt Injection)**：在 System Prompt 中描述可用函数，要求模型输出特定格式的文本（如 JSON），然后由外部代码解析并执行
- **Hook 机制**：在应用层拦截模型输出，匹配预定义模式，触发对应的函数调用

**代表实现**：
- LangChain 的 `AgentExecutor` + `Tool` 抽象（2023年初）
- AutoGPT 的 Command 解析（2023年3月）
- BabyAGI 的任务执行循环（2023年4月）

**核心局限**：
- 输出格式不可靠（模型可能输出非 JSON 或格式错误的 JSON）
- 需要大量 Prompt 工程来约束输出格式
- 无法并行调用多个工具
- 每次调用都需要完整的上下文往返

### 阶段二：OpenAI Function Calling（2023年6月）

OpenAI 在 GPT-4-0613 和 GPT-3.5-turbo-0613 中首次引入原生 Function Calling：

**技术突破**：
- 模型原生支持 JSON Schema 定义函数参数
- 模型直接输出 `function_call` 对象（而非文本），可靠性大幅提升
- 支持在一次响应中指定要调用的函数名和参数

**核心局限**：
- 仅 OpenAI 模型支持，生态锁定
- 不支持并行调用多个函数
- 不支持流式 Function Calling（Streaming）
- 函数定义和参数管理在应用层，缺乏统一标准

### 阶段三：Tool Use 标准化（2024）

2024年，各大模型厂商纷纷推出自己的 Tool Use API，并开始标准化：

**技术突破**：
- **并行调用**：支持一次返回多个 tool_call，Agent 可并行执行多个工具
- **流式 Tool Use**：在 Streaming 模式下逐步输出 tool_call 参数，减少用户等待
- **多模态输入**：工具可以接收图片、音频等非文本输入
- **强制 Tool Use**：模型可被要求必须调用某个工具

**代表实现**：
- Anthropic Claude Tool Use (2024年3月)
- Google Gemini Function Calling (2024年2月)
- OpenAI 的 Parallel Function Calling (2024年)
- Mistral 的 Function Calling (2024年)

**核心局限**：
- 各家 API 格式不同，切换模型成本高
- 工具定义（Tool Definition）没有统一标准
- 缺乏工具发现和服务端管理机制

### 阶段四：MCP 统一协议（2024年底-2026）

MCP (Model Context Protocol) 由 Anthropic 于2024年11月发布，将 Tool Use 提升到跨模型、跨平台的协议层面：

**技术突破**：
- **跨模型统一**：同一套 MCP Server 可被不同模型（Claude、GPT、Gemini）使用
- **工具发现**：MCP Server 自动暴露可用工具列表，Client 动态发现
- **资源管理**：MCP 不仅管理工具，还管理 Resources（数据源）和 Prompts（提示词模板）
- **传输层抽象**：支持 stdio 和 HTTP SSE 两种传输方式
- **OAuth 安全**：2025年引入 OAuth 2.0 认证授权

## 演化时间线

| 阶段 | 时间 | 代表技术 | 核心突破 | 核心局限 |
|:---|:---|:---|:---|:---|
| 无 FC 时代 | 2022-2023上半年 | Prompt Injection, LangChain Agent | 概念验证：模型可以"调用工具" | 输出不可靠，格式解析易出错 |
| OpenAI FC | 2023年6月 | OpenAI Function Calling API | 原生 JSON Schema，可靠输出 | 仅 OpenAI 生态，不可并行 |
| Tool Use 标准化 | 2024全年 | Claude Tool Use, Gemini FC, 并行调用 | 并行+流式+多模态+强制调用 | 各家格式不同，缺乏统一标准 |
| MCP 统一协议 | 2024年底-2026 | MCP, A2A, MCP Server 生态 | 跨模型统一，工具发现，资源管理 | 生态仍在建设中，部分场景覆盖不足 |

## 技术关键点对比

| 维度 | 无 FC 时代 | OpenAI FC | Tool Use | MCP |
|:---|:---|:---|:---|:---|
| 输出格式 | 自由文本 | 结构化 JSON | 结构化 ToolCall | 结构化 ToolCall (统一格式) |
| 可靠性 | 低 (~70%) | 高 (~95%) | 很高 (~99%) | 很高 (~99%) |
| 并行调用 | 不支持 | 不支持 | 支持 | 支持 |
| 流式调用 | 不支持 | 不支持 | 支持 | 支持 |
| 跨模型 | 跨模型（但适配成本高） | 仅 OpenAI | 需适配各家 SDK | 原生跨模型 |
| 工具发现 | 无 | 无 | 无 | 自动发现 |
| 安全认证 | 无 | API Key | API Key | OAuth 2.0 |
| 生态成熟度 | 历史阶段 | 仍广泛使用 | 当前主流 | 快速增长中 |

## 2026年展望

1. **MCP 成为默认标准**：新项目默认使用 MCP 连接工具，旧项目逐步迁移
2. **MCP+A2A 协同**：MCP 管工具调用，A2A 管 Agent 间通信
3. **多模态 Tool Use**：工具可以接收和返回图片、音频、视频
4. **Human-in-the-Loop**：在 Tool Use 流程中嵌入人工审核节点
5. **工具市场**：可复用的工具包（Tool Package）市场和生态

## 相关笔记

- [[概念-FunctionCalling]] - Function Calling 详解
- [[概念-ToolUse]] - Tool Use 机制详解
- [[概念-MCP]] - Model Context Protocol 详解
- [[概念-上下文管理技术]] - 上下文管理技术
- [[Ch14 Agent 工作原理]] - Agent 工作原理章节
- [[概念-MCP+A2A]] - MCP+A2A 双协议生态
- [[概念-对话到Agent演化]] - 对话到 Agent 演化

## 来源

- OpenAI Function Calling 文档: https://platform.openai.com/docs/guides/function-calling
- Anthropic Tool Use 文档: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- MCP 官方规范: https://spec.modelcontextprotocol.io/
- LangChain 早期 Agent 实现: https://python.langchain.com/docs/modules/agents/
- AutoGPT GitHub: https://github.com/Significant-Gravitas/AutoGPT