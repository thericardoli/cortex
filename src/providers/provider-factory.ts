import type { ModelProvider, ProviderConfig } from '../types/provider';
import type { IModelProvider } from './base';
import { OpenAIProvider } from './openai';
import { OpenAICompatibleProvider } from './openai-compatible';
import { OllamaProvider } from './ollama';

/**
 * 根据配置创建对应的Provider实例
 */
export class ProviderFactory {
  /**
   * 创建Provider实例
   */
  static createProvider(config: ProviderConfig): IModelProvider {
    switch (config.provider) {
      case 'OpenAI':
        return new OpenAIProvider(config);

      case 'Ollama':
        return new OllamaProvider(config);
      
      case 'OpenAICompatible':
        return new OpenAICompatibleProvider(config);
      
      default:
        throw new Error(`Unsupported provider: ${config.provider as string}`);
    }
  }

  /**
   * 验证Provider配置
   */
  static validateProviderConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 通用验证
    if (!config.provider) {
      errors.push('Provider type is required');
    }

    if (!config.enabled) {
      // 如果provider被禁用，不需要进一步验证
      return { valid: true, errors: [] };
    }

    // 特定Provider验证
    switch (config.provider) {
      case 'OpenAI':
        if (!config.apiKey) {
          errors.push('OpenAI API key is required');
        }
        break;

      case 'OpenAICompatible':
        if (!config.baseUrl) {
          errors.push('Base URL is required for OpenAI Compatible provider');
        }
        break;

      case 'Ollama':
        // Ollama 可以使用默认配置，但如果提供了 baseUrl 需要验证格式
        if (config.baseUrl) {
          try {
            new URL(config.baseUrl);
          } catch {
            errors.push('Invalid base URL format for Ollama provider');
          }
        }
        break;

      default:
        errors.push(`Unknown provider: ${config.provider as string}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取支持的Provider列表
   */
  static getSupportedProviders(): ModelProvider[] {
    return ['OpenAI', 'OpenAICompatible', 'Ollama'];
  }

  /**
   * 获取Provider的默认配置
   */
  static getDefaultConfig(provider: ModelProvider): Partial<ProviderConfig> {
    const baseConfig = {
      provider,
      enabled: true,
    };

    switch (provider) {
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

      case 'Ollama':
        return {
          ...baseConfig,
          baseUrl: 'http://localhost:11434/v1',
          apiKey: 'ollama',
        };

      default:
        return baseConfig;
    }
  }
}
