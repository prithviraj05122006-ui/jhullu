import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  FileCode,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  X,
  Download,
  FileText,
  Check,
  RefreshCw,
} from 'lucide-react';
import { WorkspaceFile } from '../types';

interface WorkspaceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesChanged?: () => void;
}

export const WorkspaceDrawer: React.FC<WorkspaceDrawerProps> = ({
  isOpen,
  onClose,
  onFilesChanged,
}) => {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workspace/files');
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
        if (data.files.length > 0 && !selectedFile) {
          loadFileContent(data.files[0].path);
        }
      }
    } catch (err) {
      console.error('Failed to load workspace files:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (path: string) => {
    try {
      setSelectedFile(path);
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.file) {
        setFileContent(data.file.content);
      }
    } catch (err) {
      console.error('Failed to load file content:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    try {
      setIsSaving(true);
      await fetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content: fileContent }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      fetchFiles();
      if (onFilesChanged) onFilesChanged();
    } catch (err) {
      console.error('Failed to save file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    try {
      await fetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newFileName.trim(), content: '' }),
      });
      setNewFileName('');
      setShowNewFileInput(false);
      await fetchFiles();
      loadFileContent(newFileName.trim());
      if (onFilesChanged) onFilesChanged();
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    try {
      await fetch(`/api/workspace/file?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });
      if (selectedFile === path) {
        setSelectedFile(null);
        setFileContent('');
      }
      fetchFiles();
      if (onFilesChanged) onFilesChanged();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleResetWorkspace = async () => {
    if (!confirm('Reset workspace to starter files? Any custom created files will be cleared.')) return;
    try {
      await fetch('/api/workspace/reset', { method: 'POST' });
      setSelectedFile(null);
      setFileContent('');
      fetchFiles();
      if (onFilesChanged) onFilesChanged();
    } catch (err) {
      console.error('Failed to reset workspace:', err);
    }
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-zinc-200 bg-white shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <FolderTree className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Agent Virtual Workspace
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sandboxed filesystem tracked across agent runs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFiles}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="Refresh Files"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleResetWorkspace}
            className="flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            title="Reset Workspace"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: File List */}
        <div className="w-56 border-r border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Files ({files.length})
            </span>
            <button
              onClick={() => setShowNewFileInput(true)}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
              title="Add New File"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {showNewFileInput && (
            <div className="mb-2 space-y-1 rounded-md border border-indigo-200 bg-white p-2 dark:border-indigo-800 dark:bg-zinc-900">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.py"
                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setShowNewFileInput(false)}
                  className="px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1 overflow-y-auto">
            {files.map((f) => (
              <div
                key={f.path}
                onClick={() => loadFileContent(f.path)}
                className={`group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                  selectedFile === f.path
                    ? 'bg-indigo-50 font-semibold text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-200'
                    : 'text-zinc-600 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                  <span className="truncate">{f.path}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(f.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-600"
                  title="Delete File"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Code Viewer / Editor */}
        <div className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
          {selectedFile ? (
            <>
              {/* Action bar */}
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-indigo-500" />
                  <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {selectedFile}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    title="Download file"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleSaveFile}
                    disabled={isSaving}
                    className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-300" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="flex-1 p-3">
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="h-full w-full resize-none rounded-lg border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800"
                  spellCheck={false}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-zinc-400">
              <FolderTree className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-2 text-xs">Select a file from the left to view or edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
