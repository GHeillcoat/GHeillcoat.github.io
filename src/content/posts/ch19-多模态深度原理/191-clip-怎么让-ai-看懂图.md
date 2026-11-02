---
title: "19.1 CLIP：怎么让 AI 看懂图"
description: "CLIP（Contrastive Language-Image Pre-training）是 OpenAI 2021 年发布的模型 ^Radford et al., \"Learning Transferable Visual Models from Natural Languag"
pubDate: 2026-06-30
updatedDate: 2026-07-02
category: "Ch19 多模态深度原理"
tags: ["多模态", "深度学习"]
aliases: ["CLIP：怎么让 AI 看懂图", "19.1 CLIP-怎么让 AI 看懂图"]
---
CLIP（Contrastive Language-Image Pre-training）是 OpenAI 2021 年发布的模型 ^[Radford et al., "Learning Transferable Visual Models from Natural Language Supervision", 2021, https://arxiv.org/abs/2103.00020]。

传统图像识别：收集猫的图片，标注"猫"。收集狗的图片，标注"狗"。训练模型区分猫和狗。问题是：你加了"老虎"这个新类别，所有训练数据要重新标注。

CLIP 的方法完全不同：**不分类别，学对应。** 给 AI 看 4 亿对"图片+文字描述"——不是"这张图是猫"，而是"一只橘猫趴在窗台上晒太阳"。让 AI 学会：这张图和这段话是不是在说同一个东西。

**对比学习（Contrastive Learning）**：
- 图片编码器（ViT 或 ResNet——一种经典的深度卷积网络，通过"残差连接"让网络可以堆叠上百层而不退化）输出图片向量
- 文字编码器（Transformer）输出文字向量
- 训练目标：让匹配的图文向量靠近，不匹配的图文向量远离
- 损失函数：InfoNCE（对比损失，全称 Noise Contrastive Estimation——核心思想是给模型一批图文对，让它把真正匹配的那对"认出来"，就像一个"找朋友"游戏：在一堆人中找到和自己配对的那个人）——在一个 batch 里，N 对图文，正样本（匹配的）距离近，负样本（不匹配的）距离远

训练完的 CLIP 可以"零样本分类"（zero-shot classification——不给你看任何该类别的样本图片，只告诉你类别名字，就能直接从图库里找到匹配的图片）——你给它任何类别的文字描述（"一只戴墨镜的猫"），它不需要这个类别的训练数据，就能在图片中找到匹配的。

---

> ← 上一节：[[Ch19 多模态深度原理|章首]] ｜ 下一节：[[19.2 扩散模型-怎么从文字生成图]] →
