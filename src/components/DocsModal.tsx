import React, { useState } from 'react';
import { X, BookOpen, Play, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { MERMAID_KEYWORDS } from '../lib/sirenInterpreter';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToRepl?: (code: string) => void;
  onAskAi?: (prompt: string) => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({
  isOpen,
  onClose,
  onSendToRepl,
  onAskAi,
}) => {
  const [activeTab, setActiveTab] = useState<'syntax' | 'mermaid' | 'ast' | 'examples'>('syntax');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sampleCodes = [
    {
      title: 'Fibonacci (Standard Dialect)',
      lang: 'Standard',
      code: `fn fib(n: int) -> int {
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

fn main() -> int {
    let result: int = fib(12);
    printf("fib(12) = %i\\n", result);
    return result;
}`,
    },
    {
      title: 'Fibonacci (Mermaid Ocean Dialect)',
      lang: 'Mermaid',
      code: `sing fib(n: int) flows int {
    when (n <= 1) {
        surface n tide
    }
    surface fib(n - 1) + fib(n - 2) tide
}

sing main() flows int {
    dive answer: int is fib(12) tide
    printf("mermaid fib = %i\\n", answer) tide
    surface answer tide
}`,
    },
    {
      title: 'Loops & Accumulation',
      lang: 'Standard',
      code: `fn main() -> int {
    let sum: int = 0;
    for (let i: int = 1; i <= 10; i++) {
        sum += i;
    }
    printf("Sum: %i\\n", sum);
    return sum;
}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1017] border border-cyan-800/80 rounded-lg w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0e1622] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white text-sm">Siren Language Reference Manual</span>
            <span className="text-slate-400 text-xs">v0.0.4-dev</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0c121c] px-4 gap-4">
          <button
            onClick={() => setActiveTab('syntax')}
            className={`py-2 font-semibold border-b-2 transition ${
              activeTab === 'syntax' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Core Syntax
          </button>
          <button
            onClick={() => setActiveTab('mermaid')}
            className={`py-2 font-semibold border-b-2 transition ${
              activeTab === 'mermaid' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Mermaid Dialect
          </button>
          <button
            onClick={() => setActiveTab('ast')}
            className={`py-2 font-semibold border-b-2 transition ${
              activeTab === 'ast' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Compiler &amp; AST
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`py-2 font-semibold border-b-2 transition ${
              activeTab === 'examples' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Code Examples
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto bg-[#070a0e] text-slate-200 space-y-4">
          {activeTab === 'syntax' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-cyan-300 mb-1.5">Primitive Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="p-2 bg-[#0e1622] rounded border border-slate-800">
                    <span className="text-emerald-400 font-bold">int</span>
                    <p className="text-[11px] text-slate-400 mt-1">32-bit signed integer (LLVM i32)</p>
                  </div>
                  <div className="p-2 bg-[#0e1622] rounded border border-slate-800">
                    <span className="text-emerald-400 font-bold">float</span>
                    <p className="text-[11px] text-slate-400 mt-1">32-bit floating point</p>
                  </div>
                  <div className="p-2 bg-[#0e1622] rounded border border-slate-800">
                    <span className="text-emerald-400 font-bold">bool</span>
                    <p className="text-[11px] text-slate-400 mt-1">1-bit boolean (true/false)</p>
                  </div>
                  <div className="p-2 bg-[#0e1622] rounded border border-slate-800">
                    <span className="text-emerald-400 font-bold">str</span>
                    <p className="text-[11px] text-slate-400 mt-1">C-style string (i8* pointer)</p>
                  </div>
                  <div className="p-2 bg-[#0e1622] rounded border border-slate-800">
                    <span className="text-emerald-400 font-bold">void</span>
                    <p className="text-[11px] text-slate-400 mt-1">Empty return type</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-cyan-300 mb-1.5">Standard Statements</h3>
                <div className="bg-[#0e1622] p-3 rounded border border-slate-800 space-y-2 text-[12px]">
                  <div>
                    <span className="text-slate-400">Variables:</span>{' '}
                    <code className="text-emerald-300">let x: int = 10;</code>
                  </div>
                  <div>
                    <span className="text-slate-400">Functions:</span>{' '}
                    <code className="text-emerald-300">fn add(a: int, b: int) -&gt; int &#123; return a + b; &#125;</code>
                  </div>
                  <div>
                    <span className="text-slate-400">Conditions:</span>{' '}
                    <code className="text-emerald-300">if (x &gt; 0) &#123; ... &#125; else &#123; ... &#125;</code>
                  </div>
                  <div>
                    <span className="text-slate-400">While Loop:</span>{' '}
                    <code className="text-emerald-300">while (x &lt; 10) &#123; x++; &#125;</code>
                  </div>
                  <div>
                    <span className="text-slate-400">For Loop:</span>{' '}
                    <code className="text-emerald-300">for (let i: int = 0; i &lt; 5; i++) &#123; ... &#125;</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mermaid' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Siren supports a built-in, ocean/mermaid-themed dialect alongside the standard keywords. Every word below
                is an exact alias recognised by the lexer:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-800 text-[12px]">
                  <thead>
                    <tr className="bg-[#0e1622] text-cyan-300 border-b border-slate-800">
                      <th className="p-2 border-r border-slate-800">Mermaid Word</th>
                      <th className="p-2 border-r border-slate-800">Standard Keyword</th>
                      <th className="p-2">Semantic Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">dive</td><td className="p-2 border-r border-slate-800 text-emerald-400">let</td><td className="p-2 text-slate-400">declare / bind a variable</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">is</td><td className="p-2 border-r border-slate-800 text-emerald-400">=</td><td className="p-2 text-slate-400">assignment operator</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">tide</td><td className="p-2 border-r border-slate-800 text-emerald-400">;</td><td className="p-2 text-slate-400">statement terminator</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">sing</td><td className="p-2 border-r border-slate-800 text-emerald-400">fn</td><td className="p-2 text-slate-400">define a function</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">surface</td><td className="p-2 border-r border-slate-800 text-emerald-400">return</td><td className="p-2 text-slate-400">return a value from a function</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">flows</td><td className="p-2 border-r border-slate-800 text-emerald-400">-&gt;</td><td className="p-2 text-slate-400">return-type annotation arrow</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">when</td><td className="p-2 border-r border-slate-800 text-emerald-400">if</td><td className="p-2 text-slate-400">conditional branch</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">otherwise</td><td className="p-2 border-r border-slate-800 text-emerald-400">else</td><td className="p-2 text-slate-400">fallback branch</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">drift</td><td className="p-2 border-r border-slate-800 text-emerald-400">while</td><td className="p-2 text-slate-400">while-loop</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">wave</td><td className="p-2 border-r border-slate-800 text-emerald-400">for</td><td className="p-2 text-slate-400">for-loop</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">shore</td><td className="p-2 border-r border-slate-800 text-emerald-400">break</td><td className="p-2 text-slate-400">exit a loop early</td></tr>
                    <tr><td className="p-2 font-bold text-cyan-400 border-r border-slate-800">ripple</td><td className="p-2 border-r border-slate-800 text-emerald-400">continue</td><td className="p-2 text-slate-400">skip to next loop iteration</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ast' && (
            <div className="space-y-3 text-xs">
              <h3 className="text-sm font-bold text-cyan-300">Siren AST Node Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-[#0e1622] rounded border border-slate-800">
                  <span className="font-bold text-indigo-300">Statements</span>
                  <ul className="list-disc list-inside mt-1 text-slate-400 space-y-0.5">
                    <li>Program</li>
                    <li>LetStatement (name, value, value_type)</li>
                    <li>FunctionStatement (name, parameters, return_type, body)</li>
                    <li>IfStatement (condition, consequence, alternative)</li>
                    <li>WhileStatement (condition, body)</li>
                    <li>ForStatement (var_declaration, condition, action, body)</li>
                    <li>ReturnStatement, AssignStatement, BlockStatement</li>
                  </ul>
                </div>

                <div className="p-3 bg-[#0e1622] rounded border border-slate-800">
                  <span className="font-bold text-indigo-300">Expressions &amp; Literals</span>
                  <ul className="list-disc list-inside mt-1 text-slate-400 space-y-0.5">
                    <li>InfixExpression (+, -, *, /, %, ==, &lt;=, etc.)</li>
                    <li>CallExpression (function, arguments)</li>
                    <li>PrefixExpression (-, !)</li>
                    <li>PostfixExpression (++, --)</li>
                    <li>IntegerLiteral, FloatLiteral, BooleanLiteral, StringLiteral</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-sm font-bold text-cyan-300 pt-2">Pratt Parser Precedences</h3>
              <div className="p-3 bg-[#0e1622] rounded border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div>P_LOWEST &lt; P_EQUALS (==, !=) &lt; P_LESSGREATER (&lt;, &gt;, &lt;=, &gt;=)</div>
                <div>&lt; P_SUM (+, -) &lt; P_PRODUCT (*, /, %) &lt; P_EXPONENT (^) &lt; P_PREFIX (-, !) &lt; P_CALL (()) &lt; P_INDEX (++, --)</div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-4">
              {sampleCodes.map((sample, idx) => (
                <div key={idx} className="bg-[#0e1622] rounded border border-slate-800 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{sample.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-cyan-400 rounded">
                        {sample.lang}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(sample.code, idx)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                      {onSendToRepl && (
                        <button
                          onClick={() => {
                            onClose();
                            onSendToRepl(sample.code);
                          }}
                          className="px-2 py-0.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700 rounded text-[11px] flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 text-indigo-300" />
                          <span>Run in REPL</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <pre className="p-2 bg-[#070a0e] rounded text-emerald-300 text-[12px] overflow-x-auto font-mono">
                    <code>{sample.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0e1622] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Need custom Siren code or compiler answers? Ask SirenAI directly!</span>
          <button
            onClick={() => {
              onClose();
              onAskAi?.('Can you explain how to write functions and handle types in Siren?');
            }}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-sans transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Consult SirenAI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
