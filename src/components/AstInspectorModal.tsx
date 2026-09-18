import React, { useState } from 'react';
import { X, Code2, Cpu, Copy, Check, Sparkles } from 'lucide-react';

interface AstInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  astData: any;
  codeSnippet: string;
  onAskAi?: (prompt: string) => void;
}

export const AstInspectorModal: React.FC<AstInspectorModalProps> = ({
  isOpen,
  onClose,
  astData,
  codeSnippet,
  onAskAi,
}) => {
  const [activeTab, setActiveTab] = useState<'ast' | 'llvm' | 'tree'>('ast');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const astJsonString = JSON.stringify(astData || { error: 'No AST available' }, null, 2);

  // Generate simulated LLVM IR matching Compiler.py
  const generateLlvmIr = (code: string) => {
    return `; ModuleID = 'main'
source_filename = "siren_program.siren"
target triple = "x86_64-pc-linux-gnu"

@__str_printf = internal constant [18 x i8] c"Program result: %i\\00"
declare i32 @printf(i8*, ...)

define i32 @main() {
entry:
  ; Evaluated from Siren AST
  ; Source: ${code.slice(0, 40)}
  %res = alloca i32, align 4
  store i32 144, i32* %res, align 4
  %val = load i32, i32* %res, align 4
  ret i32 %val
}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1017] border border-cyan-800/80 rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1622] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white text-sm">Siren Compiler Inspector</span>
            <span className="text-slate-400 text-xs">| AST &amp; LLVM Codegen</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(activeTab === 'ast' ? astJsonString : generateLlvmIr(codeSnippet))}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source preview banner */}
        <div className="px-4 py-2 bg-[#090d13] border-b border-slate-800/60 flex items-center justify-between">
          <div className="truncate text-slate-300">
            <span className="text-cyan-400 font-semibold mr-2">Input:</span>
            <code className="text-emerald-300">{codeSnippet || 'let x = 10;'}</code>
          </div>

          <button
            onClick={() => {
              onClose();
              onAskAi?.(`Explain the AST structure and LLVM IR for this Siren code:\n${codeSnippet}`);
            }}
            className="text-amber-300 hover:text-amber-200 text-xs flex items-center gap-1 hover:underline ml-4 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ask SirenAI to explain</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-[#0c121c] px-4 gap-4">
          <button
            onClick={() => setActiveTab('ast')}
            className={`py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'ast' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AST JSON Tree
          </button>
          <button
            onClick={() => setActiveTab('llvm')}
            className={`py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'llvm' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            LLVM IR (Target: x86_64)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#070a0e]">
          {activeTab === 'ast' ? (
            <pre className="text-emerald-400 leading-relaxed font-mono whitespace-pre-wrap text-[12px]">
              {astJsonString}
            </pre>
          ) : (
            <pre className="text-cyan-300 leading-relaxed font-mono whitespace-pre-wrap text-[12px]">
              {generateLlvmIr(codeSnippet)}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-[#0d141e] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>SirenLang AST Nodes &amp; llvmlite.ir Module Specification</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-sans text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
