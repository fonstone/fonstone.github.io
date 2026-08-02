---
title: "记忆与检索"
description: "智能体记忆系统设计，RAG 检索增强生成，向量数据库与知识存储。"
date: "2026-07-12"
order: 8
tags: ["记忆", "RAG", "向量数据库", "检索", "Embedding"]
est_time: "65 分钟"
---
# 第八章 记忆与检索

在前面的章节中，我们构建了HelloAgents框架的基础架构，实现了多种智能体范式和工具系统。不过，我们的框架还缺少一个关键能力：<strong>记忆</strong>。如果智能体无法记住之前的交互内容，也无法从历史经验中学习，那么在连续对话或复杂任务中，其表现将受到极大限制。

本章将在第七章构建的框架基础上，为HelloAgents增加两个核心能力：<strong>记忆系统（Memory System）</strong>和<strong>检索增强生成（Retrieval-Augmented Generation, RAG）</strong>。我们将采用"框架扩展 + 知识科普"的方式，在构建过程中深入理解Memory和RAG的理论基础，最终实现一个具有完整记忆和知识检索能力的智能体系统。


## 8.1 从认知科学到智能体记忆

### 8.1.1 人类记忆系统的启发

在构建智能体的记忆系统之前，让我们先从认知科学的角度理解人类是如何处理和存储信息的。人类记忆是一个多层级的认知系统，它不仅能存储信息，还能根据重要性、时间和上下文对信息进行分类和整理。认知心理学为理解记忆的结构和过程提供了经典的理论框架<sup>[1]</sup>，如图8.1所示。



![](/images/courses/8-figures/8-1.png)

*图 8.1 人类记忆系统的层次结构*



根据认知心理学的研究，人类记忆可以分为以下几个层次：

1. <strong>感觉记忆（Sensory Memory）</strong>：持续时间极短（0.5-3秒），容量巨大，负责暂时保存感官接收到的所有信息
2. <strong>工作记忆（Working Memory）</strong>：持续时间短（15-30秒），容量有限（7±2个项目），负责当前任务的信息处理
3. <strong>长期记忆（Long-term Memory）</strong>：持续时间长（可达终生），容量几乎无限，进一步分为：
   - <strong>程序性记忆</strong>：技能和习惯（如骑自行车）
   - <strong>陈述性记忆</strong>：可以用语言表达的知识，又分为：
     - <strong>语义记忆</strong>：一般知识和概念（如"巴黎是法国首都"）
     - <strong>情景记忆</strong>：个人经历和事件（如"昨天的会议内容"）

### 8.1.2 为何智能体需要记忆与RAG

借鉴人类记忆系统的设计，我们可以理解为什么智能体也需要类似的记忆能力。人类智能的一个重要特征就是能够记住过去的经历，从中学习，并将这些经验应用到新的情况中。同样，一个真正智能的智能体也需要具备记忆能力。对于基于LLM的智能体而言，通常面临两个根本性局限：<strong>对话状态的遗忘</strong>和<strong>内置知识的局限</strong>。

（1）局限一：无状态导致的对话遗忘

当前的大语言模型虽然强大，但设计上是<strong>无状态的</strong>。这意味着，每一次用户请求（或API调用）都是一次独立的、无关联的计算。模型本身不会自动“记住”上一次对话的内容。这带来了几个问题：

1. <strong>上下文丢失</strong>：在长对话中，早期的重要信息可能会因为上下文窗口限制而丢失
2. <strong>个性化缺失</strong>：Agent无法记住用户的偏好、习惯或特定需求
3. <strong>学习能力受限</strong>：无法从过往的成功或失败经验中学习改进
4. <strong>一致性问题</strong>：在多轮对话中可能出现前后矛盾的回答

让我们通过一个具体例子来理解这个问题：

```python
# 第七章的Agent使用方式
from hello_agents import SimpleAgent, HelloAgentsLLM

agent = SimpleAgent(name="学习助手", llm=HelloAgentsLLM())

# 第一次对话
response1 = agent.run("我叫张三，正在学习Python，目前掌握了基础语法")
print(response1)  # "很好！Python基础语法是编程的重要基础..."
 
# 第二次对话（新的会话，例如重启程序后重新创建Agent）
agent = SimpleAgent(name="学习助手", llm=HelloAgentsLLM())
response2 = agent.run("你还记得我的学习进度吗？")
print(response2)  # "抱歉，我不知道您的学习进度..."
```

需要注意的是，第七章中的 `SimpleAgent` 会在同一个实例的 `_history` 中暂存当前对话，因此同一进程、同一实例内的连续对话可以携带最近上下文。但这种历史只是临时消息列表，不会跨会话持久化，也不能进行长期检索、遗忘和整合。

要解决这个问题，我们的框架需要引入记忆系统。

（2）局限二：模型内置知识的局限性

除了遗忘对话历史，LLM 的另一个核心局限在于其知识是<strong>静态的、有限的</strong>。这些知识完全来自于它的训练数据，并因此带来一系列问题：

1. <strong>知识时效性</strong>：大模型的训练数据有时间截止点，无法获取最新信息
2. <strong>专业领域知识</strong>：通用模型在特定领域的深度知识可能不足
3. <strong>事实准确性</strong>：通过检索验证，减少模型的幻觉问题
4. <strong>可解释性</strong>：提供信息来源，增强回答的可信度

为了克服这一局限，RAG技术应运而生。它的核心思想是在模型生成回答之前，先从一个外部知识库（如文档、数据库、API）中检索出最相关的信息，并将这些信息作为上下文一同提供给模型。

### 8.1.3 记忆与RAG系统架构设计

基于第七章建立的框架基础和认知科学的启发，我们设计了一个分层的记忆与RAG系统架构，如图8.2所示。这个架构不仅借鉴了人类记忆系统的层次结构，还充分考虑了工程实现的可扩展性。在实现上，我们将记忆和RAG设计为两个独立的工具：`memory_tool`负责存储和维护对话过程中的交互信息，`rag_tool`则负责从用户提供的知识库中检索相关信息作为上下文，并可将重要的检索结果自动存储到记忆系统中。


![](/images/courses/8-figures/8-2.png)

*图 8.2 HelloAgents记忆与RAG系统整体架构*



记忆系统采用了四层架构设计：

```
HelloAgents记忆系统
├── 基础设施层 (Infrastructure Layer)
│   ├── MemoryManager - 记忆管理器（统一调度和协调）
│   ├── MemoryItem - 记忆数据结构（标准化记忆项）
│   ├── MemoryConfig - 配置管理（系统参数设置）
│   └── BaseMemory - 记忆基类（通用接口定义）
├── 记忆类型层 (Memory Types Layer)
│   ├── WorkingMemory - 工作记忆（临时信息，TTL管理）
│   ├── EpisodicMemory - 情景记忆（具体事件，时间序列）
│   ├── SemanticMemory - 语义记忆（抽象知识，图谱关系）
│   └── PerceptualMemory - 感知记忆（多模态数据）
├── 存储后端层 (Storage Backend Layer)
│   ├── QdrantVectorStore - 向量存储（高性能语义检索）
│   ├── Neo4jGraphStore - 图存储（知识图谱管理）
│   └── SQLiteDocumentStore - 文档存储（结构化持久化）
└── 嵌入服务层 (Embedding Service Layer)
    ├── DashScopeEmbedding - 通义千问嵌入（云端API）
    ├── LocalTransformerEmbedding - 本地嵌入（离线部署）
    └── TFIDFEmbedding - TFIDF嵌入（轻量级兜底）
```

RAG系统专注于外部知识的获取和利用：

```
HelloAgents RAG系统
├── 文档处理层 (Document Processing Layer)
│   ├── DocumentProcessor - 文档处理器（多格式解析）
│   ├── Document - 文档对象（元数据管理）
│   └── Pipeline - RAG管道（端到端处理）
├── 嵌入表示层 (Embedding Layer)
│   └── 统一嵌入接口 - 复用记忆系统的嵌入服务
├── 向量存储层 (Vector Storage Layer)
│   └── QdrantVectorStore - 向量数据库（命名空间隔离）
└── 智能问答层 (Intelligent Q&A Layer)
    ├── 多策略检索 - 向量检索 + MQE + HyDE
    ├── 上下文构建 - 智能片段合并与截断
    └── LLM增强生成 - 基于上下文的准确问答
```

### 8.1.4 本章学习目标与快速体验

让我们先看看第八章的核心学习内容：

```
hello-agents/
├── hello_agents/
│   ├── memory/                   # 记忆系统模块
│   │   ├── base.py               # 基础数据结构（MemoryItem, MemoryConfig, BaseMemory）
│   │   ├── manager.py            # 记忆管理器（统一协调调度）
│   │   ├── embedding.py          # 统一嵌入服务（DashScope/Local/TFIDF）
│   │   ├── types/                # 记忆类型实现
│   │   │   ├── working.py        # 工作记忆（TTL管理，纯内存）
│   │   │   ├── episodic.py       # 情景记忆（事件序列，SQLite+Qdrant）
│   │   │   ├── semantic.py       # 语义记忆（知识图谱，Qdrant+Neo4j）
│   │   │   └── perceptual.py     # 感知记忆（多模态，SQLite+Qdrant）
│   │   ├── storage/              # 存储后端实现
│   │   │   ├── qdrant_store.py   # Qdrant向量存储（高性能向量检索）
│   │   │   ├── neo4j_store.py    # Neo4j图存储（知识图谱管理）
│   │   │   └── document_store.py # SQLite文档存储（结构化持久化）
│   │   └── rag/                  # RAG系统
│   │       ├── pipeline.py       # RAG管道（端到端处理）
│   │       └── document.py       # 文档处理器（多格式解析）
│   └── tools/builtin/            # 扩展内置工具
│       ├── memory_tool.py        # 记忆工具（Agent记忆能力）
│       └── rag_tool.py           # RAG工具（智能问答能力）
└──
```

<strong>快速开始：安装HelloAgents框架</strong>

为了让读者能够快速体验本章的完整功能，我们提供了可直接安装的Python包。你可以通过以下命令安装本章对应的版本：

```bash
# 0.2.0版本若遇到模型不可用，查看issue#320或切换0.2.9版本进行测试
pip install "hello-agents[all]==0.2.0"
python -m spacy download zh_core_web_sm
python -m spacy download en_core_web_sm
```

除此之外，还需要在`.env`配置图数据库，向量数据库，LLM以及Embedding方案的API。在教程中向量数据库采用Qdrant，图数据库采用Neo4J，Embedding首选百炼平台，若没有API可切换为本地部署模型方案。

```bash
# ================================
# Qdrant 向量数据库配置 - 获取API密钥：https://cloud.qdrant.io/
# ================================
# 使用Qdrant云服务 (推荐)
QDRANT_URL=https://your-cluster.qdrant.tech:6333
QDRANT_API_KEY=your_qdrant_api_key_here

# 或使用本地Qdrant (需要Docker)
# QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=

# Qdrant集合配置
QDRANT_COLLECTION=hello_agents_vectors
QDRANT_VECTOR_SIZE=384
QDRANT_DISTANCE=cosine
QDRANT_TIMEOUT=30

# ================================
# Neo4j 图数据库配置 - 获取API密钥：https://neo4j.com/cloud/aura/
# ================================
# 使用Neo4j Aura云服务 (推荐)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password_here

# 或使用本地Neo4j (需要Docker)
# NEO4J_URI=bolt://localhost:7687
# NEO4J_USERNAME=neo4j
# NEO4J_PASSWORD=hello-agents-password

# Neo4j连接配置
NEO4J_DATABASE=neo4j
NEO4J_MAX_CONNECTION_LIFETIME=3600
NEO4J_MAX_CONNECTION_POOL_SIZE=50
NEO4J_CONNECTION_TIMEOUT=60

# ==========================
# 嵌入（Embedding）配置示例 - 可从阿里云控制台获取：https://dashscope.aliyun.com/
# ==========================
# - 若为空，dashscope 默认 text-embedding-v3；local 默认 sentence-transformers/all-MiniLM-L6-v2
EMBED_MODEL_TYPE=dashscope
EMBED_MODEL_NAME=
EMBED_API_KEY=
EMBED_BASE_URL=
```

本章的学习可以采用两种方式：

1. <strong>体验式学习</strong>：直接使用`pip`安装框架，运行示例代码，快速体验各种功能
2. <strong>深度学习</strong>：跟随本章内容，从零开始实现每个组件，深入理解框架的设计思想和实现细节

我们建议采用"先体验，后实现"的学习路径。在本章中，我们提供了完整的测试文件，你可以重写核心函数并运行测试，以检验你的实现是否正确。

遵循第七章确立的设计原则，我们将记忆和RAG能力封装为标准工具，而不是创建新的Agent类。在开始之前，让我们用30秒体验使用Hello-agents构建具有记忆和RAG能力的智能体！

```python
# 配置好同级文件夹下.env中的大模型API
from hello_agents import SimpleAgent, HelloAgentsLLM, ToolRegistry
from hello_agents.tools import MemoryTool, RAGTool

# 创建LLM实例
llm = HelloAgentsLLM()

# 创建Agent
agent = SimpleAgent(
    name="智能助手",
    llm=llm,
    system_prompt="你是一个有记忆和知识检索能力的AI助手"
)

# 创建工具注册表
tool_registry = ToolRegistry()

# 添加记忆工具
memory_tool = MemoryTool(user_id="user123")
tool_registry.register_tool(memory_tool)

# 添加RAG工具
rag_tool = RAGTool(knowledge_base_path="./knowledge_base")
tool_registry.register_tool(rag_tool)

# 为Agent配置工具
agent.tool_registry = tool_registry

# 开始对话
response = agent.run("你好！请记住我叫张三，我是一名Python开发者")
print(response)
```

如果一切配置完毕，可以看到以下内容。

```bash
[OK] SQLite 数据库表和索引创建完成
[OK] SQLite 文档存储初始化完成: ./memory_data\memory.db
INFO:hello_agents.memory.storage.qdrant_store:✅ 成功连接到Qdrant云服务: https://0c517275-2ad0-4442-8309-11c36dc7e811.us-east-1-1.aws.cloud.qdrant.io:6333
INFO:hello_agents.memory.storage.qdrant_store:✅ 使用现有Qdrant集合: hello_agents_vectors
INFO:hello_agents.memory.types.semantic:✅ 嵌入模型就绪，维度: 1024
INFO:hello_agents.memory.types.semantic:✅ Qdrant向量数据库初始化完成
INFO:hello_agents.memory.storage.neo4j_store:✅ 成功连接到Neo4j云服务: neo4j+s://851b3a28.databases.neo4j.io      NFO:hello_agents.memory.types.semantic:✅ Neo4j图数据库初始化完成
INFO:hello_agents.memory.storage.neo4j_store:✅ Neo4j索引创建完成
INFO:hello_agents.memory.types.semantic:✅ Neo4j图数据库初始化完成
INFO:hello_agents.memory.types.semantic:🏥 数据库健康状态: Qdrant=✅, Neo4j=✅
INFO:hello_agents.memory.types.semantic:✅ 加载中文spaCy模型: zh_core_web_sm
INFO:hello_agents.memory.types.semantic:✅ 加载英文spaCy模型: en_core_web_sm
INFO:hello_agents.memory.types.semantic:📚 可用语言模型: 中文, 英文
INFO:hello_agents.memory.types.semantic:增强语义记忆初始化完成（使用Qdrant+Neo4j专业数据库）
INFO:hello_agents.memory.manager:MemoryManager初始化完成，启用记忆类型: ['working', 'episodic', 'semantic']      
✅ 工具 'memory' 已注册。
INFO:hello_agents.memory.storage.qdrant_store:✅ 成功连接到Qdrant云服务: https://0c517275-2ad0-4442-8309-11c36dc7eNFO:hello_agents.memory.storage.qdrant_store:✅ 使用现有Qdrant集合: rag_knowledge_base
811.us-east-1-1.aws.cloud.qdrant.io:6333
INFO:hello_agents.memory.storage.qdrant_store:✅ 使用现有Qdrant集合: rag_knowledge_base
✅ RAG工具初始化成功: namespace=default, collection=rag_knowledge_base
✅ 工具 'rag' 已注册。
你好，张三！很高兴认识你。作为一名Python开发者，你一定对编程很有热情。如果你有任何技术问题或者需要讨论Python相关 
的话题，随时可以找我。我会尽力帮助你。有什么我现在就能帮到你的吗？
```

## 8.2 记忆系统：让智能体拥有记忆

### 8.2.1 记忆系统的工作流程

在进入代码实现阶段前，我们需要先定义记忆系统的工作流程。该流程参考了认知科学中的记忆模型，并将每个认知阶段映射为具体的技术组件和操作。理解这一映射关系，有助于我们后续的代码实现。



![](/images/courses/8-figures/8-3.png)

*图 8.3 记忆形成的认知过程*



如图8.3所示，根据认知科学的研究，人类记忆的形成经历以下几个阶段：


1. <strong>编码（Encoding）</strong>：将感知到的信息转换为可存储的形式
2. <strong>存储（Storage）</strong>：将编码后的信息保存在记忆系统中
3. <strong>检索（Retrieval）</strong>：根据需要从记忆中提取相关信息
4. <strong>整合（Consolidation）</strong>：将短期记忆转化为长期记忆
5. <strong>遗忘（Forgetting）</strong>：删除不重要或过时的信息

基于该启发，我们为 HelloAgents 设计了一套完整的记忆系统。其核心思想是模仿人类大脑处理不同类型信息的方式，将记忆划分为多个专门的模块，并建立一套智能化的管理机制。图8.4详细展示了这套系统的工作流程，包括记忆的添加、检索、整合和遗忘等关键环节。



![](/images/courses/8-figures/8-4.png)

*图 8.4 HelloAgents记忆系统的完整工作流程*



我们的记忆系统由四种不同类型的记忆模块构成，每种模块都针对特定的应用场景和生命周期进行了优化：

首先是<strong>工作记忆 (Working Memory)</strong>，它扮演着智能体“短期记忆”的角色，主要用于存储当前对话的上下文信息。为确保高速访问和响应，其容量被有意限制（例如，默认50条），并且生命周期与单个会话绑定，会话结束后便会自动清理。

其次是<strong>情景记忆 (Episodic Memory)</strong>，它负责长期存储具体的交互事件和智能体的学习经历。与工作记忆不同，情景记忆包含了丰富的上下文信息，并支持按时间序列或主题进行回顾式检索，是智能体“复盘”和学习过往经验的基础。

与具体事件相对应的是<strong>语义记忆 (Semantic Memory)</strong>，它存储的是更为抽象的知识、概念和规则。例如，通过对话了解到的用户偏好、需要长期遵守的指令或领域知识点，都适合存放在这里。这部分记忆具有高度的持久性和重要性，是智能体形成“知识体系”和进行关联推理的核心。

最后，为了与日益丰富的多媒体交互，我们引入了<strong>感知记忆 (Perceptual Memory)</strong>。该模块专门处理图像、音频等多模态信息，并支持跨模态检索。其生命周期会根据信息的重要性和可用存储空间进行动态管理。

### 8.2.2 快速体验：30秒上手记忆功能

在深入实现细节之前，让我们先快速体验一下记忆系统的基本功能：

```python
from hello_agents import SimpleAgent, HelloAgentsLLM, ToolRegistry
from hello_agents.tools import MemoryTool

# 创建具有记忆能力的Agent
llm = HelloAgentsLLM()
agent = SimpleAgent(name="记忆助手", llm=llm)

# 创建记忆工具
memory_tool = MemoryTool(user_id="user123")
tool_registry = ToolRegistry()
tool_registry.register_tool(memory_tool)
agent.tool_registry = tool_registry
 
# 体验记忆功能
print("=== 添加多个记忆 ===")

# 添加第一个记忆
result1 = memory_tool.execute("add", content="用户张三是一名Python开发者，专注于机器学习和数据分析", memory_type="semantic", importance=0.8)
print(f"记忆1: {result1}")

# 添加第二个记忆
result2 = memory_tool.execute("add", content="李四是前端工程师，擅长React和Vue.js开发", memory_type="semantic", importance=0.7)
print(f"记忆2: {result2}")

# 添加第三个记忆
result3 = memory_tool.execute("add", content="王五是产品经理，负责用户体验设计和需求分析", memory_type="semantic", importance=0.6)
print(f"记忆3: {result3}")

print("\n=== 搜索特定记忆 ===")
# 搜索前端相关的记忆
print("🔍 搜索 '前端工程师':")
result = memory_tool.execute("search", query="前端工程师", limit=3)
print(result)

print("\n=== 记忆摘要 ===")
result = memory_tool.execute("summary")
print(result)
```

### 8.2.3 MemoryTool详解

现在让我们采用自顶向下的方式，从MemoryTool支持的具体操作开始，逐步深入到底层实现。MemoryTool作为记忆系统的统一接口，其设计遵循了"统一入口，分发处理"的架构模式：

````python
def execute(self, action: str, **kwargs) -> str:
    """执行记忆操作

    支持的操作：
    - add: 添加记忆（支持4种类型: working/episodic/semantic/perceptual）
    - search: 搜索记忆
    - summary: 获取记忆摘要
    - stats: 获取统计信息
    - update: 更新记忆
    - remove: 删除记忆
    - forget: 遗忘记忆（多种策略）
    - consolidate: 整合记忆（短期→长期）
    - clear_all: 清空所有记忆
    """

    if action == "add":
        return self._add_memory(**kwargs)
    elif action == "search":
        return self._search_memory(**kwargs)
    elif action == "summary":
        return self._get_summary(**kwargs)
    # ... 其他操作
````

这种统一的`execute`接口设计简化了Agent的调用方式，通过`action`参数指定具体操作，使用`**kwargs`允许每个操作有不同的参数需求。在这里我们会将比较重要的几个操作罗列出来：

（1）操作1：add

`add`操作是记忆系统的基础，它模拟了人类大脑将感知信息编码为记忆的过程。在实现中，我们不仅要存储记忆内容，还要为每个记忆添加丰富的上下文信息，这些信息将在后续的检索和管理中发挥重要作用。

````python
def _add_memory(
    self,
    content: str = "",
    memory_type: str = "working",
    importance: float = 0.5,
    file_path: str = None,
    modality: str = None,
    **metadata
) -> str:
    """添加记忆"""
    try:
        # 确保会话ID存在
        if self.current_session_id is None:
            self.current_session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # 感知记忆文件支持
        if memory_type == "perceptual" and file_path:
            inferred = modality or self._infer_modality(file_path)
            metadata.setdefault("modality", inferred)
            metadata.setdefault("raw_data", file_path)

        # 添加会话信息到元数据
        metadata.update({
            "session_id": self.current_session_id,
            "timestamp": datetime.now().isoformat()
        })

        memory_id = self.memory_manager.add_memory(
            content=content,
            memory_type=memory_type,
            importance=importance,
            metadata=metadata,
            auto_classify=False
        )

        return f"✅ 记忆已添加 (ID: {memory_id[:8]}...)"

    except Exception as e:
        return f"❌ 添加记忆失败: {str(e)}"
````

这里主要实现了三个关键任务：会话ID的自动管理（确保每个记忆都有明确的会话归属）、多模态数据的智能处理（自动推断文件类型并保存相关元数据）、以及上下文信息的自动补充（为每个记忆添加时间戳和会话信息）。其中，`importance`参数（默认0.5）用于标记记忆的重要程度，取值范围0.0-1.0，这个机制模拟了人类大脑对不同信息重要性的评估。这种设计让Agent能够自动区分不同时间段的对话，并为后续的检索和管理提供丰富的上下文信息。

其中，对每个记忆类型，我们提供了不同的使用示例：

```python
# 1. 工作记忆 - 临时信息，容量有限
memory_tool.execute("add",
    content="用户刚才问了关于Python函数的问题",
    memory_type="working",
    importance=0.6
)

# 2. 情景记忆 - 具体事件和经历
memory_tool.execute("add",
    content="2024年3月15日，用户张三完成了第一个Python项目",
    memory_type="episodic",
    importance=0.8,
    event_type="milestone",
    location="在线学习平台"
)

# 3. 语义记忆 - 抽象知识和概念
memory_tool.execute("add",
    content="Python是一种解释型、面向对象的编程语言",
    memory_type="semantic",
    importance=0.9,
    knowledge_type="factual"
)

# 4. 感知记忆 - 多模态信息
memory_tool.execute("add",
    content="用户上传了一张Python代码截图，包含函数定义",
    memory_type="perceptual",
    importance=0.7,
    modality="image",
    file_path="./uploads/code_screenshot.png"
)
```

（2）操作2：search

`search`操作是记忆系统的核心功能，它需要在大量记忆中快速找到与查询最相关的内容。它涉及语义理解、相关性计算和结果排序等多个环节。

````python
def _search_memory(
    self,
    query: str,
    limit: int = 5,
    memory_types: List[str] = None,
    memory_type: str = None,
    min_importance: float = 0.1
) -> str:
    """搜索记忆"""
    try:
        # 参数标准化处理
        if memory_type and not memory_types:
            memory_types = [memory_type]

        results = self.memory_manager.retrieve_memories(
            query=query,
            limit=limit,
            memory_types=memory_types,
            min_importance=min_importance
        )

        if not results:
            return f"🔍 未找到与 '{query}' 相关的记忆"

        # 格式化结果
        formatted_results = []
        formatted_results.append(f"🔍 找到 {len(results)} 条相关记忆:")

        for i, memory in enumerate(results, 1):
            memory_type_label = {
                "working": "工作记忆",
                "episodic": "情景记忆", 
                "semantic": "语义记忆",
                "perceptual": "感知记忆"
            }.get(memory.memory_type, memory.memory_type)

            content_preview = memory.content[:80] + "..." if len(memory.content) > 80 else memory.content
            formatted_results.append(
                f"{i}. [{memory_type_label}] {content_preview} (重要性: {memory.importance:.2f})"
            )

        return "\n".join(formatted_results)

    except Exception as e:
        return f"❌ 搜索记忆失败: {str(e)}"
````

搜索操作在设计上支持单数和复数两种参数形式（`memory_type`和`memory_types`），让用户以最自然的方式表达需求。其中，`min_importance`参数（默认0.1）用于过滤低质量记忆。对于搜索功能的使用，可以参考这个示例。

```python
# 基础搜索
result = memory_tool.execute("search", query="Python编程", limit=5)

# 指定记忆类型搜索
result = memory_tool.execute("search",
    query="学习进度",
    memory_type="episodic",
    limit=3
)

# 多类型搜索
result = memory_tool.execute("search",
    query="函数定义",
    memory_types=["semantic", "episodic"],
    min_importance=0.5
)
```

（3）操作3：forget

遗忘机制是最具认知科学色彩的功能，它模拟人类大脑的选择性遗忘过程，支持三种策略：基于重要性（删除不重要的记忆）、基于时间（删除过时的记忆）和基于容量（当存储接近上限时删除最不重要的记忆）。

````python
def _forget(self, strategy: str = "importance_based", threshold: float = 0.1, max_age_days: int = 30) -> str:
    """遗忘记忆（支持多种策略）"""
    try:
        count = self.memory_manager.forget_memories(
            strategy=strategy,
            threshold=threshold,
            max_age_days=max_age_days
        )
        return f"🧹 已遗忘 {count} 条记忆（策略: {strategy}）"
    except Exception as e:
        return f"❌ 遗忘记忆失败: {str(e)}"
````

<strong>三种遗忘策略的使用：</strong>

```python
# 1. 基于重要性的遗忘 - 删除重要性低于阈值的记忆
memory_tool.execute("forget",
    strategy="importance_based",
    threshold=0.2
)

# 2. 基于时间的遗忘 - 删除超过指定天数的记忆
memory_tool.execute("forget",
    strategy="time_based",
    max_age_days=30
)

# 3. 基于容量的遗忘 - 当记忆数量超限时删除最不重要的
memory_tool.execute("forget",
    strategy="capacity_based",
    threshold=0.3
)
```

（4）操作4：consolidate

````python
def _consolidate(self, from_type: str = "working", to_type: str = "episodic", importance_threshold: float = 0.7) -> str:
    """整合记忆（将重要的短期记忆提升为长期记忆）"""
    try:
        count = self.memory_manager.consolidate_memories(
            from_type=from_type,
            to_type=to_type,
            importance_threshold=importance_threshold,
        )
        return f"🔄 已整合 {count} 条记忆为长期记忆（{from_type} → {to_type}，阈值={importance_threshold}）"
    except Exception as e:
        return f"❌ 整合记忆失败: {str(e)}"
````

consolidate操作借鉴了神经科学中的记忆固化概念，模拟人类大脑将短期记忆转化为长期记忆的过程。默认设置是将重要性超过0.7的工作记忆转换为情景记忆，这个阈值确保只有真正重要的信息才会被长期保存。整个过程是自动化的，用户无需手动选择具体的记忆，系统会智能地识别符合条件的记忆并执行类型转换。

<strong>记忆整合的使用示例：</strong>

```python
# 将重要的工作记忆转为情景记忆
memory_tool.execute("consolidate",
    from_type="working",
    to_type="episodic",
    importance_threshold=0.7
)

# 将重要的情景记忆转为语义记忆
memory_tool.execute("consolidate",
    from_type="episodic",
    to_type="semantic",
    importance_threshold=0.8
)
```

通过以上几个核心操作协作，MemoryTool构建了一个完整的记忆生命周期管理体系。从记忆的创建、检索、摘要到遗忘、整合和管理，形成了一个闭环的智能记忆管理系统，让Agent真正具备了类人的记忆能力。

### 8.2.4 MemoryManager详解

理解了MemoryTool的接口设计后，让我们深入到底层实现，看看MemoryTool是如何与MemoryManager协作的。这种分层设计体现了软件工程中的关注点分离原则，MemoryTool专注于用户接口和参数处理，而MemoryManager则负责核心的记忆管理逻辑。

MemoryTool在初始化时会创建一个MemoryManager实例，并根据配置启用不同类型的记忆模块。这种设计让用户可以根据具体需求选择启用哪些记忆类型，既保证了功能的完整性，又避免了不必要的资源消耗。

````python
class MemoryTool(Tool):
    """记忆工具 - 为Agent提供记忆功能"""
    
    def __init__(
        self,
        user_id: str = "default_user",
        memory_config: MemoryConfig = None,
        memory_types: List[str] = None
    ):
        super().__init__(
            name="memory",
            description="记忆工具 - 可以存储和检索对话历史、知识和经验"
        )
        
        # 初始化记忆管理器
        self.memory_config = memory_config or MemoryConfig()
        self.memory_types = memory_types or ["working", "episodic", "semantic"]
        
        self.memory_manager = MemoryManager(
            config=self.memory_config,
            user_id=user_id,
            enable_working="working" in self.memory_types,
            enable_episodic="episodic" in self.memory_types,
            enable_semantic="semantic" in self.memory_types,
            enable_perceptual="perceptual" in self.memory_types
        )
````
MemoryManager作为记忆系统的核心协调者，负责管理不同类型的记忆模块，并提供统一的操作接口。

````python
class MemoryManager:
    """记忆管理器 - 统一的记忆操作接口"""

    def __init__(
        self,
        config: Optional[MemoryConfig] = None,
        user_id: str = "default_user",
        enable_working: bool = True,
        enable_episodic: bool = True,
        enable_semantic: bool = True,
        enable_perceptual: bool = False
    ):
        self.config = config or MemoryConfig()
        self.user_id = user_id

        # 初始化存储和检索组件
        self.store = MemoryStore(self.config)
        self.retriever = MemoryRetriever(self.store, self.config)

        # 初始化各类型记忆
        self.memory_types = {}

        if enable_working:
            self.memory_types['working'] = WorkingMemory(self.config, self.store)

        if enable_episodic:
            self.memory_types['episodic'] = EpisodicMemory(self.config, self.store)

        if enable_semantic:
            self.memory_types['semantic'] = SemanticMemory(self.config, self.store)

        if enable_perceptual:
            self.memory_types['perceptual'] = PerceptualMemory(self.config, self.store)
````
### 8.2.5 四种记忆类型

现在让我们深入了解四种记忆类型的具体实现，每种记忆类型都有其独特的特点和应用场景：

（1）工作记忆（WorkingMemory）

工作记忆是记忆系统中最活跃的部分，它负责存储当前对话会话中的临时信息。工作记忆的设计重点在于快速访问和自动清理，这种设计确保了系统的响应速度和资源效率。

工作记忆采用了纯内存存储方案，配合TTL（Time To Live）机制进行自动清理。这种设计的优势在于访问速度极快，但也意味着工作记忆的内容在系统重启后会丢失。这种特性正好符合工作记忆的定位，存储临时的、易变的信息。


````python
class WorkingMemory:
    """工作记忆实现
    特点：
    - 容量有限（默认50条）+ TTL自动清理
    - 纯内存存储，访问速度极快
    - 混合检索：TF-IDF向量化 + 关键词匹配
    """
    
    def __init__(self, config: MemoryConfig):
        self.max_capacity = config.working_memory_capacity or 50
        self.max_age_minutes = config.working_memory_ttl or 60
        self.memories = []
    
    def add(self, memory_item: MemoryItem) -> str:
        """添加工作记忆"""
        self._expire_old_memories()  # 过期清理
        
        if len(self.memories) >= self.max_capacity:
            self._remove_lowest_priority_memory()  # 容量管理
        
        self.memories.append(memory_item)
        return memory_item.id
    
    def retrieve(self, query: str, limit: int = 5, **kwargs) -> List[MemoryItem]:
        """混合检索：TF-IDF向量化 + 关键词匹配"""
        self._expire_old_memories()
        
        # 尝试TF-IDF向量检索
        vector_scores = self._try_tfidf_search(query)
        
        # 计算综合分数
        scored_memories = []
        for memory in self.memories:
            vector_score = vector_scores.get(memory.id, 0.0)
            keyword_score = self._calculate_keyword_score(query, memory.content)
            
            # 混合评分
            base_relevance = vector_score * 0.7 + keyword_score * 0.3 if vector_score > 0 else keyword_score
            time_decay = self._calculate_time_decay(memory.timestamp)
            importance_weight = 0.8 + (memory.importance * 0.4)
            
            final_score = base_relevance * time_decay * importance_weight
            if final_score > 0:
                scored_memories.append((final_score, memory))
        
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        return [memory for _, memory in scored_memories[:limit]]
````
工作记忆的检索采用了混合检索策略，首先尝试使用TF-IDF向量化进行语义检索，如果失败则回退到关键词匹配。这种设计确保了在各种环境下都能提供可靠的检索服务。评分算法结合了语义相似度、时间衰减和重要性权重，最终得分公式为：`(相似度 × 时间衰减) × (0.8 + 重要性 × 0.4)`。

（2）情景记忆（EpisodicMemory）

情景记忆负责存储具体的事件和经历，它的设计重点在于保持事件的完整性和时间序列关系。情景记忆采用了SQLite+Qdrant的混合存储方案，SQLite负责结构化数据的存储和复杂查询，Qdrant负责高效的向量检索。

````python
class EpisodicMemory:
    """情景记忆实现
    特点：
    - SQLite+Qdrant混合存储架构
    - 支持时间序列和会话级检索
    - 结构化过滤 + 语义向量检索
    """
    
    def __init__(self, config: MemoryConfig):
        self.doc_store = SQLiteDocumentStore(config.database_path)
        self.vector_store = QdrantVectorStore(config.qdrant_url, config.qdrant_api_key)
        self.embedder = create_embedding_model_with_fallback()
        self.sessions = {}  # 会话索引
    
    def add(self, memory_item: MemoryItem) -> str:
        """添加情景记忆"""
        # 创建情景对象
        episode = Episode(
            episode_id=memory_item.id,
            session_id=memory_item.metadata.get("session_id", "default"),
            timestamp=memory_item.timestamp,
            content=memory_item.content,
            context=memory_item.metadata
        )
        
        # 更新会话索引
        session_id = episode.session_id
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        self.sessions[session_id].append(episode.episode_id)
        
        # 持久化存储（SQLite + Qdrant）
        self._persist_episode(episode)
        return memory_item.id
    
    def retrieve(self, query: str, limit: int = 5, **kwargs) -> List[MemoryItem]:
        """混合检索：结构化过滤 + 语义向量检索"""
        # 1. 结构化预过滤（时间范围、重要性等）
        candidate_ids = self._structured_filter(**kwargs)
        
        # 2. 向量语义检索
        hits = self._vector_search(query, limit * 5, kwargs.get("user_id"))
        
        # 3. 综合评分与排序
        results = []
        for hit in hits:
            if self._should_include(hit, candidate_ids, kwargs):
                score = self._calculate_episode_score(hit)
                memory_item = self._create_memory_item(hit)
                results.append((score, memory_item))
        
        results.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in results[:limit]]
    
    def _calculate_episode_score(self, hit) -> float:
        """情景记忆评分算法"""
        vec_score = float(hit.get("score", 0.0))
        recency_score = self._calculate_recency(hit["metadata"]["timestamp"])
        importance = hit["metadata"].get("importance", 0.5)
        
        # 评分公式：(向量相似度 × 0.8 + 时间近因性 × 0.2) × 重要性权重
        base_relevance = vec_score * 0.8 + recency_score * 0.2
        importance_weight = 0.8 + (importance * 0.4)
        
        return base_relevance * importance_weight
````
情景记忆的检索实现展现了复杂的多因素评分机制。它不仅考虑了语义相似度，还加入了时间近因性的考量，最终通过重要性权重进行调节。评分公式为：`(向量相似度 × 0.8 + 时间近因性 × 0.2) × (0.8 + 重要性 × 0.4)`，确保检索结果既语义相关又时间相关。

（3）语义记忆（SemanticMemory）

语义记忆是记忆系统中最复杂的部分，它负责存储抽象的概念、规则和知识。语义记忆的设计重点在于知识的结构化表示和智能推理能力。语义记忆采用了Neo4j图数据库和Qdrant向量数据库的混合架构，这种设计让系统既能进行快速的语义检索，又能利用知识图谱进行复杂的关系推理。

````python
class SemanticMemory(BaseMemory):
    """语义记忆实现
    
    特点：
    - 使用HuggingFace中文预训练模型进行文本嵌入
    - 向量检索进行快速相似度匹配
    - 知识图谱存储实体和关系
    - 混合检索策略：向量+图+语义推理
    """
    
    def __init__(self, config: MemoryConfig, storage_backend=None):
        super().__init__(config, storage_backend)
        
        # 嵌入模型（统一提供）
        self.embedding_model = get_text_embedder()
        
        # 专业数据库存储
        self.vector_store = QdrantConnectionManager.get_instance(**qdrant_config)
        self.graph_store = Neo4jGraphStore(**neo4j_config)
        
        # 实体和关系缓存
        self.entities: Dict[str, Entity] = {}
        self.relations: List[Relation] = []
        
        # NLP处理器（支持中英文）
        self.nlp = self._init_nlp()
````
语义记忆的添加过程体现了知识图谱构建的完整流程。系统不仅存储记忆内容，还会自动提取实体和关系，构建结构化的知识表示：

```python
def add(self, memory_item: MemoryItem) -> str:
    """添加语义记忆"""
    # 1. 生成文本嵌入
    embedding = self.embedding_model.encode(memory_item.content)
    
    # 2. 提取实体和关系
    entities = self._extract_entities(memory_item.content)
    relations = self._extract_relations(memory_item.content, entities)
    
    # 3. 存储到Neo4j图数据库
    for entity in entities:
        self._add_entity_to_graph(entity, memory_item)
    
    for relation in relations:
        self._add_relation_to_graph(relation, memory_item)
    
    # 4. 存储到Qdrant向量数据库
    metadata = {
        "memory_id": memory_item.id,
        "entities": [e.entity_id for e in entities],
        "entity_count": len(entities),
        "relation_count": len(relations)
    }
    
    self.vector_store.add_vectors(
        vectors=[embedding.tolist()],
        metadata=[metadata],
        ids=[memory_item.id]
    )
```

语义记忆的检索实现了混合搜索策略，结合了向量检索的语义理解能力和图检索的关系推理能力：

```python
def retrieve(self, query: str, limit: int = 5, **kwargs) -> List[MemoryItem]:
    """检索语义记忆"""
    # 1. 向量检索
    vector_results = self._vector_search(query, limit * 2, user_id)
    
    # 2. 图检索
    graph_results = self._graph_search(query, limit * 2, user_id)
    
    # 3. 混合排序
    combined_results = self._combine_and_rank_results(
        vector_results, graph_results, query, limit
    )
    
    return combined_results[:limit]
```

混合排序算法采用了多因素评分机制：

```python
def _combine_and_rank_results(self, vector_results, graph_results, query, limit):
    """混合排序结果"""
    combined = {}
    
    # 合并向量和图检索结果
    for result in vector_results:
        combined[result["memory_id"]] = {
            **result,
            "vector_score": result.get("score", 0.0),
            "graph_score": 0.0
        }
    
    for result in graph_results:
        memory_id = result["memory_id"]
        if memory_id in combined:
            combined[memory_id]["graph_score"] = result.get("similarity", 0.0)
        else:
            combined[memory_id] = {
                **result,
                "vector_score": 0.0,
                "graph_score": result.get("similarity", 0.0)
            }
    
    # 计算混合分数
    for memory_id, result in combined.items():
        vector_score = result["vector_score"]
        graph_score = result["graph_score"]
        importance = result.get("importance", 0.5)
        
        # 基础相似度得分
        base_relevance = vector_score * 0.7 + graph_score * 0.3
        
        # 重要性权重 [0.8, 1.2]
        importance_weight = 0.8 + (importance * 0.4)
        
        # 最终得分：相似度 * 重要性权重
        combined_score = base_relevance * importance_weight
        result["combined_score"] = combined_score
    
    # 排序并返回
    sorted_results = sorted(
        combined.values(),
        key=lambda x: x["combined_score"],
        reverse=True
    )
    
    return sorted_results[:limit]
```

语义记忆的评分公式为：`(向量相似度 × 0.7 + 图相似度 × 0.3) × (0.8 + 重要性 × 0.4)`。这种设计的核心思想是：

- <strong>向量检索权重（0.7）</strong>：语义相似度是主要因素，确保检索结果与查询语义相关
- <strong>图检索权重（0.3）</strong>：关系推理作为补充，发现概念间的隐含关联
- <strong>重要性权重范围[0.8, 1.2]</strong>：避免重要性过度影响相似度排序，保持检索的准确性

（4）感知记忆（PerceptualMemory）

感知记忆支持文本、图像、音频等多种模态的数据存储和检索。它采用了模态分离的存储策略，为不同模态的数据创建独立的向量集合，这种设计避免了维度不匹配的问题，同时保证了检索的准确性：

````python
class PerceptualMemory(BaseMemory):
    """感知记忆实现
    
    特点：
    - 支持多模态数据（文本、图像、音频等）
    - 跨模态相似性搜索
    - 感知数据的语义理解
    - 支持内容生成和检索
    """
    
    def __init__(self, config: MemoryConfig, storage_backend=None):
        super().__init__(config, storage_backend)
        
        # 多模态编码器
        self.text_embedder = get_text_embedder()
        self._clip_model = self._init_clip_model()  # 图像编码
        self._clap_model = self._init_clap_model()  # 音频编码
        
        # 按模态分离的向量存储
        self.vector_stores = {
            "text": QdrantConnectionManager.get_instance(
                collection_name="perceptual_text",
                vector_size=self.vector_dim
            ),
            "image": QdrantConnectionManager.get_instance(
                collection_name="perceptual_image", 
                vector_size=self._image_dim
            ),
            "audio": QdrantConnectionManager.get_instance(
                collection_name="perceptual_audio",
                vector_size=self._audio_dim
            )
        }
````
感知记忆的检索支持同模态和跨模态两种模式。同模态检索利用专业的编码器进行精确匹配，而跨模态检索则需要更复杂的语义对齐机制：

```python
def retrieve(self, query: str, limit: int = 5, **kwargs) -> List[MemoryItem]:
    """检索感知记忆（可筛模态；同模态向量检索+时间/重要性融合）"""
    user_id = kwargs.get("user_id")
    target_modality = kwargs.get("target_modality")
    query_modality = kwargs.get("query_modality", target_modality or "text")
    
    # 同模态向量检索
    try:
        query_vector = self._encode_data(query, query_modality)
        store = self._get_vector_store_for_modality(target_modality or query_modality)
        
        where = {"memory_type": "perceptual"}
        if user_id:
            where["user_id"] = user_id
        if target_modality:
            where["modality"] = target_modality
        
        hits = store.search_similar(
            query_vector=query_vector,
            limit=max(limit * 5, 20),
            where=where
        )
    except Exception:
        hits = []
    
    # 融合排序（向量相似度 + 时间近因性 + 重要性权重）
    results = []
    for hit in hits:
        vector_score = float(hit.get("score", 0.0))
        recency_score = self._calculate_recency_score(hit["metadata"]["timestamp"])
        importance = hit["metadata"].get("importance", 0.5)
        
        # 评分算法
        base_relevance = vector_score * 0.8 + recency_score * 0.2
        importance_weight = 0.8 + (importance * 0.4)
        combined_score = base_relevance * importance_weight
        
        results.append((combined_score, self._create_memory_item(hit)))
    
    results.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in results[:limit]]
```

感知记忆的评分公式为：`(向量相似度 × 0.8 + 时间近因性 × 0.2) × (0.8 + 重要性 × 0.4)`。感知记忆的评分机制还支持跨模态检索，通过统一的向量空间实现文本、图像、音频等不同模态数据的语义对齐。当进行跨模态检索时，系统会自动调整评分权重，确保检索结果的多样性和准确性。此外，感知记忆中的时间近因性计算采用了指数衰减模型：

```python
def _calculate_recency_score(self, timestamp: str) -> float:
    """计算时间近因性得分"""
    try:
        memory_time = datetime.fromisoformat(timestamp)
        current_time = datetime.now()
        age_hours = (current_time - memory_time).total_seconds() / 3600
        
        # 指数衰减：24小时内保持高分，之后逐渐衰减
        decay_factor = 0.1  # 衰减系数
        recency_score = math.exp(-decay_factor * age_hours / 24)
        
        return max(0.1, recency_score)  # 最低保持0.1的基础分数
    except Exception:
        return 0.5  # 默认中等分数
```

这种时间衰减模型模拟了人类记忆中的遗忘曲线，确保了感知记忆系统能够优先检索到时间上更相关的记忆内容。

## 8.3 RAG系统：知识检索增强

### 8.3.1 RAG的基础知识

在深入HelloAgents的RAG系统实现之前，让我们先了解RAG技术的基础概念、发展历程和核心原理。由于本文内容不是以RAG为基础进行创作，为此这里只帮读者快速梳理相关概念，以便更好地理解系统设计的技术选择和创新点。

（1）什么是RAG？

检索增强生成（Retrieval-Augmented Generation，RAG）是一种结合了信息检索和文本生成的技术。它的核心思想是：在生成回答之前，先从外部知识库中检索相关信息，然后将检索到的信息作为上下文提供给大语言模型，从而生成更准确、更可靠的回答。

因此，检索增强生成可以拆分为三个词汇。<strong>检索</strong>是指从知识库中查询相关内容；<strong>增强</strong>是将检索结果融入提示词，辅助模型生成；<strong>生成</strong>则输出兼具准确性与透明度的答案。

（2）基本工作流程

一个完整的RAG应用流程主要分为两大核心环节。在<strong>数据准备阶段</strong>，系统通过<strong>数据提取</strong>、<strong>文本分割</strong>和<strong>向量化</strong>，将外部知识构建成一个可检索的数据库。随后在<strong>应用阶段</strong>，系统会响应用户的<strong>提问</strong>，从数据库中<strong>检索</strong>相关信息，将其<strong>注入Prompt</strong>，并最终驱动大语言模型<strong>生成答案</strong>。

（3）发展历程

第一阶段：朴素RAG（Naive RAG, 2020-2021）。这是RAG技术的萌芽阶段，其流程直接而简单，通常被称为“检索-读取”（Retrieve-Read）模式。<strong>检索方式</strong>：主要依赖传统的关键词匹配算法，如`TF-IDF`或`BM25`。这些方法计算词频和文档频率来评估相关性，对字面匹配效果好，但难以理解语义上的相似性。<strong>生成模式</strong>：将检索到的文档内容不加处理地直接拼接到提示词的上下文中，然后送给生成模型。

第二阶段：高级RAG（Advanced RAG, 2022-2023）。随着向量数据库和文本嵌入技术的成熟，RAG进入了快速发展阶段。研究者和开发者们在“检索”和“生成”的各个环节引入了大量优化技术。<strong>检索方式</strong>：转向基于<strong>稠密嵌入（Dense Embedding）</strong>的语义检索。通过将文本转换为高维向量，模型能够理解和匹配语义上的相似性，而不仅仅是关键词。<strong>生成模式</strong>：引入了很多优化技术，例如查询重写，文档分块，重排序等。

第三阶段：模块化RAG（Modular RAG, 2023-至今）。在高级RAG的基础上，现代RAG系统进一步向着模块化、自动化和智能化的方向发展。系统的各个部分被设计成可插拔、可组合的独立模块，以适应更多样化和复杂的应用场景。<strong>检索方式</strong>：如混合检索，多查询扩展，假设性文档嵌入等。<strong>生成模式</strong>：思维链推理，自我反思与修正等。



### 8.3.2 RAG系统工作原理

在深入实现细节之前，可以通过流程图来梳理Helloagents的RAG系统完整工作流程：



![](/images/courses/8-figures/8-5.png)

*图 8.5 RAG系统的核心工作原理*



如图8.5所示，展示了RAG系统的两个主要工作模式：
1. <strong>数据处理流程</strong>：处理和存储知识文档，在这里我们采取工具`Markitdown`，设计思路是将传入的一切外部知识源统一转化为Markdown格式进行处理。
2. <strong>查询与生成流程</strong>：根据查询检索相关信息并生成回答。

### 8.3.3 快速体验：30秒上手RAG功能

让我们先快速体验一下RAG系统的基本功能：

```python
from hello_agents import SimpleAgent, HelloAgentsLLM, ToolRegistry
from hello_agents.tools import RAGTool

# 创建具有RAG能力的Agent
llm = HelloAgentsLLM()
agent = SimpleAgent(name="知识助手", llm=llm)

# 创建RAG工具
rag_tool = RAGTool(
    knowledge_base_path="./knowledge_base",
    collection_name="test_collection",
    rag_namespace="test"
)

tool_registry = ToolRegistry()
tool_registry.register_tool(rag_tool)
agent.tool_registry = tool_registry

# 体验RAG功能
# 添加第一个知识
result1 = rag_tool.execute("add_text", 
    text="Python是一种高级编程语言，由Guido van Rossum于1991年首次发布。Python的设计哲学强调代码的可读性和简洁的语法。",
    document_id="python_intro")
print(f"知识1: {result1}")

# 添加第二个知识  
result2 = rag_tool.execute("add_text",
    text="机器学习是人工智能的一个分支，通过算法让计算机从数据中学习模式。主要包括监督学习、无监督学习和强化学习三种类型。",
    document_id="ml_basics")
print(f"知识2: {result2}")

# 添加第三个知识
result3 = rag_tool.execute("add_text",
    text="RAG（检索增强生成）是一种结合信息检索和文本生成的AI技术。它通过检索相关知识来增强大语言模型的生成能力。",
    document_id="rag_concept")
print(f"知识3: {result3}")


print("\n=== 搜索知识 ===")
result = rag_tool.execute("search",
    query="Python编程语言的历史",
    limit=3,
    min_score=0.1
)
print(result)

print("\n=== 知识库统计 ===")
result = rag_tool.execute("stats")
print(result)
```

接下来，我们将深入探讨HelloAgents RAG系统的具体实现。

### 8.3.4 RAG系统架构设计

在这一节中，我们采取与记忆系统不同的方式讲解。因为`Memory_tool`是系统性的实现，而RAG在我们的设计中被定义为一种工具，可以梳理为一条pipeline。我们的RAG系统的核心架构可以概括为"五层七步"的设计模式：

```
用户层：RAGTool统一接口
  ↓
应用层：智能问答、搜索、管理
  ↓  
处理层：文档解析、分块、向量化
  ↓
存储层：向量数据库、文档存储
  ↓
基础层：嵌入模型、LLM、数据库
```

这种分层设计的优势在于每一层都可以独立优化和替换，同时保持整体系统的稳定性。例如，可以轻松地将嵌入模型从sentence-transformers切换到百炼API，而不影响上层的业务逻辑。同样的，这些处理的流程代码是完全可复用的，也可以选取自己需要的部分放进自己的项目中。RAGTool作为RAG系统的统一入口，提供了简洁的API接口。

````python
class RAGTool(Tool):
    """RAG工具
    
    提供完整的 RAG 能力：
    - 添加多格式文档（PDF、Office、图片、音频等）
    - 智能检索与召回
    - LLM 增强问答
    - 知识库管理
    """
    
    def __init__(
        self,
        knowledge_base_path: str = "./knowledge_base",
        qdrant_url: str = None,
        qdrant_api_key: str = None,
        collection_name: str = "rag_knowledge_base",
        rag_namespace: str = "default"
    ):
        # 初始化RAG管道
        self._pipelines: Dict[str, Dict[str, Any]] = {}
        self.llm = HelloAgentsLLM()
        
        # 创建默认管道
        default_pipeline = create_rag_pipeline(
            qdrant_url=self.qdrant_url,
            qdrant_api_key=self.qdrant_api_key,
            collection_name=self.collection_name,
            rag_namespace=self.rag_namespace
        )
        self._pipelines[self.rag_namespace] = default_pipeline
````
整个处理流程如下所示：
```
任意格式文档 → MarkItDown转换 → Markdown文本 → 智能分块 → 向量化 → 存储检索
```

（1）多模态文档载入

RAG系统的核心优势之一是其强大的多模态文档处理能力。系统使用MarkItDown作为统一的文档转换引擎，支持几乎所有常见的文档格式。MarkItDown是微软开源的通用文档转换工具，它是HelloAgents RAG系统的核心组件，负责将任意格式的文档统一转换为结构化的Markdown文本。无论输入是PDF、Word、Excel、图片还是音频，最终都会转换为标准的Markdown格式，然后进入统一的分块、向量化和存储流程。

```python
def _convert_to_markdown(path: str) -> str:
    """
    Universal document reader using MarkItDown with enhanced PDF processing.
    核心功能：将任意格式文档转换为Markdown文本
    
    支持格式：
    - 文档：PDF、Word、Excel、PowerPoint
    - 图像：JPG、PNG、GIF（通过OCR）
    - 音频：MP3、WAV、M4A（通过转录）
    - 文本：TXT、CSV、JSON、XML、HTML
    - 代码：Python、JavaScript、Java等
    """
    if not os.path.exists(path):
        return ""
    
    # 对PDF文件使用增强处理
    ext = (os.path.splitext(path)[1] or '').lower()
    if ext == '.pdf':
        return _enhanced_pdf_processing(path)
    
    # 其他格式使用MarkItDown统一转换
    md_instance = _get_markitdown_instance()
    if md_instance is None:
        return _fallback_text_reader(path)
    
    try:
        result = md_instance.convert(path)
        markdown_text = getattr(result, "text_content", None)
        if isinstance(markdown_text, str) and markdown_text.strip():
            print(f"[RAG] MarkItDown转换成功: {path} -> {len(markdown_text)} chars Markdown")
            return markdown_text
        return ""
    except Exception as e:
        print(f"[WARNING] MarkItDown转换失败 {path}: {e}")
        return _fallback_text_reader(path)
```

（2）智能分块策略

经过MarkItDown转换后，所有文档都统一为标准的Markdown格式。这为后续的智能分块提供了结构化的基础。HelloAgents实现了专门针对Markdown格式的智能分块策略，充分利用Markdown的结构化特性进行精确分割。

Markdown结构感知的分块流程：

```
标准Markdown文本 → 标题层次解析 → 段落语义分割 → Token计算分块 → 重叠策略优化 → 向量化准备
       ↓                ↓              ↓            ↓           ↓            ↓
   统一格式          #/##/###        语义边界      大小控制     信息连续性    嵌入向量
   结构清晰          层次识别        完整性保证    检索优化     上下文保持    相似度匹配
```

由于所有文档都已转换为Markdown格式，系统可以利用Markdown的标题结构（#、##、###等）进行精确的语义分割：

```python
def _split_paragraphs_with_headings(text: str) -> List[Dict]:
    """根据标题层次分割段落，保持语义完整性"""
    lines = text.splitlines()
    heading_stack: List[str] = []
    paragraphs: List[Dict] = []
    buf: List[str] = []
    char_pos = 0
    
    def flush_buf(end_pos: int):
        if not buf:
            return
        content = "\n".join(buf).strip()
        if not content:
            return
        paragraphs.append({
            "content": content,
            "heading_path": " > ".join(heading_stack) if heading_stack else None,
            "start": max(0, end_pos - len(content)),
            "end": end_pos,
        })
    
    for ln in lines:
        raw = ln
        if raw.strip().startswith("#"):
            # 处理标题行
            flush_buf(char_pos)
            level = len(raw) - len(raw.lstrip('#'))
            title = raw.lstrip('#').strip()
            
            if level <= 0:
                level = 1
            if level <= len(heading_stack):
                heading_stack = heading_stack[:level-1]
            heading_stack.append(title)
            
            char_pos += len(raw) + 1
            continue
        
        # 段落内容累积
        if raw.strip() == "":
            flush_buf(char_pos)
            buf = []
        else:
            buf.append(raw)
        char_pos += len(raw) + 1
    
    flush_buf(char_pos)
    
    if not paragraphs:
        paragraphs = [{"content": text, "heading_path": None, "start": 0, "end": len(text)}]
    
    return paragraphs
```

在Markdown段落分割的基础上，系统进一步根据Token数量进行智能分块。由于输入已经是结构化的Markdown文本，系统可以更精确地控制分块边界，确保每个分块既适合向量化处理，又保持Markdown结构的完整性：

```python
def _chunk_paragraphs(paragraphs: List[Dict], chunk_tokens: int, overlap_tokens: int) -> List[Dict]:
    """基于Token数量的智能分块"""
    chunks: List[Dict] = []
    cur: List[Dict] = []
    cur_tokens = 0
    i = 0
    
    while i < len(paragraphs):
        p = paragraphs[i]
        p_tokens = _approx_token_len(p["content"]) or 1
        
        if cur_tokens + p_tokens <= chunk_tokens or not cur:
            cur.append(p)
            cur_tokens += p_tokens
            i += 1
        else:
            # 生成当前分块
            content = "\n\n".join(x["content"] for x in cur)
            start = cur[0]["start"]
            end = cur[-1]["end"]
            heading_path = next((x["heading_path"] for x in reversed(cur) if x.get("heading_path")), None)
            
            chunks.append({
                "content": content,
                "start": start,
                "end": end,
                "heading_path": heading_path,
            })
            
            # 构建重叠部分
            if overlap_tokens > 0 and cur:
                kept: List[Dict] = []
                kept_tokens = 0
                for x in reversed(cur):
                    t = _approx_token_len(x["content"]) or 1
                    if kept_tokens + t > overlap_tokens:
                        break
                    kept.append(x)
                    kept_tokens += t
                cur = list(reversed(kept))
                cur_tokens = kept_tokens
            else:
                cur = []
                cur_tokens = 0
    
    # 处理最后一个分块
    if cur:
        content = "\n\n".join(x["content"] for x in cur)
        start = cur[0]["start"]
        end = cur[-1]["end"]
        heading_path = next((x["heading_path"] for x in reversed(cur) if x.get("heading_path")), None)
        
        chunks.append({
            "content": content,
            "start": start,
            "end": end,
            "heading_path": heading_path,
        })
    
    return chunks
```

同时为了兼容不同语言，系统实现了针对中英文混合文本的Token估算算法，这对于准确控制分块大小至关重要：

```python
def _approx_token_len(text: str) -> int:
    """近似估计Token长度，支持中英文混合"""
    # CJK字符按1 token计算
    cjk = sum(1 for ch in text if _is_cjk(ch))
    # 其他字符按空白分词计算
    non_cjk_tokens = len([t for t in text.split() if t])
    return cjk + non_cjk_tokens

def _is_cjk(ch: str) -> bool:
    """判断是否为CJK字符"""
    code = ord(ch)
    return (
        0x4E00 <= code <= 0x9FFF or  # CJK统一汉字
        0x3400 <= code <= 0x4DBF or  # CJK扩展A
        0x20000 <= code <= 0x2A6DF or # CJK扩展B
        0x2A700 <= code <= 0x2B73F or # CJK扩展C
        0x2B740 <= code <= 0x2B81F or # CJK扩展D
        0x2B820 <= code <= 0x2CEAF or # CJK扩展E
        0xF900 <= code <= 0xFAFF      # CJK兼容汉字
    )
```

（3）统一嵌入与向量存储

嵌入模型是RAG系统的核心，它负责将文本转换为高维向量，使得计算机能够理解和比较文本的语义相似性。RAG系统的检索能力很大程度上取决于嵌入模型的质量和向量存储的效率。HelloAgents实现了统一的嵌入接口。在这里为了演示，使用百炼API，如果尚未配置可以切换为本地的`all-MiniLM-L6-v2`模型，如果两种方案都不支持，也配置了TF-IDF算法来兜底。实际使用可以替换为自己想要的模型或者API，也可以尝试去扩展框架内容~

```python
def index_chunks(
    store = None, 
    chunks: List[Dict] = None, 
    cache_db: Optional[str] = None, 
    batch_size: int = 64,
    rag_namespace: str = "default"
) -> None:
    """
    Index markdown chunks with unified embedding and Qdrant storage.
    Uses百炼 API with fallback to sentence-transformers.
    """
    if not chunks:
        print("[RAG] No chunks to index")
        return
    
    # 使用统一嵌入模型
    embedder = get_text_embedder()
    dimension = get_dimension(384)
    
    # 创建默认Qdrant存储
    if store is None:
        store = _create_default_vector_store(dimension)
        print(f"[RAG] Created default Qdrant store with dimension {dimension}")
    
    # 预处理Markdown文本以获得更好的嵌入质量
    processed_texts = []
    for c in chunks:
        raw_content = c["content"]
        processed_content = _preprocess_markdown_for_embedding(raw_content)
        processed_texts.append(processed_content)
    
    print(f"[RAG] Embedding start: total_texts={len(processed_texts)} batch_size={batch_size}")
    
    # 批量编码
    vecs: List[List[float]] = []
    for i in range(0, len(processed_texts), batch_size):
        part = processed_texts[i:i+batch_size]
        try:
            # 使用统一嵌入器（内部处理缓存）
            part_vecs = embedder.encode(part)
            
            # 标准化为List[List[float]]格式
            if not isinstance(part_vecs, list):
                if hasattr(part_vecs, "tolist"):
                    part_vecs = [part_vecs.tolist()]
                else:
                    part_vecs = [list(part_vecs)]
            
            # 处理向量格式和维度
            for v in part_vecs:
                try:
                    if hasattr(v, "tolist"):
                        v = v.tolist()
                    v_norm = [float(x) for x in v]
                    
                    # 维度检查和调整
                    if len(v_norm) != dimension:
                        print(f"[WARNING] 向量维度异常: 期望{dimension}, 实际{len(v_norm)}")
                        if len(v_norm) < dimension:
                            v_norm.extend([0.0] * (dimension - len(v_norm)))
                        else:
                            v_norm = v_norm[:dimension]
                    
                    vecs.append(v_norm)
                except Exception as e:
                    print(f"[WARNING] 向量转换失败: {e}, 使用零向量")
                    vecs.append([0.0] * dimension)
                    
        except Exception as e:
            print(f"[WARNING] Batch {i} encoding failed: {e}")
            # 实现重试机制
            # ... 重试逻辑 ...
        
        print(f"[RAG] Embedding progress: {min(i+batch_size, len(processed_texts))}/{len(processed_texts)}")
```

### 8.3.5 高级检索策略

RAG系统的检索能力是其核心竞争力。在实际应用中，用户的查询表述与文档中的实际内容可能存在用词差异，导致相关文档无法被检索到。为了解决这个问题，HelloAgents实现了三种互补的高级检索策略：多查询扩展（MQE）、假设文档嵌入（HyDE）和统一的扩展检索框架。

（1）多查询扩展（MQE）

多查询扩展（Multi-Query Expansion）是一种通过生成语义等价的多样化查询来提高检索召回率的技术。这种方法的核心洞察是：同一个问题可以有多种不同的表述方式，而不同的表述可能匹配到不同的相关文档。例如，"如何学习Python"可以扩展为"Python入门教程"、"Python学习方法"、"Python编程指南"等多个查询。通过并行执行这些扩展查询并合并结果，系统能够覆盖更广泛的相关文档，避免因用词差异而遗漏重要信息。

MQE的优势在于它能够自动理解用户查询的多种可能含义，特别是对于模糊查询或专业术语查询效果显著。系统使用LLM生成扩展查询，确保扩展的多样性和语义相关性：

```python
def _prompt_mqe(query: str, n: int) -> List[str]:
    """使用LLM生成多样化的查询扩展"""
    try:
        from ...core.llm import HelloAgentsLLM
        llm = HelloAgentsLLM()
        prompt = [
            {"role": "system", "content": "你是检索查询扩展助手。生成语义等价或互补的多样化查询。使用中文，简短，避免标点。"},
            {"role": "user", "content": f"原始查询：{query}\n请给出{n}个不同表述的查询，每行一个。"}
        ]
        text = llm.invoke(prompt)
        lines = [ln.strip("- \t") for ln in (text or "").splitlines()]
        outs = [ln for ln in lines if ln]
        return outs[:n] or [query]
    except Exception:
        return [query]
```

（2）假设文档嵌入（HyDE）

假设文档嵌入（Hypothetical Document Embeddings，HyDE）是一种创新的检索技术，它的核心思想是"用答案找答案"。传统的检索方法是用问题去匹配文档，但问题和答案在语义空间中的分布往往存在差异——问题通常是疑问句，而文档内容是陈述句。HyDE通过让LLM先生成一个假设性的答案段落，然后用这个答案段落去检索真实文档，从而缩小了查询和文档之间的语义鸿沟。

这种方法的优势在于，假设答案与真实答案在语义空间中更加接近，因此能够更准确地匹配到相关文档。即使假设答案的内容不完全正确，它所包含的关键术语、概念和表述风格也能有效引导检索系统找到正确的文档。特别是对于专业领域的查询，HyDE能够生成包含领域术语的假设文档，显著提升检索精度：

```python
def _prompt_hyde(query: str) -> Optional[str]:
    """生成假设性文档用于改善检索"""
    try:
        from ...core.llm import HelloAgentsLLM
        llm = HelloAgentsLLM()
        prompt = [
            {"role": "system", "content": "根据用户问题，先写一段可能的答案性段落，用于向量检索的查询文档（不要分析过程）。"},
            {"role": "user", "content": f"问题：{query}\n请直接写一段中等长度、客观、包含关键术语的段落。"}
        ]
        return llm.invoke(prompt)
    except Exception:
        return None
```

（3）扩展检索框架

HelloAgents将MQE和HyDE两种策略整合到统一的扩展检索框架中。系统通过`enable_mqe`和`enable_hyde`参数让用户可以根据具体场景选择启用哪些策略：对于需要高召回率的场景可以同时启用两种策略，对于性能敏感的场景可以只使用基础检索。

扩展检索的核心机制是"扩展-检索-合并"三步流程。首先，系统根据原始查询生成多个扩展查询（包括MQE生成的多样化查询和HyDE生成的假设文档）；然后，对每个扩展查询并行执行向量检索，获取候选文档池；最后，通过去重和分数排序合并所有结果，返回最相关的top-k文档。这种设计的巧妙之处在于，它通过`candidate_pool_multiplier`参数（默认为4）扩大候选池，确保有足够的候选文档进行筛选，同时通过智能去重避免返回重复内容。

```python
def search_vectors_expanded(
    store = None,
    query: str = "",
    top_k: int = 8,
    rag_namespace: Optional[str] = None,
    only_rag_data: bool = True,
    score_threshold: Optional[float] = None,
    enable_mqe: bool = False,
    mqe_expansions: int = 2,
    enable_hyde: bool = False,
    candidate_pool_multiplier: int = 4,
) -> List[Dict]:
    """
    Search with query expansion using unified embedding and Qdrant.
    """
    if not query:
        return []
    
    # 创建默认存储
    if store is None:
        store = _create_default_vector_store()
    
    # 查询扩展
    expansions: List[str] = [query]
    
    if enable_mqe and mqe_expansions > 0:
        expansions.extend(_prompt_mqe(query, mqe_expansions))
    if enable_hyde:
        hyde_text = _prompt_hyde(query)
        if hyde_text:
            expansions.append(hyde_text)

    # 去重和修剪
    uniq: List[str] = []
    for e in expansions:
        if e and e not in uniq:
            uniq.append(e)
    expansions = uniq[: max(1, len(uniq))]

    # 分配候选池
    pool = max(top_k * candidate_pool_multiplier, 20)
    per = max(1, pool // max(1, len(expansions)))

    # 构建RAG数据过滤器
    where = {"memory_type": "rag_chunk"}
    if only_rag_data:
        where["is_rag_data"] = True
        where["data_source"] = "rag_pipeline"
    if rag_namespace:
        where["rag_namespace"] = rag_namespace

    # 收集所有扩展查询的结果
    agg: Dict[str, Dict] = {}
    for q in expansions:
        qv = embed_query(q)
        hits = store.search_similar(
            query_vector=qv, 
            limit=per, 
            score_threshold=score_threshold, 
            where=where
        )
        for h in hits:
            mid = h.get("metadata", {}).get("memory_id", h.get("id"))
            s = float(h.get("score", 0.0))
            if mid not in agg or s > float(agg[mid].get("score", 0.0)):
                agg[mid] = h
    
    # 按分数排序返回
    merged = list(agg.values())
    merged.sort(key=lambda x: float(x.get("score", 0.0)), reverse=True)
    return merged[:top_k]
```

实际应用中，这三种策略的组合使用效果最佳。MQE擅长处理用词多样性问题，HyDE擅长处理语义鸿沟问题，而统一框架则确保了结果的质量和多样性。对于一般查询，建议启用MQE；对于专业领域查询，建议同时启用MQE和HyDE；对于性能敏感场景，可以只使用基础检索或仅启用MQE。

当然还有很多有趣的方法，这里只是为大家适当的扩展介绍，在实际的使用场景里也需要去尝试寻找适合问题的解决方案。



## 8.4 构建智能文档问答助手

在前面的章节中，我们详细介绍了HelloAgents的记忆系统和RAG系统的设计与实现。现在，让我们通过一个完整的实战案例，展示如何将这两个系统有机结合，构建一个智能文档问答助手。

### 8.4.1 案例背景与目标

在实际工作中，我们经常需要处理大量的技术文档、研究论文、产品手册等PDF文件。传统的文档阅读方式效率低下，难以快速定位关键信息，更无法建立知识间的关联。

本案例将基于Datawhale另外一门动手学大模型教程Happy-LLM的公测PDF文档`Happy-LLM-0727.pdf`为例，构建一个<strong>基于Gradio的Web应用</strong>，展示如何使用RAGTool和MemoryTool构建完整的交互式学习助手。PDF可在这个[链接](https://github.com/datawhalechina/happy-llm/releases/download/v1.0.1/Happy-LLM-0727.pdf)获取。

我们希望实现以下功能：

1. <strong>智能文档处理</strong>：使用MarkItDown实现PDF到Markdown的统一转换，基于Markdown结构的智能分块策略，高效的向量化和索引构建

2. <strong>高级检索问答</strong>：多查询扩展（MQE）提升召回率，假设文档嵌入（HyDE）改善检索精度，上下文感知的智能问答

3. <strong>多层次记忆管理</strong>：工作记忆管理当前学习任务和上下文，情景记忆记录学习事件和查询历史，语义记忆存储概念知识和理解，感知记忆处理文档特征和多模态信息

4. <strong>个性化学习支持</strong>：基于学习历史的个性化推荐，记忆整合和选择性遗忘，学习报告生成和进度追踪

为了更清晰地展示整个系统的工作流程，图8.6展示了五个步骤之间的关系和数据流动。五个步骤形成了一个完整的闭环：步骤1将PDF文档处理后的信息记录到记忆系统，步骤2的检索结果也会记录到记忆系统，步骤3展示记忆系统的完整功能（添加、检索、整合、遗忘），步骤4整合RAG和Memory提供智能路由，步骤5收集所有统计信息生成学习报告。



![](/images/courses/8-figures/8-6.png)

*图 8.6 智能问答助手的五步执行流程*



接下来，我们将展示如何实现这个Web应用。整个应用分为三个核心部分：

1. <strong>核心助手类（PDFLearningAssistant）</strong>：封装RAGTool和MemoryTool的调用逻辑
2. <strong>Gradio Web界面</strong>：提供友好的用户交互界面，这个部分可以参考示例代码学习
3. <strong>其他核心功能</strong>：笔记记录、学习回顾、统计查看和报告生成

### 8.4.2 核心助手类的实现

首先，我们实现核心的助手类`PDFLearningAssistant`，它封装了RAGTool和MemoryTool的调用逻辑。

（1）类的初始化

```python
class PDFLearningAssistant:
    """智能文档问答助手"""

    def __init__(self, user_id: str = "default_user"):
        """初始化学习助手

        Args:
            user_id: 用户ID，用于隔离不同用户的数据
        """
        self.user_id = user_id
        self.session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # 初始化工具
        self.memory_tool = MemoryTool(user_id=user_id)
        self.rag_tool = RAGTool(rag_namespace=f"pdf_{user_id}")

        # 学习统计
        self.stats = {
            "session_start": datetime.now(),
            "documents_loaded": 0,
            "questions_asked": 0,
            "concepts_learned": 0
        }

        # 当前加载的文档
        self.current_document = None
```

在这个初始化过程中，我们做了几个关键的设计决策：

<strong>MemoryTool的初始化</strong>：通过`user_id`参数实现用户级别的记忆隔离。不同用户的学习记忆是完全独立的，每个用户都有自己的工作记忆、情景记忆、语义记忆和感知记忆空间。

<strong>RAGTool的初始化</strong>：通过`rag_namespace`参数实现知识库的命名空间隔离。使用`f"pdf_{user_id}"`作为命名空间，每个用户都有自己独立的PDF知识库。

<strong>会话管理</strong>：`session_id`用于追踪单次学习会话的完整过程，便于后续的学习历程回顾和分析。

<strong>统计信息</strong>：`stats`字典记录关键的学习指标，用于生成学习报告。

（2）加载PDF文档

```python
def load_document(self, pdf_path: str) -> Dict[str, Any]:
    """加载PDF文档到知识库

    Args:
        pdf_path: PDF文件路径

    Returns:
        Dict: 包含success和message的结果
    """
    if not os.path.exists(pdf_path):
        return {"success": False, "message": f"文件不存在: {pdf_path}"}

    start_time = time.time()

    # 【RAGTool】处理PDF: MarkItDown转换 → 智能分块 → 向量化
    result = self.rag_tool.execute(
        "add_document",
        file_path=pdf_path,
        chunk_size=1000,
        chunk_overlap=200
    )

    process_time = time.time() - start_time

    if result.get("success", False):
        self.current_document = os.path.basename(pdf_path)
        self.stats["documents_loaded"] += 1

        # 【MemoryTool】记录到学习记忆
        self.memory_tool.execute(
            "add",
            content=f"加载了文档《{self.current_document}》",
            memory_type="episodic",
            importance=0.9,
            event_type="document_loaded",
            session_id=self.session_id
        )

        return {
            "success": True,
            "message": f"加载成功！(耗时: {process_time:.1f}秒)",
            "document": self.current_document
        }
    else:
        return {
            "success": False,
            "message": f"加载失败: {result.get('error', '未知错误')}"
        }
```

我们通过一行代码就能完成PDF的处理：

```python
result = self.rag_tool.execute(
    "add_document",
    file_path=pdf_path,
    chunk_size=1000,
    chunk_overlap=200
)
```

这个调用会触发RAGTool的完整处理流程（MarkItDown转换、增强处理、智能分块、向量化存储），这些内部细节在8.3节已经详细介绍过。我们只需要关注：

- <strong>操作类型</strong>：`"add_document"` - 添加文档到知识库
- <strong>文件路径</strong>：`file_path` - PDF文件的路径
- <strong>分块参数</strong>：`chunk_size=1000, chunk_overlap=200` - 控制文本分块
- <strong>返回结果</strong>：包含处理状态和统计信息的字典

文档加载成功后，我们使用MemoryTool记录到情景记忆：

```python
self.memory_tool.execute(
    "add",
    content=f"加载了文档《{self.current_document}》",
    memory_type="episodic",
    importance=0.9,
    event_type="document_loaded",
    session_id=self.session_id
)
```

<strong>为什么用情景记忆？</strong> 因为这是一个具体的、有时间戳的事件，适合用情景记忆记录。`session_id`参数将这个事件关联到当前学习会话，便于后续回顾学习历程。

这个记忆记录为后续的个性化服务奠定了基础：

- 用户询问"我之前加载过哪些文档？" → 从情景记忆中检索
- 系统可以追踪用户的学习历程和文档使用情况

### 8.4.3 智能问答功能

文档加载完成后，用户就可以向文档提问了。我们实现一个`ask`方法来处理用户的问题：

```python
def ask(self, question: str, use_advanced_search: bool = True) -> str:
    """向文档提问

    Args:
        question: 用户问题
        use_advanced_search: 是否使用高级检索（MQE + HyDE）

    Returns:
        str: 答案
    """
    if not self.current_document:
        return "⚠️ 请先加载文档！"

    # 【MemoryTool】记录问题到工作记忆
    self.memory_tool.execute(
        "add",
        content=f"提问: {question}",
        memory_type="working",
        importance=0.6,
        session_id=self.session_id
    )

    # 【RAGTool】使用高级检索获取答案
    answer = self.rag_tool.execute(
        "ask",
        question=question,
        limit=5,
        enable_advanced_search=use_advanced_search,
        enable_mqe=use_advanced_search,
        enable_hyde=use_advanced_search
    )

    # 【MemoryTool】记录到情景记忆
    self.memory_tool.execute(
        "add",
        content=f"关于'{question}'的学习",
        memory_type="episodic",
        importance=0.7,
        event_type="qa_interaction",
        session_id=self.session_id
    )

    self.stats["questions_asked"] += 1

    return answer
```

当我们调用`self.rag_tool.execute("ask", ...)`时，RAGTool内部执行了以下高级检索流程：

1. <strong>多查询扩展（MQE）</strong>：

   ```python
   # 生成多样化查询
   expanded_queries = self._generate_multi_queries(question)
   # 例如，对于"什么是大语言模型？"，可能生成：
   # - "大语言模型的定义是什么？"
   # - "请解释一下大语言模型"
   # - "LLM是什么意思？"
   ```

   MQE通过LLM生成语义等价但表述不同的查询，从多个角度理解用户意图，提升召回率30%-50%。

2. <strong>假设文档嵌入（HyDE）</strong>：

   - 生成假设答案文档，桥接查询和文档的语义鸿沟
   - 使用假设答案的向量进行检索

这些高级检索技术的内部实现在8.3.5节已经详细介绍过。

### 8.4.4 其他核心功能

除了加载文档和智能问答，我们还需要实现笔记记录、学习回顾、统计查看和报告生成等功能：

```python
def add_note(self, content: str, concept: Optional[str] = None):
    """添加学习笔记"""
    self.memory_tool.execute(
        "add",
        content=content,
        memory_type="semantic",
        importance=0.8,
        concept=concept or "general",
        session_id=self.session_id
    )
    self.stats["concepts_learned"] += 1

def recall(self, query: str, limit: int = 5) -> str:
    """回顾学习历程"""
    result = self.memory_tool.execute(
        "search",
        query=query,
        limit=limit
    )
    return result

def get_stats(self) -> Dict[str, Any]:
    """获取学习统计"""
    duration = (datetime.now() - self.stats["session_start"]).total_seconds()
    return {
        "会话时长": f"{duration:.0f}秒",
        "加载文档": self.stats["documents_loaded"],
        "提问次数": self.stats["questions_asked"],
        "学习笔记": self.stats["concepts_learned"],
        "当前文档": self.current_document or "未加载"
    }

def generate_report(self, save_to_file: bool = True) -> Dict[str, Any]:
    """生成学习报告"""
    memory_summary = self.memory_tool.execute("summary", limit=10)
    rag_stats = self.rag_tool.execute("stats")

    duration = (datetime.now() - self.stats["session_start"]).total_seconds()
    report = {
        "session_info": {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "start_time": self.stats["session_start"].isoformat(),
            "duration_seconds": duration
        },
        "learning_metrics": {
            "documents_loaded": self.stats["documents_loaded"],
            "questions_asked": self.stats["questions_asked"],
            "concepts_learned": self.stats["concepts_learned"]
        },
        "memory_summary": memory_summary,
        "rag_status": rag_stats
    }

    if save_to_file:
        report_file = f"learning_report_{self.session_id}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2, default=str)
        report["report_file"] = report_file

    return report
```

这些方法分别实现了：

- <strong>add_note</strong>：将学习笔记保存到语义记忆
- <strong>recall</strong>：从记忆系统中检索学习历程
- <strong>get_stats</strong>：获取当前会话的统计信息
- <strong>generate_report</strong>：生成详细的学习报告并保存为JSON文件

### 8.4.5 运行效果展示

接下来是运行效果展示，如图8.7所示，进入主页面后需要先初始化助手，也就是加载我们的数据库，模型，API之类的载入操作。后传入PDF文档，并点击加载文档。



![](/images/courses/8-figures/8-7.png)

*图 8.7 问答助手主页面*



第一个功能是智能问答，将可以基于上传的文档进行检索，并返回参考来源和相关资料的相似度计算，这是RAG tool能力的体现，如图8.8所示。



![](/images/courses/8-figures/8-8.png)

*图 8.8 问答助手主页面*



第二个功能是学习笔记，如图8.9所示，可以对于相关概念进行勾选，以及撰写笔记内容，这一部分运用到Memory tool，将会存放你的个人笔记在数据库内，方便统计和后续返回整体的学习报告。



![](/images/courses/8-figures/8-9.png)

*图 8.9 问答助手主页面*



最后是学习进度的统计和报告的生成，如图8.10所示，我们将可以看到使用助手期间加载的文档数量，提问次数，和笔记数量，最终将我们的问答结果和笔记整理为一个JSON文档返回。



![](/images/courses/8-figures/8-10.png)

*图 8.10 问答助手主页面*



通过这个问答助手的案例，我们展示了如何使用RAGTool和MemoryTool构建一个完整的<strong>基于Web的智能文档问答系统</strong>。完整的代码可以在`code/chapter8/11_Q&A_Assistant.py`中找到。启动后访问 `http://localhost:7860` 即可使用这个智能学习助手。

建议读者亲自运行这个案例，体验RAG和Memory的能力，并在此基础上进行扩展和定制，构建符合自己需求的智能应用！

## 8.6 用户记忆系统：超越记录，走向理解

在第八章中，我们实现了 HelloAgents 的 `MemoryTool` 和四种记忆类型。但一个根本性的问题仍然悬而未决：**智能体究竟应该记住什么？**

直觉上的答案是"记住用户说过的每一句话"。但这显然不可行——不仅因为存储和检索的成本，更因为噪音信息会淹没真正的信号。想象一下，如果每次对话你都要把用户说过的数千句话全部塞进 LLM 的上下文窗口，不仅成本高得离谱，而且真正有用的信息会被海量噪音淹没。

一个精心设计的记忆系统，其目标**不是记录用户的每一个字，而是构建一个用户的心理模型（Mental Model）**。这个模型能够预测用户的需求、偏好和行为模式，就像一位熟悉的同事了解你的工作习惯一样——他不需要记住你每天说的每一句话，但知道你喜欢在上午处理复杂任务、你对咖啡有特别的偏好、你对截止日期非常敏感。

这种从"记录"到"理解"的转变，是记忆系统设计的核心哲学。记录是线性的、平面的、被动的；理解是结构的、层次的、主动的。

### 8.6.1 用户记忆的三个关键特性

要理解用户记忆系统的本质，我们需要把握三个关键特性：

**选择性（Selective）**：并非所有信息都值得记住。一次对话中的"今天天气不错"和"我儿子对花生过敏"显然具有截然不同的记忆价值。记忆系统需要能够判断信息的重要性和持久性，选择性记录真正有意义的用户信息。这要求系统具备信息价值评估的能力——不是所有的用户输入都同等重要，有些信息是核心画像的一部分，有些只是社交润滑剂。

**抽象性（Abstractive）**：原始的用户输入往往包含冗余和噪音。优秀的记忆系统不是简单地存储原句，而是从中**抽象**出更高层次的结构化信息。例如，用户说"我上周去了东京出差，顺便在银座吃了寿司，那家店真的很棒"。记忆系统不应该存储这句话本身，而应该抽象出以下信息："用户有国际差旅需求"（工作维度）、"用户对日式料理感兴趣"（偏好维度）、"用户愿意为优质用餐体验付费"（消费习惯维度）。这才是真正的"理解"，而非"记录"。

**结构性（Structured）**：零散的记忆碎片如果不加以组织，就很难被有效利用。记忆系统需要将信息组织成可检索、可推理的结构化形式。一个人的基本信息、偏好、人际关系、历史行为应该被组织成一个有机的整体，而不是散落在孤立的数据点中。结构化的记忆允许系统进行精确的查询（"用户对什么食物过敏？"）和复杂的推理（"结合用户的过敏信息和目的地饮食文化，推荐合适的餐厅"）。

这三个特性决定了记忆系统的能力上限。一个不具备选择性的系统会被噪音淹没；一个不具备抽象性的系统无法从具体事件中提炼通用知识；一个不具备结构性的系统无法支持复杂推理。

## 8.7 记忆能力的评估：三层次框架

当评估一个智能体的记忆系统时，我们可以使用经典的三层次能力框架。这个框架不仅帮助开发者定位当前系统的能力水平，也为记忆系统的演进提供了清晰的路线图——你可以逐层检查自己的系统站在哪个位置，下一步应该往哪个方向演进。

### 8.7.1 L1：基础记忆（Basic Recall）

这是最基础的记忆能力层。智能体能够**精确地存储和检索**用户在对话中提供的信息。看起来简单，但 L1 已经包含了一个重要的能力：当用户说"我叫张三，住在北京"时，系统不仅能在当前对话中记住这些信息，还能在后续对话中准确提取。

大多数简单的对话系统（如不带持久化的聊天机器人）甚至无法达到 L1——它们每次对话都是一张白纸。实现 L1 需要持久化存储和基本的键值对检索能力。

**典型应用场景**：记录用户的姓名、称呼方式、简单的偏好设置。如果一个系统能做到"用户上周说过的事情，这周再问仍然记得"，它就达到了 L1。

### 8.7.2 L2：多会话检索（Multi-session Retrieval）

L2 的能力跃迁体现在**跨会话的信息关联**上。系统不再只是存储事实，而是能够将在不同时间、不同上下文中获取的信息关联起来。

例如，用户在周一说"我正在学习 Python"，周五又说"我想做个爬虫项目"。具备 L2 能力的系统能够将两条信息关联起来，理解到"用户想做 Python 爬虫项目，这与他在周一提到的正在学习 Python 是一致的"。这个层次需要的核心技术是**实体识别与链接**以及**跨会话的推理能力**。

另一个例子：用户三个月前说"我住在上海"，今天说"我家附近的地铁站最近在施工"。L2 系统应该能够将"上海"和"附近的地铁站"关联起来，推断用户仍然住在上海。

**典型应用场景**：智能助手能够跨会话保持对用户项目进展的跟踪。用户在周一讨论一个项目方案，周三继续讨论时，系统不需要用户重新交代背景。

### 8.7.3 L3：主动服务（Proactive Service）

最高层次的记忆能力不仅是"响应式"的——等到用户问到才回答，而是**主动地、预判地**提供服务。系统能够从表面上看似不相关的记忆中找到关联，在用户尚未提出需求之前就预判其意图。

比如，用户一个月前提到"下周要去日本出差"，今天又提到"儿子不太舒服"。系统主动问："您下周的日本之行需要我帮您查一下东京的儿童医院吗？"——这就是 L3 的能力体现。它需要**时间感知**（记住事件的时间戳并关联到现在）、**复杂推理**（在看似不相关的记忆之间建立桥梁）和**冲突检测**（发现信息矛盾）。

另一个场景：用户经常在周末晚上点外卖，偏好川菜。今天是周六晚上七点，用户打开 App。L3 系统主动推送："老时间了，要不要再来一份您上次说好吃的水煮鱼？"——用户甚至不需要开口。

**典型应用场景**：个人助理在用户提出需求之前就准备好了相关信息和方案。

### 8.7.4 八大记忆能力维度

将上述三个层次进一步分解，我们可以得到八个具体的记忆能力维度。这八个维度就像一张检查清单，帮助你系统地评估记忆系统的成熟度：

| 维度 | 说明 | 对应层次 |
|------|------|---------|
| 个人信息记忆（Personal Info） | 记住用户的姓名、职业、联系方式等静态信息 | L1 |
| 偏好追踪（Preference Tracking） | 记录用户的偏好、习惯、风格，如喜欢的食物、常去的网站 | L1→L2 |
| 上下文切换（Context Switching） | 在不同话题之间切换而不丢失上下文，保持对话的自然流畅 | L2 |
| 记忆更新（Memory Update） | 当用户提供的新信息与旧信息冲突时，正确更新而非简单覆盖 | L2 |
| 多会话连续性（Multi-session Continuity） | 跨会话保持一致的交互体验，不重复问已经知道的信息 | L2 |
| 复杂推理（Complex Reasoning） | 利用记忆进行多步推理，在多个信息片段之间建立逻辑链条 | L3 |
| 时间感知（Time Awareness） | 理解时间顺序、持续时间和时间相关性 | L3 |
| 冲突解决（Conflict Resolution） | 发现并处理记忆中的矛盾信息，判断哪个信息更可信 | L3 |

![](/images/courses/ai-agent/fig3-1.svg)

*图 8.12 智能体记忆能力的三层次评估框架*

这八个维度构成了评估和设计用户记忆系统的完整蓝图。当你构建记忆系统时，可以在这张表上逐一核对，找到系统当前的短板和下一步的演进方向。例如，如果你的系统已经能够很好地存储个人信息（L1）和追踪偏好（L1→L2），但跨会话连续性不佳（L2），那么下一步的优化重点应该是增强实体链接和跨会话推理能力。

## 8.8 记忆的层次结构

在第八章的 HelloAgents 中，我们实现了工作记忆、情景记忆、语义记忆和感知记忆四种类型。但从用户记忆系统的视角，记忆还可以按照**时间维度和可变性**划分为三个层次。这三个层次在生命周期、可变性和用途上各有不同，共同构成了完整的记忆生态。

### 8.8.1 轨迹记忆（Trajectory）：当前会话的完整记录

轨迹记忆是当前会话的**完整日志**，记录了用户与智能体之间的每一步交互。它有两个核心特征：

**追加写入（Append-only）**：轨迹记忆只能追加，不可修改。这确保了交互历史的完整性和审计可追溯性。即使智能体后续发现之前的回应有误，也不能修改轨迹——只能追加一条修正信息。这种设计保证了历史记录的真实性。

**不可变（Immutable）**：一旦写入，就不能删除或修改。这看起来是工程上的限制，实际上是设计上的智慧——轨迹记忆的不可变性使得调试、审计和分析成为可能。如果允许修改历史，你永远无法确定当前的"记忆"是否被篡改过。

在实际工程中，轨迹记忆通常以日志或事件流的形式存储，其生命周期仅限于当前会话或者一个相对较短的窗口期（如最近 24 小时）。轨迹记忆的主要用途不是"被检索"（因为量太大、噪音太多），而是"被分析"——通过事后分析轨迹数据，系统可以发现自己哪里做得不够好，用户在哪里遇到了困难。

### 8.8.2 长期记忆（Long-term Memory）：跨会话的持久知识

长期记忆是**跨会话、跨时间**的信息沉淀。与轨迹记忆不同，长期记忆是**可重写、可合并、可裁剪**的。

**可重写**：当用户纠正过去提供的信息时（"我之前说我是上海人，实际上我在上海工作但老家在苏州"），长期记忆需要支持更新操作。这里的更新不是"覆盖"，而是"修正历史"加上"记录更新轨迹"——旧信息应该被标记为"已过时"而非删除，新信息作为"最新状态"存储。这样既保持了信息的时效性，又保留了历史记录用于审计。

**可合并**：当从多个来源获取到关于同一实体的信息时，系统需要能够合并这些信息。例如，从对话中得知"用户喜欢喝咖啡"，从行为数据中得知"用户每周去星巴克 3 次"，从支付记录中得知"用户常点的是一杯美式、不加糖"。合并后可以得出"用户是重度咖啡爱好者，品牌偏好星巴克，具体偏好美式咖啡、无糖"。合并的目的是消除冗余、补充细节、构建完整的认知。

**可裁剪**：长期记忆需要主动管理信息的重要性。过时的信息（如用户三年前的住址）应该被降权或删除，为更重要的新信息腾出空间。裁剪策略可以是基于时间的（超过一定期限自动降权）、基于反馈的（用户长时间不提到的信息降权）或基于重要性的（通过 LLM 评估保留价值）。

### 8.8.3 业务状态（Business State）：任务阶段的标记

业务状态是记忆系统的第三个层次，它记录的是**当前任务所处的阶段和上下文**。例如，在一个机票预订流程中，业务状态会记录"已选择出发城市"、"已选择目的地"、"正在等待日期确认"等阶段信息。业务状态是智能体在复杂任务中保持"知道自己在哪里"的关键。

业务状态的特点是**结构性强、生命周期明确**——它随着任务的开始而创建，随着任务的完成而销毁。业务状态使得智能体能够在复杂的多步骤任务中保持上下文连贯性，是支持"多轮任务"的关键基础设施。

可以这样理解三个层次的关系：轨迹记忆是"磁带"（完整记录每一步），长期记忆是"笔记"（提炼和整理重要信息），业务状态是"便签"（记住当前看到哪一页了）。

## 8.9 用户记忆的四种存储格式

将信息从原始对话转化为结构化记忆，需要选择合适的存储格式。不同的格式在**简洁性**和**表现力**之间存在不同的取舍。理解这些取舍，是在实际系统中做出正确设计决策的前提。

### 8.9.1 Simple Notes：原子化的事实卡片

最简单的存储格式，存储形式是原子化的键值对或三元组：

```
name: 张三
city: 北京
allergy: 花生
job: 软件工程师
```

**优点**：查询速度快（O(1) 级别的存取），实现简单，机器解析成本低，适合存储明确的、不相关的事实。

**缺点**：丢失了信息之间的关联关系。"张三"、"北京"、"花生"、"软件工程师"之间是什么关系？Simple Notes 无法表达"张三的儿子对花生过敏，而张三自己在北京工作"这样的复杂语义。所有的信息被压平在同一个层次上，无法表达层级和关联。

**适用场景**：用户配置项、简单的偏好标记、不需要复杂推理的事实。比如用户的界面语言偏好、时区设置、主题色选择等，用 Simple Notes 就足够了。

### 8.9.2 Enhanced Notes：叙事性的段落文本

Enhanced Notes 放弃了原子化，采用自然语言段落来保持语义的完整性：

```
张三是一位来自北京的软件工程师，目前在一家互联网公司负责后端开发。他有一个儿子，叫张小明，对花生过敏。张三本人喜欢喝咖啡，家里养了一只橘猫。
```

**优点**：语义完整性好，保留了事实之间的隐式关系（"张三"、"儿子"、"花生过敏"之间的关系一目了然），人类可读性强。大语言模型可以直接理解这种叙事性文本，不需要额外的格式转换。

**缺点**：存储冗余高（"张三"出现了多次），不利于机器精确检索。如果要回答"张三的儿子对什么过敏"，需要 LLM 从文本中提取信息——这是一个 NLP 任务，增加了计算开销和不确定性。另外，如果多个段落之间有信息冲突（如段落 A 说"张三喜欢辣"，段落 B 说"张三不吃辣"），系统很难自动检测这种矛盾。

**适用场景**：作为 LLM 的系统提示词中的背景信息，或者需要人类审阅的记忆内容。许多商业系统会将 Enhanced Notes 作为"人物简介"展示给运营人员审阅和编辑。

### 8.9.3 JSON Cards：结构化的三级嵌套

JSON Cards 采用三级嵌套结构：**类别（Category）→ 子类别（Subcategory）→ 键值对（Key-Value）**。这是一种在简洁性和表现力之间取得平衡的格式：

```json
{
  "personal": {
    "basic": {
      "name": "张三",
      "hometown": "苏州",
      "current_city": "北京"
    },
    "family": {
      "son_name": "张小明",
      "son_allergy": "花生",
      "pet": "橘猫"
    }
  },
  "preference": {
    "food": {
      "likes": ["咖啡", "日式料理"],
      "dislikes": ["香菜"]
    },
    "travel": {
      "purpose": ["出差", "旅游"],
      "international_trips": 3
    }
  },
  "work": {
    "job": {
      "title": "软件工程师",
      "field": "后端开发",
      "company_type": "互联网"
    }
  }
}
```

**优点**：支持**部分更新**（只修改某个字段而不影响其他字段——例如只更新 hometown 字段，其他字段保持不变）；层级结构便于分类检索（"personal.family"下的信息可以快速定位）；对 LLM 友好——可以一次性作为上下文注入，模型能够通过键名理解每个字段的含义。

**缺点**：模式固定（需要预先定义 category 和 subcategory），无法很好地表达动态增长的列表和复杂的关系。例如，用户的购物历史是一个不断增长的时间序列，用 JSON Cards 来存储每一笔购买记录就会非常笨拙。

**适用场景**：大多数用户记忆系统的主要格式，特别是用户画像（User Profile）的持久化。几乎所有成熟的商业化智能体产品都使用某种形式的 JSON Cards 作为用户画像的核心存储格式。

### 8.9.4 Advanced JSON Cards：更丰富的语义表达

在 JSON Cards 的基础上，Advanced JSON Cards 增加了四个关键字段来消解歧义和丰富语义：

- **backstory**：背景故事，描述这个信息的来源和上下文
- **person**：关联人物（这个信息关系到谁）
- **relationship**：实体之间的关系
- **timestamp**：信息获取的时间

```json
{
  "personal": {
    "family": {
      "son": {
        "value": "张小明",
        "backstory": "用户在第一轮对话中主动提及，语气自豪",
        "person": "张三",
        "relationship": "父子",
        "timestamp": "2026-07-20T10:30:00Z"
      },
      "allergy": {
        "value": "花生",
        "backstory": "用户在讨论周末聚餐时提到，强调这是严重过敏",
        "person": "张小明",
        "relationship": "父子",
        "timestamp": "2026-07-20T10:35:00Z"
      }
    }
  }
}
```

**优点**：每个字段都带有完整的元数据，支持精确的溯源和时间线重建。当记忆发生冲突时（比如"张三"后来又说了"我儿子没有过敏"），可以依据时间戳和 backstory 判断哪个信息更可靠（如果"没有过敏"是更近期的信息，可能意味着过敏情况已经得到解决）。

**缺点**：存储开销较大，结构复杂，解析和生成都需要更多的计算资源。

**适用场景**：对准确性和可追溯性要求高的场景，如医疗健康、金融服务等领域的用户记忆。在这些场景中，"谁在什么时候说了什么"有时比"说了什么"本身更重要——因为它关系到决策的依据和责任的归属。

### 8.9.5 格式选择的原则

在实际系统中，**不需要只用一种格式**。聪明的做法是根据信息的性质选择最合适的格式。推荐的综合策略是：

**关键且数据量小的信息**（如用户姓名、过敏信息、联系方式、紧急联系人等）→ **Advanced JSON Cards**：这些信息准确性和可追溯性要求高，数据量小，使用最丰富的格式存储是值得的。

**大量且非关键的信息**（如用户的日常喜好、浏览历史、搜索记录等）→ **Simple Notes**：这些信息量大但每条信息的价值有限，使用最简单的格式存储以节省成本。

**需要人类审阅和 LLM 理解的信息**（如用户对产品的详细反馈、用户的人生经历等）→ **Enhanced Notes（定期汇总生成）**：这些信息需要全面的语义理解，人类审阅也需要可读性。

例如，一个旅游助手的用户记忆系统可能这样设计：用户的护照信息、紧急联系人用 Advanced JSON Cards；用户的旅行偏好（喜欢靠窗座位、偏好素食等）用 JSON Cards；用户的每次旅行日志用 Simple Notes（以时间为键，简短的描述为值）；每周生成一份 Enhanced Notes 作为 LLM 的上下文摘要，让模型能够快速理解用户的旅行风格。

![](/images/courses/ai-agent/fig3-2.svg)

*图 8.13 四种存储格式的取舍关系与选择策略*

## 8.10 用户记忆的进阶表示：User as Code

文本形式的记忆虽然灵活，但在某些关键能力上存在天花板。当我们需要对记忆进行**精确的运算、验证和执行**时，文本不够用。这里说的"天花板"不是技术的限制，而是本质的局限——自然语言不适合做精确计算和逻辑验证。

### 8.10.1 从文本到可执行代码

一种更激进的思路是：**用户的记忆不应该存储在文本里，而应该存储在代码里**。具体来说，就是将用户的特征和行为模式建模为可执行的程序逻辑。

这个思路分为两个阶段：

**阶段一：记忆（Memory）——追加式的事实日志**

所有的用户交互原始信息以**追加写入（append-only）** 的方式记录为一个事实日志。这个日志是"不可篡改的原始数据"，类似于数据库的 WAL（Write-Ahead Log）：

```python
# User Memory Log (append-only)
memory_log = [
    {"type": "fact", "content": "User lives in Beijing", "timestamp": "...", "source": "explicit"},
    {"type": "fact", "content": "User is allergic to peanuts", "timestamp": "...", "source": "explicit"},
    {"type": "observation", "content": "User mentioned discomfort after lunch", "timestamp": "...", "source": "implicit"},
    {"type": "correction", "content": "User corrected: actually lives in Shanghai, moved last month", "timestamp": "...", "source": "explicit"},
]
```

**阶段二：结构化（Structuring）——周期性生成可执行数据结构**

系统定期（例如每小时或每天）扫描记忆日志，基于日志中的事实、观察和修正生成一个 Python 数据类实例。这个数据类不仅存储数据，还封装了与这些数据相关的**业务逻辑**：

```python
@dataclass
class UserProfile:
    name: str | None = None
    city: str | None = None
    allergies: list[str] = field(default_factory=list)
    preferences: dict[str, float] = field(default_factory=dict)
    international_trips_this_year: int = 0

    def is_allergic_to(self, food: str) -> bool:
        return food.lower() in [a.lower() for a in self.allergies]

    def validate_passport(self, target_date: datetime) -> bool:
        ...

    def preference_score(self, item: str) -> float:
        return self.preferences.get(item, 0.0)
```

关键区别在于：文本记忆是"被动的数据"，而数据类是"主动的逻辑"。文本记忆需要 LLM 来理解和推理；数据类可以直接被机器执行。

### 8.10.2 文本记忆做不到的事

**1. 聚合统计与精确计算**

设问"用户去年出国了几次？"。文本记忆的 LLM 检索-推理方式准确率在 6% 到 43% 之间（取决于提示词的质量和上下文长度）。而用数据类 + 简单计数，准确率是 99%+。

这是因为"去年"是一个精确的时间范围，"几次"是一个精确的计数操作——这两者都是**符号逻辑**擅长的，而非**概率推理**擅长的。LLM 在理解自然语言方面异常强大，但在精确计数和时间范围计算方面天生薄弱。与其强迫 LLM 去做它不擅长的事情，不如把适合符号运算的部分抽离出来交给代码。

**2. 冲突检测与安全验证**

考虑以下场景：用户在医生面前说"我对青霉素不过敏"，但系统在之前的对话日志中发现"用户有青霉素过敏史"。两个信息之间存在冲突。

文本记忆系统很难自动发现这种冲突——除非在提示词中明确要求 LLM 检查。但提示词指令不是自动执行的约束，你无法保证 LLM 每次都能准确地检查所有可能的冲突。而数据类可以定义明确的**约束检查规则**，这些规则是自动触发、精确执行的：

```python
class MedicalProfile:
    allergies: list[str]
    
    def check_drug_conflict(self, drug: str) -> list[str]:
        drug_allergy_map = {
            "penicillin": ["青霉素", "阿莫西林", "氨苄青霉素"],
            "sulfa": ["磺胺类药物"],
        }
        conflicts = []
        for d, related in drug_allergy_map.items():
            if self._matches_any(d, self.allergies):
                for r in related:
                    if r.lower() in drug.lower():
                        conflicts.append(f"{d} related: {r}")
        return conflicts
```

这段代码是**确定性的**——同样的输入永远产生同样的输出，不会因为模型版本变化或 prompt 措辞调整而改变。在医疗、金融等需要确定性的场景中，这种可预测的执行逻辑比 LLM 的概率性推理可靠得多。

**3. 约束执行与强制逻辑**

用户的护照六个月后到期。文本记忆需要 LLM 在每次回答时"记得"检查这个约束——这意味着巨大的依赖性和不确定性。LLM 可能这次检查到了，下次忘了，也可能在上下文拥挤时忽略了这个约束。

而数据类可以封装这个逻辑，使其成为系统行为的一部分，而非 LLM 回答的一部分：

```python
def validate_booking(self, booking_info: dict) -> BookingResult:
    if self.passport_expiry < datetime.now() + timedelta(days=180):
        return BookingResult(
            allowed=False,
            reason="护照有效期不足6个月，请先更新护照信息"
        )
    if not self._has_valid_visa(booking_info["destination"]):
        return BookingResult(
            allowed=False,
            reason="缺少目的地有效签证"
        )
    return BookingResult(allowed=True)
```

在 User as Code 框架下，约束是**自动执行的业务逻辑**，而非 LLM 的**提示词建议**。这个差异在安全性敏感的场景中是致命的。

### 8.10.3 用户作为 Engram

Engram 是神经科学中的概念，指记忆在大脑中的物理或化学痕迹。类比到 AI 智能体：**将用户信息写入模型参数，而非等待每次推理时注入上下文**。

具体来说：

1. **记忆编码**：每次交互后的重要观察，通过 LoRA 微调或其他参数高效微调方法，写入模型的参数空间中
2. **自然检索**：当模型面对类似场景时，被编码的参数自然地"浮现"出相关的用户信息，不需要显式的检索步骤
3. **隐式推理**：参数空间中的记忆可以进行隐式的关联推理，不需要显式的检索指令

这种方式的优点在于：记忆不再是外加的信息，而是模型认知的一部分。模型在生成回答时，这些记忆会自然地影响输出——就像你了解一位老朋友，不需要每次见面都翻看他的档案。缺点是：不可追溯（无法知道模型是否使用了某个记忆）、不可审计（无法验证记忆的准确性）、更新成本高（需要重新微调），且存在灾难性遗忘的风险（新知识覆盖旧知识）。

目前，Engram 式的用户记忆仍然是一个非常前沿的研究方向，尚未在工业产品中广泛应用，但它代表着记忆系统从"信息存储"向"认知嵌入"演进的长期方向。

### 8.10.4 多模态用户记忆

当记忆系统需要处理的不只是文字，还包括用户的声音语调、面部表情、屏幕截图、传感器数据时，我们进入了多模态用户记忆的领域。

多模态记忆的核心挑战在于：**如何将不同模态的信息统一到一个可检索的记忆空间中**。一个可行的方法是将每个模态的信息都编码到统一的向量空间中：

```
文本输入 → Text Embedding → 1024-dim vector
语音输入 → Audio Embedding → 1024-dim vector  
图像输入 → Image Embedding → 1024-dim vector
传感器数据 → Feature Embedding → 1024-dim vector
```

在检索时，无论查询是什么模态，都可以在统一的向量空间中找到相关的多模态记忆。例如，用户说"上次那个让我很开心的照片"——查询文本被编码成向量，在向量空间中检索到与"开心"语义接近的图像记忆。

多模态记忆的另一个重要原则是**存储感知而非存储符号**。当用户看到一幅画时，系统应该存储"用户看到这幅画时的表情变化"（感知），而非"这幅画是毕加索的《格尔尼卡》"（符号）。虽然符号信息也有价值，但感知信息为更深层次的用户理解提供了素材——你知道的不仅是用户看过什么，更是用户感受到什么。

## 8.11 记忆框架案例

在实践中，已经出现了多个成熟的用户记忆管理框架。了解它们的设计理念可以帮助我们构建更好的记忆系统，避免重复造轮子。

### 8.11.1 Mem0：提取→比对→决策

Mem0（曾经的 GPT Mem）是当前最流行的用户记忆框架之一，被广泛应用于构建具有持久记忆的 AI 助手。它的核心是**三阶段管道**：

**第一阶段：提取（Extract）**。从对话中提取值得记住的信息。Mem0 使用 LLM 来分析对话内容，判断哪些信息应该存入记忆系统。提取的标准包括：
- **事实性**：是否是一个客观事实（而非意见、情绪或闲聊）
- **重要性**：是否对构建用户画像有价值（用户的工作信息比今天的天气更重要）
- **新颖性**：是否是不重复的信息（与已有记忆高度相似的信息不需要重复存储）

**第二阶段：比对（Compare）**。将提取到的信息与已有的记忆进行比对。比对的结果分为四种情况：

- **ADD**：这是一个全新的信息，当前记忆系统中不存在，直接添加
- **UPDATE**：这个信息与已有记忆相关，但提供了新的内容或修正，需要更新
- **DELETE**：新信息表明旧信息已经过时或错误，需要删除旧记忆
- **NOOP**：这个信息已经在记忆系统中存在，无需重复存储（去重）

**第三阶段：决策（Decide）**。基于比对结果，执行相应的存储操作。这个过程需要回答一个核心问题：**同一个记忆应该被覆盖还是保留**？例如，用户说"我不喜欢吃辣了"——这应该覆盖之前的"我喜欢麻辣火锅"记录，还是两者都应该保留（后者是历史数据，前者是最新状态）？

Mem0 的典型做法是**分层保留**：最新状态作为"active memory"立即使用，旧状态作为"history"保存但优先级降低。这样系统既能使用最新的信息，又能回溯用户画像的演变过程。

Mem0 的设计哲学是将记忆管理从"存了什么"提升到"什么时候该存、什么时候该改、什么时候该删"，这正是我们在前面讨论的**选择性**和**抽象性**的工程化实现。

### 8.11.2 Memobase：Profile + Event Memory

Memobase 采取了不同的设计策略——它明确地将记忆划分为两个子空间：

**Profile（画像记忆）**：存储用户的静态和半静态信息。就像一个人的简历——变动不频繁，但每次变动都很重要。Profile 中包含了用户的姓名、职业、偏好、设置等信息，通常采用 JSON Cards 格式存储，支持精确的部分更新。

**Event Memory（事件记忆）**：存储用户的动态行为序列。就像一个人的日记——频繁追加，但单条信息可能不那么重要。事件记忆以时间序列的方式存储用户的行为日志，支持按时间范围、事件类型等维度检索。

这种划分的智慧在于：Profile 和 Event Memory 有不同的访问模式和维护策略。Profile 需要的是"精确查询"（用户的职业是什么），Event Memory 需要的是"时序分析"（用户最近做了什么事）。

Memobase 的一个关键工程创新是**带缓冲的批处理（Buffered Batch Processing）**。为了防止频繁的小写入导致 LLM 调用开销过大，Memobase 设计了写入缓冲区：短时间内的小更新积累到缓冲区中，达到一定阈值（如 10 条）或超时（如 30 秒）后，统一进行提取→比对→决策的处理。这种设计在用户快速连续输入时，能够显著降低系统的 API 调用成本——将多次 LLM 调用合并为一次，大幅提升效率。

![](/images/courses/ai-agent/fig3-3.svg)

*图 8.14 Mem0 记忆管理管道的三个阶段*

![](/images/courses/ai-agent/fig3-4.svg)

*图 8.15 Memobase 的双层记忆架构与缓冲批处理*

## 8.12 知识图谱 RAG

第八章中我们实现了基于向量数据库的 RAG（使用 Qdrant 进行语义检索）。然而，向量检索并非万能——当问题涉及**多跳推理**或**实体间的复杂关系**时，平面化的向量检索往往力不从心。

### 8.12.1 从平面向量到结构化知识

向量检索本质上是在**语义空间**中做最近邻搜索。它的强项是找到与查询语义相似的内容片段。但很多问题需要的不是语义相似，而是**结构化推理**：

- 查询："张三和李四之间是什么关系？"
- **向量检索的方式**：找到分别提到"张三"和"李四"的文本段，然后将这些文本段作为上下文让 LLM 推理它们的关系。如果两个实体从未在同一段文本中出现过，向量检索永远无法回答这个问题。
- **知识图谱检索的方式**：直接查询张三和李四在图谱中的连接路径——如果有路径（如"张三→同事→李四"），可以精确地给出关系；如果没有路径，系统也知道"两者之间没有已知关系"而非"我猜可能是……"。

向量检索适用于"找相似"的场景（如"找一篇和这篇文档类似的文章"），而知识图谱检索适用于"找相关"的场景（如"找到和这个实体相关的所有实体及其关系"）。两者不是替代关系，而是互补关系。

### 8.12.2 GraphRAG：从社区检测到全局查询

Microsoft 的 GraphRAG 是目前最引人注目的知识图谱 RAG 实现之一。它在传统 RAG 的基础上增加了知识图谱的维度，专门解决需要全局理解的问题。它的工作流程分为两个阶段：

**索引阶段**：
1. 将文档分割成文本块
2. 从每个文本块中提取实体和关系，构建知识图谱
3. 运行社区检测算法（如 Leiden 算法），将图划分为层次化的社区——每个社区代表一个语义相关的实体群
4. 为每个社区生成**社区摘要**——该社区中所有实体和关系的总结性文本，概括了这个话题区域的核心内容

**查询阶段**：
1. 将查询与社区摘要进行匹配，定位到最相关的社区
2. 在定位的社区中进行精确的实体和关系检索
3. 将图谱知识和原始文档片段一起作为 LLM 的上下文

GraphRAG 的关键洞察是：**社区摘要充当了全局索引中的中间层**。不是直接在最细粒度的实体上检索，而是先找到"最相关的话题区域"，然后再深入细节。这种层次化检索在回答需要全局理解的问题时（如"这篇小说的主要主题是什么？""这份报告的核心论点和论据有哪些？"）表现远优于平面向量检索。

### 8.12.3 何时使用知识图谱 RAG

知识图谱 RAG 并非总是优于向量 RAG。它适用于以下特定场景：

**多跳推理（Multi-hop Reasoning）**：问题需要跨越多个实体的关系链。例如："张三的儿子在哪里上学？"——需要从张三→儿子→学校的路径推理。每一步都是"跳"到另一个实体，需要图结构来支持这种链式推理。

**实体为中心的查询（Entity-centric Queries）**：问题明确围绕实体展开。例如："张三有哪些作品获得了奖项？"——核心是"张三"这个实体及其关联的作品和奖项。图谱可以一次性检索出所有与张三关联的作品节点，再过滤出"获奖"关系的子集。

**需要精确关系的场景**：当关系的类型、方向、属性都很重要时。例如："张三和李四是什么关系？同事还是师生？"——向量检索无法区分"同事"和"师生"这两种关系，因为它们在语义上都很接近"认识"。知识图谱可以精确区分关系类型。

### 8.12.4 成本与取舍

知识图谱 RAG 的代价值得认真权衡：

**构建成本**：从文档中提取实体和关系需要大量的 LLM 调用。一个 100 页的文档可能产生数千次提取调用，每次都需要 LLM 来分析文本片段中的实体和关系。对于大型文档库，这个成本可能是向量索引的 10-100 倍。

**存储成本**：知识图谱的存储比向量索引大一个数量级，特别是当每个实体和关系都携带详细的元数据时。每个实体节点可能需要存储名称、类型、描述、来源文档等信息；每条关系边需要存储类型、方向、置信度、证据位置等。

**维护成本**：当源文档更新时，知识图谱的更新不是一个简单的重新索引，而是需要确定哪些实体/关系受影响、如何合并新旧信息、如何处理删除的实体。这是一个"增量更新"问题，远比重建向量索引复杂。

**延迟成本**：图查询（特别是多跳查询）的延迟通常高于向量检索的近似最近邻搜索。多跳查询涉及多次图遍历，每次遍历都可能涉及 IO 操作。

**决策指南**：如果你的应用场景中 80% 的查询是简单的"查找相似内容"，那么向量 RAG 就足够了。只有当复杂推理查询的比例显著上升（如超过 30%）时，引入知识图谱 RAG 才值得投入。一个好的折中方案是**混合检索**：简单查询走向量通道，复杂查询走图谱通道。

## 8.13 智能体化 RAG（Agentic RAG）

传统的 RAG 流程是固定的：**检索 → 生成 → 输出**。但越来越多的实践证明，这种固定管道过于刚性——它假设了"只要检索了就一定需要外部知识"和"检索到的东西一定有用"，而这两个假设在实践中常常不成立。**智能体化 RAG** 的核心思想是让智能体**自主决定何时检索、检索什么**，使检索不再是管道的固定步骤，而是智能体可调用的工具之一。

### 8.13.1 Self-RAG：按需检索，自我批判

Self-RAG 由 Akari Asai 等人提出，核心创新是**让 LLM 自己决定是否需要检索**。

传统的 RAG 每个生成步骤都要检索，不管当前生成的内容是否需要外部知识。Self-RAG 引入了一个反思机制：模型每生成一段内容，都会自我判断这段内容是否需要外部信息支撑。如果需要，才触发检索；如果不需要（如生成简单的问候语或格式化的输出），就直接使用模型的内置知识。

自我批判的另一面是**对检索结果的质量评估**。Self-RAG 的反思 token 不仅判断"要不要检索"，还判断"检索到的内容是否有用、是否相关、是否充分"。这种自省机制实现了检索的**按需调用**，显著降低了不必要的检索开销。

在实践中，Self-RAG 的效果取决于反思 token 的训练质量。如果反思 token 过于保守，系统会错过需要的检索；如果过于激进，系统又回到了"每次都检索"的原始状态。好的 Self-RAG 实现需要精细的调参和持续的优化。

### 8.13.2 Corrective RAG（CRAG）：验证与修正

CRAG 的出发点是：**检索结果可能是错的**。在传统 RAG 中，检索结果是"喂"给 LLM 的——无论好坏，都会被当成上下文的一部分。如果检索结果与问题不相关，反而会误导 LLM。

CRAG 在检索后引入了一步**质量评估**：

1. **检索**：从知识库中获取相关文档
2. **评估**：使用一个小模型（如 T5 的 fine-tuned 版本）对检索结果进行相关性评分
3. **决策**：
   - 如果检索结果质量高（评分高于阈值）→ 正常进入生成阶段
   - 如果检索结果质量中等（评分在阈值之间）→ 选择性使用检索结果，同时保留 LLM 的内置知识，让两者共同影响输出
   - 如果检索结果质量差（评分低于阈值）→ 完全放弃检索结果，仅依赖 LLM 的内置知识或进行重新检索

CRAG 的关键价值在于为 RAG 流程增加了**质量控制**的环节，防止低质量检索结果污染 LLM 的输出。研究表明，CRAG 在领域知识密集、对准确性要求高的场景中（如法律咨询、医疗诊断）的效果提升尤为显著——因为这些场景中"给出错误的检索结果"比"不给出检索结果"更危险。

### 8.13.3 Adaptive RAG：策略自适应

不同复杂度的问题，需要不同的检索策略。Adaptive RAG 的核心是**根据查询的复杂度动态调整检索策略**：

- **简单查询**（"巴黎是哪个国家的首都？"）→ 不检索或单次浅层检索。这类问题 LLM 的内置知识就足以回答，检索反而可能引入噪音。
- **中等复杂度查询**（"张三上次去日本是什么时候？"）→ 向量检索 + 记忆检索。需要从知识库和用户记忆中分别查找相关信息。
- **复杂查询**（"张三和李四之间有没有业务往来？他们的合作历史是怎样的？"）→ 多跳知识图谱检索 + 文本检索 + 记忆检索。需要在多个数据源之间进行综合检索和推理。

Adaptive RAG 通常使用一个**路由分类器**来评估查询的复杂度，然后选择合适的检索策略组合。这个分类器可以是小型的 BERT 模型（轻量级、快速），也可以是 LLM 自身（通过提示词判断，更灵活但成本更高）。

Adaptive RAG 的实用性在于：它平衡了**效果**和**成本**。简单查询不浪费检索资源，复杂查询获得充分的检索支持。在面向大量用户的生产环境中，这种按需分配策略能够显著降低平均检索成本。

## 8.14 RAG 技巧

在实际部署 RAG 系统时，一些关键技术细节往往决定了最终效果的上限。以下是几个经过验证的高价值技巧。

### 8.14.1 上下文感知检索：解决指代消解

最简单的 RAG 实现将用户的查询原封不动地送入检索系统。但在对话场景中，用户的查询往往包含指代——"它的价格是多少？"——其中的"它"需要在前文中找到指代对象。

**解决方案**：在将查询送入检索器之前，先对查询进行**指代消解（Anaphora Resolution）**。将"它"替换为指代的具体实体（如"iPhone 16 Pro"），然后再进行检索。

例如：

```
用户: "我想买 iPhone 16 Pro，听说拍照很好。"
用户: "它的价格是多少？" → 改写 → "iPhone 16 Pro 的价格是多少？"
```

这种改写可以大幅提升检索的相关性。如果不做指代消解，直接检索"它的价格"，检索到的可能是"它的价格"这个短语出现的文档，而不会是手机价格。实现方式可以是一个轻量级的 LLM 调用（只需要一次推理，不需要生成完整回答），也可以用一个专门的指代消解模型。

![](/images/courses/ai-agent/fig3-5.svg)

*图 8.16 上下文感知检索中的指代消解流程*

### 8.14.2 HyDE：假设性文档嵌入

HyDE（Hypothetical Document Embeddings）是一个极具创意的思路。传统检索的问题是：**查询的语义空间和文档的语义空间之间可能存在差距**。用户的查询通常简短、抽象，而文档则详细、具体。直接用查询向量去检索，可能会匹配不到语义接近的文档。

HyDE 的解决方法是：先用 LLM 根据查询生成一个假设性的（hypothetical）回答文档，然后用这个假设文档的向量去检索真实的文档。

具体流程：

1. 用户输入查询："猫和狗哪个更适合作为老年人的宠物？"
2. LLM 生成假设性回答："猫可能更适合老年人，因为它们不需要每天遛，体型较小，维护成本较低。猫的独立性较强，不需要太多陪伴。而狗需要每天遛和较多关注……"
3. 使用假设性回答的向量去向量数据库中检索
4. 返回与假设性回答语义最接近的真实文档

理论上，假设性回答的向量比原始查询的向量更接近真实文档的向量分布，从而检索到更相关的内容。实验表明，HyDE 在开放式问题（如"解释 X"、"比较 Y 和 Z"）上的提升尤其显著。

HyDE 的效果依赖于 LLM 生成的假设性回答的质量。如果 LLM 生成的内容偏离事实或偏离查询意图，反而会降低检索质量。因此，HyDE 更适合 LLM 能力较强的场景。

![](/images/courses/ai-agent/fig3-6.svg)

*图 8.17 HyDE 的检索流程：查询→假设文档→向量检索*

### 8.14.3 Re-ranking：精排提升精度

向量检索（使用 embedding 模型的余弦相似度）是一个高效的但也是**粗糙**的匹配过程。embedding 模型将整个文档片段压缩成一个向量，在这一压缩过程中，大量的细节信息丢失了。两个文档可能在向量空间中很接近，但它们的实际内容可能大相径庭——只是"大意"相似。

Re-ranking 的核心理念是：**先用向量检索快速召回一批候选文档（Top-K），然后使用一个更精细的排序模型在候选中重新排序**。常用的 re-ranker 是 cross-encoder——它将查询和文档片段同时输入一个 BERT 模型，输出一个精确的相关性分数。

Cross-encoder 比 bi-encoder（embedding 模型）精确得多，因为它可以捕捉到 query 和 document 之间的细粒度交互——不仅仅是"大意匹配"，而是逐词级别的匹配——但速度也慢得多（需要逐对计算）。这正是为何 re-ranking 只在候选集上（如 top-20）执行，而非在整个知识库上执行。

实践证明，re-ranking 通常可以提升 RAG 的回答质量 10-20%，特别是在需要精确匹配（如条款、法规、数字、技术规格）的场景中效果尤为显著。对于需要概括和创造性的任务，re-ranking 的提升较小。

![](/images/courses/ai-agent/fig3-7.svg)

*图 8.18 Re-ranking 的 Two-stage 检索架构*

### 8.14.4 扩展 RAG 技巧图谱

除了上述三个核心技巧外，还有多个值得关注的 RAG 技巧：

**查询重写（Query Rewriting）**：将用户的口语化、碎片化查询改写为更规范的检索查询。例如，用户的"那个……上次说的那个什么论文在哪里"改写成"查找关于[主题]的论文"。查询重写不仅解决指代问题，还能补充缺失的关键词、规范化表达方式。

**滑动窗口检索（Sliding Window Retrieval）**：检索到相关片段后，将其左右相邻片段也纳入上下文，提供更完整的上下文信息。因为文档的分割往往是机械的（按固定 token 数分割），真正的语义边界可能跨越分割点。滑动窗口确保了连贯的语义单位不会被分割操作切断。

**分层摘要（Hierarchical Summarization）**：先检索到片段，再对片段对应的父文档进行摘要，提供更高层次的上下文理解。对于需要"全局理解"的问题（如"这份报告的核心结论是什么？"），分层摘要显著优于只给 LLM 提供片段。

**多轮检索（Iterative Retrieval）**：如果第一轮检索结果不充分，基于已获得的信息进行第二轮、第三轮检索，逐步扩展信息范围。每轮检索都使用上一轮的结果作为上下文的一部分。多轮检索在解决复杂问题时特别有效，因为它允许系统"先了解大概、再深入细节"。

![](/images/courses/ai-agent/fig3-8.svg)
![](/images/courses/ai-agent/fig3-9.svg)
![](/images/courses/ai-agent/fig3-10.svg)
![](/images/courses/ai-agent/fig3-11.svg)
![](/images/courses/ai-agent/fig3-12.svg)
![](/images/courses/ai-agent/fig3-13.svg)
![](/images/courses/ai-agent/fig3-14.svg)
![](/images/courses/ai-agent/fig3-15.svg)

*图 8.19 至 S-15 RAG 技巧全景图谱：查询重写、滑动窗口、分层摘要与多轮检索等技术*

## 8.15 本章总结与展望

在本章中，我们成功地为HelloAgents框架增加了两个核心能力：记忆系统和RAG系统。

对于希望深入学习和应用本章内容的读者，我们提供以下建议：

1. 从零到一，亲手设计一个基础记忆模块，并逐步迭代，为其增添更复杂的特性。

2. 在项目中尝试并评估不同的嵌入模型与检索策略，寻找特定任务下的最优解。

3. 将所学的记忆与 RAG 系统应用于一个真实的个人项目，在实战中检验和提升能力。

进阶探索

1. 跟踪并研究前沿memory，rag仓库，学习优秀实现。
2. 探索将 RAG 架构应用于多模态（文本+图像）或跨模态场景的可能性。
3. 参与HelloAgents开源项目，贡献自己的想法和代码

通过本章的学习，您不仅掌握了Memory和RAG系统的实现技术，更重要的是理解了如何将认知科学理论转化为实际的工程解决方案。这种跨学科的思维方式，将为您在AI领域的进一步发展奠定坚实的基础。

最后，让我们通过一个思维导图来总结本章的完整知识体系，如图8.11所示：



![](/images/courses/8-figures/8-11.png)

*图 8.11 Hello-agents第八章知识总结*



本章展示了HelloAgents框架记忆系统和RAG技术的能力，我们成功构建了一个具有真正"智能"的学习助手。这种架构可以轻松扩展到其他应用场景，如客户服务、技术支持、个人助理等领域。

在下一章中，我们将继续探索如何通过上下文工程进一步提升智能体的对话质量和用户体验，敬请期待！

## 习题

> <strong>提示</strong>：部分习题没有标准答案，重点在于培养学习者对记忆系统和RAG技术的综合理解和实践能力。

1. 本章介绍了四种记忆类型：工作记忆、情景记忆、语义记忆和感知记忆。请分析：

   - 在8.2.5节中，每种记忆类型都有独特的评分公式。请对比情景记忆和语义记忆的评分机制，解释为什么情景记忆更强调"时间近因性"（权重0.2），而语义记忆更强调"图检索"（权重0.3）？
   - 如果要设计一个"个人健康管理助手"（需要记录用户的饮食、运动、睡眠数据，并提供健康建议），你会如何组合使用这四种记忆类型？请为每种记忆类型设计具体的应用场景。
   - 工作记忆采用TTL（Time To Live）机制自动清理过期数据。请思考：在什么情况下，重要的工作记忆应该被"整合"（consolidate）为长期记忆？如何设计一个自动整合的触发条件？

2. 在8.3节的RAG系统中，我们使用MarkItDown将各种格式文档统一转换为Markdown。请深入思考：

   > <strong>提示</strong>：这是一道动手实践题，建议实际操作

   - 当前的智能分块策略基于Markdown的标题层次（#、##、###）进行分割。如果处理的是没有明确标题结构的文档（如小说、法律条文），应该如何优化分块策略？请尝试实现一个基于"语义边界"的分块算法。
   - 在8.3.5节中介绍了MQE（多查询扩展）和HyDE（假设文档嵌入）两种高级检索策略。请选择一个实际场景（如技术文档问答、医疗知识检索），对比基础检索、MQE和HyDE三种方法的效果差异，并分析各自的适用场景。
   - RAG系统的检索质量很大程度上取决于嵌入模型的选择。请对比本章提到的三种嵌入方案（百炼API、本地Transformer、TF-IDF），从准确性、速度、成本、离线部署等维度进行评估，并给出选型建议。

3. 记忆系统的"遗忘"机制是模拟人类认知的重要设计。基于8.2.3节的MemoryTool，请完成以下扩展实践：

   > <strong>提示</strong>：这是一道动手实践题，建议实际操作

   - 当前提供了三种遗忘策略：基于重要性、基于时间、基于容量。请设计并实现一个"智能遗忘"策略，综合考虑重要性、访问频率、时间衰减等多个因素，使用加权评分来决定哪些记忆应该被遗忘。
   - 在长期运行的智能体系统中，记忆数据库可能会积累大量数据。请设计一个"记忆归档"机制：将长期不用但可能有价值的记忆转移到冷存储，需要时再恢复。这个机制应该如何与现有的四种记忆类型集成？
   - 思考：如果智能体需要"忘记"某些敏感信息（如用户隐私数据），仅仅从数据库删除是否足够？在使用向量数据库和图数据库的情况下，如何确保数据被彻底清除？

4. 在8.4节的"智能学习助手"案例中，我们结合了MemoryTool和RAGTool。请深入分析：

   - 案例中的`ask_question()`方法同时使用了RAG检索和记忆检索。请分析：在什么情况下应该优先使用RAG？在什么情况下应该优先使用Memory？如何设计一个"智能路由"机制来自动选择最合适的检索方式？
   - 当前的学习报告（`generate_report()`）只包含统计信息。请扩展这个功能，设计一个更智能的学习报告生成器：能够分析用户的学习轨迹、识别知识盲点、推荐下一步学习内容。这需要用到哪些记忆类型和检索策略？
   - 假设你要将这个学习助手部署为多用户的Web服务，每个用户都有独立的记忆和知识库。请设计数据隔离方案：如何在Qdrant和Neo4j中实现用户级别的数据隔离？如何优化多用户场景下的检索性能？

5. 语义记忆使用了Neo4j图数据库来存储知识图谱。请思考：

   - 在8.2.5节的语义记忆实现中，系统会自动提取实体和关系构建知识图谱。请分析：这种自动提取的准确性如何？在什么情况下可能会提取出错误的实体或关系？如何设计一个"知识图谱质量评估"机制？
   - 知识图谱的一个重要优势是支持复杂的关系推理。请设计一个查询场景，充分利用Neo4j的图查询能力（如多跳关系、路径查找），实现纯向量检索无法完成的任务。
   - 对比语义记忆的"向量检索+图检索"混合策略与纯向量检索：在什么类型的查询中，图检索能够带来显著的性能提升？请用具体例子说明。

## 参考文献

[1] Atkinson, R. C., & Shiffrin, R. M. (1968). Human memory: A proposed system and its control processes. In *Psychology of learning and motivation* (Vol. 2, pp. 89-195). Academic press.


> 本篇是第八章的补充内容，聚焦于《AI Agents in Depth》第三章中关于用户记忆系统和 RAG 进阶技术的核心概念。如果你已经完成了第八章的框架实现，本篇将帮助你从更高维度理解记忆系统的设计哲学与前沿 RAG 技术。
