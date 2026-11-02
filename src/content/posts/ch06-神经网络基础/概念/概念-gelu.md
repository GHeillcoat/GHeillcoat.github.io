---
title: "GELU (Gaussian Error Linear Unit)"
description: "GELU（Gaussian Error Linear Unit）是一种平滑的激活函数，由 Dan Hendrycks 和 Kevin Gimpel 于 2016 年提出。GELU 是 ReLU 的平滑近似版本，结合了 ReLU 的线性特性和 Dropout 的正则化思想，通过输入"
pubDate: 2026-07-01
category: "Ch06 神经网络基础"
tags: ["激活函数", "深度学习", "Transformer"]
aliases: ["GELU", "Gaussian Error Linear Unit", "GELU激活函数"]
---
## 概述

GELU（Gaussian Error Linear Unit）是一种平滑的激活函数，由 Dan Hendrycks 和 Kevin Gimpel 于 2016 年提出。GELU 是 ReLU 的平滑近似版本，结合了 ReLU 的线性特性和 Dropout 的正则化思想，通过输入值本身的概率来对输入进行门控，即：输出 = 输入 x 输入值落入标准正态分布的概率。GELU 已成为 Transformer 架构（BERT、GPT 系列）的默认激活函数。

## 数学定义

GELU 的数学表达式为：

$$ \text{GELU}(x) = x \cdot \Phi(x) = x \cdot \frac{1}{2} \left[ 1 + \text{erf}\left(\frac{x}{\sqrt{2}}\right) \right] $$

其中 $\Phi(x)$ 是标准正态分布的累积分布函数（CDF），$\text{erf}$ 是高斯误差函数。

实践中常用的近似公式（tanh 近似）：

$$ \text{GELU}(x) \approx 0.5x \left( 1 + \tanh\left[ \sqrt{\frac{2}{\pi}} \left( x + 0.044715x^3 \right) \right] \right) $$

PyTorch 中还有更快的近似（sigmoid 近似）：

$$ \text{GELU}(x) \approx x \cdot \sigma(1.702x) $$

## 核心思想

GELU 的核心思想来自**随机正则化**视角。传统的 ReLU 以确定性方式对输入进行门控（x > 0 则通过，否则为 0）。GELU 则引入随机性：输入 x 被保留的概率等于 $\Phi(x)$，即 x 在标准正态分布下被采样的概率。这种设计使得：

1. **平滑性**：GELU 处处可导，避免了 ReLU 在 x=0 处不可导的问题
2. **非单调性**：在负数区域有轻微的非零输出，有助于保持梯度流动
3. **概率解释**：给予每个神经元一个"被激活"的概率，类似 Dropout 的正则化效果

## 与其他激活函数的对比

| 特性 | GELU | ReLU | Swish / SiLU | Leaky ReLU | ELU |
|------|------|------|-------------|------------|-----|
| 公式 | $x \cdot \Phi(x)$ | $\max(0, x)$ | $x \cdot \sigma(x)$ | $\max(0.01x, x)$ | $x$ if $x>0$ else $\alpha(e^x - 1)$ |
| 平滑性 | 处处平滑 | x=0 处不可导 | 处处平滑 | x=0 处不可导 | 处处平滑 |
| 负数输出 | 有（小负值） | 无 | 有（小负值） | 有（线性负值） | 有（指数衰减） |
| 非单调性 | 是 | 否 | 是 | 否 | 否 |
| 计算开销 | 中等 | 低 | 中等 | 低 | 中等 |
| 主要应用 | Transformer/BERT/GPT | CNN/ResNet | EfficientNet | GAN | 一般网络 |
| 提出年份 | 2016 | 2010 | 2017 | 2015 | 2015 |

## 为什么 Transformer 选择 GELU

1. **平滑性带来更好的优化**：Transformer 的深层架构对梯度稳定性要求高，GELU 的平滑性有助于稳定训练
2. **与 LayerNorm 配合良好**：GELU 的非线性与 LayerNorm 的归一化形成互补
3. **经验表现最优**：在 NLP 任务中，GELU 相比 ReLU 通常能带来 1-2% 的性能提升
4. **BERT 的示范效应**：BERT 使用 GELU 取得巨大成功后，后续模型（GPT-2/3、RoBERTa、T5）纷纷效仿

## 导数与梯度特性

GELU 的导数表达式为：

$$ \text{GELU}'(x) = \Phi(x) + x \cdot \phi(x) $$

其中 $\phi(x)$ 是标准正态分布的概率密度函数。导数在 x=0 处约为 0.5，这意味着即使是负输入也能获得一定的梯度，有助于缓解"死亡神经元"问题。

## 实际使用建议

- **NLP 模型**：优先使用 GELU，几乎所有 Transformer 模型都以此为标准
- **CV 模型**：GELU 也可用，但 ReLU/Swish 在该领域更常见
- **推理优化**：如部署环境对计算量敏感，可使用 tanh 近似或 sigmoid 近似版本
- **PyTorch 中**：`nn.GELU()` 默认使用精确模式，`nn.GELU(approximate='tanh')` 使用近似模式

## 2026 年现状

GELU 仍是 Transformer 架构（包括 LLM）中最主流的激活函数。虽然 SwiGLU 等变体在部分模型中取代了 GELU（如 LLaMA 使用 SwiGLU），但 GELU 在 BERT 系模型和许多视觉 Transformer 中仍广泛使用。

## 相关笔记

- [[概念-激活函数]] - 激活函数全景对比
- [[概念-LeakyReLU]] - ReLU 的变体家族
- [[概念-Transformer]] - Transformer 架构与 GELU 的关系
- [[概念-批归一化]] - BatchNorm 与激活函数的配合

## 来源

- Hendrycks & Gimpel (2016) - "Gaussian Error Linear Units (GELUs)": https://arxiv.org/abs/1606.08415
- Hugging Face Transformers 文档 - 激活函数说明: https://huggingface.co/docs/transformers/activation
- PyTorch 官方文档 - nn.GELU: https://pytorch.org/docs/stable/generated/torch.nn.GELU.html