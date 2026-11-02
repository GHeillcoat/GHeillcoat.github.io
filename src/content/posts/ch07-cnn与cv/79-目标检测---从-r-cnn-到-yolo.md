---
title: "7.9 目标检测 — 从 R-CNN 到 YOLO"
description: "目标检测不是\"这张图是什么\"，而是\"这张图里有什么，分别在哪里\"。需要同时预测物体的类别和边界框（bounding box）。 7.9.1 两阶段检测器：先找候选区域，再分类 R-CNN（2014）：用选择性搜索（Selective Search）生成约 2000 个候选区域，每"
pubDate: 2026-07-01
updatedDate: 2026-07-02
category: "Ch07 CNN与CV"
tags: ["基础", "CNN"]
aliases: ["目标检测 — 从 R-CNN 到 YOLO", "7.9 目标检测 - 从 R-CNN 到 YOLO"]
---
目标检测不是"这张图是什么"，而是"这张图里有什么，分别在哪里"。需要同时预测物体的**类别**和**边界框（bounding box）**。

### 7.9.1 两阶段检测器：先找候选区域，再分类

**R-CNN（2014）**：用选择性搜索（Selective Search）生成约 2000 个候选区域，每个区域裁剪出来，缩放到固定大小，送入 CNN 分类。问题：太慢——每张图要跑 2000 次 CNN 前向传播，一张图需要几十秒。

**Fast R-CNN（2015）**：整张图只跑一次 CNN，得到特征图，然后从特征图上提取候选区域的特征（RoI Pooling）。速度从几十秒提升到约 2 秒/张。关键创新：共享卷积计算——不用为每个候选区域重新跑 CNN。

**Faster R-CNN（2015）**：用**区域提议网络（RPN，Region Proposal Network）**替代选择性搜索。RPN 是一个小网络，在特征图上滑动，直接预测"这里可能有物体"。候选区域从 2000 个降到 300 个，且全部在 GPU 上完成。Faster R-CNN 是第一个"端到端"的检测器——从输入图片到输出检测框，全部在神经网络中完成。

**Faster R-CNN 的工作流程**：
```
输入图片 → CNN提取特征图 → RPN生成候选区域 → RoI Pooling提取区域特征 → 分类+框回归
```

### 7.9.2 单阶段检测器：一步到位

**YOLO（You Only Look Once，2015）**：Joseph Redmon 提出的单阶段检测器，把检测变成回归问题——把图片分成 S×S 的网格，每个网格直接预测 B 个边界框和类别概率。一张图只跑一次 CNN，速度极快（45 FPS，Fast YOLO 达到 155 FPS）。

**YOLO 的演进**：
- **YOLOv1（2015）**：开创性工作，但定位不准，小物体检测差。
- **YOLOv2/YOLO9000（2016）**：引入锚框（Anchor Box）、BatchNorm、多尺度训练，可以检测 9000 类物体。
- **YOLOv3（2018）**：用 FPN（特征金字塔）在三个尺度上检测，小物体检测大幅改善。骨干网络换成 Darknet-53。
- **YOLOv4（2020）**：集成大量"tricks"（CSPNet、PANet、Mish 激活、CIoU loss、Mosaic 增强），在 COCO 上达到当时最佳。
- **YOLOv5（2020）**：Ultralytics 的 PyTorch 实现，不是官方 YOLO 但社区最流行。易用性极佳。
- **YOLOv8（2023）**：Ultralytics 统一了检测、分割、姿态估计、分类到一个框架。anchor-free 设计，解耦头。
- **YOLOv9（2024）**：PGI（Programmable Gradient Information）解决深度网络中的信息瓶颈。
- **YOLOv10（2024）**：NMS-free 训练——推理时不需要非极大值抑制，端到端一气呵成。
- **YOLOv11（2024）**：Ultralytics 最新版，在精度和速度之间取得新的平衡。

**YOLO 的核心优势**：速度。YOLO 系列始终是实时检测的首选——自动驾驶、视频监控、无人机、手机 AR 都依赖 YOLO 级别的速度。

**SSD（Single Shot MultiBox Detector，2016）**：在多个尺度的特征图上同时做检测——浅层大特征图检测小物体，深层小特征图检测大物体。比 YOLOv1 更准，比 Faster R-CNN 更快，是一个重要的中间方案。

**DETR（Detection Transformer，2020）**：Facebook 提出用 Transformer 做检测——把检测视为"集合预测"问题，用 Transformer 编码器-解码器直接输出一组检测框（不需要锚框、不需要 NMS）。DETR 结构极其简洁，但训练收敛慢（需要 500 epoch vs Faster R-CNN 的 12 epoch）。Deformable DETR（2021）解决了收敛慢的问题，DETR v2（2024）进一步提升了效率。

### 7.9.3 检测指标：mAP 和 IoU

**IoU（Intersection over Union，交并比）**：预测框和真实框的重叠面积 ÷ 两者并集面积。IoU > 0.5 通常视为"检测正确"，IoU > 0.75 是"严格标准"。

**mAP（mean Average Precision，平均精度均值）**：在不同 IoU 阈值（通常 0.5:0.05:0.95）下计算每个类别的 AP，然后取平均。mAP@0.5 是最常用的指标，mAP@0.5:0.95 更严格（COCO 数据集的标准指标）。

### 7.9.4 2026 年检测技术选型

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 实时视频检测（>30 FPS） | YOLOv11 | 速度和精度的最佳平衡 |
| 高精度离线检测 | DETR v2 / Co-DETR | 基于 Transformer，精度最高 |
| 小物体检测 | YOLOv11 + SAHI（切片推理） | 将大图切片后逐片检测 |
| 移动端/边缘设备 | YOLOv8-Nano / MobileNet-SSD | 模型 < 5MB |
| 医学影像检测 | Faster R-CNN + 特定域预训练 | 小物体多，需要精确框 |
| 端到端自动驾驶 | DETR 变体 + 时序信息 | 需要理解物体运动 |

---

> ← 上一节：[[7.8 CNN 的训练技巧]] ｜ 下一节：[[7.10 图像分割-像素级的理解]] →
