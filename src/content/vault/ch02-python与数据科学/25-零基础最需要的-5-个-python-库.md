---
title: "2.5 零基础最需要的 5 个 Python 库"
description: "处理数字数组，比 Python 原生列表快 10-50 倍。AI 中用来存储 Embedding 向量、做矩阵运算。"
date: 2026-06-30
updated: 2026-07-06
category: "Ch02 Python与数据科学"
tags: ["基础", "Python"]
aliases: ["零基础最需要的 5 个 Python 库", "2.5 零基础最需要的 5 个 Python 库"]
chapter: "Ch02"
section: "2.5"
source: "笔记/Ch02 Python与数据科学/2.5 零基础最需要的 5 个 Python 库.md"
---
### 2.5.1 1. NumPy — 数组计算

处理数字数组，比 Python 原生列表快 10-50 倍。AI 中用来存储 Embedding 向量、做矩阵运算。

```python
import numpy as np
v1 = np.array([0.1, 0.2, 0.3])  # 一个 Embedding 向量
v2 = np.array([0.15, 0.25, 0.28])
similarity = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
print(similarity)  # 0.994 — 非常相似
```

**深度理解：Embedding 和余弦相似度**

上面代码里的 `v1` 和 `v2` 不是随便写的数字，它们是 **Embedding（嵌入向量）**。Embedding 是让计算机"理解"含义的桥梁。

想象你有一张世界地图。地图上的"北京"不是北京本身——它只是一个经纬度坐标 `(39.9, 116.4)`。但这个坐标足够你计算出北京离上海多远、北京在东京的哪个方向。Embedding 做的就是类似的事：把文字、图片等离散的东西"嵌入"到一个连续的数字空间里 ^[NumPy 官方文档, "NumPy: the absolute basics for beginners", https://numpy.org/doc/stable/user/absolute_beginners.html]。比如"猫"被表示为一个 768 维的向量 `[0.12, -0.45, 0.78, ...]`，"狗"的向量和它很接近，而"汽车"的向量离得很远。含义相近的东西，向量也相近。你会在 Ch06 看到 Embedding 是神经网络的第一层，在 Ch13 用它做语义搜索。

有了 Embedding 向量之后，怎么判断两个向量"有多接近"？答案就是**余弦相似度（Cosine Similarity）**。它不是比较两个向量的绝对距离，而是比较它们的**方向**有多一致。两个向量方向完全一致，余弦相似度 = 1（含义完全相同）；方向相反 = -1（含义完全相反）；垂直 = 0（不相关）。NumPy 的一行代码就能算出来：`np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))`。

你可以把余弦相似度想象成"两个人在看同一个方向的程度"——跟站的位置无关（向量的长度），只跟朝向有关。AI 用余弦相似度来判断两段文字是不是在说同一件事——不是比谁的字面更接近，而是比谁的 Embedding 向量夹角更小 ^[Pandas 官方文档, "Getting started", https://pandas.pydata.org/docs/getting_started/]。

### 2.5.2 2. Pandas — 表格处理

处理 CSV、Excel、JSON 等表格数据。AI 中用来加载数据集、清洗数据、统计分析。

```python
import pandas as pd
df = pd.read_csv("finetune_data.csv")
print(df["label"].value_counts())  # 看看标签分布是否均衡
df = df.dropna()  # 删掉有空值的行
```

### 2.5.3 3. Matplotlib — 画图

Python 最基础的绑图工具。AI 中用来画训练曲线、数据分布。

```python
import matplotlib.pyplot as plt
losses = [2.3, 1.8, 1.2, 0.9, 0.7, 0.5, 0.4]
plt.plot(losses)
plt.title("训练 Loss 曲线")
plt.show()
```

### 2.5.4 4. requests — 发 HTTP 请求

调用 AI 模型的 API 就靠它。本质是"给一个网址发一段文字，拿回一段文字"。

```python
import requests
response = requests.post(
    "https://api.openai.com/v1/chat/completions",
    headers={"Authorization": "Bearer sk-xxx"},
    json={"model": "gpt-5.5", "messages": [{"role": "user", "content": "你好"}]}
)
print(response.json()["choices"][0]["message"]["content"])
```

### 2.5.5 5. json — 解析 JSON 数据

API 返回的数据几乎都是 JSON 格式。这个库帮你把 JSON 字符串转成 Python 字典，方便提取字段。

```python
import json
data = json.loads('{"name": "GPT-5.5", "score": 95}')
print(data["name"])  # GPT-5.5
```

---

> ← 上一节：[[2.3 Jupyter Notebook实战-AI开发的交互式工作台]] ｜ 下一节：[[2.6 你不需要成为程序员]] →
