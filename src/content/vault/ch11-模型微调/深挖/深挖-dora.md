---
title: "DoRA（Weight-Decomposed Low-Rank Adaptation）"
date: 2026-07-01
updated: 2026-07-06
category: "Ch11 模型微调"
tags: ["微调", "DoRA", "权重分解", "LoRA", "PEFT"]
aliases: ["Weight-Decomposed Low-Rank Adaptation", "权重分解低秩适配", "DoRA", "方向幅度分解"]
source: "笔记/Ch11 模型微调/深挖/深挖-DoRA.md"
---
## 一句话理解

DoRA 是 LoRA 的改进版，核心创新是将预训练权重分解为**幅度（Magnitude）**和**方向（Direction）**两部分，然后对方向部分应用 LoRA，对幅度部分单独调整，使微调行为更接近全量微调。

## 为什么需要 DoRA

LoRA 有一个隐含假设：**权重更新（ΔW）只在"方向"上改变模型行为，而"幅度"保持不变。** 但研究发现，全量微调时，权重矩阵的变化同时包含**方向变化**和**幅度变化**，且两者的学习模式不同。

| 学习模式 | LoRA 的处理 | DoRA 的处理 |
|---------|------------|------------|
| 方向变化（权重向量的角度） | 低秩近似（A × B） | 低秩近似（A × B） |
| 幅度变化（权重向量的长度） | 捆绑在低秩近似中 | 单独的可学习标量 |

**关键发现**：LoRA 对方向和幅度的调整是耦合的——一个低秩矩阵同时负责方向和幅度。DoRA 将两者解耦后，训练更稳定，效果更接近全量微调。

## 核心创新：权重分解

### 数学直觉

任何一个权重矩阵 W 的每一列都可以看作一个向量（在向量空间中）。每个向量（w）有两个属性：
- **幅度（Magnitude, m）**：向量的长度，`m = ||w||`
- **方向（Direction, v）**：向量的单位方向向量，`v = w / m`

DoRA 的更新公式：

```
W' = m × (W + ΔW_direction) / ||W + ΔW_direction||
```

其中：
- `m` 是单独训练的幅度参数（一个可学习的标量）
- `ΔW_direction = B × A` 是 LoRA 低秩矩阵，只负责方向的调整
- 归一化操作 `||W + ΔW_direction||` 确保方向向量保持单位长度

### 为什么分解有效

| 方面 | 解释 |
|------|------|
| **方向调整** | 影响模型"关注什么"——哪个特征重要，哪个 Token 应该被注意 |
| **幅度调整** | 影响模型"关注程度"——对某个特征的响应强度，输出的置信度 |
| **解耦的好处** | 方向用小容量（LoRA）就够了，幅度只需一个标量；两者不互相干扰，训练更稳定 |

> 类比：你在调整一张照片。LoRA 同时调整"色调"和"亮度"（耦合在一起），DoRA 把它们分开——先调色调（方向/LoRA），再单独调亮度（幅度/标量）。结果更精准，也更接近专业调色师（全量微调）的做法。

## DoRA vs LoRA 效果对比

以下数据综合自 DoRA 原论文及社区验证（2024-2025）：

| 任务/Benchmark | 全量微调 | LoRA (r=8) | LoRA (r=16) | DoRA (r=8) | DoRA (r=16) |
|---------------|---------|-----------|------------|-----------|------------|
| MMLU（知识） | 65.2 | 63.8 | 64.3 | 64.5 | 64.9 |
| GSM8K（数学） | 56.8 | 53.2 | 54.5 | 55.1 | 55.8 |
| HumanEval（代码） | 52.4 | 48.6 | 49.8 | 50.2 | 51.1 |
| MT-Bench（对话） | 7.12 | 6.78 | 6.89 | 6.95 | 7.02 |
| AlpacaEval 2.0 | 22.5 | 20.8 | 21.3 | 21.6 | 21.9 |
| 平均 | 100% | 95.2% | 96.4% | 97.1% | 97.8% |

**关键发现**：
- DoRA 在相同 rank 下效果优于 LoRA，提升约 1-2 个百分点
- DoRA (r=8) 的效果通常接近甚至超过 LoRA (r=16)
- 在数学和代码任务上，DoRA 的优势更明显（因为幅度调整对精确输出很重要）

### 训练成本对比

| 维度 | LoRA (r=8) | DoRA (r=8) | 增量 |
|------|-----------|-----------|------|
| 可训练参数 | ~8M (7B 模型) | ~8M + 少量幅度参数 | 几乎相同 |
| 训练速度 | 基准 | 慢 5%-10% | 额外归一化开销 |
| 显存占用 | 基准 | 基本持平 | 几乎相同 |
| 收敛速度 | 基准 | 略快（更稳定） | 实际训练步数可能更少 |

## 2026 年定位

DoRA 是 **2026 年 PEFT 领域最值得关注的新方法**，但生态成熟度不如 LoRA。

### 优势

1. **效果优于 LoRA**：在几乎所有 benchmark 上，DoRA 的效果都优于同 rank 的 LoRA，更接近全量微调
2. **训练更稳定**：权重分解使训练过程更平滑，损失曲线波动更小
3. **可合并性**：与 LoRA 一样，DoRA 训练完成后可以合并回原模型，推理零额外开销
4. **与 LoRA 兼容**：DoRA 是 LoRA 的超集，社区工具链迁移成本低

### 劣势

1. **生态不如 LoRA 成熟**：HuggingFace PEFT 已支持 DoRA，但第三方框架（Axolotl、Unsloth 等）的支持程度不一
2. **社区经验少**：相比 LoRA 有海量的 rank 选择、学习率等经验分享，DoRA 的最佳实践仍在积累中
3. **训练速度略慢**：权重分解的归一化操作增加了 5%-10% 的计算开销

### 什么时候用 DoRA 而不是 LoRA

| 场景 | 推荐 | 理由 |
|------|------|------|
| 通用指令微调 | LoRA 即可 | 差距极小，LoRA 更成熟 |
| 追求极致效果 | **DoRA** | 效果优于 LoRA |
| 数学/代码任务 | **DoRA** | 幅度解耦对精确输出有帮助 |
| 快速实验 | LoRA | 迭代更快，生态更成熟 |
| 生产环境 | LoRA（2026 年） | 稳定性优先，DoRA 仍需验证 |
| 知识注入 | **DoRA** | 大 rank 时 DoRA 优势更明显 |
| 与 QLoRA 结合 | 均可 | DoRA + QLoRA 效果好但慢 |

## DoRA 配置示例

```python
from peft import LoraConfig, get_peft_model

# DoRA 配置（与 LoRA 几乎相同，只需加 use_dora=True）
lora_config = LoraConfig(
    task_type="CAUSAL_LM",
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    use_dora=True,  # 关键：启用 DoRA
)

model = get_peft_model(model, lora_config)
# 其余训练流程与 LoRA 完全相同
```

## 相关笔记

- [[深挖-LoRA]] — DoRA 的基础方法，低秩适配
- [[深挖-QLoRA]] — 量化 LoRA，可与 DoRA 结合使用
- [[深挖-PEFT]] — PEFT 方法总览
- [[Ch11 模型微调]] — 微调基础知识
- [[深挖-全量微调]] — DoRA 试图逼近的目标
- [[深挖-LoRA微调]] — LoRA 微调实操

## 来源

- Liu et al., "DoRA: Weight-Decomposed Low-Rank Adaptation", 2024, https://arxiv.org/abs/2402.09353
- Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models", 2021, https://arxiv.org/abs/2106.09685
- HuggingFace PEFT DoRA Documentation, https://huggingface.co/docs/peft/developer_guides/dora
- Community Benchmarks: DoRA vs LoRA, https://huggingface.co/blog/dora-adapters