import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { PluginProvider } from '@/ui/contexts/PluginContext';

// 管理器类型
interface ManagersProps {
  agentManager: any;
  sessionManager: any;
  providerManager: any;
  storageManager: any;
}

export const CHAT_VIEW_TYPE = 'cortex-chat-view';

export class ChatView extends ItemView {
  private root: Root | null = null;
  private managers: ManagersProps;

  constructor(leaf: WorkspaceLeaf, managers: ManagersProps) {
    super(leaf);
    this.managers = managers;
  }

  getViewType(): string {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Cortex Chat';
  }

  getIcon(): string {
    return 'message-circle';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    
    // 动态导入聊天页面组件
    const { ChatPage } = await import('@/ui/pages/ChatPage');
    
    this.root = createRoot(container);
    this.root.render(
      React.createElement(
        PluginProvider,
        { 
          managers: this.managers,
          children: React.createElement(ChatPage)
        }
      )
    );
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
