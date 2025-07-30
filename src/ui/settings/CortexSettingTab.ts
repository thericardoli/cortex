import { App, PluginSettingTab, Setting } from 'obsidian';
import type CortexPlugin from '../../../main';

export interface CortexSettings {
  // Provider 设置
  openaiApiKey: string;
  openaiBaseUrl: string;
  anthropicApiKey: string;
  ollamaBaseUrl: string;
  defaultProvider: 'OpenAI' | 'Anthropic' | 'Ollama';
  
  // 通用设置
  autoSaveChats: boolean;
  showTimestamps: boolean;
  maxStorageSize: number;
  
  // 高级设置
  developerMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export const DEFAULT_SETTINGS: CortexSettings = {
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  anthropicApiKey: '',
  ollamaBaseUrl: 'http://localhost:11434',
  defaultProvider: 'OpenAI',
  autoSaveChats: true,
  showTimestamps: false,
  maxStorageSize: 100,
  developerMode: false,
  logLevel: 'info',
};

export class CortexSettingTab extends PluginSettingTab {
  plugin: CortexPlugin;

  constructor(app: App, plugin: CortexPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // 标题
    containerEl.createEl('h1', { text: 'Cortex AI 设置' });

    // Provider 设置部分
    containerEl.createEl('h2', { text: '模型提供者设置' });

    // OpenAI 设置
    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('输入您的 OpenAI API 密钥')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.openaiApiKey)
        .onChange(async (value) => {
          this.plugin.settings.openaiApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('OpenAI Base URL')
      .setDesc('OpenAI API 的基础 URL')
      .addText(text => text
        .setPlaceholder('https://api.openai.com/v1')
        .setValue(this.plugin.settings.openaiBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.openaiBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    // Anthropic 设置
    new Setting(containerEl)
      .setName('Anthropic API Key')
      .setDesc('输入您的 Anthropic API 密钥')
      .addText(text => text
        .setPlaceholder('sk-ant-...')
        .setValue(this.plugin.settings.anthropicApiKey)
        .onChange(async (value) => {
          this.plugin.settings.anthropicApiKey = value;
          await this.plugin.saveSettings();
        }));

    // Ollama 设置
    new Setting(containerEl)
      .setName('Ollama Base URL')
      .setDesc('Ollama 服务的基础 URL')
      .addText(text => text
        .setPlaceholder('http://localhost:11434')
        .setValue(this.plugin.settings.ollamaBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.ollamaBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    // 默认提供者
    new Setting(containerEl)
      .setName('默认提供者')
      .setDesc('选择默认的 AI 模型提供者')
      .addDropdown(dropdown => dropdown
        .addOption('OpenAI', 'OpenAI')
        .addOption('Anthropic', 'Anthropic')
        .addOption('Ollama', 'Ollama')
        .setValue(this.plugin.settings.defaultProvider)
        .onChange(async (value) => {
          this.plugin.settings.defaultProvider = value as any;
          await this.plugin.saveSettings();
        }));

    // 通用设置部分
    containerEl.createEl('h2', { text: '通用设置' });

    new Setting(containerEl)
      .setName('自动保存对话')
      .setDesc('自动保存聊天记录到本地')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoSaveChats)
        .onChange(async (value) => {
          this.plugin.settings.autoSaveChats = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('显示时间戳')
      .setDesc('在消息中显示发送时间')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showTimestamps)
        .onChange(async (value) => {
          this.plugin.settings.showTimestamps = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('最大存储大小 (MB)')
      .setDesc('智能体配置和对话历史的最大存储空间')
      .addText(text => text
        .setPlaceholder('100')
        .setValue(this.plugin.settings.maxStorageSize.toString())
        .onChange(async (value) => {
          const numValue = parseInt(value);
          if (!isNaN(numValue) && numValue > 0) {
            this.plugin.settings.maxStorageSize = numValue;
            await this.plugin.saveSettings();
          }
        }));

    // 高级设置部分
    containerEl.createEl('h2', { text: '高级设置' });

    new Setting(containerEl)
      .setName('开发者模式')
      .setDesc('显示调试信息和开发工具')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.developerMode)
        .onChange(async (value) => {
          this.plugin.settings.developerMode = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('日志级别')
      .setDesc('设置插件的日志详细程度')
      .addDropdown(dropdown => dropdown
        .addOption('error', '错误')
        .addOption('warn', '警告')
        .addOption('info', '信息')
        .addOption('debug', '调试')
        .setValue(this.plugin.settings.logLevel)
        .onChange(async (value) => {
          this.plugin.settings.logLevel = value as any;
          await this.plugin.saveSettings();
        }));

    // 操作按钮部分
    containerEl.createEl('h2', { text: '操作' });

    new Setting(containerEl)
      .setName('重置设置')
      .setDesc('将所有设置重置为默认值')
      .addButton(button => button
        .setButtonText('重置')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings = { ...DEFAULT_SETTINGS };
          await this.plugin.saveSettings();
          this.display(); // 重新显示设置页面
        }));

    new Setting(containerEl)
      .setName('测试连接')
      .setDesc('测试当前提供者设置是否正确')
      .addButton(button => button
        .setButtonText('测试')
        .onClick(async () => {
          // 这里将来会添加连接测试逻辑
          console.log('测试提供者连接...');
        }));
  }
}
