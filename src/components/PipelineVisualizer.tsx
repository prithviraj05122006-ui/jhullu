import React, { useState } from 'react';
import {
  Compass,
  ListOrdered,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  FileCode,
  Globe,
  Database,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { AgentMessage, ToolCallRecord } from '../types';

interface PipelineVisualizerProps {
  message: AgentMessage;
  onSelectToolCall?: (toolCall: ToolCallRecord) => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  message,
  onSelectToolCall,
}) => {
  const state = message.pipelineState;
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tools' | 'verifier'>('overview');

  if (!state) return null;

  const isCompleted = state.status === 'completed';
  const isWorking = state.status === 'working';
  const isPlanning = state.status === 'planning';
  const isVerifying = state.status === 'verifying';

  const toolIcon = (toolName: string) => {
    switch (toolName) {
      case 'run_shell':
        return <Terminal className="h-3.5 w-3.5 text-amber-500" />;
      case 'read_file':
      case 'write_file':
      case 'append_file':
      case 'list_dir':
      case 'search_file':
        return <FileCode className="h-3.5 w-3.5 text-blue-500" />;
      case 'http_fetch':
        return <Globe className="h-3.5 w-3.5 text-emerald-500" />;
      case 'memory_store':
      case 'memory_recall':
        return <Database className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <Wrench className="h-3.5 w-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/70 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 px-4 py-2.5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Autonomous Pipeline Execution
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : state.status === 'error'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-indigo-100 text-indigo-700 animate-pulse dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}
          >
            {state.status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {state.totalDurationMs && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Clock className="h-3 w-3" />
              {(state.totalDurationMs / 1000).toFixed(2)}s
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Pipeline Stage Bar */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {/* Stage 1: Intent */}
            <div
              className={`rounded-lg border p-2.5 transition ${
                state.intent
                  ? 'border-indigo-200 bg-white dark:border-indigo-900/50 dark:bg-zinc-900'
                  : 'border-zinc-200 bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  <Compass className="h-3.5 w-3.5 text-indigo-500" />
                  1. Intent
                </span>
                {state.intent && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
              <p className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {state.intent?.category || 'Analyzing...'}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                <span className="capitalize">{state.intent?.complexity || 'Auto'}</span> •{' '}
                <span>{state.intent?.estimatedSteps ? `${state.intent.estimatedSteps} steps` : 'Adaptive'}</span>
              </div>
            </div>

            {/* Stage 2: Planner */}
            <div
              className={`rounded-lg border p-2.5 transition ${
                isPlanning
                  ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 dark:bg-indigo-950/30'
                  : state.plan
                  ? 'border-indigo-200 bg-white dark:border-indigo-900/50 dark:bg-zinc-900'
                  : 'border-zinc-200 bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  <ListOrdered className="h-3.5 w-3.5 text-blue-500" />
                  2. Planner
                </span>
                {state.plan && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
              <p className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {state.plan ? `${state.plan.length} Sub-goals` : isPlanning ? 'Decomposing...' : 'Pending'}
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">Directed DAG Plan</p>
            </div>

            {/* Stage 3: Worker */}
            <div
              className={`rounded-lg border p-2.5 transition ${
                isWorking
                  ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 dark:bg-indigo-950/30'
                  : state.allToolCalls && state.allToolCalls.length > 0
                  ? 'border-indigo-200 bg-white dark:border-indigo-900/50 dark:bg-zinc-900'
                  : 'border-zinc-200 bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  <Wrench className="h-3.5 w-3.5 text-amber-500" />
                  3. ReAct Worker
                </span>
                {state.status === 'verifying' || isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : isWorking ? (
                  <Zap className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                ) : null}
              </div>
              <p className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {state.allToolCalls ? `${state.allToolCalls.length} Tool Actions` : isWorking ? 'Executing...' : 'Pending'}
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">Auto-healing loop</p>
            </div>

            {/* Stage 4: Verifier */}
            <div
              className={`rounded-lg border p-2.5 transition ${
                isVerifying
                  ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500 dark:bg-indigo-950/30'
                  : state.verification
                  ? 'border-indigo-200 bg-white dark:border-indigo-900/50 dark:bg-zinc-900'
                  : 'border-zinc-200 bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  4. Verifier
                </span>
                {state.verification && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
              <p className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {state.verification ? `${state.verification.confidenceScore}% Grounded` : isVerifying ? 'Auditing...' : 'Pending'}
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">Zero-hallucination</p>
            </div>
          </div>

          {/* Sub-steps and Tool calls breakdown */}
          {state.plan && state.plan.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Plan Execution Graph
              </h4>
              <div className="space-y-2">
                {state.plan.map((step, idx) => {
                  const isCurrent = state.currentStepIndex === idx + 1;
                  const isPast = state.currentStepIndex ? state.currentStepIndex > idx + 1 : isCompleted;
                  return (
                    <div
                      key={step.id || idx}
                      className={`rounded-lg border p-2.5 transition ${
                        isCurrent
                          ? 'border-indigo-300 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-950/20'
                          : isPast
                          ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/80'
                          : 'border-zinc-200/60 bg-zinc-100/40 opacity-70 dark:border-zinc-800/60 dark:bg-zinc-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              isPast
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                ? 'bg-indigo-600 text-white animate-pulse'
                                : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {isPast ? '✓' : idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              {step.title}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {step.description}
                            </p>
                            {step.expectedOutcome && (
                              <p className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400">
                                🎯 Expected outcome: {step.expectedOutcome}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                            isPast
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isCurrent
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {isPast ? 'Done' : isCurrent ? 'Active' : 'Queued'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tool Calls Chips */}
          {state.allToolCalls && state.allToolCalls.length > 0 && (
            <div className="mt-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Tool Actions & Evidence ({state.allToolCalls.length})
              </h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {state.allToolCalls.map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => onSelectToolCall && onSelectToolCall(tc)}
                    className="group flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 shadow-xs transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-800"
                  >
                    {toolIcon(tc.tool)}
                    <span className="font-mono text-[11px] font-medium">{tc.tool}</span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        tc.status === 'success'
                          ? 'bg-emerald-500'
                          : tc.status === 'error'
                          ? 'bg-rose-500'
                          : 'bg-amber-500 animate-ping'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verifier Evidence Grounding Audit Summary */}
          {state.verification && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    Empirical Grounding Audit: {state.verification.confidenceScore}% Confidence
                  </span>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  {state.verification.groundingStatus === 'fully_grounded' ? '100% Proven' : 'Verified with Caveats'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                Verified against {state.verification.evidenceCount} empirical evidence items. All outputs strictly reflect verifiable system outputs.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
