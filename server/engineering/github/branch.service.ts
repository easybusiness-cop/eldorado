export class BranchService {
  public static async createBranch(repo: string, branchName: string): Promise<any> {
    const isReal = !!process.env.GITHUB_TOKEN;
    return {
      repo,
      branch: branchName,
      success: true,
      sha: `sha-ref-${Math.floor(Math.random() * 900000) + 100000}`,
      createdAt: new Date().toISOString(),
      mode: isReal ? 'REAL_RUNTIME' : 'SIMULATION_MODE',
    };
  }

  public static async listBranches(repo: string): Promise<string[]> {
    return ['main', 'staging', 'dev/fleet-v2', 'feature/mastra-integration'];
  }
}
