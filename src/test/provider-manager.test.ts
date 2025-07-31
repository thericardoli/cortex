import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { ProviderManager } from '../providers/provider-manager';
import { OpenAICompatibleProvider } from '../providers/openai-compatible';
import { ProviderConfigSchema } from '../types/provider';

const createProviderConfig = (overrides = {}) => ({
  id: 'custom-provider',
  providerType: 'OpenAICompatible' as const,
  name: 'My Custom Provider',
  baseUrl: 'https://custom-endpoint/v1',
  apiKey: 'sk-xxx',
  enabled: true,
  ...overrides,
});

describe('ProviderManager 多 provider 支持', () => {
  beforeAll(() => {
    // mock initialize，避免真实网络请求
    OpenAICompatibleProvider.prototype.initialize = async function () {
      // 使用类型断言来访问受保护的属性
      (this as any)._initialized = true;
    };
  });
  let providerManager: ProviderManager;

  beforeEach(() => {
    providerManager = new ProviderManager();
  });

  it('ProviderConfig 类型校验 - 必填字段', () => {
    const valid = ProviderConfigSchema.safeParse(createProviderConfig());
    expect(valid.success).toBe(true);

    const missingName = ProviderConfigSchema.safeParse(createProviderConfig({ name: '' }));
    expect(missingName.success).toBe(false);

    const missingId = ProviderConfigSchema.safeParse(createProviderConfig({ id: '' }));
    expect(missingId.success).toBe(false);

    const missingBaseUrl = ProviderConfigSchema.safeParse(createProviderConfig({ baseUrl: '' }));
    expect(missingBaseUrl.success).toBe(false);
  });

  it('可添加多个 OpenAICompatible provider 并能查找', async () => {
    const config1 = createProviderConfig({ id: 'p1', name: 'Provider 1' });
    const config2 = createProviderConfig({ id: 'p2', name: 'Provider 2', baseUrl: 'https://another/v1' });
    await providerManager.addProvider(config1);
    await providerManager.addProvider(config2);
    expect(providerManager.getAvailableProviders()).toEqual(['p1', 'p2']);
    expect(providerManager.isProviderAvailable('p1')).toBe(true);
    expect(providerManager.isProviderAvailable('p2')).toBe(true);
    expect(providerManager.getProvider('p1')).toBeDefined();
    expect(providerManager.getProvider('p2')).toBeDefined();
  });

  it('删除 provider 后不可用', async () => {
    const config = createProviderConfig({ id: 'del-test' });
    await providerManager.addProvider(config);
    expect(providerManager.isProviderAvailable('del-test')).toBe(true);
    await providerManager.removeProvider('del-test');
    expect(providerManager.isProviderAvailable('del-test')).toBe(false);
  });

  it('name 字段能被正确保存和读取', async () => {
    const config = createProviderConfig({ id: 'name-test', name: 'Test Name' });
    await providerManager.addProvider(config);
    // 这里假设 providerManager.getProvider 返回的实例有 config 属性
    const provider: any = providerManager.getProvider('name-test');
    expect(provider?.config?.name || provider?.name).toBe('Test Name');
  });
});
