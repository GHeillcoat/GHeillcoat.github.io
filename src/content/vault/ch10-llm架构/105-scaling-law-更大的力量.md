---
title: "10.5 Scaling Law：更大的力量"
description: "2020 年 OpenAI 在论文《Scaling Laws for Neural Language Models》中发现了一条后来成为 AI 行业\"第一性原理\"的规律：模型性能随参数量、数据量、计算量的增长呈幂律提升。 所谓幂律，就是规模翻倍带来的性能提升是可精确预测的——不是"
date: 2026-06-30
updated: 2026-07-02
category: "Ch10 LLM架构"
tags: ["大语言模型", "架构", "规模化"]
aliases: ["Scaling Law：更大的力量", "10.5 Scaling Law-更大的力量"]
chapter: "Ch10"
section: "10.5"
source: "笔记/Ch10 LLM架构/10.5 Scaling Law-更大的力量.md"
---
## 概念：一条被反复验证的"配方公式"

2020 年 OpenAI 在论文《Scaling Laws for Neural Language Models》中发现了一条后来成为 AI 行业"第一性原理"的规律：**模型性能随参数量、数据量、计算量的增长呈幂律提升。** 所谓幂律，就是规模翻倍带来的性能提升是可精确预测的——不是猜测，不是经验，而是可以用数学公式拟合的确定性下降曲线 ^[Kaplan et al., "Scaling Laws for Neural Language Models", OpenAI, 2020, https://arxiv.org/abs/2001.08361]。

生活比喻：Scaling Law 就像厨师发现了一个万能配方公式——"面粉翻倍、水翻倍、烤制时间翻倍，面包的品质就能以固定幅度提升"。这个公式不能无限延伸（烤箱有极限），但在达到物理极限前，它是一个高度可靠的指南。对 AI 从业者来说，Scaling Law 回答了最核心的商业问题：花多少钱、训练多大的模型、能换来多少性能提升？

数学上，Scaling Law 的核心公式为 ^[Hoffmann et al., "Training Compute-Optimal Large Language Models", NeurIPS 2022, https://arxiv.org/abs/2203.15556]：

```
L(N, D) = E + A / N^alpha + B / D^beta
```

其中 `L` 是模型损失（越低越好），`N` 是参数数量，`D` 是训练 tokens 数量，`E` 是**不可约损失**（irreducible loss）——数据集本身固有的噪声，无论模型多大都无法消除的理论下限。`alpha` 和 `beta` 是控制边际收益递减速度的幂指数。

## 教学：从 Kaplan 到 Chinchilla 到 2026

### 三个维度

Scaling Law 的完整画面包含三个维度：

1. **参数规模。** 从 1B 到 10B 到 100B 到 1T，参数越多，模型的学习能力越强。但参数增加意味着训练和推理成本同步增长。
2. **数据规模。** 从 100B tokens 到 1T 到 10T+，数据越多，模型的知识覆盖越广。但高质量文本数据的总量是有限的——有人估计到 2028 年互联网上可用的高质量文本将被耗尽。
3. **计算预算。** 每次翻倍都带来可预测的性能提升，但增益是递减的——从 1 到 2 的提升远大于从 100 到 101。

### Chinchilla 最优：AI 史上最重要的修正

2022 年 DeepMind 做了一件改变行业方向的事。他们训练了一只叫 Chinchilla 的 70B 参数模型，然后问了一个反常识的问题：**花同样的计算预算，究竟是堆参数更重要还是堆数据更重要？**

当时的主流做法继承自 Kaplan 法则（OpenAI 2020），倾向于"优先堆参数"——让模型越来越大，但训练数据的增速远远落后。Chinchilla 实验推翻了这一结论：在给定的计算预算下，模型大小和训练数据量应该**等比缩放**，最优比例大约是 20 个 token 对应 1 个参数。按这个比例训练的较小模型，性能反而超过参数更多但数据不足的大模型 ^[Hoffmann et al., "Training Compute-Optimal LLMs", 2022]。

换言之，当时许多"大模型"其实是**严重欠训练**的——它们有足够的参数容量去学习，却没有得到足够的训练数据来填满这些容量。这个发现直接影响了 Llama 系列（Meta 选择用小模型+超量数据训练）、DeepSeek 系列（同样遵循数据优先策略）等后续所有开源模型的设计哲学。

### 2026 年的 Scaling Law 扩展

原始 Chinchilla 法则有两个前提假设在研究前沿已被打破 ^[Bryant, "Practical Scaling Laws: Converting Compute into Performance in a Data-Constrained World", 2026, https://arxiv.org/abs/2605.09189]：

**数据受限场景。** 当高质量数据开始枯竭，原始法则的假设（数据无限、单次遍历）失效。2026 年的一项关键修正引入了"过拟合惩罚项"——当模型开始多次重复遍历同一批数据时，性能增益急剧下降。结论是：在数据受限场景下，与其反复用同一批数据训练，不如把计算预算转向增加模型容量和更强的正则化（如更大的 weight decay） ^[Bryant, same source]。

**架构感知的 Scaling Law。** 原始法则把"参数"当作一个统一的计量单位，但 2026 年的研究指出，如何分配这些参数同样重要。通过调整隐藏层大小、MLP 与注意力的比例、以及 Grouped-Query Attention 的配置，架构优化的模型在相同训练预算下可比标准配置高出 2.1% 的准确率，推理吞吐量提升 42% ^[Bian et al., "Scaling Laws Meet Model Architecture: Toward Inference-Efficient LLMs", ICLR 2026, https://arxiv.org/abs/2510.18245]。

**MoE 的 Scaling Law。** MoE 架构动摇了原始法则的基础——"参数"概念在 MoE 中变得模糊（总参数 vs. 激活参数）。2026 年的 MoE 专属 Scaling Law 发现，专家计算量与注意力计算量的最优比值本身也遵循幂律，这意味着 MoE 模型的设计也需要一个独立的"缩放配方" ^[Li et al., "Optimal Expert-Attention Allocation in Mixture-of-Experts", 2026, https://arxiv.org/abs/2603.10379]。

## 注意事项：Scaling Law 的边界

1. **数据有限是死线。** 有估算认为，互联网上可用于 LLM 训练的高质量文本数据总量不超过 100T tokens。按 2026 年的训练速度，这块"燃料"将在 2-3 年内烧完。之后怎么办——合成数据？多模态数据？视频理解？这些是 2027 年的核心议题。

2. **不可约损失无法逾越。** 如果数据本身包含 5% 的随机噪声或矛盾信息，那么无论模型多大，损失也不可能低于 5%。这就像再好的裁判也无法在规则模糊的比赛里给出绝对公正的判罚。

3. **评估指标的欺骗性。** 损失函数（Perplexity）下降不等于实际能力提升。更低的损失可能在标准榜单上表现为"性能更好"，但这不一定转化为更好的对话体验或更准确的事实回答。这就是涌现能力争议的根源 ^[Schaeffer et al., same source]。

4. **Scaling Law 不是保证。** 它描述的是"平均趋势"，而非"每花一美元保证得到 X 提升"。在具体实验中，数据质量、架构选择、训练超参数的细微差异都可能造成显著偏离。

## 关联

- [[10.4 MoE-稀疏激活的艺术]] — MoE 架构如何改变 Scaling Law 的计算（总参数 vs 激活参数）
- [[10.6 上下文窗口的军备竞赛]] — 上下文窗口的扩展也遵循自己的 Scaling Law
- [[Ch09 Transformer 架构精讲]] — Transformer 架构的各个组件（注意力、FFN）各自遵循独立的缩放规律
- [[深挖-Mamba]] — SSM 架构提出了全新的 Scaling Law 范式

---

> 上一节：[[10.4 MoE-稀疏激活的艺术]]  |  下一节：[[10.6 上下文窗口的军备竞赛]]  |
