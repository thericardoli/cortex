import { z } from 'zod';

// 支持的模型提供商枚举
export const ModelProviderSchema = z.enum([
  'OpenAI',          
  'OpenAICompatible',
  'Ollama'
]);

export type ModelProvider = z.infer<typeof ModelProviderSchema>;

// Provider configuration schema
export const ProviderConfigSchema = z.object({
  provider: ModelProviderSchema,
  
  // 通用配置
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  enabled: z.boolean().default(true),
}).strict();

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// Global provider settings schema
export const GlobalProviderSettingsSchema = z.object({
  providers: z.record(ProviderConfigSchema),
  defaultProvider: ModelProviderSchema.optional(),
}).strict();

export type GlobalProviderSettings = z.infer<typeof GlobalProviderSettingsSchema>;

// Model info schema 
export const ModelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: ModelProviderSchema,
  
  // 模型能力信息
  contextLength: z.number().optional(),
  maxOutputTokens: z.number().optional(),
  supportsVision: z.boolean().default(false),
  supportsTools: z.boolean().default(false),
  reasoningModel: z.boolean().default(false),
}).strict();

export type ModelInfo = z.infer<typeof ModelInfoSchema>;

// Provider capabilities schema
export const ProviderCapabilitiesSchema = z.object({
  supportsTools: z.boolean().default(true),
  supportsVision: z.boolean().default(false),
  maxContextLength: z.number().optional(),
  supportedModels: z.array(ModelInfoSchema).default([]),
}).strict();

export type ProviderCapabilities = z.infer<typeof ProviderCapabilitiesSchema>;

// Provider status schema
export const ProviderStatusSchema = z.object({
  provider: ModelProviderSchema,
  status: z.enum(['connected', 'disconnected', 'error']),
  lastChecked: z.number().optional(),
  error: z.string().optional(),
  capabilities: ProviderCapabilitiesSchema.optional(),
}).strict();

export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;