import { describe, it, expect, beforeEach } from 'vitest';
import { AgentManager } from '../agent/agent-manager';
import type { CreateAgentInput } from '../types/agent';

// Helper function to create a valid test input
function createTestInput(overrides: Partial<CreateAgentInput> = {}): CreateAgentInput {
  return {
    name: 'Test Agent',
    instructions: 'You are a helpful test agent',
    modelConfig: {
      providerID: 'OpenAI' as const,
      model: 'gpt-4',
      settings: {
        temperature: 0.7,
        maxTokens: 1000,
      },
    },
    tools: [],
    resetToolChoice: true,
    inputGuardrails: [],
    outputGuardrails: [],
    mcpServers: [],
    ...overrides,
  };
}

describe('AgentManager', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  describe('createAgent', () => {
    it('should create a new agent with valid configuration', async () => {
      const input = createTestInput();

      const agent = await agentManager.createAgent(input);

      expect(agent).toBeDefined();
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBe(input.name);
      expect(agent.instructions).toBe(input.instructions);
      expect(agent.modelConfig.providerID).toBe(input.modelConfig.providerID);
      expect(agent.modelConfig.model).toBe(input.modelConfig.model);
      expect(agent.createdAt).toBeTruthy();
      expect(agent.updatedAt).toBeTruthy();
    });

    it('should throw error with invalid configuration', async () => {
      const input = createTestInput({ name: '' }); // Invalid: empty name

      await expect(agentManager.createAgent(input)).rejects.toThrow();
    });

    it('should emit agent:created event', async () => {
      const input = createTestInput();

      let eventFired = false;
      agentManager.on('agent:created', () => {
        eventFired = true;
      });

      await agentManager.createAgent(input);
      expect(eventFired).toBe(true);
    });
  });

  describe('updateAgent', () => {
    it('should update an existing agent', async () => {
      // Create an agent first
      const input = createTestInput();

      const originalAgent = await agentManager.createAgent(input);
      const originalUpdatedAt = originalAgent.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the agent
      const updates = {
        name: 'Updated Test Agent',
        instructions: 'You are an updated helpful test agent',
      };

      const updatedAgent = await agentManager.updateAgent(originalAgent.id, updates);

      expect(updatedAgent.id).toBe(originalAgent.id);
      expect(updatedAgent.name).toBe(updates.name);
      expect(updatedAgent.instructions).toBe(updates.instructions);
      expect(updatedAgent.updatedAt).toBeGreaterThan(originalUpdatedAt);
      expect(updatedAgent.createdAt).toBe(originalAgent.createdAt);
    });

    it('should throw error for non-existent agent', async () => {
      await expect(
        agentManager.updateAgent('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow('Agent with ID non-existent-id not found');
    });
  });

  describe('deleteAgent', () => {
    it('should delete an existing agent', async () => {
      // Create an agent first
      const input = createTestInput();

      const agent = await agentManager.createAgent(input);
      expect(agentManager.hasAgent(agent.id)).toBe(true);

      // Delete the agent
      await agentManager.deleteAgent(agent.id);
      expect(agentManager.hasAgent(agent.id)).toBe(false);
    });

    it('should emit agent:deleted event', async () => {
      const input = createTestInput();

      const agent = await agentManager.createAgent(input);

      let eventFired = false;
      let deletedId = '';
      agentManager.on('agent:deleted', (id: string) => {
        eventFired = true;
        deletedId = id;
      });

      await agentManager.deleteAgent(agent.id);
      expect(eventFired).toBe(true);
      expect(deletedId).toBe(agent.id);
    });
  });

  describe('getAgentConfig', () => {
    it('should return agent configuration', async () => {
      const input = createTestInput();

      const agent = await agentManager.createAgent(input);
      const retrieved = agentManager.getAgentConfig(agent.id);

      expect(retrieved).toEqual(agent);
    });

    it('should return undefined for non-existent agent', () => {
      const retrieved = agentManager.getAgentConfig('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllAgentConfigs', () => {
    it('should return all agent configurations', async () => {
      const input1 = createTestInput({ name: 'Agent 1', instructions: 'You are agent 1' });
      const input2 = createTestInput({ 
        name: 'Agent 2', 
        instructions: 'You are agent 2',
        modelConfig: {
          providerID: 'OpenAI',
          model: 'gpt-3.5-turbo',
        }
      });

      const agent1 = await agentManager.createAgent(input1);
      const agent2 = await agentManager.createAgent(input2);

      const allAgents = agentManager.getAllAgentConfigs();
      expect(allAgents).toHaveLength(2);
      expect(allAgents).toContainEqual(agent1);
      expect(allAgents).toContainEqual(agent2);
    });
  });

  describe('exportAgentConfig', () => {
    it('should export agent configuration as JSON', async () => {
      const input = createTestInput();

      const agent = await agentManager.createAgent(input);
      const exported = agentManager.exportAgentConfig(agent.id);

      const parsed = JSON.parse(exported);
      expect(parsed.id).toBe(agent.id);
      expect(parsed.name).toBe(agent.name);
      expect(parsed.instructions).toBe(agent.instructions);
    });
  });

  describe('importAgentConfig', () => {
    it('should import agent configuration from JSON', async () => {
      const input = createTestInput();

      const originalAgent = await agentManager.createAgent(input);
      const exported = agentManager.exportAgentConfig(originalAgent.id);

      // Delete the original agent
      await agentManager.deleteAgent(originalAgent.id);

      // Import the agent
      const importedAgent = await agentManager.importAgentConfig(exported);

      expect(importedAgent.name).toBe(originalAgent.name);
      expect(importedAgent.instructions).toBe(originalAgent.instructions);
      expect(importedAgent.modelConfig).toEqual(originalAgent.modelConfig);
      // ID should be different (new UUID)
      expect(importedAgent.id).not.toBe(originalAgent.id);
    });

    it('should throw error for invalid JSON', async () => {
      await expect(
        agentManager.importAgentConfig('invalid json')
      ).rejects.toThrow('Invalid JSON');
    });
  });

  describe('cloneAgent', () => {
    it('should clone an existing agent with new name', async () => {
      const input = createTestInput({ 
        name: 'Original Agent',
        instructions: 'You are the original agent'
      });

      const originalAgent = await agentManager.createAgent(input);
      const clonedAgent = await agentManager.cloneAgent(originalAgent.id, 'Cloned Agent');

      expect(clonedAgent.name).toBe('Cloned Agent');
      expect(clonedAgent.instructions).toBe(originalAgent.instructions);
      expect(clonedAgent.modelConfig).toEqual(originalAgent.modelConfig);
      expect(clonedAgent.id).not.toBe(originalAgent.id);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const stats1 = agentManager.getStats();
      expect(stats1.totalAgents).toBe(0);
      expect(stats1.cachedInstances).toBe(0);

      const input = createTestInput();

      await agentManager.createAgent(input);

      const stats2 = agentManager.getStats();
      expect(stats2.totalAgents).toBe(1);
      expect(stats2.agents).toHaveLength(1);
    });
  });
});
