import type { Model, ModelProvider as AgentModelProvider } from '@openai/agents-core';
import type { ModelProvider, ProviderConfig, ProviderStatus } from '../types/provider';

/**
 * 基础Provider接口
 */
export interface IModelProvider {
  readonly config: ProviderConfig;
  readonly provider: ModelProvider;
  
  /**
   * 获取Provider状态
   */
  getStatus(): Promise<ProviderStatus>;
  
  /**
   * 初始化Provider
   */
  initialize(): Promise<void>;
  
  /**
   * 获取模型实例 - 实现 AgentModelProvider 接口
   */
  getModel(modelName?: string): Promise<Model> | Model;
  
  /**
   * 验证配置是否有效
   */
  validateConfig(): Promise<boolean>;
  
  /**
   * 测试连接
   */
  testConnection(): Promise<boolean>;
  
  /**
   * 销毁资源
   */
  dispose(): Promise<void>;
}

/**
 * 抽象基础Provider类
 */
export abstract class BaseProvider implements IModelProvider, AgentModelProvider {
  protected _config: ProviderConfig;
  protected _initialized = false;

  constructor(config: ProviderConfig) {
    this._config = config;
  }

  get config(): ProviderConfig {
    return this._config;
  }

  get provider(): ModelProvider {
    return this._config.providerType;
  }

  abstract initialize(): Promise<void>;
  abstract getModel(modelName?: string): Promise<Model> | Model;
  abstract validateConfig(): Promise<boolean>;
  abstract testConnection(): Promise<boolean>;

  async getStatus(): Promise<ProviderStatus> {
    try {
      const isConnected = await this.testConnection();
      return {
        providerId: this._config.id,
        status: isConnected ? 'connected' : 'disconnected',
        error: undefined,
      };
    } catch (error) {
      return {
        providerId: this._config.id,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async dispose(): Promise<void> {
    this._initialized = false;
  }

  protected ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error(`Provider ${this.provider} not initialized. Call initialize() first.`);
    }
  }
}
