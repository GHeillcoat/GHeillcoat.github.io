---
title: "Token (词元)"
description: "Token 是 LLM 处理文本的最小单位——不是字，不是词，而是介于两者之间的\"子词单元\"。LLM 先把文本切成 Token，再给每个 Token 一个数字 ID，然后才能做数学运算。"
pubDate: 2026-07-01
category: "Ch10 LLM架构"
tags: ["Token", "Tokenizer", "BPE", "SentencePiece", "WordPiece", "分词", "NLP", "LLM"]
aliases: ["Token", "词元", "Tokenizer", "分词器", "BPE", "SentencePiece", "WordPiece", "上下文窗口", "词表"]
---
## 一句话理解

Token 是 LLM 处理文本的最小单位——不是字，不是词，而是介于两者之间的"子词单元"。LLM 先把文本切成 Token，再给每个 Token 一个数字 ID，然后才能做数学运算。

## 零基础理解

你要把"我喜欢吃苹果"翻译成英文。你不能直接翻译每个字("我"→"I", "喜"→"like", "欢"→"?"——"喜欢"是一个词不能拆)，也不能整句背下来(世界上有无限多种句子)。Token 的解决方案是：把"喜欢"拆成"喜"+"欢"两个子词单元，既保留了一定的语义，又控制了词汇表大小。常见词保持完整("the"→1个 token)，罕见词拆成子词("unbelievable"→"un"+"believe"+"able")。

## Token 的三种粒度

| 粒度 | 例子 (输入: "我喜欢吃苹果") | 词表大小 | 优点 | 缺点 |
|------|--------------------------|---------|------|------|
| 字符级 (Character) | ["我", "喜", "欢", "吃", "苹", "果"] (6 tokens) | 极小(~100) | 无 OOV 问题 | 序列太长，语义信息弱 |
| 词级 (Word) | ["我", "喜欢", "吃", "苹果"] (4 tokens) | 极大(~10万+) | 语义完整 | 大量 OOV，词表爆炸 |
| 子词级 (Subword) | ["我", "喜欢", "吃", "苹果"] (4 tokens，常见词) | 中等(3万-25万) | **平衡序列长度和语义** | 分词规则需要学习 |
| 子词级(罕见词) | "unbelievable" → ["un", "believe", "able"] | 中等 | 处理罕见词能力强 | — |

**OOV (Out-Of-Vocabulary)**：词表中没有的词。词级分词遇到未登录词只能标记为 `<UNK>`，子词级可以拆成已知子词组合。

## 主流 Tokenizer 算法

### BPE (Byte-Pair Encoding)

**核心思想**：从字符开始，反复合并最频繁出现的字符对，直到达到目标词表大小。

```text
初始词表：{"a", "b", "c", ..., "z", " "}
迭代1: 发现 "t"+"h" 出现最频繁 → 合并为 "th"
迭代2: 发现 "th"+"e" 出现最频繁 → 合并为 "the"
迭代3: 发现 "a"+"n" 出现最频繁 → 合并为 "an"
...
迭代N: 词表达到目标大小(如 50,000)
```

**BPE 训练示例**：

```text
原始文本: "low lower lowest"
步骤1: l o w _ l o w e r _ l o w e s t  (字符级)
步骤2: 合并 "l"+"o" → "lo"
步骤3: 合并 "lo"+"w" → "low"
步骤4: 合并 "e"+"r" → "er"
步骤5: 合并 "e"+"s" → "es"
最终词表: {"l", "o", "w", "low", "e", "r", "er", "s", "t", "es", ...}
```

**代表模型**：GPT 系列 (GPT-2/3/4 使用 BPE 变体)

### WordPiece

**核心思想**：与 BPE 类似，但合并标准不是频率，而是**最大化训练数据的似然**——选择能让语言模型概率增加最多的字符对合并。

$$score = \frac{\text{count}(pair)}{\text{count}(first) \times \text{count}(second)}$$

**代表模型**：BERT, DistilBERT

### SentencePiece

**核心思想**：直接在原始文本(不预分词)上训练 BPE 或 Unigram 模型，将空格视为普通字符，用 "▁"(U+2581) 表示空格。语言无关，无需预分词规则。

**代表模型**：LLaMA, Mistral, T5, ALBERT

### Unigram

**核心思想**：从大词表开始，逐步删除对训练数据似然贡献最小的子词，直到达到目标词表大小。

**代表模型**：XLNet, mBART

## Tokenizer 对比

| 特性 | BPE | WordPiece | SentencePiece | Unigram |
|------|-----|-----------|---------------|---------|
| 合并策略 | 频率 | 似然增益 | BPE 或 Unigram | 删除低贡献 |
| 预分词 | 需要(空格/标点) | 需要 | 不需要 | 不需要 |
| 语言无关 | 否 | 否 | 是 | 是 |
| 空格处理 | 显式保留 | 显式保留 | 用 ▁ 表示 | 用 ▁ 表示 |
| 解码 | 直接拼接 | 用 ## 标记 | 去掉 ▁ + 直接拼接 | 直接拼接 |
| 代表模型 | GPT-2/3/4 | BERT | LLaMA, Mistral | XLNet |
| 2026 年使用 | 广泛 | 老模型 | **最广泛** | 较少 |

## Token 在 LLM 中的实际表现

### 中英文 Token 数量差异

| 文本 | 字符数 | Token 数 (GPT-4 tokenizer) | 原因 |
|------|--------|--------------------------|------|
| "Hello world" | 11 | 2 | 英文常见词 |
| "你好世界" | 4 | 6-8 | 中文每个字通常 1-2 tokens |
| "I love machine learning" | 24 | 4 | 英文词边界清晰 |
| "我喜欢机器学习" | 7 | 8-12 | 中文需更多 tokens |

**中文用户的代价**：同样的语义内容，中文需要的 token 数通常是英文的 1.5-3 倍。这意味着中文用户使用 API 的成本更高，且在相同上下文窗口下能输入的文本更少。

### Token 数量估算

| 规则 | 说明 |
|------|------|
| 1 token ≈ 0.75 个英文单词 | 常见英文词 1 token，罕见词 2-3 tokens |
| 1 token ≈ 0.5 个中文字符 | 常见汉字 1-2 tokens，罕见字更多 |
| 1 token ≈ 4 个英文字符 | 包括空格和标点 |
| 1000 tokens ≈ 750 个英文单词 | API 计费基准 |

## 词表大小 (Vocabulary Size)

| 模型 | 词表大小 | Tokenizer |
|------|---------|-----------|
| GPT-2 | 50,257 | BPE |
| GPT-3/GPT-4 | 100,000+ | BPE (cl100k_base) |
| BERT | 30,522 | WordPiece |
| LLaMA 1/2 | 32,000 | SentencePiece (BPE) |
| LLaMA 3 | 128,000 | SentencePiece (BPE) |
| DeepSeek-V3 | 129,280 | SentencePiece (BPE) |
| Qwen 2.5 | 152,064 | SentencePiece (BPE) |

**趋势**：词表越来越大。更大的词表意味着每个 token 承载更多语义 → 相同上下文窗口能容纳更多信息 → 推理效率更高。

## Token 与上下文窗口

LLM 的上下文窗口用 Token 数衡量，而非字符数或词数。

| 模型 | 上下文窗口 (tokens) | 约等于 |
|------|-------------------|--------|
| GPT-4 (2023) | 8K-128K | 约 6000-96000 英文词 |
| Claude 3 (2024) | 200K | 约 150000 英文词 |
| Gemini 1.5 Pro (2024) | 1M-2M | 约 750000-1500000 英文词 |
| DeepSeek-V3 (2024) | 128K | 约 96000 英文词 |

## 相关笔记

- [[Ch10 LLM 原理与架构演进]] — Token 如何被 LLM 处理和生成
- [[Ch09 Transformer 架构精讲]] — Token 进入 Transformer 后的处理流程
- [[概念-上下文窗口]] — Token 与上下文窗口的详细关系
- [[概念-Embedding模型]] — Token 如何被映射为向量
- [[Ch06 神经网络基础]] — Token 的向量化与神经网络输入

## 来源

- Sennrich et al., "Neural Machine Translation of Rare Words with Subword Units" (2016, BPE) — https://arxiv.org/abs/1508.07909
- Schuster & Nakajima, "Japanese and Korean Voice Search" (2012, WordPiece) — https://research.google/pubs/pub37842/
- Kudo & Richardson, "SentencePiece: A simple and language independent subword tokenizer" (2018) — https://arxiv.org/abs/1808.06226
- Kudo, "Subword Regularization: Improving Neural Network Translation Models with Multiple Subword Candidates" (2018, Unigram) — https://arxiv.org/abs/1804.10959
- OpenAI, "tiktoken" — https://github.com/openai/tiktoken