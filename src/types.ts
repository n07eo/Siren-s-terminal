export type WindowId = 'terminal' | 'repl' | 'chatbot' | 'sysmon' | 'ast';

export type LayoutMode = 'quad' | 'chat-focus' | 'repl-focus' | 'maximized';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeSnippets?: Array<{
    language: string;
    code: string;
  }>;
}

export interface ReplHistoryItem {
  id: string;
  type: 'input' | 'output' | 'error' | 'info' | 'ast';
  content: string;
  rawAst?: any;
  executionTimeMs?: number;
}

export interface ProcessItem {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
}
