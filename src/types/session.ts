import { z } from 'zod';

// Message role types 
export type MessageRole = 'user' | 'assistant' | 'system';
export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);

// Agent history item types 
export type AgentHistoryItemType = 
  | 'message' 
  | 'function_call' 
  | 'function_call_result'
  | 'handoff'
  | 'output_text';

export const AgentHistoryItemTypeSchema = z.enum([
  'message', 
  'function_call', 
  'function_call_result', 
  'handoff',
  'output_text'
]);

// Function call schema
export const FunctionCallSchema = z.object({
  id: z.string(),
  type: z.literal('function_call'),
  name: z.string(),
  arguments: z.string(), // JSON String
  callId: z.string(),
  status: z.enum(['pending', 'completed', 'failed']).default('pending'),
  providerData: z.record(z.any()).optional(),
}).strict();

export type FunctionCall = z.infer<typeof FunctionCallSchema>;

// Function call result schema
export const FunctionCallResultSchema = z.object({
  type: z.literal('function_call_result'),
  name: z.string(),
  callId: z.string(), // Reference to the corresponding function call
  status: z.enum(['completed', 'failed']),
  output: z.union([
    z.object({
      type: z.literal('text'),
      text: z.string(),
    }),
    z.object({
      type: z.literal('error'),
      error: z.string(),
    })
  ]),
}).strict();

export type FunctionCallResult = z.infer<typeof FunctionCallResultSchema>;

// Content schema 
export const ContentItemSchema = z.union([
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('output_text'),
    text: z.string(),
    providerData: z.record(z.any()).optional(),
  })
]);

export type ContentItem = z.infer<typeof ContentItemSchema>;

// Message schema 
export const MessageSchema = z.object({
  id: z.string().optional(),
  type: z.literal('message'),
  role: MessageRoleSchema,
  content: z.union([
    z.string(),
    z.array(ContentItemSchema)
  ]),
  timestamp: z.number(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
}).strict();

export type Message = z.infer<typeof MessageSchema>;

// Handoff schema 
export const HandoffSchema = z.object({
  id: z.string(),
  type: z.literal('handoff'),
  fromAgentId: z.string(),
  toAgentId: z.string(),
  reason: z.string().optional(),
  timestamp: z.number(),
}).strict();

export type Handoff = z.infer<typeof HandoffSchema>;

// Agent history item 
export const AgentHistoryItemSchema = z.union([
  MessageSchema,
  FunctionCallSchema,
  FunctionCallResultSchema,
  HandoffSchema,
]);

export type AgentHistoryItem = z.infer<typeof AgentHistoryItemSchema>;

export const SessionContextSchema = z.object({
  totalTokens: z.number().default(0),
  totalMessages: z.number().default(0),
  totalFunctionCalls: z.number().default(0),
  lastActivity: z.number(),
  lastAgentId: z.string().optional(), // Records the last active agent
}).strict();

export type SessionContext = z.infer<typeof SessionContextSchema>;

export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z.number(),
  updatedAt: z.number(),
  history: z.array(AgentHistoryItemSchema).default([]),
  context: SessionContextSchema,
  status: z.enum(['active', 'paused', 'completed']).default('active'),
}).strict();

export type ChatSession = z.infer<typeof ChatSessionSchema>;

// Session creation input schema
export const CreateSessionInputSchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().min(1).max(100),
}).strict();

export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;

// Session update input schema
export const UpdateSessionInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
}).strict();

export type UpdateSessionInput = z.infer<typeof UpdateSessionInputSchema>;