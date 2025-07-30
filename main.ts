import { Plugin } from 'obsidian';

// 导入视图
import { ChatView, CHAT_VIEW_TYPE } from '@/ui/views/ChatView';
import { AgentsView, AGENTS_VIEW_TYPE } from '@/ui/views/AgentsView';

// 导入设置
import { CortexSettingTab, DEFAULT_SETTINGS } from '@/ui/settings/CortexSettingTab';
import type { CortexSettings } from '@/ui/settings/CortexSettingTab';

// 导入管理器
import { AgentManager } from '@/agent';
import { SessionManager } from '@/session';
import { ProviderManager } from '@/providers';
import { StorageManager } from '@/storage';

export default class CortexPlugin extends Plugin {
  settings: CortexSettings = DEFAULT_SETTINGS;

  // 管理器实例
  private storageManager!: StorageManager;
  private providerManager!: ProviderManager;
  private agentManager!: AgentManager;
  private sessionManager!: SessionManager;

  async onload() {
    console.log('Cortex AI 插件加载中...');

    try {
      // 加载设置
      await this.loadSettings();

      // 初始化管理器
      await this.initializeManagers();

      // 注册视图
      this.registerView(
        CHAT_VIEW_TYPE,
        (leaf) => new ChatView(leaf, this.getManagers())
      );

      this.registerView(
        AGENTS_VIEW_TYPE,
        (leaf) => new AgentsView(leaf, this.getManagers())
      );

      // 添加设置页面
      this.addSettingTab(new CortexSettingTab(this.app, this));

      // 添加功能区图标
      this.addRibbonIcon('message-circle', '打开 Cortex 聊天', () => {
        this.activateView(CHAT_VIEW_TYPE);
      });

      this.addRibbonIcon('bot', '管理 Cortex 智能体', () => {
        this.activateView(AGENTS_VIEW_TYPE);
      });

      // 添加命令
      this.addCommand({
        id: 'open-chat-view',
        name: '打开聊天视图',
        callback: () => {
          this.activateView(CHAT_VIEW_TYPE);
        }
      });

      this.addCommand({
        id: 'open-agents-view',
        name: '打开智能体管理',
        callback: () => {
          this.activateView(AGENTS_VIEW_TYPE);
        }
      });

      console.log('Cortex AI 插件加载完成');
    } catch (error) {
      console.error('Cortex AI 插件加载失败:', error);
    }
  }

  onunload() {
    console.log('Cortex AI 插件卸载中...');
    // 清理视图
    this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(AGENTS_VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private getManagers() {
    return {
      agentManager: this.agentManager,
      sessionManager: this.sessionManager,
      providerManager: this.providerManager,
      storageManager: this.storageManager,
    };
  }

  private async activateView(viewType: string) {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(viewType)[0];

    if (!leaf) {
      // 如果视图不存在，在右侧边栏创建
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({ type: viewType, active: true });
      }
    }

    // 激活视图
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  private async initializeManagers() {
    // 初始化存储管理器
    this.storageManager = new StorageManager(this.app);
    await this.storageManager.initialize();

    // 初始化提供者管理器（简化版本）
    this.providerManager = new ProviderManager();
    await this.providerManager.initialize();

    // 初始化智能体管理器
    this.agentManager = new AgentManager(/* 依赖参数 */);
    await this.agentManager.initialize();

    // 初始化会话管理器
    // this.sessionManager = new SessionManager(sessionStorage, this.agentManager);
    // await this.sessionManager.initialize();
  }
}