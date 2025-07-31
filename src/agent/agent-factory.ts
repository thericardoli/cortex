import type { AgentConfig, ToolConfig, GuardrailConfig, MCPServerConfig } from '../types/agent';
import { Agent } from '@openai/agents';
import type { Model } from '@openai/agents-core';

/**
 * Agent Factory for creating OpenAI Agent SDK instances from AgentConfig
 * 
 * This class handles the conversion from our AgentConfig format to the
 * OpenAI Agent SDK format, including:
 * - Model configuration
 * - Tool setup
 * - Guardrail configuration
 * - MCP server integration
 * - Handoff configuration
 */
export class AgentFactory {
  
  /**
   * Create an OpenAI Agent SDK instance from our AgentConfig
   */
  static async createAgentInstance(config: AgentConfig, model?: Model): Promise<Agent> {
    // Convert our configuration to OpenAI Agent SDK configuration
    const agentConfiguration = {
      name: config.name,
      instructions: config.instructions,
      model: model || await this.resolveModel(config),  // Use provided model or resolve from config
      modelSettings: config.modelConfig.settings,
      tools: await this.createTools(config.tools),
      handoffs: await this.createHandoffs(config),
      outputType: config.outputType || 'text',
      inputGuardrails: await this.createInputGuardrails(config.inputGuardrails),
      outputGuardrails: await this.createOutputGuardrails(config.outputGuardrails),
      resetToolChoice: config.resetToolChoice,
      toolUseBehavior: config.toolUseBehavior,
    };

    // Create the Agent instance
    const agent = new Agent(agentConfiguration);

    // Setup MCP servers if configured
    if (config.mcpServers && config.mcpServers.length > 0) {
      await this.setupMCPServers(agent, config.mcpServers);
    }

    return agent;
  }

  /**
   * Resolve model configuration based on provider
   */
  private static async resolveModel(config: AgentConfig): Promise<string> {
    const { providerID, model } = config.modelConfig;
    
    // For now, return the model name directly
    // In the future, this could handle provider-specific model resolution
    return model;
  }

  /**
   * Create tools from tool configurations
   */
  private static async createTools(toolConfigs: ToolConfig[]): Promise<any[]> {
    const tools: any[] = [];

    for (const toolConfig of toolConfigs) {
      if (!toolConfig.enabled) {
        continue;
      }

      switch (toolConfig.type) {
        case 'builtin':
          tools.push(await this.createBuiltinTool(toolConfig));
          break;
        case 'custom':
          tools.push(await this.createCustomTool(toolConfig));
          break;
        case 'mcp':
          // MCP tools are handled separately in setupMCPServers
          break;
        case 'hosted':
          tools.push(await this.createHostedTool(toolConfig));
          break;
      }
    }

    return tools;
  }

  /**
   * Create a builtin tool
   */
  private static async createBuiltinTool(config: ToolConfig): Promise<any> {
    // This will be implemented when we have specific builtin tools
    // For now, return a placeholder
    return {
      type: 'function',
      function: {
        name: config.name,
        description: config.description || 'A builtin tool',
        parameters: config.parameters || {},
        strict: config.strict || false,
      },
    };
  }

  /**
   * Create a custom tool
   */
  private static async createCustomTool(config: ToolConfig): Promise<any> {
    // This will be implemented when we have custom tool support
    // For now, return a placeholder
    return {
      type: 'function',
      function: {
        name: config.name,
        description: config.description || 'A custom tool',
        parameters: config.parameters || {},
        strict: config.strict || false,
      },
    };
  }

  /**
   * Create a hosted tool
   */
  private static async createHostedTool(config: ToolConfig): Promise<any> {
    // This will be implemented when we have hosted tool support
    // For now, return a placeholder
    return {
      type: 'function',
      function: {
        name: config.name,
        description: config.description || 'A hosted tool',
        parameters: config.parameters || {},
        strict: config.strict || false,
      },
    };
  }

  /**
   * Create handoffs configuration
   */
  private static async createHandoffs(config: AgentConfig): Promise<any[]> {
    if (!config.handoffConfig?.enabled) {
      return [];
    }

    // This will be implemented when we have handoff support
    // For now, return empty array
    return [];
  }

  /**
   * Create input guardrails
   */
  private static async createInputGuardrails(guardrailConfigs: GuardrailConfig[]): Promise<any[]> {
    const guardrails: any[] = [];

    for (const guardrailConfig of guardrailConfigs) {
      if (!guardrailConfig.enabled) {
        continue;
      }

      // This will be implemented when we have guardrail support
      // For now, skip
    }

    return guardrails;
  }

  /**
   * Create output guardrails
   */
  private static async createOutputGuardrails(guardrailConfigs: GuardrailConfig[]): Promise<any[]> {
    const guardrails: any[] = [];

    for (const guardrailConfig of guardrailConfigs) {
      if (!guardrailConfig.enabled) {
        continue;
      }

      // This will be implemented when we have guardrail support
      // For now, skip
    }

    return guardrails;
  }

  /**
   * Setup MCP servers for the agent
   */
  private static async setupMCPServers(agent: Agent, mcpConfigs: MCPServerConfig[]): Promise<void> {
    for (const mcpConfig of mcpConfigs) {
      try {
        // This will be implemented when we have MCP support
        // For now, just log the configuration
        console.log('MCP server configuration:', mcpConfig);
      } catch (error) {
        console.error(`Failed to setup MCP server ${mcpConfig.name}:`, error);
      }
    }
  }

  /**
   * Validate an agent configuration for SDK compatibility
   */
  static validateForSDK(config: AgentConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!config.name || config.name.trim().length === 0) {
      errors.push('Agent name is required');
    }

    if (!config.instructions || config.instructions.trim().length === 0) {
      errors.push('Agent instructions are required');
    }

    if (!config.modelConfig?.model) {
      errors.push('Model configuration is required');
    }

    // Check tool configurations
    for (const tool of config.tools || []) {
      if (tool.enabled && tool.type === 'mcp' && (!config.mcpServers || config.mcpServers.length === 0)) {
        warnings.push(`Tool "${tool.name}" is configured as MCP but no MCP servers are configured`);
      }
    }

    // Check handoff configuration
    if (config.handoffConfig?.enabled && (!config.handoffConfig.allowedAgents || config.handoffConfig.allowedAgents.length === 0)) {
      warnings.push('Handoffs are enabled but no allowed agents are configured');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
