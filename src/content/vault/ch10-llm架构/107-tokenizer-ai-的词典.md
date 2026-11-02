---
title: "10.7 Tokenizer：AI 的词典"
description: "Tokenizer（分词器）是将人类文字翻译成 LLM 能理解的\"数字语言\"的翻译官。LLM 从未见过一个汉字或一个英文字母——它只见过整数编号。当你输入\"你好世界\"时，Tokenizer 先把它切成 token 序列（如 576, 152, 197），然后 LLM 才开始工作。"
date: 2026-06-30
updated: 2026-07-02
category: "Ch10 LLM架构"
tags: ["大语言模型", "架构", "规模化"]
aliases: ["Tokenizer：AI 的词典", "10.7 Tokenizer-AI 的词典"]
chapter: "Ch10"
section: "10.7"
source: "笔记/Ch10 LLM架构/10.7 Tokenizer-AI 的词典.md"
---
## 概念：LLM 看到的不是文字，是编号

Tokenizer（分词器）是将人类文字翻译成 LLM 能理解的"数字语言"的翻译官。LLM 从未见过一个汉字或一个英文字母——它只见过整数编号。当你输入"你好世界"时，Tokenizer 先把它切成 token 序列（如 [576, 152, 197]），然后 LLM 才开始工作。

生活比喻：Tokenizer 就像餐厅的后厨切配工。原料（文字）送进来，切配工按照菜谱（词表）把原料切成标准大小的块（token）。有的原料本身不大不切（常见词如 "the" 保持完整），有的太大要切成几块（罕见词如 "unsurprisingly" 拆成 "un"+"surprising"+"ly"），有的食材过于陌生也要硬着头皮切成小块（生僻中文字拆成部首或字节）。切配的质量直接影响整道菜的出品 ^[FutureAGI, "What is Tokenization in LLMs? BPE, SentencePiece, tiktoken in 2026", https://futureagi.com/blog/what-is-tokenization-llms-2026/]。

为什么不能直接用字或词？因为两者的极端都不能用：字符级（每个字一个 token）导致序列过长、语义信息稀薄；词级（每个词一个 token）导致词表爆炸（中文有数十万词汇）且遇到生词就卡死。**子词级（Subword）** 是两全之策——像 "playing" 拆成 "play"+"ing"，既保持了语义又控制了词表大小。

## 教学：三种主分分词算法

### BPE（Byte-Pair Encoding，字节对编码）

BPE 的训练流程可以理解为一个"贪吃蛇"游戏。从 256 个基础字节开始，反复扫描整个训练语料，找到出现频率最高的相邻字符对，把它们合并成一个新的 token。每合并一次，词表就多一个 token。重复这个过程直到词表达到目标大小（如 GPT-4o 的约 200K）^[Sennrich et al., "Neural Machine Translation of Rare Words with Subword Units", ACL 2016, https://arxiv.org/abs/1508.07909]。

示例：语料中有 "low lower lowest"：
- 初始字符：l o w _ l o w e r _ l o w e s t
- 迭代 1：发现 "l"+"o" 出现最频繁 -> 合并为 "lo"
- 迭代 2：发现 "lo"+"w" 出现最频繁 -> 合并为 "low"
- 迭代 3：发现 "e"+"r" 出现最频繁 -> 合并为 "er"
- 依此类推，最终 "lower" 可以编码为 ["low", "er"] 两个 token

GPT 系列的 BPE 还有一个关键优化——**Byte-level BPE**：基础字母表不是单个字符，而是 256 个字节值。这意味着任何 Unicode 文本都可以用字节表示，彻底消灭了"未知 token"（OOV）的问题——哪怕遇到从未见过的生僻汉字，也能回退到字节级编码 ^[Radford et al., "Language Models are Unsupervised Multitask Learners", OpenAI, 2019, https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf]。

代表模型：GPT-2/3/4/5、Claude 系列、LLaMA 3/4。2026 年使用 BPE 的模型占主流地位。

### WordPiece

WordPiece 和 BPE 的底层思路相同（从字符到子词逐步合并），但合并标准不同。BPE 选择频率最高的对合并，WordPiece 选择**让语言模型概率增加最多的对**合并：

```
合并分数 = 字符对频率 / (第一个字符频率 × 第二个字符频率)
```

这个公式的含义：如果两个字符几乎总是成对出现，但单独出现很少，那它们很可能是一个有意义的子词单元，应该合并。比如 "##ization" 几乎总是跟在某些词干后面出现——把它合并成独立 token 是正确的 ^[Schuster and Nakajima, "Japanese and Korean Voice Search", Google, 2012, https://research.google/pubs/pub37842/]。

WordPiece 的代表是 BERT 家族。但它有一个致命弱点：如果词的任何子词不在词表中，**整个词**被替换为 `[UNK]`。这意味着遇到专业术语或生僻词时，WordPiece 直接放弃。对于生成式 LLM，这个缺陷是不可接受的——这也是为什么 2026 年的 LLM 几乎不再使用 WordPiece 的原因。

### SentencePiece

SentencePiece 是一个框架而非一种算法，内部可配置为 BPE 或 Unigram 模式。它的核心哲学就是两个字：**语言无关。** BPE 和 WordPiece 都依赖预分词（先按空格和标点切开），这在中文、日语、泰语等无空格语言面前就失效了。SentencePiece 的解法很简单也很大胆：把空格当作普通字符看待（编码为下划线符号），不依赖任何语言的预分词规则 ^[Kudo and Richardson, "SentencePiece: A simple and language independent subword tokenizer", EMNLP 2018, https://arxiv.org/abs/1808.06226]。

在 Unigram 模式下（T5、Gemma 使用），SentencePiece 的训练方向与 BPE 相反：不是从少到多，而是先构建一个巨大的候选词表，然后通过 EM 算法反复删除对训练数据似然贡献最小的子词，直到词表收缩到目标大小。这就像雕刻——从一块大石头开始，去掉不需要的部分，留下最优的形态 ^[Kudo, "Subword Regularization: Improving Neural Network Translation Models with Multiple Subword Candidates", ACL 2018, https://arxiv.org/abs/1804.10959]。

## 注意事项：Tokenizer 的选择比你想象的更重要

1. **中文用户的"token 税"。** 同样的语义内容，中文需要的 token 数通常是英文的 1.5 到 3 倍。举例而言，GPT-4 分词器将 "Hello world" 编码为 2 个 token，但"你好世界"可能需要 6-8 个 token。这意味着中文用户使用按 token 计费的 API 时，实际成本更高；在相同上下文窗口下，中文用户能输入的文本量也更少 ^[FutureAGI, same source]。

2. **token 数无法跨模型换算。** 不同厂商的词表互不兼容——OpenAI 的 tokenizer 把 "fantastic" 可能编码为 1 个 token，但 Claude 的 tokenizer 可能编码为 2 个。同一个 prompt 在不同模型上的 token 数可能相差 30-40%，直接影响 API 账单。

3. **词表大小的取舍。** 大词表（200K）意味着每个 token 承载更多语义、更短的序列、更高效的推理，但代价是更大的 Embedding 层参数量（Embedding Layer，模型的第一个神经网络层，把每个 token ID 映射为一个固定长度的向量）以及更多稀有 token 训练不充分的风险。LLaMA 3 从 32K 升级到 128K 词表，Embedding 层的参数量增加了 4 倍，但多语言能力实现了质的飞跃。2026 年的趋势是继续扩大词表（128K-200K），用更大的 Embedding 层换取更好的多语言覆盖和推理效率。

4. **分词器是模型不可分割的一部分。** 换个 tokenizer 意味着模型需要从头训练——embedding 矩阵的形状和语义完全改变了。因此，选择模型时不需要单独选择分词器：**分词器随模型而来。**

## 关联

- [[概念-Token]] — 子文件夹中 Token 的完整概念文档，含三种粒度对比和词表大小趋势
- [[10.1 什么是 LLM]] — Token 是 LLM 自回归生成的基本单位
- [[Ch09 Transformer 架构精讲]] — Token 进入 Transformer 后的 Embedding 和位置编码流程
- [[Ch13 RAG 进化树]] — Token 数决定了 RAG 检索中 chunk 大小的优化策略

---

> 上一节：[[10.6 上下文窗口的军备竞赛]]  |  下一节：[[10.8 2026年主流LLM能力对比]]  |
