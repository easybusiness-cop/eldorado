import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export type CrashSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export interface CrashReport {
  id: string;
  timestamp: string;
  severity: CrashSeverity;
  title: string;
  errorMessage: string;
  stackTrace: string;
  componentName: string;
  agentId?: string;
  department?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
  aiRootCause?: {
    rootCause: string;
    suggestedFix: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

// Initialize Firebase App & Firestore
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Initial seeded telemetry crash reports for instant search & analytics
const SEEDED_CRASH_REPORTS: CrashReport[] = [
  {
    id: 'crash-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    severity: 'CRITICAL',
    title: 'AST Tokenizer Parser Failure',
    errorMessage: 'SyntaxError: Unexpected token < in AST parser pipeline at line 142',
    stackTrace: `SyntaxError: Unexpected token < in AST parser pipeline
    at parseNode (parser.ts:142:12)
    at parseStatement (parser.ts:88:5)
    at analyzeAST (tokenizer.ts:312:18)
    at Orchestrator.evalCode (AdministratorOrchestratorModal.tsx:902:14)`,
    componentName: 'AdministratorOrchestratorModal',
    agentId: 'dwight',
    department: 'Security & Compliance',
    userEmail: 'easybusiness.cop@gmail.com',
    aiRootCause: {
      rootCause: 'Orphaned JSX delimiter or unclosed tag during hot code AST transformation.',
      suggestedFix: 'Wrap raw JSX fragments inside React.Fragment or sanitize input strings prior to tokenization.',
      riskLevel: 'HIGH',
    },
  },
  {
    id: 'crash-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    severity: 'ERROR',
    title: 'Google Tasks OAuth Scope Mismatch',
    errorMessage: 'GAPIException: Insufficient OAuth 2.0 permission scopes for https://tasks.googleapis.com/tasks/v1',
    stackTrace: `GAPIException: Insufficient OAuth 2.0 permission scopes
    at googleTasksService.listTasks (googleTasksService.ts:48:11)
    at async GoogleTasksTab.fetchData (GoogleTasksTab.tsx:84:22)
    at async useEffect (GoogleTasksTab.tsx:32:5)`,
    componentName: 'GoogleTasksTab',
    agentId: 'pam',
    department: 'Operations & HR',
    userEmail: 'easybusiness.cop@gmail.com',
    aiRootCause: {
      rootCause: 'Tasks API endpoint required bearer token with tasks scope which was pending authorization.',
      suggestedFix: 'Re-authenticate via OAuth flow to include https://www.googleapis.com/auth/tasks in access token.',
      riskLevel: 'MEDIUM',
    },
  },
  {
    id: 'crash-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    severity: 'WARNING',
    title: 'WebSocket Keep-Alive Timeout',
    errorMessage: 'WebSocketError: Connection closed unexpectedly by proxy gateway (code 1006)',
    stackTrace: `WebSocketError: Connection closed unexpectedly
    at WebSocket.onclose (realtimeClient.ts:98:14)
    at EventEmitter.emit (events.js:150:9)
    at ClientGateway.reconnect (gateway.ts:210:7)`,
    componentName: 'AgentCommunicationThreads',
    agentId: 'jim',
    department: 'Sales & Marketing',
    userEmail: 'easybusiness.cop@gmail.com',
    aiRootCause: {
      rootCause: 'Container ingress reverse proxy closed silent WebSocket channel after 300s idle time.',
      suggestedFix: 'Implement 30s heartbeat ping frame in WebSocket client to maintain proxy channel persistence.',
      riskLevel: 'LOW',
    },
  },
  {
    id: 'crash-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    severity: 'CRITICAL',
    title: 'D3 SVG Container Dimension Zero Overflow',
    errorMessage: 'TypeError: Cannot read properties of null (reading clientWidth) in D3 selection',
    stackTrace: `TypeError: Cannot read properties of null (reading clientWidth)
    at DepartmentTaskBarChart.useEffect (DepartmentTaskBarChart.tsx:75:28)
    at commitHookEffectListMount (react-dom.development.js:23150:26)
    at invokePassiveEffectCreate (react-dom.development.js:23487:20)`,
    componentName: 'DepartmentTaskBarChart',
    agentId: 'core_coder',
    department: 'Engineering',
    userEmail: 'easybusiness.cop@gmail.com',
    aiRootCause: {
      rootCause: 'Chart container rendered before DOM layout ref measurement completed.',
      suggestedFix: 'Add fallback width check (Math.max(width, 300)) before executing D3 axis scale domain calculation.',
      riskLevel: 'HIGH',
    },
  },
];

let inMemoryCrashLogs: CrashReport[] = [...SEEDED_CRASH_REPORTS];

// Auto AI Analysis Engine
export function analyzeCrashWithAI(errorMessage: string, stackTrace: string): {
  rootCause: string;
  suggestedFix: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
} {
  const msg = errorMessage.toLowerCase();
  const stack = stackTrace.toLowerCase();

  if (msg.includes('syntax') || msg.includes('parse') || stack.includes('ast')) {
    return {
      rootCause: 'Syntactic token parsing error or unhandled string delimiter in execution block.',
      suggestedFix: 'Sanitize dynamic input strings and validate JSX syntax prior to compilation.',
      riskLevel: 'HIGH',
    };
  }
  if (msg.includes('oauth') || msg.includes('token') || msg.includes('401') || msg.includes('403')) {
    return {
      rootCause: 'OAuth 2.0 authorization scope missing or expired bearer credential.',
      suggestedFix: 'Trigger OAuth consent re-prompt to grant required workspace scopes.',
      riskLevel: 'MEDIUM',
    };
  }
  if (msg.includes('null') || msg.includes('undefined') || msg.includes('cannot read property')) {
    return {
      rootCause: 'Null pointer access on uninitialized state or async reference variable.',
      suggestedFix: 'Apply optional chaining (?.) and defensive default initialization guards.',
      riskLevel: 'HIGH',
    };
  }
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('websocket')) {
    return {
      rootCause: 'Transient network disconnect or proxy socket channel idle timeout.',
      suggestedFix: 'Enable auto-retry with exponential backoff and socket heartbeat frames.',
      riskLevel: 'LOW',
    };
  }

  return {
    rootCause: 'Unhandled runtime execution exception during component rendering or payload mutation.',
    suggestedFix: 'Wrap call site in try-catch block and inspect context telemetry in Firebase Crashalyst.',
    riskLevel: 'MEDIUM',
  };
}

// Firebase Crash Logger
export async function logCrashReport(reportData: Omit<CrashReport, 'id' | 'timestamp' | 'aiRootCause'>): Promise<CrashReport> {
  const timestamp = new Date().toISOString();
  const aiAnalysis = analyzeCrashWithAI(reportData.errorMessage, reportData.stackTrace);

  const newReport: CrashReport = {
    ...reportData,
    id: `crash-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    aiRootCause: aiAnalysis,
  };

  inMemoryCrashLogs.unshift(newReport);

  try {
    const crashCol = collection(db, 'crash_reports');
    await addDoc(crashCol, newReport);
  } catch (err) {
    console.warn('Firebase Firestore offline, saved to Crashalyst local cache:', err);
  }

  return newReport;
}

// Search and Filter Crash Reports
export function searchCrashReports(
  queryStr: string = '',
  severityFilter: CrashSeverity | 'ALL' = 'ALL'
): CrashReport[] {
  let results = [...inMemoryCrashLogs];

  if (severityFilter !== 'ALL') {
    results = results.filter((r) => r.severity === severityFilter);
  }

  if (queryStr.trim()) {
    const q = queryStr.toLowerCase().trim();
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.errorMessage.toLowerCase().includes(q) ||
        r.componentName.toLowerCase().includes(q) ||
        r.stackTrace.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.agentId && r.agentId.toLowerCase().includes(q))
    );
  }

  return results;
}

// Analytics Aggregation for Crashalyst
export function getCrashAnalytics() {
  const total = inMemoryCrashLogs.length;
  const critical = inMemoryCrashLogs.filter((r) => r.severity === 'CRITICAL').length;
  const error = inMemoryCrashLogs.filter((r) => r.severity === 'ERROR').length;
  const warning = inMemoryCrashLogs.filter((r) => r.severity === 'WARNING').length;

  const departmentCounts: Record<string, number> = {};
  inMemoryCrashLogs.forEach((r) => {
    const dept = r.department || 'General';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });

  return {
    total,
    critical,
    error,
    warning,
    departmentCounts,
    lastCrashTime: inMemoryCrashLogs[0]?.timestamp || null,
  };
}
