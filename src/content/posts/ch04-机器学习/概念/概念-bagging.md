---
title: "Bagging (Bootstrap Aggregating)"
description: "Bagging (Bootstrap Aggregating, 装袋法/自助聚合) 是一种并行式集成学习方法。其核心思想是：通过对训练集进行多次自助采样 (Bootstrap Sampling) 生成多个不同的子训练集，在每个子集上独立训练一个基学习器 (Base Learner"
pubDate: 2026-07-01
category: "Ch04 机器学习"
tags: ["概念", "机器学习", "集成学习", "Bagging"]
aliases: ["Bagging", "Bootstrap Aggregating", "装袋法", "自助聚合"]
---
## 概述

Bagging (Bootstrap Aggregating, 装袋法/自助聚合) 是一种**并行式集成学习**方法。其核心思想是：通过对训练集进行多次自助采样 (Bootstrap Sampling) 生成多个不同的子训练集，在每个子集上独立训练一个基学习器 (Base Learner)，最后通过投票 (分类) 或平均 (回归) 的方式聚合所有基学习器的预测结果。

Bagging was proposed by Leo Breiman in 1996. It is one of the foundational ensemble learning techniques and remains widely used today.

## 核心机制

### 1. Bootstrap Sampling (自助采样)

给定包含 N 个样本的原始训练集 D，有放回地随机抽取 N 次，得到一个大小仍为 N 的子训练集 D_i。每个样本被选中的概率为 1/N，一个样本不被选中的概率为：

```
P(不被选中) = (1 - 1/N)^N ≈ 1/e ≈ 0.368
```

这意味着每个子训练集约包含原始数据集中约 63.2% 的样本，剩余约 36.8% 的样本未被使用——这些样本称为 **Out-of-Bag (OOB)** 样本，可用于无偏估计模型的泛化性能。

### 2. 并行训练

对每个 Bootstrap 子集 D_i，独立训练一个基学习器 h_i(x)。由于各子集相互独立，训练过程可以完全并行，这是 Bagging 相比 Boosting 的重要优势。

### 3. 聚合策略

- **分类任务**: 多数投票 (Majority Voting) — H(x) = argmax Σ I(h_i(x) = y)
- **回归任务**: 简单平均 (Simple Averaging) — H(x) = (1/T) Σ h_i(x)

## Bagging vs Boosting 对比

| 维度 | Bagging | Boosting |
|------|---------|----------|
| 训练方式 | 并行训练 | 串行训练 (逐轮迭代) |
| 样本权重 | 各轮等权 | 根据前一轮错误调整权重 |
| 基学习器关系 | 相互独立 | 强依赖，后一个修正前一个 |
| 方差与偏差 | 主要降低方差 | 主要降低偏差 |
| 过拟合风险 | 较低 (方差降低) | 较高 (需要早停/正则化) |
| 对噪声敏感度 | 较不敏感 | 较敏感 (会过度关注噪声) |
| 代表算法 | 随机森林 | AdaBoost, GBM, XGBoost |
| 并行化 | 容易 | 困难 (本质串行) |

## 随机森林 = Bagging + 决策树 + 特征随机采样

随机森林 (Random Forest) 是 Bagging 最著名的实现，在 Bagging 的基础上增加了**特征随机采样**：

1. 对训练集做 Bootstrap 采样
2. 训练每棵决策树时，在每个节点分裂时，从全部特征中随机选取一个子集，从中选择最优分裂特征
3. 不剪枝，让树充分生长
4. 最终投票/平均

## 为什么 Bagging 有效

### 方差降低 (Variance Reduction)

对于方差为 σ^2 的 T 个独立同分布基学习器，其平均值的方差为 σ^2/T。实际上，由于 Bootstrap 采样引入了相关性 ρ，方差变为：

```
Var(ensemble) = ρσ^2 + (1-ρ)σ^2/T
```

Bagging 的核心目标是降低 ρ 之间的相关性 (通过 Bootstrap 引入随机性)，使方差项尽可能接近 σ^2/T。

### OOB 误差估计

OOB 样本提供了一种"免费"的交叉验证，无需额外划分验证集。对于每个样本，用那些未包含该样本的 Bootstrap 子集训练出的基学习器来做预测，取平均即可得到 OOB 误差。

## 优缺点

### 优点
- 显著降低方差，减少过拟合
- 可并行训练，训练效率高
- OOB 误差可用于模型评估和特征重要性估计
- 不需要太多超参数调优
- 对高维数据和缺失值有较好的鲁棒性

### 缺点
- 对偏差的改善有限
- 模型可解释性较差 (相比单棵决策树)
- 在低方差、高偏差的场景下可能不如 Boosting
- 内存占用较大 (需存储多个基学习器)

## 相关笔记

- [[概念-决策树]] — 基学习器基础
- [[概念-Boosting]] — 对比学习
- [[概念-偏差与方差]] — Bias-Variance Tradeoff
- [[概念-过拟合与欠拟合]] — 泛化理论基础
- [[概念-随机森林]] — Bagging 的经典实现
- [[概念-集成学习]] — 集成学习方法总览

## 来源

- Breiman, L. (1996). Bagging Predictors. Machine Learning, 24(2), 123-140. https://doi.org/10.1007/BF00058655
- Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32. https://doi.org/10.1023/A:1010933404324
- scikit-learn Ensemble Methods: https://scikit-learn.org/stable/modules/ensemble.html