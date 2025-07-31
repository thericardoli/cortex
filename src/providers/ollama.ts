import type { Model } from '@openai/agents-core';
import { OpenAIProvider as AgentOpenAIProvider } from '@openai/agents-openai';
import { BaseProvider } from './base';

/**
 * Ollama Provider - OpenAI Compatible
 */
export class OllamaProvider extends BaseProvider {
  private _openaiProvider?: AgentOpenAIProvider;

  async initialize(): Promise<void> {
    // Ollama 默认地址
    const baseUrl = this.config.baseUrl || 'http://localhost:11434/v1';
    
    // Ollama 不需要 API Key，但某些情况下可能需要
    const apiKey = this.config.apiKey || 'ollama';

    console.log('🔧 初始化 Ollama Provider:', { baseUrl, apiKey });

    // 创建自定义 OpenAI 客户端
    const customOpenAIClient = new (await import('openai')).OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    });

    // 测试连接
    try {
      const models = await customOpenAIClient.models.list();
      console.log('✅ OllamaProvider 连接测试成功，模型数量:', models.data.length);
    } catch (error) {
      console.error('❌ OllamaProvider 连接测试失败:', error instanceof Error ? error.message : String(error));
      throw error;
    }

    // 正确的方式：传递 openAIClient 并强制使用 Chat Completions API
    this._openaiProvider = new AgentOpenAIProvider({
      openAIClient: customOpenAIClient,
      useResponses: false,  // 强制使用 Chat Completions API 而不是 Responses API
    });
    this._initialized = true;
  }

  getModel(modelName?: string): Promise<Model> {
    this.ensureInitialized();
    if (!this._openaiProvider) {
      throw new Error('Ollama provider not initialized');
    }
    
    const model = modelName;
    return this._openaiProvider.getModel(model);
  }

  async validateConfig(): Promise<boolean> {
    // Ollama 配置相对简单，主要检查 baseUrl 格式
    const baseUrl = this.config.baseUrl || 'http://localhost:11434/v1';
    try {
      new URL(baseUrl);
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      await this.getModel();
      return true;
    } catch (error) {
      console.error('Ollama connection test failed:', error);
      return false;
    }
  }
}
