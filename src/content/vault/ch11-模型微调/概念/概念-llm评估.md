---
title: "LLM 通用评估：怎么给 AI 打分"
description: "深挖-RAG评估 讲了怎么评估检索系统。但怎么评估 AI 本身？市面上那么多模型（GPT-5.5、Claude Opus 4.8、Gemini 3.5 Pro、Llama 4.1），谁知道谁更好？这篇讲三种主流的评估方法。"
date: 2026-06-30
updated: 2026-07-01
category: "Ch11 模型微调"
tags: ["评估", "评估基准"]
prerequisites: "Ch11 模型微调"
source: "笔记/Ch11 模型微调/概念/概念-LLM评估.md"
---
[[深挖-RAG评估]] 讲了怎么评估检索系统。但怎么评估 AI 本身？市面上那么多模型（GPT-5.5、Claude Opus 4.8、Gemini 3.5 Pro、Llama 4.1），谁知道谁更好？这篇讲三种主流的评估方法。

## 方法一：标准化考试

就像给 AI 出考卷——固定题目，固定答案，看 AI 能答对多少。

**MMLU**（大规模多任务语言理解）：57 个学科的选择题，从初中数学到法律到医学。2020 年发布，至今仍是衡量模型"知识广度"的标准 ^[Hendrycks et al., "Measuring Massive Multitask Language Understanding", 2020, https://arxiv.org/abs/2009.03300]。 

- GPT-4：86.4%（2023 年）
- Claude 3 Opus：86.8%（2024 年）
- Llama 3 70B：82.0%（2024 年）
- Llama 4.1 405B：89.5%（2026 年）
- GPT-5.5：92.3%（2026 年）
- Claude Opus 4.8：93.1%（2026 年）
- Gemini 3.5 Pro：91.7%（2026 年）

**HumanEval**：编程能力考试。164 道题，每道题要求模型写完一个 Python 函数。看生成的代码能不能通过单元测试。GPT-4 得分 67%，Claude 3 Opus 得分 84.9%。

**GSM8K**：小学数学应用题。8500 道题。看 AI 能不能做对加减乘除。有趣的是，有些模型 MMLU 分数高但 GSM8K 低——"博学"不等于"会算数"。

## 方法二：人机对战

标准化考试有局限——你永远不知道考题有没有"泄漏"到训练数据里。AI 可能不是"答对"的，是"背过"的。

**Chatbot Arena**（LMSYS，2023 年推出）：你不是看分数，你是**人对战**。网站随机给你两个匿名的 AI 回答，你选哪个好。几十万人投票，形成实时排名 ^[LMSYS Chatbot Arena, https://chat.lmsys.org]。排名会随新模型发布不断变化，最新排名见官网。

Chatbot Arena 的优势：不能作弊——考题没有预定义，是实时的人机交互。劣势：不能衡量特定领域能力（比如编程、数学）。

## 方法三：AI 评 AI

人评 AI 太慢。AI 评 AI 更快——用"裁判模型"打分。

**MT-Bench**（LMSYS，2023 年）：一个模型回答问题，GPT-4 当裁判打分。80 个多轮对话问题。和人工评分的相关性达到 90% 以上 ^[Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", 2023, https://arxiv.org/abs/2306.05685]。

**AlpacaEval**：自动化评估标准。一个模型回答问题，用 GPT-4 比较它和参考模型（通常是 GPT-4）的回答哪个更好。

AI 评 AI 的陷阱：裁判模型本身有偏好——GPT-4 当裁判，可能会偏爱"像 GPT-4 风格"的回答。所以不能只看一种评判，要看多种评判的交叉验证。

## 三种方法的优劣

| | 标准化考试 | 人机对战 | AI 评 AI |
|---|---|---|---|
| 速度 | 快（自动对答案） | 慢（等投票） | 快（自动） |
| 作弊风险 | 高（可能泄漏） | 低 | 中 |
| 覆盖广度 | 窄（固定题型） | 宽（自由对话） | 中 |
| 成本 | 低 | 中 | 低 |
| 公信力 | 高 | 最高 | 中 |

## 评估陷阱

**数据污染**：模型训练数据里可能包含了考题。就像一个学生提前拿到了试卷——考分高不代表他聪明，只是"背过"。2024 年后，很多 benchmark 被确认已有污染，业界开始推动"动态评估"——考题不断更新。

**Goodhart 定律**："当一个指标成为目标，它就不再是一个好指标。" 如果所有人都用 MMLU 排名，公司就会针对 MMLU 优化——比如把 MMLU 的考题偷偷加进训练数据。

**语言偏见**：主流 benchmark 全是英文。中文模型在英文 benchmark 上表现差，不一定是因为"笨"，而是因为训练数据的语言分布不同。中文 benchmark（C-Eval、CMMLU）在 2024-2025 年开始受到重视。

## 相关笔记

- [[深挖-RAG评估]] — 检索系统的专项评估
- [[Ch11 模型微调]] — 微调后的模型怎么评估

## 来源

- Hendrycks et al., "MMLU", 2020, https://arxiv.org/abs/2009.03300
- Zheng et al., "MT-Bench", 2023, https://arxiv.org/abs/2306.05685
- LMSYS Chatbot Arena, https://chat.lmsys.org
