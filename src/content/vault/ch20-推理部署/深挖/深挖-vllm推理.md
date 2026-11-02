---
title: "vLLM 推理引擎（深挖）"
description: "Ch20 模型推理部署 提到 vLLM 是服务器推理的首选。这篇解释它为什么比普通方案快几十倍——两个核心技术：PagedAttention 和连续批处理。"
date: 2026-06-30
updated: 2026-07-01
category: "Ch20 推理部署"
tags: ["推理", "推理引擎"]
prerequisites: "Ch20 模型推理部署"
source: "笔记/Ch20 推理部署/深挖/深挖-vLLM推理.md"
---
> 这篇是进阶内容，涉及服务器和显卡的技术细节。如果你刚接触 AI，先读 [[Ch20 模型推理部署]] 了解基本概念。

[[Ch20 模型推理部署]] 提到 vLLM 是服务器推理的首选。这篇解释它为什么比普通方案快几十倍——两个核心技术：PagedAttention 和连续批处理。

## 问题：显存碎片化

传统的推理引擎（包括早期的 vLLM）有一个严重问题——KV 缓存（Key-Value Cache）的内存管理像 C 语言的 `malloc`：

1. 为每个请求分配一块连续的显存放 KV 缓存
2. 请求处理完，释放这块显存
3. 新请求进来，再分配一块

问题：不同的请求长度不同——短请求要 100MB，长请求要 2GB。频繁分配和释放导致显存碎片化——总空闲有 10GB，但没有一块连续 2GB 的。大请求被拒绝，显存白白浪费。

结果：显存利用率不到 30%。70% 的显存空闲，但用不了。

## PagedAttention：把显存当虚拟内存

vLLM 的解决方案——**把 KV 缓存分成固定大小的"页"（Page），类似操作系统的虚拟内存。**

- 每个 page 大小固定（比如 16 个 token）
- 一个请求的 KV 缓存不要求连续的显存——可以由分散的 page 拼成
- 新请求进来时，从空闲 page 池里拿 page，不要求连续

效果：显存利用率从 30% 飙升到 90% 以上 ^[Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention", 2023, https://arxiv.org/abs/2309.06180]。

打个比方：传统方式像停车场——每辆车必须停在一起，导致很多空位用不了。PagedAttention 像立体车库——每辆车可以停在不同的格子里，所有格子都能用。

## 连续批处理：不让 GPU 闲下来

传统推理引擎的批处理是"静态批处理"——凑够一批请求，一起处理。处理完，等下一批凑够。

问题：不同请求的长度不同。一个短请求 0.1 秒就处理完了，但得等到同批次的长请求（2 秒）处理完，才能开始下一批。GPU 大部分时间在等。

vLLM 的"连续批处理"——**一个请求处理完，立刻从队列里拉一个新请求进来，不需要等整批完成。**

效果：GPU 利用率从 50% 提升到接近 100%。没有等待时间 ^[vLLM GitHub, Continuous Batching]。

## 性能对比

| | llama.cpp | vLLM |
|---|---|---|
| 单请求延迟 | 快（CPU 优化） | 快（GPU 优化） |
| 并发吞吐量 | 低 | 极高（100+ QPS） |
| 显存利用率 | 低 | 极高（90%+） |
| 适用场景 | 个人使用 | 生产 API 服务 |
| 硬件要求 | CPU/弱 GPU | 高性能 GPU |

一个 70B 模型，8 张 A100 显卡：
- llama.cpp：5-10 并发流畅，20 并发开始卡
- vLLM：100+ 并发流畅，200 并发仍能接受

## vLLM 的局限

1. **只支持 GPU。** 没有 CPU 后端。想在 MacBook 上跑？只能用 llama.cpp 或 Ollama
2. **量化支持有限。** 支持 AWQ 和 GPTQ，但不支持 GGUF——后者是 llama.cpp 的专属格式
3. **模型支持。** 不是所有模型都能在 vLLM 上跑。需要模型架构被 vLLM 支持。主流模型（Llama、Qwen、Mistral、Gemma）都支持，但小众模型可能不行

## 实践：启动一个 vLLM 服务

```bash
# 启动 API 服务（兼容 OpenAI API 格式）
vllm serve meta-llama/Llama-4.1-8B \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.9
```

然后就可以像调用 OpenAI API 一样调用：

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1")
response = client.chat.completions.create(
    model="meta-llama/Llama-4.1-8B",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## 2026 年 vLLM 生态

- **vLLM + AWQ**：生产环境标准配置
- **vLLM + LoRA 热加载**：不需要重启服务就能切换 LoRA 适配器
- **vLLM + 推测解码**：用小模型预测，大模型验证，延迟降低 2-3 倍

## 相关笔记

- [[Ch20 模型推理部署]] — 推理引擎全景
- [[深挖-模型量化]] — AWQ 是 vLLM 的最佳搭档
- [[深挖-LoRA微调]] — vLLM 支持 LoRA 热加载

## 来源

- Kwon et al., "PagedAttention", 2023, https://arxiv.org/abs/2309.06180
- vLLM GitHub, https://github.com/vllm-project/vllm
