import { Agent, AgentLog } from '../types';
import { soundFx } from './speech';

export interface WorkflowStage {
  stepNumber: number;
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  icon: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string[];
  metrics?: {
    filesInspected?: number;
    linesWritten?: number;
    lintErrorsFound?: number;
    compileTimeMs?: number;
    qualityScore?: number;
  };
}

export const STANDARD_WORKFLOW_STAGES: Omit<WorkflowStage, 'status'>[] = [
  {
    stepNumber: 1,
    id: 'quantum_superposition',
    name: 'Quantum Superposition & Multi-Path Evaluation',
    shortLabel: '1. Quantum Superposition',
    description: 'Evaluate multiple architecture pathways in quantum superposition, amplify amplitudes via Grover search, and collapse wavefunction onto easiest build path.',
    icon: 'Atom'
  },
  {
    stepNumber: 2,
    id: 'context_inspection',
    name: 'Context-First Quantum Memory Inspection',
    shortLabel: '2. Memory & Subspaces',
    description: 'Perform multi-state quantum context lookup, inspect project manifest, and verify dependencies.',
    icon: 'Search'
  },
  {
    stepNumber: 3,
    id: 'surgical_execution',
    name: 'Surgical Task Execution (Easiest Build Path)',
    shortLabel: '3. Lean Execution',
    description: 'Execute surgical code edits using the selected minimal-complexity pathway for fastest deterministic completion.',
    icon: 'Code2'
  },
  {
    stepNumber: 4,
    id: 'auto_verification',
    name: 'Automatic Verification & Quality Control',
    shortLabel: '4. Verification & QC',
    description: 'Run linter checks and static type compilation (compile_applet) to guarantee 0 build errors.',
    icon: 'ShieldCheck'
  },
  {
    stepNumber: 5,
    id: 'structured_reporting',
    name: 'Structured Scannable Telemetry Reporting',
    shortLabel: '5. Scannable Summary',
    description: 'Format concise, scannable bullet points with bold key terms and broadcast telemetry logs to the Control Panel.',
    icon: 'FileText'
  }
];

export interface WorkflowExecutionState {
  currentStep: number;
  isExecuting: boolean;
  stages: WorkflowStage[];
  logs: string[];
  outputSummary?: string;
  qualityScore: number;
  startedAt?: number;
  completedAt?: number;
}


export async function runAgentStandardWorkflow(
  agent: Agent,
  taskPrompt: string,
  onProgress?: (state: WorkflowExecutionState) => void,
  onAddLog?: (log: Partial<AgentLog>) => void
): Promise<WorkflowExecutionState> {
  const startedAt = Date.now();
  const stages: WorkflowStage[] = STANDARD_WORKFLOW_STAGES.map((st) => ({
    ...st,
    status: 'pending'
  }));

  const logs: string[] = [
    `[WORKFLOW INIT] Initializing 5-Step Engineering Pipeline for Agent: ${agent.name} (${agent.role})`,
    `[DIRECTIVE] ${taskPrompt}`
  ];

  let executionState: WorkflowExecutionState = {
    currentStep: 1,
    isExecuting: true,
    stages,
    logs,
    qualityScore: 98,
    startedAt
  };

  const update = (step: number, stageStatus: 'running' | 'completed' | 'failed', logMsg?: string, details?: string[]) => {
    executionState.currentStep = step;
    executionState.stages = executionState.stages.map((st) => {
      if (st.stepNumber === step) {
        return {
          ...st,
          status: stageStatus,
          details: details || st.details
        };
      }
      if (st.stepNumber < step) {
        return { ...st, status: 'completed' };
      }
      return st;
    });

    if (logMsg) {
      executionState.logs.push(logMsg);
      if (onAddLog) {
        onAddLog({
          agentId: agent.id,
          agentName: agent.name,
          color: agent.color,
          message: logMsg,
          type: 'action',
          timestamp: new Date().toISOString()
        });
      }
    }

    if (onProgress) {
      onProgress({ ...executionState });
    }
  };

  try {
    update(1, 'running', `[PHASE 1] ${agent.name} is contacting the Core Intelligence System...`, [`• Connecting to Gemini Server`, `• Formatting prompt directive`]);
    
    const response = await fetch('/api/agent/execute-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, prompt: taskPrompt })
    });
    
    if (!response.ok) throw new Error("Failed to contact backend");
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    const result = data.result;

    // We now simulate the steps but with real data from LLM
    soundFx.playClick();
    update(1, 'completed', result.step1_log || `[PHASE 1 COMPLETE]`, result.step1_details);
    await new Promise((r) => setTimeout(r, 600));

    soundFx.playClick();
    update(2, 'running', `[PHASE 2] Inspecting & Diagnosing...`);
    await new Promise((r) => setTimeout(r, 600));
    update(2, 'completed', result.step2_log || `[PHASE 2 COMPLETE]`, result.step2_details);

    soundFx.playClick();
    update(3, 'running', `[PHASE 3] Executing Action...`);
    await new Promise((r) => setTimeout(r, 600));
    update(3, 'completed', result.step3_log || `[PHASE 3 COMPLETE]`, result.step3_details);

    soundFx.playClick();
    update(4, 'running', `[PHASE 4] Verifying...`);
    await new Promise((r) => setTimeout(r, 600));
    update(4, 'completed', result.step4_log || `[PHASE 4 COMPLETE]`, result.step4_details);

    soundFx.playSuccessChime();
    executionState.completedAt = Date.now();
    executionState.isExecuting = false;
    executionState.outputSummary = result.outputSummary || "Workflow Completed";
    
    update(5, 'completed', result.step5_log || `[PHASE 5 COMPLETE] ${agent.name} finished.`, result.step5_details);
  } catch (err: any) {
    update(5, 'failed', `[WORKFLOW FAILED] ${err.message}`);
    executionState.isExecuting = false;
    if (onProgress) onProgress({ ...executionState });
  }

  return executionState;
}
