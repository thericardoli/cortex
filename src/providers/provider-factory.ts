import type { ModelProvider, ProviderConfig } from '../types/provider';
import type { IModelProvider } from './base';
import { OpenAIProvider } from './openai';
import { OpenAICompatibleProvider } from './openai-compatible';

/**
 * 根据配置创建对应的Provider实例
 */
export class ProviderFactory {
  /**
   * 创建Provider实例
   */
  static createProvider(config: ProviderConfig): IModelProvider {
    switch (config.providerType) {
      case 'OpenAI':
        return new OpenAIProvider(config);
      
      case 'OpenAICompatible':
        return new OpenAICompatibleProvider(config);
      
      default:
        throw new Error(`Unsupported provider: ${config.providerType as string}`);
    }
  }

  /**
   * 验证Provider配置
   */
  static validateProviderConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 通用验证
    if (!config.id || !config.id.trim()) {
      errors.push('Provider ID is required');
    }
    
    if (!config.name || !config.name.trim()) {
      errors.push('Provider name is required');
    }

    if (!config.enabled) {
      // 如果provider被禁用，不需要进一步验证
      return { valid: true, errors: [] };
    }

    // 特定Provider验证
    switch (config.providerType) {
      case 'OpenAI':
        if (!config.apiKey) {
          errors.push('OpenAI API key is required');
        }
        break;

      case 'OpenAICompatible':
        if (!config.baseUrl) {
          errors.push('Base URL is required');
        }
        if (!config.apiKey) {
          errors.push('API key is required');
        }
        break;

      default:
        errors.push(`Unknown provider: ${config.providerType as string}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取Provider的默认配置模板
   */
  static getDefaultConfig(providerType: ModelProvider, id?: string): Partial<ProviderConfig> {
    const baseConfig: Partial<ProviderConfig> = {
      providerType,
      enabled: true,
    };

    if (id) baseConfig.id = id;

    switch (providerType) {
      case 'OpenAI':
        return {
          ...baseConfig,
          baseUrl: 'https://api.openai.com/v1',
        };

      case 'OpenAICompatible':
        return {
          ...baseConfig,
          baseUrl: '',
        };

      default:
        return baseConfig;
    }
  }

  /**
   * 创建完整的Provider配置
   */
  static createProviderConfig(
    providerType: ModelProvider,
    id: string,
    name: string,
    options: Partial<ProviderConfig> = {}
  ): ProviderConfig {
    const defaultConfig = this.getDefaultConfig(providerType, id);
    return {
      id,
      providerType,
      name,
      enabled: true,
      ...defaultConfig,
      ...options,
    } as ProviderConfig;
  }
}
