---
title: "21.7 CI/CD"
description: "CI/CD 是 Continuous Integration / Continuous Deployment（持续集成 / 持续部署）的缩写。在传统软件开发中，CI/CD 意味着\"代码提交 → 自动跑测试 → 自动打包 → 自动部署到服务器\"。在 MLOps 中，CI/CD 的含"
pubDate: 2026-07-01
updatedDate: 2026-07-02
category: "Ch21 MLOps"
tags: ["运维", "部署"]
aliases: ["CI/CD", "21.7 CI/CD"]
---
## 概念：从"手动"到"自动"的关键一跳

CI/CD 是 Continuous Integration / Continuous Deployment（持续集成 / 持续部署）的缩写。在传统软件开发中，CI/CD 意味着"代码提交 → 自动跑测试 → 自动打包 → 自动部署到服务器"。在 MLOps 中，CI/CD 的含义更宽：它把实验管理、模型训练、模型评估、模型部署、生产监控**串联成一条自动流水线**，让模型更新从一个"需要工程师手动操作数小时"的过程变成"代码推送后自动完成"的过程。^[GitLab, "MLOps end-to-end Technical Blueprint", https://handbook.gitlab.com/handbook/engineering/architecture/design-documents/mlops/, 2025]

生活比喻：CI/CD 流水线就像一个**流水线厨房**。传统模式是：厨师（数据科学家）炒完菜（训练完模型），端着盘子跑到前厅（部署服务器），手动摆盘上桌（配置 API）。CI/CD 模式是：厨师炒完菜放在传送带上，传送带自动完成——质检（测试）、装盘（打包镜像）、送到客人桌上（部署）、客人反馈不好就自动撤回厨房重做（回滚）。厨师只负责炒菜，剩下的交给流水线。^[Red Hat Developer, "One model is not enough, too many models is hard: Technical deep dive", https://developers.redhat.com/articles/2025/10/08/one-model-not-enough-too-many-models-hard-technical-deep-dive, 2025]

ML 场景下 CI/CD 和传统软件 CI/CD 有一个关键区别：传统 CI/CD 只处理**代码**，ML CI/CD 还要处理**数据**和**模型**。代码变更触发测试，数据变更触发重训练，模型性能下降触发回滚——三个不同的触发器，但共用同一条流水线。^[阿里云开发者社区, "集成CI/CD与模型监控构建MLOps全流程实践", https://developer.aliyun.com/article/1673642, 2025]

## 教学：一条 ML CI/CD 流水线的解剖

### 标准流水线阶段

一条完整的 ML CI/CD 流水线包含以下阶段，每个阶段由"触发条件 + 自动化脚本"组成：

**阶段 1：触发**。什么情况启动流水线？三种常见触发器：
- 代码 push（开发者改了训练代码或预处理逻辑）
- 定时触发（cron：每周一凌晨用上周的新数据重新训练）
- 事件触发（监控系统检测到数据漂移超过阈值 → 自动触发重训练）

**阶段 2：测试**。在正式训练之前快速验证代码的正确性：
- 单元测试：数据加载函数是否正常工作
- 数据测试：新到的数据是否符合 schema 要求（没有缺失列、值范围正常）

**阶段 3：训练**。在自动化环境中执行训练脚本。关键点：训练环境必须通过 Docker 镜像锁定——确保 CI 里的 Python 版本、依赖库版本和你的开发环境一致。否则会出现"我电脑上能跑，CI 里跑不了"的经典问题。

**阶段 4：评估**。用测试集评估新训练的模型，和当前线上模型的分数做对比：
- 如果新模型在所有关键指标上优于旧模型 → 进入部署阶段
- 如果有任何关键指标下降超过阈值 → 终止流水线，发送通知给开发者

**阶段 5：部署**。不是直接把新模型全量替换旧模型。标准做法是**渐进式部署**：
- **金丝雀部署**（Canary Deployment）：先把 5%-10% 的流量导给新模型，观察几分钟的指标（延迟、错误率、输出质量）。如果一切正常，逐步增加到 50%、100%。如果异常，自动切回旧版本。名字来源于煤矿工人带金丝雀下井——金丝雀对毒气敏感，先牺牲金丝雀，保护矿工。^[Azure ML, "Managed online endpoints deployment strategies", https://learn.microsoft.com/en-us/azure/machine-learning/concept-deployments, 2025]
- **影子模式**（Shadow Mode）：新模型在后台接收所有真实请求并记录输出，但不真正返回给用户。相当于让新模型在安全环境中"实习"一段时间，积累足够的评估数据后再决定是否上线。

**阶段 6：回滚**。如果金丝雀部署发现指标异常，或者上线后用户投诉激增，需要能**一键回退**到上一个稳定版本。这不是"把代码 revert 一下"那么简单——模型文件、模型注册表的状态、API 路由配置都需要同步回退。MLflow 的模型注册表（详见 21.3）提供了 Stage 回退功能：把 v1.3 从 Production 降为 Archived，把 v1.2 升回 Production。

### 用 GitHub Actions 实现

GitHub Actions 是 GitHub 内置的 CI/CD 工具，对个人和小团队完全免费。一个最小可行的 ML CI/CD 配置：

```yaml
# .github/workflows/train.yml
name: Train and Deploy Model
on:
  push:
    branches: [main]
  schedule:
    - cron: "0 2 * * 1"  # 每周一凌晨2点

jobs:
  train-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest tests/

      - name: Train model
        run: python train.py

      - name: Evaluate model
        run: python evaluate.py

      - name: Deploy (if better)
        if: env.NEW_MODEL_BETTER == 'true'
        run: python deploy.py
```

这段 YAML 文件的意思是：每当有人往 main 分支推送代码，或者每周一凌晨 2 点，自动执行测试 → 训练 → 评估 → 部署。如果你在 GitHub 仓库里放了这段配置，你甚至可以在手机上 push 代码，然后等着模型自己上线。^[GitHub, "GitHub Actions Documentation", https://docs.github.com/en/actions, 2025]

## 注意事项

**不要在小团队阶段追求全自动 CI/CD**。如果你的团队只有 3-5 人，模型每周更新一次，全自动 CI/CD 的搭建和维护成本可能远超手动部署的成本。一个务实的折中方案是：**半自动流水线**——代码 push 自动触发测试和训练，但部署需要**人工点击确认按钮**。这样你保留了自动化的效率，但不失去对线上模型的控制权。^[GitLab, "MLOps end-to-end Technical Blueprint", https://handbook.gitlab.com/handbook/engineering/architecture/design-documents/mlops/, 2025]

**CI/CD 流水线也可能出 bug**。流水线本身也是代码——它也会出错。最常见的问题：训练在 CI 的 CPU 环境里跑了 8 小时超时失败（忘了配 GPU runner）、Docker 镜像构建时缺少某个系统依赖（在你的电脑上有，在 CI 的干净环境里没有）、评估脚本对新模型产出的格式不兼容导致误判"效果变差"。

**分清"可以自动化"和"应该自动化"**。自动触发重训练是好事，但自动全量部署需要谨慎。一个推荐的最低安全门槛：任何自动部署都必须经过"金丝雀阶段 + 5 分钟观察窗口 + 核心指标（延迟、错误率）在安全范围内"这三道关卡。

**数据和模型的版本同步**。如果训练代码用到了新版本的数据集（比如你更新了 DVC 的数据版本），但 CI 里跑的还是旧数据缓存——训出来的模型就是"新代码 + 旧数据"的混乱组合。流水线必须保证每次运行时拉取的是正确版本的数据。DVC（Data Version Control）是解决这个问题的标准工具。

## 关联

- [[21.3 实验管理]] — CI/CD 中的"评估"阶段依赖实验管理产出的基线指标，"部署"阶段依赖模型注册表的版本管理
- [[21.6 生产监控]] — 监控是 CI/CD 的触发器（漂移→重训练）和验证器（金丝雀阶段的指标检查）
- [[21.2 MLOps成熟度模型]] — CI/CD 是 Level 2 的核心标志：从手动部署进入自动化流水线
- [[概念-Guardrails]] — CI/CD 的安全检查环节应集成 Guardrails，在部署前验证模型安全性

---

> ← 上一节：[[21.6 生产监控]] ｜ 下一节：[[21.9 2026年MLOps趋势]] →
