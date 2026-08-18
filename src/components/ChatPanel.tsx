import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Terminal,
  RotateCcw,
  Square,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { AgentMessage, ToolCallRecord, EngineConfig } from '../types';
import { PipelineVisualizer } from './PipelineVisualizer';

interface ChatPanelProps {
  messages: AgentMessage[];
  isExecuting: boolean;
  onSendMessage: (text: string) => void;
  onSelectToolCall: (toolCall: ToolCallRecord) => void;
  onClearHistory: () => void;
  config: EngineConfig;
}

const PRESET_PROMPTS = [
  {
    title: 'Audit Project & Create Health Report',
    desc: 'Inspect workspace files and generate a comprehensive markdown audit.',
    prompt: 'Please inspect the files in the workspace, analyze their structure, and create a comprehensive health report in HEALTH_AUDIT.md.',
  },
  {
    title: 'Compute Prime Numbers via Python Eval',
    desc: 'Run mathematical sandbox evaluation and store in session memory.',
    prompt: 'Calculate the sum of all prime numbers under 1000 using the python_eval tool, store the result in memory under key "prime_sum", and verify the output.',
  },
  {
    title: 'Android Intent Dispatch & Test',
    desc: 'Test Android am start intent with heuristic safety verification.',
    prompt: 'Dispatch an Android VIEW intent to open https://developer.android.com and analyze the result heuristics.',
  },
  {
    title: 'Multi-step Data Pipeline & Script',
    desc: 'Generate a Python automation script, test it, and write documentation.',
    prompt: 'Write a Python utility script named "data_processor.py" in the workspace, add sample processing logic, and verify its file integrity.',
  },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isExecuting,
  onSendMessage,
  onSelectToolCall,
  onClearHistory,
  config,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isExecuting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isExecuting) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Welcome / Empty State */}
          {messages.length === 0 && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-950/60 dark:text-indigo-400">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Autonomous Cognitive Agent Pipeline
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Every task is dynamically decomposed by a <strong>Planner</strong>, executed step-by-step
                by an autonomous <strong>ReAct Worker</strong> with 8 safe tools, and verified for 100% empirical grounding by the <strong>Verifier</strong>.
              </p>

              {/* Preset Prompts Grid */}
              <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                {PRESET_PROMPTS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(preset.prompt)}
                    className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-indigo-800"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {preset.title}
                        </h4>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {preset.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {/* User Message */}
              {msg.role === 'user' && (
                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-2xl rounded-2xl bg-indigo-600 px-4 py-3 text-sm text-white shadow-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Assistant Message */}
              {msg.role === 'assistant' && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-3 overflow-hidden">
                    {/* Live Pipeline Visualizer */}
                    {msg.pipelineState && (
                      <PipelineVisualizer
                        message={msg}
                        onSelectToolCall={onSelectToolCall}
                      />
                    )}

                    {/* Final Synthesized Response */}
                    {msg.content ? (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90">
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed sm:text-sm">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ) : isExecuting && msg.pipelineState?.status === 'verifying' ? (
                      <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-300">
                        <ShieldCheck className="h-4 w-4 animate-pulse text-indigo-600" />
                        <span>Verifier is auditing evidence and synthesizing response...</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-200/80 bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6 md:px-8">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the autonomous pipeline to plan, inspect files, execute tools, or solve a goal..."
              rows={2}
              disabled={isExecuting}
              className="w-full resize-none rounded-xl border border-zinc-300 bg-zinc-50/50 p-3.5 pr-24 text-xs leading-relaxed text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:bg-zinc-900 sm:text-sm"
            />
            <div className="absolute right-2.5 bottom-3.5 flex items-center gap-1.5">
              {messages.length > 0 && !isExecuting && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  title="Clear Conversation History"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={!input.trim() || isExecuting}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-3">
              <span>Press <strong>Enter</strong> to run pipeline • <strong>Shift+Enter</strong> for newline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-amber-500" />
              <span>Planner & ReAct Autonomous Worker Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
