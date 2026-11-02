---
title: "11.2 全量微调与LoRA"
description: "全量微调（Full Fine-Tuning）是最传统、最彻底的微调方式：在预训练模型的基础上，用特定任务的数据集，更新模型的所有参数，使模型从\"通用能力\"转向\"特定领域能力\"。^Howard & Ruder, \"Universal Language Model Fine-tuni"
date: 2026-07-02
category: "Ch11 模型微调"
tags: ["微调", "训练", "LoRA", "全量微调", "PEFT"]
aliases: ["全量微调与LoRA", "11.2 全量微调与LoRA", "Full Fine-Tuning vs LoRA"]
chapter: "Ch11"
section: "11.2"
source: "笔记/Ch11 模型微调/11.2 全量微调与LoRA.md"
---
## 一、概念：从"重印全书"到"贴便利贴"

### 全量微调是什么

**全量微调**（Full Fine-Tuning）是最传统、最彻底的微调方式：在预训练模型的基础上，用特定任务的数据集，更新模型的**所有参数**，使模型从"通用能力"转向"特定领域能力"。^[Howard & Ruder, "Universal Language Model Fine-tuning (ULMFiT)", 2018, https://arxiv.org/abs/1801.06146]

**生活类比**：预训练模型像一个"读完整个图书馆的人"——他什么都知道一点，但什么都不精通。全量微调就是让他去"医学院深造"——他读过的所有书（所有参数）都被重新校准，以适配医学这个新领域。代价是：他不再是原来那个"通才"了——这叫**灾难性遗忘**（Catastrophic Forgetting，模型在学习新任务时遗忘了预训练阶段获得的通用能力）。

**另一个类比**：一本百科全书。全量微调等于把整本书重新排版印刷，只为突出某个章节。而 LoRA 等于在那个章节旁边贴几张便利贴。成本差了一万倍，效果却差不多。

### 全量微调为什么贵

要理解全量微调的成本，需要先了解一个概念：**参数**（Parameter，模型的"脑细胞"，每个参数是一个数字，存储了模型学到的一丁点知识）。模型越大，参数越多，脑细胞越多。

训练时，GPU（图形处理器，一种专门做大量并行计算的芯片）需要同时存储四样东西：

**模型权重**：参数本身。一个 70B（700亿）参数的模型，如果每个参数用 16 位浮点数（FP16，一种用 2 字节存储小数的格式）存储，需要 70B x 2 bytes = **140 GB** 显存。^[Spheron Network, "GPU VRAM Requirements to Fine-Tune LLMs in 2026", 2026, https://www.spheron.network/blog/gpu-vram-requirements-fine-tune-llm-2026/]

**梯度**（Gradient，每个参数"应该往哪个方向改、改多少"的信号）：每个参数都需要一个梯度，又是 **140 GB**。

**优化器状态**（Optimizer States）：以最常用的 AdamW 优化器为例，它需要为每个参数保存两份"动量"记录（可以理解为每个参数的"速度"和"加速度"历史），每份用 32 位浮点数（FP32，4 字节）存储。70B x 4 bytes x 2 = **560 GB**。^[Lyceum Technology, "Fix OOM Errors: 70B Model Fine-Tuning Guide", 2025, https://lyceum.technology/magazine/oom-error-70b-model-fine-tuning/]

**激活值**（Activation，前向传播时中间层的临时计算结果）：约 8-20 GB（取决于批大小和序列长度）。

**总计：约 840-860 GB 显存**。而市面上最强单卡 H100 只有 80 GB 显存。这意味着全量微调一个 70B 模型需要至少 **11 张 H100** 协同工作。按云服务每小时约 55 美元的租用价格，跑 24 小时就要花约 1320 美元。^[io.net, "LLM Fine-Tuning Budget Guide", 2025, https://io.net/blog/llm-fine-tuning-budget-guide-gpu-costs-timelines-and-what-to-spend]

用更直观的方式说：全量微调时的显存大头不在模型本身（140 GB），而在优化器状态（560 GB，占总显存的 66%）。这就好比搬家——搬家具本身不贵，但搬家公司要你付三倍的"押金"。

### LoRA 是什么

2021 年，微软提出了 **LoRA**（Low-Rank Adaptation，低秩适配，读作"劳拉"）。^[Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models", 2021, https://arxiv.org/abs/2106.09685] 这篇论文解决的正是上述痛点：**能不能只训练一小部分参数，效果还接近全量微调？**

LoRA 的答案是：能。而且原理出奇简单。

**核心思想：低秩分解**。LoRA 观察到一个关键现象：预训练模型在适配下游任务时，权重矩阵的变化量（记为 delta-W）虽然看起来很大（比如 4096 x 4096 = 1677 万个数字），但它包含的"有效信息"其实很少——数学上称为"低秩"（Low Rank）。这意味着这个变化量可以用两个小得多的矩阵来近似。

**生活类比**：想象你有一张 4K 分辨率的高清照片（这是原始权重 W）。你想给照片加一个滤镜效果（这是微调的更新量 delta-W）。LoRA 发现，你不需要再存一张 4K 的滤镜图层——两张 480p 的小图（矩阵 A 和 B）叠在一起，就能近似这个滤镜效果，肉眼看不出区别。

**数学表达**：

$$
\Delta W = B \cdot A
$$

其中 A 的形状是 r x k，B 的形状是 d x r。r 称为**秩**（Rank），且 r 远小于 d 和 k（通常 r = 4 到 64）。

前向传播（模型做预测时的计算过程）变成：

$$
h = W_0 x + \frac{\alpha}{r} \cdot B A x
$$

- `W_0` 是原始权重，**完全冻结，不训练**
- `B A x` 是 LoRA 的贡献
- `alpha / r` 是缩放因子，控制 LoRA 对输出的影响力

**参数量的对比**：假设 d = k = 4096，原始 W 有 4096 x 4096 = 16.7M 个参数。当 r = 16 时，A 有 16 x 4096 = 65,536 个参数，B 有 4096 x 16 = 65,536 个参数，合计约 131K 参数——**减少了 99.2%**。^[Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models", 2021, https://arxiv.org/abs/2106.09685]

### 为什么需要 LoRA

LoRA 的出现将微调从"大公司专属"变成了"个人开发者也能做"的事情。核心理由有三：

1. **成本**：全量微调 70B 模型需要 11 张 H100，而 LoRA 微调同一个模型只需 2 张 H100，QLoRA（量化版 LoRA）甚至只需 1 张消费级显卡。
2. **多任务**：一个基座模型可以搭载多个 LoRA adapter（适配器，即训练好的小矩阵 A 和 B），每个 adapter 只有几十 MB，按需切换。保存 5 个全量微调模型需要 5 x 140 GB = 700 GB，而保存 1 个基座 + 5 个 LoRA adapter 只需 140 GB + 5 x 0.05 GB = 140.25 GB。
3. **灾难性遗忘**：由于原始权重完全冻结，LoRA 天然保留了预训练模型的全部通用能力，不会"学了这个忘了那个"。

---

## 二、教学：怎么用 LoRA，怎么选参数

### LoRA 的核心超参数

超参数（Hyperparameter）是你在训练开始前需要手动设定的配置值，就像烤箱的温度和时长——不是食材本身，但决定了最终成品。

#### 1. 秩（Rank，r）

r 是 LoRA 最重要的超参数。它决定了低秩矩阵的"中间维度"，即 LoRA 模块能表达多少信息量。

**直觉解释**：可以把 r 理解为"滤镜的精密度"。r = 4 相当于用 4 种颜色调滤镜，r = 16 相当于用 16 种颜色调滤镜——后者当然能表达更细腻的效果，但也有可能调过头（过拟合）。

| r 值 | 可训练参数（7B模型, QV） | 效果 | 适用场景 |
|------|------------------------|------|---------|
| 4 | ~4M | 基本可用 | 简单指令格式调整、风格微调 |
| 8 | ~8M | 良好 | **通用推荐起点**，大部分任务效果不错 |
| 16 | ~16M | 优秀 | 复杂生成任务（摘要、翻译、知识注入） |
| 32 | ~32M | 很好 | 领域差异大、追求极致效果 |
| 64 | ~64M | 接近全量微调 | 大数据量、预算充足 |
| 128 | ~128M | 可能过拟合 | 极少使用，仅大数据量场景 |

^[Rathore et al., "How Much is Too Much? Exploring LoRA Rank Trade-offs for Retaining Knowledge and Domain Robustness", 2025, https://aclanthology.org/2025.findings-ijcnlp.58/]

**实践建议**：从 r = 8 或 r = 16 开始。简单任务（如分类、情感分析）r = 4 就够；复杂任务（如需要生成长篇专业文本）用 r = 16 到 32。r 超过 64 后收益递减严重。^[阿里云开发者社区, "LoRA 参数调得好，模型效果差不了——微调核心超参数完整指南", 2025, https://developer.aliyun.com/article/1708251]

#### 2. Alpha 缩放因子

alpha 与 r 配合使用，实际缩放因子 = alpha / r。它控制 LoRA 模块对原始模型输出的"影响力"——相当于 LoRA 输出的"音量旋钮"。

| alpha 设置 | 缩放因子 | 效果 |
|-----------|---------|------|
| alpha = r | 1.0 | 标准强度，保守适配 |
| alpha = 2r | 2.0 | **最常用**，平衡容量与稳定性 |
| alpha = 4r | 4.0 | 激进，仅在需要强力适配时使用 |

^[Unsloth Guide, "LoRA Hyperparameter Best Practices", updated July 2025]

**关键洞见**：alpha 和学习率比 r 更重要。研究发现，调优 alpha 和学习率带来的质量提升，远大于单纯增大 r。如果模型欠拟合，先尝试翻倍 alpha，而不是马上增大 r。

**常用组合**：
- r = 8, alpha = 16（入门配置）
- r = 16, alpha = 32（**最推荐**，平衡性能与效率）
- r = 32, alpha = 64（复杂任务）

注意：用 r = 8, alpha = 16 和 r = 16, alpha = 32 效果类似，因为真正起作用的是比值 alpha / r。

#### 3. target_modules（在哪些层加 LoRA）

对于 Transformer 架构（当前主流大模型的基础结构），LoRA 可以加在不同的权重矩阵上。你可以把它理解为：选择在模型的哪些"器官"上做微调。

| 目标模块 | 含义 | 推荐度 | 说明 |
|---------|------|--------|------|
| q_proj | Query 投影 | **必加** | 控制模型"查什么"，对任务最敏感 |
| v_proj | Value 投影 | **必加** | 控制模型"输出什么"，对任务最敏感 |
| k_proj | Key 投影 | 推荐 | 原论文不推荐，但近年实践发现加了更好 |
| o_proj | Output 投影 | 可选 | 效果提升小，参数增加多 |
| gate_proj | 门控投影 | 可选 | LLM 的 FFN 门控，知识密集任务推荐加 |
| up_proj | 上投影 | 可选 | FFN 层，存储大量事实知识 |
| down_proj | 下投影 | 可选 | FFN 层，存储大量事实知识 |

**三种策略按显存预算选择**：

- **省显存**（`["q_proj", "v_proj"]`）：适合风格调整、对话格式微调
- **均衡**（`["q_proj", "k_proj", "v_proj", "o_proj"]`）：最常用的注意力层全覆盖
- **最佳效果**（全部线性层 `["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]`）：最大程度逼近全量微调

**重要提示**：注意力层（q/v/k/o）控制模型的"行为模式"（怎么回答），FFN 层（gate/up/down）存储模型的"事实知识"（知道什么）。如果任务是让模型学会新知识（如医学、法律），务必把 FFN 层也加入 target_modules。

### 代码示例：用 HuggingFace PEFT 微调 LLaMA

以下是一个完整的 LoRA 微调配置示例。你不需要理解每一行代码的细节——把它想象成一个"配方"，照着改参数即可。

```python
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer

# 第一步：加载基座模型（8bit 量化以节省显存）
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B",
    load_in_8bit=True,       # 8bit 量化加载，省显存
    device_map="auto"        # 自动分配到可用 GPU
)

# 第二步：配置 LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,    # 任务类型：因果语言模型（即文本生成）
    r=16,                              # 秩：推荐起点
    lora_alpha=32,                     # alpha = 2r，最常用配置
    lora_dropout=0.1,                  # Dropout 防止过拟合
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],                                 # 所有线性层
    bias="none",                       # 不训练偏置项
)

# 第三步：把 LoRA adapter 注入基座模型
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# 输出示例: trainable params: 41,943,040 || all params: 8,072,204,288 || trainable%: 0.52%
# 只有 0.52% 的参数需要训练！其余全部冻结。

# 第四步：正常训练（和普通模型训练完全一样）
trainer = Trainer(
    model=model,
    args=TrainingArguments(
        output_dir="./lora-llama-adapter",
        per_device_train_batch_size=4,
        learning_rate=2e-4,            # LoRA 推荐学习率
        num_train_epochs=3,
        warmup_ratio=0.1,              # 前 10% 步数线性预热
        lr_scheduler_type="cosine",    # 余弦衰减
        weight_decay=0.01,
    ),
    train_dataset=dataset,
)
trainer.train()

# 第五步：保存（只保存 LoRA 权重，几十 MB！）
model.save_pretrained("./lora-llama-adapter")
```

训练完成后，LoRA adapter 只是一个几十 MB 的小文件。加载时：

```python
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8B")
model = PeftModel.from_pretrained(base_model, "./lora-llama-adapter")
```

### LoRA 的杀手特性：推理时零开销

这是 LoRA 相比其他 PEFT 方法（如 Adapter 在模型层间插入小型神经网络模块）最大的优势。训练完成后，可以把 LoRA 权重数学上合并回原始权重：

```python
model = model.merge_and_unload()
# 此后模型的推理速度和内存占用，跟全量微调后的模型完全一样
```

因为 W_new = W_0 + B x A，这只是一个矩阵加法。合并后的模型就是一个普通的模型文件，没有任何额外推理成本。而 Adapter 方法在推理时仍有额外计算。

### 多 Adapter 组合：一个基座，多种个性

LoRA 的一个独特优势：你可以为同一个基座模型训练多个 LoRA adapter，每个适配不同任务，然后按需切换。

```
基座模型 (Llama-3-8B, 不动)
  ├── 法律文书 adapter (LoRA r=16, 50MB)
  ├── 医学问答 adapter (LoRA r=16, 50MB)
  ├── 代码生成 adapter (LoRA r=32, 100MB)
  ├── 客服对话 adapter (LoRA r=8, 25MB)
  └── 中英翻译 adapter (LoRA r=8, 25MB)
```

切换到不同任务只需要加载对应的 adapter，不需要重新加载整个模型。这比维护 5 个全量微调模型高效得多。

### 全量微调 vs LoRA 全面对比

| 维度 | 全量微调 | LoRA |
|------|---------|------|
| 训练参数量 | 100%（全部参数） | 0.1% ~ 1% |
| 70B 模型显存需求 | ~840 GB（11 张 H100） | ~159 GB（2 张 H100） |
| 训练速度 | 慢（更新全部参数） | 快（只更新少量参数） |
| 数据效率 | 需要大量数据（5000+） | 小样本即可（几百到几千） |
| 灾难性遗忘 | 严重（需额外策略缓解） | 轻微（原始权重冻结） |
| 多任务切换 | 需保存多个完整模型副本 | 只需切换小型 adapter |
| 最终效果上限 | 最高（充分训练后 100%） | 接近全量微调（95%-99%） |
| 推理开销 | 无 | 无（可合并回权重） |
| 存储成本（5 任务 x 70B） | ~700 GB | ~140 GB + 0.25 GB |
| 适用场景 | 领域差异极大、有充足资源 | **2026 年默认选择** |

^[Simor Consulting, "Fine-Tuning LLMs: Parameter-Efficient Techniques (LoRA, QLoRA, PEFT)", 2025, https://simorconsulting.com/blog/fine-tuning-llms-parameter-efficient-techniques-lora-qlora-peft]

### 什么时候必须全量微调

尽管 LoRA 在大多数场景下已经足够，但以下三种情况仍应考虑全量微调：

1. **领域差异极大**：目标领域与预训练数据分布差异巨大时，PEFT 的"小修小补"可能不够。例如从通用文本到中医古籍（文言文 + 专业术语）、从英文到低资源语言（如藏语）。^[深挖-全量微调, "全量微调（Full Fine-Tuning）", https://arxiv.org/abs/1801.06146]

2. **大规模知识注入**：需要让模型记住海量新事实知识（如公司多年内部文档、全新学科知识），LoRA 有限的参数量可能成为瓶颈——FFN 层存储了模型的大部分事实知识，而 LoRA 的 r=16 只能近似描述少量"变化方向"。

3. **追求极致性能**：在 Benchmark（标准评测集）上，经过充分训练的全量微调仍然略优于 LoRA。如果你的场景对精度要求极高（如医疗诊断、法律判决辅助），且有充足的 GPU 和数据（10 万+ 高质量标注数据），全量微调仍然是最优选择。

实际生产中的典型做法是：**先用 LoRA 快速验证，确认任务可行后再考虑是否需要全量微调。** 许多团队甚至从未做过全量微调——LoRA 已经足够好。

---

## 三、注意事项：常见坑与局限

### 常见错误

**rank 太小导致欠拟合**。如果你的任务需要模型学习大量新知识（如新领域的事实、新语言的语法），r = 4 或 r = 8 可能不够。**症状**：训练 loss（损失值，衡量模型预测与正确答案差距的指标）降不下去，验证集效果远差于全量微调。**解法**：增大 r 到 16-32，同时把 FFN 层加入 target_modules。^[阿里云开发者社区, "LoRA 参数调得好", 2025]

**忘加 dropout 导致过拟合**。LoRA 可训练参数少，在小数据集上容易过拟合（overfitting，模型死记硬背训练数据，而非学到通用规律）。务必设置 `lora_dropout=0.05` 或 `0.1`。**注意**：2025 年最新实践建议默认 `lora_dropout=0.0`，仅在观察到过拟合（训练 loss 持续下降但验证指标恶化）时才加。

**只加 Q/V 但任务需要 FFN 知识**。对于需要学习大量事实知识的任务，LoRA 只加在注意力层可能不够——FFN 层存储了模型的大部分知识。这时必须把 `gate_proj`、`up_proj`、`down_proj` 也加入 target_modules。

**合并权重的精度损失**。把 LoRA 权重合并回 W 时，如果基座模型用了量化（int8/int4），合并过程可能引入精度误差。建议在合并前先用 float16 精度加载基座模型。

**学习率用错**。LoRA 的可训练参数是随机初始化的，需要比全量微调**更大**的学习率（因为 A 和 B 是从零开始学的）。典型值：全量微调 lr = 1e-5 ~ 5e-5，LoRA lr = 1e-4 ~ 5e-4。如果用全量微调的小学习率来做 LoRA，训练会极其缓慢。^[Unsloth Guide, "LoRA Hyperparameter Best Practices", 2025]

### 快速调试指南

| 症状 | 可能原因 | 解决方案 |
|------|---------|---------|
| 训练 loss 下不去（欠拟合） | rank 太小 / alpha 太小 | alpha = 2r，然后 r 增至 32 |
| 验证指标持续恶化（过拟合） | 数据太少 / 无正则化 | 加 dropout=0.05-0.1，增大 weight_decay，减少 epoch |
| loss 剧烈震荡或不收敛 | 学习率太大 | 降 lr 至 1e-4 或更低 |
| 显存不够（OOM） | target_modules 太多 | 只保留 ["q_proj", "v_proj"] |
| 效果远不如全量微调 | 任务需要大量知识注入 | 把 FFN 层加入 target_modules，或考虑全量微调 |

### LoRA 的局限性

1. **不适合大规模知识注入**：LoRA 的参数量有上限，无法将海量新事实知识完整写入模型。如果需要模型记住一整本百科全书的新知识，考虑全量微调或 RAG（检索增强生成，让模型实时查资料而非记住所有知识）。

2. **Rank 选择需经验**：不同任务的最优 r 不同，没有"万能值"。需要在验证集上实验确定。

3. **低秩瓶颈**：2025 年研究发现，LoRA 的低秩结构确实存在表达能力上限，在需要大幅改变模型行为的任务上，与全量微调仍有差距。^[ICCV 2025, "Towards Higher Effective Rank in Parameter-Efficient Fine-tuning using Khatri-Rao Product", 2025, https://iccv.thecvf.com/virtual/2025/poster/2100]

4. **多 adapter 融合困难**：虽然可以保存多个 adapter，但如何让多个 adapter 的能力有效融合（如同时加载医学 + 法律 adapter）仍是一个开放问题。

5. **对极小模型效果有限**：对于 1 亿参数以下的小模型，LoRA 的收益不明显——因为小模型本来就能全量微调。

---

## 四、2026 年演进与关联

### LoRA 家族的演进路线（2023-2026）

LoRA 自 2021 年提出后，发展出了丰富的变体生态：

| 方法 | 年份 | 核心创新 | 相比 LoRA 的提升 |
|------|------|---------|----------------|
| **LoRA** | 2021 | 低秩矩阵 A/B 替代全量权重更新 | 基线：参数减少 99%+ |
| **QLoRA** | 2023 | 4-bit 量化基座模型 + LoRA | 70B 模型可在单张 48GB GPU 微调 |
| **LoRA+** | 2024 | A 和 B 使用不同学习率 | 训练速度快 1.5-2 倍 |
| **DoRA** | 2024 | 权重分解为幅度和方向，只对方向做 LoRA | 精度提升 3-5%，逼近全量微调 |
| **LoRA-FA** | 2023 | 冻结 A 矩阵，只训练 B | 参数减半，VRAM 再省 15-25% |
| **PiSSA** | 2024 | 用 SVD 主奇异值初始化 adapter | 收敛速度提升 30-50% |
| **VeRA** | 2024 | 共享随机冻结矩阵，只训练缩放向量 | 参数减少 97% |
| **AdaLoRA** | 2023 | 动态为各层分配不同秩 | 同等参数预算下性能更优 |

^[Spheron Network, "Beyond LoRA: DoRA, GaLore, PiSSA, and VeRA Fine-Tuning on GPU Cloud (2026 PEFT Decision Guide)", 2026; CSDN, "LoRA 家族概述", 2025, https://blog.csdn.net/wizardforcel/article/details/154548027]

**重点介绍三个最重要的变体**：

**DoRA（Weight-Decomposed Low-Rank Adaptation）**：2024 年提出，将预训练权重分解为"幅度"（magnitude，向量的长度）和"方向"（direction，向量的角度）两部分。LoRA 同时对两者做低秩近似，而 DoRA 只对方向做低秩分解，幅度单独学习。在多个 Benchmark 上比 LoRA 提升 3-5 个百分点，接近全量微调效果。代价是训练开销增加 10-15%。^[Liu et al., "DoRA: Weight-Decomposed Low-Rank Adaptation", ICML 2024 Oral, https://arxiv.org/abs/2402.09353] HuggingFace PEFT 从 v0.9.0 起通过 `LoraConfig(use_dora=True)` 原生支持。

**LoRA+**：2024 年提出，发现给 A 和 B 矩阵设置不同的学习率（B 的学习率是 A 的约 16 倍）可以显著加速收敛，训练速度快 1.5-2 倍，同时精度提升约 2%。^[Hayou et al., "LoRA+: Efficient Low Rank Adaptation of Large Models", 2024, https://arxiv.org/abs/2402.12354]

**LoRA-FA**：冻结 A 矩阵（随机初始化后不动），只训练 B。因为不需要存储 A 的反向传播中间结果，VRAM 比标准 LoRA 再省 15-25%。适合显存极度紧张的场景。^[Zhang et al., "LoRA-FA: Memory-efficient Low-rank Adaptation for Large Language Models Fine-tuning", 2023, https://arxiv.org/abs/2308.03303]

**2026 年推荐组合**：QLoRA + DoRA + LoRA+ ——QLoRA 压内存，DoRA 提质量，LoRA+ 加速训练。三者互补且兼容。

### 2026 年定位

2026 年，LoRA 已经是微调的**事实标准**。几乎所有开源模型（LLaMA 4、Qwen 3、Mistral Large 3、DeepSeek-V4 等）的微调生态都默认使用 LoRA。HuggingFace PEFT、Unsloth、Axolotl、LLaMA-Factory 等主流微调框架都将 LoRA 作为首要支持的 PEFT 方法。

全量微调在大部分场景下已被 LoRA 取代。但在领域差异极大、需要大规模知识注入、追求极致性能这三种情况下，全量微调仍是最优选择。

**一句话总结**：除非你有几百块 GPU 和几百万条数据，否则 LoRA 就是你的默认选择。

### 关联阅读

**深挖专题**：
- [[深挖-全量微调]] — 全量微调的原理、学习率选择、灾难性遗忘缓解策略、硬件需求详解
- [[深挖-LoRA]] — LoRA 原理深入、rank/alpha/target_modules 详细配置指南、代码示例
- [[深挖-DoRA]] — 权重分解 LoRA，方向与幅度解耦的数学原理
- [[深挖-PEFT]] — PEFT 方法全景：Adapter、Prefix Tuning、Prompt Tuning、IA3 等

**对比专题**：
- [[对比-LoRvsQLoRA]] — LoRA 与 QLoRA 的显存、速度、效果全面对比

**概念速查**：
- [[概念-模型训练管线]] — 训练管线的完整流程
- [[概念-训练数据集]] — 微调数据集构建指南

**项目实战**：
- [[用 LoRA 微调模型]] — 手把手 LoRA 微调实战项目

**下一节**：
- [[11.2 全量微调与LoRA]] — （已合并至本节）
- [[11.3 QLoRA]] — 量化 LoRA，消费级 GPU 微调大模型
- [[11.4 SFT]] — 有监督微调的完整流程

---

> ← 上一节：[[11.1 微调数据准备]] ｜ 下一节：[[11.3 QLoRA]]
