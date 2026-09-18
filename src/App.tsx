import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { ArchTerminal } from './components/ArchTerminal';
import { SirenRepl } from './components/SirenRepl';
import { SystemMonitor } from './components/SystemMonitor';
import { SirenAiChat } from './components/SirenAiChat';
import { AstInspectorModal } from './components/AstInspectorModal';
import { DocsModal } from './components/DocsModal';
import { LayoutMode, WindowId } from './types';

export default function App() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('quad');
  const [activeWindow, setActiveWindow] = useState<WindowId>('terminal');
  const [maximizedWindow, setMaximizedWindow] = useState<WindowId | null>(null);

  // Cross-component communication
  const [aiExternalQuery, setAiExternalQuery] = useState<string | null>(null);
  const [replCodeToRun, setReplCodeToRun] = useState<string | null>(null);
  const [selectedAst, setSelectedAst] = useState<{ ast: any; code: string } | null>(null);
  const [isAstModalOpen, setIsAstModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  // Global keyboard shortcuts (e.g. Ctrl+Space for SirenAI)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Ctrl+Space or Cmd+Space -> Focus SirenAI
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        setActiveWindow('chatbot');
        if (layoutMode === 'quad') {
          // Keep quad or highlight
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [layoutMode]);

  const handleAskAi = (prompt: string, code?: string) => {
    setAiExternalQuery(prompt);
    setActiveWindow('chatbot');
    // If in quad, keep in quad; user can see both
  };

  const handleSendToRepl = (code: string) => {
    setReplCodeToRun(code);
    setActiveWindow('repl');
  };

  const handleOpenAstInspector = (ast: any, code: string) => {
    setSelectedAst({ ast, code });
    setIsAstModalOpen(true);
  };

  const toggleMaximize = (target: WindowId) => {
    if (maximizedWindow === target) {
      setMaximizedWindow(null);
      setLayoutMode('quad');
    } else {
      setMaximizedWindow(target);
      setLayoutMode('maximized');
      setActiveWindow(target);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#05070a] text-slate-200 overflow-hidden font-mono select-none">
      {/* Top Polybar / Window Manager Bar */}
      <TopBar
        layoutMode={layoutMode}
        setLayoutMode={(mode) => {
          setLayoutMode(mode);
          if (mode !== 'maximized') setMaximizedWindow(null);
        }}
        activeWindow={activeWindow}
        setActiveWindow={setActiveWindow}
        onOpenAi={() => {
          setActiveWindow('chatbot');
          if (layoutMode === 'maximized') {
            setMaximizedWindow('chatbot');
          }
        }}
        onOpenDocs={() => setIsDocsModalOpen(true)}
      />

      {/* Main Tiling Workspaces Area */}
      <main className="flex-1 p-2 overflow-hidden bg-[#06080d]">
        {/* 1. Maximized Single Window Mode */}
        {layoutMode === 'maximized' && (
          <div className="h-full w-full">
            {activeWindow === 'terminal' && (
              <ArchTerminal
                onAskAi={handleAskAi}
                onSendToRepl={handleSendToRepl}
                isMaximized={true}
                onToggleMaximize={() => toggleMaximize('terminal')}
              />
            )}
            {activeWindow === 'repl' && (
              <SirenRepl
                onAskAi={handleAskAi}
                onViewAst={handleOpenAstInspector}
                isMaximized={true}
                onToggleMaximize={() => toggleMaximize('repl')}
                initialCodeToRun={replCodeToRun}
              />
            )}
            {activeWindow === 'chatbot' && (
              <SirenAiChat
                onSendToRepl={handleSendToRepl}
                onViewAst={handleOpenAstInspector}
                isMaximized={true}
                onToggleMaximize={() => toggleMaximize('chatbot')}
                externalQuery={aiExternalQuery}
              />
            )}
            {activeWindow === 'sysmon' && (
              <SystemMonitor
                onAskAi={handleAskAi}
                isMaximized={true}
                onToggleMaximize={() => toggleMaximize('sysmon')}
              />
            )}
          </div>
        )}

        {/* 2. Chat Focus Mode (Split: Left SirenAI Chatbot, Right REPL & Terminal) */}
        {layoutMode === 'chat-focus' && (
          <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-2">
            <div className="lg:col-span-6 h-full">
              <SirenAiChat
                onSendToRepl={handleSendToRepl}
                onViewAst={handleOpenAstInspector}
                isMaximized={false}
                onToggleMaximize={() => toggleMaximize('chatbot')}
                externalQuery={aiExternalQuery}
              />
            </div>
            <div className="lg:col-span-6 h-full grid grid-rows-2 gap-2">
              <div className="h-full overflow-hidden">
                <SirenRepl
                  onAskAi={handleAskAi}
                  onViewAst={handleOpenAstInspector}
                  isMaximized={false}
                  onToggleMaximize={() => toggleMaximize('repl')}
                  initialCodeToRun={replCodeToRun}
                />
              </div>
              <div className="h-full overflow-hidden">
                <ArchTerminal
                  onAskAi={handleAskAi}
                  onSendToRepl={handleSendToRepl}
                  isMaximized={false}
                  onToggleMaximize={() => toggleMaximize('terminal')}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Quad Grid Mode (Matching the screenshot layout + integrated SirenAI) */}
        {layoutMode === 'quad' && (
          <div className="h-full w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 grid-rows-2 gap-2">
            {/* Top-Left: Arch Terminal v2.4-rolling */}
            <div
              className={`h-full overflow-hidden transition ${
                activeWindow === 'terminal' ? 'ring-1 ring-cyan-500/40' : ''
              }`}
              onClick={() => setActiveWindow('terminal')}
            >
              <ArchTerminal
                onAskAi={handleAskAi}
                onSendToRepl={handleSendToRepl}
                isMaximized={false}
                onToggleMaximize={() => toggleMaximize('terminal')}
              />
            </div>

            {/* Top-Right: Siren Interactive REPL v0.0.4 */}
            <div
              className={`h-full overflow-hidden transition ${
                activeWindow === 'repl' ? 'ring-1 ring-indigo-500/40' : ''
              }`}
              onClick={() => setActiveWindow('repl')}
            >
              <SirenRepl
                onAskAi={handleAskAi}
                onViewAst={handleOpenAstInspector}
                isMaximized={false}
                onToggleMaximize={() => toggleMaximize('repl')}
                initialCodeToRun={replCodeToRun}
              />
            </div>

            {/* Bottom-Left: SirenAI Chatbot specialized in Siren */}
            <div
              className={`h-full overflow-hidden transition ${
                activeWindow === 'chatbot' ? 'ring-1 ring-teal-500/40' : ''
              }`}
              onClick={() => setActiveWindow('chatbot')}
            >
              <SirenAiChat
                onSendToRepl={handleSendToRepl}
                onViewAst={handleOpenAstInspector}
                isMaximized={false}
                onToggleMaximize={() => toggleMaximize('chatbot')}
                externalQuery={aiExternalQuery}
              />
            </div>

            {/* Bottom-Right: System Monitor (htop) */}
            <div
              className={`h-full overflow-hidden transition ${
                activeWindow === 'sysmon' ? 'ring-1 ring-emerald-500/40' : ''
              }`}
              onClick={() => setActiveWindow('sysmon')}
            >
              <SystemMonitor
                onAskAi={handleAskAi}
                isMaximized={false}
                onToggleMaximize={() => toggleMaximize('sysmon')}
              />
            </div>
          </div>
        )}
      </main>

      {/* AST & LLVM IR Inspector Modal */}
      <AstInspectorModal
        isOpen={isAstModalOpen}
        onClose={() => setIsAstModalOpen(false)}
        astData={selectedAst?.ast}
        codeSnippet={selectedAst?.code || ''}
        onAskAi={handleAskAi}
      />

      {/* Siren Reference & Documentation Modal */}
      <DocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        onSendToRepl={handleSendToRepl}
        onAskAi={handleAskAi}
      />
    </div>
  );
}
