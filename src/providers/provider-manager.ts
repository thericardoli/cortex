import type { ProviderConfig, ProviderStatus } from '../types/provider';
import type { IModelProvider } from './base';
import { ProviderFactory } from './provider-factory';

/**
 * ProviderManager - 负责管理所有Provider实例的生命周期
 */
export class ProviderManager {
  private _providers: Map<string, IModelProvider> = new Map(); // key: provider id

  /**
   * 初始化ProviderManager（现在不需要参数）
   */
  async initialize(): Promise<void> {}

  /**
   * 获取Provider实例
   */
  getProvider(providerId: string): IModelProvider | null {
    return this._providers.get(providerId) || null;
  }

  /**
   * 获取所有可用的Provider
   */
  getAvailableProviders(): string[] {
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
    await this.removeProvider(config.id);

    // 创建并初始化新provider
    if (config.enabled) {
      const provider = ProviderFactory.createProvider(config);
      await provider.initialize();
      this._providers.set(config.id, provider);
    }
  }

  /**
   * 移除Provider
   */
  async removeProvider(providerId: string): Promise<void> {
    const provider = this._providers.get(providerId);
    if (provider) {
      await provider.dispose();
      this._providers.delete(providerId);
    }
  }

  /**
   * 检查Provider是否可用
   */
  isProviderAvailable(providerId: string): boolean {
    return this._providers.has(providerId);
  }

  /**
   * 获取Provider状态
   */
  async getProviderStatus(providerId: string): Promise<ProviderStatus | null> {
    const provider = this._providers.get(providerId);
    if (!provider) {
      return null;
    }
    try {
      return await provider.getStatus();
    } catch (error) {
      return null;
    }
  }

  /**
   * 测试Provider连接
   */
  async testProvider(providerId: string): Promise<boolean> {
    const provider = this._providers.get(providerId);
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
