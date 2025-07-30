// Agent module exports
export { AgentManager, agentManager } from './agent-manager';
export { AgentFactory } from './agent-factory';

// Re-export types for convenience
export type { 
  AgentConfig, 
  CreateAgentInput, 
  UpdateAgentInput,
  ToolConfig,
  GuardrailConfig,
  MCPServerConfig,
  ModelSettings,
  ModelConfig,
  HandoffConfig,
  Instructions,
  OutputType,
  ToolUseBehavior
} from '../types/agent';

export type {
  ModelProvider,
  ProviderConfig,
  ModelInfo
} from '../types/provider';
