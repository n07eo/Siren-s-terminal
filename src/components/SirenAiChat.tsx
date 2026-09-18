import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Play,
  Copy,
  Check,
  RotateCcw,
  ArrowLeftRight,
  Code2,
  Cpu,
  FileCode,
  Maximize2,
  Minimize2,
  Lightbulb,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { convertDialect } from '../lib/sirenInterpreter';

interface SirenAiChatProps {
  onSendToRepl?: (code: string) => void;
  onViewAst?: (ast: any, code: string) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  externalQuery?: string | null;
  codeContext?: string;
}

export const SirenAiChat: React.FC<SirenAiChatProps> = ({
  onSendToRepl,
  onViewAst,
  isMaximized,
  onToggleMaximize,
  externalQuery,
  codeContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Greetings! I am **SirenAI**, the specialized intelligence agent for the **Siren programming language** (v0.0.4-dev).

I have direct access to Siren's full compiler codebase, including:
- **Core Syntax & Semantics**: Type system (\`int\`, \`float\`, \`bool\`, \`str\`, \`void\`), control flow, assignments, functions, and LLVM JIT runtime.
- **Dual Dialects**: Standard canonical syntax (\`let\`, \`fn\`, \`return\`, \`if\`) and the ocean-inspired **Mermaid dialect** (\`dive\`, \`sing\`, \`surface\`, \`flows\`, \`tide\`).
- **Pratt Parser & AST Architecture**: Precedence binding power, node trees, and expressions.
- **LLVM IR Generation & MCJIT**: How Siren translates ASTs into machine code in memory.

What would you like to build or explore in Siren?`,
      timestamp: 'Just now',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (externalQuery) {
      sendMessage(externalQuery);
    }
  }, [externalQuery]);

  const quickPrompts = [
    {
      label: 'Mermaid Dialect',
      prompt: 'Explain the Siren Mermaid dialect keywords and show a comparison with standard syntax.',
    },
    {
      label: 'Fibonacci JIT',
      prompt: 'Show me how to write and JIT compile a recursive Fibonacci function in Siren.',
    },
    {
      label: 'LLVM IR Pipeline',
      prompt: 'How does Siren translate AST nodes to LLVM IR using llvmlite and MCJIT?',
    },
    {
      label: 'Loops & Variables',
      prompt: 'Give an example of while and for loops in Siren with variable assignments.',
    },
    {
      label: 'Pratt Parser',
      prompt: 'How does Siren implement operator precedence in its Pratt Parser?',
    },
  ];

  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          codeContext: codeContext || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with SirenAI');
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'I analyzed your request, but received an empty response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Error**: Could not reach backend AI: ${err.message}.\n\n*Tip: You can test the language directly in the Siren REPL or Arch Terminal!*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  /**
   * Renders Markdown-like text with specialized Siren code blocks
   */
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let lang = 'siren';
        let code = part.slice(3, -3).trim();

        if (lines[0] && !lines[0].includes(' ') && lines.length > 1) {
          lang = lines[0].toLowerCase();
          code = lines.slice(1).join('\n');
        }

        const blockId = `${msgId}-code-${index}`;
        const isMermaid = code.includes('sing') || code.includes('dive') || code.includes('surface');

        return (
          <div
            key={blockId}
            className="my-3 rounded-md bg-[#070a0e] border border-slate-800/90 overflow-hidden shadow-md"
          >
            {/* Code Block Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e141d] border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-mono">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-200 uppercase text-[11px] font-semibold">{lang}</span>
                {isMermaid && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                    Mermaid Dialect
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Convert dialect button */}
                <button
                  onClick={() => {
                    const converted = convertDialect(code, !isMermaid);
                    onSendToRepl?.(converted);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] hover:bg-slate-800 text-slate-300 transition flex items-center gap-1"
                  title="Translate dialect and load into REPL"
                >
                  <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                  <span>{isMermaid ? 'To Standard' : 'To Mermaid'}</span>
                </button>

                {/* Send to REPL */}
                {onSendToRepl && (
                  <button
                    onClick={() => onSendToRepl(code)}
                    className="px-2 py-0.5 rounded text-[11px] bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 transition flex items-center gap-1"
                    title="Execute in REPL"
                  >
                    <Play className="w-3 h-3 text-indigo-300" />
                    <span>Run in REPL</span>
                  </button>
                )}

                {/* Copy button */}
                <button
                  onClick={() => handleCopyCode(code, blockId)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  title="Copy code"
                >
                  {copiedCodeId === blockId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Code Content */}
            <pre className="p-3 font-mono text-[12.5px] leading-relaxed text-emerald-300 overflow-x-auto selection:bg-cyan-900 selection:text-white">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Simple text / markdown formatting
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-[13px] my-1 text-slate-200">
          {part.split('\n\n').map((paragraph, pIdx) => {
            // Check for bold or headers
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={pIdx} className="text-cyan-300 font-bold text-sm mt-3 mb-1 font-mono">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={pIdx} className="text-cyan-300 font-bold text-base mt-4 mb-2 font-mono">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            return (
              <p key={pIdx} className="mb-2">
                {paragraph}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div
      id="siren-ai-chat-pane"
      className="flex flex-col h-full bg-[#080b0f] text-gray-200 font-sans border border-[#1e293b] rounded-lg shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0d131b] border-b border-[#1e293b] select-none font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white tracking-wide">SirenAI</span>
          <span className="text-[11px] text-slate-400 border-l border-slate-700 pl-2">
            Language & Compiler Specialist
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMessages([
                {
                  id: 'reset-welcome',
                  role: 'assistant',
                  content: 'Session cleared. Ask me anything about the Siren programming language!',
                  timestamp: 'Now',
                },
              ])
            }
            className="text-xs text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {onToggleMaximize && (
            <button
              id="chat-maximize-btn"
              onClick={onToggleMaximize}
              className="text-xs text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-slate-800 transition"
              title={isMaximized ? 'Restore view' : 'Maximize window'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-3 py-1.5 bg-[#0a0f16] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none font-mono text-xs">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-slate-500 shrink-0 text-[11px]">Explore:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(qp.prompt)}
            disabled={isLoading}
            className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/60 hover:border-cyan-500/70 hover:text-cyan-300 transition whitespace-nowrap"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Meta */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mb-1 px-1">
                <span className={isUser ? 'text-indigo-400 font-semibold' : 'text-cyan-400 font-semibold'}>
                  {isUser ? 'lucifer' : 'SirenAI'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3.5 rounded-lg max-w-[95%] border ${
                  isUser
                    ? 'bg-[#141b28] border-indigo-900/60 text-indigo-50'
                    : 'bg-[#0d141e] border-slate-800/80 text-gray-200'
                }`}
              >
                {renderMessageContent(msg.content, msg.id)}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono p-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>SirenAI is consulting compiler specs & generating response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-[#0a0f16] border-t border-slate-800/80 font-mono">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputVal);
          }}
          className="flex items-end gap-2 bg-[#0e1622] border border-slate-700/80 rounded-lg p-2 focus-within:border-cyan-500/80 transition"
        >
          <textarea
            ref={inputRef}
            id="siren-ai-input"
            rows={2}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputVal);
              }
            }}
            placeholder="Ask anything about Siren: syntax, LLVM IR, Mermaid keywords, fibonacci, JIT..."
            className="flex-1 bg-transparent text-white text-[13px] outline-none resize-none placeholder:text-slate-500 font-mono"
          />
          <button
            id="siren-ai-submit"
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="p-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white transition flex items-center justify-center shrink-0"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Powered by Gemini 3.8 Flash & Siren Language AST</span>
        </div>
      </div>
    </div>
  );
};
