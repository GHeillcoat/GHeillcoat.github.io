---
title: "Isolation Forest (孤立森林/隔离森林)"
description: "Isolation Forest (iForest, 孤立森林/隔离森林) 是一种基于集成学习的无监督异常检测算法，由 Liu, Ting, 和 Zhou 于 2008 年提出。其核心思想极其简洁：异常点 (Anomaly) 是\"少而不同\"的，因此更容易被随机分割隔离。"
pubDate: 2026-07-01
category: "Ch04 机器学习"
tags: ["概念", "机器学习", "异常检测", "无监督学习", "集成学习"]
aliases: ["Isolation Forest", "Isolation-Forest", "孤立森林", "iForest", "隔离森林"]
---
## 概述

Isolation Forest (iForest, 孤立森林/隔离森林) 是一种基于**集成学习**的**无监督异常检测**算法，由 Liu, Ting, 和 Zhou 于 2008 年提出。其核心思想极其简洁：**异常点 (Anomaly) 是"少而不同"的，因此更容易被随机分割隔离**。

Isolation Forest exploits the fact that anomalies are "few and different" — they are easier to isolate from the rest of the data through random partitioning. This is fundamentally different from traditional anomaly detection methods that try to model the normal distribution.

## 核心直觉

想象在一个平面上，正常点密集地聚集在一起，而异常点孤零零地远离群体。如果随机画一条线来分割这个平面：

- **异常点**：只需很少的几次分割就会被"隔离"到一个独立区域
- **正常点**：需要很多次分割才能被隔离，因为它们周围有大量邻居

这就是 Isolation Forest 名称的由来——通过"孤立"一个点所需的**分割次数**来判断它是否异常。

## 算法原理

### 1. 构建隔离树 (iTree)

对给定数据集，递归地执行以下步骤：

1. 随机选择一个特征
2. 在该特征的最小值和最大值之间随机选择一个分割值
3. 将数据分为左右两部分
4. 递归地对每个子集重复，直到：
   - 节点中只剩一个样本 (被隔离)
   - 所有样本在该特征上取值相同
   - 达到树的最大深度限制

### 2. 异常分数 (Anomaly Score)

对于一个样本 x，其异常分数定义为：

```
s(x, n) = 2^(-E[h(x)] / c(n))
```

其中：
- **h(x)**: 样本 x 在所有 iTree 中的平均路径长度 (从根节点到被隔离的叶子节点)
- **c(n)**: 给定 n 个样本时，二叉搜索树的平均路径长度 (归一化因子)
- **E[h(x)]**: 期望路径长度

分数解读：
- s ≈ 1 → 很可能是异常 (路径很短)
- s ≈ 0.5 → 无明显异常 (路径接近平均)
- s ≈ 0 → 很可能是正常 (路径很长)

### 3. 关键特性

- **无需定义"正常"分布**：不依赖距离或密度度量
- **线性时间复杂度**：O(n) 训练，O(log n) 推理
- **子采样**：通常只需 256 个样本即可构建一棵 iTree，无需使用全部数据
- **无监督**：不需要标注数据

## Isolation Forest vs 其他异常检测方法

| 维度 | Isolation Forest | LOF (局部异常因子) | One-Class SVM | AutoEncoder |
|------|-----------------|--------------------|---------------|-------------|
| 核心思想 | 随机分割→隔离 | 局部密度比较 | 寻找超球面边界 | 重构误差 |
| 监督方式 | 无监督 | 无监督 | 半监督 | 无监督/半监督 |
| 时间复杂度 | O(n) | O(n^2) | O(n^2) ~ O(n^3) | 训练 O(n·epochs) |
| 高维数据 | 良好 | 差 (维度灾难) | 差 | 良好 |
| 可解释性 | 中等 (路径长度) | 低 | 低 | 低 |
| 参数调优 | 少 | 中等 | 多 | 多 |
| 类别特征 | 不直接支持 | 不直接支持 | 不直接支持 | 支持 (Embedding) |
| 2026年应用 | 广泛 | 中等 | 较少 | 广泛 |

## 参数说明

### 主要参数

- **n_estimators** (默认 100): iTree 的数量，越多越稳定
- **max_samples** (默认 256): 每棵 iTree 的采样大小，通常 256 就足够
- **contamination** (默认 'auto'): 数据集中异常点的比例估计，用于确定阈值
- **max_features** (默认 1.0): 每次分裂时使用的特征比例

### 调参建议

- 大多数情况下，默认参数即可获得良好效果
- n_estimators 增加到 200-500 可以提高稳定性
- max_samples 通常不需要超过 512
- 如果特征数量很大，可以适当降低 max_features

## 优缺点

### 优点
- 训练速度快，线性时间复杂度，适合大规模数据
- 子采样机制使其内存效率极高
- 不需要计算距离或密度，天然适合高维数据
- 对数据的分布没有假设，适应性广
- 可解释性相对较好 (通过路径长度)
- 参数少，调参简单
- 可以处理含有缺失值的数据

### 缺点
- 对类别特征不直接支持，需要编码转换
- 在特征数量极多 (数千+) 时，随机分割的效率下降
- 对局部异常 (Local Anomaly) 的检测能力弱于 LOF
- 对"集合异常" (Collective Anomaly) 不敏感
- 不适用于流式数据 (通常需要批量训练)

## 2026 年应用场景

- **网络安全**: 检测网络入侵、DDoS 攻击、异常流量
- **金融风控**: 信用卡欺诈检测、异常交易识别
- **工业 IoT**: 设备故障预测、传感器异常检测
- **数据清洗**: 在训练机器学习模型前识别并移除异常样本
- **日志分析**: 从海量系统日志中自动发现异常模式

## 相关笔记

- [[概念-决策树]] — 隔离树的基础结构
- [[概念-随机森林]] — 集成树方法的对比
- [[概念-异常检测]] — 异常检测方法总览
- [[概念-无监督学习]] — 无监督学习范式
- [[概念-集成学习]] — 集成学习理论

## 来源

- Liu, F. T., Ting, K. M., & Zhou, Z.-H. (2008). Isolation Forest. ICDM. https://doi.org/10.1109/ICDM.2008.17
- Liu, F. T., Ting, K. M., & Zhou, Z.-H. (2012). Isolation-Based Anomaly Detection. ACM TKDD. https://doi.org/10.1145/2133360.2133363
- scikit-learn IsolationForest: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html
- PyOD Toolkit: https://github.com/yzhao062/pyod