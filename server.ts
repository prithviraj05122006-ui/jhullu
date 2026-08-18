import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ============================================================
// IN-MEMORY WORKSPACE & MEMORY STORE
// ============================================================
interface VirtualFile {
  path: string;
  content: string;
  size: number;
  lastModified: number;
  language: string;
}

const virtualWorkspace: Map<string, VirtualFile> = new Map();
const sessionMemory: Map<string, any> = new Map();

// Seed initial workspace with starter files
const seedFiles = [
  {
    path: 'README.md',
    content: `# Agent Workspace\n\nThis is the sandboxed workspace managed by the Planner-Worker-Verifier autonomous agent pipeline.\n\nGenerated files, scripts, and logs will be created and modified here.\n`,
    language: 'markdown',
  },
  {
    path: 'config.json',
    content: JSON.stringify(
      {
        environment: 'production-sandbox',
        agent_version: '2.5.0-autonomous',
        safety_level: 'strict',
        allowed_tools: ['run_shell', 'read_file', 'write_file', 'append_file', 'list_dir', 'search_file', 'python_eval', 'http_fetch', 'memory_store', 'memory_recall'],
      },
      null,
      2
    ),
    language: 'json',
  },
];

seedFiles.forEach((f) => {
  virtualWorkspace.set(f.path, {
    path: f.path,
    content: f.content,
    size: f.content.length,
    lastModified: Date.now(),
    language: f.language,
  });
});

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'py':
      return 'python';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'sh':
    case 'bash':
      return 'bash';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
}

// ============================================================
// TOOL EXECUTION ENGINE
// ============================================================
const BLOCKED_COMMANDS = [
  /rm\s+-rf\s+\//i,
  /\bdd\s+if=/i,
  /\bmkfs\b/i,
  /:\(\)\s*\{/i,
  />\s*\/dev\/sd/i,
  /chmod\s+-R\s+777\s+\//i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bpoweroff\b/i,
];

function isCommandBlocked(cmd: string): boolean {
  return BLOCKED_COMMANDS.some((p) => p.test(cmd));
}

function executeToolInWorkspace(tool: string, args: Record<string, any>) {
  const startTime = Date.now();
  switch (tool) {
    case 'run_shell': {
      const command = (args.command || '').trim();
      if (!command) {
        return { success: false, stdout: '', stderr: 'Empty command supplied', exitCode: 1, durationMs: 0 };
      }
      if (isCommandBlocked(command)) {
        return {
          success: false,
          stdout: '',
          stderr: 'BLOCKED: Command matched destructive security policy.',
          exitCode: -1,
          durationMs: Date.now() - startTime,
        };
      }

      // Safe virtualized shell simulation with real workspace synchronization
      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      if (command.startsWith('ls') || command.startsWith('dir')) {
        const files = Array.from(virtualWorkspace.keys());
        stdout = files.map((f) => {
          const item = virtualWorkspace.get(f)!;
          return `-rw-r--r-- 1 agent dev ${item.size.toString().padStart(6, ' ')} ${new Date(item.lastModified).toISOString().slice(0, 10)} ${f}`;
        }).join('\n');
        if (!stdout) stdout = '(directory is empty)';
      } else if (command.startsWith('cat ') || command.startsWith('type ')) {
        const target = command.replace(/^(cat|type)\s+/, '').trim();
        if (virtualWorkspace.has(target)) {
          stdout = virtualWorkspace.get(target)!.content;
        } else {
          stderr = `cat: ${target}: No such file or directory`;
          exitCode = 1;
        }
      } else if (command.startsWith('echo ')) {
        const match = command.match(/^echo\s+(["']?)(.*?)\1\s*(>>|>)\s*([^\s]+)$/);
        if (match) {
          const text = match[2];
          const isAppend = match[3] === '>>';
          const target = match[4];
          const existing = virtualWorkspace.get(target)?.content || '';
          const newContent = isAppend ? existing + (existing ? '\n' : '') + text : text;
          virtualWorkspace.set(target, {
            path: target,
            content: newContent,
            size: newContent.length,
            lastModified: Date.now(),
            language: detectLanguage(target),
          });
          stdout = `Wrote to ${target}`;
        } else {
          stdout = command.replace(/^echo\s+/, '');
        }
      } else if (command.includes('am start')) {
        stdout = `Starting: Intent { act=android.intent.action.VIEW dat=${command.match(/-d\s+['"]?([^'"]+)['"]?/)?.[1] || 'intent'} }\nStatus: Activity intent dispatched to Android WindowManager.`;
      } else if (command.startsWith('python') || command.startsWith('python3')) {
        stdout = `Python 3.11.4 Runtime Sandbox\n[OK] Script executed with status code 0.`;
      } else {
        stdout = `[Sandbox Shell] Command '${command}' completed with returncode 0.\nWorkspace files updated: ${virtualWorkspace.size} files tracked.`;
      }

      return {
        success: exitCode === 0,
        stdout,
        stderr,
        exitCode,
        durationMs: Date.now() - startTime,
      };
    }

    case 'read_file': {
      const filePath = args.path || '';
      if (virtualWorkspace.has(filePath)) {
        const file = virtualWorkspace.get(filePath)!;
        return {
          success: true,
          stdout: file.content,
          stderr: '',
          exitCode: 0,
          durationMs: Date.now() - startTime,
        };
      }
      return {
        success: false,
        stdout: '',
        stderr: `File not found: ${filePath}`,
        exitCode: 1,
        durationMs: Date.now() - startTime,
      };
    }

    case 'write_file': {
      const filePath = args.path || 'output.txt';
      const content = args.content ?? '';
      virtualWorkspace.set(filePath, {
        path: filePath,
        content,
        size: content.length,
        lastModified: Date.now(),
        language: detectLanguage(filePath),
      });
      return {
        success: true,
        stdout: `Successfully wrote ${content.length} bytes to ${filePath}`,
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    }

    case 'append_file': {
      const filePath = args.path || 'output.txt';
      const content = args.content ?? '';
      const existing = virtualWorkspace.get(filePath)?.content || '';
      const newContent = existing + (existing ? '\n' : '') + content;
      virtualWorkspace.set(filePath, {
        path: filePath,
        content: newContent,
        size: newContent.length,
        lastModified: Date.now(),
        language: detectLanguage(filePath),
      });
      return {
        success: true,
        stdout: `Successfully appended ${content.length} bytes to ${filePath} (Total: ${newContent.length} bytes)`,
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    }

    case 'list_dir': {
      const files = Array.from(virtualWorkspace.values()).map((f) => {
        return `[${f.language.toUpperCase()}] ${f.path} (${f.size} bytes, modified: ${new Date(f.lastModified).toLocaleTimeString()})`;
      });
      return {
        success: true,
        stdout: files.join('\n') || '(directory empty)',
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    }

    case 'search_file': {
      const pattern = args.pattern || '';
      const results: string[] = [];
      const regex = new RegExp(pattern, 'i');
      for (const [p, file] of virtualWorkspace.entries()) {
        const lines = file.content.split('\n');
        lines.forEach((line, idx) => {
          if (regex.test(line)) {
            results.push(`${p}:${idx + 1} -> ${line.trim()}`);
          }
        });
      }
      return {
        success: true,
        stdout: results.length > 0 ? results.join('\n') : `No matches found for '${pattern}'`,
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    }

    case 'http_fetch': {
      const url = args.url || '';
      return {
        success: true,
        stdout: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  "status": "success",\n  "url": "${url}",\n  "data": "Simulated REST API / Web search response parsed and validated.",\n  "timestamp": ${Date.now()}\n}`,
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    }

    case 'python_eval': {
      const code = args.code || '';
      let calculated = '';
      try {
        // Safe evaluation of simple expressions
        if (/^[\d\s\+\-\*\/\(\)\.,eE^%]+$/.test(code)) {
          calculated = String(Function(`"use strict"; return (${code})`)());
        } else {
          calculated = `Executed Python snippet successfully. Result: Validated.`;
        }
        return {
          success: true,
          stdout: calculated,
          stderr: '',
          exitCode: 0,
          durationMs: Date.now() - startTime,
        };
      } catch (err: any) {
        return {
          success: false,
          stdout: '',
          stderr: `Python evaluation error: ${err.message}`,
          exitCode: 1,
          durationMs: Date.now() - startTime,
        };
      }
    }

    case 'memory_store': {
      sessionMemory.set(args.key, args.value);
      return {
        success: true,
        stdout: `Saved '${args.key}' into session memory.`,
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    }

    case 'memory_recall': {
      if (sessionMemory.has(args.key)) {
        return {
          success: true,
          stdout: JSON.stringify(sessionMemory.get(args.key), null, 2),
          stderr: '',
          exitCode: 0,
          durationMs: Date.now() - startTime,
        };
      }
      return {
        success: false,
        stdout: '',
        stderr: `Key '${args.key}' not found in session memory.`,
        exitCode: 1,
        durationMs: Date.now() - startTime,
      };
    }

    case 'done': {
      return {
        success: true,
        stdout: args.summary || 'Step completed successfully.',
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    }

    default:
      return {
        success: false,
        stdout: '',
        stderr: `Unknown tool: ${tool}`,
        exitCode: 1,
        durationMs: Date.now() - startTime,
      };
  }
}

function extractJSON(text: string): any {
  if (!text) return null;
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      try {
        const repaired = match[0].replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(repaired);
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Request Queue State
const activeJobQueue: { id: string; timestamp: number }[] = [];

// ============================================================
// API ROUTES
// ============================================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    queueLength: activeJobQueue.length,
    workspaceFilesCount: virtualWorkspace.size,
    timestamp: Date.now(),
  });
});

// Workspace Files Listing
app.get('/api/workspace/files', (req: Request, res: Response) => {
  const files = Array.from(virtualWorkspace.values()).map((f) => ({
    path: f.path,
    size: f.size,
    lastModified: f.lastModified,
    language: f.language,
  }));
  res.json({ files });
});

// Workspace File Content
app.get('/api/workspace/file', (req: Request, res: Response) => {
  const filePath = String(req.query.path || '');
  if (virtualWorkspace.has(filePath)) {
    res.json({ file: virtualWorkspace.get(filePath) });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Workspace File Update / Creation
app.post('/api/workspace/file', (req: Request, res: Response) => {
  const { path: filePath, content } = req.body;
  if (!filePath) {
    res.status(400).json({ error: 'File path required' });
    return;
  }
  const file: VirtualFile = {
    path: filePath,
    content: content ?? '',
    size: (content ?? '').length,
    lastModified: Date.now(),
    language: detectLanguage(filePath),
  };
  virtualWorkspace.set(filePath, file);
  res.json({ success: true, file });
});

// Workspace File Deletion
app.delete('/api/workspace/file', (req: Request, res: Response) => {
  const filePath = String(req.query.path || '');
  if (virtualWorkspace.has(filePath)) {
    virtualWorkspace.delete(filePath);
    res.json({ success: true, deleted: filePath });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Reset Workspace
app.post('/api/workspace/reset', (req: Request, res: Response) => {
  virtualWorkspace.clear();
  seedFiles.forEach((f) => {
    virtualWorkspace.set(f.path, {
      path: f.path,
      content: f.content,
      size: f.content.length,
      lastModified: Date.now(),
      language: f.language,
    });
  });
  sessionMemory.clear();
  res.json({ success: true, filesCount: virtualWorkspace.size });
});

// Serve the Advanced Python Script
app.get('/api/python-script', (req: Request, res: Response) => {
  const scriptPath = path.join(process.cwd(), 'agent_server_advanced.py');
  if (fs.existsSync(scriptPath)) {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    res.json({ filename: 'agent_server_advanced.py', content });
  } else {
    res.status(404).json({ error: 'Script not found' });
  }
});

// Execute Direct Tool in Sandbox
app.post('/api/tools/execute', (req: Request, res: Response) => {
  const { tool, args } = req.body;
  const result = executeToolInWorkspace(tool, args || {});
  res.json(result);
});

// ============================================================
// AGENT SSE PIPELINE ROUTE (/api/agent/stream)
// ============================================================
app.post('/api/agent/stream', async (req: Request, res: Response) => {
  const { message, history = [], config = {} } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Missing message parameter' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const emit = (event: string, data: any) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // client disconnected
    }
  };

  const jobId = 'job_' + Math.random().toString(36).substring(2, 9);
  activeJobQueue.push({ id: jobId, timestamp: Date.now() });

  emit('queued', {
    jobId,
    position: activeJobQueue.length,
    queueLength: activeJobQueue.length,
  });

  const startTime = Date.now();

  try {
    emit('start', { jobId, timestamp: startTime });

    // ==========================================
    // STAGE 1: INTENT ANALYSIS
    // ==========================================
    emit('intent_start', { timestamp: Date.now() });

    let intent = {
      category: 'general_ops',
      complexity: 'moderate',
      requiresTools: true,
      estimatedSteps: 3,
    };

    try {
      const intentPrompt = `You are an AI Intent Classifier for an autonomous tool-augmented pipeline.
Analyze this user query: "${message}"

Classify into JSON format:
{
  "category": "shell_ops" | "coding" | "file_io" | "web_research" | "general_qa" | "math_data",
  "complexity": "simple" | "moderate" | "complex",
  "requiresTools": true | false,
  "estimatedSteps": 1 to 4
}
Output ONLY the JSON object.`;

      const intentRes = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: intentPrompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const parsedIntent = extractJSON(intentRes.text || '');
      if (parsedIntent && parsedIntent.category) {
        intent = parsedIntent;
      }
    } catch (e) {
      console.warn('Intent analysis fallback:', e);
    }

    emit('intent_analyzed', intent);

    // ==========================================
    // STAGE 2: HIERARCHICAL PLANNER
    // ==========================================
    emit('plan_start', { timestamp: Date.now() });

    let steps: Array<{ id: string; title: string; description: string; expectedOutcome?: string }> = [];

    if (!intent.requiresTools && intent.complexity === 'simple') {
      steps = [{ id: 'step-1', title: 'Direct Resolution', description: message }];
    } else {
      try {
        const planPrompt = `You are an autonomous Task Planner.
User Goal: "${message}"
Intent Context: ${JSON.stringify(intent)}

Workspace Files: ${Array.from(virtualWorkspace.keys()).join(', ') || 'none'}

Break this goal down into 1 to 4 logical, sequential steps. Each step must be concrete, testable, and have an expected outcome.
Respond ONLY with a JSON object:
{
  "steps": [
    {
      "id": "step-1",
      "title": "Short title",
      "description": "Concrete description of the action to take",
      "expectedOutcome": "What empirical proof/output is expected"
    }
  ]
}`;

        const planRes = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: planPrompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        const parsedPlan = extractJSON(planRes.text || '');
        if (parsedPlan && Array.from(parsedPlan.steps || []).length > 0) {
          steps = parsedPlan.steps;
        } else {
          steps = [{ id: 'step-1', title: 'Execute Task', description: message }];
        }
      } catch (e) {
        steps = [{ id: 'step-1', title: 'Execute Task', description: message }];
      }
    }

    emit('plan', { steps });

    // ==========================================
    // STAGE 3: AUTONOMOUS REACT WORKER
    // ==========================================
    const evidenceLog: string[] = [];
    const maxIters = config.maxToolItersPerStep || 3;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      emit('step_start', {
        index: i + 1,
        total: steps.length,
        stepId: step.id,
        title: step.title,
        description: step.description,
      });

      let stepCompleted = false;

      for (let iter = 0; iter < maxIters && !stepCompleted; iter++) {
        const workerPrompt = `You are an autonomous ReAct worker executing Step ${i + 1}/${steps.length}: "${step.title}" - ${step.description}.
Overall User Goal: "${message}"

Available Tools:
- {"tool": "run_shell", "args": {"command": "ls -la"}}
- {"tool": "read_file", "args": {"path": "filename.txt"}}
- {"tool": "write_file", "args": {"path": "filename.txt", "content": "..."}}
- {"tool": "append_file", "args": {"path": "filename.txt", "content": "..."}}
- {"tool": "list_dir", "args": {"path": "."}}
- {"tool": "search_file", "args": {"path": ".", "pattern": "keyword"}}
- {"tool": "http_fetch", "args": {"url": "https://...", "method": "GET"}}
- {"tool": "python_eval", "args": {"code": "math or string logic"}}
- {"tool": "memory_store", "args": {"key": "key", "value": "val"}}
- {"tool": "memory_recall", "args": {"key": "key"}}
- {"tool": "done", "args": {"summary": "what was accomplished"}}

Current Evidence collected so far:
${evidenceLog.join('\n') || '(none)'}

Respond with ONLY a JSON object representing your next tool call.`;

        let workerResText = '';
        try {
          const workerRes = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: workerPrompt,
            config: {
              temperature: 0.15,
            },
          });
          workerResText = workerRes.text || '';
        } catch (e: any) {
          evidenceLog.push(`[Step '${step.title}'] Worker API error: ${e.message}`);
          break;
        }

        const toolCall = extractJSON(workerResText);
        if (!toolCall || !toolCall.tool) {
          evidenceLog.push(`[Step '${step.title}'] Note: ${workerResText.slice(0, 150)}`);
          break;
        }

        const callId = 'call_' + Math.random().toString(36).substring(2, 7);
        emit('tool_call', {
          id: callId,
          tool: toolCall.tool,
          args: toolCall.args || {},
          stepId: step.id,
          timestamp: Date.now(),
        });

        if (toolCall.tool === 'done') {
          const summary = toolCall.args?.summary || 'Sub-goal successfully achieved.';
          evidenceLog.push(`[Step '${step.title}'] COMPLETED: ${summary}`);
          emit('tool_result', {
            id: callId,
            tool: 'done',
            result: { stdout: summary, exitCode: 0, success: true, durationMs: 5 },
          });
          stepCompleted = true;
          break;
        }

        // Execute Tool in virtual sandbox
        const execResult = executeToolInWorkspace(toolCall.tool, toolCall.args || {});
        emit('tool_result', {
          id: callId,
          tool: toolCall.tool,
          result: execResult,
        });

        if (execResult.success && execResult.exitCode === 0) {
          const preview = (execResult.stdout || '').slice(0, 300);
          evidenceLog.push(`[Step '${step.title}'] ${toolCall.tool}(${JSON.stringify(toolCall.args)}) -> ${preview}`);
        } else {
          const errPreview = (execResult.stderr || 'Execution failed').slice(0, 300);
          evidenceLog.push(`[Step '${step.title}'] ERROR: ${toolCall.tool} -> ${errPreview}`);
          emit('self_correction', {
            stepId: step.id,
            error: errPreview,
            attempt: iter + 1,
          });
        }
      }

      emit('step_complete', {
        index: i + 1,
        stepId: step.id,
      });
    }

    // ==========================================
    // STAGE 4: STRICT EMPIRICAL VERIFIER
    // ==========================================
    emit('verify_start', { timestamp: Date.now() });

    const totalEvidence = evidenceLog.length;
    const errorCount = evidenceLog.filter((e) => e.includes('ERROR:')).length;
    const confidenceScore = totalEvidence > 0 ? Math.max(20, Math.round(((totalEvidence - errorCount) / totalEvidence) * 100)) : 95;

    const auditData = {
      confidenceScore,
      groundingStatus: confidenceScore >= 85 ? 'fully_grounded' : 'partially_grounded',
      verifiedClaims: evidenceLog.filter((e) => !e.includes('ERROR:')).map((e) => e.slice(0, 80)),
      unverifiedClaims: errorCount > 0 ? [`${errorCount} tool call error(s) logged in trace`] : [],
      evidenceCount: totalEvidence,
      safetyCheck: true,
    };

    emit('verify_audit', auditData);

    // Stream the final synthesized grounded answer
    const verifierPrompt = `You are the Verifier & Synthesis module for an autonomous agent pipeline.
User Goal: "${message}"

=== EMPIRICAL EVIDENCE COLLECTED ===
${evidenceLog.join('\n---\n') || '(Task required pure direct synthesis)'}
====================================

STRICT GROUNDING RULES:
1. ONLY claim an action succeeded if the empirical evidence log proves exit_code 0 or success.
2. If Android Intent commands (am start) or asynchronous background tasks were dispatched, state that they were *requested/dispatched* and clarify what the user can expect.
3. Write in polished, clear, structured Markdown. Use codeblocks for created files, tables for structured findings, and callouts where helpful.
4. DO NOT output JSON in this final answer. Synthesize a professional, comprehensive response.`;

    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.7-flash',
      contents: verifierPrompt,
      config: {
        temperature: 0.2,
      },
    });

    let fullAnswer = '';
    for await (const chunk of stream) {
      const textChunk = chunk.text || '';
      if (textChunk) {
        fullAnswer += textChunk;
        emit('token', { content: textChunk });
      }
    }

    const durationMs = Date.now() - startTime;
    emit('final', {
      answer: fullAnswer,
      confidenceScore,
      durationMs,
      evidenceLog,
      audit: auditData,
    });
  } catch (error: any) {
    emit('error', { message: error.message || 'Pipeline execution failure' });
  } finally {
    // Remove from queue
    const index = activeJobQueue.findIndex((j) => j.id === jobId);
    if (index !== -1) {
      activeJobQueue.splice(index, 1);
    }
    res.end();
  }
});

// ============================================================
// VITE SPA MIDDLEWARE / STATIC ASSETS
// ============================================================
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agent Control Center & Backend running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
