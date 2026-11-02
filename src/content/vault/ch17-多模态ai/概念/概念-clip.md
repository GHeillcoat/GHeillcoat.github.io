---
title: "CLIP (Contrastive Language-Image Pre-training)"
date: 2026-07-01
updated: 2026-07-06
category: "Ch17 多模态AI"
tags: ["CLIP", "多模态", "OpenAI", "对比学习", "零样本学习", "图文对齐", "计算机视觉", "NLP"]
aliases: ["CLIP", "Contrastive Language-Image Pre-training", "图文对比预训练"]
prerequisites: "对比学习,Transformer,图像编码,文本编码,余弦相似度"
source: "笔记/Ch17 多模态AI/概念/概念-CLIP.md"
---
## 一句话理解

OpenAI的图文对齐模型,用对比学习让文本和图像映射到同一个向量空间——"猫的照片"和文字"猫"在这个空间里距离很近,而"猫的照片"和文字"汽车"距离很远。

## 核心创新: 不是分类而是对比

### 传统图像分类 vs CLIP的对比学习

| 维度 | 传统图像分类 | CLIP对比学习 |
|------|------------|------------|
| 监督信号 | 固定类别标签(如"猫") | 图文配对(图像+描述文本) |
| 类别数量 | 固定(如ImageNet的1000类) | 不受限(任意文本描述) |
| 泛化能力 | 只能识别训练过的类别 | 零样本识别任意类别 |
| 数据来源 | 人工标注 | 互联网图文对(4亿对) |
| 训练目标 | 最小化分类交叉熵 | 最大化图文对相似度,最小化非图文对相似度 |

### CLIP的对比学习目标

CLIP使用**InfoNCE Loss**进行训练:

$$
\mathcal{L} = -\frac{1}{2N}\left[\sum_{i=1}^{N}\log\frac{\exp(s_{ii}/\tau)}{\sum_{j=1}^{N}\exp(s_{ij}/\tau)} + \sum_{i=1}^{N}\log\frac{\exp(s_{ii}/\tau)}{\sum_{j=1}^{N}\exp(s_{ji}/\tau)}\right]
$$

其中 $s_{ij} = \text{cosine\_sim}(I_i, T_j)$ 是第 $i$ 张图像和第 $j$ 条文本的相似度,$\tau$ 是温度参数。

**直观理解**: 在一个batch中,正确的图文对(对角线)的相似度应该高于所有错误的图文对(非对角线)。

### CLIP架构

```
图像编码器 (Vision Encoder)         文本编码器 (Text Encoder)
  ViT 或 ResNet                        Transformer
       ↓                                    ↓
   图像向量 I                           文本向量 T
       ↓                                    ↓
       └──────────→ 余弦相似度 ←──────────────┘
                    s = I · T / (|I|·|T|)
```

## CLIP的零样本能力

### 零样本分类流程

传统分类器需要为每个类别训练一个分类头,而CLIP只需要:

1. 将测试图像编码为图像向量
2. 将候选类别名称编码为文本向量(可加上提示模板,如 "a photo of a {class}")
3. 计算图像向量与每个文本向量的余弦相似度
4. 取相似度最高的类别作为预测结果

**这意味着CLIP可以识别训练数据中从未出现过的类别!**

### 零样本性能对比

| 模型 | ImageNet零样本准确率 | 需要训练数据 | 需要类别标签 |
|------|---------------------|------------|------------|
| 监督ResNet-50 | 76.2% (有监督) | 是 | 是 |
| CLIP ViT-L/14 | 75.5% (零样本) | 否 | 否(仅需类别名称) |
| CLIP ViT-H/14 | 78.0% (零样本) | 否 | 否 |

CLIP的零样本性能已经达到甚至超过了监督训练的ResNet-50。

## CLIP如何改变了多模态AI

### 对下游模型的影响

| 下游模型 | 如何使用CLIP | CLIP的贡献 |
|---------|------------|-----------|
| DALL-E 2 | CLIP文本编码器 → 图像生成 | 文本到图像的语义对齐 |
| DALL-E 3 | CLIP用于图像描述生成 | 高质量的图像理解 |
| Stable Diffusion | CLIP文本编码器作为条件输入 | 文本理解驱动图像生成 |
| GPT-4V / GPT-5.5 | CLIP启发的训练方法 | 原生多模态理解 |
| Midjourney | CLIP引导的图像生成 | 文本-图像语义对齐 |

### CLIP的局限性

| 局限性 | 表现 | 原因 |
|--------|------|------|
| 细粒度识别差 | 无法区分具体品种/型号 | 预训练数据的描述不够细 |
| 抽象概念理解弱 | 不能数数,不能理解"没有" | 对比学习只关注全局相似性 |
| 拼写/文字识别差 | 对图像中的文字不敏感 | 预训练时图像中的文字信息被忽略 |
| 分布外泛化有限 | 医疗/遥感等专业领域性能下降 | 预训练数据分布偏互联网 |
| 组合性推理弱 | 不能理解"左边的红色球" | 缺失空间关系和属性绑定 |

## CLIP变体演进

| 版本 | 年份 | 主要改进 | 核心贡献 |
|------|------|---------|---------|
| CLIP | 2021 | 对比学习 + 4亿图文对 | 开创范式 |
| SigLIP | 2023 | Sigmoid Loss替代Softmax | 更好的batch size灵活性 |
| CoCa | 2022 | 对比+生成联合训练 | 同时支持理解和生成 |
| EVA-CLIP | 2023 | 更好的视觉编码器 | 仅改进视觉侧 |
| DFN-CLIP | 2023 | 数据过滤网络 | 更好的数据质量 |
| MetaCLIP | 2023 | 数据筛选优化 | 改善数据分布 |
| BioMedCLIP | 2024 | 医学领域特化 | 领域特化 |

## 2026年: CLIP思想影响所有多模态模型

| 影响领域 | 具体表现 |
|---------|---------|
| 图像生成 | 几乎所有文生图模型用CLIP或类CLIP编码器 |
| 视频理解 | 视频-文本对比学习(ViCLIP, VideoCLIP) |
| 3D理解 | 点云-文本对比学习(PointCLIP, ULIP) |
| 音频理解 | 音频-文本对比学习(CLAP) |
| 多模态LLM | 视觉编码器+LLM结合(LLaVA, GPT-5.5) |
| 机器人 | 视觉-语言-动作对齐(RT-2, Octo) |

## 相关笔记

- [[Ch17 多模态 AI]] — 多模态AI的完整技术体系
- [[Ch07 CNN 与计算机视觉]] — 视觉编码器基础
- [[深挖-ViT]] — Vision Transformer,CLIP的视觉编码器选择
- [[概念-注意力机制]] — CLIP中Transformer的基础
- [[概念-迁移学习]] — CLIP作为预训练模型的迁移应用
- [[概念-归一化]] — 对比学习中的温度参数与归一化

## 来源

- Radford et al., "Learning Transferable Visual Models From Natural Language Supervision" (2021) — https://arxiv.org/abs/2103.00020
- Zhai et al., "Sigmoid Loss for Language Image Pre-Training" (SigLIP, 2023) — https://arxiv.org/abs/2303.15343
- Yu et al., "CoCa: Contrastive Captioners are Image-Text Foundation Models" (2022) — https://arxiv.org/abs/2205.01917
- OpenAI CLIP Blog — https://openai.com/research/clip
- Hugging Face CLIP Model Card — https://huggingface.co/openai/clip-vit-large-patch14