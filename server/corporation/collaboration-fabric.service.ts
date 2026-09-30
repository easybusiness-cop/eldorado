import { corporationStore } from './corporation.store.ts';

export type StructuredMessageType =
  | 'task_request'
  | 'information_request'
  | 'review_request'
  | 'approval_request'
  | 'escalation'
  | 'status_report'
  | 'research_finding'
  | 'strategic_recommendation'
  | 'work_handoff';

export type ChannelScope =
  | 'direct'
  | 'manager_report'
  | 'team_channel'
  | 'cross_department'
  | 'project_war_room'
  | 'executive_council';

export interface StructuredMessage {
  id: string;
  channelId: string;
  channelScope: ChannelScope;
  senderEmployeeId: string;
  senderName: string;
  senderRole: string;
  recipientId: string; // Employee ID, Team ID, or Department ID
  recipientName: string;
  messageType: StructuredMessageType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  body: string;
  structuredPayload?: Record<string, any>;
  requiresAction: boolean;
  actionStatus?: 'pending' | 'acknowledged' | 'approved' | 'rejected' | 'completed';
  timestamp: string;
}

export class CollaborationFabricService {
  private static instance: CollaborationFabricService;
  private messages: StructuredMessage[] = [];

  private constructor() {
    this.bootstrapSeedMessages();
  }

  public static getInstance(): CollaborationFabricService {
    if (!CollaborationFabricService.instance) {
      CollaborationFabricService.instance = new CollaborationFabricService();
    }
    return CollaborationFabricService.instance;
  }

  private bootstrapSeedMessages() {
    this.messages = [
      {
        id: 'msg-001',
        channelId: 'chan-exec-council',
        channelScope: 'executive_council',
        senderEmployeeId: 'emp-michael',
        senderName: 'Michael G. Scott',
        senderRole: 'CEO & Fleet Commander',
        recipientId: 'div-exec',
        recipientName: 'Executive Strategic Council',
        messageType: 'strategic_recommendation',
        priority: 'urgent',
        subject: 'Accelerate Autonomous Corporate Scaling into Q4',
        body: 'Executive intelligence confirms all 10 departments have zero backlogged critical security defects. Proceeding with autonomous project expansion.',
        requiresAction: true,
        actionStatus: 'approved',
        timestamp: '2026-09-30T10:15:00Z',
      },
      {
        id: 'msg-002',
        channelId: 'chan-eng-core',
        channelScope: 'team_channel',
        senderEmployeeId: 'emp-hank',
        senderName: 'Hank Tate',
        senderRole: 'VP of Software Engineering',
        recipientId: 'team-eng-core',
        recipientName: 'Core Systems & Compiler Team',
        messageType: 'work_handoff',
        priority: 'high',
        subject: 'Handoff: Node 22 Strip-Types Standardized Architecture',
        body: 'All enum definitions converted to const object literals. Compiler pipeline validated clean with zero runtime strip-types crashes.',
        structuredPayload: { commit: 'fix/node22-strip-types', testsPassed: true },
        requiresAction: false,
        actionStatus: 'completed',
        timestamp: '2026-09-30T10:20:00Z',
      },
      {
        id: 'msg-003',
        channelId: 'chan-sec-soc',
        channelScope: 'cross_department',
        senderEmployeeId: 'emp-dwight',
        senderName: 'Dwight K. Schrute',
        senderRole: 'CISO',
        recipientId: 'dept-eng',
        recipientName: 'Software Engineering Department',
        messageType: 'review_request',
        priority: 'high',
        subject: 'Security Audit Sign-off: ToolGateway Policy Gating',
        body: 'Completed automated fuzzing on ToolGateway input sanitization. 0 prompt injection escapes detected.',
        structuredPayload: { auditLedgerRef: 'audit-002', zeroTrustStatus: 'verified' },
        requiresAction: true,
        actionStatus: 'acknowledged',
        timestamp: '2026-09-30T10:35:00Z',
      },
      {
        id: 'msg-004',
        channelId: 'chan-intel-research',
        channelScope: 'manager_report',
        senderEmployeeId: 'emp-ryan',
        senderName: 'Ryan Howard',
        senderRole: 'Director of Corporate Intelligence',
        recipientId: 'emp-michael',
        recipientName: 'Michael G. Scott',
        messageType: 'research_finding',
        priority: 'medium',
        subject: 'Weekly Frontier AI Literature Discovery Digest',
        body: 'Ingested 12 papers on sub-quadratic attention and constrained JSON decoding algorithms. Benchmarks attached to Layered Corporate Knowledge.',
        requiresAction: false,
        actionStatus: 'acknowledged',
        timestamp: '2026-09-30T10:45:00Z',
      },
    ];
  }

  public getMessages(filter?: { channelScope?: ChannelScope; messageType?: StructuredMessageType }): StructuredMessage[] {
    let result = [...this.messages];
    if (filter?.channelScope) {
      result = result.filter(m => m.channelScope === filter.channelScope);
    }
    if (filter?.messageType) {
      result = result.filter(m => m.messageType === filter.messageType);
    }
    return result.reverse();
  }

  public sendMessage(params: Omit<StructuredMessage, 'id' | 'timestamp'>): StructuredMessage {
    const newMessage: StructuredMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...params,
    };

    this.messages.push(newMessage);

    // Audit log
    corporationStore.recordAudit({
      who: params.senderName,
      what: `Dispatched Typed Message: [${params.messageType.toUpperCase()}] "${params.subject}"`,
      why: `Communication to ${params.recipientName}`,
      withWhichTool: 'collaboration-fabric',
      usingWhichAuthorization: 'communication:send',
      withWhichInput: { subject: params.subject, type: params.messageType },
      whatResulted: { messageId: newMessage.id },
      riskClassification: 'LOW',
      status: 'allowed',
    });

    return newMessage;
  }

  public updateMessageStatus(messageId: string, status: StructuredMessage['actionStatus']): boolean {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) return false;
    msg.actionStatus = status;
    return true;
  }
}

export const collaborationFabric = CollaborationFabricService.getInstance();
