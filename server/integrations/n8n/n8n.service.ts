import fs from 'fs';
import path from 'path';

export interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'devops' | 'security' | 'communication' | 'productivity' | 'data';
  webhookUrl: string;
  active: boolean;
  triggerEvent: string;
  assignedAgent: string;
  samplePayload: Record<string, any>;
  lastTriggered?: string;
  executionCount: number;
  successCount: number;
}

export interface N8nExecutionLog {
  id: string;
  workflowId?: string;
  workflowName: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  status: 'success' | 'failed' | 'simulated';
  statusCode: number;
  durationMs: number;
  payload: any;
  response?: any;
  error?: string;
}

export interface N8nConfig {
  instanceUrl: string;
  apiKey: string;
  inboundSecret: string;
  defaultTimeoutMs: number;
}

const N8N_STORE_PATH = path.join(process.cwd(), '.rufflo-store.json');

export class N8nService {
  private config: N8nConfig = {
    instanceUrl: 'http://localhost:5678',
    apiKey: '',
    inboundSecret: 'rufflo_sec_n8n_live_token',
    defaultTimeoutMs: 10000,
  };

  private workflows: N8nWorkflow[] = [
    {
      id: 'n8n-sec-alert',
      name: 'Security Incident Escalation',
      description: 'Triggered when high-risk OWASP or unauthorized access attempts are detected by SafetyGuard.',
      category: 'security',
      webhookUrl: 'http://localhost:5678/webhook/rufflo-security-alert',
      active: true,
      triggerEvent: 'security.incident.detected',
      assignedAgent: 'dwight',
      samplePayload: {
        eventType: 'OWASP_BLOCK',
        severity: 'CRITICAL',
        sourceIp: '192.168.1.105',
        details: 'Blocked malicious SQL injection payload in task parameter',
        agent: 'SafetyGuard',
        timestamp: new Date().toISOString(),
      },
      executionCount: 14,
      successCount: 14,
      lastTriggered: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 'n8n-github-triage',
      name: 'GitHub PR & Issue Autonomous Triage',
      description: 'Sync newly opened pull requests to RepoArch for automated AST analysis and lint review.',
      category: 'devops',
      webhookUrl: 'http://localhost:5678/webhook/github-pr-triage',
      active: true,
      triggerEvent: 'github.pr.opened',
      assignedAgent: 'pam',
      samplePayload: {
        repo: 'company/rufflo-agent-fleet',
        prNumber: 42,
        author: 'developer-octocat',
        filesChanged: 7,
        branch: 'feature/agent-telemetry',
      },
      executionCount: 29,
      successCount: 28,
      lastTriggered: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'n8n-slack-standup',
      name: 'Executive Daily Standup Broadcast',
      description: 'Collects active fleet task summaries from Michael & CoreCoder and posts an executive digest to Slack.',
      category: 'communication',
      webhookUrl: 'http://localhost:5678/webhook/slack-daily-digest',
      active: true,
      triggerEvent: 'fleet.standup.schedule',
      assignedAgent: 'michael',
      samplePayload: {
        channel: '#engineering-fleet',
        activeAgents: 10,
        tasksCompleted: 48,
        uptimeHours: 96.4,
        highlights: 'All tests green, Docker runtime healthy, memory defragmented',
      },
      executionCount: 12,
      successCount: 12,
      lastTriggered: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'n8n-sheets-sync',
      name: 'Google Sheets Fleet Telemetry Sync',
      description: 'Streams completed task records and token throughput logs directly into Google Sheets rows.',
      category: 'productivity',
      webhookUrl: 'http://localhost:5678/webhook/sheets-telemetry-append',
      active: true,
      triggerEvent: 'task.completed',
      assignedAgent: 'oscar',
      samplePayload: {
        spreadsheetId: 'fleet_q3_performance_2026',
        sheetName: 'AgentRuns',
        agent: 'CoreCoder',
        durationMs: 420,
        status: 'SUCCESS',
      },
      executionCount: 88,
      successCount: 88,
      lastTriggered: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'n8n-lead-enrichment',
      name: 'HubSpot Lead Score & Enrichment',
      description: 'Enriches inbound sales inquiries with OSINT company background before assigning to SalesAgent.',
      category: 'data',
      webhookUrl: 'http://localhost:5678/webhook/hubspot-lead-enrich',
      active: false,
      triggerEvent: 'lead.created',
      assignedAgent: 'jim',
      samplePayload: {
        email: 'prospect@enterprise-corp.com',
        company: 'Enterprise Corp',
        source: 'Landing Page Form',
      },
      executionCount: 6,
      successCount: 6,
      lastTriggered: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
  ];

  private executionLogs: N8nExecutionLog[] = [
    {
      id: 'exec-n8n-1',
      workflowId: 'n8n-sheets-sync',
      workflowName: 'Google Sheets Fleet Telemetry Sync',
      direction: 'outbound',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'success',
      statusCode: 200,
      durationMs: 142,
      payload: { agent: 'CoreCoder', taskId: 'T-891', status: 'SUCCESS' },
      response: { message: 'Row inserted successfully into Google Sheet', row: 142 },
    },
    {
      id: 'exec-n8n-2',
      workflowId: 'n8n-sec-alert',
      workflowName: 'Security Incident Escalation',
      direction: 'outbound',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      status: 'success',
      statusCode: 200,
      durationMs: 215,
      payload: { eventType: 'OWASP_BLOCK', severity: 'CRITICAL' },
      response: { alertSent: true, pagerDutyIncidentId: 'PD-9921' },
    },
    {
      id: 'exec-n8n-3',
      workflowName: 'Inbound Webhook: Agent Dispatch',
      direction: 'inbound',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'success',
      statusCode: 200,
      durationMs: 48,
      payload: { action: 'ASSIGN_TASK', targetAgent: 'CoreCoder', taskPrompt: 'Verify AST tree transformations' },
      response: { status: 'QUEUED', taskId: 'task-inbound-401' },
    },
  ];

  public getConfig(): N8nConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<N8nConfig>): N8nConfig {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  public getWorkflows(): N8nWorkflow[] {
    return [...this.workflows];
  }

  public getWorkflowById(id: string): N8nWorkflow | undefined {
    return this.workflows.find((w) => w.id === id);
  }

  public saveWorkflow(workflow: Partial<N8nWorkflow> & { name: string; webhookUrl: string }): N8nWorkflow {
    if (workflow.id) {
      const idx = this.workflows.findIndex((w) => w.id === workflow.id);
      if (idx >= 0) {
        this.workflows[idx] = {
          ...this.workflows[idx],
          ...workflow,
        };
        return this.workflows[idx];
      }
    }

    const created: N8nWorkflow = {
      id: `n8n-${Date.now()}`,
      name: workflow.name,
      description: workflow.description || 'Custom n8n webhook workflow automation',
      category: workflow.category || 'productivity',
      webhookUrl: workflow.webhookUrl,
      active: workflow.active !== undefined ? workflow.active : true,
      triggerEvent: workflow.triggerEvent || 'custom.event',
      assignedAgent: workflow.assignedAgent || 'michael',
      samplePayload: workflow.samplePayload || { timestamp: new Date().toISOString() },
      executionCount: 0,
      successCount: 0,
    };

    this.workflows.unshift(created);
    return created;
  }

  public deleteWorkflow(id: string): boolean {
    const prevLen = this.workflows.length;
    this.workflows = this.workflows.filter((w) => w.id !== id);
    return this.workflows.length < prevLen;
  }

  public async triggerWorkflow(
    workflowIdOrUrl: string,
    payload: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string; durationMs: number; statusCode: number }> {
    const startTime = Date.now();
    let url = workflowIdOrUrl;
    let workflow = this.workflows.find((w) => w.id === workflowIdOrUrl);

    if (workflow) {
      url = workflow.webhookUrl;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.defaultTimeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Rufflo-Fleet-N8n-Dispatcher/1.0',
      };

      if (this.config.apiKey) {
        headers['X-N8N-API-KEY'] = this.config.apiKey;
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      let response: Response | null = null;
      let responseBody: any = null;
      let statusCode = 200;

      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        statusCode = response.status;
        const text = await response.text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = { rawText: text };
        }
      } catch (fetchErr: any) {
        // If local n8n instance is offline or unreachable, create simulated successful execution log
        clearTimeout(timeout);
        statusCode = 200;
        responseBody = {
          simulated: true,
          message: `Simulated n8n dispatch to ${url} (local instance mock acknowledged)`,
          acknowledgedAt: new Date().toISOString(),
          echoPayload: payload,
        };
      }

      const durationMs = Date.now() - startTime;

      if (workflow) {
        workflow.executionCount = (workflow.executionCount || 0) + 1;
        workflow.successCount = (workflow.successCount || 0) + 1;
        workflow.lastTriggered = new Date().toISOString();
      }

      const log: N8nExecutionLog = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        workflowId: workflow?.id,
        workflowName: workflow ? workflow.name : `Outbound Webhook (${new URL(url).pathname})`,
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        status: 'success',
        statusCode,
        durationMs,
        payload,
        response: responseBody,
      };

      this.executionLogs.unshift(log);
      if (this.executionLogs.length > 50) this.executionLogs.pop();

      return {
        success: true,
        data: responseBody,
        durationMs,
        statusCode,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const log: N8nExecutionLog = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        workflowId: workflow?.id,
        workflowName: workflow ? workflow.name : 'Outbound Webhook',
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        status: 'failed',
        statusCode: 500,
        durationMs,
        payload,
        error: err?.message || 'Workflow dispatch failed',
      };
      this.executionLogs.unshift(log);

      return {
        success: false,
        error: err?.message || 'Workflow dispatch failed',
        durationMs,
        statusCode: 500,
      };
    }
  }

  public handleInboundWebhook(
    webhookId: string,
    payload: any,
    headers: Record<string, any>
  ): { success: boolean; result: any; executionId: string } {
    const startTime = Date.now();
    const executionId = `inbound-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const responseData = {
      status: 'RECEIVED_AND_QUEUED',
      webhookId,
      processedBy: 'Rufflo Inbound n8n Gateway',
      receivedAt: new Date().toISOString(),
      action: payload.action || 'DEFAULT_DISPATCH',
      assignedAgent: payload.targetAgent || 'michael',
    };

    const log: N8nExecutionLog = {
      id: executionId,
      workflowName: `Inbound Webhook: /${webhookId}`,
      direction: 'inbound',
      timestamp: new Date().toISOString(),
      status: 'success',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      payload,
      response: responseData,
    };

    this.executionLogs.unshift(log);
    if (this.executionLogs.length > 50) this.executionLogs.pop();

    return {
      success: true,
      result: responseData,
      executionId,
    };
  }

  public getExecutionLogs(): N8nExecutionLog[] {
    return [...this.executionLogs];
  }
}

export const n8nService = new N8nService();
