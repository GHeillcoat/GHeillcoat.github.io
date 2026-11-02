---
title: "概念-Guardrails"
description: "Guardrails（安全护栏）是部署在AI系统周围的安全防护层，用于检测、过滤和阻止有害输入和输出。与模型内部的训练对齐不同，Guardrails是外部可配置的防护机制，可以在不修改模型的情况下实现安全策略。"
pubDate: 2026-07-01
category: "Ch21 MLOps"
tags: ["AI安全", "生产部署", "防护框架", "MLOps"]
aliases: ["安全护栏", "Guardrails", "AI安全护栏", "安全防护"]
---
## 核心定义

Guardrails（安全护栏）是部署在AI系统周围的安全防护层，用于检测、过滤和阻止有害输入和输出。与模型内部的训练对齐不同，Guardrails是外部可配置的防护机制，可以在不修改模型的情况下实现安全策略。

在2024-2026年间，随着LLM从实验阶段进入大规模生产部署，Guardrails从可选组件演变为必备基础设施，成为AI安全架构中的关键一环。

## Guardrails架构

### 分层防护模型

```
┌─────────────────────────────────────────┐
│              应用层（Application）        │
├─────────────────────────────────────────┤
│          输出Guardrails（Output）         │
│    内容过滤  格式校验  敏感信息脱敏       │
├─────────────────────────────────────────┤
│            LLM模型（Core Model）          │
├─────────────────────────────────────────┤
│          输入Guardrails（Input）          │
│    注入检测  越狱检测  毒性检测           │
├─────────────────────────────────────────┤
│              用户输入（User Input）       │
└─────────────────────────────────────────┘
```

### 输入Guardrails vs 输出Guardrails

| 维度 | 输入Guardrails | 输出Guardrails |
|------|---------------|----------------|
| **位置** | 模型处理前 | 模型生成后 |
| **主要功能** | 检测prompt注入、越狱尝试、恶意请求 | 检测有害内容、幻觉、敏感信息泄露 |
| **检测对象** | 用户输入文本 | 模型生成文本 |
| **延迟要求** | 低延迟（实时检测） | 可容忍稍高延迟 |
| **典型工具** | Prompt Shield, Lakera | Llama Guard, Azure AI Safety |
| **失败模式** | 漏检（恶意输入通过） | 漏检（有害输出未被拦截） |
| **处理方式** | 拦截/改写/标记 | 拦截/改写/标记 |

## 主流Guardrails框架对比

### 核心框架

| 框架 | 开发者 | 类型 | 部署方式 | 语言支持 | 安全分类数量 | 2026成熟度 |
|------|--------|------|----------|----------|--------------|------------|
| **Llama Guard** | Meta | 模型级安全分类器 | 本地/云端 | 多语言 | 6类 | 成熟 |
| **NeMo Guardrails** | NVIDIA | 可编程防护框架 | 本地 | 多语言 | 自定义 | 成熟 |
| **Guardrails AI** | Guardrails Hub | 结构化输出验证 | 本地/云端 | 多语言 | 自定义 | 发展中 |
| **Lakera Guard** | Lakera | 实时安全API | 云端 | 多语言 | 10+类 | 成熟 |
| **Prompt Shield** | Microsoft | Prompt安全检测 | Azure云 | 多语言 | 3类 | 成熟 |
| **Azure AI Content Safety** | Microsoft | 内容安全审查 | Azure云 | 多语言 | 4类 | 成熟 |
| **OpenAI Moderation API** | OpenAI | 内容审核 | 云端 | 多语言 | 8类 | 成熟 |

### 功能对比

| 功能 | Llama Guard | NeMo | Guardrails AI | Lakera | Prompt Shield |
|------|-------------|------|---------------|--------|---------------|
| **Prompt注入检测** | 否 | 是 | 是 | 是 | 是 |
| **越狱检测** | 是 | 是 | 部分 | 是 | 否 |
| **有害内容检测** | 是 | 是 | 部分 | 是 | 是 |
| **PII/敏感信息检测** | 否 | 是 | 是 | 是 | 否 |
| **幻觉检测** | 否 | 否 | 是 | 否 | 否 |
| **结构化输出验证** | 否 | 是 | 是 | 否 | 否 |
| **自定义规则** | 有限 | 是 | 是 | 部分 | 否 |
| **多模型投票** | 否 | 是 | 否 | 否 | 否 |
| **流式防护** | 是 | 是 | 部分 | 是 | 是 |
| **开源** | 是 | 是 | 是 | 否 | 否 |

## 2026最佳实践

### 1. 多层防护（Defense in Depth）

不要依赖单一Guardrails方案。推荐：
- **输入层**：Prompt Shield + Lakera Guard（互补检测）
- **模型层**：Llama Guard作为模型内置安全分类器
- **输出层**：Azure AI Content Safety + NeMo Guardrails（输出审查）
- **应用层**：Guardrails AI（结构化验证）

### 2. 可配置安全策略

```yaml
# 示例：Guardrails策略配置
safety_policy:
  input_guardrails:
    prompt_injection: block
    jailbreak_attempt: block
    toxicity: warn_threshold_0.7
    pii_detection: redact
  output_guardrails:
    hate_speech: block
    violence: block
    sexual_content: block
    self_harm: block
    hallucination: flag_for_review
    pii_leak: block
  custom_rules:
    - name: "禁止透露系统prompt"
      pattern: "你的系统指令是|你的prompt是|system prompt"
      action: block
```

### 3. 可观测性

- 记录所有被拦截的请求和响应
- 监控安全分类器的置信度分布
- 建立安全事件告警机制
- 定期审计安全策略有效性

### 4. 性能优化

- 流式处理：对streaming输出进行增量安全检测
- 缓存策略：对常见安全查询结果进行缓存
- 异步处理：非关键安全检查使用异步任务
- 分级处理：先快速检测，再深度检测

### 5. 持续更新

- 跟踪新型攻击模式，更新检测规则
- 定期更新安全分类器模型
- 基于生产数据优化检测阈值
- 根据业务需求调整安全策略

## 部署架构

### 典型生产部署

```
Client → API Gateway → [Input Guardrails]
                         → [Rate Limiter]
                           → LLM Service
                             → [Output Guardrails]
                               → [Logging/Monitoring]
                                 → Client
```

### 关键指标

| 指标 | 含义 | 目标值 |
|------|------|--------|
| **检测率（Recall）** | 有害内容被正确识别的比例 | > 95% |
| **误报率（FPR）** | 安全内容被错误标记的比例 | < 5% |
| **延迟增加** | Guardrails引入的额外延迟 | < 50ms |
| **可用性** | Guardrails服务的正常运行时间 | > 99.9% |
| **吞吐量** | 每秒可处理的请求数 | 取决于规模 |

## 相关笔记

- [[概念-AI安全基础]] — AI安全基础概念体系
- [[概念-Jailbreaking]] — 越狱攻击技术详解
- [[深挖-Agent安全]] — Agent安全深度分析
- [[概念-RedTeaming]] — 红队测试方法论
- [[概念-提示词注入]] — 提示词注入攻击详解

## 来源

- https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard2/MODEL_CARD.md — Llama Guard 2 Model Card
- https://github.com/NVIDIA/NeMo-Guardrails — NeMo Guardrails GitHub
- https://github.com/guardrails-ai/guardrails — Guardrails AI GitHub
- https://www.lakera.ai/blog/lakera-guard — Lakera Guard
- https://learn.microsoft.com/en-us/azure/ai-services/content-safety/ — Azure AI Content Safety
- https://learn.microsoft.com/en-us/azure/ai-services/prompt-shield — Azure Prompt Shield
- https://platform.openai.com/docs/guides/moderation — OpenAI Moderation API
- https://arxiv.org/abs/2402.01822 — Llama Guard: LLM-based Input-Output Safeguard (2024)