import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Code2,
  Bot,
  Activity,
  LayoutGrid,
  Columns2,
  Maximize2,
  BookOpen,
  Sparkles,
  Wifi,
  Volume2,
} from 'lucide-react';
import { LayoutMode, WindowId } from '../types';

interface TopBarProps {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  activeWindow: WindowId;
  setActiveWindow: (w: WindowId) => void;
  onOpenAi: () => void;
  onOpenDocs: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  layoutMode,
  setLayoutMode,
  activeWindow,
  setActiveWindow,
  onOpenAi,
  onOpenDocs,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      id="polybar-topbar"
      className="bg-[#0b1017] border-b border-[#182234] text-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono select-none"
    >
      {/* Left: Workspaces / Tiling Windows */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#070b10] border border-slate-800 rounded px-1 py-0.5 gap-1">
          <button
            onClick={() => {
              setActiveWindow('terminal');
              if (layoutMode === 'maximized') setLayoutMode('quad');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
              activeWindow === 'terminal'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>1:term</span>
          </button>

          <button
            onClick={() => {
              setActiveWindow('repl');
              if (layoutMode === 'maximized') setLayoutMode('quad');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
              activeWindow === 'repl'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>2:repl</span>
          </button>

          <button
            onClick={() => {
              setActiveWindow('chatbot');
              if (layoutMode === 'quad') setLayoutMode('chat-focus');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
              activeWindow === 'chatbot'
                ? 'bg-teal-950 text-teal-300 border border-teal-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3 h-3 text-cyan-400" />
            <span>3:siren-ai</span>
          </button>

          <button
            onClick={() => {
              setActiveWindow('sysmon');
              if (layoutMode === 'maximized') setLayoutMode('quad');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
              activeWindow === 'sysmon'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>4:sysmon</span>
          </button>
        </div>

        {/* Layout Modes */}
        <div className="hidden sm:flex items-center bg-[#070b10] border border-slate-800 rounded px-1 py-0.5 gap-1">
          <button
            onClick={() => setLayoutMode('quad')}
            className={`p-1 rounded transition ${
              layoutMode === 'quad' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Quad Tiling Layout (Terminal + REPL + SysMon + AI)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayoutMode('chat-focus')}
            className={`p-1 rounded transition ${
              layoutMode === 'chat-focus' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Chat Focus Layout (Expanded SirenAI + REPL)"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayoutMode('maximized')}
            className={`p-1 rounded transition ${
              layoutMode === 'maximized' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Maximize current active window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle: Session Status */}
      <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[11px]">
        <span className="text-cyan-400 font-bold">lucifer@arch</span>
        <span>•</span>
        <span>Linux 6.8.9-arch1-1</span>
        <span>•</span>
        <span className="text-emerald-400">Siren v0.0.4-dev (MCJIT)</span>
      </div>

      {/* Right: Quick Actions, AI Trigger & System Indicators */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDocs}
          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition flex items-center gap-1 border border-slate-700"
        >
          <BookOpen className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Siren Docs</span>
        </button>

        <button
          onClick={onOpenAi}
          className="px-2.5 py-0.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded text-[11px] transition flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3 h-3" />
          <span>Ask SirenAI</span>
        </button>

        <div className="hidden md:flex items-center gap-2 text-slate-500 text-[11px] pl-2 border-l border-slate-800">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 font-mono">{currentTime}</span>
        </div>
      </div>
    </header>
  );
};
