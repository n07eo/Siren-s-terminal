import React, { useState, useEffect } from 'react';
import { Activity, Maximize2, Minimize2, Search } from 'lucide-react';
import { ProcessItem } from '../types';

interface SystemMonitorProps {
  onAskAi?: (prompt: string) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({
  onAskAi,
  isMaximized,
  onToggleMaximize,
}) => {
  const [cpu0, setCpu0] = useState(36.0);
  const [cpu1, setCpu1] = useState(26.0);
  const [memGb, setMemGb] = useState(4.12);
  const [searchQuery, setSearchQuery] = useState('');

  const [processes, setProcesses] = useState<ProcessItem[]>([
    { pid: 28419, user: 'lucifer', cpu: 4.2, mem: 0.8, command: 'zsh' },
    { pid: 29104, user: 'lucifer', cpu: 2.8, mem: 1.4, command: 'siren-repl --jit' },
    { pid: 1802, user: 'doudi', cpu: 0.4, mem: 0.2, command: 'doudi-daemon --sync' },
    { pid: 840, user: 'root', cpu: 0.1, mem: 0.1, command: 'systemd-journald' },
    { pid: 1102, user: 'systemd', cpu: 0.0, mem: 0.1, command: 'systemd-resolved' },
    { pid: 29340, user: 'lucifer', cpu: 1.2, mem: 0.9, command: 'siren-lsp' },
    { pid: 29512, user: 'lucifer', cpu: 3.1, mem: 1.8, command: 'siren-ai-daemon' },
  ]);

  // Subtle live fluctuations for realistic terminal telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu0((prev) => +(Math.max(15, Math.min(85, prev + (Math.random() * 6 - 3)))).toFixed(1));
      setCpu1((prev) => +(Math.max(12, Math.min(75, prev + (Math.random() * 6 - 3)))).toFixed(1));
      setMemGb((prev) => +(Math.max(3.8, Math.min(5.2, prev + (Math.random() * 0.04 - 0.02)))).toFixed(2));

      setProcesses((prev) =>
        prev.map((proc) => {
          if (proc.command.includes('siren')) {
            return {
              ...proc,
              cpu: +(Math.max(0.5, Math.min(12, proc.cpu + (Math.random() * 1.2 - 0.6)))).toFixed(1),
            };
          }
          return proc;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredProcesses = processes.filter(
    (p) =>
      p.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.pid).includes(searchQuery)
  );

  const renderMeterBar = (percent: number) => {
    const totalBars = 36;
    const filledBars = Math.round((percent / 100) * totalBars);

    return (
      <div className="flex-1 bg-[#0d141e] border border-slate-800 rounded-sm h-3.5 flex items-center px-0.5 overflow-hidden">
        <div
          className="h-2 rounded-xs bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  };

  return (
    <div
      id="system-monitor-pane"
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
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-gray-300">htop - Arch Task Monitor</span>
          <span className="text-[10px] text-slate-400 ml-2">Load: 0.42 0.38 0.35</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-24 focus:w-36 transition-all bg-[#0d141e] border border-slate-700 text-xs px-2 py-0.5 rounded text-white placeholder:text-slate-600 outline-none"
            />
          </div>
          {onToggleMaximize && (
            <button
              id="sysmon-maximize-btn"
              onClick={onToggleMaximize}
              className="text-xs text-gray-400 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
              title={isMaximized ? 'Restore view' : 'Maximize window'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Monitor Metrics Body */}
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        {/* Core 0 & Core 1 Meter Bars */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-8 text-cyan-400 font-bold">0 [</span>
            {renderMeterBar(cpu0)}
            <span className="w-14 text-right text-cyan-300">{cpu0.toFixed(1)}%]</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-8 text-cyan-400 font-bold">1 [</span>
            {renderMeterBar(cpu1)}
            <span className="w-14 text-right text-cyan-300">{cpu1.toFixed(1)}%]</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-8 text-amber-400 font-bold">Mem[</span>
            {renderMeterBar((memGb / 31.1) * 100)}
            <span className="w-24 text-right text-amber-300">{memGb}G/31.1G]</span>
          </div>
        </div>

        {/* Process Table Header */}
        <div className="mt-3 pt-2 border-t border-slate-800/80">
          <div className="grid grid-cols-12 text-xs font-semibold text-slate-400 bg-[#0d1520] px-2 py-1 rounded">
            <div className="col-span-2">PID</div>
            <div className="col-span-3">USER</div>
            <div className="col-span-2 text-right">CPU%</div>
            <div className="col-span-2 text-right">MEM%</div>
            <div className="col-span-3 pl-3">COMMAND</div>
          </div>

          {/* Process Rows */}
          <div className="divide-y divide-slate-800/40 mt-1">
            {filteredProcesses.map((proc) => {
              const isSiren = proc.command.includes('siren');
              return (
                <div
                  key={proc.pid}
                  onClick={() =>
                    onAskAi?.(`Tell me about how the '${proc.command}' daemon functions in the Siren language runtime environment.`)
                  }
                  className={`grid grid-cols-12 text-xs px-2 py-1 items-center hover:bg-slate-800/60 cursor-pointer transition ${
                    isSiren ? 'text-cyan-200' : 'text-slate-300'
                  }`}
                  title="Click to ask SirenAI about this runtime process"
                >
                  <div className="col-span-2 text-slate-500 font-mono">{proc.pid}</div>
                  <div className="col-span-3 font-medium text-slate-300">{proc.user}</div>
                  <div className="col-span-2 text-right font-mono text-emerald-400">{proc.cpu}%</div>
                  <div className="col-span-2 text-right font-mono text-cyan-400">{proc.mem}%</div>
                  <div className="col-span-3 pl-3 truncate font-mono flex items-center gap-1">
                    {isSiren && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>}
                    <span className={isSiren ? 'text-cyan-300 font-semibold' : ''}>{proc.command}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Function Keys Bar (htop style) */}
      <div className="grid grid-cols-5 text-[11px] bg-[#0c121c] border-t border-[#1e293b] select-none text-center">
        <div className="py-1 hover:bg-slate-800 cursor-pointer border-r border-slate-800">
          <span className="bg-cyan-800 text-cyan-200 px-1 rounded-xs mr-1">F1</span>Help
        </div>
        <div className="py-1 hover:bg-slate-800 cursor-pointer border-r border-slate-800">
          <span className="bg-cyan-800 text-cyan-200 px-1 rounded-xs mr-1">F3</span>Search
        </div>
        <div className="py-1 hover:bg-slate-800 cursor-pointer border-r border-slate-800">
          <span className="bg-cyan-800 text-cyan-200 px-1 rounded-xs mr-1">F5</span>Tree
        </div>
        <div className="py-1 hover:bg-slate-800 cursor-pointer border-r border-slate-800">
          <span className="bg-rose-900 text-rose-200 px-1 rounded-xs mr-1">F9</span>Kill
        </div>
        <div className="py-1 hover:bg-slate-800 cursor-pointer">
          <span className="bg-cyan-800 text-cyan-200 px-1 rounded-xs mr-1">F10</span>Quit
        </div>
      </div>
    </div>
  );
};
