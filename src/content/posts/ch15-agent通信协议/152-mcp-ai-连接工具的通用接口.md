---
title: "15.2 MCP：AI 连接工具的通用接口"
description: "2024 年 11 月，AI 公司 Anthropic 公开了 MCP（模型上下文协议）^Anthropic, MCP, 2024.11.25, https://www.anthropic.com/news/model-context-protocol。它解决的问题很简单：让任何"
pubDate: 2026-06-30
updatedDate: 2026-07-02
category: "Ch15 Agent通信协议"
tags: ["协议", "智能体"]
aliases: ["MCP：AI 连接工具的通用接口", "15.2 MCP-AI 连接工具的通用接口"]
---
2024 年 11 月，AI 公司 Anthropic 公开了 MCP（模型上下文协议）^[Anthropic, MCP, 2024.11.25, https://www.anthropic.com/news/model-context-protocol]。它解决的问题很简单：**让任何一个 AI 都能用同一套标准调用任何工具。**

打个比方：在 USB 出现之前，手机充电口五花八门——苹果用 Lightning，其他用 Micro USB。你换手机就得换充电线。USB-C 统一了这个混乱。MCP 就是 AI 和工具之间的 USB-C——只要工具支持 MCP，任何 AI 都能调用它。

### 15.2.1 MCP 的架构：Client-Server

MCP 采用经典的客户端-服务器架构：

```
┌─────────────┐         ┌─────────────────┐
│  MCP Client │ ◄─────► │   MCP Server    │
│  (AI 应用)   │  JSON   │  (工具提供方)    │
└─────────────┘         └─────────────────┘
```

- **MCP Client**：通常是 AI 应用（Claude Desktop、Claude Code、Cursor 等），它发起请求，调用 Server 提供的能力
- **MCP Server**：工具的实现方，暴露 Resources、Tools、Prompts 等能力
- **通信协议**：JSON-RPC 2.0 —— 基于 JSON 的远程过程调用，请求和响应都是结构化的 JSON 数据

### 15.2.2 两种传输方式

MCP 支持两种传输层，适应不同场景：

| 传输方式 | 原理 | 适用场景 |
|---|---|---|
| **STDIO** | 通过标准输入输出通信，Server 作为子进程运行 | 本地工具、命令行场景（如 Claude Code 调用本地文件系统） |
| **SSE**（Server-Sent Events） | 通过 HTTP 长连接推送事件 | 远程工具、Web 服务（如远程数据库、云端 API） |

STDIO 适合"本机工具"——你的 AI 编程助手调用你电脑上的文件系统、数据库。SSE 适合"远程工具"——你的 AI 调用部署在云端的搜索服务、知识库。

### 15.2.3 三种核心能力

MCP Server 可以暴露三种能力给 AI 使用：

**1. Resources（资源）**：提供上下文数据。相当于"给 AI 看的资料"。
- 文件内容、数据库记录、API 文档、知识库条目
- 例如：一个"公司知识库" MCP Server 暴露 `knowledge://policy/leave` 作为 resource，AI 可以读取请假政策

**2. Tools（工具）**：可执行的操作。相当于"AI 可以做的事情"。
- 查询天气、发送邮件、创建文件、搜索数据库
- 例如：一个"天气" MCP Server 暴露 `get_weather(city)` 作为 tool，AI 调用它获取天气

**3. Prompts（提示词模板）**：预定义的提示词模板。相当于"给 AI 的指令模板"。
- 标准化的对话模板、工作流模板
- 例如：一个"代码审查" MCP Server 暴露 `review_code` 作为 prompt 模板，AI 按模板格式进行代码审查

有了 MCP，你可以：
- 写一个"查询天气"的工具，按 MCP 标准打包
- Claude 能用它
- GPT 也能用它
- 任何支持 MCP 的 AI 都能用它

### 15.2.4 代码示例：定义一个 MCP Server

下面是一个最简单的 MCP Server，暴露一个"加法"工具：

```python
# mcp_server.py
from mcp.server import Server, stdio_server
from mcp.types import Tool, TextContent

# 创建 MCP Server
server = Server("my-calculator")

# 定义一个工具：加法
@server.tool()
async def add(a: float, b: float) -> list[TextContent]:
    """计算两个数的和"""
    result = a + b
    return [TextContent(type="text", text=f"结果: {result}")]

# 通过 STDIO 启动服务
if __name__ == "__main__":
    import asyncio
    asyncio.run(stdio_server(server))
```

把这个 Server 配置到 Claude Desktop 的 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "my-calculator": {
      "command": "python",
      "args": ["mcp_server.py"]
    }
  }
}
```

配置完成后，Claude Desktop 启动时自动拉起这个 Python 进程，发现它暴露的 `add` 工具。用户说"帮我算 123 + 456"，AI 不会自己算——它调用 `add(123, 456)` 工具来获取精确结果。这就是 MCP 的核心价值：**AI 不需要"知道"答案，它只需要知道"谁"有答案。**

> 想了解 MCP 更完整的架构和生态，看 [[概念-MCP]]。想了解 MCP 和 A2A 的配合方式，看 [[概念-MCP+A2A]]。

---

> ← 上一节：[[15.1 问题-每个 Agent 各说各话]] ｜ 下一节：[[15.3 A2A-Agent 之间的通信协议]] →
