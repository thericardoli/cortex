import React, { useState } from 'react';
import { Modal, Input, TextArea, Select, Button } from '@/ui/components';
import { usePlugin } from '@/ui/contexts/PluginContext';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { providerManager } = usePlugin();
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    provider: '',
    model: '',
    maxTokens: 4000,
    temperature: 0.7
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取可用的提供商列表
  const providers = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'anthropic', label: 'Anthropic' }
  ];

  // 根据提供商获取模型列表
  const getModelsForProvider = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4o', label: 'GPT-4 Omni' },
          { value: 'gpt-4o-mini', label: 'GPT-4 Omni Mini' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ];
      case 'ollama':
        return [
          { value: 'llama3.2', label: 'Llama 3.2' },
          { value: 'qwen2.5', label: 'Qwen 2.5' },
          { value: 'codellama', label: 'Code Llama' }
        ];
      case 'anthropic':
        return [
          { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
        ];
      default:
        return [];
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入智能体名称';
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = '请输入智能体指令';
    }

    if (!formData.provider) {
      newErrors.provider = '请选择提供商';
    }

    if (!formData.model) {
      newErrors.model = '请选择模型';
    }

    if (formData.maxTokens < 100 || formData.maxTokens > 128000) {
      newErrors.maxTokens = '最大令牌数必须在 100-128000 之间';
    }

    if (formData.temperature < 0 || formData.temperature > 2) {
      newErrors.temperature = '温度必须在 0-2 之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 这里将来会调用 agentManager.createAgent
      console.log('创建智能体:', formData);
      
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
      onClose();
      
      // 重置表单
      setFormData({
        name: '',
        instructions: '',
        provider: '',
        model: '',
        maxTokens: 4000,
        temperature: 0.7
      });
    } catch (error) {
      console.error('创建智能体失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const footer = (
    <>
      <Button 
        variant="secondary" 
        onClick={handleClose}
        disabled={isSubmitting}
      >
        取消
      </Button>
      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? '创建中...' : '创建智能体'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="创建新智能体"
      footer={footer}
    >
      <div>
        <Input
          label="智能体名称"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="输入智能体名称"
          error={errors.name}
        />

        <TextArea
          label="系统指令"
          value={formData.instructions}
          onChange={(e) => handleChange('instructions', e.target.value)}
          placeholder="描述智能体的角色和任务"
          rows={6}
          error={errors.instructions}
          helpText="这些指令将告诉 AI 如何行为和回应"
        />

        <Select
          label="提供商"
          value={formData.provider}
          onChange={(e) => {
            handleChange('provider', e.target.value);
            handleChange('model', ''); // 重置模型选择
          }}
          options={providers}
          placeholder="选择 AI 提供商"
          error={errors.provider}
        />

        {formData.provider && (
          <Select
            label="模型"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            options={getModelsForProvider(formData.provider)}
            placeholder="选择模型"
            error={errors.model}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="最大令牌数"
            type="number"
            value={formData.maxTokens}
            onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 0)}
            min={100}
            max={128000}
            error={errors.maxTokens}
            helpText="控制响应长度"
          />

          <Input
            label="温度"
            type="number"
            value={formData.temperature}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || 0)}
            min={0}
            max={2}
            step={0.1}
            error={errors.temperature}
            helpText="控制创造性 (0-2)"
          />
        </div>
      </div>
    </Modal>
  );
};
