export interface PromptProcessor {
  name: string;
  process: (input: string, context: Record<string, any>) => Promise<string>;
}

export class MastraProcessorPipeline {
  private processors: PromptProcessor[] = [];

  public use(processor: PromptProcessor): this {
    this.processors.push(processor);
    return this;
  }

  public async run(input: string, context: Record<string, any> = {}): Promise<string> {
    let current = input;
    for (const p of this.processors) {
      try {
        current = await p.process(current, context);
      } catch (err) {
        console.error(`[ProcessorPipeline] Error in ${p.name}:`, err);
      }
    }
    return current;
  }
}

export const defaultProcessorPipeline = new MastraProcessorPipeline();
