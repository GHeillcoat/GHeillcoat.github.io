---
title: "项目六：搭一个能用工具的 Agent"
date: 2026-07-01
updated: 2026-07-06
category: "Ch14 Agent原理"
tags: ["项目", "智能体"]
source: "笔记/Ch14 Agent原理/项目/搭一个 Tool-Use Agent.md"
---
> 30 分钟。需要 Python 基础 + Ollama。你会搭一个能自己查天气、算数学的 AI。

## 你要做什么

用 LangChain 搭一个 Agent，给它两个工具：一个模拟的"天气查询"，一个真正的"计算器"。Agent 拿到你的问题后，自己判断该用哪个工具。

## 前置准备

确保 Ollama 在运行（[[在自己的电脑上跑 AI|项目二]]）：

```bash
pip install langchain langchain-community
```

## 第一步：定义工具

```python
from langchain.tools import tool

@tool
def get_weather(city: str) -> str:
    """查询指定城市的天气。输入城市名，返回天气描述。"""
    # 模拟天气数据
    weather_data = {
        "北京": "晴天，25度，微风",
        "上海": "多云转阴，28度",
        "深圳": "雷阵雨，30度",
    }
    return weather_data.get(city, f"没有{city}的天气数据")

@tool
def calculator(expression: str) -> str:
    """计算数学表达式。输入算式，返回结果。"""
    try:
        return str(eval(expression))
    except:
        return "计算错误"
```

## 第二步：创建 Agent

```python
from langchain_community.llms import Ollama
from langchain.agents import create_react_agent, AgentExecutor
from langchain.prompts import PromptTemplate

# 用 Ollama 本地模型
llm = Ollama(model="llama3.2", temperature=0)

# ReAct 提示词模板
template = """你可以使用以下工具：

{tools}

使用以下格式回答：

Question: 用户的问题
Thought: 你需要做什么
Action: 工具名
Action Input: 工具输入
Observation: 工具返回的结果
...（Thought/Action/Observation 可以重复多次）
Thought: 我现在知道答案了
Final Answer: 最终回答

开始！

Question: {input}
{agent_scratchpad}"""

prompt = PromptTemplate.from_template(template)

# 创建 Agent
agent = create_react_agent(llm, [get_weather, calculator], prompt)
executor = AgentExecutor(agent=agent, tools=[get_weather, calculator], verbose=True)
```

## 第三步：测试

```python
# 测试 1：简单问题（不用工具）
result = executor.invoke({"input": "你好，请介绍一下你自己"})
print(result["output"])

# 测试 2：需要天气工具
result = executor.invoke({"input": "北京今天天气怎么样？"})
print(result["output"])

# 测试 3：需要计算工具
result = executor.invoke({"input": "12345 乘以 67890 等于多少？"})
print(result["output"])

# 测试 4：需要两个工具
result = executor.invoke({"input": "北京今天天气怎么样？如果气温是25度，换算成华氏度是多少？"})
print(result["output"])
```

## 第四步：看 Agent 怎么"想"

设置了 `verbose=True`，你会看到 Agent 的完整思考过程：

```
> Entering new AgentExecutor chain...
Thought: 用户想查北京天气，我需要调用 get_weather 工具
Action: get_weather
Action Input: 北京
Observation: 晴天，25度，微风
Thought: 我已经拿到天气信息，可以回答了
Final Answer: 北京今天晴天，气温25度，微风。
```

这就是 [[深挖-ReAct循环]] 里的 `Thought -> Action -> Observation` 循环——不再是理论，是你在命令行看到的真实过程。

## 加更多工具

试试加一个搜索工具：

```python
@tool
def search(query: str) -> str:
    """搜索互联网。输入搜索关键词。"""
    return f"搜索'{query}'的结果：（模拟）找到了相关网页..."
```

然后把 `search` 加到工具列表里。Agent 会自动判断什么时候该搜索、什么时候该查天气、什么时候该算数。

## 你学到了什么

- Agent = LLM + 工具 + ReAct 循环
- 工具只是一个 Python 函数——你用 `@tool` 装饰器告诉 Agent 怎么用
- Agent 自己判断该调用哪个工具——不需要你写 if-else
- `verbose=True` 让你看到 Agent 的"内心独白"

## 相关笔记

- [[Ch14 Agent 工作原理]] — Agent 和普通 AI 的区别
- [[深挖-ReAct循环]] — Thought-Action-Observation 循环
- [[概念-工具调用]] — Function Calling 的演化

## 来源

- LangChain, https://langchain.com
- Ollama, https://ollama.com
- Yao et al., ReAct, 2022
