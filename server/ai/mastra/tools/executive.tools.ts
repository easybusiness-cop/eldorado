import { randomUUID } from 'node:crypto';

import type { MastraToolDefinition } from './index.ts';

import { ObjectiveManager } from '../../../objectives/objective.manager.ts';
import { departmentRegistry } from '../../../departments/registry.ts';
import { Dispatcher } from '../../../orchestration/dispatcher.ts';
import { CompanyMemoryService } from '../../../memory/company-memory.ts';

import { ObservabilityCollector } from '../../../../apps/control-plane/observability/metrics.ts';
import { EnterpriseEventBus } from '../../../../apps/control-plane/event-bus/event.bus.ts';
import {
  ApprovalService,
} from '../../../../apps/control-plane/approvals/approval.service.ts';

import { mastraAgentRegistry } from '../agents/index.ts';

import type { DepartmentId } from '../../../../shared/types/index.ts';
import type { RiskLevel } from '../../../../apps/control-plane/integrations/registry/integration.types.ts';

/**
 * Executive Department Tooling
 *
 * These tools are intentionally deterministic.
 *
 * Agents receive capabilities through code.
 * They cannot add tools to themselves.
 * They cannot modify their own permissions.
 * They cannot bypass the platform's approval/risk controls.
 */

const getObjectiveManager = () => ObjectiveManager.getInstance();

const EXECUTIVE_AGENT_IDS = new Set([
  'michael',
  'chief-of-staff',
  'strategy-director',
  'operations-director',
  'executive-analyst',
]);

function assertString(
  value: unknown,
  field: string,
  maxLength = 4000,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  const result = value.trim();

  if (result.length > maxLength) {
    throw new Error(`${field} exceeds the maximum length of ${maxLength}.`);
  }

  return result;
}

function assertPositiveNumber(
  value: unknown,
  field: string,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(`${field} must be a positive number.`);
  }

  return value;
}

function assertDepartmentId(value: unknown): DepartmentId {
  const departmentId = assertString(value, 'departmentId') as DepartmentId;

  const department = departmentRegistry.getDepartment(departmentId);

  if (!department) {
    throw new Error(`Unknown department: ${departmentId}`);
  }

  return departmentId;
}

function assertExecutiveAgent(agentId: string): void {
  if (!EXECUTIVE_AGENT_IDS.has(agentId)) {
    throw new Error(
      `Agent "${agentId}" is not authorized to use Executive Department tools.`,
    );
  }
}

function assertRegisteredAgent(agentId: unknown): string {
  const id = assertString(agentId, 'agentId');

  if (!mastraAgentRegistry.getAgent(id)) {
    throw new Error(`Agent "${id}" is not registered.`);
  }

  return id;
}

/**
 * Verify the agent has the permission declared by the tool.
 *
 * This is intentionally defensive because the current MastraToolRegistry
 * stores requiredPermission but the gateway does not yet enforce it
 * consistently for every built-in tool.
 */
function requirePermission(
  agentId: string,
  permission: string,
): void {
  const agent = mastraAgentRegistry.getAgent(agentId);

  if (!agent) {
    throw new Error(`Agent "${agentId}" is not registered.`);
  }

  if (!agent.hasPermission(permission)) {
    throw new Error(
      `Agent "${agentId}" does not have required permission "${permission}".`,
    );
  }
}

/**
 * Verify an Executive Department agent before executing any executive tool.
 */
function authorizeExecutiveTool(
  agentId: string,
  permission: string,
): void {
  assertExecutiveAgent(agentId);
  requirePermission(agentId, permission);
}

/**
 * Convert a department registry object into a safe response.
 *
 * We deliberately do not expose internal implementation details.
 */
function serializeDepartment(department: ReturnType<typeof departmentRegistry.getDepartment>) {
  if (!department) {
    return null;
  }

  return {
    id: department.id,
    name: department.name,
    managerId: department.managerId,
    agentIds: [...department.agentIds],
    budget: department.budget,
    activeProjects: [...department.activeProjects],
    pipelines: [...department.pipelines],
    policies: [...department.policies],
    knowledgeBaseSummary: department.knowledgeBaseSummary,
  };
}

/* -------------------------------------------------------------------------- */
/* 1. COMPANY MEMORY                                                         */
/* -------------------------------------------------------------------------- */

export const companyMemoryReadTool: MastraToolDefinition = {
  name: 'company_memory_read',

  description:
    'Search company-level memory for facts, decisions, policies, previous events, and organizational knowledge.',

  category: 'database',

  requiresAuth: true,

  requiredPermission: 'executive:read',

  execute: async (params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'executive:read',
    );

    const query = assertString(params?.query, 'query', 2000);

    const limit =
      typeof params?.limit === 'number'
        ? Math.min(Math.max(Math.floor(params.limit), 1), 20)
        : 5;

    const results =
      CompanyMemoryService.quantumSearch(query, limit);

    return {
      success: true,
      query,
      count: results?.memories?.length || 0,
      source: 'company_memory',
      results,
    };
  },
};

/* -------------------------------------------------------------------------- */
/* 2. EXECUTIVE METRICS                                                      */
/* -------------------------------------------------------------------------- */

export const executiveMetricsTool: MastraToolDefinition = {
  name: 'executive_metrics',

  description:
    'Read measured Rufflo execution and approval metrics for executive decision support.',

  category: 'system',

  requiresAuth: true,

  requiredPermission: 'metrics:read',

  execute: async (_params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'metrics:read',
    );

    const summary =
      ObservabilityCollector.getMetricsSummary();

    return {
      success: true,

      source: 'runtime_observability',

      measuredAt: new Date().toISOString(),

      metrics: {
        totalExecutions: summary.totalExecutions,
        successRate: summary.successRate,
        averageLatencyMs: summary.averageLatencyMs,
        totalSpendsDollars: summary.totalSpendsDollars,
        averageApprovalLatencyMs:
          summary.avgApprovalLatencyMs,
        breakdown: summary.breakdown,
      },

      dataIntegrity: {
        simulated: false,
        source: 'ObservabilityCollector',
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/* 3. DEPARTMENT STATUS                                                       */
/* -------------------------------------------------------------------------- */

export const departmentStatusTool: MastraToolDefinition = {
  name: 'department_status',

  description:
    'Inspect current organizational departments, managers, agents, budgets, projects, pipelines, and policies.',

  category: 'system',

  requiresAuth: true,

  requiredPermission: 'department:read',

  execute: async (params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'department:read',
    );

    if (params?.departmentId) {
      const departmentId =
        assertDepartmentId(params.departmentId);

      const department =
        departmentRegistry.getDepartment(departmentId);

      return {
        success: true,
        department: serializeDepartment(department),
      };
    }

    const departments =
      departmentRegistry
        .getAllDepartments()
        .map(serializeDepartment)
        .filter(Boolean);

    return {
      success: true,
      count: departments.length,
      departments,
    };
  },
};

/* -------------------------------------------------------------------------- */
/* 4. OBJECTIVE MANAGER                                                       */
/* -------------------------------------------------------------------------- */

export const objectiveManagerTool: MastraToolDefinition = {
  name: 'objective_manager',

  description:
    'Create, inspect, or list company objectives. Objective creation uses Rufflo ObjectiveManager and persists through its configured store.',

  category: 'system',

  requiresAuth: true,

  requiredPermission: 'objective:read',

  execute: async (params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'objective:read',
    );

    const action =
      typeof params?.action === 'string'
        ? params.action.trim().toLowerCase()
        : 'list';

    switch (action) {
      case 'list': {
        const limit =
          typeof params?.limit === 'number'
            ? Math.min(
                Math.max(Math.floor(params.limit), 1),
                100,
              )
            : 50;

        const objectives =
          await getObjectiveManager().listRecent(limit);

        return {
          success: true,
          action,
          count: objectives.length,
          objectives,
        };
      }

      case 'get': {
        const id =
          assertString(params?.id, 'id', 200);

        const objective =
          await getObjectiveManager().getObjective(id);

        if (!objective) {
          return {
            success: false,
            error: {
              code: 'OBJECTIVE_NOT_FOUND',
              message: `Objective "${id}" was not found.`,
            },
          };
        }

        return {
          success: true,
          action,
          objective,
        };
      }

      case 'create': {
        /**
         * Creating objectives is a write operation.
         * The Executive agent must explicitly have objective:create.
         */
        requirePermission(
          context.agentId,
          'objective:create',
        );

        const goal =
          assertString(params?.goal, 'goal', 4000);

        const constraints =
          Array.isArray(params?.constraints)
            ? params.constraints
                .filter((item: unknown) => typeof item === 'string')
                .map((item: string) => item.trim())
                .filter(Boolean)
                .slice(0, 50)
            : [];

        const successCriteria =
          Array.isArray(params?.successCriteria)
            ? params.successCriteria
                .filter((item: unknown) => typeof item === 'string')
                .map((item: string) => item.trim())
                .filter(Boolean)
                .slice(0, 50)
            : [];

        if (successCriteria.length === 0) {
          throw new Error(
            'At least one success criterion is required.',
          );
        }

        const objective =
          await getObjectiveManager().createObjective({
            goal,
            constraints,
            successCriteria,

            maxRecoveryAttempts:
              typeof params?.maxRecoveryAttempts === 'number'
                ? Math.min(
                    Math.max(
                      Math.floor(params.maxRecoveryAttempts),
                      0,
                    ),
                    10,
                  )
                : 3,

            maxWallTimeMs:
              typeof params?.maxWallTimeMs === 'number'
                ? Math.min(
                    Math.max(
                      Math.floor(params.maxWallTimeMs),
                      10_000,
                    ),
                    3_600_000,
                  )
                : 300_000,
          });

        return {
          success: true,
          action,
          objective,
        };
      }

      case 'run': {
        /**
         * Running an objective causes execution.
         * We therefore require an explicit execution permission.
         */
        requirePermission(
          context.agentId,
          'objective:run',
        );

        const id =
          assertString(params?.id, 'id', 200);

        const objective =
          await getObjectiveManager().runObjective(id);

        return {
          success:
            objective.status !== 'FAILED' &&
            objective.status !== 'NEEDS_HUMAN',

          action,

          objective,
        };
      }

      default:
        throw new Error(
          `Unsupported objective action "${action}". Supported actions: list, get, create, run.`,
        );
    }
  },
};

/* -------------------------------------------------------------------------- */
/* 5. TASK DISPATCH                                                          */
/* -------------------------------------------------------------------------- */

export const taskDispatchTool: MastraToolDefinition = {
  name: 'task_dispatch',

  description:
    'Delegate a clearly defined task to a registered Rufflo agent and return the actual execution result.',

  category: 'system',

  requiresAuth: true,

  requiredPermission: 'executive:delegate',

  execute: async (params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'executive:delegate',
    );

    const targetAgentId =
      assertRegisteredAgent(params?.targetAgentId);

    const task =
      assertString(params?.task, 'task', 8000);

    if (targetAgentId === context.agentId) {
      throw new Error(
        'Executive delegation cannot target the same agent.',
      );
    }

    const targetAgent =
      mastraAgentRegistry.getAgent(targetAgentId);

    if (!targetAgent) {
      throw new Error(
        `Target agent "${targetAgentId}" was not found.`,
      );
    }

    /**
     * Prevent an Executive tool from silently escalating another
     * agent's authority.
     *
     * The target receives only its existing configured capabilities.
     */
    const result =
      await Dispatcher.dispatchToAgent(
        targetAgentId,
        task,
      );

    return {
      success: result.success,

      delegatedBy: context.agentId,

      target: {
        agentId: targetAgent.getId(),
        name: targetAgent.getName(),
        department: targetAgent.getDepartment(),
        role: targetAgent.config.role,
      },

      task,

      result: {
        output: result.output,
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/* 6. CORPORATE ANNOUNCEMENTS                                                 */
/* -------------------------------------------------------------------------- */

export const corporateAnnouncementsTool: MastraToolDefinition = {
  name: 'corporate_announcements',

  description:
    'Publish an internal corporate announcement through Rufflo EventBus. This does not automatically publish externally to social media or email.',

  category: 'external',

  requiresAuth: true,

  requiredPermission: 'executive:announce',

  execute: async (params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'executive:announce',
    );

    const title =
      assertString(params?.title, 'title', 300);

    const message =
      assertString(params?.message, 'message', 8000);

    const departmentId =
      typeof params?.departmentId === 'string'
        ? assertDepartmentId(params.departmentId)
        : 'executive';

    const eventId =
      `evt-announcement-${randomUUID()}`;

    const correlationId =
      typeof params?.correlationId === 'string' &&
      params.correlationId.trim().length > 0
        ? params.correlationId.trim()
        : randomUUID();

    const published =
      await EnterpriseEventBus.publish({
        id: eventId,

        type: 'EXECUTIVE_ANNOUNCEMENT',

        source: 'executive.department',

        organizationId: context.orgId,

        actorId: context.agentId,

        agentId: context.agentId,

        payload: {
          title,
          message,
          departmentId,
          visibility: 'internal',
        },

        timestamp: new Date().toISOString(),

        correlationId,
      });

    return {
      success: published,

      announcement: {
        eventId,
        title,
        message,
        departmentId,
        visibility: 'internal',
        published,
      },

      externalPublication:
        'not_performed',
    };
  },
};

/* -------------------------------------------------------------------------- */
/* 7. BUDGET ALLOCATION                                                      */
/* -------------------------------------------------------------------------- */

export const budgetAllocationTool: MastraToolDefinition = {
  name: 'budget_allocation',

  description:
    'Allocate or remove budget from a department. Large changes require human approval and are not applied automatically.',

  category: 'database',

  requiresAuth: true,

  requiredPermission: 'executive:decide',

  execute: async (params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'executive:decide',
    );

    const departmentId =
      assertDepartmentId(params?.departmentId);

    const delta =
      Number(params?.delta);

    if (
      !Number.isFinite(delta) ||
      delta === 0
    ) {
      throw new Error(
        'delta must be a non-zero finite number.',
      );
    }

    const reason =
      assertString(params?.reason, 'reason', 2000);

    const department =
      departmentRegistry.getDepartment(departmentId);

    if (!department) {
      throw new Error(
        `Department "${departmentId}" does not exist.`,
      );
    }

    const resultingBudget =
      department.budget + delta;

    if (resultingBudget < 0) {
      throw new Error(
        `Allocation would make "${departmentId}" budget negative.`,
      );
    }

    /**
     * Budget changes above $50,000 require human approval.
     *
     * We do not mutate the budget before approval.
     */
    const requiresApproval =
      Math.abs(delta) > 50_000;

    if (requiresApproval) {
      const approval =
        ApprovalService.createRequest({
          executionId:
            `budget-${randomUUID()}`,

          requestedBy:
            context.agentId,

          agentId:
            context.agentId,

          action:
            'executive.budget_allocation',

          parameters: {
            departmentId,
            delta,
            currentBudget: department.budget,
            resultingBudget,
            reason,
          },

          riskLevel:
            (delta < 0 ? 'HIGH' : 'MEDIUM') as RiskLevel,

          reason:
            `Executive budget change of $${Math.abs(delta).toFixed(2)} for ${department.name}: ${reason}`,
        });

      return {
        success: false,

        status: 'AWAITING_APPROVAL',

        requiresApproval: true,

        approvalId: approval.id,

        department: {
          id: department.id,
          name: department.name,
          currentBudget: department.budget,
          requestedDelta: delta,
          resultingBudget,
        },
      };
    }

    /**
     * Small allocation is applied immediately.
     */
    departmentRegistry.updateBudget(
      departmentId,
      delta,
    );

    const updatedDepartment =
      departmentRegistry.getDepartment(departmentId);

    return {
      success: true,

      status: 'APPLIED',

      requiresApproval: false,

      department: {
        id: departmentId,
        name: updatedDepartment?.name,
        previousBudget: department.budget - delta,
        delta,
        newBudget: updatedDepartment?.budget,
      },

      reason,
    };
  },
};

/* -------------------------------------------------------------------------- */
/* 8. EVENT BUS                                                              */
/* -------------------------------------------------------------------------- */

export const eventBusTool: MastraToolDefinition = {
  name: 'event_bus',

  description:
    'Publish an internal structured event for cross-department coordination.',

  category: 'system',

  requiresAuth: true,

  requiredPermission: 'executive:coordinate',

  execute: async (params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'executive:coordinate',
    );

    const type =
      assertString(params?.type, 'type', 200);

    /**
     * Prevent an agent from forging arbitrary system identity fields.
     */
    const payload =
      params?.payload &&
      typeof params.payload === 'object' &&
      !Array.isArray(params.payload)
        ? params.payload
        : {};

    const eventId =
      `evt-executive-${randomUUID()}`;

    const correlationId =
      typeof params?.correlationId === 'string' &&
      params.correlationId.trim().length > 0
        ? params.correlationId.trim()
        : randomUUID();

    const published =
      await EnterpriseEventBus.publish({
        id: eventId,

        type,

        source: 'executive.department',

        organizationId:
          context.orgId,

        actorId:
          context.agentId,

        agentId:
          context.agentId,

        payload,

        timestamp:
          new Date().toISOString(),

        correlationId,
      });

    return {
      success: published,

      event: {
        id: eventId,
        type,
        organizationId: context.orgId,
        actorId: context.agentId,
        correlationId,
        published,
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/* 9. EXECUTIVE OVERRIDE                                                     */
/* -------------------------------------------------------------------------- */

export const executiveOverrideTool: MastraToolDefinition = {
  name: 'executive_override',

  description:
    'Record a high-level executive directive for human review and downstream coordination. This tool NEVER bypasses security, authorization, risk, or approval controls.',

  category: 'security',

  requiresAuth: true,

  requiredPermission: 'executive:decide',

  execute: async (params, context) => {
    authorizeExecutiveTool(
      context.agentId,
      'executive:decide',
    );

    const action =
      assertString(params?.action, 'action', 1000);

    const reason =
      assertString(params?.reason, 'reason', 4000);

    const target =
      params?.target
        ? assertString(params.target, 'target', 500)
        : undefined;

    /**
     * This is deliberately NOT an authorization bypass.
     *
     * It creates a decision record that downstream policy engines
     * can inspect. Existing security/approval controls remain active.
     */
    const approval =
      ApprovalService.createRequest({
        executionId:
          `executive-directive-${randomUUID()}`,

        requestedBy:
          context.agentId,

        agentId:
          context.agentId,

        action:
          `executive.directive.${action}`,

        parameters: {
          action,
          target,
          reason,
          directiveType: 'EXECUTIVE_DIRECTIVE',
          bypassSecurity: false,
        },

        riskLevel: 'HIGH',

        reason:
          `Executive directive requested by ${context.agentId}: ${reason}`,
      });

    return {
      success: false,

      status: 'AWAITING_APPROVAL',

      approvalRequired: true,

      approvalId: approval.id,

      directive: {
        action,
        target,
        reason,
        bypassSecurity: false,
      },

      message:
        'Directive recorded for approval. No security or authorization control was bypassed.',
    };
  },
};

/* -------------------------------------------------------------------------- */
/* EXPORT                                                                    */
/* -------------------------------------------------------------------------- */

export const executiveTools: MastraToolDefinition[] = [
  companyMemoryReadTool,
  executiveMetricsTool,
  departmentStatusTool,
  objectiveManagerTool,
  taskDispatchTool,
  corporateAnnouncementsTool,
  budgetAllocationTool,
  eventBusTool,
  executiveOverrideTool,
];

export default executiveTools;
