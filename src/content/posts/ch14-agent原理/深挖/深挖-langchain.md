---
title: "深挖 LangChain"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch14 Agent原理"
tags: ["AI/Agent", "框架/LangChain", "LLM应用开发", "Chain"]
aliases: ["LangChain", "LCEL", "LangChain框架"]
---
## 一句话理解

LangChain 是 **LLM 应用开发框架**，把 **Prompt + LLM + Tool** 串成 **Chain（链）**，适合构建线性流程的 LLM 应用。它曾是 AI Agent 开发的事实标准，但在 2026 年，新项目普遍使用 LangGraph 替代，LangChain 主要用于存量代码和简单场景。

## 核心概念

### Chain（链）

Chain 是 LangChain 的核心抽象。一个 Chain 把多个组件串联起来：

```
[Prompt Template] --> [LLM] --> [Output Parser] --> [Next Step]
```

### Prompt Template（提示词模板）

将动态变量插入到预定义的提示词结构中：

```python
from langchain.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    ("system", "你是一个{ role }，擅长{ skill }。"),
    ("user", "{ input }"),
])
```

### LLM Wrapper（LLM 封装）

LangChain 提供了统一的 LLM 接口，支持 50+ 模型提供商：

| 模型类 | 对应模型 |
|--------|----------|
| `ChatOpenAI` | GPT-5.5, GPT-5.6, GPT-5 |
| `ChatAnthropic` | Claude Opus 4.8, Claude Sonnet 4.6 |
| `ChatGoogleGenerativeAI` | Gemini 3.5 Pro, Gemini 3.5 Flash |
| `ChatMistralAI` | Mistral Large 3, Mixtral 3 |
| `ChatOllama` | 本地 Llama 4.1, Qwen 3.7 等 |

### Tool（工具）

LangChain 的 Tool 抽象让 LLM 可以调用外部工具：

```python
from langchain.tools import tool

@tool
def search(query: str) -> str:
    """搜索互联网获取最新信息"""
    return serper.search(query)

@tool
def calculator(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))
```

### Memory（记忆）

LangChain 的 Memory 模块管理对话历史：

| Memory 类型 | 说明 |
|-------------|------|
| `ConversationBufferMemory` | 存储完整对话历史 |
| `ConversationSummaryMemory` | 用 LLM 摘要压缩历史 |
| `ConversationTokenBufferMemory` | 按 token 数限制历史 |
| `ConversationKGMemory` | 提取知识图谱存储 |

## LangChain 的优缺点

### 优点

| 优点 | 说明 |
|------|------|
| 生态丰富 | 500+ 集成，覆盖几乎所有 LLM 提供商和工具 |
| 社区庞大 | GitHub 90k+ stars，海量教程和示例 |
| 上手快 | 高层抽象，几行代码就能搭出原型 |
| 文档完善 | 官方文档、Cookbook、视频教程齐全 |
| LCEL 语法 | 用 `|` 管道符组合 Chain，直观简洁 |

### 缺点

| 缺点 | 说明 |
|------|------|
| 抽象层太多 | 大量封装导致调试困难，报错信息不友好 |
| 隐藏细节 | Prompt 怎么拼的、API 怎么调的不透明 |
| 版本碎片化 | 0.1.x 和 0.2.x 不兼容，迁移成本高 |
| 不适合复杂控制流 | 线性 Chain 无法处理循环和复杂分支 |
| 性能开销 | 层层封装带来额外延迟 |

## LangChain vs LangGraph

| 维度 | LangChain | LangGraph |
|------|-----------|-----------|
| 控制流 | 线性 Chain（A -> B -> C） | 有向图（支持循环、分支、并行） |
| 状态管理 | Memory 模块（简单） | StateGraph + Checkpoint（完善） |
| 循环 | 不支持 | 原生支持 |
| Human-in-the-loop | 不支持 | 原生支持 |
| 复杂度 | 低，适合简单场景 | 高，适合复杂 Agent |
| 2026 年推荐 | 存量维护、简单原型 | 新项目首选 |

## 代码示例：简单 RAG Chain

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough

# 1. 加载向量数据库
vectorstore = Chroma(
    embedding_function=OpenAIEmbeddings(),
    persist_directory="./chroma_db"
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 2. 定义 Prompt
template = """基于以下上下文回答问题。如果上下文不足以回答，请说"信息不足"。

上下文：
{ context }

问题：{ question }
"""
prompt = ChatPromptTemplate.from_template(template)

# 3. 定义 LLM
llm = ChatOpenAI(model="gpt-5.5", temperature=0)  # 2026年推荐

# 4. 用 LCEL 语法串联 Chain
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 5. 运行
result = chain.invoke("什么是 LangGraph？")
print(result)
```

## 2026 年定位

LangChain 在 2026 年的定位是：**被 LangGraph 取代用于新项目，但存量代码多，简单场景仍可用**。

- 继续使用 LangChain 的场景：
  - 简单的 RAG 应用
  - 线性 Prompt 流水线
  - 存量代码维护
  - 教学和入门学习
- 不应使用 LangChain 的场景：
  - 需要循环/分支的 Agent
  - 需要 Human-in-the-loop 的工作流
  - 新的生产级 Agent 项目
  - 需要精确控制流的场景

LangChain 团队自己也推荐新项目使用 LangGraph。两个框架可以共存：用 LangChain 的组件（LLM Wrapper、Tool、Prompt Template），用 LangGraph 编排控制流。

## 相关笔记

- [[深挖-LangGraph]] — LangChain 的图编排引擎，生产级 Agent 首选
- [[深挖-LangSmith]] — LangChain 生态的调试/评估/监控平台
- [[深挖-Lang家族]] — Lang 家族全景
- [[Ch14 Agent 工作原理]] — Agent 的核心工作机制
- [[深挖-LangGraph]] — LangGraph 深度对比

## 来源

- https://python.langchain.com/docs/introduction/ — LangChain 官方文档
- https://github.com/langchain-ai/langchain — LangChain GitHub 仓库
- https://blog.langchain.dev/ — LangChain 官方博客
- https://python.langchain.com/docs/versions/overview/ — LangChain 版本迁移指南
- https://docs.smith.langchain.com/ — LangSmith 文档