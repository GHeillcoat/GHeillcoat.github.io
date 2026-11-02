---
title: "DSPy：声明式 Prompt 编程（深挖）"
description: "前面学到的所有 Prompt 技巧（Zero-shot、Few-shot、思维链）都有一个共同的问题：提示词是人手工写的。 写得好不好，凭感觉。换一个任务，重新写。换一个模型，重新调。DSPy 的答案是：不要手工写提示词。写代码，让 AI 自己优化提示词。 DSPy（Declar"
pubDate: 2026-06-30
updatedDate: 2026-07-06
category: "Ch12 Prompt工程"
tags: ["DSPy", "框架"]
---
前面学到的所有 Prompt 技巧（Zero-shot、Few-shot、思维链）都有一个共同的问题：**提示词是人手工写的。** 写得好不好，凭感觉。换一个任务，重新写。换一个模型，重新调。DSPy 的答案是：**不要手工写提示词。写代码，让 AI 自己优化提示词。**

DSPy（Declarative Self-improving Python）是 Stanford NLP 组 2023 年发布的框架 ^[Khattab et al., "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines", 2023, https://arxiv.org/abs/2310.03714]。2024-2025 年迅速发展，成为 LangChain 最有力的竞争者。

## 手工 Prompt 的困境

你写了一个 Prompt："把以下英文翻译成中文。保持原意，不要添加额外信息。" 在 GPT-5.5 上效果很好。换成 Claude Opus 4.8，效果差了——Claude 喜欢加解释。换成 Llama 4.1，效果更差。你想优化，但没有系统的方法——只能试。改几个词，看看效果。再改几个词，再看看。这叫"提示词炼金术"——凭直觉试，没有科学方法。

DSPy 的做法完全不同：**你不写具体的提示词。你告诉 DSPy 你的任务是什么、输入输出是什么格式、用哪些例子来评估。DSPy 自动生成和优化提示词。**

## DSPy 的核心概念

### Signature：定义任务

不用写 Prompt，写 Signature——一种类似函数签名的格式：

```python
"question -> answer"                    # 问答
"document -> summary"                  # 摘要
"context, question -> answer"          # RAG
"english_text -> chinese_text"         # 翻译
```

这就够了。你不需要写"你是专业的翻译助手，请准确翻译..."。DSPy 会根据你的 Signature、模型、以及示例数据，自动生成最优的提示词。

### Module：组合任务

Signature 是最小的单元。Module 把多个 Signature 组合成复杂流程：

```python
import dspy

class RAG(dspy.Module):
    def __init__(self):
        self.retrieve = dspy.Retrieve(k=3)
        self.generate = dspy.ChainOfThought("context, question -> answer")
    
    def forward(self, question):
        context = self.retrieve(question)
        return self.generate(context=context, question=question)
```

这就是一个 RAG 系统——检索 + 生成。注意到没有一行提示词。DSPy 自动生成检索的查询策略和生成的提示词。

### Optimizer：自动调优

这是 DSPy 最颠覆的部分。你给 DSPy 一些标注好的例子（"这个问题 -> 这个答案"），DSPy 自动尝试不同的提示词，找到效果最好的那个。

```python
from dspy.teleprompt import BootstrapFewShot

optimizer = BootstrapFewShot(metric=accuracy)
optimized_rag = optimizer.compile(rag, trainset=examples)
```

"编译"这个词用得精妙——就像编译器把高级语言变成机器码，DSPy 把 Signature 编译成最优提示词。你写的是"想要什么"，DSPy 自己搞定"怎么说"。

## DSPy vs LangChain

| | LangChain | DSPy |
|---|---|---|
| 核心理念 | 搭积木（手动组合组件） | 编程 + 自动优化 |
| 提示词 | 手工写 | 自动生成 |
| 调优 | 手动试 | 自动编译 |
| 学习曲线 | 低（会用 Python 就行） | 中（需要理解编译概念） |
| 适合场景 | 快速原型 | 生产级优化 |

两者不是替代关系——可以先 LangChain 快速原型，再 DSPy 自动优化。

## 为什么 DSPy 重要

DSPy 代表了 AI 工程的第三次范式跃迁：

1. **手工 Prompt（2022-2023）**：人写提示词，凭经验
2. **组件化（2023-2024）**：LangChain/LlamaIndex 搭积木，提示词还是人写
3. **自动编译（2024-2026）**：DSPy 替代手工提示词，AI 自己优化

这个趋势正好对应 [[概念-AI工程范式演化]]：从 Prompt 工程到 Loop 工程。DSPy 的"编译-评估-优化"循环，本质上就是 Loop 工程的实践——系统自己迭代，人只需要定义目标和评估标准。

## 相关笔记

- [[深挖-Lang家族]] — LangChain 是组件化时代的代表
- [[概念-AI工程范式演化]] — DSPy 是 Loop 工程在提示词层面的体现
- [[深挖-Agent规划]] — DSPy 的优化器和 Agent 的规划器思路一致

## 来源

- Khattab et al., "DSPy", 2023, https://arxiv.org/abs/2310.03714
- DSPy 官方网站, https://dspy.ai
- DSPy GitHub, https://github.com/stanfordnlp/dspy
