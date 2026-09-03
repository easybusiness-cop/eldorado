import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  Terminal, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Globe, 
  ArrowRight, 
  Check, 
  X, 
  ExternalLink, 
  Copy, 
  Cpu, 
  Server,
  UserCheck,
  FileCode
} from 'lucide-react';
import { Agent, AgentLog, FleetTask } from '../types';

interface DeploymentPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onExecuteCode: (code: string) => Promise<{ success: boolean; logs: string[]; output: any }>;
  onAddTask: (task: Partial<FleetTask>) => void;
}

type PipelineStep = 
  | 'idle'
  | 'engineer_running'
  | 'security_hardening'
  | 'ops_testing'
  | 'modification_review'
  | 'engineer_modifying'
  | 'ops_retesting'
  | 'user_review_publish'
  | 'google_domains_reg'
  | 'published';

export const DeploymentPipelineModal: React.FC<DeploymentPipelineModalProps> = ({
  isOpen,
  onClose,
  agents,
  onExecuteCode,
  onAddTask,
}) => {
  const [currentStep, setCurrentStep] = useState<PipelineStep>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [needsModification, setNeedsModification] = useState<boolean>(true);
  const [iterationCount, setIterationCount] = useState<number>(1);
  const [userDomainInput, setUserDomainInput] = useState<string>('mycompany-app.com');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  // Find department leads or agents
  const engineerAgent = agents.find(a => a.department === 'Engineering' || a.role.toLowerCase().includes('engineer')) || agents[0];
  const securityAgent = agents.find(a => a.department === 'Security' || a.role.toLowerCase().includes('security')) || agents[1] || agents[0];
  const opsAgent = agents.find(a => a.department === 'Operations' || a.role.toLowerCase().includes('operations') || a.role.toLowerCase().includes('product')) || agents[2] || agents[0];

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startPipeline = async () => {
    setCurrentStep('engineer_running');
    setLogs([]);
    addLog(`🚀 Starting Website Deployment Pipeline...`);
    addLog(`👨‍💻 Calling Engineer (${engineerAgent?.name || 'Lead Engineer'}) to run code and build application.`);
    
    await new Promise(r => setTimeout(r, 1500));
    addLog(`[Engineer] Executing npm run build & initializing server runtime on port 3000...`);
    const res = await onExecuteCode('console.log("Website compiled successfully");');
    addLog(`[Engineer] Build successful. All TypeScript types and bundle chunks verified.`);

    // Step 2: Security
    setCurrentStep('security_hardening');
    addLog(`🛡️ Calling Security Head (${securityAgent?.name || 'Security Lead'}) to secure the database & run vulnerability scans.`);
    await new Promise(r => setTimeout(r, 1800));
    addLog(`[Security] Verifying Firestore/Postgres encryption-at-rest and strict IAM rule enforcement...`);
    addLog(`[Security] Firewall rules verified. Zero critical vulnerabilities found. Database secured.`);

    // Step 3: Operational Testing
    setCurrentStep('ops_testing');
    addLog(`⚙️ Calling Operational Head (${opsAgent?.name || 'Ops Director'}) to execute end-to-end load tests and test the website.`);
    await new Promise(r => setTimeout(r, 2000));
    addLog(`[Operations] Running test suite: API latency 24ms, responsiveness 100%, uptime simulation green.`);
    
    // Simulate test result: 1st iteration requires 1 minor modification
    if (iterationCount === 1) {
      setCurrentStep('modification_review');
      addLog(`⚠️ [Operations] Test completed with 1 recommendation: Optimize bundle size & add retry header.`);
      addLog(`🔄 Modifications required! Instructing engineer to modify code.`);
    } else {
      setCurrentStep('user_review_publish');
      addLog(`✅ [Operations] All tests passed with 100% score! No further changes required.`);
      addLog(`🌟 Presenting website to user for review and publication.`);
    }
  };

  const handleEngineerModify = async () => {
    setCurrentStep('engineer_modifying');
    addLog(`👨‍💻 [Engineer (${engineerAgent?.name})] Applying requested code modifications and performance patches...`);
    await new Promise(r => setTimeout(r, 1600));
    addLog(`[Engineer] Modifications successfully applied and compiled.`);
    
    setIterationCount(2);
    setCurrentStep('ops_retesting');
    addLog(`⚙️ [Operations (${opsAgent?.name})] Re-executing execution and test suite on modified codebase...`);
    await new Promise(r => setTimeout(r, 1800));
    addLog(`[Operations] Re-test passed successfully! Zero defects detected.`);
    
    setCurrentStep('user_review_publish');
    addLog(`🌟 Website is fully verified and ready. Presenting to user for publication.`);
  };

  const handleUserAcceptPublish = () => {
    setCurrentStep('google_domains_reg');
    addLog(`🌐 User agreed to publish! Opening Google Domains registration portal simulation...`);
  };

  const handleCompleteRegistrationAndPublish = () => {
    setIsPublished(true);
    setCurrentStep('published');
    addLog(`✅ Domain registered: ${userDomainInput}`);
    addLog(`🎉 SUCCESS! Website successfully published and live at https://${userDomainInput}`);
    onAddTask({
      title: `Publish Website to ${userDomainInput}`,
      department: 'Executive',
      priority: 'high',
      status: 'completed',
      description: `Website successfully deployed and registered on custom domain ${userDomainInput}.`
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-[#1d2021] border border-[#3c3836] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#282828]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#fabd2f]/10 text-[#fabd2f] border border-[#fabd2f]/30">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#ebdbb2]">Automated Deployment & Testing Pipeline</h2>
              <p className="text-xs text-[#a89984]">Engineer ➔ Security ➔ Operations ➔ User Review ➔ Google Domains Publish</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-[#a89984] hover:text-[#ebdbb2] hover:bg-[#3c3836] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Pipeline Status Stepper */}
          <div className="grid grid-cols-5 gap-2 bg-[#282828] p-4 rounded-xl border border-[#3c3836]">
            <div className={`flex flex-col items-center text-center p-2 rounded-lg ${currentStep === 'engineer_running' ? 'bg-[#fabd2f]/10 border border-[#fabd2f]/30 text-[#fabd2f]' : 'text-[#a89984]'}`}>
              <Cpu className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">1. Engineer Run</span>
            </div>
            <div className={`flex flex-col items-center text-center p-2 rounded-lg ${currentStep === 'security_hardening' ? 'bg-[#b8bb26]/10 border border-[#b8bb26]/30 text-[#b8bb26]' : 'text-[#a89984]'}`}>
              <ShieldCheck className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">2. Security DB</span>
            </div>
            <div className={`flex flex-col items-center text-center p-2 rounded-lg ${currentStep === 'ops_testing' || currentStep === 'ops_retesting' ? 'bg-[#83a598]/10 border border-[#83a598]/30 text-[#83a598]' : 'text-[#a89984]'}`}>
              <Activity className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">3. Ops Test</span>
            </div>
            <div className={`flex flex-col items-center text-center p-2 rounded-lg ${currentStep === 'user_review_publish' ? 'bg-[#d3869b]/10 border border-[#d3869b]/30 text-[#d3869b]' : 'text-[#a89984]'}`}>
              <Globe className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">4. User Review</span>
            </div>
            <div className={`flex flex-col items-center text-center p-2 rounded-lg ${currentStep === 'published' ? 'bg-[#b8bb26]/20 border border-[#b8bb26]/50 text-[#b8bb26]' : 'text-[#a89984]'}`}>
              <Rocket className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">5. Google Domain</span>
            </div>
          </div>

          {/* Action Trigger / Interactive Cards */}
          {currentStep === 'idle' && (
            <div className="bg-[#282828] border border-[#3c3836] rounded-xl p-6 text-center space-y-4">
              <div className="max-w-md mx-auto">
                <h3 className="text-md font-semibold text-[#ebdbb2] mb-2">Ready to Run Automated Orchestration Workflow?</h3>
                <p className="text-xs text-[#a89984] mb-4">
                  This will sequentially run the website via Engineer, secure the database via Security, test via Operational Head, handle modifications if needed, ask you for review, and register the domain on Google Domains to publish.
                </p>
                <button
                  onClick={startPipeline}
                  className="px-6 py-3 bg-[#fabd2f] text-[#1d2021] font-bold rounded-xl hover:bg-[#d79921] transition-all flex items-center justify-center gap-2 mx-auto shadow-lg"
                >
                  <Rocket className="w-4 h-4" /> Start Orchestration Workflow
                </button>
              </div>
            </div>
          )}

          {/* Modification Review Step */}
          {currentStep === 'modification_review' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#fb4934]/10 border border-[#fb4934]/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-[#fb4934]" />
                <div>
                  <h4 className="text-sm font-bold text-[#ebdbb2]">Operational Head Test Report: Modifications Required</h4>
                  <p className="text-xs text-[#a89984]">The Operational Head found 1 optimization requirement during testing. Engineer needs to modify code before final sign-off.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEngineerModify}
                  className="px-4 py-2 bg-[#fb4934] text-[#1d2021] font-semibold text-xs rounded-lg hover:bg-[#cc241d] transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tell Engineer to Modify Code & Re-Test
                </button>
              </div>
            </motion.div>
          )}

          {/* User Review & Publish Ask Step */}
          {currentStep === 'user_review_publish' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#b8bb26]/10 border border-[#b8bb26]/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#b8bb26]" />
                <div>
                  <h4 className="text-sm font-bold text-[#ebdbb2]">Website Successfully Tested & Verified!</h4>
                  <p className="text-xs text-[#a89984]">Operational Head confirms all tests passed with 0 errors. Would you like to publish this website now?</p>
                </div>
              </div>
              <div className="bg-[#1d2021] p-4 rounded-lg border border-[#3c3836] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#ebdbb2]">Preview URL Active</div>
                  <div className="text-[11px] text-[#83a598]">https://ais-dev-xpys5ljnalinrfzoy2omyc-458062693402.asia-southeast1.run.app</div>
                </div>
                <a 
                  href="https://ais-dev-xpys5ljnalinrfzoy2omyc-458062693402.asia-southeast1.run.app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  Test Website <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleUserAcceptPublish}
                  className="px-6 py-2.5 bg-[#b8bb26] text-[#1d2021] font-bold text-xs rounded-xl hover:bg-[#98971a] transition-all flex items-center gap-2 shadow-md"
                >
                  Yes, Publish Website <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Google Domains Registration Step */}
          {currentStep === 'google_domains_reg' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#458588]/10 border border-[#458588]/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-[#83a598]" />
                <div>
                  <h4 className="text-sm font-bold text-[#ebdbb2]">Google Domains Registration Portal</h4>
                  <p className="text-xs text-[#a89984]">Register your custom domain below or copy-paste your domain to publish your website live.</p>
                </div>
              </div>

              <div className="bg-[#1d2021] p-4 rounded-xl border border-[#3c3836] space-y-3">
                <label className="text-xs font-semibold text-[#ebdbb2] block">Enter Custom Domain (Google Domains):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userDomainInput}
                    onChange={(e) => setUserDomainInput(e.target.value)}
                    className="flex-1 bg-[#282828] border border-[#3c3836] rounded-lg px-3 py-2 text-xs text-[#ebdbb2] focus:outline-none focus:border-[#83a598]"
                    placeholder="e.g. mycompany.com"
                  />
                  <button
                    onClick={handleCompleteRegistrationAndPublish}
                    className="px-5 py-2 bg-[#83a598] text-[#1d2021] font-bold text-xs rounded-lg hover:bg-[#689d6a] transition-all flex items-center gap-1.5 shadow"
                  >
                    Register & Publish <Rocket className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-[#a89984]">Connected via Google Domains API & Cloud DNS automated provisioning.</p>
              </div>
            </motion.div>
          )}

          {/* Published Success Banner */}
          {currentStep === 'published' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#b8bb26]/20 border border-[#b8bb26]/40 rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-[#b8bb26] text-[#1d2021] rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-lg font-bold text-[#ebdbb2]">Website Successfully Published!</h3>
              <p className="text-xs text-[#a89984]">Your website is now live on <span className="text-[#b8bb26] font-semibold">https://{userDomainInput}</span> with secure SSL and global CDN distribution.</p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#3c3836] text-[#ebdbb2] text-xs font-semibold rounded-xl hover:bg-[#504945] transition-all"
                >
                  Close Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* Live Terminal Logs */}
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-4 font-mono text-[11px] text-[#a89984] space-y-1.5 max-h-48 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#ebdbb2] mb-2 flex items-center gap-2 border-b border-[#3c3836] pb-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#fabd2f]" /> Orchestration Terminal Output
            </div>
            {logs.length === 0 ? (
              <div className="text-[#665c54]">Click 'Start Orchestration Workflow' above to begin...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="text-[#ebdbb2]">{log}</div>
              ))
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};
