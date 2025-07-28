// Re-export all types for easy imports
export * from './agent';
export * from './session';
export * from './provider';

// Common utility types
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Event types
export interface CortexEvent {
  type: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface AgentEvent extends CortexEvent {
  type: 'agent.created' | 'agent.updated' | 'agent.deleted';
  agentId: string;
}

export interface SessionEvent extends CortexEvent {
  type: 'session.created' | 'session.updated' | 'session.deleted' | 'session.history.added';
  sessionId: string;
  agentId: string;
}

export interface ProviderEvent extends CortexEvent {
  type: 'provider.connected' | 'provider.disconnected' | 'provider.error';
  provider: string;
}

export interface ToolEvent extends CortexEvent {
  type: 'tool.called' | 'tool.completed' | 'tool.failed';
  toolName: string;
  agentId: string;
  sessionId?: string;
}

export interface AgentRunEvent extends CortexEvent {
  type: 'agent.run.started' | 'agent.run.completed' | 'agent.run.failed' | 'agent.run.interrupted';
  agentId: string;
  sessionId: string;
  runId: string;
}

export type CortexEventType = AgentEvent | SessionEvent | ProviderEvent | ToolEvent | AgentRunEvent;