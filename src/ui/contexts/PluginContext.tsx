import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AgentManager } from '@/agent';
import type { SessionManager } from '@/session';
import type { ProviderManager } from '@/providers';
import type { StorageManager } from '@/storage';
import type { AgentConfig, ChatSession } from '@/types';

// 插件上下文类型
export interface PluginContextType {
  // 管理器
  agentManager: AgentManager;
  sessionManager: SessionManager;
  providerManager: ProviderManager;
  storageManager: StorageManager;
  
  // 共享状态
  currentAgent: AgentConfig | null;
  currentSession: ChatSession | null;
  agents: AgentConfig[];
  sessions: ChatSession[];
  
  // 状态更新方法
  setCurrentAgent: (agent: AgentConfig | null) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  refreshAgents: () => Promise<void>;
  refreshSessions: () => Promise<void>;
}

// 管理器接口
interface ManagersProps {
  agentManager: AgentManager;
  sessionManager: SessionManager;
  providerManager: ProviderManager;
  storageManager: StorageManager;
}

// 创建上下文
const PluginContext = createContext<PluginContextType | undefined>(undefined);

// Provider 组件
export const PluginProvider: React.FC<{ 
  children: ReactNode;
  managers: ManagersProps;
}> = ({ children, managers }) => {
  // 状态管理
  const [currentAgent, setCurrentAgent] = useState<AgentConfig | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // 刷新智能体列表
  const refreshAgents = async () => {
    try {
      // 这里将来会从 agentManager 获取智能体列表
      // const agentList = await managers.agentManager.listAgents();
      // setAgents(agentList);
      console.log('刷新智能体列表...');
    } catch (error) {
      console.error('刷新智能体失败:', error);
    }
  };

  // 刷新会话列表
  const refreshSessions = async () => {
    try {
      if (currentAgent) {
        // 这里将来会从 sessionManager 获取会话列表
        // const sessionList = await managers.sessionManager.getSessionsByAgent(currentAgent.id);
        // setSessions(sessionList);
        console.log('刷新会话列表...');
      }
    } catch (error) {
      console.error('刷新会话失败:', error);
    }
  };

  // 当当前智能体改变时，重新加载会话
  useEffect(() => {
    if (currentAgent) {
      refreshSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
    }
  }, [currentAgent]);

  // 初始化时加载数据
  useEffect(() => {
    refreshAgents();
  }, []);

  const value: PluginContextType = {
    // 管理器
    ...managers,
    
    // 共享状态
    currentAgent,
    currentSession,
    agents,
    sessions,
    
    // 状态更新方法
    setCurrentAgent,
    setCurrentSession,
    refreshAgents,
    refreshSessions,
  };

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
};

// Hook 用于使用插件管理器和状态
export const usePlugin = (): PluginContextType => {
  const context = useContext(PluginContext);
  if (context === undefined) {
    throw new Error('usePlugin must be used within a PluginProvider');
  }
  return context;
};
