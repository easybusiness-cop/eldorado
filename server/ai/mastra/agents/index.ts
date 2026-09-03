export * from './base.agent.ts';
export * from './engineering.agents.ts';
export * from './business.agents.ts';

import {
  CeoAgent,
  EngineeringManagerAgent,
  BackendEngineerAgent,
  FrontendEngineerAgent,
  DevOpsAgent,
  SecurityAgent,
} from './engineering.agents.ts';

import {
  ProductManagerAgent,
  MarketingManagerAgent,
  SocialMediaAgent,
  SalesAgent,
  CustomerSuccessAgent,
  HrAgent,
  FinanceAgent,
  LegalAgent,
  ResearchAgent,
  QaAgent,
} from './business.agents.ts';

import { BaseMastraAgent } from './base.agent.ts';

export class MastraAgentRegistry {
  private static instance: MastraAgentRegistry;
  private agents: Map<string, BaseMastraAgent> = new Map();

  private constructor() {
    this.registerAll();
  }

  public static getInstance(): MastraAgentRegistry {
    if (!MastraAgentRegistry.instance) {
      MastraAgentRegistry.instance = new MastraAgentRegistry();
    }
    return MastraAgentRegistry.instance;
  }

  private registerAll() {
    const defaultAgents: BaseMastraAgent[] = [
      new CeoAgent(),
      new EngineeringManagerAgent(),
      new BackendEngineerAgent(),
      new FrontendEngineerAgent(),
      new DevOpsAgent(),
      new SecurityAgent(),
      new ProductManagerAgent(),
      new MarketingManagerAgent(),
      new SocialMediaAgent(),
      new SalesAgent(),
      new CustomerSuccessAgent(),
      new HrAgent(),
      new FinanceAgent(),
      new LegalAgent(),
      new ResearchAgent(),
      new QaAgent(),
    ];

    for (const agent of defaultAgents) {
      this.agents.set(agent.getId(), agent);
    }
  }

  public getAgent(id: string): BaseMastraAgent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): BaseMastraAgent[] {
    return Array.from(this.agents.values());
  }

  public getAgentsByDepartment(department: string): BaseMastraAgent[] {
    return this.getAllAgents().filter(a => a.getDepartment() === department);
  }
}

export const mastraAgentRegistry = MastraAgentRegistry.getInstance();
