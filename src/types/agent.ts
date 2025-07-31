import { z } from 'zod';
import { ModelProviderTypeSchema } from './provider';

export const ToolChoiceSchema = z.union([
  z.enum(['auto', 'required', 'none']),
  z.string() // 特定工具名称
]);

// Tool use behavior types
export type ToolUseBehavior =
  | 'run_llm_again'
  | 'stop_on_first_tool'
  | { stopAtToolNames: string[] };

export const ToolUseBehaviorSchema = z.union([
  z.enum(['run_llm_again', 'stop_on_first_tool']).default('run_llm_again'),
  z.object({
    stopAtToolNames: z.array(z.string())
  })
]);

// Model settings schema
export const ModelSettingsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  toolChoice: ToolChoiceSchema.optional(),
}).strict();

export type ModelSettings = z.infer<typeof ModelSettingsSchema>;

// Model configuration schema
export const ModelConfigSchema = z.object({
  providerID: z.string().min(1), // provider ID，指向具体的 provider 实例
  model: z.string().min(1),
  settings: ModelSettingsSchema.optional(),
}).strict();

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

// Tool configuration schema - 扩展以支持SDK特性
export const ToolConfigSchema = z.object({
  type: z.enum(['builtin', 'custom', 'mcp', 'hosted']), // 添加hosted类型
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  // 对于function tools的详细配置
  description: z.string().optional(),
  parameters: z.record(z.any()).optional(), // JSON schema for parameters
  strict: z.boolean().optional(), // 是否启用strict mode
  needsApproval: z.boolean().default(false), // 是否需要人工批准
  config: z.record(z.any()).optional(),
}).strict();

export type ToolConfig = z.infer<typeof ToolConfigSchema>;

// Output type configuration
export const OutputTypeSchema = z.union([
  z.literal('text'), // 默认文本输出
  z.record(z.any()), // JSON schema对象
  z.any() // Zod schema
]);

export type OutputType = z.infer<typeof OutputTypeSchema>;

// Guardrail configuration
export const GuardrailConfigSchema = z.object({
  type: z.enum(['input', 'output']),
  name: z.string(),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
}).strict();

export type GuardrailConfig = z.infer<typeof GuardrailConfigSchema>;

// MCP Server configuration
export const MCPServerConfigSchema = z.object({
  name: z.string(),
  command: z.string().optional(), // for stdio servers
  args: z.array(z.string()).optional(),
  url: z.string().optional(), // for HTTP servers
  cacheToolsList: z.boolean().default(false),
  config: z.record(z.any()).optional(),
}).strict();

export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;

// Runtime context type
// 这个类型在运行时通过run()函数的context选项传递，不是Agent配置的一部分
export type Context = Record<string, unknown>;

// Dynamic instructions support
// 函数签名：(runContext: RunContext<TContext>, agent: Agent) => string | Promise<string>
export const InstructionsSchema = z.union([
  z.string().min(1), // 静态字符串
  z.function() // 动态函数 (运行时无法直接验证)
]);

export type Instructions = string | ((runContext: unknown, agent: unknown) => string | Promise<string>);

// Handoff configuration schema
export const HandoffConfigSchema = z.object({
  enabled: z.boolean().default(false),
  allowedAgents: z.array(z.string()).default([]),
  description: z.string().optional(), // handoffDescription in SDK
  outputTypeWarningEnabled: z.boolean().default(true),
}).strict();

export type HandoffConfig = z.infer<typeof HandoffConfigSchema>;

// Agent configuration schema - 更符合SDK结构
export const AgentConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  instructions: z.string().min(1), 
  createdAt: z.number(),
  updatedAt: z.number(),
  
  // 模型相关配置
  modelConfig: ModelConfigSchema,
  
  // 工具相关配置
  tools: z.array(ToolConfigSchema).default([]),
  toolUseBehavior: ToolUseBehaviorSchema.optional(),
  resetToolChoice: z.boolean().default(true),
  
  // 代理切换配置
  handoffConfig: HandoffConfigSchema.optional(),
  
  // 输出配置
  outputType: OutputTypeSchema.optional(),
  
  // 防护栏配置
  inputGuardrails: z.array(GuardrailConfigSchema).default([]),
  outputGuardrails: z.array(GuardrailConfigSchema).default([]),
  
  // MCP服务器配置
  mcpServers: z.array(MCPServerConfigSchema).default([]),
  
  // 生命周期配置
  lifecycle: z.object({
    onStart: z.function().optional(),
    onEnd: z.function().optional(),
    onToolStart: z.function().optional(),
    onToolEnd: z.function().optional(),
  }).optional(),
}).strict();

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Agent creation input schema (without auto-generated fields)
export const CreateAgentInputSchema = z.object({
  name: z.string().min(1).max(100),
  instructions: z.string().min(1),
  modelConfig: ModelConfigSchema,
  tools: z.array(ToolConfigSchema).default([]),
  toolUseBehavior: ToolUseBehaviorSchema.optional(),
  resetToolChoice: z.boolean().default(true),
  handoffConfig: HandoffConfigSchema.optional(),
  outputType: OutputTypeSchema.optional(),
  inputGuardrails: z.array(GuardrailConfigSchema).default([]),
  outputGuardrails: z.array(GuardrailConfigSchema).default([]),
  mcpServers: z.array(MCPServerConfigSchema).default([]),
}).strict();

export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;

// Agent update input schema
export const UpdateAgentInputSchema = CreateAgentInputSchema.partial().strict();

export type UpdateAgentInput = z.infer<typeof UpdateAgentInputSchema>;