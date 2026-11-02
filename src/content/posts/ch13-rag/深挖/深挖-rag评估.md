---
title: "RAG 系统评估（深挖）"
description: "你搭了一个 RAG 系统，怎么知道它好不好？不是\"感觉还行\"就行——需要量化。这篇讲三个通用的评估维度和最常用的工具。"
pubDate: 2026-06-30
updatedDate: 2026-07-01
category: "Ch13 RAG"
tags: ["评估", "评估工具"]
---
你搭了一个 RAG 系统，怎么知道它好不好？不是"感觉还行"就行——需要量化。这篇讲三个通用的评估维度和最常用的工具。

## 三维评估框架

RAG 系统的质量可以用三个维度衡量 ^[RAGAS Documentation, https://docs.ragas.io]：

**忠实度（Faithfulness）**：AI 的回答有没有编造？如果检索到的文档里写的是"A 公司 2023 年营收 100 亿"，AI 回答"120 亿"——不忠实。扣分。

**答案相关性（Answer Relevance）**：AI 有没有答非所问？用户问"退货流程"，AI 回答"我们的产品质量很好"——不相关。扣分。

**上下文相关性（Context Relevance）**：检索到的文档跟问题相关吗？用户问"退货流程"，检索到了"公司团建照片"——检索失败。扣分。

三个维度独立打分，不是算一个总分——因为优化方向不同。忠实度低要修 AI 的指令，上下文相关性低要修检索系统。

## RAGAS：开箱即用的评估工具

RAGAS（RAG Assessment）2023 年开源，2026 年成为 RAG 评估的事实标准 ^[RAGAS GitHub, https://github.com/explodinggradients/ragas]。

用法极简：

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_relevancy

result = evaluate(
    dataset,  # 包含 question, answer, contexts, ground_truth
    metrics=[faithfulness, answer_relevancy, context_relevancy]
)
print(result)
# {'faithfulness': 0.89, 'answer_relevancy': 0.76, 'context_relevancy': 0.82}
```

**RAGAS 是怎么打分的**：它用 AI 来评估 AI。比如评估"忠实度"，RAGAS 用 LLM 检查——"回答里的每一句话，在检索到的文档里能找到依据吗？" 把回答拆成单句，逐句核对。

## 其他评估工具

| 工具 | 定位 | 特点 |
|------|------|------|
| RAGAS | RAG 专用评估 | 开源免费，社区最大 |
| LangSmith | 全链路监控 | 不仅评估，还追踪每步调用 |
| TruLens | 反馈式评估 | 支持用户反馈收集 |
| DeepEval | 单元测试风格 | 像写代码测试一样写评估 |

## 怎么用评估结果改进系统

**忠实度低（< 0.8）**：
- 检查 System Prompt：有没有明确写"只根据提供的文档回答，不要编造"
- 检查检索结果：是不是检索到的文档本身就不包含答案？如果是，AI 被迫编造
- 加温度参数：降低 Temperature（让 AI 更保守，少发挥）

**答案相关性低（< 0.7）**：
- 检查 Prompt 模板：有没有把用户问题正确传入
- 检查检索结果：可能检索到了相关但"不够直接"的文档——加 Reranker

**上下文相关性低（< 0.6）**：
- 换 Embedding 模型
- 换分块策略
- 加 BM25 混合检索

## 评估的陷阱

**AI 评 AI 的偏差。** RAGAS 用 LLM 评估 LLM 的输出。如果评估用的 LLM 本身不够聪明，打分就不准。2026 年建议用 GPT-5.5 或 Claude Opus 4.8 级别的模型做评估。

**评估数据集的代表性。** 你用 50 个问题测试，得分 0.9。上线后用户问的跟你测试的不一样，实际体验差很远。评估数据集要覆盖真实用户的提问分布。

**只看数字不去看案例。** 忠实度 0.85——是哪些问题拉低了分数？去翻具体的 bad case，才能找到根因。

## 相关笔记

- [[Ch13 RAG 进化树]] — 评估是 RAG 系统的质量关卡
- [[深挖-混合检索]] — 上下文相关性低往往需要混合检索

## 来源

- RAGAS, https://docs.ragas.io
- RAGAS GitHub, https://github.com/explodinggradients/ragas
