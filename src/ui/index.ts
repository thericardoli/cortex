// 视图组件
export { ChatView, CHAT_VIEW_TYPE } from './views/ChatView';
export { AgentsView, AGENTS_VIEW_TYPE } from './views/AgentsView';

// 设置页面
export { CortexSettingTab, DEFAULT_SETTINGS } from './settings/CortexSettingTab';
export type { CortexSettings } from './settings/CortexSettingTab';

// 上下文
export { PluginProvider, usePlugin } from './contexts/PluginContext';
export type { PluginContextType } from './contexts/PluginContext';

// 基础组件
export { Button } from './components/Button';

// 页面组件（用于视图内部）
export { ChatPage } from './pages/ChatPage';
export { AgentsPage } from './pages/AgentsPage';
