---
title: "项目四：用 LoRA 微调一个模型"
description: "用 Unsloth（一个 2-5 倍加速的微调工具）在你的数据上微调一个模型。让它学会用古文风格回答问题。"
pubDate: 2026-07-01
updatedDate: 2026-07-02
category: "Ch11 模型微调"
tags: ["项目", "微调"]
---
> 45 分钟。需要一张 8GB 以上显存的显卡。用你自己的数据教 AI 学会新风格。

## 你要做什么

用 Unsloth（一个 2-5 倍加速的微调工具）在你的数据上微调一个模型。让它学会用古文风格回答问题。

## 前置准备

```bash
pip install unsloth
pip install xformers trl peft accelerate bitsandbytes
```

## 第一步：准备数据

创建一个 `data.jsonl` 文件：

```json
{"instruction": "用古文解释什么是AI", "output": "人工智能者，以机器仿人之智慧也。夫机器本无思，然以算法授之，使之能学，能辨，能决，此谓智也。"}
{"instruction": "用古文写一封请假信", "output": "大人钧鉴：属下偶感风寒，体有不适，恐难赴公。伏乞恩准告假一日，以资调养。属下谨呈。"}
{"instruction": "用古文介绍自己", "output": "吾乃一介书生，好读书，不求甚解。每有余暇，辄以琴书自娱。性喜静，不慕荣利。"}
{"instruction": "用古文劝人不要熬夜", "output": "夜半不寐，大伤元气。阳气衰则百病生，阴气盛则精神萎。愿君惜身，早卧早起。"}
{"instruction": "用古文夸人聪明", "output": "君之才智，如悬河泻水，注而不竭。闻一知十，触类旁通，诚当世之奇才也。"}
```

10-20 条就够了。数据越多，效果越好。

## 第二步：写训练代码

创建 `train.py`：

```python
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
import torch

# 加载模型（4-bit 量化，省显存）
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen3.7-7B",
    max_seq_length=2048,
    load_in_4bit=True,
)

# 添加 LoRA 适配器
model = FastLanguageModel.get_peft_model(
    model,
    r=16,  # LoRA 秩
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_alpha=16,
)

# 加载你的数据
dataset = load_dataset("json", data_files="data.jsonl", split="train")

def format_example(example):
    return f"""### 指令
{example['instruction']}

### 回答
{example['output']}"""

# 训练
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    formatting_func=format_example,
    max_seq_length=512,
    args={
        "output_dir": "./lora_output",
        "per_device_train_batch_size": 2,
        "num_train_epochs": 3,
        "learning_rate": 2e-4,
        "save_steps": 50,
    },
)
trainer.train()
model.save_pretrained("./ancient_chinese_lora")
print("完成！LoRA 模型保存在 ./ancient_chinese_lora")
```

## 第三步：运行

```bash
python train.py
```

等待 10-20 分钟（取决于你的显卡）。

## 第四步：测试

训练完成后，加载模型试试：

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen3.7-7B",
    max_seq_length=2048,
    load_in_4bit=True,
)
model.load_adapter("./ancient_chinese_lora")

# 测试
inputs = tokenizer("### 指令\n用古文写一封感谢信\n\n### 回答\n", return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=200)
print(tokenizer.decode(outputs[0]))
```

## 你刚才做了什么

1. **加载了一个 7B 模型**（Qwen 3.7，4-bit 量化节省显存）
2. **加了 LoRA 适配器**（只在注意力层加小补丁，不改变原模型）
3. **用自己的数据训练**（10-20 条古文示例）
4. **保存和加载 LoRA 权重**（只有几十 MB，原模型不变）

这就是 [[深挖-LoRA微调]] 里的 r=16、target_modules、4-bit 量化——不再是抽象概念了。

## 改进方向

- 加更多数据（50-100 条），效果会更好
- 调大 r=32，LoRA 容量更大但参数更多
- 换 `target_modules` 加上 FFN 层，微调效果更强
- 试试 QLoRA：把 `load_in_4bit=True` 就是 QLoRA

## 相关笔记

- [[深挖-LoRA微调]] — 理解 r、alpha、target_modules 的含义
- [[Ch11 模型微调]] — SFT + LoRA 的标准流程
- [[深挖-模型量化]] — 4-bit 量化是什么

## 来源

- Unsloth, https://github.com/unslothai/unsloth
- Hu et al., LoRA, 2021
- Qwen 3.7, Alibaba
