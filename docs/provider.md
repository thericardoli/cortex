---
id: provider
entry: src/providers/index.ts
exports: [ProviderManager, ProviderFactory, IModelProvider, BaseProvider, OpenAIProvider, OpenAICompatibleProvider]
deps: [@openai/agents, @openai/agents-openai, zod]
env: []
examples: [src/test/openai-compatible.test.ts]
tests: [src/test/openai-compatible.test.ts]
status: stable
last_reviewed: 2025-07-28
---

# Provider 模块

## 它做什么（What）

Provider 模块负责管理AI模型提供商的抽象与统一接口，支持OpenAI和OpenAI兼容的服务（如OpenRouter、Ollama）。它提供了配置验证、连接管理、状态监控等功能，将不同的AI服务统一为标准的模型提供者接口，供Agent使用。

## 如何用（How - 最小可运行示例）

```typescript
import { ProviderManager, ProviderFactory } from '@/providers';
import type { GlobalProviderSettings } from '@/types/provider';

// 1. 配置Provider设置
const settings: GlobalProviderSettings = {
  providers: {
    'OpenAI': {
      provider: 'OpenAI',
      apiKey: 'your-openai-api-key',
      baseUrl: 'https://api.openai.com/v1',
      enabled: true
    },
    'OpenAICompatible': {
      provider: 'OpenAICompatible', 
      apiKey: 'your-openrouter-key',
      baseUrl: 'https://openrouter.ai/api/v1',
      enabled: true
    }
  },
  defaultProvider: 'OpenAI'
};

// 2. 初始化ProviderManager
const providerManager = new ProviderManager();
await providerManager.initialize(settings);

// 3. 获取并使用Provider
const provider = providerManager.getProvider(); // 获取默认provider
const model = await provider.getModel('gpt-4'); // 获取模型实例

// 4. 检查连接状态
const isConnected = await providerManager.testProvider('OpenAI');
console.log('OpenAI连接状态:', isConnected);
```

## 关键接口 / 函数（API）

### ProviderManager

* **`initialize(settings: GlobalProviderSettings): Promise<void>`** - 初始化管理器，加载所有启用的providers
* **`getProvider(providerType?: ModelProvider): IModelProvider | null`** - 获取指定或默认的provider实例
* **`addProvider(config: ProviderConfig): Promise<void>`** - 添加或更新provider配置
* **`removeProvider(providerType: ModelProvider): Promise<void>`** - 移除provider并清理资源
* **`testProvider(providerType: ModelProvider): Promise<boolean>`** - 测试provider连接状态
* **`getProvidersStatus(): Promise<Map<ModelProvider, ProviderStatus>>`** - 获取所有providers的状态信息

### ProviderFactory

* **`createProvider(config: ProviderConfig): IModelProvider`** - 根据配置创建provider实例
* **`validateProviderConfig(config: ProviderConfig): {valid: boolean, errors: string[]}`** - 验证provider配置的有效性
* **`getSupportedProviders(): ModelProvider[]`** - 获取支持的provider类型列表

### IModelProvider接口

* **`initialize(): Promise<void>`** - 初始化provider连接
* **`getModel(modelName?: string): Promise<Model>`** - 获取模型实例，用于OpenAI Agents SDK
* **`testConnection(): Promise<boolean>`** - 测试API连接可用性
* **`getStatus(): Promise<ProviderStatus>`** - 获取当前状态（connected/disconnected/error）

## 常见坑 / 注意事项（Pitfalls）

* **初始化顺序**：必须先调用`ProviderManager.initialize()`后才能使用其他方法，否则会返回null或抛出错误
* **API密钥管理**：OpenAI需要apiKey，OpenAICompatible需要baseUrl，缺失会导致初始化失败
* **错误处理**：provider初始化失败不会中断整个管理器，但该provider会不可用
* **资源清理**：使用完毕后需调用`dispose()`释放连接资源
* **默认Provider**：如果默认provider不可用，`getProvider()`会返回null而非抛出异常
* **配置验证**：addProvider前会自动验证配置，无效配置会抛出详细错误信息

## 内部实现摘要（Internals）

核心采用工厂模式 + 管理器模式实现provider抽象：

**数据流**：`GlobalProviderSettings → ProviderManager → ProviderFactory → IModelProvider → OpenAI Agents SDK`

* **BaseProvider抽象类**：实现了通用的状态管理、错误处理和生命周期方法
* **具体Provider实现**：OpenAIProvider和OpenAICompatibleProvider继承BaseProvider，实现特定的API调用逻辑
* **ProviderManager状态管理**：维护providers的Map集合，支持动态添加/移除，提供统一的访问入口
* **配置验证机制**：使用Zod schema确保类型安全，ProviderFactory提供配置验证逻辑
* **错误恢复**：单个provider失败不影响其他providers，支持重新加载失败的provider

关键扩展点：添加新provider类型只需实现IModelProvider接口并在ProviderFactory中注册。

## 相关文件 / 链接（Files & Links）

* `src/providers/index.ts` - 模块统一导出入口
* `src/providers/base.ts` - IModelProvider接口定义和BaseProvider抽象类
* `src/providers/provider-manager.ts` - ProviderManager核心管理器实现
* `src/providers/provider-factory.ts` - Provider工厂类，负责创建和验证
* `src/providers/openai.ts` - OpenAI官方API provider实现
* `src/providers/openai-compatible.ts` - OpenAI兼容服务provider实现
* `src/types/provider.ts` - Provider相关类型定义和Zod schemas
* `src/test/openai-compatible.test.ts` - Provider单元测试示例

## TODO / 信息缺口

* 需要补充Anthropic、Ollama等其他provider的实现示例
* 缺少ProviderManager的完整集成测试
* 需要补充错误重试和连接池机制的说明
* 模型能力查询（ModelInfo）的具体使用场景待完善
