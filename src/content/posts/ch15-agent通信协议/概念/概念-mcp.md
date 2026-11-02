---
title: "概念-MCP"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch15 Agent通信协议"
tags: ["AI", "智能体", "协议标准", "工具连接", "基础概念", "Anthropic"]
aliases: ["Model Context Protocol", "MCP", "MCP", "MCP协议", "Agent的USB协议"]
---
## 一句话理解

MCP (Model Context Protocol) 是Anthropic于2024年11月提出的Agent-工具连接标准协议，让任何Agent用任何工具——就像USB协议让任何USB设备插到任何电脑都能用。

## 零基础理解

**USB协议类比：**

USB出现之前，每种外设需要不同的接口：键盘用PS/2口，鼠标用串口，打印机用并口，扫描仪用SCSI口。每种设备需要专门的驱动，换个电脑就得重新配置。

USB出现后，一个接口连接所有设备，即插即用。任何USB设备插到任何电脑都能用。

**MCP就是Agent的USB协议：**

MCP出现之前，每个Agent需要为每个工具写专门的适配代码。Agent A想用天气工具，写一套；Agent B想用天气工具，再写一套。工具和Agent是N x M的耦合关系。

MCP出现后，工具开发者只需实现一次MCP Server，任何支持MCP的Agent都能调用。工具和Agent的关系变成了N + M。

## 核心概念

### 三大角色

| 角色 | 说明 | 示例 |
|------|------|------|
| MCP Server | 工具提供方，暴露资源和能力 | 天气API Server、数据库Server、文件系统Server |
| MCP Client | Agent/模型，发现和调用工具 | Claude Desktop、Claude Code、Cursor、Continue |
| MCP Host | 用户交互界面，管理Client生命周期 | Claude Desktop应用、VS Code、终端 |

### 三类能力

MCP定义了三种Server可以暴露给Client的能力：

| 能力类型 | 英文 | 说明 | 示例 |
|----------|------|------|------|
| 资源 | Resources | 暴露数据给Agent读取 | 文件内容、数据库记录、API文档 |
| 工具 | Tools | Agent可以调用的操作 | 发邮件、查天气、执行代码 |
| 提示词 | Prompts | 预定义的提示词模板 | "代码审查"模板、"翻译"模板 |

### 传输层

MCP支持两种传输方式：

| 传输方式 | 说明 | 适用场景 | 延迟 |
|----------|------|----------|------|
| STDIO | 标准输入输出，本地进程通信 | 本地工具、命令行Agent | 极低 |
| SSE (Server-Sent Events) | HTTP流式传输，远程通信 | 远程服务、云端工具 | 中等 |

### MCP架构图

```
┌─────────────────────────────────────────────┐
│                 MCP Host                     │
│  ┌───────────────────────────────────────┐  │
│  │           MCP Client                   │  │
│  │  (Claude Desktop / Claude Code / ...)  │  │
│  └───────────┬───────────────────────────┘  │
└──────────────┼──────────────────────────────┘
               │  MCP Protocol
     ┌─────────┼─────────┬──────────────┐
     │         │         │              │
┌────▼────┐ ┌──▼───┐ ┌───▼────┐ ┌──────▼─────┐
│  Files  │ │Weather│ │Database│ │  Custom    │
│ Server  │ │Server │ │ Server │ │  Server    │
└─────────┘ └───────┘ └────────┘ └────────────┘
```

## MCP vs 传统API调用

| 维度 | 传统API调用 | MCP协议 |
|------|-----------|---------|
| 工具发现 | 硬编码，需手动配置 | 自动发现（Server注册时声明能力） |
| 标准化 | 每个API有自己的规范 | 统一的协议规范 |
| 即插即用 | 需要写适配代码 | 实现MCP Server即可 |
| 安全模型 | 各自实现 | 统一的权限和授权机制 |
| 生态 | 碎片化 | 统一的工具市场 |
| 多Agent支持 | 需额外开发 | 原生支持多Client |
| 动态更新 | 需重启/重新部署 | 支持热更新 |

## MCP生态现状（2026年）

### 已支持的Client

| Client | 说明 | 状态 |
|--------|------|------|
| Claude Desktop | Anthropic官方桌面应用 | 生产可用 |
| Claude Code | Anthropic命令行Agent | 生产可用 |
| Cursor | AI编程编辑器 | 生产可用 |
| Continue | 开源AI编程助手 | 生产可用 |
| Zed | AI编辑器 | 支持中 |
| LangChain | Agent框架 | 集成中 |

### 已有的MCP Server数量

截至2026年中，MCP生态已有数千个开源MCP Server，覆盖常见工具和服务。官方MCP Server仓库中包含了：
- 文件系统操作
- 数据库查询（PostgreSQL、SQLite等）
- 云服务（AWS、GCP、Azure）
- 开发工具（GitHub、GitLab、Jira）
- 搜索和知识库（Brave Search、Pinecone、Notion）

## 2026年定位

MCP已成为Agent工具连接的事实标准。几个关键趋势：

1. **MCP + A2A互补**：MCP管Agent到工具的连接，A2A管Agent到Agent的连接
2. **企业采用加速**：企业将内部工具封装为MCP Server，统一Agent接入
3. **工具市场形成**：类似App Store的MCP Server市场出现
4. **安全标准化**：MCP授权和审计机制成熟

## 相关笔记

- [[概念-A2A]] — Agent间通信标准协议
- [[概念-MCP+A2A]] — MCP和A2A的互补关系
- [[Ch15 Agent 通信协议]] — Agent通信协议全景
- [[概念-FunctionCalling]] — OpenAI的工具调用实现
- [[概念-ToolUse]] — Anthropic的工具调用实现
- [[概念-MultiAgent]] — 多Agent系统中的工具共享

## 来源

- Anthropic MCP Announcement (2024.11): https://www.anthropic.com/news/model-context-protocol
- MCP Specification: https://modelcontextprotocol.io/
- MCP GitHub Repository: https://github.com/modelcontextprotocol
- MCP Server List: https://github.com/modelcontextprotocol/servers
- Anthropic MCP Introduction Blog: https://www.anthropic.com/engineering/announcing-the-model-context-protocol