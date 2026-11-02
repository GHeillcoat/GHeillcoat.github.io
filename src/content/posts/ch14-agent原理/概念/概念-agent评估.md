---
title: "Agent 评估：如何衡量自主 AI 的能力"
pubDate: 2026-07-06
category: "Ch14 Agent原理"
---
## 一句话理解

评估 LLM 的对话能力有 MMLU、Chatbot Arena，但评估 AI Agent 要复杂得多——Agent 需要规划、使用工具、与环境交互、在长时间任务中保持一致性。SWE-bench、GAIA、AgentBench、WebArena 等基准试图从不同维度衡量 Agent 的真实能力。2026 年，Agent 评估面临的挑战是：如何评估一个越来越自主的系统。

## 为什么 Agent 评估比 LLM 评估更难

### LLM 评估 vs Agent 评估

| 维度 | LLM 评估 | Agent 评估 |
|------|---------|-----------|
| 评估对象 | 单次对话的质量 | 多步任务完成的质量 |
| 时间跨度 | 秒级（单轮回复） | 分钟到小时级（多步执行） |
| 交互方式 | 纯文本输入输出 | 工具调用、环境交互、代码执行 |
| 成功标准 | 答案正确/错误 | 任务完成 + 过程质量 + 效率 |
| 评估成本 | 低（自动评分） | 高（需要环境搭建 + 执行时间） |
| 可复现性 | 高（输入固定） | 中（环境可能变化） |
| 作弊风险 | 高（数据污染） | 中（需要实际执行） |

Agent 评估的核心难题是**环境依赖性**：Agent 需要在一个"真实"的环境中运行（代码仓库、网页、操作系统），而搭建和维护这些环境成本很高。同时，Agent 的行为是非确定性的——同样的任务，Agent 可能每次做出不同的选择。

## 主流 Agent 评估基准

### SWE-bench：软件工程能力

SWE-bench 是评估 Agent 编程能力的最重要基准之一。它来自真实的 GitHub issues——从流行 Python 仓库中提取 issue，要求 Agent 修复对应的 bug。

| 维度 | 说明 |
|------|------|
| 任务来源 | 12 个流行 Python 仓库的真实 GitHub issues (Django, Flask, matplotlib, sympy 等) |
| 任务数量 | 2,294 个 bug 修复任务 |
| 评估方式 | 代码 patch 是否通过仓库的单元测试 |
| 难度 | 高——需要理解大规模代码库，定位 bug，生成修复 |
| 时间限制 | 通常无严格限制，但资源消耗大 |
| 主要指标 | Resolved rate (解决的 issue 比例) |

**SWE-bench 的分数解读**：

| 模型/Agent | 发布时间 | Resolved Rate | 方法 |
|-----------|---------|--------------|------|
| Devin (Cognition) | 2024.03 | 13.86% | 商业 Agent |
| SWE-Agent (Princeton) | 2024.04 | 12.47% | 开源 Agent |
| Claude 3.5 Sonnet + Aider | 2024.06 | 26.3% | LLM + 工具 |
| GPT-4o + SWE-Agent | 2024.05 | 18.7% | LLM + 工具 |
| Claude Opus 4.5 + Agent | 2025.06 | 49.3% | 最新 LLM + Agent |
| GPT-5.5 + Agent | 2025.06 | 52.1% | 最新 LLM + Agent |

SWE-bench 的分数在 2024-2026 年间快速提升，但也引发争议：分数提升是因为 Agent 能力真的变强了，还是因为模型训练数据中包含了这些仓库的代码？

**SWE-bench Verified**：2024 年推出的改进版，从 2,294 个任务中筛选出 500 个经过人工验证的"干净"任务，排除了描述不清、测试不完整等问题。

### GAIA：通用 AI 助手能力

GAIA 由 Meta 和 Hugging Face 联合发布，评估 Agent 作为"通用助手"的能力。

| 维度 | 说明 |
|------|------|
| 任务类型 | 网页搜索、推理、多模态理解、工具使用 |
| 任务数量 | 466 个问题 |
| 难度分级 | Level 1 (简单) 到 Level 3 (困难) |
| 评估方式 | 答案是否精确匹配（非选择题，需要生成精确答案） |
| 设计理念 | 对人类来说简单，对 AI 来说困难 |
| 人类基准 | 约 92% (Level 1 接近 100%) |

**GAIA 的独特设计**：GAIA 的问题刻意设计为"对人类来说简单，对 AI 来说困难"。例如：

- "在 2023 年 Nature 杂志的某篇文章中，图 3 的 x 轴最大值是多少？"——需要搜索、阅读、理解图表
- "找到这个 YouTube 视频，在 3:15 秒时屏幕上显示的是什么品牌？"——需要多模态理解

这些问题对人不难，但需要 Agent 具备搜索、浏览、推理、多模态理解等多种能力的组合。

| 模型 | GAIA Score (2024) | GAIA Score (2025) |
|------|------------------|------------------|
| GPT-4 + Plugins | 15% | — |
| GPT-4o + Agent | 38% | — |
| Claude Opus 4.5 + Agent | — | 56% |
| GPT-5.5 + Agent | — | 62% |
| Human | 92% | 92% |

到 2026 年，最好的 Agent 在 GAIA 上仍远低于人类水平，说明通用 AI 助手的能力还有很大提升空间。

### AgentBench：多维度 Agent 能力

AgentBench 由清华大学和智谱 AI 发布，是第一个系统化的 Agent 评估基准。

| 维度 | 说明 |
|------|------|
| 环境数量 | 8 个不同环境 |
| 任务类型 | 操作系统、数据库、知识图谱、网页购物、卡牌游戏、横向思维谜题、家政、网页浏览 |
| 评估方式 | 每个环境有独立的成功指标 |
| 设计理念 | 评估 Agent 在多样化环境中的泛化能力 |

**AgentBench 的 8 个环境**：

| 环境 | 任务示例 | 评估的能力 |
|------|---------|-----------|
| OS | 在 Linux 终端中完成操作任务 | 命令行使用、系统操作 |
| Database | 用 SQL 查询数据库 | 结构化查询 |
| KG | 知识图谱推理 | 关系推理 |
| Web Shopping | 在模拟电商网站购物 | 网页浏览、决策 |
| Card Game | 玩卡牌游戏 | 策略规划 |
| Lateral Thinking | 横向思维谜题 | 创造性推理 |
| Housekeeping | 家具摆放 | 空间推理 |
| Web Browsing | 网页信息检索 | 信息检索、理解 |

### WebArena：网页 Agent 评估

WebArena 评估 Agent 在真实网页环境中的操作能力。

| 维度 | 说明 |
|------|------|
| 环境 | 4 个模拟的真实网站（电商、社交论坛、GitLab、CMS） |
| 任务数量 | 812 个 |
| 任务类型 | 信息检索、站点导航、内容操作、配置修改 |
| 评估方式 | 功能性正确性（functional correctness） |
| 关键挑战 | 网页的复杂性和动态性 |

### tau-bench：工具使用可靠性

tau-bench (2024-2025) 专注于评估 Agent 在工具使用中的**可靠性**——Agent 是否能正确调用工具、处理错误、在多步交互中保持一致性。

| 维度 | 说明 |
|------|------|
| 领域 | 航空订票、零售客服 |
| 评估重点 | 工具调用的正确性、对话状态管理、策略遵守 |
| 独特之处 | 关注 Agent 的"可靠性"而非"聪明程度" |

### OSWorld：操作系统 Agent

OSWorld 评估 Agent 在真实操作系统（Ubuntu, Windows, macOS）中的操作能力。

| 维度 | 说明 |
|------|------|
| 环境 | 真实虚拟机中的 Ubuntu/Windows/macOS |
| 任务数量 | 369 个 |
| 任务类型 | 文件操作、软件安装、系统配置、多应用协调 |
| 评估方式 | 基于状态的评估（检查系统状态是否达到预期） |
| 特点 | 需要 Agent 操作真实 GUI 界面 |

### WorkArena：企业工作流 Agent

WorkArena 评估 Agent 在企业工作流（ServiceNow 平台）中的表现。

| 维度 | 说明 |
|------|------|
| 环境 | ServiceNow 企业平台 |
| 任务类型 | 工单管理、知识库搜索、流程自动化 |
| 评估重点 | 企业级 Agent 的实际工作能力 |

## 全面对比：Agent 评估基准

| 基准 | 发布时间 | 任务数 | 核心能力 | 评估方式 | 人类天花板 | 2026 最佳 Agent | 主要局限 |
|------|---------|--------|---------|---------|-----------|--------------|---------|
| SWE-bench | 2023 | 2,294 | 软件工程 | 单元测试通过 | ~100% | ~52% | 仅限 Python 仓库 |
| GAIA | 2023 | 466 | 通用助手 | 精确答案匹配 | 92% | ~62% | 任务数量少 |
| AgentBench | 2023 | 8环境 | 多维度 | 各环境独立 | 高 | 中 | 模拟环境不真实 |
| WebArena | 2024 | 812 | 网页操作 | 功能性正确 | 高 | 中 | 仅限 4 个网站 |
| tau-bench | 2024 | 多领域 | 工具可靠性 | 对话+状态 | 高 | 中高 | 仅限 2 个领域 |
| OSWorld | 2024 | 369 | 操作系统 | 状态检查 | 高 | 低 | 环境搭建复杂 |
| WorkArena | 2024 | 多任务 | 企业工作流 | 任务完成 | 高 | 中 | 平台特定 |

## 2026 年：Agent 评估的挑战

### 数据污染

和 LLM 评估一样，Agent 评估基准也面临数据污染问题。当 Agent 的训练数据中包含了 SWE-bench 的 issue 和解决方案，分数就失去了参考价值。业界正在推动"动态评估"——任务不断更新，且评估环境保持封闭。

### 评估成本

Agent 评估的成本远高于 LLM 评估。运行一次 SWE-bench 的完整评估可能需要数千美元的 API 调用费用和数天的时间。这限制了小团队和学术界的参与。

### 真实 vs 模拟

模拟环境（WebArena, AgentBench）的成本低但不够真实。真实环境（SWE-bench 的真实 GitHub 仓库、OSWorld 的真实虚拟机）的真实性高但成本更高、更难复现。

### 过程 vs 结果

目前的评估基准大多只看"结果"（任务是否完成），不看"过程"（Agent 是否高效、是否遵循了安全规范）。但过程质量同样重要——一个完成任务但执行了危险操作的 Agent，不应该被视为"好 Agent"。

### 评估的"Goodhart 陷阱"

当评估基准成为优化目标，Agent 开发者就会针对基准"刷分"——比如在 SWE-bench 上，Agent 可以针对特定仓库做特殊优化，而不提升通用能力。这就是 Goodhart 定律的体现：当一个指标成为目标，它就不再是一个好指标。

## 相关笔记

- [[Ch14 Agent 工作原理]] — Agent 的工作机制与架构
- [[概念-LLM评估]] — LLM 通用评估方法
- [[Ch16 多 Agent 协作]] — 多 Agent 系统的评估
- [[概念-Agent原理与ReAct]] — Agent 的 ReAct 推理模式
- [[概念-ToolUse]] — 工具调用能力
- [[概念-AgenticWorkflow]] — Agent 工作流设计

## 来源

- Jimenez et al., "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" (ICLR 2024) — https://arxiv.org/abs/2310.06770
- Mialon et al., "GAIA: A Benchmark for General AI Assistants" (ICLR 2024) — https://arxiv.org/abs/2311.12983
- Liu et al., "AgentBench: Evaluating LLMs as Agents" (ICLR 2024) — https://arxiv.org/abs/2308.03688
- Zhou et al., "WebArena: A Realistic Web Environment for Building Autonomous Agents" (ICLR 2024) — https://arxiv.org/abs/2307.13854
- Yao et al., "tau-bench: A Benchmark for Tool-Agent-User Interaction" (2024) — https://arxiv.org/abs/2406.12045
- Xie et al., "OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments" (2024) — https://arxiv.org/abs/2404.07972
- SWE-bench Official — https://www.swebench.com/