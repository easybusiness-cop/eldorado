import { TerminalRunner } from './terminal-runner.ts';

export class TestRunner {
  public static async verifyBuild(): Promise<{
    success: boolean;
    logs: string;
  }> {
    const res = await TerminalRunner.runCommand('npm run build');
    return {
      success: res.success,
      logs: res.stdout || res.stderr,
    };
  }

  public static async runTests(): Promise<{
    success: boolean;
    logs: string;
  }> {
    const res = await TerminalRunner.runCommand('npm run test');
    return {
      success: res.success,
      logs: res.stdout || res.stderr,
    };
  }
}
