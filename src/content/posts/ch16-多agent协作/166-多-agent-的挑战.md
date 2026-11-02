---
title: "16.6 多 Agent 的挑战"
description: "多 Agent 不是\"越多越好\"。每增加一个 Agent，就引入新的问题： 通信开销（Communication Overhead）：Agent 越多，通信越慢。3 个 Agent 的辩论模式，每轮需要 3 次消息传递；5 个 Agent 的层级模式，总管需要和 4 个下属逐一沟"
pubDate: 2026-06-30
updatedDate: 2026-07-02
category: "Ch16 多Agent协作"
tags: ["智能体", "多智能体"]
aliases: ["多 Agent 的挑战", "16.6 多 Agent 的挑战"]
---
多 Agent 不是"越多越好"。每增加一个 Agent，就引入新的问题：

**通信开销（Communication Overhead）**：Agent 越多，通信越慢。3 个 Agent 的辩论模式，每轮需要 3 次消息传递；5 个 Agent 的层级模式，总管需要和 4 个下属逐一沟通。通信开销随 Agent 数量呈 O(n^2) 增长（最坏情况）。2026 年的经验法则：超过 7 个 Agent 时，协调成本超过分工收益。

**错误传播（Error Propagation）**：流水线模式下，Agent 1 的小错误，经过 Agent 2、Agent 3 的加工，可能变成大错误。Agent 1 搜到一篇不靠谱的文章，Agent 2 基于这篇文章做了分析，Agent 3 基于分析写了报告——整条链都错了。缓解：每个 Agent 输出时附带置信度评分，下游 Agent 对低置信度输入做额外验证。

**协调复杂度（Coordination Complexity）**：谁来决定谁做什么？总管 Agent 是单点故障——总管出错，全盘皆输。去中心化协调（没有总管，Agent 自己协商）又容易陷入"谁都觉得自己该做，谁都不做"的僵局。2026 年的折中方案：总管负责宏观调度，具体执行由 Agent 自主决定。

**幻觉放大（Hallucination Amplification）**：单个 Agent 的幻觉，在多 Agent 系统中可能被放大。Agent A 编造了一个"事实"，Agent B 在辩论中引用了这个"事实"，Agent C 又在投票中确认了这个"事实"——三个 Agent 互相强化了一个错误。这是多 Agent 系统特有的风险，单 Agent 反而不存在。缓解：每个 Agent 都标注信息来源，审查 Agent 专门做事实核查。

**成本叠加（Cost Amplification）**：多 Agent 的 API 调用成本是单 Agent 的 N 倍。3 个 Agent 的辩论模式，每轮辩论至少调用 3 次 LLM；5 轮辩论就是 15 次。实际成本可能是单 Agent 的 5-10 倍。2026 年的优化策略：非关键 Agent 用小模型（如 Claude Haiku），只有核心 Agent 用大模型（如 Claude Sonnet）。

---

> ← 上一节：[[16.5 Agent 间通信]] ｜ 下一节：[[16.8 多 Agent 实战案例]] →
