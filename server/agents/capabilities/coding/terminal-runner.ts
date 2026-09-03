import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TerminalRunner {
  public static async runCommand(command: string, cwd = '.'): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (e: any) {
      return {
        success: false,
        stdout: e?.stdout || '',
        stderr: e?.stderr || e?.message || '',
        exitCode: e?.code || 1,
      };
    }
  }
}
