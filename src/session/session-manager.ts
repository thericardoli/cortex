import { run } from "@openai/agents";
import type {
	ChatSession,
	AgentHistoryItem,
	Message,
	CreateSessionInput,
	UpdateSessionInput,
	Result,
} from "../types";
import {
	ChatSessionSchema,
	CreateSessionInputSchema,
	UpdateSessionInputSchema,
} from "../types";
import { SessionStorage } from "../storage";
import { AgentManager } from "../agent";

export class SessionManager {
	private sessions: Map<string, ChatSession> = new Map();
	private sessionStorage: SessionStorage;
	private agentManager: AgentManager;

	constructor(sessionStorage: SessionStorage, agentManager: AgentManager) {
		this.sessionStorage = sessionStorage;
		this.agentManager = agentManager;
	}

	async initialize(): Promise<Result<void>> {
		try {
			// Load all sessions for all agents
			const agentConfigs = this.agentManager.getAllAgentConfigs();

			for (const config of agentConfigs) {
				const sessionsResult = await this.sessionStorage.listSessions(
					config.id
				);

				if (sessionsResult.success) {
					for (const session of sessionsResult.data || []) {
						this.sessions.set(session.id, session);
					}
				}
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error
						: new Error("Failed to initialize session manager"),
			};
		}
	}

	async createSession(
		input: CreateSessionInput
	): Promise<Result<ChatSession>> {
		try {
			// Validate input
			const validInput = CreateSessionInputSchema.parse(input);

			// Check if agent exists
			if (!this.agentManager.hasAgent(validInput.agentId)) {
				return {
					success: false,
					error: new Error(`Agent ${validInput.agentId} not found`),
				};
			}

			// Create session
			const session: ChatSession = {
				id: crypto.randomUUID(),
				agentId: validInput.agentId,
				name: validInput.name,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				history: [],
				context: {
					totalTokens: 0,
					totalMessages: 0,
					totalFunctionCalls: 0,
					lastActivity: Date.now(),
				},
				status: "active",
			};

			// Validate complete session
			const validSession = ChatSessionSchema.parse(session);

			// Save to storage
			const saveResult = await this.sessionStorage.saveSession(
				validSession
			);
			if (!saveResult.success) {
				return {
					success: false,
					error: saveResult.error,
				};
			}

			// Store in memory
			this.sessions.set(session.id, validSession);

			return { success: true, data: validSession };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error
						: new Error("Failed to create session"),
			};
		}
	}

	async updateSession(
		id: string,
		input: UpdateSessionInput
	): Promise<Result<ChatSession>> {
		try {
			// Validate input
			const validInput = UpdateSessionInputSchema.parse(input);

			// Get existing session
			const existingSession = this.sessions.get(id);
			if (!existingSession) {
				return {
					success: false,
					error: new Error(`Session ${id} not found`),
				};
			}

			// Create updated session
			const updatedSession: ChatSession = {
				...existingSession,
				...validInput,
				updatedAt: Date.now(),
			};

			// Validate complete session
			const validSession = ChatSessionSchema.parse(updatedSession);

			// Save to storage
			const saveResult = await this.sessionStorage.saveSession(
				validSession
			);
			if (!saveResult.success) {
				return {
					success: false,
					error: saveResult.error,
				};
			}

			// Update in memory
			this.sessions.set(id, validSession);

			return { success: true, data: validSession };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error
						: new Error("Failed to update session"),
			};
		}
	}

	async deleteSession(id: string): Promise<Result<void>> {
		try {
			// Check if session exists
			const session = this.sessions.get(id);
			if (!session) {
				return {
					success: false,
					error: new Error(`Session ${id} not found`),
				};
			}

			// Delete from storage
			const deleteResult = await this.sessionStorage.deleteSession(
				session.agentId,
				id
			);
			if (!deleteResult.success) {
				return deleteResult;
			}

			// Remove from memory
			this.sessions.delete(id);

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error
						: new Error("Failed to delete session"),
			};
		}
	}

	async sendMessage(
		sessionId: string,
		content: string
	): Promise<Result<Message>> {
		try {
			// Get session
			const session = this.sessions.get(sessionId);
			if (!session) {
				return {
					success: false,
					error: new Error(`Session ${sessionId} not found`),
				};
			}

			const agent = await this.agentManager.getAgentInstance(
				session.agentId
			);

			// Create user message
			const userMessage: Message = {
				id: crypto.randomUUID(),
				type: "message",
				role: "user",
				content,
				timestamp: Date.now(),
				status: "completed",
			};

			// Add user message to history
			session.history.push(userMessage);
			session.context.totalMessages++;
			session.context.lastActivity = Date.now();
			session.updatedAt = Date.now();

			// 构建包含历史的对话上下文
			const conversationInput = this.buildConversationInput(session.history);
			console.log(`📝 Session 对话轮次: ${session.context.totalMessages}, 上下文消息数: ${conversationInput.length}`);

			// Run agent with complete conversation history
			const result = await run(agent, conversationInput);

			// Create assistant message from result
			const assistantMessage: Message = {
				id: crypto.randomUUID(),
				type: "message",
				role: "assistant",
				content: result.finalOutput || "",
				timestamp: Date.now(),
				status: "completed",
			};

			// Add assistant message to history
			session.history.push(assistantMessage);
			session.context.totalMessages++;

			// Process additional items from result.history if any
			// This is a simplified approach - in a full implementation you'd want to
			// properly map all the different item types
			if (result.history && result.history.length > 0) {
				// Count function calls in the result
				const functionCalls = result.history.filter(
					(item) => item.type === "function_call"
				);
				session.context.totalFunctionCalls += functionCalls.length;
			}

			session.context.lastActivity = Date.now();
			session.updatedAt = Date.now();

			// Update session in storage
			const saveResult = await this.sessionStorage.saveSession(session);
			if (!saveResult.success) {
				return {
					success: false,
					error: saveResult.error,
				};
			}

			// Update in memory
			this.sessions.set(sessionId, session);

			return { success: true, data: assistantMessage };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error
						: new Error("Failed to send message"),
			};
		}
	}

	/**
	 * 构建适用于 Agent SDK 的对话输入格式
	 */
	private buildConversationInput(history: AgentHistoryItem[]): any[] {
		return history
			.filter(item => item.type === 'message')  // 只处理消息类型
			.map(item => {
				const message = item as Message;
				return {
					role: message.role,
					content: typeof message.content === 'string' ? message.content : 
							JSON.stringify(message.content)  // 处理复杂内容
				};
			});
	}

	getSession(id: string): ChatSession | null {
		return this.sessions.get(id) || null;
	}

	getSessionsByAgent(agentId: string): ChatSession[] {
		return Array.from(this.sessions.values())
			.filter((session) => session.agentId === agentId)
			.sort((a, b) => b.context.lastActivity - a.context.lastActivity);
	}

	getAllSessions(): ChatSession[] {
		return Array.from(this.sessions.values()).sort(
			(a, b) => b.context.lastActivity - a.context.lastActivity
		);
	}

	async getRecentMessages(
		sessionId: string,
		limit = 50
	): Promise<Result<AgentHistoryItem[]>> {
		try {
			const session = this.sessions.get(sessionId);
			if (!session) {
				return {
					success: false,
					error: new Error(`Session ${sessionId} not found`),
				};
			}

			// Return the last 'limit' items from history
			const recentItems = session.history.slice(-limit);
			return { success: true, data: recentItems };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error
						: new Error("Failed to get recent messages"),
			};
		}
	}

	hasSession(id: string): boolean {
		return this.sessions.has(id);
	}

	async deleteAllSessionsForAgent(agentId: string): Promise<Result<void>> {
		try {
			// Get all sessions for this agent
			const agentSessions = this.getSessionsByAgent(agentId);

			// Delete each session
			for (const session of agentSessions) {
				const deleteResult = await this.deleteSession(session.id);
				if (!deleteResult.success) {
					return deleteResult;
				}
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error
						: new Error("Failed to delete sessions for agent"),
			};
		}
	}
}
