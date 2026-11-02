---
title: "ReLU 与激活函数 (Activation Functions)"
description: "激活函数给神经网络注入非线性——没有它，一万层网络也只等价于一层线性变换。ReLU 凭\"简单粗暴\"统治了十年，GELU 凭\"平滑优雅\"成为 Transformer 标配。"
date: 2026-07-01
category: "Ch06 神经网络基础"
tags: ["ReLU", "GELU", "Swish", "SiLU", "激活函数", "深度学习", "神经网络"]
aliases: ["ReLU", "GELU", "Swish", "SiLU", "激活函数", "Activation Function", "Rectified Linear Unit", "Gaussian Error Linear Unit"]
prerequisites: "神经网络基础,梯度下降,反向传播"
source: "笔记/Ch06 神经网络基础/概念/概念-ReLU.md"
---
## 一句话理解

激活函数给神经网络注入非线性——没有它，一万层网络也只等价于一层线性变换。ReLU 凭"简单粗暴"统治了十年，GELU 凭"平滑优雅"成为 Transformer 标配。

## 零基础理解

想象一个水龙头：ReLU 是普通水龙头——要么全开(正数通过)，要么全关(负数截断为0)。GELU 是精密水龙头——根据水压大小概率性地调节流量，水压越大越容易全开，水压越小越容易被关掉但仍有微弱水流。Sigmoid 是老式水龙头——永远介于全开和全关之间，但开到最大也只能到 1。

## 核心激活函数对比

| 激活函数 | 公式 | 输出范围 | 计算复杂度 | 梯度特性 | 主要用途 | 提出年份 |
|---------|------|---------|-----------|---------|---------|---------|
| Sigmoid | $\sigma(x) = \frac{1}{1+e^{-x}}$ | (0, 1) | 高(指数) | 饱和区梯度消失 | 二分类输出层 | 1980s |
| Tanh | $\tanh(x) = \frac{e^x-e^{-x}}{e^x+e^{-x}}$ | (-1, 1) | 高(指数) | 饱和区梯度消失 | RNN 隐藏层 | 1980s |
| ReLU | $f(x) = \max(0, x)$ | [0, +$\infty$) | 极低 | 正半轴梯度恒为1 | CNN/MLP | 2010 (Nair & Hinton) |
| Leaky ReLU | $f(x) = \max(0.01x, x)$ | (-$\infty$, +$\infty$) | 极低 | 负半轴有微小梯度 | 解决Dying ReLU | 2015 |
| PReLU | $f(x) = \max(\alpha x, x)$ | (-$\infty$, +$\infty$) | 低 | $\alpha$ 可学习 | 灵活负半轴 | 2015 |
| GELU | $x \cdot \Phi(x)$ | (-0.17, +$\infty$) | 中 | 处处平滑可导 | Transformer 标配 | 2016 (Hendrycks & Gimpel) |
| Swish / SiLU | $x \cdot \sigma(x)$ | (-0.28, +$\infty$) | 中 | 平滑非单调 | 高效架构搜索 | 2017 (Ramachandran et al.) |
| Mish | $x \cdot \tanh(\ln(1+e^x))$ | (-0.31, +$\infty$) | 中高 | 更平滑 | 部分视觉任务 | 2019 |

## 为什么 ReLU 取代了 Sigmoid

### Sigmoid 的三大罪状

1. **梯度消失 (Vanishing Gradient)**：当输入绝对值很大时，Sigmoid 的导数趋近于 0。深层网络中，梯度在反向传播中逐层相乘，指数衰减到几乎为零——深层参数几乎不更新。

2. **非零中心 (Non-Zero-Centered)**：Sigmoid 输出始终为正(0到1)，导致下一层输入的均值偏移，梯度更新时所有参数同向震荡，收敛变慢。

3. **指数运算昂贵**：$e^{-x}$ 在 GPU 上比 $\max(0,x)$ 慢很多。当网络有数十亿参数时，这个差距被放大。

### ReLU 的优势

| 特性 | Sigmoid | ReLU |
|------|---------|------|
| 梯度传播 | 深层梯度消失 | 正半轴梯度恒为 1，深层梯度不衰减 |
| 计算速度 | 慢(指数运算) | 极快(比较运算) |
| 稀疏激活 | 所有神经元都激活 | 约 50% 神经元输出 0，稀疏表示 |
| 生物学合理性 | 低 | 高(类似神经元"全或无"发放) |
| 收敛速度 | 慢 | 快 6 倍 (Krizhevsky et al., 2012) |

### ReLU 的缺陷

**Dying ReLU 问题**：如果某个神经元的所有输入都让它输出负数，ReLU 输出 0，梯度也为 0，这个神经元就"死"了——永远不再更新。学习率过大或不好的初始化容易触发。Leaky ReLU 和 PReLU 通过在负半轴保留微小梯度来解决。

## 2026 年：GELU 是 Transformer 标配

### GELU 的数学直觉

GELU = Gaussian Error Linear Unit。它不像 ReLU 那样一刀切，而是把输入乘以标准正态分布的累积分布函数 $\Phi(x)$：

$$GELU(x) = x \cdot \Phi(x) = x \cdot \frac{1}{2}\left[1 + \text{erf}\left(\frac{x}{\sqrt{2}}\right)\right]$$

直观理解：输入 $x$ 越大，$\Phi(x)$ 越接近 1，GELU 越接近 ReLU；输入 $x$ 越小，$\Phi(x)$ 越接近 0，GELU 输出接近 0。但过渡是平滑的——这给优化器提供了连续的梯度信号。

### GELU vs ReLU 行为对比

| 输入 x | ReLU 输出 | GELU 输出 | 差异 |
|--------|----------|----------|------|
| -3.0 | 0 | -0.004 | GELU 有微小负输出 |
| -1.0 | 0 | -0.159 | GELU 允许负值 |
| 0.0 | 0 | 0 | 相同 |
| 0.5 | 0.5 | 0.346 | GELU 略低 |
| 1.0 | 1.0 | 0.841 | GELU 略低 |
| 3.0 | 3.0 | 2.996 | 几乎相同 |

### GELU 的近似计算

精确 GELU 需要计算误差函数 erf，较慢。实践中使用近似：

$$GELU(x) \approx 0.5x \left(1 + \tanh\left[\sqrt{\frac{2}{\pi}}(x + 0.044715x^3)\right]\right)$$

这个近似误差极小，计算更快。PyTorch 和 TensorFlow 的 `GELU` 实现默认使用此近似。

### 为什么 Transformer 不用 ReLU

| 原因 | 说明 |
|------|------|
| 梯度平滑 | Transformer 层数深(32-96层)，GELU 的平滑梯度让深层训练更稳定 |
| 非零负输出 | 微小的负值输出保留了信息，对注意力机制中的数值精度有益 |
| 经验验证 | BERT、GPT-3、LLaMA 等所有主流 Transformer 都使用 GELU |
| 与 LayerNorm 搭配 | GELU 的非零均值特性与 LayerNorm 配合更好 |

## 激活函数选择指南

| 场景 | 推荐激活函数 | 原因 |
|------|-------------|------|
| Transformer 隐藏层 | GELU | 2026 年标配，训练稳定 |
| CNN 隐藏层 | ReLU / SiLU | ReLU 简单高效，SiLU 在 EfficientNet 中表现好 |
| 二分类输出层 | Sigmoid | 输出概率 |
| 多分类输出层 | Softmax | 输出概率分布 |
| RNN / LSTM | Tanh + Sigmoid | 门控机制需要 |
| 小模型 / 移动端 | ReLU | 计算量最小 |
| 对抗攻击防御 | 平滑激活函数(GELU/SiLU) | 平滑梯度增加攻击难度 |

## 2026 年趋势

| 方向 | 说明 |
|------|------|
| GELU 统治 Transformer | BERT/GPT/LLaMA/Qwen/DeepSeek 全部使用 GELU 或其变体 |
| SiLU 在视觉模型中使用 | ConvNeXt、EfficientNet 使用 Swish/SiLU |
| 激活函数不再是研究热点 | 主流选择已收敛，研究重心转向注意力机制和架构创新 |
| 混合精度训练 | 激活函数的数值稳定性在 FP16/BF16 下更受关注 |

## 相关笔记

- [[Ch06 神经网络基础]] — 神经网络中激活函数的作用
- [[Ch09 Transformer 架构精讲]] — GELU 在 Transformer 中的位置
- [[概念-反向传播]] — 激活函数梯度如何影响反向传播
- [[概念-梯度下降]] — 平滑激活函数如何帮助优化
- [[概念-Softmax]] — 输出层的激活函数

## 来源

- Nair & Hinton, "Rectified Linear Units Improve Restricted Boltzmann Machines" (2010) — https://www.cs.toronto.edu/~hinton/absps/reluICML.pdf
- Hendrycks & Gimpel, "Gaussian Error Linear Units (GELUs)" (2016) — https://arxiv.org/abs/1606.08415
- Ramachandran et al., "Searching for Activation Functions" (2017, Swish) — https://arxiv.org/abs/1710.05941
- Misra, "Mish: A Self Regularized Non-Monotonic Activation Function" (2019) — https://arxiv.org/abs/1908.08681
- He et al., "Delving Deep into Rectifiers" (2015, PReLU) — https://arxiv.org/abs/1502.01852