import { AgentConfigSchema } from '../types';
import type { AgentConfig, Result } from '../types';
import { StorageManager } from './storage-manager';

export class AgentStorage {
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  async saveAgentConfig(config: AgentConfig): Promise<Result<void>> {
    try {
      // Validate config before saving
      const validConfig = AgentConfigSchema.parse(config);
      
      const result = await this.storage.writeJson(
        `agents/${config.id}.json`,
        validConfig
      );
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to save agent config')
      };
    }
  }

  async loadAgentConfig(id: string): Promise<Result<AgentConfig>> {
    try {
      const result = await this.storage.readJson<AgentConfig>(`agents/${id}.json`);
      
      if (!result.success) {
        return result;
      }
      
      // Validate loaded config
      const validConfig = AgentConfigSchema.parse(result.data);
      
      return { success: true, data: validConfig };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to load agent config')
      };
    }
  }

  async deleteAgentConfig(id: string): Promise<Result<void>> {
    return await this.storage.deleteFile(`agents/${id}.json`);
  }

  async listAgentConfigs(): Promise<Result<AgentConfig[]>> {
    try {
      const filesResult = await this.storage.listFiles('agents');
      
      if (!filesResult.success) {
        return {
          success: false,
          error: filesResult.error
        };
      }
      
      const configs: AgentConfig[] = [];
      
      for (const filename of filesResult.data || []) {
        if (filename.endsWith('.json')) {
          const id = filename.replace('.json', '');
          const configResult = await this.loadAgentConfig(id);
          
          if (configResult.success && configResult.data) {
            configs.push(configResult.data);
          }
        }
      }
      
      // Sort by creation date (newest first)
      configs.sort((a, b) => b.createdAt - a.createdAt);
      
      return { success: true, data: configs };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to list agent configs')
      };
    }
  }

  async exportAgentConfig(id: string): Promise<Result<string>> {
    try {
      const configResult = await this.loadAgentConfig(id);
      
      if (!configResult.success) {
        return {
          success: false,
          error: configResult.error
        };
      }
      
      const exportData = {
        version: '1.0',
        type: 'cortex-agent-config',
        exportedAt: Date.now(),
        config: configResult.data
      };
      
      return { 
        success: true, 
        data: JSON.stringify(exportData, null, 2) 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to export agent config')
      };
    }
  }

  async importAgentConfig(jsonData: string): Promise<Result<AgentConfig>> {
    try {
      const importData = JSON.parse(jsonData);
      
      // Validate import structure
      if (!importData.config || importData.type !== 'cortex-agent-config') {
        return {
          success: false,
          error: new Error('Invalid agent config format')
        };
      }
      
      const config = importData.config;
      
      // Generate new ID and timestamps for imported config
      const newConfig: AgentConfig = {
        ...config,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Validate and save
      const validConfig = AgentConfigSchema.parse(newConfig);
      const saveResult = await this.saveAgentConfig(validConfig);
      
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error
        };
      }
      
      return { success: true, data: validConfig };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to import agent config')
      };
    }
  }

  async configExists(id: string): Promise<boolean> {
    return await this.storage.exists(`agents/${id}.json`);
  }
}