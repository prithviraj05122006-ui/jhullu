import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { EvidenceInspector } from './components/EvidenceInspector';
import { WorkspaceDrawer } from './components/WorkspaceDrawer';
import { PythonScriptModal } from './components/PythonScriptModal';
import { SettingsModal } from './components/SettingsModal';
import { AgentMessage, EngineConfig, ToolCallRecord, PlanStep } from './types';

export default function App() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [workspaceFileCount, setWorkspaceFileCount] = useState(2);
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCallRecord | null>(null);

  // Drawers & Modals
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isPythonScriptOpen, setIsPythonScriptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Engine Configuration
  const [config, setConfig] = useState<EngineConfig>({
    provider: 'gemini',
    model: 'gemini-3.7-flash',
    endpointUrl: 'http://localhost:8080/v1/chat/completions',
    maxPlanSteps: 4,
    maxToolItersPerStep: 3,
    temperature: 0.2,
    verifierStrictness: 'strict',
    enableSelfCorrection: true,
    enableSafetyGuardrails: true,
  });

  const fetchWorkspaceCount = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/files');
      const data = await res.json();
      if (data.files) {
        setWorkspaceFileCount(data.files.length);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.queueLength !== undefined) {
        setQueueCount(data.queueLength);
      }
      if (data.workspaceFilesCount !== undefined) {
        setWorkspaceFileCount(data.workspaceFilesCount);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 8000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isExecuting) return;

    const userMessage: AgentMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMessageId = 'asst_' + Date.now();
    const initialAssistantMessage: AgentMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      pipelineState: {
        status: 'queued',
        queuePosition: 1,
        plan: [],
        allToolCalls: [],
        evidenceLog: [],
      },
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsExecuting(true);

    try {
      const response = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          config,
        }),
      });

      if (!response.body) {
        throw new Error('ReadableStream not supported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const updateAssistant = (updater: (prev: AgentMessage) => AgentMessage) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? updater(msg) : msg))
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (!dataStr) continue;

            try {
              const payload = JSON.parse(dataStr);

              switch (currentEvent) {
                case 'queued':
                  updateAssistant((msg) => ({
                    ...msg,
                    pipelineState: {
                      ...msg.pipelineState!,
                      status: 'queued',
                      queuePosition: payload.position,
                    },
                  }));
                  break;

                case 'intent_start':
                  updateAssistant((msg) => ({
                    ...msg,
                    pipelineState: {
                      ...msg.pipelineState!,
                      status: 'planning',
                    },
                  }));
                  break;

                case 'intent_analyzed':
                  updateAssistant((msg) => ({
                    ...msg,
                    pipelineState: {
                      ...msg.pipelineState!,
                      intent: payload,
                    },
                  }));
                  break;

                case 'plan':
                  updateAssistant((msg) => ({
                    ...msg,
                    pipelineState: {
                      ...msg.pipelineState!,
                      status: 'working',
                      plan: payload.steps.map((s: any, idx: number) => ({
                        id: s.id || `step-${idx + 1}`,
                        index: idx + 1,
                        title: s.title,
                        description: s.description,
                        status: 'pending',
                        expectedOutcome: s.expectedOutcome,
                      })),
                    },
                  }));
                  break;

                case 'step_start':
                  updateAssistant((msg) => ({
                    ...msg,
                    pipelineState: {
                      ...msg.pipelineState!,
                      status: 'working',
                      currentStepIndex: payload.index,
                    },
                  }));
                  break;

                case 'tool_call':
                  const newToolCall: ToolCallRecord = {
                    id: payload.id,
                    tool: payload.tool,
                    args: payload.args,
                    timestamp: payload.timestamp || Date.now(),
                    status: 'executing',
                  };
                  updateAssistant((msg) => ({
                    ...msg,
                    pipelineState: {
                      ...msg.pipelineState!,
                      activeTool: payload.tool,
                      activeToolArgs: payload.args,
                      allToolCalls: [...(msg.pipelineState?.allToolCalls || []), newToolCall],
                    },
                  }));
                  break;

                case 'tool_result':
                  updateAssistant((msg) => {
                    const calls = [...(msg.pipelineState?.allToolCalls || [])];
                    const target = calls.find((c) => c.id === payload.id);
                    if (target) {
                      target.result = payload.result;
                      target.status = payload.result?.success ? 'success' : 'error';
                    }
                    return {
                      ...msg,
                      pipelineState: {
                        ...msg.pipelineState!,
                        allToolCalls: calls,
                      },
                    };
                  });
                  fetchWorkspaceCount();
                  break;

                case 'verify_start':
                  updateAssistant((msg) => ({
                    ...msg,
                    pipelineState: {
                      ...msg.pipelineState!,
                      status: 'verifying',
                    },
                  }));
                  break;

                case 'verify_audit':
                  updateAssistant((msg) => ({
                    ...msg,
                    pipelineState: {
                      ...msg.pipelineState!,
                      verification: payload,
                    },
                  }));
                  break;

                case 'token':
                  updateAssistant((msg) => ({
                    ...msg,
                    content: msg.content + payload.content,
                  }));
                  break;

                case 'final':
                  updateAssistant((msg) => ({
                    ...msg,
                    content: payload.answer || msg.content,
                    pipelineState: {
                      ...msg.pipelineState!,
                      status: 'completed',
                      totalDurationMs: payload.durationMs,
                      verification: payload.audit || msg.pipelineState?.verification,
                    },
                  }));
                  fetchWorkspaceCount();
                  break;

                case 'error':
                  updateAssistant((msg) => ({
                    ...msg,
                    content: msg.content ? `${msg.content}\n\n**Error:** ${payload.message}` : `**Error:** ${payload.message}`,
                    pipelineState: {
                      ...msg.pipelineState!,
                      status: 'error',
                    },
                  }));
                  break;
              }
            } catch (err) {
              console.warn('Failed to parse SSE line:', line, err);
            }
          }
        }
      }
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `**Pipeline Execution Failure:** ${error.message}`,
                pipelineState: {
                  ...msg.pipelineState!,
                  status: 'error',
                },
              }
            : msg
        )
      );
    } finally {
      setIsExecuting(false);
      fetchWorkspaceCount();
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-100 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      {/* Header */}
      <Header
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWorkspace={() => setIsWorkspaceOpen(true)}
        onOpenPythonScript={() => setIsPythonScriptOpen(true)}
        queueCount={queueCount}
        isExecuting={isExecuting}
        workspaceFileCount={workspaceFileCount}
      />

      {/* Main Layout Area */}
      <main className="relative flex flex-1 overflow-hidden">
        <ChatPanel
          messages={messages}
          isExecuting={isExecuting}
          onSendMessage={handleSendMessage}
          onSelectToolCall={(tc) => setSelectedToolCall(tc)}
          onClearHistory={handleClearHistory}
          config={config}
        />

        {/* Evidence & Tool Call Inspector Drawer */}
        <EvidenceInspector
          toolCall={selectedToolCall}
          onClose={() => setSelectedToolCall(null)}
        />

        {/* Sandboxed Workspace Drawer */}
        <WorkspaceDrawer
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
          onFilesChanged={fetchWorkspaceCount}
        />

        {/* Leveled-Up Python Script Modal */}
        <PythonScriptModal
          isOpen={isPythonScriptOpen}
          onClose={() => setIsPythonScriptOpen(false)}
        />

        {/* Pipeline Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onChangeConfig={setConfig}
        />
      </main>
    </div>
  );
}
