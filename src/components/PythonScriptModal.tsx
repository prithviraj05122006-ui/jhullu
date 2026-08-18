import React, { useState, useEffect } from 'react';
import { X, Code2, Copy, Download, Check, Sparkles, Terminal, Shield, Zap } from 'lucide-react';

interface PythonScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({ isOpen, onClose }) => {
  const [scriptContent, setScriptContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/python-script')
        .then((res) => res.json())
        .then((data) => {
          if (data.content) setScriptContent(data.content);
        })
        .catch((err) => console.error('Failed to load python script:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent_server_advanced.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Leveled-Up Autonomous Python Agent Server
                </h3>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  v2.0 Production Ready
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Self-contained Python backend: Planner • ReAct Worker (8 Tools + Self-Healing) • Empirical Verifier • Queue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .py</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feature Banner */}
        <div className="grid grid-cols-1 gap-3 border-b border-zinc-200 bg-zinc-50/80 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900/40 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-zinc-700 dark:text-zinc-300">
              <strong>Auto-Healing Loop:</strong> Worker corrects syntax & flag errors dynamically
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Terminal className="h-4 w-4 text-indigo-500" />
            <span className="text-zinc-700 dark:text-zinc-300">
              <strong>8 Built-in Tools:</strong> Shell, File I/O, Search, HTTP Fetch, Python Eval, Memory
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span className="text-zinc-700 dark:text-zinc-300">
              <strong>Strict Verifier:</strong> Grounded claim auditor with confidence scoring
            </span>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="relative h-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 font-mono text-xs text-zinc-100 dark:border-zinc-800">
            <pre className="h-full overflow-y-auto p-5 leading-relaxed">
              <code>{loading ? 'Loading script source...' : scriptContent}</code>
            </pre>
          </div>
        </div>

        {/* Footer command helper */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Quick Run:</span>
            <code className="rounded bg-zinc-200 px-2 py-0.5 font-mono text-[11px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              python agent_server_advanced.py --port 8090 --model-url http://localhost:8080/v1/chat/completions
            </code>
          </div>
          <span className="text-[11px] text-zinc-400">No external dependencies required (Standard Library)</span>
        </div>
      </div>
    </div>
  );
};
