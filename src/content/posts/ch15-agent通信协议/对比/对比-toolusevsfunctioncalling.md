---
title: "对比-ToolUsevsFunctionCalling"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch15 Agent通信协议"
tags: ["对比", "Tool Use", "Function Calling", "Agent"]
aliases: ["Tool Use vs Function Calling", "工具使用vs函数调用"]
---
## 概述

Tool Use（Anthropic）和 Function Calling（OpenAI）是让 LLM 调用外部工具/API 的机制。两者在技术本质上高度相似，但命名和部分细节存在差异。

## 核心对比

| 维度 | Tool Use (Anthropic) | Function Calling (OpenAI) |
|------|----------------------|---------------------------|
| 提出方 | Anthropic（Claude API） | OpenAI（GPT API） |
| 技术机制 | 本质相同：通过 JSON Schema 定义工具，模型返回结构化调用请求 |
| 工具定义格式 | JSON Schema，`tools` 参数传入 | JSON Schema，`tools` / `functions` 参数传入 |
| 并行调用 | 原生支持，模型可一次返回多个 tool_use block | 支持（2024 年起），`parallel_tool_calls` |
| 流式支持 | 支持，tool_use 可流式返回 | 支持，但部分场景需特殊处理 |
| 强制调用 | 可通过 `tool_choice` 参数指定 | 支持 `tool_choice: "required"` |
| 多轮交互 | content block 模型，可混合文本和工具调用 | 消息数组模型，每轮 tool 消息后追加 assistant 消息 |
| 响应格式 | `tool_use` content block，独立于文本 | `tool_calls` 数组，附加在 assistant message 上 |
| 服务端执行 | 否，需客户端执行并返回结果 | 否，需客户端执行并返回结果 |
| 2026 趋势 | 两者趋同，MCP 协议统一工具发现与执行层 |

## 实际差异

尽管机制相同，实际使用中需注意：
1. **JSON Schema 细节**：部分字段（如 `required`、`additionalProperties`）的默认行为可能不同
2. **流式解析**：Anthropic 的 content block 模型在流式场景下解析更直观
3. **错误处理**：两者对"模型拒绝调用工具"的表现形式不同

## 统一趋势

MCP（Model Context Protocol）在工具发现与执行层提供了统一抽象，屏蔽了底层 API 差异。无论是 Tool Use 还是 Function Calling，上层都可通过 MCP Server 以相同方式暴露工具。

## 相关笔记

- [[概念-ToolUse]] — Anthropic Tool Use 详解
- [[概念-FunctionCalling]] — OpenAI Function Calling 详解
- [[概念-MCP]] — Model Context Protocol
- [[对比-MCPvsA2A]] — MCP 与 A2A 协议对比
- [[Ch15 Agent 通信协议]] — Agent 通信协议章节

## 来源

- Anthropic Tool Use 官方文档
- OpenAI Function Calling 官方文档
- MCP 协议规范 (modelcontextprotocol.io)