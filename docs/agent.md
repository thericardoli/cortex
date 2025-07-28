---
id: agent
entry: src/agent/index.ts
exports: [AgentManager, agentManager, AgentFactory, AgentConfig, CreateAgentInput, UpdateAgentInput, ToolConfig, GuardrailConfig, MCPServerConfig, ModelSettings, ModelConfig, HandoffConfig, Instructions, OutputType, ToolUseBehavior]
deps: [@openai/agents, events, crypto, zod]
env: []
examples: []
tests: [src/test/agent-manager.test.ts]
status: experimental
last_reviewed: 2025-07-28
---

# Agent 模块

## 它做什么（What）

Agent 模块为 Cortex 插件提供 AI Agent 的完整生命周期管理，负责配置验证、SDK 实例创建、持久化存储和事件通知。它将自定义的 AgentConfig 格式转换为 OpenAI Agent SDK 兼容格式，支持工具集成、防护栏配置、MCP 服务器集成和 Agent 间切换等高级特性。

## 如何用（How - 最小可运行示例）

```typescript
import { agentManager, AgentFactory } from './src/agent';
import type { CreateAgentInput } from './src/agent';

// 创建 Agent 配置
const agentInput: CreateAgentInput = {
  name: 'Chat Assistant',
  instructions: 'You are a helpful assistant that answers questions clearly.',
  modelConfig: {
    provider: 'OpenAI',
    model: 'gpt-4',
    settings: {
      temperature: 0.7,
      maxTokens: 1000
    }
  },
  tools: [],
  resetToolChoice: true,
  inputGuardrails: [],
  outputGuardrails: [],
  mcpServers: []
};

// 创建 Agent
const agent = await agentManager.createAgent(agentInput);
console.log('Created agent:', agent.id);

// 获取 SDK 实例
const agentInstance = await agentManager.getAgentInstance(agent.id);

// 导出配置
const exportedConfig = agentManager.exportAgentConfig(agent.id);
```

## 关键接口 / 函数（API）

### AgentManager 类
- **`createAgent(input: CreateAgentInput): Promise<AgentConfig>`** - 创建新 Agent，自动分配 ID 和时间戳，验证配置
- **`updateAgent(agentId: string, updates: UpdateAgentInput): Promise<AgentConfig>`** - 更新现有 Agent，保持创建时间不变
- **`deleteAgent(agentId: string): Promise<void>`** - 删除 Agent 及其缓存实例
- **`getAgentInstance(agentId: string): Promise<Agent>`** - 获取 OpenAI Agent SDK 实例，支持缓存
- **`exportAgentConfig(agentId: string): string`** - 导出 Agent 配置为 JSON 字符串
- **`importAgentConfig(jsonConfig: string): Promise<AgentConfig>`** - 从 JSON 导入 Agent 配置，自动生成新 ID
- **`cloneAgent(agentId: string, newName: string): Promise<AgentConfig>`** - 克隆现有 Agent 并使用新名称

### AgentFactory 类
- **`createAgentInstance(config: AgentConfig): Promise<Agent>`** - 静态方法，将 AgentConfig 转换为 OpenAI Agent SDK 实例
- **`validateForSDK(config: AgentConfig): {isValid: boolean, errors: string[], warnings: string[]}`** - 验证配置是否符合 SDK 要求

### 事件系统（AgentManagerEvents）
- `agent:created` - Agent 创建时触发
- `agent:updated` - Agent 更新时触发  
- `agent:deleted` - Agent 删除时触发
- `agent:imported` - Agent 导入时触发

## 常见坑 / 注意事项（Pitfalls）

- **配置验证失败**：Agent 名称和指令不能为空，模型配置必须完整。错误信息格式：`Agent configuration is not valid: Agent name is required`
- **SDK 兼容性警告**：配置了 MCP 工具但未设置 MCP 服务器时会产生警告，不会阻止创建但可能影响功能
- **实例缓存机制**：Agent 实例会被缓存以提升性能，配置更新时会自动清除相关缓存
- **导入冲突处理**：导入 Agent 时会自动生成新 ID 和时间戳，避免与现有 Agent 冲突
- **未实现功能**：工具创建、防护栏配置、MCP 服务器设置和存储持久化等功能目前返回占位符

## 内部实现摘要（Internals）

核心流程采用工厂模式 + 管理器模式：**AgentManager 负责生命周期管理 → AgentFactory 负责 SDK 转换 → OpenAI Agents SDK 执行**。

**关键设计要点**：
- 配置验证分层：Zod schema 验证 → SDK 兼容性验证 → 业务逻辑验证
- 实例缓存策略：Map 存储 Agent 实例，配置变更时自动失效
- 事件驱动架构：基于 EventEmitter 实现松耦合的组件通信
- 配置转换映射：AgentConfig 格式通过字段映射转换为 OpenAI Agent SDK 格式

**扩展点**：工具系统、防护栏系统、MCP 集成、存储层都预留了接口，当前使用占位符实现。

## 相关文件 / 链接（Files & Links）

**源码文件**：
- `src/agent/index.ts` - 模块导出入口，统一类型和实例导出
- `src/agent/agent-manager.ts` - Agent 生命周期管理，包含 CRUD 操作和事件处理
- `src/agent/agent-factory.ts` - Agent SDK 实例创建工厂，处理配置格式转换
- `src/types/agent.ts` - Agent 相关类型定义和 Zod 验证 schema

**测试文件**：
- `src/test/agent-manager.test.ts` - AgentManager 完整功能测试，覆盖创建、更新、删除、导入导出等

## TODO / 信息缺口

- **存储层集成**：`loadAgents()` 和 `saveAgents()` 方法待实现，需要配合 storage 模块
- **工具系统**：builtin、custom、hosted 工具创建逻辑待实现
- **防护栏系统**：输入输出防护栏配置和执行逻辑待实现
- **MCP 服务器集成**：MCP 服务器设置和工具注册逻辑待实现
- **Agent 切换功能**：handoffs 配置和执行逻辑待实现
- **完整示例**：实际 Agent 使用示例和最佳实践文档待补充
