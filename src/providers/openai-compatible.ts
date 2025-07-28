import type { Model } from '@openai/agents-core';
import { OpenAIProvider as AgentOpenAIProvider } from '@openai/agents-openai';
import { BaseProvider } from './base';

/**
 * OpenAI Compatible Provider
 */
export class OpenAICompatibleProvider extends BaseProvider {
  private _openaiProvider?: AgentOpenAIProvider;

  async initialize(): Promise<void> {
    if (!this.config.baseUrl) {
      throw new Error('Base URL is required for OpenAI Compatible provider');
    }

    // 创建自定义 OpenAI 客户端
    const customOpenAIClient = new (await import('openai')).OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });

    console.log('🔧 初始化 OpenAI Compatible Provider:', { 
      baseUrl: this.config.baseUrl, 
      apiKey: this.config.apiKey?.substring(0, 10) + '...' 
    });

    // 测试连接
    try {
      const models = await customOpenAIClient.models.list();
      console.log('✅ OpenAI Compatible Provider 连接测试成功，模型数量:', models.data.length);
    } catch (error) {
      console.error('❌ OpenAI Compatible Provider 连接测试失败:', error instanceof Error ? error.message : String(error));
      throw error;
    }

    // 使用 Chat Completions API 而不是 Responses API
    this._openaiProvider = new AgentOpenAIProvider({
      openAIClient: customOpenAIClient,
      useResponses: false,  // 关键：强制使用 Chat Completions API
    });

    console.log('✅ AgentOpenAIProvider (OpenAI Compatible) 初始化完成');
    this._initialized = true;
  }

  getModel(modelName?: string): Promise<Model> {
    this.ensureInitialized();
    if (!this._openaiProvider) {
      throw new Error('OpenAI Compatible provider not initialized');
    }
    return this._openaiProvider.getModel(modelName);
  }

  async validateConfig(): Promise<boolean> {
    return !!(this.config.baseUrl);
  }

  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      await this.getModel();
      return true;
    } catch {
      return false;
    }
  }
}
