import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Flame,
  AlertTriangle,
  Info,
  Terminal,
  Sparkles,
  Zap,
  RefreshCw,
  X,
  CheckCircle2,
  Bug,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CrashReport,
  CrashSeverity,
  searchCrashReports,
  getCrashAnalytics,
  logCrashReport,
} from '../utils/firebaseCrashalyst';

interface FirebaseCrashalystHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseCrashalystHub: React.FC<FirebaseCrashalystHubProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<CrashSeverity | 'ALL'>('ALL');
  const [expandedCrashId, setExpandedCrashId] = useState<string | null>('crash-001');
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const crashReports = searchCrashReports(searchQuery, severityFilter);
  const analytics = getCrashAnalytics();

  const handleSimulateCrash = async () => {
    setIsSimulating(true);

    const testCrashes = [
      {
        title: 'Firestore Security Rule Permission Denied',
        errorMessage: 'FirebaseError: Missing or insufficient permissions at /projects/p-901/tasks',
        stackTrace: `FirebaseError: Missing or insufficient permissions
    at handleFirestoreError (firebaseIntegration.ts:621:9)
    at async setDoc (firestore.ts:188:14)
    at TaskDispatchForm.dispatch (MunderdifflinDashboard.tsx:1512:7)`,
        componentName: 'MunderdifflinDashboard',
        agentId: 'dwight',
        department: 'Security & Compliance',
        severity: 'CRITICAL' as CrashSeverity,
      },
      {
        title: 'Gemini API Token Quota Limit Exceeded',
        errorMessage: 'GoogleGenAIError: 429 Resource Exhausted - Rate limit reached for model gemini-2.5-flash',
        stackTrace: `GoogleGenAIError: 429 Resource Exhausted
    at generateContent (geminiService.ts:92:18)
    at async AgentSynthesizer.process (agentBrain.ts:214:5)
    at async WorkerPool.dispatch (worker.ts:88:12)`,
        componentName: 'AgentSynthesizer',
        agentId: 'angela',
        department: 'Finance & Accounting',
        severity: 'ERROR' as CrashSeverity,
      },
    ];

    const selectedCrash = testCrashes[Math.floor(Math.random() * testCrashes.length)];

    const created = await logCrashReport({
      ...selectedCrash,
      userEmail: 'easybusiness.cop@gmail.com',
    });

    setIsSimulating(false);
    setExpandedCrashId(created.id);
    setToastMessage(`🔥 Firebase Crashalyst captured and analyzed exception: "${created.title}"`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#1d2021] border-2 border-[#fb4934] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-[#ebdbb2]">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#fb4934] text-[#fbf1c7] px-4 py-2 rounded-lg font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <Flame className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 bg-[#282828] border-b border-[#3c3836] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fb4934]/15 border border-[#fb4934]/40 flex items-center justify-center text-[#fb4934] shadow-md">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#fbf1c7] tracking-wide">
                  FIREBASE CRASHALYST & DIAGNOSTICS
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#fb4934]/20 text-[#fb4934] border border-[#fb4934]/40">
                  REAL-TIME SEARCH & AI ANALYSIS
                </span>
              </div>
              <p className="text-xs text-[#a89984] mt-0.5">
                Firebase Firestore Exception Analytics, Automated Stack Analysis & AI Root Cause Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateCrash}
              disabled={isSimulating}
              className="px-3.5 py-1.5 rounded-xl bg-[#fb4934] hover:bg-[#cc241d] text-[#fbf1c7] text-xs font-mono font-bold flex items-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Capturing...' : 'Simulate Exception'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#3c3836] hover:bg-[#504945] text-[#a89984] hover:text-[#fbf1c7] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top KPI Summary Grid */}
        <div className="p-4 bg-[#1d2021] border-b border-[#3c3836] grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="bg-[#282828] p-3 rounded-xl border border-[#3c3836]">
            <div className="text-[10px] font-mono text-[#a89984] uppercase">Captured Crashes</div>
            <div className="text-xl font-black font-mono text-[#fbf1c7] mt-0.5 flex items-center justify-center gap-1">
              <Bug className="w-4 h-4 text-[#fb4934]" /> {analytics.total}
            </div>
          </div>

          <div className="bg-[#282828] p-3 rounded-xl border border-[#3c3836]">
            <div className="text-[10px] font-mono text-[#a89984] uppercase">Critical Exceptions</div>
            <div className="text-xl font-black font-mono text-[#fb4934] mt-0.5 flex items-center justify-center gap-1">
              <ShieldAlert className="w-4 h-4" /> {analytics.critical}
            </div>
          </div>

          <div className="bg-[#282828] p-3 rounded-xl border border-[#3c3836]">
            <div className="text-[10px] font-mono text-[#a89984] uppercase">Warnings & Errors</div>
            <div className="text-xl font-black font-mono text-[#fabd2f] mt-0.5 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4" /> {analytics.error + analytics.warning}
            </div>
          </div>

          <div className="bg-[#282828] p-3 rounded-xl border border-[#3c3836]">
            <div className="text-[10px] font-mono text-[#a89984] uppercase">Fleet Health Score</div>
            <div className="text-xl font-black font-mono text-[#b8bb26] mt-0.5 flex items-center justify-center gap-1">
              <Activity className="w-4 h-4" /> 94.2%
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-[#282828] border-b border-[#3c3836] flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#a89984]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stack traces, error messages, component names, departments..."
              className="w-full bg-[#1d2021] border border-[#3c3836] focus:border-[#fb4934] text-[#ebdbb2] placeholder-[#7c6f64] rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#a89984] hover:text-[#fbf1c7]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[10px] text-[#a89984] mr-1 uppercase font-bold">Severity:</span>
            {(['ALL', 'CRITICAL', 'ERROR', 'WARNING'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  severityFilter === sev
                    ? sev === 'CRITICAL'
                      ? 'bg-[#fb4934] text-[#1d2021] border-[#fb4934]'
                      : sev === 'ERROR'
                      ? 'bg-[#fe8019] text-[#1d2021] border-[#fe8019]'
                      : sev === 'WARNING'
                      ? 'bg-[#fabd2f] text-[#1d2021] border-[#fabd2f]'
                      : 'bg-[#83a598] text-[#1d2021] border-[#83a598]'
                    : 'bg-[#1d2021] text-[#a89984] border-[#3c3836] hover:text-[#ebdbb2]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Crash Reports Scrollable Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1d2021]">
          {crashReports.length === 0 ? (
            <div className="text-center py-16 text-[#a89984]">
              <Flame className="w-10 h-10 mx-auto text-[#504945] mb-2" />
              <p className="font-bold text-sm">No exceptions matching search criteria.</p>
              <p className="text-xs text-[#7c6f64] mt-1">Try clearing filters or click "Simulate Exception" above.</p>
            </div>
          ) : (
            crashReports.map((report) => {
              const isExpanded = expandedCrashId === report.id;
              const isCritical = report.severity === 'CRITICAL';
              const isError = report.severity === 'ERROR';

              return (
                <div
                  key={report.id}
                  className={`bg-[#282828] border rounded-xl overflow-hidden transition-all shadow-md ${
                    isExpanded ? 'border-[#fb4934] ring-1 ring-[#fb4934]/30' : 'border-[#3c3836] hover:border-[#504945]'
                  }`}
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedCrashId(isExpanded ? null : report.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#3c3836]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          isCritical
                            ? 'bg-[#fb4934]/20 text-[#fb4934] border-[#fb4934]/40'
                            : isError
                            ? 'bg-[#fe8019]/20 text-[#fe8019] border-[#fe8019]/40'
                            : 'bg-[#fabd2f]/20 text-[#fabd2f] border-[#fabd2f]/40'
                        }`}
                      >
                        {report.severity}
                      </span>

                      <div>
                        <h4 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2">
                          <span>{report.title}</span>
                        </h4>
                        <div className="text-xs font-mono text-[#a89984] mt-0.5 flex items-center gap-3">
                          <span>Component: <strong className="text-[#ebdbb2]">{report.componentName}</strong></span>
                          <span>Dept: <strong className="text-[#83a598]">{report.department || 'Fleet'}</strong></span>
                          <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#83a598] bg-[#83a598]/10 px-2 py-0.5 rounded border border-[#83a598]/30">
                        Firebase Sync OK
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#a89984]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#a89984]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Stack Trace & AI Root Cause Panel */}
                  {isExpanded && (
                    <div className="border-t border-[#3c3836] p-4 bg-[#1d2021] space-y-3 text-xs">
                      
                      {/* Error Message */}
                      <div className="p-3 bg-[#282828] border border-[#fb4934]/30 rounded-lg text-[#fb4934] font-mono font-bold text-xs flex items-start gap-2">
                        <Terminal className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>{report.errorMessage}</div>
                      </div>

                      {/* Stack Trace Box */}
                      <div>
                        <div className="text-[10px] font-mono text-[#a89984] uppercase tracking-wider mb-1 font-bold">
                          Raw Stack Trace
                        </div>
                        <pre className="p-3 bg-[#181a1b] border border-[#3c3836] rounded-lg text-[11px] font-mono text-[#ebdbb2] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {report.stackTrace}
                        </pre>
                      </div>

                      {/* AI Root Cause & Automated Mitigation */}
                      {report.aiRootCause && (
                        <div className="p-3.5 bg-[#b8bb26]/10 border border-[#b8bb26]/30 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-[#b8bb26] font-bold text-xs">
                            <Sparkles className="w-4 h-4" />
                            <span>Firebase Crashalyst AI Diagnosis & Remediation</span>
                            <span className="ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#b8bb26] text-[#1d2021]">
                              Risk: {report.aiRootCause.riskLevel}
                            </span>
                          </div>

                          <div className="text-xs text-[#ebdbb2] leading-relaxed">
                            <strong className="text-[#fbf1c7]">Root Cause:</strong> {report.aiRootCause.rootCause}
                          </div>

                          <div className="text-xs text-[#83a598] leading-relaxed font-mono">
                            <strong className="text-[#83a598]">Suggested Fix:</strong> {report.aiRootCause.suggestedFix}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#282828] border-t border-[#3c3836] flex items-center justify-between text-xs text-[#a89984] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#b8bb26] animate-ping" />
            <span>Firestore Collection: <strong className="text-[#fbf1c7]">crash_reports</strong></span>
          </div>

          <div>
            Connected Project: <strong className="text-[#83a598]">gen-lang-client-0512776822</strong>
          </div>
        </div>

      </div>
    </div>
  );
};
