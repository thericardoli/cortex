# Cortex - Multi-Agent AI Plugin for Obsidian

A powerful AI plugin that enables multiple AI agents with different capabilities within Obsidian. Create specialized agents, manage multiple chat sessions, and leverage your knowledge base through RAG (Retrieval-Augmented Generation).

## Features

- **Multi-Agent System**: Create and manage multiple AI agents with different personalities and capabilities
- **Multiple Chat Sessions**: Each agent can have multiple independent conversations
- **Provider Support**: Works with OpenAI, Anthropic, and Ollama
- **Local Data Storage**: All data stored locally in `.cortex/` directory
- **Agent Configuration**: Customize instructions, models, and tools for each agent
- **Session Management**: Create, rename, and delete chat sessions
- **Import/Export**: Share agent configurations

## Installation

1. Copy the plugin files to your Obsidian vault's `.obsidian/plugins/cortex/` directory
2. Enable the plugin in Obsidian Settings → Community plugins
3. Configure your AI providers in the plugin settings

## Configuration

### Provider Setup

1. Go to Settings → Cortex
2. Enter your API keys for the providers you want to use:
   - **OpenAI**: Enter your OpenAI API key
   - **Anthropic**: Enter your Anthropic API key  
   - **Ollama**: Enter your Ollama server URL (default: http://localhost:11434)

### Creating Your First Agent

1. Click the Cortex icon in the ribbon or use the command palette
2. Click "Create Agent" in the sidebar
3. Configure:
   - **Name**: Give your agent a descriptive name
   - **Instructions**: Define the agent's personality and capabilities
   - **Model**: Choose from available models for your configured providers
   - **Settings**: Adjust temperature, max tokens, etc.

## Usage

### Agent Management

- **Create Agent**: Click the "+" button in the sidebar
- **Edit Agent**: Click the edit icon on any agent card
- **Delete Agent**: Click the delete icon (this will also delete all sessions)
- **Export Agent**: Click the export icon to save agent configuration as JSON
- **Import Agent**: Click "Import" to load an agent configuration

### Chat Sessions

- **New Session**: Select an agent and click "New Session"
- **Switch Sessions**: Click on any session in the list
- **Rename Session**: Click the edit icon next to a session name
- **Delete Session**: Click the delete icon next to a session

### Chatting

- Type your message in the input field
- Press Enter to send (Shift+Enter for new line)
- View conversation history with timestamps
- See token usage and message counts

## File Structure

```
.cortex/
├── config/
│   └── agents/
│       ├── agent-1.json
│       └── agent-2.json
└── sessions/
    ├── agent-1/
    │   ├── session-1.json
    │   └── session-2.json
    └── agent-2/
        └── session-1.json
```

## Development

### Building

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

## Future Features

- RAG integration with vault content
- Agent handoffs between specialists
- Tool system with web search, file search, etc.
- MCP (Model Context Protocol) support
- Streaming responses
- Voice interaction

## License

MIT License