import { MasterMetaAgent } from './orchestration/master-meta-agent.ts';
import { EngineeringDepartmentEngineer } from './engineering/engineering-department-engineer.ts';
import { RepositoryEngineer } from './engineering/repository-engineer.ts';
import { CoreEngineer } from './engineering/core-engineer.ts';
import { TesterEngineer } from './engineering/tester-engineer.ts';
import { NegotiationEngineer } from './engineering/negotiation-engineer.ts';
import { InfrastructureEngineer } from './engineering/infrastructure-engineer.ts';
import { SafetyEngineer } from './engineering/safety-engineer.ts';
import { EvaluationEngineer } from './engineering/evaluation-engineer.ts';

export const departments = {
  engineering: {
    name: 'Engineering',
    lead: new EngineeringDepartmentEngineer(),
    agents: [
      new RepositoryEngineer(),
      new CoreEngineer(),
      new TesterEngineer(),
      new NegotiationEngineer(),
      new InfrastructureEngineer(),
      new SafetyEngineer(),
      new EvaluationEngineer(),
    ],
  },
  orchestration: {
    name: 'Orchestration',
    agents: [
      new MasterMetaAgent(),
    ],
  },
};
