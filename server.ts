import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const SIREN_SYSTEM_INSTRUCTION = `You are SirenAI, an expert compiler engineer and AI chatbot specialized in the Siren programming language.
You have comprehensive knowledge of the Siren language specifications, its Pratt parser, AST nodes, LLVM IR compilation backend (using llvmlite and MCJIT), toolchain, and its unique syntax.

Key Language Facts about Siren:
1. OVERVIEW:
   - Siren is a compiled, statically typed systems programming language that compiles to LLVM IR and runs via native JIT (or native object linking).
   - Core types: 'int' (i32), 'float' (float), 'bool' (i1: true/false), 'str' (i8* C-string), 'void'.
   - Entry point: Every program requires a 'fn main() -> int { ... }' function when compiled.

2. SYNTAX & KEYWORDS (Dual Dialect):
   Siren features two interchangeable keyword sets recognized by the lexer:
   A) Standard Dialect:
      - Variable declaration: 'let <name>: <type> = <value>;'
      - Function definition: 'fn <name>(<param>: <type>, ...) -> <ret_type> { <body> }'
      - Return statement: 'return <expr>;'
      - Conditionals: 'if (<cond>) { <then> } else { <alt> }'
      - While loop: 'while (<cond>) { <body> }'
      - For loop: 'for (let <var>: <type> = <init>; <cond>; <step>) { <body> }'
      - Loop controls: 'break;', 'continue;'
      - Literals: true, false, integers (e.g. 42), floats (e.g. 3.14), strings ("hello\\n")
      - Builtin printing: 'printf("format %i\\n", val)'
      - Operators:
        * Infix: +, -, *, /, %, ^, ==, !=, <, <=, >, >=
        * Prefix: -, !
        * Postfix: ++, --
        * Assignment: =, +=, -=, *=, /=

   B) Mermaid Alternative Dialect (Ocean-Themed):
      Siren has an ocean/mermaid-themed dialect where keywords are exact semantic aliases:
      - 'dive'      => 'let'         (e.g., dive count: int is 0 tide)
      - 'is'        => '='           (assignment symbol)
      - 'tide'      => ';'           (statement terminator)
      - 'sing'      => 'fn'          (define a function, e.g. sing main() flows int { ... })
      - 'surface'   => 'return'      (return a value, e.g. surface 0 tide)
      - 'flows'     => '->'          (return-type arrow)
      - 'when'      => 'if'          (conditional branch)
      - 'otherwise' => 'else'        (fallback branch)
      - 'drift'     => 'while'       (while loop)
      - 'shore'     => 'break'       (exit loop)
      - 'ripple'    => 'continue'    (skip to next loop iteration)
      - 'wave'      => 'for'         (for loop)

3. COMPILER ARCHITECTURE:
   - Lexer: Handles standard & mermaid keywords, numbers (int/float), strings, symbols, whitespace.
   - Parser: Recursive descent + Pratt parser using precedence levels (P_LOWEST, P_EQUALS, P_LESSGREATER, P_SUM, P_PRODUCT, P_EXPONENT, P_PREFIX, P_CALL, P_INDEX).
   - AST Nodes: Program, ExpressionStatement, LetStatement, FunctionStatement, BlockStatement, ReturnStatement, AssignStatement, IfStatement, WhileStatement, BreakStatement, ContinueStatement, ForStatement, InfixExpression, CallExpression, PrefixExpression, PostfixExpression, IntegerLiteral, FloatLiteral, IdentifierLiteral, BooleanLiteral, StringLiteral, FunctionParameter.
   - Codegen: Generates LLVM IR with 'llvmlite.ir', builder allocas/stores/loads, basic blocks with phi/branching, C printf linkage.
   - Execution: LLVM MCJIT native target machine compilation via 'llvmlite.binding'.
   - Toolchain: 'doudi' package manager, 'siren' CLI compiler, 'siren-repl' interactive prompt, 'siren-stdlib', 'siren-lsp'.

4. RESPONSE STYLE:
   - Provide direct, clear, authoritative explanations with clean Siren code examples.
   - Format code blocks using \`\`\`siren.
   - When asked for examples, you can showcase both Standard syntax and the playful Mermaid alternative dialect.
   - Highlight how Siren statements translate to LLVM IR or AST nodes if the user asks technical compiler questions.
   - Be helpful, engaging, and enthusiastic about systems programming, compilers, and the Siren ecosystem.`;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sirenVersion: '0.0.4-dev',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Siren language specification and sample programs endpoint
app.get('/api/siren/spec', (req, res) => {
  res.json({
    version: '0.0.4-dev',
    types: ['int', 'float', 'bool', 'str', 'void'],
    standardKeywords: ['let', 'fn', 'return', 'if', 'else', 'while', 'break', 'continue', 'for', 'true', 'false'],
    mermaidKeywords: {
      dive: 'let',
      is: '=',
      tide: ';',
      sing: 'fn',
      surface: 'return',
      flows: '->',
      when: 'if',
      otherwise: 'else',
      drift: 'while',
      shore: 'break',
      ripple: 'continue',
      wave: 'for',
    },
    examples: [
      {
        name: 'Fibonacci (Recursive)',
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
        name: 'Fibonacci (Mermaid Dialect)',
        code: `sing fib(n: int) flows int {
    when (n <= 1) {
        surface n tide
    }
    surface fib(n - 1) + fib(n - 2) tide
}

sing main() flows int {
    dive result: int is fib(12) tide
    printf("mermaid fib(12) = %i\\n", result) tide
    surface result tide
}`,
      },
      {
        name: 'For Loop & Accumulation',
        code: `fn main() -> int {
    let sum: int = 0;
    for (let i: int = 1; i <= 10; i++) {
        sum += i;
    }
    printf("Sum from 1 to 10: %i\\n", sum);
    return sum;
}`,
      },
      {
        name: 'While Loop & Postfix Decrement',
        code: `fn main() -> int {
    let countdown: int = 5;
    while (countdown > 0) {
        printf("T-minus: %i\\n", countdown);
        countdown--;
    }
    printf("Liftoff!\\n");
    return 0;
}`,
      },
    ],
  });
});

// Chat endpoint with Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, message, codeContext } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Graceful simulated response when GEMINI_API_KEY is not yet attached
      const query = (message || '').toLowerCase();
      let fallbackText = `Welcome to SirenAI! I am specialized in the Siren programming language.\n\n`;

      if (query.includes('mermaid') || query.includes('ocean') || query.includes('dialect')) {
        fallbackText += `### Siren Mermaid Dialect\nSiren supports an ocean-inspired keyword dialect where each keyword is an alias for standard syntax:\n\n` +
          `| Mermaid Word | Standard | Meaning |\n|---|---|---|\n` +
          `| \`sing\` | \`fn\` | Function definition |\n` +
          `| \`dive\` | \`let\` | Variable declaration |\n` +
          `| \`surface\` | \`return\` | Return statement |\n` +
          `| \`flows\` | \`->\` | Return type arrow |\n` +
          `| \`is\` | \`=\` | Assignment operator |\n` +
          `| \`tide\` | \`;\` | Statement terminator |\n` +
          `| \`when\` | \`if\` | Condition |\n` +
          `| \`otherwise\` | \`else\` | Else branch |\n` +
          `| \`drift\` | \`while\` | While loop |\n` +
          `| \`wave\` | \`for\` | For loop |\n\n` +
          `Example in Mermaid dialect:\n\`\`\`siren\nsing main() flows int {\n    dive answer: int is 42 tide\n    surface answer tide\n}\n\`\`\``;
      } else if (query.includes('fib') || query.includes('fibonacci')) {
        fallbackText += `Here is how to calculate Fibonacci numbers in Siren:\n\n\`\`\`siren\nfn fib(n: int) -> int {\n    if (n <= 1) {\n        return n;\n    }\n    return fib(n - 1) + fib(n - 2);\n}\n\nfn main() -> int {\n    let val: int = fib(12);\n    printf("fib(12) = %i\\n", val);\n    return val;\n}\n\`\`\`\n\nThis compiles via Siren's LLVM MCJIT in under 0.05ms!`;
      } else if (query.includes('llvm') || query.includes('compiler') || query.includes('jit') || query.includes('ast')) {
        fallbackText += `### Siren Compiler Pipeline\n1. **Lexer**: Tokenizes source into typed tokens (with support for dual standard + mermaid keyword sets).\n2. **Parser**: A Pratt Parser that builds an Abstract Syntax Tree (AST) supporting statements (\`LetStatement\`, \`FunctionStatement\`, \`IfStatement\`, etc.) and precedence-ranked expressions.\n3. **LLVM Codegen**: Translates AST nodes into LLVM IR using \`llvmlite.ir.Module\` and \`IRBuilder\`.\n4. **MCJIT Engine**: Compiles the IR in memory using LLVM target machine and calls the native \`main\` entrypoint pointer directly!`;
      } else {
        fallbackText += `Siren is a statically typed systems programming language with LLVM JIT backend.\n\n` +
          `**Key features:**\n` +
          `- Primitive types: \`int\` (i32), \`float\`, \`bool\`, \`str\`, \`void\`\n` +
          `- Syntax: \`let x: int = 10;\`, \`fn fib(n: int) -> int { ... }\`\n` +
          `- Dual Dialects: Standard C/Rust-like syntax AND Mermaid ocean-themed syntax (\`dive\`, \`sing\`, \`surface\`, \`flows\`, \`tide\`)\n` +
          `- Native execution: Powered by LLVM MCJIT for lightning-fast compilation and execution.\n\n` +
          `Feel free to ask for syntax help, AST structure, LLVM IR translation, or code snippets!`;
      }

      return res.json({ text: fallbackText });
    }

    // Prepare contents history for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(messages)) {
      for (const m of messages) {
        contents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        });
      }
    }

    let finalPrompt = message;
    if (codeContext) {
      finalPrompt = `Current Siren Code Context in REPL / Editor:\n\`\`\`siren\n${codeContext}\n\`\`\`\n\nUser Question: ${message}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: finalPrompt }],
    });

    let responseText = '';
    const candidateModels = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: SIREN_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} call failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response from AI models');
    }

    res.json({ text: responseText });
  } catch (error: any) {
    console.error('Gemini error in /api/chat:', error);
    res.status(500).json({
      error: 'Failed to generate response from SirenAI',
      message: error?.message || String(error),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Siren OS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
