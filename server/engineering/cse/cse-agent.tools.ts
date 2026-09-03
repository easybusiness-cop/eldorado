import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { CseCurriculumRunner } from './cse-curriculum-runner.ts';
import { AlgorithmBenchmarker } from './algorithm-benchmarker.ts';
import { CseSpecializationService } from './cse-specialization.service.ts';
import { generateInitialTrainingRecord } from '../../../src/constants/cseCurriculum.ts';

export const runCseChallengeTool = createTool({
  id: 'run_cse_challenge',
  description: 'Evaluate an agent against standard OSSU/freeCodeCamp Computer Science curriculum challenges',
  inputSchema: z.object({
    agentId: z.string().describe('ID of the agent taking the challenge'),
    targetLevel: z.number().min(1).max(9).describe('Target CSE Level (1 to 9)'),
  }),
  execute: async ({ agentId, targetLevel }) => {
    const record = generateInitialTrainingRecord('Software Engineer', 'eng');
    const result = await CseCurriculumRunner.assessAgent(agentId, targetLevel, record);
    return result;
  },
});

export const benchmarkAlgorithmTool = createTool({
  id: 'benchmark_algorithm',
  description: 'Benchmark a Computer Science data structure or algorithm for execution time, Big-O complexity, and memory efficiency',
  inputSchema: z.object({
    algorithm: z.enum([
      'quick_sort',
      'binary_search',
      'hash_map_lookup',
      'graph_bfs',
      'dynamic_programming_knapsack',
    ]),
    inputSize: z.number().default(10000),
  }),
  execute: async ({ algorithm, inputSize }) => {
    return AlgorithmBenchmarker.runBenchmark(algorithm, inputSize);
  },
});

export const inspectCseSpecializationTool = createTool({
  id: 'inspect_cse_specialization',
  description: 'Inspect requirements, permissions, and responsibilities for a CSE Specialization Track',
  inputSchema: z.object({
    specId: z.string().describe('Specialization ID (e.g. CSE-ARCHITECT, AI-ENGINEER, BACKEND-ENGINEER)'),
  }),
  execute: async ({ specId }) => {
    const spec = CseSpecializationService.getSpecialization(specId);
    if (!spec) {
      return { found: false, availableSpecs: CseSpecializationService.getAllSpecializations().map(s => s.id) };
    }
    return { found: true, specialization: spec };
  },
});
