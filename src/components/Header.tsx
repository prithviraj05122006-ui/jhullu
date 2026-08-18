import React from 'react';
import { Bot, Cpu, Terminal, FolderTree, Code2, SlidersHorizontal, Activity } from 'lucide-react';
import { EngineConfig } from '../types';

interface HeaderProps {
  config: EngineConfig;
  onOpenSettings: () => void;
  onOpenWorkspace: () => void;
  onOpenPythonScript: () => void;
  queueCount: number;
  isExecuting: boolean;
  workspaceFileCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  onOpenWorkspace,
  onOpenPythonScript,
  queueCount,
  isExecuting,
  workspaceFileCount,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6">
      {/* Brand & Pipeline Status */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Cognitive Agent Pipeline
            </h1>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-400/20">
              v2.5 Autonomous
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Planner • Worker (ReAct) • Verifier Pipeline
          </p>
        </div>
      </div>

      {/* Metrics & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Model Badge */}
        <div className="hidden items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 md:flex">
          <Cpu className="h-3.5 w-3.5 text-indigo-500" />
          <span className="font-medium">
            {config.provider === 'gemini' ? 'Gemini 3.7 Flash' : 'Local LLaMA 8080'}
          </span>
          <span
            className={`h-2 w-2 rounded-full ${
              isExecuting
                ? 'animate-pulse bg-emerald-500 ring-4 ring-emerald-500/20'
                : 'bg-zinc-400'
            }`}
          />
        </div>

        {/* Queue Indicator */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 sm:flex">
          <Activity className="h-3.5 w-3.5 text-amber-500" />
          <span>Queue: <strong className="text-zinc-900 dark:text-zinc-100">{queueCount}</strong></span>
        </div>

        {/* Workspace Files Button */}
        <button
          id="btn-open-workspace"
          onClick={onOpenWorkspace}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          title="Open Sandboxed Workspace Files"
        >
          <FolderTree className="h-3.5 w-3.5 text-indigo-500" />
          <span className="hidden sm:inline">Workspace</span>
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {workspaceFileCount}
          </span>
        </button>

        {/* Python Script Code Hub */}
        <button
          id="btn-open-python-code"
          onClick={onOpenPythonScript}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          title="View & Download Leveled-Up Python Script"
        >
          <Code2 className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>Python Backend</span>
        </button>

        {/* Settings Button */}
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          title="Agent Pipeline Settings"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
