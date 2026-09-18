import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Maximize2, Minimize2, Copy, Check } from 'lucide-react';

interface ArchTerminalProps {
  onAskAi?: (prompt: string) => void;
  onSendToRepl?: (code: string) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const ArchTerminal: React.FC<ArchTerminalProps> = ({
  onAskAi,
  onSendToRepl,
  isMaximized,
  onToggleMaximize,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [lines, setLines] = useState<Array<{ id: string; type: 'banner' | 'prompt' | 'output' | 'arch'; text?: string; command?: string }>>([
    {
      id: 'banner-1',
      type: 'banner',
      text: 'Arch Terminal v2.4-rolling | Session: lucifer@arch (pts/1)\nDoudi package manager initialized (cache: valid, synced: 0m ago).\nShell: zsh 5.9  |  Arch: x86_64  |  Kernel: 6.8.9-arch1-1  |  Siren: v0.0.4-dev\nType doudi help for package ops, siren for language runtime, or Ctrl+Space for Siren AI.',
    },
    {
      id: 'cmd-1',
      type: 'prompt',
      command: 'neofetch',
    },
    {
      id: 'output-neofetch',
      type: 'arch',
    },
    {
      id: 'cmd-2',
      type: 'prompt',
      command: 'doudi search siren',
    },
    {
      id: 'output-search',
      type: 'output',
      text: `\x1b[36msiren 0.0.4-1\x1b[0m        Siren programming language core compiler & toolchain \x1b[32m[core/lang]\x1b[0m\n\x1b[36msiren-runtime 0.0.4-1\x1b[0m Siren high-performance JIT runtime environment \x1b[32m[extra/runtime]\x1b[0m\n\x1b[36msiren-stdlib 0.0.4-1\x1b[0m  Standard library for Siren (collections, io, async, net) \x1b[32m[extra/libs]\x1b[0m\n\x1b[36msiren-lsp 0.0.2-3\x1b[0m     Language Server Protocol daemon for Siren IDE integration \x1b[33m[community]\x1b[0m`,
    },
    {
      id: 'cmd-3',
      type: 'prompt',
      command: 'doudi install siren',
    },
    {
      id: 'output-install',
      type: 'output',
      text: `resolving dependencies...\nchecking package integrity...\npreparing installation...\nPackages (3) siren-0.0.4  siren-runtime-0.0.4  siren-stdlib-0.0.4\nTotal Download Size: 24.6 MiB\nTotal Installed Size: 71.3 MiB\n:: Proceed with installation? [Y/n] Y\ndownloading packages...\nsiren-0.0.4-x86_64.doudi\n[####################################################] 100% 32.4MiB/s 00:00\nsiren-runtime-0.0.4-x86_64.doudi\n[####################################################] 100% 41.8MiB/s 00:00\n(1/3) installing siren...\n(2/3) configuring siren-runtime hooks...\n(3/3) installing siren-stdlib into /usr/lib/siren/...\n:: Installation complete. Binary linked to /usr/bin/siren.`,
    },
    {
      id: 'cmd-4',
      type: 'prompt',
      command: 'cd Projects/siren && git status',
    },
    {
      id: 'output-git',
      type: 'output',
      text: `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\tmodified:   Compiler.py (LLVM MCJIT codegen)\n\tmodified:   Token.py (Mermaid keyword aliases: dive, sing, tide)\n\nUntracked files:\n\ttests/mermaid_fib.siren\n\nno changes added to commit (use "git add" to track)`,
    },
  ]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    const newLines = [...lines, { id: `cmd-${Date.now()}`, type: 'prompt' as const, command: cmd }];

    const lower = cmd.toLowerCase();

    if (lower === 'clear') {
      setLines([]);
      setInputVal('');
      return;
    }

    if (lower === 'neofetch') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'arch',
      });
    } else if (lower === 'help' || lower === '--help') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `Available Arch commands:\n  neofetch               Display system information\n  doudi search <pkg>     Search Doudi packages (e.g., doudi search siren)\n  doudi install <pkg>    Install a package via Doudi\n  siren --version        Check Siren compiler version\n  siren run <file>       Compile and execute a Siren program\n  siren-ai <question>    Ask SirenAI directly from CLI\n  repl                   Switch to Siren Interactive REPL\n  clear                  Clear terminal window`,
      });
    } else if (lower.startsWith('siren-ai ') || lower.startsWith('ai ')) {
      const q = cmd.replace(/^(siren-ai|ai)\s+/, '');
      onAskAi?.(q);
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `[SirenAI] Routing query to Siren Language Assistant: "${q}"...\nCheck the SirenAI window for the detailed compiler analysis!`,
      });
    } else if (lower.startsWith('doudi search')) {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `siren 0.0.4-1        Siren core compiler & toolchain [core/lang]\nsiren-runtime 0.0.4- Siren JIT runtime environment [extra/runtime]\nsiren-stdlib 0.0.4-1 Standard library for Siren [extra/libs]\nsiren-lsp 0.0.2-3    Language Server Protocol daemon [community]`,
      });
    } else if (lower.startsWith('doudi install')) {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `Package siren is already installed at latest version (v0.0.4-dev).`,
      });
    } else if (lower === 'siren --version' || lower === 'siren -v') {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `SirenLang v0.0.4-dev (target: x86_64-pc-linux-gnu, LLVM 18.1.8 MCJIT)`,
      });
    } else if (lower.startsWith('siren run') || lower.startsWith('siren tests/')) {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `=== Compiling tests/mermaid_fib.siren ===\nParsed AST in: 0.12 ms.\nEmitted LLVM IR in: 0.28 ms.\nMCJIT Compilation completed in: 0.04 ms.\n\nProgram output:\nmermaid fib(12) = 144\n\nProgram returned: 144\n=== Executed in 1.4 ms. ===`,
      });
    } else if (lower.includes('git status')) {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `On branch main\nYour branch is up to date with 'origin/main'.\nnothing to commit, working tree clean`,
      });
    } else {
      newLines.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `zsh: command not found: ${cmd}. Type 'help' for available commands or 'siren-ai <question>' to ask AI.`,
      });
    }

    setLines(newLines);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx >= history.length) {
          setHistoryIndex(-1);
          setInputVal('');
        } else {
          setHistoryIndex(nextIdx);
          setInputVal(history[nextIdx] || '');
        }
      }
    }
  };

  const copyTerminalContent = () => {
    const text = lines
      .map((l) => (l.type === 'prompt' ? `[lucifer@arch ~]$ ${l.command}` : l.text || ''))
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="arch-terminal-pane"
      className="flex flex-col h-full bg-[#0a0d11] text-gray-200 font-mono text-[13px] leading-relaxed border border-[#1e293b] rounded-lg shadow-2xl overflow-hidden"
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e141c] border-b border-[#1e293b] select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-gray-300">
            Arch Terminal v2.4-rolling | Session: lucifer@arch (pts/1)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-terminal-btn"
            onClick={copyTerminalContent}
            className="text-xs text-gray-400 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition flex items-center gap-1"
            title="Copy terminal session"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {onToggleMaximize && (
            <button
              id="terminal-maximize-btn"
              onClick={onToggleMaximize}
              className="text-xs text-gray-400 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
              title={isMaximized ? 'Restore view' : 'Maximize window'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div
        className="flex-1 p-3 overflow-y-auto space-y-2 select-text"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => {
          if (line.type === 'banner') {
            return (
              <div
                key={line.id}
                className="text-cyan-300/80 border-b border-slate-800/80 pb-2 mb-2 whitespace-pre-wrap leading-tight text-[12px]"
              >
                {line.text}
              </div>
            );
          }

          if (line.type === 'prompt') {
            return (
              <div key={line.id} className="flex items-center gap-1.5 flex-wrap">
                <span className="text-emerald-400 font-semibold">[lucifer@arch</span>
                <span className="text-slate-400">~</span>
                <span className="text-emerald-400 font-semibold">]$</span>
                <span className="text-white font-medium ml-1">{line.command}</span>
              </div>
            );
          }

          if (line.type === 'arch') {
            return (
              <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-1.5">
                {/* Arch ASCII Logo */}
                <div className="md:col-span-4 text-cyan-400 font-mono text-[11px] leading-[13px] whitespace-pre select-none">
{`                  %*
                 %*%
                ###%
               %**
              #*##*
             %#***
            ######*#
          %#*#*###+++++##
         %%*#####%%%%%%####
        %%*#########%%%%%`}
                </div>

                {/* Neofetch Specs */}
                <div className="md:col-span-8 text-xs space-y-0.5">
                  <div className="font-bold text-cyan-300">lucifer@arch</div>
                  <div className="text-slate-500">------------------</div>
                  <div><span className="text-cyan-400">OS:</span> Arch Linux x86_64</div>
                  <div><span className="text-cyan-400">Host:</span> ThinkPad X1 Carbon Gen 11</div>
                  <div><span className="text-cyan-400">Kernel:</span> 6.8.9-arch1-1</div>
                  <div><span className="text-cyan-400">Uptime:</span> 4 days, 16 hours, 28 mins</div>
                  <div><span className="text-cyan-400">Packages:</span> 914 (doudi)</div>
                  <div><span className="text-cyan-400">Shell:</span> zsh 5.9</div>
                  <div><span className="text-cyan-400">Terminal:</span> Arch Terminal 2.4</div>
                  <div><span className="text-cyan-400">CPU:</span> Intel i7-1370P (20) @ 5.200GHz</div>
                  <div><span className="text-cyan-400">Memory:</span> 4128MiB / 31820MiB (12%)</div>
                  <div><span className="text-cyan-400">Language:</span> Siren v0.0.4 (LLVM MCJIT active)</div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={line.id}
              className="text-slate-300 whitespace-pre-wrap font-mono text-[12px] leading-relaxed"
            >
              {line.text}
            </div>
          );
        })}

        {/* Live Prompt Input */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-emerald-400 font-semibold">[lucifer@arch</span>
          <span className="text-slate-400">~</span>
          <span className="text-emerald-400 font-semibold">]$</span>
          <input
            ref={inputRef}
            id="terminal-cli-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type 'doudi help', 'siren run', 'siren-ai <question>', or 'neofetch'..."
            className="flex-1 bg-transparent text-white outline-none border-none font-mono text-[13px] px-1 focus:ring-0 placeholder:text-slate-600"
            autoFocus
          />
        </div>
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Quick Shortcuts Bar */}
      <div className="px-3 py-1 bg-[#0b1017] border-t border-[#182234] text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="hover:text-cyan-400 cursor-pointer" onClick={() => handleCommand('neofetch')}>$ neofetch</span>
          <span className="hover:text-cyan-400 cursor-pointer" onClick={() => handleCommand('doudi search siren')}>$ doudi search</span>
          <span className="hover:text-cyan-400 cursor-pointer" onClick={() => handleCommand('siren run tests/mermaid_fib.siren')}>$ siren run fib</span>
          <span className="hover:text-cyan-400 cursor-pointer" onClick={() => onAskAi?.('How does the Siren Pratt parser work?')}>$ siren-ai</span>
        </div>
        <span className="text-slate-500">Ctrl+L to clear | Tab to complete</span>
      </div>
    </div>
  );
};
