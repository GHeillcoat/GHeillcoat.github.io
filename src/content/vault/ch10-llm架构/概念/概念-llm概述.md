---
title: "概念-LLM概述"
description: "LLM（Large Language Model，大语言模型）是一种通过海量文本训练出来的神经网络，核心能力是\"预测下一个词\"——但规模足够大后，涌现出推理、翻译、编程等复杂能力。"
date: 2026-07-06
category: "Ch10 LLM架构"
tags: ["LLM", "基础", "大语言模型"]
aliases: ["LLM", "Large Language Model", "大语言模型"]
prerequisites: ""
source: "笔记/Ch10 LLM架构/概念/概念-LLM概述.md"
---
## 一句话理解

**LLM（Large Language Model，大语言模型）是一种通过海量文本训练出来的神经网络，核心能力是"预测下一个词"——但规模足够大后，涌现出推理、翻译、编程等复杂能力。**

## 核心特征

| 特征 | 说明 |
|------|------|
| 规模 | 参数量从 7B 到 600B+ |
| 训练数据 | 互联网文本、书籍、代码等 TB 级数据 |
| 基础架构 | 绝大多数是 Decoder-Only Transformer |
| 核心能力 | 文本生成、理解、推理、翻译、编程 |
| 训练方式 | 预训练 → 指令微调 → 偏好对齐 |

## 2026 年主流 LLM

- **闭源**：GPT-5.5、Claude Opus 4.5、Gemini 2.5
- **开源**：DeepSeek-V3、Llama 4、Qwen 3、Mistral Large

## 与普通 AI 的区别

普通 AI（如传统 NLP 模型）通常只能做单一任务。LLM 的突破在于"通用性"——同一个模型可以聊天、写代码、翻译、分析，不需要针对每个任务重新训练。

## 相关笔记

- [[Ch10 LLM 原理与架构演进]] — LLM 架构全景
- [[10.1 什么是 LLM]] — 主章节第一节
- [[概念-Transformer]] — 底层架构

## 来源

- Brown et al., "Language Models are Few-Shot Learners" (GPT-3), 2020, https://arxiv.org/abs/2005.14165