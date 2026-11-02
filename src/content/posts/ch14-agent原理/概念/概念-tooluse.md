---
title: "概念-ToolUse"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch14 Agent原理"
tags: ["AI", "智能体", "工具调用", "基础概念", "Anthropic", "Claude"]
aliases: ["Tool Use", "工具使用", "Tool Calling", "Anthropic Tool Use"]
---
## 一句话理解

Tool Use是Anthropic对Function Calling的叫法——模型选择并调用外部工具以获取实时信息或执行操作。两者本质相同（JSON Schema + 结构化调用），但Tool Use在工具定义结构、错误处理、流式调用等方面有独特设计。

## Tool Use = Function Calling的本质

Tool Use和Function Calling是同一概念的不同实现，核心机制完全一致：

1. **定义工具**：用JSON Schema描述工具的名称、功能、参数
2. **模型选择**：模型判断是否需要调用工具，需要哪个工具
3. **结构化输出**：模型返回工具名+参数JSON，而非自然语言
4. **代码执行**：开发者代码执行实际工具调用
5. **结果返回**：工具执行结果返回给模型，模型生成最终回答

## Tool Use的独特设计

### 工具定义更结构化

Anthropic的Tool Use工具定义采用更严格的结构化格式：

```json
{
  "name": "get_weather",
  "description": "Get the current weather for a specific city",
  "input_schema": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "City name, e.g. 'San Francisco, CA'"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "Temperature unit"
      }
    },
    "required": ["city"]
  }
}
```

关键特征：
- `input_schema`替代了OpenAI的`parameters`字段
- 对`description`的要求更高——模型完全靠描述理解工具
- `enum`约束更加明确

### 支持并行工具调用

Claude可以同时发起多个独立的工具调用，无需等待彼此的结果：

```
用户: "比较旧金山和纽约的天气"
→ Claude同时调用:
  - get_weather(city="San Francisco", unit="celsius")
  - get_weather(city="New York", unit="celsius")
→ 两个结果都返回后，Claude生成对比回答
```

### 流式工具调用

Claude支持在流式输出中增量返回工具调用。开发者在收到`content_block_start`（tool_use类型）后，可以逐步接收工具调用的参数，而不用等完整响应。

流式工具调用的三种事件类型：

| 事件类型 | 说明 | 时机 |
|----------|------|------|
| `content_block_start` | 开始一个新的tool_use块 | 工具调用开始 |
| `content_block_delta` | 增量工具调用参数 | 参数逐步传输 |
| `content_block_stop` | 工具调用块结束 | 参数传输完成 |

## 工具设计最佳实践

### 描述要清晰

模型完全依赖工具描述来决定何时调用、如何调用。描述应包含：

1. **工具用途**：一句话说明这个工具做什么
2. **使用场景**：什么时候应该用这个工具
3. **参数说明**：每个参数的含义、格式、示例
4. **约束条件**：参数的限制和默认值

### 参数要约束

使用`enum`、`pattern`、`minLength`等JSON Schema约束来限制参数值范围，减少模型传错参数的概率。

### 错误处理

工具调用可能失败，需要在工具定义中告诉模型如何处理错误：

```json
{
  "name": "search_database",
  "description": "Search the database. If no results found, returns empty array. Do NOT retry with the same query."
}
```

### 工具数量控制

| 工具数量 | 适用场景 | 注意事项 |
|----------|----------|----------|
| 1-5个 | 专用Agent | 模型选择准确率高 |
| 5-20个 | 通用Agent | 需要清晰的描述区分 |
| 20+个 | 复杂平台 | 建议用工具分组或动态加载 |

## Tool Use vs Function Calling 详细对比

| 维度 | Tool Use (Anthropic) | Function Calling (OpenAI) |
|------|---------------------|--------------------------|
| 提出时间 | 2024年3月 | 2023年6月 |
| 工具定义 | `tools`数组 + `input_schema` | `functions`数组 + `parameters` |
| 并行调用 | 原生支持，自动判断独立性 | 支持(`parallel_tool_calls`) |
| 流式调用 | 增量content_block事件 | delta function_call事件 |
| 强制使用工具 | `tool_choice`参数 | `tool_choice`参数 |
| 停止原因 | `stop_reason: "tool_use"` | `finish_reason: "tool_calls"` |
| 工具结果回传 | `tool_result` content block | `tool` role message |
| 文档质量 | 详细，有最佳实践指南 | 详细，生态更成熟 |
| 典型模型 | Claude Opus 4.8/Claude Sonnet 4.6 全系列 | GPT-5.5/GPT-5.6 全系列 |

## 2026年：趋同与标准化

### 两种叫法趋同

在2026年，"Function Calling"和"Tool Use"这两个术语已经高度趋同。开发者社区通常混用，技术文档中两者并提。核心原理完全一致，区别仅在于API细节。

### MCP统一了工具连接标准

MCP (Model Context Protocol) 解决了"工具如何被发现和连接"的问题。在MCP生态中：

- **MCP Server**：工具提供方，实现MCP协议
- **MCP Client**：模型/Agent，通过MCP协议发现和调用工具
- **传输层**：STDIO（本地进程通信）或SSE（远程HTTP通信）

无论底层是OpenAI的Function Calling还是Anthropic的Tool Use，MCP提供统一的工具连接层。

### 工具调用能力的普及

| 模型 | 工具调用支持 | 备注 |
|------|-------------|------|
| Claude Opus 4.8 / Sonnet 4.6 | Tool Use | 原生支持，设计优秀 |
| GPT-5.5 / GPT-5.6 | Function Calling | 最早推出，生态最成熟 |
| Gemini 3.5 Pro | Function Calling | Google Cloud生态 |
| Llama 4.1 | 支持 | 开源实现 |
| DeepSeek-V4 | 支持 | 国产模型支持 |

## 相关笔记

- [[概念-FunctionCalling]] — OpenAI的工具调用实现
- [[Ch14 Agent 工作原理]] — Agent如何使用工具
- [[概念-MCP]] — 工具连接的标准化协议
- [[概念-工具调用]] — 工具调用的通用理解
- [[概念-ReActAgent]] — 工具调用在ReAct循环中的角色
- [[Ch15 Agent 通信协议]] — Agent间通信

## 来源

- Anthropic Tool Use Documentation: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- Anthropic Tool Use Best Practices: https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview
- MCP Specification: https://modelcontextprotocol.io/
- OpenAI Function Calling vs Anthropic Tool Use Comparison: https://docs.anthropic.com/en/docs/build-with-claude/tool-use