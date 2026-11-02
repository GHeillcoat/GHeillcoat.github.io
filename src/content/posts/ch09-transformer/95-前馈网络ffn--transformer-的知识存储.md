---
title: "9.5 前馈网络（FFN）— Transformer 的\"知识存储\""
pubDate: 2026-06-30
updatedDate: 2026-07-02
category: "Ch09 Transformer"
tags: ["架构", "Transformer", "深度学习"]
aliases: ["前馈网络（FFN）— Transformer 的\"知识存储\"", "9.5 前馈网络（FFN）- Transformer 的知识存储"]
---
### 9.5.1 FFN 的双重身份

每个 Transformer 层的 FFN 形式为：

```
FFN(x) = σ(x · W_1 + b_1) · W_2 + b_2
```

其中 W_1 ∈ R^{d_model × d_ff}，W_2 ∈ R^{d_ff × d_model}，通常 d_ff = 4 × d_model。

FFN 有两个关键特性：
- **逐位置独立**：FFN 对每个 token 独立应用（相同的权重），不涉及 token 之间的交互。交互由注意力层负责
- **维度先扩后缩**：先投影到高维空间（d_ff = 4d_model），做非线性变换，再投影回原始维度

这与注意力层形成了清晰的分工：**注意力层负责"通信"（token 之间交换信息），FFN 负责"计算"（对每个 token 的表示做非线性变换，存储和提取知识）**。

### 9.5.2 为什么是 4x 扩展

4x 扩展是经验性的设计选择，但背后有合理的直觉：

- **2x 扩展**：变换空间太小，信息容量不足，模型表达能力受限
- **4x 扩展**：在容量和效率之间取得平衡。原始 Transformer 论文的选择，经过大量验证
- **8x 扩展**：参数大幅增加，但收益递减。FFN 参数占 Transformer 总参数约 2/3（因为 d_model × d_ff 矩阵），8x 意味着 FFN 参数量翻倍，但训练速度下降明显

以 Llama 3 8B 为例：d_model = 4096，d_ff = 14336（约 3.5x，因为使用 SwiGLU 后调整了比例）。FFN 参数约占总参数 67%。

### 9.5.3 SwiGLU 等激活函数变体

传统的 ReLU 激活函数 max(0, x) 简单有效，但"死区"（x < 0 时梯度为 0）限制了信息流动。GELU（Gaussian Error Linear Unit）用平滑的曲线替代硬截断，但不涉及门控。

**SwiGLU** 引入了门控机制：

```
SwiGLU(x) = (SiLU(x · W_1) ⊙ (x · W_2)) · W_3
```

其中 SiLU(x) = x · σ(x)（也叫 Swish 激活函数），⊙ 是逐元素乘法。

关键思想：**门控**。x·W_2 是"信息门"，控制哪些信息通过。SiLU(x·W_1) 是"信息内容"，提供实际的变换值。门控机制让网络可以学会"选择性传递"——对某些维度完全关闭（门 = 0），对某些维度完全打开（门 = 1），对大多数维度部分打开（门在 0-1 之间）。

SwiGLU 的变体包括：
- **GeGLU**：用 GELU 替代 SiLU 作为门控
- **ReGLU**：用 ReLU 作为门控（但不可微的问题依然存在）
- **SwiGLU**：SiLU 门控，2026 年标准选择

使用 SwiGLU 时，d_ff 通常调整为 (8/3) × d_model 而非 4 × d_model，因为 SwiGLU 有三个权重矩阵（W_1, W_2, W_3）而非传统 FFN 的两个，需要补偿参数量的增加。

^[Shazeer, "GLU Variants Improve Transformer", 2020, https://arxiv.org/abs/2002.05202]

### 9.5.4 FFN 中的知识存储

一项关键研究发现：**FFN 层是 Transformer 存储事实知识的主要位置**。Geva et al. (2021) 证明了 FFN 可以解释为键值记忆：

- W_1 的每一行充当一个"键"（pattern detector），检测输入中是否存在特定模式
- W_2 的每一列充当一个"值"（output generator），当对应键被激活时，向输出添加特定信息

Meng et al. (2022) 的 ROME 论文进一步发现：**事实知识（如"埃菲尔铁塔在巴黎"）集中在特定层的特定 FFN 神经元中**。通过修改少量 FFN 权重，可以精确地编辑模型中的事实知识（"埃菲尔铁塔在伦敦"），而不会影响其他知识。

这揭示了 Transformer 的一个根本性工作方式：**注意力层负责从上下文中检索相关信息（"巴黎是什么"），FFN 层负责从参数中提取存储的知识（"巴黎的首都是巴黎"→ 实际上 FFN 存的是"埃菲尔铁塔在巴黎"这类事实）**。注意力是"上下文检索"，FFN 是"参数记忆"。

^[Geva et al., "Transformer Feed-Forward Layers Are Key-Value Memories", 2021, https://arxiv.org/abs/2012.14913]; ^[Meng et al., "Locating and Editing Factual Associations in GPT", 2022, https://arxiv.org/abs/2202.05262]

### 9.5.5 MoE：将 FFN 替换为多个专家

混合专家（Mixture of Experts, MoE）将单层 FFN 替换为 N 个并行的 FFN（"专家"），每个 token 只激活其中 k 个（k << N）：

```
MoE(x) = Σ_{i=1}^{N} G(x)_i · Expert_i(x)
```

其中 G(x) = softmax(x · W_g) 是路由器（router），决定每个 token 分配给哪些专家。实际使用时，只取 top-k 个专家（设其余权重为 0），实现稀疏激活。

**MoE 的核心优势**：
- **参数与计算解耦**：总参数量 = N × 单个 FFN 参数，但每个 token 的激活参数 = k × 单个 FFN 参数。例如 Mixtral 8×7B：总参数 47B，但每个 token 只激活约 13B 参数，推理速度接近 13B 稠密模型
- **专家专业化**：不同专家自然地学会处理不同类型的 token 或知识领域。有的专家擅长数学符号，有的擅长代码，有的擅长多语言文本

**MoE 的挑战**：
- **负载均衡**：路由器可能倾向于把大多数 token 分配给少数几个专家（"专家坍塌"）。需要辅助损失函数来鼓励均匀分配
- **通信开销**：分布式训练中，不同专家可能在不同设备上，token 路由带来 all-to-all 通信开销
- **推理内存**：虽然计算量小，但所有专家参数都需要加载到内存中（总参数量大）

2026 年 MoE 现状：DeepSeek-V2/V3（细粒度 MoE + 共享专家）、Mixtral、Qwen 2.5 MoE、GPT-4（据传 8-16 专家）均采用 MoE。MoE 被视为在固定计算预算下提升模型容量的主要手段。

^[Shazeer et al., "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer", 2017, https://arxiv.org/abs/1701.06538]; ^[Fedus et al., "Switch Transformers", 2022, https://arxiv.org/abs/2101.03961]

---

> ← 上一节：[[9.4 位置编码 - Transformer 的序列感知]] ｜ 下一节：[[9.6 残差连接与层归一化]] →
