import type {
	AgentConfig,
	CreateAgentInput,
	UpdateAgentInput,
} from "../types/agent";
import {
	CreateAgentInputSchema,
	UpdateAgentInputSchema,
	AgentConfigSchema,
} from "../types/agent";
import { Agent } from "@openai/agents";
import { AgentFactory } from "./agent-factory";
import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import type { ProviderManager } from "../providers";

/**
 * Agent Manager events
 */
export interface AgentManagerEvents {
	"agent:created": (agentConfig: AgentConfig) => void;
	"agent:updated": (agentConfig: AgentConfig) => void;
	"agent:deleted": (agentId: string) => void;
	"agent:imported": (agentConfig: AgentConfig) => void;
	"agent:exported": (agentConfig: AgentConfig, filePath: string) => void;
}

/**
 * Agent Manager for managing AI Agents in the Cortex plugin
 *
 * This class provides a centralized way to:
 * - Create, update, delete agents
 * - Manage agent configurations and persistence
 * - Create Agent SDK instances from configurations
 * - Import/export agent configurations
 */
export class AgentManager extends EventEmitter {
	private agents: Map<string, AgentConfig> = new Map();
	private agentInstances: Map<string, Agent> = new Map();
	private providerManager?: ProviderManager;

	constructor(providerManager?: ProviderManager) {
		super();
		this.providerManager = providerManager;
	}

	/**
	 * Set the provider manager
	 */
	setProviderManager(providerManager: ProviderManager): void {
		this.providerManager = providerManager;
		// Clear cached instances as they may need to be recreated with new providers
		this.clearInstanceCache();
	}

	/**
	 * Create a new agent with the given configuration
	 */
	async createAgent(input: CreateAgentInput): Promise<AgentConfig> {
		// Validate input
		const validatedInput = CreateAgentInputSchema.parse(input);

		// Generate agent ID and timestamps
		const agentConfig: AgentConfig = {
			id: randomUUID(),
			createdAt: Date.now(),
			updatedAt: Date.now(),
			...validatedInput,
		};

		// Validate the complete configuration
		const validatedConfig = AgentConfigSchema.parse(agentConfig);

		// Validate for SDK compatibility
		const validation = AgentFactory.validateForSDK(validatedConfig);
		if (!validation.isValid) {
			throw new Error(
				`Agent configuration is not valid: ${validation.errors.join(
					", "
				)}`
			);
		}

		// Log warnings if any
		if (validation.warnings.length > 0) {
			console.warn("Agent configuration warnings:", validation.warnings);
		}

		// Store the agent
		this.agents.set(validatedConfig.id, validatedConfig);

		// Clear any cached instance
		this.clearInstanceCache(validatedConfig.id);

		// Emit event
		this.emit("agent:created", validatedConfig);

		return validatedConfig;
	}

	/**
	 * Update an existing agent
	 */
	async updateAgent(
		agentId: string,
		updates: UpdateAgentInput
	): Promise<AgentConfig> {
		const existingAgent = this.agents.get(agentId);
		if (!existingAgent) {
			throw new Error(`Agent with ID ${agentId} not found`);
		}

		// Validate updates
		const validatedUpdates = UpdateAgentInputSchema.parse(updates);

		// Merge updates with existing configuration
		const updatedConfig: AgentConfig = {
			...existingAgent,
			...validatedUpdates,
			updatedAt: Date.now(),
		};

		// Validate the complete updated configuration
		const validatedConfig = AgentConfigSchema.parse(updatedConfig);

		// Store the updated agent
		this.agents.set(agentId, validatedConfig);

		// Clear any cached instance
		this.clearInstanceCache(agentId);

		// Emit event
		this.emit("agent:updated", validatedConfig);

		return validatedConfig;
	}

	/**
	 * Delete an agent
	 */
	async deleteAgent(agentId: string): Promise<void> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new Error(`Agent with ID ${agentId} not found`);
		}

		// Remove from storage
		this.agents.delete(agentId);

		// Clear any cached instance
		this.clearInstanceCache(agentId);

		// Emit event
		this.emit("agent:deleted", agentId);
	}

	/**
	 * Get an agent configuration by ID
	 */
	getAgentConfig(agentId: string): AgentConfig | undefined {
		return this.agents.get(agentId);
	}

	/**
	 * Get all agent configurations
	 */
	getAllAgentConfigs(): AgentConfig[] {
		return Array.from(this.agents.values());
	}

	/**
	 * Get agent configurations sorted by creation time
	 */
	getAgentConfigsSorted(): AgentConfig[] {
		return this.getAllAgentConfigs().sort(
			(a, b) => a.createdAt - b.createdAt
		);
	}

	/**
	 * Check if an agent exists
	 */
	hasAgent(agentId: string): boolean {
		return this.agents.has(agentId);
	}

	/**
	 * Get or create an Agent SDK instance for the given agent ID
	 * This converts our AgentConfig to the actual OpenAI Agent SDK instance
	 */
	async getAgentInstance(agentId: string): Promise<Agent> {
		// Check if we have a cached instance
		const cachedInstance = this.agentInstances.get(agentId);
		if (cachedInstance) {
			return cachedInstance;
		}

		// Get the agent configuration
		const agentConfig = this.agents.get(agentId);
		if (!agentConfig) {
			throw new Error(`Agent with ID ${agentId} not found`);
		}

		// Create Agent SDK instance from configuration
		const agentInstance = await this.generateAgent(agentConfig);

		// Cache the instance
		this.agentInstances.set(agentId, agentInstance);

		return agentInstance;
	}

	/**
	 * Create an OpenAI Agent SDK instance from our AgentConfig
	 */
	private async generateAgent(config: AgentConfig): Promise<Agent> {
		// If we have a provider manager, try to get the model from the provider
		if (this.providerManager && config.modelConfig.provider) {
			try {
				const provider = this.providerManager.getProvider(config.modelConfig.provider);
				if (provider) {
					console.log(`🔗 使用 Provider "${config.modelConfig.provider}" 获取模型 "${config.modelConfig.model}"`);
					const model = await provider.getModel(config.modelConfig.model);
					return await AgentFactory.createAgentInstance(config, model);
				}
			} catch (error) {
				console.warn(`警告：无法从 Provider "${config.modelConfig.provider}" 获取模型:`, error);
				console.log('🔄 回退到默认 Agent 创建方式');
			}
		}
		
		// Fallback to default agent creation
		return await AgentFactory.createAgentInstance(config);
	}

	/**
	 * Clear all cached agent instances or a specific agent instance
	 * Useful when configurations change globally
	 */
	clearInstanceCache(agentId?: string): void {
		if (agentId) {
			this.agentInstances.delete(agentId);
		} else {
			this.agentInstances.clear();
		}
	}

	/**
	 * Export an agent configuration to JSON
	 */
	exportAgentConfig(agentId: string): string {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new Error(`Agent with ID ${agentId} not found`);
		}

		return JSON.stringify(agent, null, 2);
	}

	/**
	 * Import an agent configuration from JSON
	 */
	async importAgentConfig(jsonConfig: string): Promise<AgentConfig> {
		let parsedConfig: any;

		try {
			parsedConfig = JSON.parse(jsonConfig);
		} catch (error) {
			throw new Error(`Invalid JSON: ${error}`);
		}

		// Validate the imported configuration
		let validatedConfig: AgentConfig;
		try {
			validatedConfig = AgentConfigSchema.parse(parsedConfig);
		} catch (error) {
			throw new Error(`Invalid agent configuration: ${error}`);
		}

		// Generate new ID and timestamps to avoid conflicts
		const importedConfig: AgentConfig = {
			...validatedConfig,
			id: randomUUID(),
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		// Store the imported agent
		this.agents.set(importedConfig.id, importedConfig);

		// Clear any cached instance
		this.clearInstanceCache(importedConfig.id);

		// Emit event
		this.emit("agent:imported", importedConfig);

		return importedConfig;
	}

	/**
	 * Clone an existing agent with a new name
	 */
	async cloneAgent(agentId: string, newName: string): Promise<AgentConfig> {
		const existingAgent = this.agents.get(agentId);
		if (!existingAgent) {
			throw new Error(`Agent with ID ${agentId} not found`);
		}

		// Create a copy with new ID, name, and timestamps
		const clonedConfig: AgentConfig = {
			...existingAgent,
			id: randomUUID(),
			name: newName,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		// Store the cloned agent
		this.agents.set(clonedConfig.id, clonedConfig);

		// Emit event
		this.emit("agent:created", clonedConfig);

		return clonedConfig;
	}

	/**
	 * Get agent statistics
	 */
	getStats() {
		return {
			totalAgents: this.agents.size,
			cachedInstances: this.agentInstances.size,
			agents: Array.from(this.agents.values()).map((agent) => ({
				id: agent.id,
				name: agent.name,
				createdAt: agent.createdAt,
				updatedAt: agent.updatedAt,
				provider: agent.modelConfig.provider,
				model: agent.modelConfig.model,
				toolsCount: agent.tools.length,
				mcpServersCount: agent.mcpServers.length,
			})),
		};
	}

	/**
	 * Load agents from storage
	 * This will be implemented when storage layer is ready
	 */
	async loadAgents(): Promise<void> {
		// TODO: Implement loading from storage
		// This will use the storage layer to load persisted agent configurations
	}

	/**
	 * Save agents to storage
	 * This will be implemented when storage layer is ready
	 */
	async saveAgents(): Promise<void> {
		// TODO: Implement saving to storage
		// This will use the storage layer to persist agent configurations
	}

	/**
	 * Initialize the agent manager
	 */
	async initialize(): Promise<void> {
		// Load existing agents from storage
		await this.loadAgents();
	}

	/**
	 * Cleanup resources
	 */
	async cleanup(): Promise<void> {
		// Save any pending changes
		await this.saveAgents();

		// Clear caches
		this.clearInstanceCache();

		// Remove all event listeners
		this.removeAllListeners();
	}
}

// Export a default instance for convenience
export const agentManager = new AgentManager();
