export interface PlanStep {
  id: string;
  index: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  expectedOutcome?: string;
  toolCalls?: ToolCallRecord[];
  evidence?: string[];
  durationMs?: number;
}

export interface ToolCallRecord {
  id: string;
  tool: string;
  args: Record<string, any>;
  timestamp: number;
  result?: {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    data?: any;
    error?: string;
    durationMs?: number;
  };
  status: 'executing' | 'success' | 'error';
}

export interface VerificationAudit {
  confidenceScore: number;
  groundingStatus: 'fully_grounded' | 'partially_grounded' | 'unverified';
  verifiedClaims: string[];
  unverifiedClaims: string[];
  evidenceCount: number;
  safetyCheck: boolean;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  pipelineState?: {
    queuePosition?: number;
    status: 'idle' | 'queued' | 'planning' | 'working' | 'verifying' | 'completed' | 'error';
    intent?: {
      category: string;
      complexity: 'simple' | 'moderate' | 'complex';
      requiresTools: boolean;
      estimatedSteps: number;
    };
    plan?: PlanStep[];
    currentStepIndex?: number;
    activeTool?: string;
    activeToolArgs?: Record<string, any>;
    allToolCalls?: ToolCallRecord[];
    evidenceLog?: string[];
    verification?: VerificationAudit;
    totalDurationMs?: number;
  };
}

export interface EngineConfig {
  provider: 'gemini' | 'local_llama' | 'custom_openai';
  model: string;
  endpointUrl: string;
  maxPlanSteps: number;
  maxToolItersPerStep: number;
  temperature: number;
  verifierStrictness: 'strict' | 'balanced' | 'lenient';
  enableSelfCorrection: boolean;
  enableSafetyGuardrails: boolean;
}

export interface WorkspaceFile {
  path: string;
  content: string;
  size: number;
  lastModified: number;
  language: string;
}
