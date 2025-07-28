import type { ModelProvider, ProviderConfig, GlobalProviderSettings, ProviderStatus } from '../types/provider';
import type { IModelProvider } from './base';
import { ProviderFactory } from './provider-factory';

/**
 * ProviderManager - 负责管理所有Provider实例的生命周期
 */
export class ProviderManager {
  private _providers: Map<ModelProvider, IModelProvider> = new Map();
  private _globalSettings: GlobalProviderSettings | null = null;
  private _defaultProvider: ModelProvider | null = null;

  /**
   * 初始化ProviderManager
   */
  async initialize(settings: GlobalProviderSettings): Promise<void> {
    this._globalSettings = settings;
    this._defaultProvider = settings.defaultProvider || null;

    // 初始化所有启用的providers
    for (const [providerType, config] of Object.entries(settings.providers)) {
      if (config.enabled) {
        try {
          const provider = ProviderFactory.createProvider(config);
          await provider.initialize();
          this._providers.set(providerType as ModelProvider, provider);
        } catch (error) {
          console.error(`Failed to initialize provider ${providerType}:`, error);
        }
      }
    }
  }

  /**
   * 获取Provider实例
   */
  getProvider(providerType?: ModelProvider): IModelProvider | null {
    const targetProvider = providerType || this._defaultProvider;
    if (!targetProvider) {
      return null;
    }
    return this._providers.get(targetProvider) || null;
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

    // 更新全局设置
    if (this._globalSettings) {
      this._globalSettings.providers[config.provider] = config;
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

    // 从全局设置中移除
    if (this._globalSettings) {
      delete this._globalSettings.providers[providerType];
    }

    // 如果移除的是默认provider，清除默认设置
    if (this._defaultProvider === providerType) {
      this._defaultProvider = null;
      if (this._globalSettings) {
        this._globalSettings.defaultProvider = undefined;
      }
    }
  }

  /**
   * 设置默认Provider
   */
  setDefaultProvider(providerType: ModelProvider): void {
    if (!this._providers.has(providerType)) {
      throw new Error(`Provider ${providerType} is not available`);
    }
    
    this._defaultProvider = providerType;
    if (this._globalSettings) {
      this._globalSettings.defaultProvider = providerType;
    }
  }

  /**
   * 获取默认Provider
   */
  getDefaultProvider(): ModelProvider | null {
    return this._defaultProvider;
  }

  /**
   * 获取所有Provider的状态
   */
  async getProvidersStatus(): Promise<Map<ModelProvider, ProviderStatus>> {
    const statusMap = new Map<ModelProvider, ProviderStatus>();

    for (const [providerType, provider] of this._providers) {
      try {
        const status = await provider.getStatus();
        statusMap.set(providerType, status);
      } catch (error) {
        statusMap.set(providerType, {
          provider: providerType,
          status: 'error',
          lastChecked: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return statusMap;
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
   * 重新加载Provider
   */
  async reloadProvider(providerType: ModelProvider): Promise<void> {
    if (!this._globalSettings) {
      throw new Error('ProviderManager not initialized');
    }

    const config = this._globalSettings.providers[providerType];
    if (!config) {
      throw new Error(`Provider ${providerType} not found in settings`);
    }

    await this.addProvider(config);
  }

  /**
   * 获取全局设置
   */
  getGlobalSettings(): GlobalProviderSettings | null {
    return this._globalSettings;
  }

  /**
   * 销毁所有Provider
   */
  async dispose(): Promise<void> {
    for (const provider of this._providers.values()) {
      await provider.dispose();
    }
    this._providers.clear();
    this._globalSettings = null;
    this._defaultProvider = null;
  }
}
