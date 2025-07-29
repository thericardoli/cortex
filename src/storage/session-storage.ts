import { ChatSessionSchema, AgentHistoryItemSchema } from '../types';
import type { ChatSession, AgentHistoryItem, Result } from '../types';
import { StorageManager } from './storage-manager';

export class SessionStorage {
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  async saveSession(session: ChatSession): Promise<Result<void>> {
    try {
      // Validate session before saving
      const validSession = ChatSessionSchema.parse(session);
      
      // Ensure agent directory exists
      const agentDir = `sessions/${session.agentId}`;
      await this.ensureAgentDirectoryExists(agentDir);
      
      const result = await this.storage.writeJson(
        `${agentDir}/${session.id}.json`,
        validSession
      );
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to save session')
      };
    }
  }

  async loadSession(agentId: string, sessionId: string): Promise<Result<ChatSession>> {
    try {
      const result = await this.storage.readJson<ChatSession>(
        `sessions/${agentId}/${sessionId}.json`
      );
      
      if (!result.success) {
        return result;
      }
      
      // Validate loaded session
      const validSession = ChatSessionSchema.parse(result.data);
      
      return { success: true, data: validSession };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to load session')
      };
    }
  }

  async deleteSession(agentId: string, sessionId: string): Promise<Result<void>> {
    return await this.storage.deleteFile(`sessions/${agentId}/${sessionId}.json`);
  }

  async listSessions(agentId: string): Promise<Result<ChatSession[]>> {
    try {
      const filesResult = await this.storage.listFiles(`sessions/${agentId}`);
      
      if (!filesResult.success) {
        return { success: true, data: [] }; // Return empty array if directory doesn't exist
      }
      
      const sessions: ChatSession[] = [];
      
      for (const filename of filesResult.data || []) {
        if (filename.endsWith('.json')) {
          const sessionId = filename.replace('.json', '');
          const sessionResult = await this.loadSession(agentId, sessionId);
          
          if (sessionResult.success && sessionResult.data) {
            sessions.push(sessionResult.data);
          }
        }
      }
      
      // Sort by last activity (most recent first)
      sessions.sort((a, b) => b.context.lastActivity - a.context.lastActivity);
      
      return { success: true, data: sessions };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to list sessions')
      };
    }
  }

  async addHistoryItem(agentId: string, sessionId: string, item: AgentHistoryItem): Promise<Result<void>> {
    try {
      // Validate history item
      const validItem = AgentHistoryItemSchema.parse(item);
      
      // Load existing session
      const sessionResult = await this.loadSession(agentId, sessionId);
      
      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error
        };
      }
      
      const session = sessionResult.data;
      if (!session) {
        return {
          success: false,
          error: new Error('Session data is null')
        };
      }
      
      // Add item to session history
      session.history.push(validItem);
      
      // Update session metadata
      session.updatedAt = Date.now();
      session.context.lastActivity = Date.now();
      session.context.totalMessages = session.history.length;
      
      // Save updated session
      return await this.saveSession(session);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to add history item')
      };
    }
  }

  async getRecentHistory(
    agentId: string, 
    sessionId: string, 
    limit = 50
  ): Promise<Result<AgentHistoryItem[]>> {
    try {
      const sessionResult = await this.loadSession(agentId, sessionId);
      
      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error
        };
      }
      
      const session = sessionResult.data;
      if (!session) {
        return {
          success: false,
          error: new Error('Session data is null')
        };
      }
      
      const recentHistory = session.history.slice(-limit);
      
      return { success: true, data: recentHistory };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get recent history')
      };
    }
  }

  async sessionExists(agentId: string, sessionId: string): Promise<boolean> {
    return await this.storage.exists(`sessions/${agentId}/${sessionId}.json`);
  }

  async deleteAllSessions(agentId: string): Promise<Result<void>> {
    try {
      const sessionsResult = await this.listSessions(agentId);
      
      if (!sessionsResult.success) {
        return { success: true }; // If no sessions exist, consider it success
      }
      
      for (const session of sessionsResult.data || []) {
        await this.deleteSession(agentId, session.id);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to delete all sessions')
      };
    }
  }

  private async ensureAgentDirectoryExists(agentDir: string): Promise<void> {
    // The StorageManager will handle directory creation automatically
    // when we try to write files to it
  }
}