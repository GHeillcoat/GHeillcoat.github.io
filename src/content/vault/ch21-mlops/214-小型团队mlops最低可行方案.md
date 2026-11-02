---
title: "21.4 小型团队MLOps最低可行方案"
description: "如果你是一个3-5人的小团队，不需要Kubernetes集群、不需要CI/CD流水线、不需要AutoML。以下是最小可行工具集，按优先级排列： 第一优先：实验跟踪——MLflow（本地部署） 为什么：你调了10组参数，一周后完全记不住哪组最好。MLflow只需要3行代码就能记录实"
date: 2026-07-01
updated: 2026-07-02
category: "Ch21 MLOps"
tags: ["运维", "部署"]
aliases: ["小型团队MLOps最低可行方案", "21.4 小型团队MLOps最低可行方案"]
chapter: "Ch21"
section: "21.4"
source: "笔记/Ch21 MLOps/21.4 小型团队MLOps最低可行方案.md"
---
如果你是一个3-5人的小团队，不需要Kubernetes集群、不需要CI/CD流水线、不需要AutoML。以下是最小可行工具集，按优先级排列：

**第一优先：实验跟踪——MLflow（本地部署）**
为什么：你调了10组参数，一周后完全记不住哪组最好。MLflow只需要3行代码就能记录实验，而且可以本地运行（不需要服务器）。`pip install mlflow` 然后 `mlflow ui` 就能在浏览器里看到所有实验对比。这是MLOps的"入门毒品"——用了就回不去。

**第二优先：代码版本管理——Git + GitHub**
为什么：模型文件太大不适合Git，但训练代码、配置文件、评估脚本必须用Git管理。至少做到：每次实验的代码对应一个commit，commit message里写上实验参数和结果。这样三个月后你还能复现当时的实验。

**第三优先：模型部署——Docker + FastAPI**
为什么：不需要Kubernetes。一个Docker容器 + 一台云服务器（甚至一台旧电脑）就能把模型变成API。FastAPI的代码上面已经写了，Dockerfile就6行。整个部署流程从零到上线不超过2小时。

**第四优先：模型存储——HuggingFace Hub（免费版）**
为什么：不需要自己搭模型注册表。HuggingFace Hub免费版支持私有模型仓库，可以上传模型文件、写模型卡片（描述训练数据、评估分数、使用方法）。而且和transformers库无缝集成，加载模型只需要一行 `model = AutoModel.from_pretrained("yourname/yourmodel")`。

**第五优先：监控——Evidently AI（开源版）**
为什么：不需要Grafana+Prometheus全套。Evidently AI是一个开源的ML监控库，只需要几行代码就能生成数据漂移报告、模型性能报告。把报告存成HTML文件，定期看一眼。不是实时监控，但对小团队够用。

**不要做的事**：
- 不要在小团队阶段引入Kubernetes——运维成本远超收益
- 不要在小团队阶段追求全自动CI/CD——手动触发训练+手动确认部署，足够用
- 不要在模型还没产生价值时花时间搭建"完美的MLOps平台"

**总成本**：以上所有工具都是免费/开源的。唯一需要花钱的是跑模型的服务器（GPU服务器约$1-3/小时，按需使用）。

---

> ← 上一节：[[21.3 实验管理]] ｜ 下一节：[[21.6 生产监控]] →
