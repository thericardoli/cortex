---
id: session
entry: src/session/index.ts
exports: [SessionManager]
deps: [storage, agent, types, "@openai/agents"]
env: []
examples: []
tests: []
status: stable
last_reviewed: 2025-07-28
---

# Session 模块

## 它做什么（What）

Session 模块负责管理 AI 智能体的聊天会话状态与历史记录。它维护用户与智能体之间的对话上下文，支持多会话并发、消息持久化存储，以及与 OpenAI Agents SDK 的集成，确保对话的连续性和状态一致性。

## 如何用（How - 最小可运行示例）

```typescript
import { SessionManager } from '@/session';
import { StorageManager, SessionStorage } from '@/storage';
import { AgentManager } from '@/agent';

// 1. 初始化依赖
const storageManager = new StorageManager();
await storageManager.initialize();

const sessionStorage = new SessionStorage(storageManager);
const agentManager = new AgentManager(/* ... */);
await agentManager.initialize();

// 2. 创建会话管理器
const sessionManager = new SessionManager(sessionStorage, agentManager);
await sessionManager.initialize();

// 3. 创建新会话
const createResult = await sessionManager.createSession({
  agentId: "agent-uuid-here",
  name: "我的第一次对话"
});

if (createResult.success) {
  const session = createResult.data;
  
  // 4. 发送消息
  const messageResult = await sessionManager.sendMessage(
    session.id,
    "你好，请介绍一下自己"
  );
  
  if (messageResult.success) {
    console.log("AI回复:", messageResult.data.content);
  }
}
```

## 关键接口 / 函数（API）

### SessionManager 主要方法

* **`initialize(): Promise<Result<void>>`**  
  初始化会话管理器，加载所有现有会话到内存。必须在使用前调用。

* **`createSession(input: CreateSessionInput): Promise<Result<ChatSession>>`**  
  创建新会话。参数：`{agentId: string, name: string}`。返回完整会话对象或错误。

* **`sendMessage(sessionId: string, content: string): Promise<Result<Message>>`**  
  发送用户消息并获取AI回复。自动更新会话历史和上下文统计信息。

* **`updateSession(id: string, input: UpdateSessionInput): Promise<Result<ChatSession>>`**  
  更新会话名称或状态。参数：`{name?: string, status?: 'active'|'paused'|'completed'}`。

* **`deleteSession(id: string): Promise<Result<void>>`**  
  删除指定会话，同时清理内存和存储文件。

* **`getSession(id: string): ChatSession | null`**  
  获取会话对象（内存查询），不存在返回 null。

* **`getSessionsByAgent(agentId: string): ChatSession[]`**  
  获取指定智能体的所有会话，按最后活动时间倒序排列。

* **`getRecentMessages(sessionId: string, limit?: number): Promise<Result<AgentHistoryItem[]>>`**  
  获取会话最近的消息历史，默认返回最后50条。

### 核心类型

* **`ChatSession`**: 会话完整状态，包含 id、agentId、历史记录、上下文统计
* **`Message`**: 单条消息，role 为 'user'|'assistant'|'system'
* **`AgentHistoryItem`**: 历史项联合类型，支持 message、function_call、handoff 等

## 常见坑 / 注意事项（Pitfalls）

* **初始化顺序**: 必须先初始化 StorageManager 和 AgentManager，再初始化 SessionManager
* **会话与智能体关联**: 创建会话前必须确保 agentId 对应的智能体已存在，否则返回错误
* **并发安全**: sendMessage 方法非原子操作，高并发时可能导致消息丢失或顺序错乱
* **内存管理**: 所有会话都加载到内存中，大量会话可能消耗较多内存
* **错误处理**: 所有异步方法返回 `Result<T>` 类型，务必检查 `success` 字段
* **UUID 格式**: agentId 和 sessionId 必须是有效的 UUID 格式
* **消息内容**: content 参数不能为空字符串，会话名称长度限制 1-100 字符

## 内部实现摘要（Internals）

核心流程：SessionManager 维护内存缓存 (`Map<string, ChatSession>`) + 文件持久化的双重存储架构。

**sendMessage 流程**:  
用户消息 → 验证会话 → 获取 Agent 实例 → 调用 OpenAI SDK `run()` → 处理响应 → 更新历史记录 → 持久化 → 返回结果

**状态管理**: 每个会话包含 `context` 字段统计 totalMessages、totalTokens、totalFunctionCalls 等指标，用于分析和限流。

**存储策略**: 使用 `sessions/{agentId}/{sessionId}.json` 的目录结构，支持按智能体分组管理会话文件。

**扩展点**: AgentHistoryItem 联合类型支持扩展新的历史项类型（如 handoff、function_call_result），便于实现多智能体协作功能。

## 相关文件 / 链接（Files & Links）

**源码文件**:
* `src/session/session-manager.ts` - 核心会话管理逻辑
* `src/session/index.ts` - 模块导出入口
* `src/types/session.ts` - 会话相关类型定义和 Zod schema
* `src/storage/session-storage.ts` - 会话存储抽象层

**依赖模块**:
* [storage模块](./storage.md) - 文件存储管理
* [agent模块](./agent.md) - 智能体实例管理
* [OpenAI Agents SDK](../llmtxt/openai-agents-js.md) - AI 对话执行引擎

## TODO / 信息缺口

* 缺少单元测试覆盖，特别是并发场景和错误处理路径
* sendMessage 方法需要改进令牌计数统计逻辑
* 考虑添加会话历史压缩机制，避免无限增长
* 需要补充批量操作 API（如批量删除、导出会话）
