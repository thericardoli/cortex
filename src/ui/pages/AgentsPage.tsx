import React, { useEffect, useState } from 'react';
import { usePlugin } from '@/ui/contexts/PluginContext';
import { Button, CreateAgentModal } from '@/ui/components';

export const AgentsPage: React.FC = () => {
  const { 
    agentManager, 
    agents, 
    currentAgent,
    setCurrentAgent,
    refreshAgents 
  } = usePlugin();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 初始化时加载智能体
  useEffect(() => {
    refreshAgents();
  }, []);

  const handleCreateAgent = async () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    refreshAgents(); // 刷新智能体列表
  };

  const handleSelectAgent = (agent: any) => {
    setCurrentAgent(agent);
  };

  return (
    <>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            智能体管理
          </h1>
          <p style={{ color: '#4b5563' }}>创建和管理您的 AI 智能体</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <Button onClick={handleCreateAgent}>
            创建新智能体
          </Button>
        </div>

        {agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ color: '#6b7280' }}>
              <div style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>🤖</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>暂无智能体</h3>
              <p style={{ fontSize: '0.875rem' }}>创建您的第一个 AI 智能体吧！</p>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1rem' 
          }}>
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  border: currentAgent?.id === agent.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleSelectAgent(agent)}
              >
                <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                  {agent.name}
                </h3>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  marginBottom: '1rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {agent.instructions}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {agent.modelConfig.provider} / {agent.modelConfig.model}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('编辑智能体:', agent.id);
                    }}
                  >
                    编辑
                  </Button>
                </div>
                {currentAgent?.id === agent.id && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    color: '#1d4ed8',
                    textAlign: 'center'
                  }}>
                    当前选中
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};
