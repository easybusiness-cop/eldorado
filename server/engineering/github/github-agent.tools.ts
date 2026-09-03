import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { RepositoryService } from './repository.service.ts';
import { BranchService } from './branch.service.ts';
import { FileService } from './file.service.ts';
import { CommitService } from './commit.service.ts';
import { PullRequestService } from './pull-request.service.ts';
import { WorkflowService } from './workflow.service.ts';

export const inspectRepoTool = createTool({
  id: 'GITHUB_INSPECT_REPOSITORY',
  description: 'Inspect metadata, stars, default branch, and issue counts of a given GitHub repository.',
  inputSchema: z.object({
    repo: z.string().describe('Repository path in format "owner/repo"'),
  }),
  execute: async ({ repo }) => {
    return await RepositoryService.inspectRepository(repo);
  },
});

export const createBranchTool = createTool({
  id: 'GITHUB_CREATE_BRANCH',
  description: 'Create a new development branch in the target repository.',
  inputSchema: z.object({
    repo: z.string().describe('Repository path in format "owner/repo"'),
    branchName: z.string().describe('The name of the branch to create'),
  }),
  execute: async ({ repo, branchName }) => {
    return await BranchService.createBranch(repo, branchName);
  },
});

export const inspectFileTool = createTool({
  id: 'GITHUB_INSPECT_FILE',
  description: 'Read and retrieve contents of a file in the repository path.',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the target file in the repository'),
  }),
  execute: async ({ filePath }) => {
    const content = await FileService.inspectFile(filePath);
    return { content };
  },
});

export const editFileTool = createTool({
  id: 'GITHUB_MODIFY_FILE',
  description: 'Write or modify contents of a file in the repository path.',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the target file in the repository'),
    content: z.string().describe('Complete file contents to write'),
  }),
  execute: async ({ filePath, content }) => {
    const success = await FileService.modifyFile(filePath, content);
    return { success };
  },
});

export const createCommitTool = createTool({
  id: 'GITHUB_CREATE_COMMIT',
  description: 'Commit modified files to a specific branch in the repository.',
  inputSchema: z.object({
    repo: z.string().describe('Repository path in format "owner/repo"'),
    branch: z.string().describe('Branch name'),
    message: z.string().describe('Commit message'),
    files: z.array(z.object({
      path: z.string(),
      content: z.string(),
    })).describe('List of files with their path and new contents'),
  }),
  execute: async ({ repo, branch, message, files }) => {
    return await CommitService.createCommit(repo, branch, message, files);
  },
});

export const createPullRequestTool = createTool({
  id: 'GITHUB_CREATE_PULL_REQUEST',
  description: 'Create a pull request with head branch and base target branch.',
  inputSchema: z.object({
    repo: z.string().describe('Repository path in format "owner/repo"'),
    title: z.string(),
    head: z.string().describe('Source branch name'),
    base: z.string().describe('Target merge branch name'),
    body: z.string(),
  }),
  execute: async (input) => {
    return await PullRequestService.createPR(input.repo, input);
  },
});

export const monitorWorkflowTool = createTool({
  id: 'GITHUB_MONITOR_WORKFLOW',
  description: 'Track CI/CD status and check for job build failures.',
  inputSchema: z.object({
    repo: z.string().describe('Repository path in format "owner/repo"'),
    runId: z.number().describe('Run ID to inspect'),
  }),
  execute: async ({ repo, runId }) => {
    return await WorkflowService.monitorWorkflow(repo, runId);
  },
});
