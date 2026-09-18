import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, RotateCcw, Code2, Sparkles, Maximize2, Minimize2, ArrowLeftRight } from 'lucide-react';
import { SirenInterpreter, convertDialect } from '../lib/sirenInterpreter';
import { ReplHistoryItem } from '../types';

interface SirenReplProps {
  onAskAi?: (prompt: string, code?: string) => void;
  onViewAst?: (ast: any, code: string) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  initialCodeToRun?: string | null;
}

export const SirenRepl: React.FC<SirenReplProps> = ({
  onAskAi,
  onViewAst,
  isMaximized,
  onToggleMaximize,
  initialCodeToRun,
}) => {
  const [interpreter] = useState(() => new SirenInterpreter());
  const [inputVal, setInputVal] = useState('');
  const [isMermaidDialect, setIsMermaidDialect] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const replEndRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<ReplHistoryItem[]>([
    {
      id: 'init-header',
      type: 'info',
      content: 'Siren Interactive REPL v0.0.4\nType .help, .ast, or expressions to evaluate. Exit with exit().',
    },
    {
      id: 'step-1',
      type: 'input',
      content: 'let x = 10',
    },
    {
      id: 'step-1-out',
      type: 'output',
      content: '=> 10 : i64',
    },
    {
      id: 'step-2',
      type: 'input',
      content: 'x * 2',
    },
    {
      id: 'step-2-out',
      type: 'output',
      content: '20',
    },
    {
      id: 'step-3',
      type: 'input',
      content: 'fn fib(n) { if n <= 1 return n; return fib(n-1) + fib(n-2); }',
    },
    {
      id: 'step-3-out',
      type: 'output',
      content: '=> fn(n: i64) -> i64 (JIT compiled in 0.04ms)',
    },
    {
      id: 'step-4',
      type: 'input',
      content: 'fib(12)',
    },
    {
      id: 'step-4-out',
      type: 'output',
      content: '144',
    },
  ]);

  // Seed environment with x = 10 and fib
  useEffect(() => {
    interpreter.evaluate('let x = 10');
    interpreter.evaluate('fn fib(n) { if n <= 1 return n; return fib(n-1) + fib(n-2); }');
  }, [interpreter]);

  useEffect(() => {
    if (initialCodeToRun) {
      handleEvaluate(initialCodeToRun);
    }
  }, [initialCodeToRun]);

  useEffect(() => {
    replEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  const handleEvaluate = (rawInput: string) => {
    const input = rawInput.trim();
    if (!input) return;

    setCommandHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);

    const newItems = [...items, { id: `in-${Date.now()}`, type: 'input' as const, content: input }];

    // Handle special REPL dot commands
    if (input === '.help') {
      newItems.push({
        id: `out-${Date.now()}`,
        type: 'info',
        content: `Siren REPL Commands:\n  .help           Show this help manual\n  .ast            Inspect AST tree of the last evaluated expression\n  .ir             View LLVM IR for the last evaluated statement\n  .dialect        Convert code between Standard and Mermaid dialect\n  .clear          Clear REPL history\n  .examples       Load sample recursive & loop programs\n\nSiren Language Quick Tips:\n  - Standard:   let a: int = 42;  | fn add(x: int) -> int { return x + 1; }\n  - Mermaid:    dive a: int is 42 tide | sing add(x: int) flows int { surface x + 1 tide }`,
      });
      setItems(newItems);
      setInputVal('');
      return;
    }

    if (input === '.clear') {
      setItems([
        {
          id: `header-${Date.now()}`,
          type: 'info',
          content: 'Siren Interactive REPL v0.0.4\nType .help, .ast, or expressions to evaluate. Exit with exit().',
        },
      ]);
      setInputVal('');
      return;
    }

    if (input === '.examples') {
      newItems.push({
        id: `out-${Date.now()}`,
        type: 'info',
        content: `Loaded examples into session:\n1. Standard: let radius: float = 3.14;\n2. Mermaid:  sing square(x: int) flows int { surface x * x tide }\n3. Fibonacci: fib(12)\nTry evaluating them directly!`,
      });
      setItems(newItems);
      setInputVal('');
      return;
    }

    if (input === '.ast') {
      const lastInput = items.filter((i) => i.type === 'input').pop()?.content || 'let x = 10';
      const result = interpreter.evaluate(lastInput);
      onViewAst?.(result.astJson, lastInput);
      newItems.push({
        id: `out-${Date.now()}`,
        type: 'ast',
        content: JSON.stringify(result.astJson, null, 2),
        rawAst: result.astJson,
      });
      setItems(newItems);
      setInputVal('');
      return;
    }

    if (input === '.ir') {
      const lastInput = items.filter((i) => i.type === 'input').pop()?.content || 'let x = 10';
      const result = interpreter.evaluate(lastInput);
      newItems.push({
        id: `out-${Date.now()}`,
        type: 'output',
        content: result.llvmIr || `; No LLVM IR emitted for ${lastInput}`,
      });
      setItems(newItems);
      setInputVal('');
      return;
    }

    if (input === '.dialect') {
      const lastInput = items.filter((i) => i.type === 'input').pop()?.content || 'let x = 10;';
      const converted = convertDialect(lastInput, !isMermaidDialect);
      newItems.push({
        id: `out-${Date.now()}`,
        type: 'info',
        content: `Dialect Translation (${isMermaidDialect ? 'Mermaid -> Standard' : 'Standard -> Mermaid'}):\n${converted}`,
      });
      setItems(newItems);
      setInputVal('');
      return;
    }

    // Evaluate in Siren engine
    const evalRes = interpreter.evaluate(input);

    newItems.push({
      id: `out-${Date.now()}`,
      type: evalRes.isError ? 'error' : 'output',
      content: evalRes.output,
      rawAst: evalRes.astJson,
      executionTimeMs: evalRes.compileTimeMs,
    });

    setItems(newItems);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEvaluate(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx >= commandHistory.length) {
          setHistoryIndex(-1);
          setInputVal('');
        } else {
          setHistoryIndex(nextIdx);
          setInputVal(commandHistory[nextIdx] || '');
        }
      }
    }
  };

  return (
    <div
      id="siren-repl-pane"
      className="flex flex-col h-full bg-[#090d12] text-gray-200 font-mono text-[13px] leading-relaxed border border-[#1e293b] rounded-lg shadow-2xl overflow-hidden"
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e141c] border-b border-[#1e293b] select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-medium text-gray-300">Siren Interactive REPL v0.0.4</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-indigo-950/60 text-indigo-300 border border-indigo-700/40 rounded">
            MCJIT Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dialect Switcher */}
          <button
            id="repl-dialect-toggle"
            onClick={() => setIsMermaidDialect(!isMermaidDialect)}
            className={`text-[11px] px-2 py-0.5 rounded transition flex items-center gap-1 border ${
              isMermaidDialect
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
            title="Switch between Standard and Mermaid ocean keyword dialects"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>{isMermaidDialect ? 'Mermaid Dialect' : 'Standard Dialect'}</span>
          </button>

          <button
            id="repl-ast-btn"
            onClick={() => handleEvaluate('.ast')}
            className="text-xs text-gray-400 hover:text-indigo-300 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
            title="Inspect AST"
          >
            .ast
          </button>

          <button
            id="repl-clear-btn"
            onClick={() => handleEvaluate('.clear')}
            className="text-xs text-gray-400 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
            title="Clear REPL"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {onToggleMaximize && (
            <button
              id="repl-maximize-btn"
              onClick={onToggleMaximize}
              className="text-xs text-gray-400 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
              title={isMaximized ? 'Restore view' : 'Maximize window'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* REPL Screen History */}
      <div
        className="flex-1 p-3 overflow-y-auto space-y-1.5 select-text font-mono text-[13px]"
        onClick={() => inputRef.current?.focus()}
      >
        {items.map((item) => {
          if (item.type === 'info') {
            return (
              <div key={item.id} className="text-slate-400 whitespace-pre-wrap text-[12px] mb-2 leading-relaxed">
                {item.content}
              </div>
            );
          }

          if (item.type === 'input') {
            return (
              <div key={item.id} className="flex items-center gap-1.5 text-gray-100 font-medium">
                <span className="text-indigo-400 font-bold select-none">&gt;&gt;&gt;</span>
                <span>{item.content}</span>
              </div>
            );
          }

          if (item.type === 'ast') {
            return (
              <div key={item.id} className="my-1.5 p-2 bg-[#0c121c] border border-indigo-900/60 rounded text-[11px]">
                <div className="text-indigo-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Abstract Syntax Tree (AST)</span>
                  <button
                    onClick={() => onViewAst?.(item.rawAst, 'AST')}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Open Full Inspector
                  </button>
                </div>
                <pre className="text-emerald-300 overflow-x-auto max-h-40">{item.content}</pre>
              </div>
            );
          }

          if (item.type === 'error') {
            return (
              <div key={item.id} className="text-rose-400 whitespace-pre-wrap text-[12px] flex items-center justify-between">
                <span>{item.content}</span>
                <button
                  onClick={() => onAskAi?.(`Why did my Siren code give this error?\n${item.content}`)}
                  className="text-[10px] px-1.5 py-0.5 bg-rose-950/60 border border-rose-800 rounded hover:bg-rose-900 text-rose-200 transition flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Ask SirenAI
                </button>
              </div>
            );
          }

          return (
            <div key={item.id} className="text-gray-300 whitespace-pre-wrap">
              {item.content.startsWith('=>') ? (
                <span className="text-cyan-300">{item.content}</span>
              ) : (
                <span className="text-gray-100 font-semibold">{item.content}</span>
              )}
            </div>
          );
        })}

        {/* REPL Active Input Line */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-indigo-400 font-bold select-none">&gt;&gt;&gt;</span>
          <input
            ref={inputRef}
            id="siren-repl-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isMermaidDialect
                ? "Try 'dive x: int is 42 tide' or 'sing square(n) flows int'..."
                : "Try 'x * 2', 'let y = 5;', or 'fib(12)'..."
            }
            className="flex-1 bg-transparent text-white outline-none border-none font-mono text-[13px] px-1 focus:ring-0 placeholder:text-slate-600"
          />
        </div>
        <div ref={replEndRef} />
      </div>

      {/* REPL Quick Snippets Footer */}
      <div className="px-3 py-1.5 bg-[#0b1017] border-t border-[#182234] text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Quick:</span>
          <button
            onClick={() => handleEvaluate('fib(12)')}
            className="text-xs text-indigo-300 hover:text-indigo-100 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/60"
          >
            fib(12)
          </button>
          <button
            onClick={() =>
              handleEvaluate(
                isMermaidDialect
                  ? 'sing add(a: int, b: int) flows int { surface a + b tide }'
                  : 'fn add(a: int, b: int) -> int { return a + b; }'
              )
            }
            className="text-xs text-cyan-300 hover:text-cyan-100 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-900/60"
          >
            fn add()
          </button>
          <button
            onClick={() => handleEvaluate('printf("Siren is alive!\\n")')}
            className="text-xs text-emerald-300 hover:text-emerald-100 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/60"
          >
            printf()
          </button>
        </div>

        <button
          onClick={() => {
            const lastCode = items.filter((i) => i.type === 'input').pop()?.content || 'fn fib(n)';
            onAskAi?.(`Explain this Siren code and its LLVM compilation:\n${lastCode}`, lastCode);
          }}
          className="text-xs text-amber-300 hover:text-amber-100 flex items-center gap-1 hover:underline"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Explain in SirenAI</span>
        </button>
      </div>
    </div>
  );
};
