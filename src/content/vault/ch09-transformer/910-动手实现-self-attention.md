---
title: "9.10 动手实现 Self-Attention"
date: 2026-06-30
updated: 2026-07-02
category: "Ch09 Transformer"
tags: ["架构", "Transformer", "深度学习"]
aliases: ["动手实现 Self-Attention", "9.10 动手实现 Self-Attention"]
chapter: "Ch09"
section: "9.10"
source: "笔记/Ch09 Transformer/9.10 动手实现 Self-Attention.md"
---
### 9.10.1 PyTorch 实现：缩放点积注意力

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

def scaled_dot_product_attention(Q, K, V, mask=None):
    """
    缩放点积注意力的完整实现

    参数:
        Q: (batch_size, n_heads, seq_len, d_k)  -- 查询
        K: (batch_size, n_heads, seq_len, d_k)  -- 键
        V: (batch_size, n_heads, seq_len, d_v)  -- 值
        mask: (batch_size, 1, seq_len, seq_len) 或 None
              True 的位置表示"不能关注"（会被设为 -inf）

    返回:
        output: (batch_size, n_heads, seq_len, d_v)  -- 注意力输出
        attn_weights: (batch_size, n_heads, seq_len, seq_len)  -- 注意力权重
    """
    d_k = Q.size(-1)

    # 第 1 步：计算注意力分数 (batch, n_heads, seq_len, seq_len)
    scores = torch.matmul(Q, K.transpose(-2, -1))

    # 第 2 步：缩放（除以 √d_k）
    scores = scores / math.sqrt(d_k)

    # 第 3 步：应用掩码（如果有）
    if mask is not None:
        # mask 中 True 的位置设为 -inf，softmax 后变为 0
        scores = scores.masked_fill(mask == 0, float('-inf'))

    # 第 4 步：Softmax 归一化（沿最后一维，即 key 维度）
    attn_weights = F.softmax(scores, dim=-1)

    # 第 5 步：加权求和
    output = torch.matmul(attn_weights, V)

    return output, attn_weights
```

### 9.10.2 从头实现 Mini-Transformer 的步骤

完整的 Transformer 解码器块的实现：

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, n_heads):
        super().__init__()
        assert d_model % n_heads == 0
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads

        # 合并 Q、K、V 投影为一个矩阵乘法（实践中更高效）
        self.W_qkv = nn.Linear(d_model, 3 * d_model, bias=False)
        self.W_o = nn.Linear(d_model, d_model, bias=False)

    def forward(self, x, mask=None):
        B, N, D = x.shape  # batch, seq_len, d_model

        # 一次性投影 Q、K、V
        qkv = self.W_qkv(x)  # (B, N, 3*D)
        qkv = qkv.reshape(B, N, 3, self.n_heads, self.d_k)
        qkv = qkv.permute(2, 0, 3, 1, 4)  # (3, B, n_heads, N, d_k)
        Q, K, V = qkv[0], qkv[1], qkv[2]

        # 缩放点积注意力
        attn_out, _ = scaled_dot_product_attention(Q, K, V, mask)

        # 拼接多头并投影
        attn_out = attn_out.transpose(1, 2).contiguous()  # (B, N, n_heads, d_k)
        attn_out = attn_out.reshape(B, N, D)  # (B, N, d_model)
        return self.W_o(attn_out)


class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff, activation='gelu'):
        super().__init__()
        self.W1 = nn.Linear(d_model, d_ff, bias=False)
        self.W2 = nn.Linear(d_ff, d_model, bias=False)
        self.activation = nn.GELU() if activation == 'gelu' else nn.ReLU()

    def forward(self, x):
        return self.W2(self.activation(self.W1(x)))


class DecoderBlock(nn.Module):
    def __init__(self, d_model, n_heads, d_ff):
        super().__init__()
        self.attn = MultiHeadAttention(d_model, n_heads)
        self.ffn = FeedForward(d_model, d_ff)
        self.ln1 = nn.RMSNorm(d_model)  # Pre-LN
        self.ln2 = nn.RMSNorm(d_model)

    def forward(self, x, mask=None):
        # Pre-LN: 先归一化，再计算，最后残差
        x = x + self.attn(self.ln1(x), mask)
        x = x + self.ffn(self.ln2(x))
        return x


class MiniTransformer(nn.Module):
    def __init__(self, vocab_size, d_model, n_heads, n_layers, d_ff, max_seq_len):
        super().__init__()
        self.token_embed = nn.Embedding(vocab_size, d_model)
        self.pos_embed = nn.Embedding(max_seq_len, d_model)  # 可学习位置编码
        self.layers = nn.ModuleList([
            DecoderBlock(d_model, n_heads, d_ff) for _ in range(n_layers)
        ])
        self.ln_final = nn.RMSNorm(d_model)
        self.lm_head = nn.Linear(d_model, vocab_size, bias=False)

    def forward(self, x):
        B, N = x.shape
        positions = torch.arange(0, N, device=x.device).unsqueeze(0)
        x = self.token_embed(x) + self.pos_embed(positions)

        # 因果掩码：位置 i 不能看到位置 j > i
        causal_mask = torch.tril(torch.ones(N, N, device=x.device)).unsqueeze(0).unsqueeze(0)

        for layer in self.layers:
            x = layer(x, causal_mask)

        x = self.ln_final(x)
        return self.lm_head(x)
```

### 9.10.3 关键调试技巧

**（1）注意力权重检查。** 前向传播后，验证每行注意力权重之和是否为 1（允许浮点误差）。如果和不是 1，说明 softmax 实现有问题或掩码未正确应用：

```python
assert torch.allclose(attn_weights.sum(dim=-1), torch.ones(1, device=attn_weights.device), atol=1e-6)
```

**（2）因果掩码验证。** 确保掩码正确阻止了未来信息的泄露。对于位置 i，所有 j > i 的注意力权重必须为 0：

```python
assert (attn_weights[:, :, 0, :].triu(diagonal=1) == 0).all()
```

**（3）梯度范数监控。** 训练初期，每层的梯度范数应该在合理范围（0.001 到 10 之间）。如果某层梯度为 0（梯度消失）或超过 1000（梯度爆炸），检查：
- 是否使用了 Pre-LN（而非 Post-LN）
- 残差连接是否正确实现（x + layer(x)，而非 x + layer(x) 被额外归一化）
- 学习率是否过大

**（4）NaN 排查。** 如果注意力权重或输出出现 NaN：
- 检查 √d_k 缩放是否正确——遗漏缩放是最常见原因
- 检查掩码中 -inf 是否被正确处理——softmax(-inf) = 0，但 softmax(NaN) = NaN
- 检查 embedding 初始化——过大的初始值会导致点积爆炸

**（5）位置编码贡献。** 验证位置编码没有被 token embedding 淹没。打印 token embedding 和位置编码的 L2 范数，两者应该在同数量级。如果位置编码的范数远小于 token embedding，位置信息将无法有效传递。

**（6）数值精度。** 对于大模型训练（d_model > 4096），使用 float32 做 softmax 计算（即使其他部分使用 bfloat16）。bfloat16 的精度不足以处理 softmax 中的指数运算：

```python
scores = scores.float()  # 临时提升到 float32
attn_weights = F.softmax(scores, dim=-1).to(Q.dtype)  # 回到原始精度
```

---

> ← 上一节：[[9.9 2026 Transformer 进化]] ｜ 下一节：[[Ch09 Transformer 架构精讲|章首]] →
