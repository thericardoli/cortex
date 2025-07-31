import React, { useState } from 'react';
import { Modal, Input, Button } from '@/ui/components';
import { usePlugin } from '@/ui/contexts/PluginContext';
import type { ProviderConfig } from '@/types/provider';

interface ProviderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProviderManagerModal: React.FC<ProviderManagerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { providerManager } = usePlugin();
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [formData, setFormData] = useState<Partial<ProviderConfig>>({
    id: '',
    name: '',
    providerType: 'OpenAICompatible',
    baseUrl: '',
    apiKey: '',
    enabled: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 加载已存在的 provider（可扩展为 useEffect 拉取）

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    if (!formData.id || !formData.id.trim()) newErrors.id = '请输入唯一ID';
    if (!formData.name || !formData.name.trim()) newErrors.name = '请输入名称';
    if (!formData.baseUrl || !formData.baseUrl.trim()) newErrors.baseUrl = '请输入Base URL';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      // 这里只处理 OpenAICompatible
      const config: ProviderConfig = {
        id: formData.id!,
        name: formData.name!,
        providerType: 'OpenAICompatible',
        baseUrl: formData.baseUrl!,
        apiKey: formData.apiKey || '',
        enabled: true
      };
      await providerManager.addProvider(config);
      setProviders(prev => [...prev, config]);
      onSuccess();
      onClose();
      setFormData({ id: '', name: '', providerType: 'OpenAICompatible', baseUrl: '', apiKey: '', enabled: true });
    } catch (error) {
      setErrors({ submit: '保存失败: ' + (error instanceof Error ? error.message : '未知错误') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>取消</Button>
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? '保存中...' : '保存'}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="自定义 OpenAI 兼容 Provider" footer={footer}>
      <div>
        <Input
          label="唯一ID"
          value={formData.id}
          onChange={e => handleChange('id', e.target.value)}
          placeholder="如 my-provider-1"
          error={errors.id}
        />
        <Input
          label="名称"
          value={formData.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="自定义名称"
          error={errors.name}
        />
        <Input
          label="Base URL"
          value={formData.baseUrl}
          onChange={e => handleChange('baseUrl', e.target.value)}
          placeholder="https://your-openai-compatible-endpoint/v1"
          error={errors.baseUrl}
        />
        <Input
          label="API Key"
          value={formData.apiKey}
          onChange={e => handleChange('apiKey', e.target.value)}
          placeholder="可选，API 密钥"
        />
        {errors.submit && <div style={{ color: 'red' }}>{errors.submit}</div>}
      </div>
    </Modal>
  );
};
