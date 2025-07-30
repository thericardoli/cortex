import type { ModelProvider, ProviderConfig, ProviderStatus } from '../types/provider';
import type { IModelProvider } from './base';
import { ProviderFactory } from './provider-factory';

/**
 * ProviderManager - 负责管理所有Provider实例的生命周期
 */
export class ProviderManager {
  private _providers: Map<ModelProvider, IModelProvider> = new Map();

  /**
   * 初始化ProviderManager（现在不需要参数）
   */
  async initialize(): Promise<void> {}

  /**
   * 获取Provider实例
   */
  getProvider(providerType: ModelProvider): IModelProvider | null {
    return this._providers.get(providerType) || null;
  }

  /**
   * 获取所有可用的Provider
   */
  getAvailableProviders(): ModelProvider[] {
    return Array.from(this._providers.keys());
  }

  /**
   * 添加或更新Provider
   */
  async addProvider(config: ProviderConfig): Promise<void> {
    // 验证配置
    const validation = ProviderFactory.validateProviderConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid provider config: ${validation.errors.join(', ')}`);
    }

    // 移除旧的provider（如果存在）
    await this.removeProvider(config.provider);

    // 创建并初始化新provider
    if (config.enabled) {
      const provider = ProviderFactory.createProvider(config);
      await provider.initialize();
      this._providers.set(config.provider, provider);
    }
  }

  /**
   * 移除Provider
   */
  async removeProvider(providerType: ModelProvider): Promise<void> {
    const provider = this._providers.get(providerType);
    if (provider) {
      await provider.dispose();
      this._providers.delete(providerType);
    }
  }

  /**
   * 检查Provider是否可用
   */
  isProviderAvailable(providerType: ModelProvider): boolean {
    return this._providers.has(providerType);
  }

  /**
   * 获取Provider状态
   */
  async getProviderStatus(providerType: ModelProvider): Promise<ProviderStatus | null> {
    const provider = this._providers.get(providerType);
    if (!provider) {
      return {
        provider: providerType,
        status: 'disconnected',
        error: 'Provider not found',
      };
    }

    try {
      return await provider.getStatus();
    } catch (error) {
      return {
        provider: providerType,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 测试Provider连接
   */
  async testProvider(providerType: ModelProvider): Promise<boolean> {
    const provider = this._providers.get(providerType);
    if (!provider) {
      return false;
    }

    try {
      return await provider.testConnection();
    } catch {
      return false;
    }
  }

  /**
   * 清理所有Provider
   */
  async dispose(): Promise<void> {
    for (const provider of this._providers.values()) {
      await provider.dispose();
    }
    this._providers.clear();
  }
}
