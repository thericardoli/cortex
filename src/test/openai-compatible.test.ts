import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAICompatibleProvider } from '../providers/openai-compatible';
import type { ProviderConfig } from '../types/provider';

// Mock the OpenAI agents package
vi.mock('@openai/agents-openai', () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => ({
    getModel: vi.fn().mockResolvedValue({}),
  })),
}));

describe('OpenAICompatibleProvider', () => {
  let provider: OpenAICompatibleProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      provider: 'OpenAICompatible',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
      enabled: true,
    };
    provider = new OpenAICompatibleProvider(config);
  });

  describe('初始化', () => {
    it('应该成功初始化', async () => {
      await expect(provider.initialize()).resolves.not.toThrow();
    });

    it('缺少 baseUrl 时应该抛出错误', async () => {
      const invalidConfig = { ...config, baseUrl: undefined };
      const invalidProvider = new OpenAICompatibleProvider(invalidConfig);
      
      await expect(invalidProvider.initialize()).rejects.toThrow('Base URL is required for OpenAI Compatible provider');
    });
  });

  describe('配置验证', () => {
    it('有效配置应该返回 true', async () => {
      const result = await provider.validateConfig();
      expect(result).toBe(true);
    });

    it('缺少 baseUrl 的配置应该返回 false', async () => {
      const invalidConfig = { ...config, baseUrl: undefined };
      const invalidProvider = new OpenAICompatibleProvider(invalidConfig);
      
      const result = await invalidProvider.validateConfig();
      expect(result).toBe(false);
    });
  });

  describe('模型获取', () => {
    it('初始化后应该能获取模型', async () => {
      await provider.initialize();
      const model = await provider.getModel();
      expect(model).toBeDefined();
    });

    it('未初始化时应该抛出错误', async () => {
      expect(() => provider.getModel()).toThrow('Provider OpenAICompatible not initialized');
    });
  });

  describe('连接测试', () => {
    it('初始化后连接测试应该成功', async () => {
      await provider.initialize();
      const result = await provider.testConnection();
      expect(result).toBe(true);
    });

    it('未初始化时连接测试应该失败', async () => {
      const result = await provider.testConnection();
      expect(result).toBe(false);
    });
  });
});
