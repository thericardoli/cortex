# Cortex - AI Copilot 使用说明（中文翻译）

## 架构总览

这是一个 Obsidian 插件，实现了多智能体（multi-agent）AI 系统，具备会话管理与模型提供方抽象。架构采用模块化模式：

- **管理器模式**：核心管理器（`AgentManager`、`SessionManager`、`ProviderManager`、`StorageManager`）负责生命周期与编排
- **工厂模式**：`AgentFactory` 和 `ProviderFactory` 根据配置创建实例
- **事件驱动**：管理器继承自 `EventEmitter`，实现松耦合
- **类型安全**：所有输入与配置均用 Zod schema 校验

## 关键组件与数据流

```
AgentManager → ProviderManager → OpenAI Agents SDK
     ↓              ↓
SessionManager → StorageManager → .cortex/ 
```

- **Agents（智能体）**：配置存储于 `.cortex/agents/`，实例化为 OpenAI Agent SDK 对象
- **Sessions（会话）**：每个智能体的聊天会话，存储于 `.cortex/sessions/{agentId}/`
- **Providers（模型提供方）**：支持 OpenAI、Anthropic、Ollama，通过统一接口 `IModelProvider` 实现

## 关键开发模式

### 类型系统
- 所有类型定义在 types，并有对应 Zod schema 校验
- 错误处理采用 `Result<T, E>` 模式：`{ success: boolean; data?: T; error?: E }`
- 类型统一从 index.ts 导入

### 存储模式
```typescript
// 文件操作始终使用 StorageManager
const result = await storageManager.writeJson('path', data);
if (!result.success) {
  // 错误处理
}
```

### 管理器初始化
所有管理器在使用前需显式初始化：
```typescript
await storageManager.initialize();
await providerManager.initialize(settings);
await sessionManager.initialize();
```

### OpenAI Agents SDK 集成
- 实际 AI 对话通过 `@openai/agents` 的 `run()` 函数实现
- 智能体配置在 `AgentFactory` 中转为 SDK `Agent` 实例
- Provider 抽象允许在 OpenAI/Anthropic/Ollama 之间切换

## 构建与测试命令

```bash
# 开发模式（热重载）
npm run dev

# 生产构建（含 TypeScript 检查）
npm run build

# 测试（使用 Vitest）
npm run test         # 单次运行
npm run test:watch   # 监听模式
npm run test:ui      # UI 模式
```

## 文件模式

### 配置文件
- package.json：依赖 `@openai/agents` SDK，UI 用 React，测试用 Vitest
- esbuild.config.mjs：打包为 main.js，Obsidian 相关依赖外部化
- tsconfig.json：路径别名（`@/*` → `src/*`）便于导入

### 源码结构
- types：类型定义及 Zod schema
- `src/{component}/index.ts`：统一导出，便于清晰导入
- test：单元测试，Vitest + mock 辅助
- 数据存储于 `.cortex/` 目录（插件文件夹外）

## 常见坑

### 存储初始化
StorageManager 必须最先初始化——它会创建所需目录。

### Provider 配置
Provider 设置全局管理，但实例创建在每个 agent 级别。创建 agent 前需检查 provider 可用性。

### React 集成
插件使用 React 19 及现代 JSX 转换。UI 组件需正确导入。

### OpenAI SDK 依赖
版本需严格固定：`@openai/agents@^0.0.11` 和 `zod@<=3.25.67` 保证兼容。

## 扩展点

- **新增 Provider**：在 providers 实现 `IModelProvider` 接口
- **工具集成**：在 agent 配置中扩展工具定义
- **存储后端**：替换 `StorageManager` 实现，但需保持接口一致
- **UI 组件**：按现有模式添加 React 组件

## 测试策略

- 单元测试聚焦管理器逻辑与类型校验
- 使用如 `createTestInput()` 的辅助函数保证测试数据一致
- mock 存储操作与 provider 响应
- 覆盖核心业务逻辑，类型定义可不测