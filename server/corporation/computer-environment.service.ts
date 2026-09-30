import fs from 'node:fs';
import path from 'node:path';
import { corporationStore } from './corporation.store.ts';

export interface VirtualFileItem {
  name: string;
  type: 'file' | 'directory';
  sizeBytes: number;
  lastModified: string;
  securityClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
}

export interface TerminalExecutionResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  timestamp: string;
}

export class ComputerEnvironmentService {
  private static instance: ComputerEnvironmentService;
  private terminalLogs: Map<string, TerminalExecutionResult[]> = new Map();

  private constructor() {}

  public static getInstance(): ComputerEnvironmentService {
    if (!ComputerEnvironmentService.instance) {
      ComputerEnvironmentService.instance = new ComputerEnvironmentService();
    }
    return ComputerEnvironmentService.instance;
  }

  /**
   * Returns virtual workspace status, file tree, and processes for an employee
   */
  public getWorkspace(employeeId: string) {
    const employee = corporationStore.employees.get(employeeId);
    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const env = employee.computerEnvironment;
    const history = this.terminalLogs.get(employeeId) || [];

    // Deterministic realistic sandboxed file inventory for this employee's workspace
    const virtualFiles: VirtualFileItem[] = [
      { name: 'README.md', type: 'file', sizeBytes: 1024, lastModified: '2026-09-30T10:00:00Z', securityClassification: 'INTERNAL' },
      { name: 'workspace.config.json', type: 'file', sizeBytes: 512, lastModified: '2026-09-28T14:20:00Z', securityClassification: 'CONFIDENTIAL' },
      { name: 'src', type: 'directory', sizeBytes: 4096, lastModified: '2026-09-30T10:30:00Z', securityClassification: 'INTERNAL' },
      { name: 'audit_receipts', type: 'directory', sizeBytes: 2048, lastModified: '2026-09-30T09:15:00Z', securityClassification: 'TOP_SECRET' },
    ];

    return {
      employeeId: employee.id,
      employeeName: employee.displayName,
      roleTitle: employee.roleTitle,
      workspaceId: env.workspaceId,
      sandboxPath: env.sandboxPath,
      terminalSessionId: env.terminalSessionId,
      browserProfileId: env.browserProfileId,
      approvedTools: env.approvedTools,
      accounts: env.accounts,
      activeProcessesCount: env.activeProcessesCount,
      environmentVariables: env.environmentVariables,
      virtualFiles,
      terminalHistory: history.slice(-20),
    };
  }

  /**
   * Executes a command within the employee's sandboxed virtual environment
   */
  public async executeSandboxedCommand(employeeId: string, command: string): Promise<TerminalExecutionResult> {
    const employee = corporationStore.employees.get(employeeId);
    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const startTime = Date.now();
    const cleanCmd = command.trim();

    // Zero-Trust security checks: Block destructive commands
    const blockedKeywords = ['rm -rf /', ':(){ :|:& };:', 'mkfs', 'dd if=', 'shutdown', 'reboot'];
    if (blockedKeywords.some(b => cleanCmd.includes(b))) {
      const blockedResult: TerminalExecutionResult = {
        command: cleanCmd,
        exitCode: 126,
        stdout: '',
        stderr: 'SECURITY FAULT: Zero-Trust Perimeter blocked prohibited destructive operation.',
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      corporationStore.recordAudit({
        who: employee.displayName,
        what: `BLOCKED MALICIOUS COMMAND: "${cleanCmd}"`,
        why: 'Prohibited destructive keyword detected',
        withWhichTool: 'computer-environment-sandbox',
        usingWhichAuthorization: `clearance:${employee.clearanceLevel}`,
        withWhichInput: { command: cleanCmd },
        whatResulted: { blocked: true },
        riskClassification: 'CRITICAL',
        status: 'blocked',
      });

      return blockedResult;
    }

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    // Simulated / Safe terminal executions
    if (cleanCmd.startsWith('ls') || cleanCmd === 'dir') {
      stdout = `total 32
drwxr-xr-x 2 ${employee.handle} staff  4096 Sep 30 10:30 src
drwxr-xr-x 2 ${employee.handle} staff  2048 Sep 30 09:15 audit_receipts
-rw-r--r-- 1 ${employee.handle} staff  1024 Sep 30 10:00 README.md
-rw-r--r-- 1 ${employee.handle} staff   512 Sep 30 14:20 workspace.config.json`;
    } else if (cleanCmd.startsWith('git status')) {
      stdout = `On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   server/corporation/types.ts
	new file:   server/corporation/workforce.engine.ts

nothing to commit, working tree clean`;
    } else if (cleanCmd.startsWith('whoami')) {
      stdout = `${employee.handle} (UID: ${employee.id}, Clearance: Level ${employee.clearanceLevel})`;
    } else if (cleanCmd.startsWith('env')) {
      stdout = Object.entries(employee.computerEnvironment.environmentVariables)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
    } else if (cleanCmd.startsWith('ps')) {
      stdout = `  PID TTY          TIME CMD
 1042 pts/1    00:00:01 node-worker
 1043 pts/1    00:00:00 sandbox-daemon
 1045 pts/1    00:00:00 telemetry-probe`;
    } else {
      stdout = `[Sandbox: ${employee.computerEnvironment.sandboxPath}] Executed: ${cleanCmd}\nOperation status: SUCCESS (0 faults detected in sandbox container)`;
    }

    const execResult: TerminalExecutionResult = {
      command: cleanCmd,
      exitCode,
      stdout,
      stderr,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    let log = this.terminalLogs.get(employeeId);
    if (!log) {
      log = [];
      this.terminalLogs.set(employeeId, log);
    }
    log.push(execResult);
    if (log.length > 50) log.shift();

    corporationStore.recordAudit({
      who: employee.displayName,
      what: `Terminal Execution: "${cleanCmd}"`,
      why: 'Employee terminal sandbox session',
      withWhichTool: 'virtual-terminal',
      usingWhichAuthorization: `clearance:${employee.clearanceLevel}`,
      withWhichInput: { command: cleanCmd },
      whatResulted: { exitCode, stdoutSample: stdout.substring(0, 100) },
      riskClassification: 'LOW',
      status: 'allowed',
    });

    return execResult;
  }
}

export const computerEnvironment = ComputerEnvironmentService.getInstance();
