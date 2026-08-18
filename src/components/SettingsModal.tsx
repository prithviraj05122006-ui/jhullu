import React from 'react';
import { X, Sliders, Cpu, Shield, Zap, Sparkles, Check } from 'lucide-react';
import { EngineConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EngineConfig;
  onChangeConfig: (newConfig: EngineConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Pipeline Configuration
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fine-tune the autonomous Planner-Worker-Verifier engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-5 overflow-y-auto p-6 text-xs">
          {/* Provider Selection */}
          <div>
            <label className="mb-2 block font-medium text-zinc-700 dark:text-zinc-300">
              Inference Engine
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, provider: 'gemini' })}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                  config.provider === 'gemini'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 dark:bg-indigo-950/30'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Gemini 3.7 Flash
                  </span>
                  {config.provider === 'gemini' && (
                    <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Cloud intelligence via server-side GenAI SDK
                </p>
              </button>

              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, provider: 'local_llama' })}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                  config.provider === 'local_llama'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 dark:bg-indigo-950/30'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Local LLaMA / Ollama
                  </span>
                  {config.provider === 'local_llama' && (
                    <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Runs against localhost:8080 or custom port
                </p>
              </button>
            </div>
          </div>

          {/* Local endpoint URL if local selected */}
          {config.provider === 'local_llama' && (
            <div>
              <label className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
                Local LLaMA Server Endpoint URL
              </label>
              <input
                type="text"
                value={config.endpointUrl}
                onChange={(e) => onChangeConfig({ ...config, endpointUrl: e.target.value })}
                placeholder="http://localhost:8080/v1/chat/completions"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Max Plan Steps</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{config.maxPlanSteps}</span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                value={config.maxPlanSteps}
                onChange={(e) => onChangeConfig({ ...config, maxPlanSteps: parseInt(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-zinc-400">Maximum sub-goals generated by Planner</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Tool Iterations / Step</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{config.maxToolItersPerStep}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={config.maxToolItersPerStep}
                onChange={(e) => onChangeConfig({ ...config, maxToolItersPerStep: parseInt(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-zinc-400">ReAct tool loop turns per step</span>
            </div>
          </div>

          {/* Verifier Strictness */}
          <div>
            <label className="mb-2 block font-medium text-zinc-700 dark:text-zinc-300">
              Verifier Grounding Strictness
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['strict', 'balanced', 'lenient'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, verifierStrictness: level })}
                  className={`rounded-lg border px-3 py-2 text-center capitalize transition ${
                    config.verifierStrictness === level
                      ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Strict mode aggressively rejects any claim not explicitly confirmed in tool stdout.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">ReAct Self-Correction Loop</p>
                  <p className="text-[11px] text-zinc-500">Automatically inspect tool errors & retry with corrected syntax</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enableSelfCorrection}
                onChange={(e) => onChangeConfig({ ...config, enableSelfCorrection: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">Destructive Command Guardrails</p>
                  <p className="text-[11px] text-zinc-500">Blocks rm -rf, dd, mkfs, format, and system shutdown patterns</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enableSafetyGuardrails}
                onChange={(e) => onChangeConfig({ ...config, enableSafetyGuardrails: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-200 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
