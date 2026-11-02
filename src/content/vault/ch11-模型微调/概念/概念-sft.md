---
title: "概念-SFT"
description: "SFT（Supervised Fine-Tuning，监督微调）是用高质量\"问题-答案\"对来训练模型，让它学会按指令回答——这是把\"只会补全文本\"的预训练模型变成\"能听懂人话\"的对话模型的关键一步。"
date: 2026-07-06
category: "Ch11 模型微调"
tags: ["微调", "基础", "监督学习"]
aliases: ["SFT", "Supervised Fine-Tuning", "监督微调", "指令微调"]
prerequisites: ""
source: "笔记/Ch11 模型微调/概念/概念-SFT.md"
---
## 一句话理解

**SFT（Supervised Fine-Tuning，监督微调）是用高质量"问题-答案"对来训练模型，让它学会按指令回答——这是把"只会补全文本"的预训练模型变成"能听懂人话"的对话模型的关键一步。**

## 核心原理

预训练模型只会"预测下一个词"，给它"今天天气"它会续写成"今天天气晴朗，万里无云"——但它不知道你在问问题还是想让它写文章。

SFT 的做法：收集大量"用户问题 → 理想回答"的数据对，用这些数据继续训练模型。模型学会：当看到"请帮我..."时，应该给出有帮助的回答，而不是随意续写。

**比喻**：预训练模型 = 读了很多书但不知道该怎么跟人对话的人。SFT = 给他看大量"别人怎么回答问题"的范例，让他学会对话的格式和风格。

## SFT 数据格式

```
用户：请解释什么是机器学习
助手：机器学习是让计算机从数据中自动学习规律...
```

## 2026 年地位

SFT 是 LLM 训练的标配第二步（预训练 → SFT → 偏好对齐）。无论是开源模型还是闭源模型，SFT 都是必经之路。

## 相关笔记

- [[11.4 SFT]] — 主章节
- [[概念-RLHF]] — SFT 后的对齐步骤
- [[概念-DPO]] — 替代 RLHF 的偏好对齐方法

## 来源

- Wei et al., "Finetuned Language Models Are Zero-Shot Learners" (FLAN), 2022, https://arxiv.org/abs/2109.01652
- Chung et al., "Scaling Instruction-Finetuned Language Models" (FLAN-PaLM), 2022, https://arxiv.org/abs/2210.11416