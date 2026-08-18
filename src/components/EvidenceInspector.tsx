import React from 'react';
import { X, Terminal, CheckCircle2, AlertCircle, Clock, Copy, Check } from 'lucide-react';
import { ToolCallRecord } from '../types';

interface EvidenceInspectorProps {
  toolCall: ToolCallRecord | null;
  onClose: () => void;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({ toolCall, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!toolCall) return null;

  const handleCopy = () => {
    const raw = JSON.stringify(toolCall, null, 2);
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-lg">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Tool Execution Inspector
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            title="Copy Raw JSON"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'JSON'}</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
        {/* Tool Summary Card */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {toolCall.tool}
            </span>
            <span
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                toolCall.status === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : toolCall.status === 'error'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {toolCall.status === 'success' ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {toolCall.status.toUpperCase()}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Call ID: <code className="font-mono text-zinc-800 dark:text-zinc-200">{toolCall.id}</code></span>
            {toolCall.result?.durationMs !== undefined && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {toolCall.result.durationMs}ms
              </span>
            )}
            {toolCall.result?.exitCode !== undefined && (
              <span>Exit Code: <strong className={toolCall.result.exitCode === 0 ? 'text-emerald-600' : 'text-rose-600'}>{toolCall.result.exitCode}</strong></span>
            )}
          </div>
        </div>

        {/* Arguments */}
        <div>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Tool Arguments
          </h4>
          <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 p-3 font-mono text-[11px] text-zinc-100 dark:border-zinc-800">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>

        {/* Stdout Output */}
        {toolCall.result?.stdout && (
          <div>
            <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Standard Output (stdout)
            </h4>
            <pre className="max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-300 dark:border-zinc-800">
              {toolCall.result.stdout}
            </pre>
          </div>
        )}

        {/* Stderr Output */}
        {toolCall.result?.stderr && (
          <div>
            <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Standard Error (stderr)
            </h4>
            <pre className="max-h-40 overflow-y-auto rounded-lg border border-rose-200 bg-rose-950/40 p-3 font-mono text-[11px] leading-relaxed text-rose-300 dark:border-rose-900/50">
              {toolCall.result.stderr}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
