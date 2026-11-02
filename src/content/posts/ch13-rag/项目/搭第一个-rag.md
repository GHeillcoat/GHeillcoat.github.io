---
title: "项目三：搭一个能查资料的 AI"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch13 RAG"
tags: ["项目", "检索增强"]
---
> 30 分钟。需要一点点 Python（复制粘贴即可）。做一个能回答"关于你的文档"问题的 AI。

## 你要做什么

用 Python 搭一个最小的 RAG 系统。给它几篇文档，它能基于文档内容回答问题——不是凭记忆，是凭你给的资料。

## 前置准备

确保你电脑上装了 Python（3.9 以上）。打开命令行，安装两个库：

```bash
pip install chromadb sentence-transformers
```

- `chromadb`：轻量向量数据库，不需要注册、不需要部署
- `sentence-transformers`：Embedding 模型

## 第一步：准备文档

在桌面新建一个文件夹叫 `my_rag`，在里面创建一个文件 `knowledge.txt`，写上几段资料：

```
张三是一名软件工程师，住在北京。
张三喜欢喝咖啡，尤其是手冲咖啡。
张三的工号是 EMP-4201。
李四是张三的同事，负责前端开发。
公司每周五下午有下午茶活动。
公司地址在北京市海淀区中关村。
```

保存文件。

## 第二步：写代码

在 `my_rag` 文件夹里创建 `app.py`，复制以下代码：

```python
import chromadb
from sentence_transformers import SentenceTransformer

# 1. 准备 Embedding 模型和向量库
model = SentenceTransformer("BAAI/bge-small-zh-v1.5")
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("knowledge")

# 2. 读取文档，切成句子
with open("knowledge.txt", "r", encoding="utf-8") as f:
    text = f.read()
chunks = [s.strip() for s in text.split("\n") if s.strip()]

# 3. 向量化每个句子，存入向量库
embeddings = model.encode(chunks)
for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
    collection.add(
        ids=[str(i)],
        documents=[chunk],
        embeddings=[emb.tolist()]
    )

print(f"已加载 {len(chunks)} 条知识。可以开始提问了！")

# 4. 问答循环
while True:
    question = input("\n你的问题（输入 quit 退出）：")
    if question == "quit":
        break

    # 检索最相关的 3 条资料
    q_emb = model.encode([question])
    results = collection.query(query_embeddings=q_emb.tolist(), n_results=3)

    print("\n找到的相关资料：")
    for doc in results["documents"][0]:
        print(f"  - {doc}")

    # 把检索结果拼接成提示词（这里手动拼，实际用会交给 AI）
    context = "\n".join(results["documents"][0])
    prompt = f"""根据以下资料回答问题。如果资料里没有答案，就说"资料中没有相关信息"。

资料：
{context}

问题：{question}

回答："""

    # 5. 调用 AI 生成答案
    from openai import OpenAI
    client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
    response = client.chat.completions.create(
        model="llama3.2",
        messages=[{"role": "user", "content": prompt}]
    )
    print(f"\nAI 回答：{response.choices[0].message.content}")
```

## 第三步：运行

确保 Ollama 在运行（[[在自己的电脑上跑 AI|项目二]] 装过），然后：

```bash
python app.py
```

试试这些问题：
- "张三的工号是什么？"
- "公司有什么活动？"
- "张三喜欢喝什么？"（资料没说 -> AI 应该说"资料中没有相关信息"）

## 你刚才做了什么

你搭了一个完整的 RAG 系统，它包含：
1. **文档加载**：读取 knowledge.txt
2. **分块**：按行切成句子
3. **向量化**：用 bge-small-zh 把句子变成向量
4. **存储**：向量存进 ChromaDB
5. **检索**：用户提问时找到最相关的 3 条资料
6. **生成**：把资料和问题一起给本地 AI，生成答案

这就是 [[Ch13 RAG 进化树]] 里的第一代和第二代——语义检索 + AI 生成。你的 30 行代码实现了一个完整的 RAG。

## 试试加更多文档

把 knowledge.txt 内容扩展，加入更多知识点。然后重新运行 `python app.py`，看看 AI 能不能回答新加的内容。

## 相关笔记

- [[Ch13 RAG 进化树]] — 你的代码实现了哪几代？
- [[深挖-稠密检索]] — Embedding 模型 bge 是怎么工作的
- [[概念-向量数据库]] — ChromaDB 在演化树的哪个位置

## 来源

- ChromaDB, https://www.trychroma.com
- BAAI, bge-small-zh-v1.5
- Ollama API, http://localhost:11434
