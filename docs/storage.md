---
id: storage
entry: src/storage/index.ts
exports: [StorageManager, ConfigStorage, SessionStorage]
deps: [obsidian, zod]
env: []
examples: []
tests: []
status: stable
last_reviewed: 2025-07-28
---

# Storage 模块

## 它做什么（What）

Storage 模块负责 Cortex 插件的所有数据持久化操作，包括智能体配置、会话历史和系统日志的存储管理。它提供了统一的文件系统抽象层，基于 Obsidian 的 Vault API，确保所有数据安全存储在 `.cortex/` 目录下，并提供类型安全的读写操作。

## 如何用（How - 最小可运行示例）

```typescript
import { App } from 'obsidian';
import { StorageManager, ConfigStorage, SessionStorage } from './storage';
import type { AgentConfig, ChatSession } from './types';

// 1. 初始化存储管理器
const app = new App(); // Obsidian App 实例
const storageManager = new StorageManager(app);
await storageManager.initialize(); // 创建必要目录

// 2. 配置存储操作
const configStorage = new ConfigStorage(storageManager);

const agentConfig: AgentConfig = {
  id: crypto.randomUUID(),
  name: 'My Agent',
  instructions: 'You are a helpful assistant',
  modelConfig: {
    provider: 'OpenAI',
    model: 'gpt-4',
    settings: { temperature: 0.7 }
  },
  // ... 其他配置
};

// 保存智能体配置
const saveResult = await configStorage.saveAgentConfig(agentConfig);
if (saveResult.success) {
  console.log('配置保存成功');
}

// 3. 会话存储操作
const sessionStorage = new SessionStorage(storageManager);

const session: ChatSession = {
  id: crypto.randomUUID(),
  agentId: agentConfig.id,
  history: [],
  context: { 
    lastActivity: Date.now(),
    totalMessages: 0 
  },
  // ... 其他字段
};

await sessionStorage.saveSession(session);
```

## 关键接口 / 函数（API）

### StorageManager
- **`initialize(): Promise<Result<void>>`** - 初始化存储目录结构
  - 创建 `.cortex/` 及其子目录（config、agents、sessions、logs）
  - 必须在使用其他功能前调用
- **`writeJson<T>(path: string, data: T): Promise<Result<void>>`** - 写入 JSON 数据
  - 自动创建父目录，类型安全序列化
- **`readJson<T>(path: string): Promise<Result<T>>`** - 读取 JSON 数据
  - 返回类型安全的反序列化结果
- **`deleteFile(path: string): Promise<Result<void>>`** - 删除文件
- **`exists(path: string): Promise<boolean>`** - 检查文件是否存在
- **`listFiles(directory: string): Promise<Result<string[]>>`** - 列出目录中的文件

### ConfigStorage
- **`saveAgentConfig(config: AgentConfig): Promise<Result<void>>`** - 保存智能体配置
  - 包含 Zod schema 验证，自动存储到 `agents/{id}.json`
- **`loadAgentConfig(id: string): Promise<Result<AgentConfig>>`** - 加载配置
  - 包含类型验证，确保配置格式正确
- **`listAgentConfigs(): Promise<Result<AgentConfig[]>>`** - 列出所有配置
  - 按创建时间排序（最新优先）
- **`exportAgentConfig(id: string): Promise<Result<string>>`** - 导出配置为 JSON 字符串
- **`importAgentConfig(jsonData: string): Promise<Result<AgentConfig>>`** - 从 JSON 导入配置
  - 自动生成新 ID 和时间戳

### SessionStorage
- **`saveSession(session: ChatSession): Promise<Result<void>>`** - 保存会话
  - 存储路径：`sessions/{agentId}/{sessionId}.json`
- **`loadSession(agentId: string, sessionId: string): Promise<Result<ChatSession>>`** - 加载会话
- **`listSessions(agentId: string): Promise<Result<ChatSession[]>>`** - 列出智能体的所有会话
  - 按最后活动时间排序
- **`addHistoryItem(agentId: string, sessionId: string, item: AgentHistoryItem): Promise<Result<void>>`** - 添加历史消息
  - 自动更新会话元数据（消息数量、最后活动时间）
- **`getRecentHistory(agentId: string, sessionId: string, limit?: number): Promise<Result<AgentHistoryItem[]>>`** - 获取最近消息
  - 默认返回最近 50 条消息

## 常见坑 / 注意事项（Pitfalls）

- **初始化顺序**：必须先调用 `StorageManager.initialize()` 再使用其他存储功能，否则目录可能不存在
- **路径格式**：所有路径都是相对于 `.cortex/` 目录的相对路径，不要使用绝对路径或 `../` 
- **并发写入**：对同一文件的并发写入可能导致数据丢失，建议在应用层面控制并发
- **内存占用**：`listAgentConfigs()` 和 `listSessions()` 会加载所有配置/会话到内存，大量数据时需注意
- **类型验证**：所有读取操作都包含 Zod schema 验证，格式错误的文件会导致加载失败
- **目录创建**：`writeJson()` 会自动创建必要的父目录，但 `readJson()` 不会
- **错误处理**：所有方法返回 `Result<T>` 类型，务必检查 `success` 字段再使用 `data`

## 内部实现摘要（Internals）

Storage 模块采用三层架构：

1. **底层文件操作（StorageManager）**：基于 Obsidian Vault API 的文件系统抽象
   - 统一的错误处理（Result 模式）
   - 自动目录创建和路径管理
   - JSON 序列化/反序列化封装

2. **业务存储层（ConfigStorage、SessionStorage）**：针对特定数据类型的高级操作
   - 集成 Zod schema 验证
   - 业务逻辑封装（如会话历史管理）
   - 数据完整性保证

3. **文件组织策略**：
   ```
   .cortex/
   ├── config/     # 系统配置
   ├── agents/     # 智能体配置 ({id}.json)
   ├── sessions/   # 会话数据 ({agentId}/{sessionId}.json)
   └── logs/       # 系统日志
   ```

核心设计原则：
- **失败安全**：所有操作返回 Result 类型，避免异常抛出
- **类型安全**：利用 TypeScript 和 Zod 确保数据类型正确性
- **模块化**：每个存储类负责特定数据类型，职责明确
- **性能优化**：惰性初始化，按需创建目录

## 相关文件 / 链接（Files & Links）

### 源码文件
- `src/storage/index.ts` - 模块统一导出
- `src/storage/storage-manager.ts` - 底层文件系统操作管理器
- `src/storage/config-storage.ts` - 智能体配置存储管理
- `src/storage/session-storage.ts` - 会话数据存储管理
- `src/types/index.ts` - Result 类型定义
- `src/types/agent.ts` - AgentConfig 和相关 schema
- `src/types/session.ts` - ChatSession 和相关 schema

### 设计文档
- `docs/agent.md` - 智能体模块文档
- `docs/session.md` - 会话管理模块文档

## TODO / 信息缺口

- [ ] 需要添加存储配额管理和清理策略
- [ ] 考虑添加数据压缩以减少存储空间占用
- [ ] 需要实现存储操作的性能监控和日志记录
- [ ] 计划添加数据备份和恢复功能
- [ ] 需要完善单元测试覆盖存储模块的所有场景
