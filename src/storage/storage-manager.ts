import { App, TFile, TFolder } from 'obsidian';
import type { Result } from '../types';

export class StorageManager {
  private app: App;
  private basePath: string;
  private initialized = false;

  constructor(app: App) {
    this.app = app;
    this.basePath = '.cortex';
  }

  async initialize(): Promise<Result<void>> {
    try {
      console.log('🔍 StorageManager - Initializing directories...');
      
      await this.ensureDirectoryExists(this.basePath);
      console.log('🔍 StorageManager - Base directory ensured');
      
      await this.ensureDirectoryExists(`${this.basePath}/config`);
      console.log('🔍 StorageManager - Config directory ensured');
      
      await this.ensureDirectoryExists(`${this.basePath}/agents`);  
      console.log('🔍 StorageManager - Agents directory ensured');
      
      await this.ensureDirectoryExists(`${this.basePath}/sessions`);
      console.log('🔍 StorageManager - Sessions directory ensured');
      
      await this.ensureDirectoryExists(`${this.basePath}/logs`);
      console.log('🔍 StorageManager - Logs directory ensured');
      
      this.initialized = true;
      console.log('✅ StorageManager - Initialization complete');
      return { success: true };
    } catch (error) {
      console.error('❌ StorageManager - Initialization failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to initialize storage') 
      };
    }
  }

  async writeJson<T>(path: string, data: T): Promise<Result<void>> {
    if (!this.initialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    try {
      const fullPath = `${this.basePath}/${path}`;
      const jsonData = JSON.stringify(data, null, 2);
      
      // Ensure parent directory exists
      const parentPath = this.getParentPath(fullPath);
      if (parentPath) {
        await this.ensureDirectoryExists(parentPath);
      }
      
      const existingFile = this.app.vault.getAbstractFileByPath(fullPath);
      if (existingFile instanceof TFile) {
        await this.app.vault.modify(existingFile, jsonData);
      } else {
        await this.app.vault.create(fullPath, jsonData);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to write JSON file') 
      };
    }
  }

  async readJson<T>(path: string): Promise<Result<T>> {
    if (!this.initialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return {
          success: false,
          error: initResult.error
        };
      }
    }

    try {
      const fullPath = `${this.basePath}/${path}`;
      const file = this.app.vault.getAbstractFileByPath(fullPath);
      
      if (!(file instanceof TFile)) {
        return { 
          success: false, 
          error: new Error(`File not found: ${fullPath}`) 
        };
      }
      
      const content = await this.app.vault.read(file);
      const data = JSON.parse(content);
      
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to read JSON file') 
      };
    }
  }

  async deleteFile(path: string): Promise<Result<void>> {
    try {
      const fullPath = `${this.basePath}/${path}`;
      const file = this.app.vault.getAbstractFileByPath(fullPath);
      
      if (file instanceof TFile) {
        await this.app.vault.delete(file);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to delete file') 
      };
    }
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = `${this.basePath}/${path}`;
    const file = this.app.vault.getAbstractFileByPath(fullPath);
    return file instanceof TFile;
  }

  async listFiles(directory: string): Promise<Result<string[]>> {
    try {
      const fullPath = `${this.basePath}/${directory}`;
      const folder = this.app.vault.getAbstractFileByPath(fullPath);
      
      if (!(folder instanceof TFolder)) {
        return { success: true, data: [] };
      }
      
      const files = folder.children
        .filter(child => child instanceof TFile)
        .map(file => file.name);
      
      return { success: true, data: files };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Failed to list files') 
      };
    }
  }

  private async ensureDirectoryExists(path: string): Promise<void> {
    try {
      const folder = this.app.vault.getAbstractFileByPath(path);
      if (folder instanceof TFolder) {
        // Directory already exists
        console.log(`🔍 Directory already exists: ${path}`);
        return;
      }
      
      // Directory doesn't exist, create it
      console.log(`🔍 Creating directory: ${path}`);
      await this.app.vault.createFolder(path);
      console.log(`✅ Directory created: ${path}`);
    } catch (error) {
      // Handle the case where directory was created between our check and creation attempt
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log(`🔍 Directory was created by another process: ${path}`);
        return;
      }
      
      console.error(`❌ Failed to create directory ${path}:`, error);
      throw error;
    }
  }

  private getParentPath(path: string): string | null {
    const parts = path.split('/');
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join('/');
  }

  getBasePath(): string {
    return this.basePath;
  }
}