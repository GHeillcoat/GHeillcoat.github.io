---
title: "2.9 从零到第一个AI程序：5步跑通你的第一个 AI 调用"
description: "目标：即使你从来没写过 Python，跟着这 5 步走，你也能在 15 分钟内跑通第一个 AI 程序。"
date: 2026-06-30
updated: 2026-07-06
category: "Ch02 Python与数据科学"
tags: ["基础", "Python"]
aliases: ["从零到第一个AI程序：5步跑通你的第一个 AI 调用", "2.9 从零到第一个AI程序-5步跑通你的第一个 AI 调用"]
chapter: "Ch02"
section: "2.9"
source: "笔记/Ch02 Python与数据科学/2.9 从零到第一个AI程序-5步跑通你的第一个 AI 调用.md"
---
目标：即使你从来没写过 Python，跟着这 5 步走，你也能在 15 分钟内跑通第一个 AI 程序。

**前置条件**：电脑能联网。

### 2.9.1 第1步：安装 Python（3 分钟）

去 https://www.python.org/downloads/ 下载最新版 Python 3.12+，安装时**勾选 "Add Python to PATH"**（这一步很重要，不勾的话后面命令会报找不到 python）。

验证安装成功：打开终端（Windows 按 Win+R 输入 `cmd`，Mac 打开 Terminal），输入：

```bash
python --version
# 应该输出 Python 3.12.x 或 3.13.x
```

### 2.9.2 第2步：安装需要的库（2 分钟）

在终端输入：

```bash
pip install requests
```

`requests` 是用来发 HTTP 请求的库，调用 AI API 全靠它。安装成功后会显示 `Successfully installed requests-...`。

### 2.9.3 第3步：获取 API Key（2 分钟）

去你选择的大模型平台注册并获取 API Key：

- OpenAI：https://platform.openai.com/api-keys
- 硅基流动（国内，便宜）：https://siliconflow.cn
- DeepSeek：https://platform.deepseek.com

API Key 是一串类似 `sk-xxxxxxxxxxxxxxxxxxxxxxxx` 的字符串，**它是你的付费凭证，不要分享给任何人，不要上传到 GitHub。**

### 2.9.4 第4步：写代码（5 分钟）

打开任意文本编辑器（VS Code、记事本都行），新建文件 `first_ai.py`，输入以下代码：

```python
import requests

# 1. 配置你的 API Key 和 API 地址
API_KEY = "sk-你的key填这里"  # 替换成你第3步拿到的 key
API_URL = "https://api.siliconflow.cn/v1/chat/completions"  # 以硅基流动为例

# 2. 构造请求：告诉 AI 你是什么角色，你的问题是什么
payload = {
    "model": "deepseek-ai/DeepSeek-V3",  # 模型名称，不同平台不同
    "messages": [
        {"role": "system", "content": "你是一个友好的AI助手。"},
        {"role": "user", "content": "用一句话解释什么是机器学习。"}
    ],
    "temperature": 0.7  # 控制随机性，0=严谨，1=创造性
}

# 3. 发送请求
response = requests.post(
    API_URL,
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json=payload
)

# 4. 解析并打印结果
result = response.json()
reply = result["choices"][0]["message"]["content"]
print("AI 回复：", reply)
```

### 2.9.5 第5步：运行并看到结果（1 分钟）

在终端中，`cd` 到 `first_ai.py` 所在的目录，然后：

```bash
python first_ai.py
```

如果一切正常，你会看到类似这样的输出：

```
AI 回复： 机器学习是让计算机从数据中自动学习规律和模式，而不需要显式编程的一种人工智能技术。
```

**恭喜！你已经跑通了你的第一个 AI 程序。** 虽然只有 20 行代码，但这就是一切 AI 应用的基础——发请求、收回复。后面你学的 RAG、Agent、微调，都是在"发请求"和"收回复"之间加东西。

### 2.9.6 常见问题排查

| 报错 | 原因 | 解决 |
|---|---|---|
| `'python' 不是内部或外部命令` | 安装时没勾 Add to PATH | 重新安装 Python 并勾选该选项 |
| `ModuleNotFoundError: No module named 'requests'` | 没装 requests 库 | `pip install requests` |
| `401 Unauthorized` | API Key 错误或过期 | 检查 Key 是否正确，去平台重新生成 |
| `404 Not Found` | API 地址写错 | 检查 API_URL 是否正确 |
| `Connection timed out` | 网络问题 | 检查是否需要科学上网，或换国内平台 |

到这里，你已经具备了"用 Python 调用 AI"的最基本能力。后面要学的，就是怎么给 AI 更好的提示词（Ch03）、怎么让 AI 处理更多数据（Ch04）、怎么让 AI 调用外部工具（Ch05）——但这个"发请求、收回复"的基本模式不会变。

---

> ← 上一节：[[2.8 2026年AI开发必备工具链]] ｜ 下一节：[[Ch02 Python 与数据科学生态|章首]] →
