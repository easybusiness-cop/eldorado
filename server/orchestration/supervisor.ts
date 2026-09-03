export class Supervisor {
  public static async verifyOutput(agentId: string, output: string): Promise<{ approved: boolean; feedback?: string }> {
    const outputLower = output.toLowerCase();
    
    // Core supervisor checks for low-effort outputs or generic empty templates
    if (outputLower.length < 20 || outputLower.includes('todo') || outputLower.includes('placeholder')) {
      return {
        approved: false,
        feedback: 'Quality verification failed: Output contains low-effort templates or placeholder text.',
      };
    }

    return { approved: true };
  }
}
