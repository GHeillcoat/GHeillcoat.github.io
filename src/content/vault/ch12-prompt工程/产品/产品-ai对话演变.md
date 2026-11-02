---
title: "AI 对话的三年演变"
description: "2022 年底之前，你跟电脑说话，电脑听不懂。2023 年开始，一切都变了。这篇笔记梳理 AI 对话工具这三年怎么走到今天的。"
date: 2026-06-30
updated: 2026-07-01
category: "Ch12 Prompt工程"
tags: ["产品", "对话", "时间线"]
aliases: ["ChatGPT发展史", "AI对话演变"]
prerequisites: "无"
source: "笔记/Ch12 Prompt工程/产品/产品-AI对话演变.md"
---
2022 年底之前，你跟电脑说话，电脑听不懂。2023 年开始，一切都变了。这篇笔记梳理 AI 对话工具这三年怎么走到今天的。

## 2023：觉醒

**ChatGPT 上线**（2022 年 11 月，2023 年初大规模开放）^[OpenAI, ChatGPT Release, https://openai.com/index/chatgpt/]。两个月用户破亿——历史上增长最快的产品。普通人第一次体验到"跟机器说话像跟人说话"。

**GPT-4 发布**（2023 年 3 月）^[OpenAI, GPT-4 Technical Report, https://arxiv.org/abs/2303.08774]。比 GPT-3.5 聪明了一大截——能通过律师资格考试、能写像样的代码、能理解图片（虽然当时还没开放图片功能）。ChatGPT Plus 订阅上线，每月 20 美元。

**Claude 入场**（2023 年 3 月）。前 OpenAI 员工创办的 Anthropic 推出 Claude——主打"安全"和"长对话"。能一次处理整本书的长度，不容易被诱导说不该说的话。

**Google Bard**（2023 年 3 月）。Google 匆忙应战，第一版表现拉胯，但标志着搜索巨头正式入局。

**GPT-4 Turbo**（2023 年 11 月）。AI 一次能记住的字数（叫"上下文窗口"）从 8K 扩到 128K——8K 大概是一篇长文章，128K 是一本 300 页的书。能一口气读完一本书再回答问题。价格降到原来的三分之一。

## 2024：不仅能打字，还能听、能看

**Claude 3**（2024 年 3 月）。三款模型：Haiku（快且便宜）、Sonnet（均衡）、Opus（最强）。Opus 在多项评测上首次超过 GPT-4。

**GPT-4o**（2024 年 5 月）^[OpenAI, GPT-4o Announcement, https://openai.com/index/hello-gpt-4o/]。"o"是 omni——全能。文字、图片、语音全打通。最震撼的是语音对话——延迟只有 200 毫秒，跟真人通话一样自然。免费用户也能用。

**Gemini 时代**（2024 年）。Google Bard 改名 Gemini，推出 1.5 Pro，AI 一次能记住的量（上下文窗口）达到 100 万 token——token 可以理解为一个词或一个字。相当于能一口气处理整部电影的对白、10 小时的音频。Ultra 版在评测上首次平手 GPT-4。

**Llama 3**（2024 年 4 月）。Meta 把 Llama 3 免费公开了——8B（80 亿参数）和 70B（700 亿参数）两个版本，性能接近 GPT-4 级别。免费公开的模型第一次真正威胁收费的模型。

## 2025：普及

**DeepSeek v3 登场**（2024 年底 / 2025 年初）^[DeepSeek, V3 Technical Report, https://arxiv.org/abs/2412.19437]。中国团队，总共 671B（6710 亿）参数，但用了混合专家架构（一种让模型又大又快的技术），每次推理只用其中 370 亿参数。训练成本远低于 GPT-4。推理能力极强，免费公开。

**Claude 3.5 Sonnet**（2024 年 6 月，2025 年持续迭代）。性能比肩 Claude 3 Opus，但速度快很多、便宜很多。Claude Code 推出（2025），能自主写代码、修程序错误、提交代码修改。2026 年，Claude Sonnet 4.6 和 Claude Opus 4.8 成为主流，Claude Code 成为编程标配。

**GPT-5？没有。** OpenAI 在 2025 年没有发布 GPT-5，而是走"推理模型"路线——o1（2024 年 9 月）、o3（2025 年），擅长数学和编程，但对话体验不如 GPT-4o。

**Qwen 3.7**（阿里，2026）。中国最强开源模型之一，多语言能力突出，移动端小模型可用。

**AI 搜索颠覆传统**（2025）。Perplexity 估值百亿。Google 全面 AI 化搜索结果。Bing Chat 改名 Copilot。搜索不再是"输入关键词 -> 点链接"，而是"问问题 -> 直接给答案"。

**语音成主流**（2025）。GPT-4o 实时语音、ElevenLabs 语音克隆、豆包语音助手——语音从"能用"变成"好用"。很多人开始用说话代替打字来跟 AI 交互。

## 2026：AI 能自己干活了

**不要再写提示词了**。Boris Cherny（Anthropic Claude Code 负责人）说："我已经不给 AI 写提示词了。我让循环在跑——AI 自己一轮一轮地写提示词、判断该干什么、检查结果、修正错误。我的工作是设计这个循环，不是写每一句话。" ^[Boris Cherny, 2026 年公开演讲]

**AI 之间可以互相通信了**。Anthropic 的 MCP（模型上下文协议，2024 年 11 月推出，相当于 AI 连接工具的"USB 接口标准"）和 Google 的 A2A（智能体间通信协议，2025 年 4 月推出，相当于 AI 之间互相说话的"通用语言"）开始被广泛采用。不同公司做的 AI 可以互相调用对方的工具、互相派活了。

**感应式编程（Vibe Coding）兴起**。不是写代码，是描述需求让 AI 写。Cursor、Bolt.new、Replit Agent——普通人也能"写"软件了。

**手机自己跑 AI（端侧推理）成熟**。手机本地跑 AI 不再是概念。Llama、Qwen 的小模型能在手机上流畅运行，不联网也能用。

## 相关笔记

- [[Ch12 Prompt 工程]] — 提示词是什么，一切对话的基础
- [[概念-Loop工程]] — Agent 时代的核心机制：让系统自己转
- [[知识图谱]] — 四条演化轴全景

## 来源

- OpenAI, ChatGPT Release, https://openai.com/index/chatgpt/
- OpenAI, GPT-4 Technical Report, https://arxiv.org/abs/2303.08774
- OpenAI, GPT-4o Announcement, https://openai.com/index/hello-gpt-4o/
- DeepSeek, V3 Technical Report, https://arxiv.org/abs/2412.19437
- Boris Cherny (Anthropic), 2026 年公开演讲
