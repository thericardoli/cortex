---
id: provider
entry: src/providers/index.ts
exports: [ProviderManager, ProviderFactory, IModelProvider, BaseProvider, OpenAIProvider, OpenAICompatibleProvider, OllamaProvider]
deps: [@openai/agents-core, @openai/agents-openai, openai, zod]
env: []
examples: [src/test/openai-compatible.test.ts]
tests: [src/test/openai-compatible.test.ts]
status: stable
last_reviewed: 2025-07-31
---

# Provider 模块

## 它做什么（What）

Provider 模块负责管理AI模型提供商的抽象与统一接口，支持OpenAI、OpenAI兼容服务（如OpenRouter）和Ollama本地模型。它将不同的AI服务统一包装为符合OpenAI Agents SDK要求的ModelProvider接口，提供配置验证、连接管理、状态监控等功能，使Agent能够无缝切换不同的模型提供商。

## 如何用（How - 最小可运行示例）

```typescript
import { ProviderManager, ProviderFactory } from '@/providers';
import type { ProviderConfig } from '@/types/provider';

// 1. 初始化ProviderManager（简化版，不需要全局设置）
const providerManager = new ProviderManager();
await providerManager.initialize();

// 2. 配置并添加Provider
const openaiConfig: ProviderConfig = {
  provider: 'OpenAI',
  apiKey: 'your-openai-api-key',
  baseUrl: 'https://api.openai.com/v1', // 可选
  enabled: true
};

const ollamaConfig: ProviderConfig = {
  provider: 'Ollama',
  baseUrl: 'http://localhost:11434/v1', // 默认地址
  apiKey: 'ollama', // Ollama不需要真实API key
  enabled: true
};

// 3. 添加Provider到管理器
await providerManager.addProvider(openaiConfig);
await providerManager.addProvider(ollamaConfig);

// 4. 获取并使用Provider（必须指定类型）
const openaiProvider = providerManager.getProvider('OpenAI');
const ollamaProvider = providerManager.getProvider('Ollama');

if (openaiProvider) {
  const gpt4Model = await openaiProvider.getModel('gpt-4'); // 用于OpenAI Agents SDK
}

if (ollamaProvider) {
  const qwenModel = await ollamaProvider.getModel('qwen3:8b'); // 本地Ollama模型
}

// 5. 检查连接状态
const isOpenAIConnected = await providerManager.testProvider('OpenAI');
const isOllamaConnected = await providerManager.testProvider('Ollama');
console.log('连接状态:', { openai: isOpenAIConnected, ollama: isOllamaConnected });
```

## 关键接口 / 函数（API）

### ProviderManager

* **`initialize(): Promise<void>`** - 初始化管理器（简化版，不需要参数）
* **`getProvider(providerType: ModelProvider): IModelProvider | null`** - 获取指定类型的provider实例，必须指定providerType
* **`getAvailableProviders(): ModelProvider[]`** - 获取所有已注册的provider类型列表
* **`addProvider(config: ProviderConfig): Promise<void>`** - 添加或更新provider配置，会自动验证并初始化
* **`removeProvider(providerType: ModelProvider): Promise<void>`** - 移除provider并清理资源
* **`isProviderAvailable(providerType: ModelProvider): boolean`** - 检查指定provider是否已注册并可用
* **`getProviderStatus(providerType: ModelProvider): Promise<ProviderStatus | null>`** - 获取指定provider的状态信息
* **`getAllProviderStatuses(): Promise<ProviderStatus[]>`** - 获取所有provider的状态信息
* **`testProvider(providerType: ModelProvider): Promise<boolean>`** - 测试指定provider的连接状态

### ProviderFactory

* **`createProvider(config: ProviderConfig): IModelProvider`** - 根据配置创建provider实例
* **`validateProviderConfig(config: ProviderConfig): {valid: boolean, errors: string[]}`** - 验证provider配置的有效性
* **`getSupportedProviders(): ModelProvider[]`** - 获取支持的provider类型列表：['OpenAI', 'OpenAICompatible', 'Ollama']
* **`getDefaultConfig(provider: ModelProvider): Partial<ProviderConfig>`** - 获取指定provider类型的默认配置模板

### IModelProvider接口（实现AgentModelProvider）

* **`initialize(): Promise<void>`** - 初始化provider连接
* **`getModel(modelName?: string): Promise<Model> | Model`** - 获取模型实例，返回符合OpenAI Agents SDK的Model对象
* **`validateConfig(): Promise<boolean>`** - 验证当前配置是否有效
* **`testConnection(): Promise<boolean>`** - 测试API连接可用性
* **`getStatus(): Promise<ProviderStatus>`** - 获取当前状态（connected/disconnected/error）
* **`dispose(): Promise<void>`** - 清理资源和连接

## 常见坑 / 注意事项（Pitfalls）

* **初始化顺序**：必须先调用`ProviderManager.initialize()`再添加providers，然后才能使用`getProvider()`方法
* **Provider类型必须指定**：与旧版本不同，`getProvider()`现在必须明确指定providerType，不再支持默认provider概念
* **API密钥和URL要求**：OpenAI需要apiKey，OpenAICompatible需要baseUrl和apiKey，Ollama可以使用默认配置但建议指定baseUrl
* **Ollama本地依赖**：Ollama provider需要本地运行Ollama服务（默认http://localhost:11434），确保服务启动且模型已下载
* **模型名称格式**：OpenAI使用标准模型名（如'gpt-4'），Ollama使用格式'model:tag'（如'qwen3:8b'）
* **连接测试异步**：所有连接测试都是异步的，需要await，失败时返回false而非抛出异常
* **资源清理**：使用完毕后调用`dispose()`释放连接，特别是在程序退出或重新配置时
* **配置验证时机**：addProvider()会自动验证配置，无效配置会立即抛出错误而不是静默失败
* **Agent SDK兼容性**：所有provider都实现了AgentModelProvider接口，确保与OpenAI Agents SDK的兼容性

## 内部实现摘要（Internals）

核心采用工厂模式 + 管理器模式实现provider抽象，与OpenAI Agents SDK深度集成：

**数据流**：`ProviderConfig → ProviderManager → ProviderFactory → IModelProvider → @openai/agents-openai → OpenAI Agents SDK`

* **简化的管理器设计**：ProviderManager不再维护全局设置，改为动态添加/移除providers，每个provider独立配置和初始化
* **AgentModelProvider实现**：所有provider都实现了OpenAI Agents SDK的ModelProvider接口，确保无缝集成
* **BaseProvider抽象层**：提供通用的状态管理、错误处理和生命周期方法，子类只需实现特定的API调用逻辑
* **多Provider支持**：OpenAIProvider直接使用官方SDK，OpenAICompatibleProvider支持OpenRouter等服务，OllamaProvider通过自定义OpenAI客户端实现本地模型访问
* **配置验证机制**：使用Zod schema确保类型安全，ProviderFactory在创建前验证所有必需字段
* **连接管理**：每个provider独立管理连接状态，支持热重载和错误恢复

关键扩展点：添加新provider类型需要：1）实现IModelProvider接口，2）在ProviderFactory中注册，3）更新ModelProvider枚举类型。

## 相关文件 / 链接（Files & Links）

* `src/providers/index.ts` - 模块统一导出入口
* `src/providers/base.ts` - IModelProvider接口定义和BaseProvider抽象类
* `src/providers/provider-manager.ts` - ProviderManager核心管理器实现
* `src/providers/provider-factory.ts` - Provider工厂类，负责创建和验证
* `src/providers/openai.ts` - OpenAI官方API provider实现
* `src/providers/openai-compatible.ts` - OpenAI兼容服务provider实现
* `src/providers/ollama.ts` - Ollama本地模型provider实现
* `src/types/provider.ts` - Provider相关类型定义和Zod schemas
* `src/test/openai-compatible.test.ts` - Provider单元测试示例

## TODO / 信息缺口

* 需要补充Anthropic provider的实现和文档
* 缺少ProviderManager的完整集成测试覆盖
* 模型能力查询（ProviderCapabilities）的具体使用场景待完善
* Ollama provider的错误重试机制需要优化
* 需要添加provider切换时的状态迁移文档
