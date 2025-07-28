import type { Model } from '@openai/agents-core';
import { BaseProvider } from './base';
import { OpenAIProvider as AgentOpenAIProvider } from '@openai/agents-openai';

/**
 * OpenAI Provider
 */
export class OpenAIProvider extends BaseProvider {
  private _openaiProvider?: AgentOpenAIProvider;

  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this._openaiProvider = new AgentOpenAIProvider({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });

    this._initialized = true;
  }

  getModel(modelName?: string): Promise<Model> {
    this.ensureInitialized();
    if (!this._openaiProvider) {
      throw new Error('OpenAI provider not initialized');
    }
    return this._openaiProvider.getModel(modelName);
  }

  async validateConfig(): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        return false;
      }
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
    } catch {
      return false;
    }
  }
}
