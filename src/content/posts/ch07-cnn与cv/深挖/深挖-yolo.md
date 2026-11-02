---
title: "深挖-YOLO (You Only Look Once)"
pubDate: 2026-07-01
updatedDate: 2026-07-06
category: "Ch07 CNN与CV"
tags: ["目标检测", "实时推理", "计算机视觉", "工业应用"]
aliases: ["You Only Look Once", "YOLO系列", "实时目标检测", "YOLO", "YOLO"]
---
## 一句话理解

**YOLO (You Only Look Once)** 是实时目标检测领域的标杆算法，将目标检测建模为单一的回归问题——一次前向传播同时预测边界框 (Bounding Box) 和类别概率，无需 RPN (Region Proposal Network) 等分阶段流程，2026 年仍是最广泛使用的工业级目标检测方案。

## 零基础理解

传统目标检测方法（如 R-CNN 系列）的工作流程：第一步，用滑动窗口或选择性搜索在图像上"扫"出可能有物体的候选区域（Region Proposals）；第二步，对每个候选区域做分类（这是什么？）和边界框精修（框在哪里？）。这种"扫一遍再判断"的方式效率很低。

YOLO 的思路完全不同：**只看一眼就告诉你"哪里有什么"**。它把图像划分为一个网格（比如 7x7），每个网格单元负责预测"这个格子中心有没有物体，如果有，完整框是什么，是什么类别"。一次性输出所有检测结果，一步到位。

**类比**：传统方法像你拿着一只手电筒，在黑暗中逐片区域寻找钥匙；YOLO 像你打开灯，整间屋子一览无余，直接告诉你钥匙在哪。

这种"一步到位"的设计使得 YOLO 的推理速度极快（45+ FPS，甚至 100+ FPS），非常适用于实时视频流、自动驾驶、安防监控等需要快速响应的场景。

## 核心概念

### 1. 网格划分 (Grid Division)

输入图像被划分为 $S \times S$ 的网格（如 YOLOv1 中 $S=7$）。每个网格单元负责预测**中心点落在该网格内的物体**。如果一个物体的中心在某个网格单元中，该单元就"声称"负责检测这个物体。

这是 YOLO 最核心的设计思想：将空间划分的责任分配给每个网格单元，每个单元只负责图像的一小块区域。

### 2. 边界框预测 (Bounding Box Prediction)

每个网格单元预测 $B$ 个边界框（YOLOv1 中 $B=2$），每个框包含 5 个值：

- $(x, y)$：边界框中心相对于网格单元边界的偏移（归一化到 [0, 1]）
- $(w, h)$：边界框的宽高相对于整张图像的比例（归一化到 [0, 1]）
- $confidence$：该框包含物体的置信度 = $P(Object) \times IoU_{pred}^{truth}$

同时，每个网格单元还预测 $C$ 个类别概率 $P(Class_i | Object)$（条件概率，前提是该网格确实包含物体）。

最终输出张量维度：$S \times S \times (B \times 5 + C)$。以 YOLOv1 在 VOC 数据集上为例：$7 \times 7 \times (2 \times 5 + 20) = 7 \times 7 \times 30$。

### 3. 置信度 (Confidence) 与 IoU

**置信度 (Confidence Score)** 衡量两个方面的乘积：
- 该网格是否包含物体（$P(Object)$）
- 预测框与真实框的重叠程度（$IoU_{pred}^{truth}$）

**IoU (Intersection over Union)**：预测框与真实框的交集面积除以并集面积，是衡量边界框预测质量的指标。$IoU = \frac{Area_{overlap}}{Area_{union}}$。

推理时，最终每个框的类别置信度为：
$$P(Class_i) \times P(Object) \times IoU_{pred}^{truth} = P(Class_i) \times Confidence$$

### 4. NMS (非极大值抑制, Non-Maximum Suppression)

YOLO 的一个网格可能产生多个预测框（尤其是相邻网格对同一物体都产生高置信度预测），NMS 用于去除冗余框：

1. 按置信度对所有预测框排序
2. 选择置信度最高的框，保留
3. 计算其他框与该框的 IoU，超过阈值（如 0.5）的视为重复，删除
4. 在剩余框中重复步骤 2-3，直到所有框处理完毕

NMS 是目标检测的"最后一道关卡"，直接影响最终检测结果的精确度。

### 5. 损失函数设计

YOLO 的损失函数是多任务损失，包含三个部分：

$$
\mathcal{L} = \lambda_{coord} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbb{1}_{ij}^{obj} \left[(x_i - \hat{x}_i)^2 + (y_i - \hat{y}_i)^2 + (\sqrt{w_i} - \sqrt{\hat{w}_i})^2 + (\sqrt{h_i} - \sqrt{\hat{h}_i})^2\right] \\
+ \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbb{1}_{ij}^{obj} (C_i - \hat{C}_i)^2 + \lambda_{noobj} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbb{1}_{ij}^{noobj} (C_i - \hat{C}_i)^2 \\
+ \sum_{i=0}^{S^2} \mathbb{1}_{i}^{obj} \sum_{c \in classes} (p_i(c) - \hat{p}_i(c))^2
$$

- 第一行：**边界框坐标损失**（仅针对包含物体的框），对宽高取平方根以减小大框的误差敏感性
- 第二行：**置信度损失**（包含物体和不含物体的框分别计算，不含物体的权重 $\lambda_{noobj}$ 较小）
- 第三行：**分类损失**（仅针对包含物体的网格单元）

## YOLO 版本演进

| 版本 | 年份 | Backbone | 核心创新 | 定位 |
|---|---|---|---|---|
| **YOLOv1** | 2015 | 自定义 CNN (24 层) | 开创性工作：统一检测框架，端到端回归 | 学术验证，开创性但精度较低 |
| **YOLOv2 (YOLO9000)** | 2016 | Darknet-19 | 引入 Anchor Box、Batch Normalization、多尺度训练、联合分类与检测训练 | 大幅提升精度和速度 |
| **YOLOv3** | 2018 | Darknet-53 | 引入 FPN 多尺度预测，3 个尺度检测头，ResNet 风格残差连接 | 工业界最广泛使用的经典版本 |
| **YOLOv4** | 2020 | CSPDarknet-53 | 引入 CSPNet、PANet、Mish 激活函数、Mosaic 数据增强、CIoU Loss | 精度和速度的极致优化（非官方作者） |
| **YOLOv5** | 2020 | CSPNet 变体 | Ultralytics 接手，PyTorch 原生实现，N/S/M/L/X 多尺寸模型，工程化完善 | 工业部署最便捷的版本 |
| **YOLOv6** | 2022 | EfficientRep | 美团提出，RepVGG 风格 backbone，工业级优化 | 工业场景专项优化 |
| **YOLOv7** | 2022 | E-ELAN | 可扩展的高效聚合网络，模型重参数化，动态标签分配 | 训练技巧的系统化总结 |
| **YOLOv8** | 2023 | CSPNet + C2f | Ultralytics 统一框架，支持分类/检测/分割/姿态估计，Anchor-Free | 全能型统一视觉框架 |
| **YOLOv9** | 2024 | GELAN + PGI | 可编程梯度信息 (PGI)，广义高效层聚合网络 (GELAN) | 信息瓶颈理论驱动，解决深层网络信息丢失 |
| **YOLOv10** | 2024 | 一致双标签分配 | 无需 NMS！一致双标签分配策略，端到端训练+推理 | 首个真正端到端的 YOLO，NMS-Free |
| **YOLO11** | 2024 | C3k2 + C2PSA | 进一步提高精度，支持更多视觉任务，Ultralytics 最新版本 | 2025 年工业部署主流选择 |

### YOLO 版本命名的"混乱"历史

需要注意的是，YOLOv5 及之后的版本并非原作者 Joseph Redmon 发布（他因伦理顾虑于 2020 年宣布退出 CV 研究）。YOLOv5 由 Ultralytics 公司发布，YOLOv6 由美团团队发布，YOLOv7 由原作者之一 Chien-Yao Wang 等发布，YOLOv8 及之后又回到 Ultralytics。这种"多线并行"的命名方式在社区引起了一些争议，但也反映了 YOLO 在工业界的巨大影响力。

## YOLO 与其他检测器对比

| 维度 | YOLO 系列 | Faster R-CNN | DETR (DEtection TRansformer) |
|---|---|---|---|
| **检测范式** | 单阶段 (One-Stage)：直接回归框 + 类别 | 两阶段 (Two-Stage)：RPN 候选区域 + 分类/回归 | 基于 Transformer 的端到端集合预测 |
| **推理速度** | 极快 (45-160+ FPS) | 较慢 (5-17 FPS) | 中等 (20-30 FPS，优化后) |
| **检测精度 (mAP)** | 良好-优秀 (50-55+ mAP on COCO) | 优秀 (依赖 backbone) | 优秀 (SOTA 级别，尤其大物体) |
| **小物体检测** | 较弱（早期版本），YOLOv8+ 显著改善 | 较好（FPN 多尺度特征） | 弱（DETR 原版），Deformable DETR 改善 |
| **NMS 需求** | 需要（YOLOv10 除外） | 需要 | 不需要（二分图匹配 + 匈牙利算法） |
| **训练复杂度** | 低，单阶段训练，超参数较少 | 中等，Alternating Training 或 Approximate Joint Training | 高，收敛慢（原版 DETR 需 500 epochs） |
| **部署友好度** | 极高，ONNX/TensorRT/TFLite/NCNN 全面支持 | 中等，需要 RPN + RCNN 双模块 | 较低，Transformer 推理优化不如 CNN 成熟 |
| **2026 年工业应用** | 安防、自动驾驶、零售、无人机、移动端 | 精度优先场景（医学影像、遥感） | 新兴场景，多模态大模型视觉分支 |

## 2026 年定位

**YOLO 是实时目标检测的工业首选，短期内地位难以撼动。**

**YOLO 的核心优势**：
- **速度优势**：单阶段检测 + CNN backbone 的极致优化，使得 YOLO 在边缘设备（Jetson Nano、手机 NPU）上也能实时运行
- **工程生态**：Ultralytics 提供了从训练、验证、导出到部署的完整工具链，`yolo predict model=yolov8n.pt source=video.mp4` 一行命令即可完成推理
- **多任务扩展**：YOLOv8+ 不再局限于检测，而是扩展为分类、实例分割、姿态估计、OBB（旋转框检测）的统一框架
- **持续迭代**：从 YOLOv5 到 YOLO11，社区持续贡献新技巧、新架构、新优化，保持着旺盛的生命力

**YOLO 面临的挑战**：
- **DETR 系列的追赶**：RT-DETR (Real-Time DETR) 等优化版 DETR 在保持端到端优势的同时，推理速度已接近 YOLO 水平
- **多模态大模型的降维打击**：GPT-5.5、Gemini 3.5 Pro 等多模态模型可以通过自然语言描述直接定位物体，虽然速度远不及 YOLO，但在灵活性和表达能力上有本质优势
- **YOLO 版本碎片化**：YOLOv5/v6/v7/v8/v9/v10/11 由不同团队维护，社区在选择时存在困惑

**2026 年实践建议**：如果你的任务是"实时检测"且场景相对固定（安防、工业质检、零售），YOLOv8/YOLO11 仍然是最优选择；如果追求极致精度且能接受稍慢的推理，Deformable DETR 或 DINO 值得考虑；如果任务需要灵活的自然语言交互，多模态大模型是未来方向。

## 相关笔记

- [[Ch07 CNN 与计算机视觉]] — CNN 的基本原理和卷积操作
- [[概念-CNN详解]] — 卷积神经网络的核心概念
- [[概念-卷积核]] — 卷积操作的数学基础
- [[深挖-ViT]] — Vision Transformer，与 CNN 互补的视觉架构
- [[深挖-ViT]] — ViT 深度分析，含 ViT vs CNN 的全面对比
- [[深挖-Mamba]] — 状态空间模型，与 YOLO 无直接关系但同属深度学习前沿

## 来源

- [You Only Look Once: Unified, Real-Time Object Detection (Redmon et al., 2015)](https://arxiv.org/abs/1506.02640) — YOLOv1
- [YOLO9000: Better, Faster, Stronger (Redmon & Farhadi, 2016)](https://arxiv.org/abs/1612.08242) — YOLOv2
- [YOLOv3: An Incremental Improvement (Redmon & Farhadi, 2018)](https://arxiv.org/abs/1804.02767) — YOLOv3
- [YOLOv4: Optimal Speed and Accuracy of Object Detection (Bochkovskiy et al., 2020)](https://arxiv.org/abs/2004.10934)
- [YOLOv7: Trainable bag-of-freebies sets new state-of-the-art for real-time object detectors (Wang et al., 2022)](https://arxiv.org/abs/2207.02696)
- [YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information (Wang et al., 2024)](https://arxiv.org/abs/2402.13616)
- [YOLOv10: Real-Time End-to-End Object Detection (Wang et al., 2024)](https://arxiv.org/abs/2405.14458)
- [Ultralytics YOLO 官方文档](https://docs.ultralytics.com/)
- [Ultralytics GitHub 仓库](https://github.com/ultralytics/ultralytics)
- [Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks (Ren et al., 2015)](https://arxiv.org/abs/1506.01497)
- [End-to-End Object Detection with Transformers (Carion et al., 2020)](https://arxiv.org/abs/2005.12872) — DETR
- [DETRs Beat YOLOs on Real-time Object Detection (Zhao et al., 2023)](https://arxiv.org/abs/2304.08069) — RT-DETR