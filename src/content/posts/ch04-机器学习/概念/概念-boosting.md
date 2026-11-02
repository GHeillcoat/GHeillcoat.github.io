---
title: "Boosting (提升法)"
description: "Boosting (提升法) 是一种串行式集成学习方法，核心思想是：通过迭代训练一系列弱学习器 (Weak Learners)，每个后续学习器都聚焦于前一个学习器的错误样本，最终将所有弱学习器加权组合成一个强学习器。"
pubDate: 2026-07-01
category: "Ch04 机器学习"
tags: ["概念", "机器学习", "集成学习", "Boosting", "梯度提升"]
aliases: ["Boosting", "提升法", "梯度提升", "Gradient Boosting"]
---
## 概述

Boosting (提升法) 是一种**串行式集成学习**方法，核心思想是：通过迭代训练一系列弱学习器 (Weak Learners)，每个后续学习器都聚焦于前一个学习器的错误样本，最终将所有弱学习器加权组合成一个强学习器。

Boosting is a family of algorithms that convert weak learners to strong learners. The theoretical foundation was laid by Kearns and Valiant (1988) and the first practical algorithm AdaBoost was introduced by Freund and Schapire (1995).

## 核心机制

### 串行训练流程

```
训练集 → 模型1 → 调整样本权重 (错误样本权重增大) → 模型2 → 调整权重 → 模型3 → ... → 加权投票
```

每一步的关键在于：**后续模型特别关注前面模型预测错误的样本**。这与 Bagging 的并行独立训练形成鲜明对比。

### 数学原理

Boosting 的目标是最小化加法模型 (Additive Model) 的损失函数：

```
F_m(x) = F_{m-1}(x) + α_m · h_m(x)
```

其中：
- F_m(x) 是第 m 步的集成模型
- h_m(x) 是第 m 个弱学习器
- α_m 是第 m 个学习器的权重 (学习率)

## Boosting 算法演进

### 1. AdaBoost (Adaptive Boosting, 1995)

- 每轮训练后，增加错误分类样本的权重，降低正确分类样本的权重
- 最终分类器是各轮分类器的加权投票
- 对异常值敏感 (因为异常值会获得越来越大的权重)

### 2. GBM (Gradient Boosting Machine, 1999)

- 将 Boosting 形式化为梯度下降过程
- 每轮训练一个新模型去拟合**残差** (Residual, 即真实值减去当前模型预测值)
- 本质上是函数空间中的梯度下降

```
残差 r_i = -[∂L(y_i, F(x_i)) / ∂F(x_i)]
新模型 h_m 拟合残差 r_i
更新: F_m(x) = F_{m-1}(x) + η · h_m(x)
```

### 3. XGBoost (eXtreme Gradient Boosting, 2014)

- 引入**正则化项** (L1/L2) 防止过拟合
- 使用**二阶泰勒展开**近似损失函数，收敛更快更精确
- 支持**列采样** (Column Subsampling) 减少过拟合
- 支持**稀疏感知** (Sparsity-aware) 分裂查找
- 内置**交叉验证**和早停 (Early Stopping)
- 支持 GPU 加速和分布式训练

### 4. LightGBM (Light Gradient Boosting Machine, 2017)

- **GOSS** (Gradient-based One-Side Sampling): 保留梯度大的样本，对梯度小的样本随机采样
- **EFB** (Exclusive Feature Bundling): 将互斥特征捆绑，减少特征维度
- **Histogram-based 算法**: 将连续特征离散化为直方图，降低内存和计算开销
- **Leaf-wise 生长**: 按叶子节点分裂增益最大者优先分裂，比 XGBoost 的 Level-wise 收敛更快
- 训练速度比 XGBoost 快数倍，内存占用更低

### 5. CatBoost (Categorical Boosting, 2017)

- 原生支持**类别特征** (Categorical Features)，无需手动编码
- 使用**排序提升** (Ordered Boosting) 解决预测偏移 (Prediction Shift)
- 使用**对称树** (Symmetric Trees) 加速推理
- 在类别特征丰富的表格数据上表现优异

## 五大算法对比

| 维度 | AdaBoost | GBM | XGBoost | LightGBM | CatBoost |
|------|----------|-----|---------|----------|----------|
| 年份 | 1995 | 1999 | 2014 | 2017 | 2017 |
| 损失函数 | 指数损失 | 任意可导 | 二阶泰勒 | 二阶泰勒 | 二阶泰勒 |
| 正则化 | 无 | 学习率 | L1/L2 + 列采样 | L1/L2 + 列采样 | L2 + 随机 |
| 类别特征 | 需编码 | 需编码 | 需编码 | 需编码 | 原生支持 |
| 树生长策略 | — | — | Level-wise | Leaf-wise | Symmetric |
| 训练速度 | 慢 | 慢 | 较快 | 极快 | 较慢 |
| GPU 支持 | 有限 | 有限 | 良好 | 良好 | 良好 |
| 缺失值处理 | 不支持 | 需预处理 | 自动处理 | 自动处理 | 自动处理 |

## Bagging vs Boosting 总结

| 维度 | Bagging | Boosting |
|------|---------|----------|
| 训练方式 | 并行 | 串行 |
| 核心思路 | 降低方差 | 降低偏差 |
| 基学习器 | 强学习器 (如完全生长的决策树) | 弱学习器 (如浅层决策树) |
| 过拟合风险 | 低 | 较高，需正则化 |
| 对噪声 | 鲁棒 | 敏感 |
| 代表算法 | 随机森林 | XGBoost, LightGBM |

## 优缺点

### 优点
- 预测精度通常高于 Bagging 和单一模型
- 可灵活选择损失函数
- 自动处理特征交互
- 提供特征重要性评估
- 在结构化/表格数据上表现优异 (Kaggle 竞赛常胜方案)

### 缺点
- 训练是串行的，难以并行化
- 对噪声和异常值敏感
- 需要仔细调参 (学习率、树数量、深度等)
- 训练时间较长 (尤其是大数据集)
- 可解释性不如单棵决策树

## 相关笔记

- [[概念-Bagging]] — 对比学习
- [[概念-决策树]] — 基学习器基础
- [[概念-偏差与方差]] — Bias-Variance Tradeoff
- [[概念-过拟合与欠拟合]] — 正则化与早停
- [[概念-集成学习]] — 集成学习方法总览
- [[概念-XGBoost]] — 深入了解
- [[概念-随机森林]] — Bagging 的代表

## 来源

- Freund, Y., & Schapire, R. E. (1997). A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting. Journal of Computer and System Sciences. https://doi.org/10.1006/jcss.1997.1504
- Friedman, J. H. (2001). Greedy Function Approximation: A Gradient Boosting Machine. Annals of Statistics. https://doi.org/10.1214/aos/1013203451
- Chen, T., & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. KDD. https://arxiv.org/abs/1603.02754
- Ke, G., et al. (2017). LightGBM: A Highly Efficient Gradient Boosting Decision Tree. NeurIPS. https://papers.nips.cc/paper/6907-lightgbm
- Prokhorenkova, L., et al. (2018). CatBoost: unbiased boosting with categorical features. https://arxiv.org/abs/1706.09516