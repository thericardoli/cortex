import React, { useState, useEffect } from 'react';
import { usePlugin } from '@/ui/contexts/PluginContext';
import { Button } from '@/ui/components/Button';

export const ChatPage: React.FC = () => {
  const { 
    sessionManager, 
    currentAgent, 
    currentSession,
    setCurrentAgent,
    setCurrentSession,
    agents,
    sessions,
    refreshAgents
  } = usePlugin();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // 初始化时加载智能体
  useEffect(() => {
    refreshAgents();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSession) return;

    // 添加用户消息
    const userMessage = { role: 'user' as const, content: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await sessionManager.sendMessage(currentSession.id, message);
      
      if (result.success && result.data) {
        // 处理 AI 回复内容 - 简化为字符串
        let aiContent = '';
        if (typeof result.data.content === 'string') {
          aiContent = result.data.content;
        } else if (Array.isArray(result.data.content)) {
          // 如果是数组格式，提取文本内容
          aiContent = result.data.content
            .map(item => item.type === 'text' ? item.text : item.text)
            .join('');
        }
        
        const aiMessage = { role: 'assistant' as const, content: aiContent };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('发送消息失败:', result.error);
      }
    } catch (error) {
      console.error('发送消息出错:', error);
    }

    setMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 聊天头部 */}
      <div style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <select 
            value={currentAgent?.id || ''}
            onChange={(e) => {
              const agent = agents.find(a => a.id === e.target.value);
              setCurrentAgent(agent || null);
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="">选择智能体...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        
        {currentAgent && (
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
              与 {currentAgent.name} 对话
            </h2>
            {currentSession && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                会话: {currentSession.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {!currentAgent ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
            请先选择一个智能体开始对话
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
            开始与 AI 对话吧！
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: msg.role === 'user' ? '#2563eb' : '#f3f4f6',
                    color: msg.role === 'user' ? 'white' : '#111827'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入您的消息..."
            disabled={!currentAgent}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              opacity: !currentAgent ? 0.5 : 1
            }}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || !currentAgent}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};
