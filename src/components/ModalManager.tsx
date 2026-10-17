import React, { lazy as reactLazy, Suspense } from 'react';
import {
  Agent,
  AgentLog,
  FleetTask,
  DynamicFeature,
  UserProfile,
  AttachedFile,
} from '../types';
import type { CascadeRunData } from './ExecutiveSummaryModal';

const SearchModal = lazy(() => import('./SearchModal').then(({ SearchModal }) => ({ default: SearchModal })));
const AuthModal = lazy(() => import('./AuthModal').then(({ AuthModal }) => ({ default: AuthModal })));
const UserPreferencesDrawer = lazy(() => import('./UserPreferencesDrawer').then(({ UserPreferencesDrawer }) => ({ default: UserPreferencesDrawer })));
const DynamicFeatures = lazy(() => import('./DynamicFeatures').then(({ DynamicFeatures }) => ({ default: DynamicFeatures })));
const IdeModal = lazy(() => import('./IdeModal').then(({ IdeModal }) => ({ default: IdeModal })));
const AgentCallModal = lazy(() => import('./AgentCallModal').then(({ AgentCallModal }) => ({ default: AgentCallModal })));
const WebAccessModal = lazy(() => import('./WebAccessModal').then(({ WebAccessModal }) => ({ default: WebAccessModal })));
const RepoExplorerModal = lazy(() => import('./RepoExplorerModal').then(({ RepoExplorerModal }) => ({ default: RepoExplorerModal })));
const ContinuousDebuggerModal = lazy(() => import('./ContinuousDebuggerModal').then(({ ContinuousDebuggerModal }) => ({ default: ContinuousDebuggerModal })));
const SystemModulesModal = lazy(() => import('./SystemModulesModal').then(({ SystemModulesModal }) => ({ default: SystemModulesModal })));
const CseAgentAcademyModal = lazy(() => import('./CseAgentAcademyModal').then(({ CseAgentAcademyModal }) => ({ default: CseAgentAcademyModal })));
const CompanyDatabaseModal = lazy(() => import('./CompanyDatabaseModal').then(({ CompanyDatabaseModal }) => ({ default: CompanyDatabaseModal })));
const ExecutiveAnalyticsModal = lazy(() => import('./ExecutiveAnalyticsModal').then(({ ExecutiveAnalyticsModal }) => ({ default: ExecutiveAnalyticsModal })));
const GoogleWorkspaceHub = lazy(() => import('./GoogleWorkspaceHub').then(({ GoogleWorkspaceHub }) => ({ default: GoogleWorkspaceHub })));
const PublicApiHubModal = lazy(() => import('./PublicApiHubModal').then(({ PublicApiHubModal }) => ({ default: PublicApiHubModal })));
const SocialPluginModal = lazy(() => import('./SocialPluginModal').then(({ SocialPluginModal }) => ({ default: SocialPluginModal })));
const MasterSelfEvolutionModal = lazy(() => import('./MasterSelfEvolutionModal').then(({ MasterSelfEvolutionModal }) => ({ default: MasterSelfEvolutionModal })));
const AdministratorOrchestratorModal = lazy(() => import('./AdministratorOrchestratorModal').then(({ AdministratorOrchestratorModal }) => ({ default: AdministratorOrchestratorModal })));
const AgentDetailDrawer = lazy(() => import('./AgentDetailDrawer').then(({ AgentDetailDrawer }) => ({ default: AgentDetailDrawer })));
const AgentWorkstationModal = lazy(() => import('./AgentWorkstationModal').then(({ AgentWorkstationModal }) => ({ default: AgentWorkstationModal })));
const DeploymentPipelineModal = lazy(() => import('./DeploymentPipelineModal').then(({ DeploymentPipelineModal }) => ({ default: DeploymentPipelineModal })));
const MunderdifflinDashboard = lazy(() => import('./MunderdifflinDashboard').then(({ MunderdifflinDashboard }) => ({ default: MunderdifflinDashboard })));
const DynamicKnowledgeBaseModal = lazy(() => import('./DynamicKnowledgeBaseModal').then(({ DynamicKnowledgeBaseModal }) => ({ default: DynamicKnowledgeBaseModal })));
const SupabaseDiagnosticModal = lazy(() => import('./SupabaseDiagnosticModal').then(({ SupabaseDiagnosticModal }) => ({ default: SupabaseDiagnosticModal })));
const TelegramHubModal = lazy(() => import('./TelegramHubModal').then(({ TelegramHubModal }) => ({ default: TelegramHubModal })));
const ExecutiveSummaryModal = lazy(() => import('./ExecutiveSummaryModal').then(({ ExecutiveSummaryModal }) => ({ default: ExecutiveSummaryModal })));
const PredictiveLoadBalancerModal = lazy(() => import('./PredictiveLoadBalancerModal').then(({ PredictiveLoadBalancerModal }) => ({ default: PredictiveLoadBalancerModal })));
const FirebaseCrashalystHub = lazy(() => import('./FirebaseCrashalystHub').then(({ FirebaseCrashalystHub }) => ({ default: FirebaseCrashalystHub })));
const OpenWebUIModal = lazy(() => import('./OpenWebUIModal').then(({ OpenWebUIModal }) => ({ default: OpenWebUIModal })));
const ComposioHubModal = lazy(() => import('./ComposioHubModal').then(({ ComposioHubModal }) => ({ default: ComposioHubModal })));
const ApiGatewayMicroservicesModal = lazy(() => import('./ApiGatewayMicroservicesModal').then(({ ApiGatewayMicroservicesModal }) => ({ default: ApiGatewayMicroservicesModal })));
const CrisisSimulationModal = lazy(() => import('./CrisisSimulationModal').then(({ CrisisSimulationModal }) => ({ default: CrisisSimulationModal })));
import { Zap } from 'lucide-react';

function lazy<P extends object>(
  load: () => Promise<{ default: React.ComponentType<P> }>,
) {
  const Component = reactLazy(load);
  return function LazyModal(props: P) {
    return (
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    );
  };
}

export interface ModalManagerState {
  isComposioHubOpen?: boolean;
  isCrisisSimulationOpen?: boolean;

  isApiGatewayMicroservicesOpen?: boolean;
  isOpenWebUiOpen?: boolean;
  isSearchOpen: boolean;
  isAuthOpen: boolean;
  isPreferencesOpen: boolean;
  isAdminOrchestratorOpen: boolean;
  isDynamicFeaturesOpen: boolean;
  isIdeOpen: boolean;
  isCallOpen: boolean;
  isWorkstationOpen: boolean;
  isAgentDetailOpen: boolean;
  isWebOpen: boolean;
  isReposOpen: boolean;
  isDebuggerOpen: boolean;
  isSystemModulesOpen: boolean;
  isAcademyOpen: boolean;
  isMasterEvolutionOpen: boolean;
  isCompanyDbOpen: boolean;
  isAnalyticsOpen: boolean;
  isWorkspaceOpen: boolean;
  isTelegramOpen: boolean;
  isPublicApiOpen: boolean;
  isSocialPluginOpen: boolean;
  isDeploymentPipelineOpen: boolean;
  isMunderdifflinDashboardOpen: boolean;
  isDynamicKbOpen: boolean;
  isSupabaseDiagnosticOpen: boolean;
  isExecutiveSummaryOpen: boolean;
  isPredictiveLoadBalancerOpen: boolean;
  isCrashalystOpen: boolean;
}

interface ModalManagerProps {
  state: ModalManagerState;
  onClose: (modalKey: keyof ModalManagerState) => void;
  onOpen: (modalKey: keyof ModalManagerState) => void;
  closeAll: () => void;
  agents: Agent[];
  tasks: FleetTask[];
  departments: any[];
  userProfile: UserProfile;
  selectedAgent: Agent | null | undefined;
  onSelectAgent: (id: string) => void;
  onLogin: (profile: UserProfile) => void;
  onUpdatePreferences: (prefs: any) => void;
  dynamicFeatures: DynamicFeature[];
  featureToEditInIde: DynamicFeature | null;
  setFeatureToEditInIde: (feat: DynamicFeature | null) => void;
  onToggleFeature: (id: string) => void;
  onRemoveFeature: (id: string) => void;
  onAddFeature: (feat: Partial<DynamicFeature>) => void;
  onSaveFeature: (feat: DynamicFeature) => void;
  onExecuteCode: (code: string) => Promise<{ success: boolean; logs: string[]; output: any }>;
  onExecutePrompt: (prompt: string, attachedFile?: AttachedFile) => Promise<any>;
  onAnalyzeWebContent: (content: string, title: string) => void;
  onMountToIde: (code: string, title: string) => void;
  onImportRepoTool: (feature: Partial<DynamicFeature>) => void;
  onTriggerManualHeal: () => Promise<void>;
  onAddTask: (task: Partial<FleetTask>) => void;
  onReassignTask?: (taskId: string, newAssignedTo: string) => Promise<void> | void;
  onAddAgent?: (agent: Agent) => void;
  onUpdateAgent: (agent: Agent) => void;
  onTaskCreated: (task: any) => void;
  onLogCreated: (log: any) => void;
  onCodeApplied: (mod: any) => void;
  autoApplyToast: { show: boolean; agentName: string; moduleName: string } | null;
  onDismissToast: () => void;
  initialDashboardTab?: 'roster_and_assign' | 'monitor' | 'outputs' | 'knowledge' | 'pipelines' | 'communication' | 'skills' | 'sops';
  executiveSummaryRun: CascadeRunData | null;
  executiveSummaryMarkdown: string;
}

export const ModalManager: React.FC<ModalManagerProps> = ({
  state,
  onClose,
  onOpen,
  closeAll,
  agents,
  tasks,
  departments,
  userProfile,
  selectedAgent,
  onSelectAgent,
  onLogin,
  onUpdatePreferences,
  dynamicFeatures,
  featureToEditInIde,
  setFeatureToEditInIde,
  onToggleFeature,
  onRemoveFeature,
  onAddFeature,
  onSaveFeature,
  onExecuteCode,
  onExecutePrompt,
  onAnalyzeWebContent,
  onMountToIde,
  onImportRepoTool,
  onTriggerManualHeal,
  onAddTask,
  onReassignTask,
  onAddAgent,
  onUpdateAgent,
  onTaskCreated,
  onLogCreated,
  onCodeApplied,
  autoApplyToast,
  onDismissToast,
  initialDashboardTab,
  executiveSummaryRun,
  executiveSummaryMarkdown,
}) => {
  return (
    <>
      <SearchModal
        isOpen={state.isSearchOpen}
        onClose={() => onClose('isSearchOpen')}
        agents={agents}
        tasks={tasks}
        departments={departments}
        onSelectAgent={onSelectAgent}
        onOpenIde={() => {
          setFeatureToEditInIde(null);
          onOpen('isIdeOpen');
        }}
        onOpenDebugger={() => onOpen('isDebuggerOpen')}
        onOpenAdminOrchestrator={() => onOpen('isAdminOrchestratorOpen')}
        onOpenRepos={() => onOpen('isReposOpen')}
        onOpenAcademy={() => onOpen('isAcademyOpen')}
        onOpenSystemModules={() => onOpen('isSystemModulesOpen')}
        onOpenPreferences={() => onOpen('isPreferencesOpen')}
        onOpenCall={(id) => {
          onSelectAgent(id);
          onOpen('isCallOpen');
        }}
        onOpenWorkspace={() => onOpen('isWorkspaceOpen')}
        onOpenKnowledgeBase={() => onOpen('isDynamicKbOpen')}
        onOpenAnalytics={() => onOpen('isAnalyticsOpen')}
        onOpenCompanyDb={() => onOpen('isCompanyDbOpen')}
        onOpenPublicApi={() => onOpen('isPublicApiOpen')}
        onOpenWebExplorer={() => onOpen('isWebOpen')}
        onOpenTelegram={() => onOpen('isTelegramOpen')}
      />

      <AuthModal
        isOpen={state.isAuthOpen}
        onClose={() => onClose('isAuthOpen')}
        currentUser={userProfile}
        onLogin={onLogin}
      />

      <UserPreferencesDrawer
        isOpen={state.isPreferencesOpen}
        onClose={() => onClose('isPreferencesOpen')}
        userProfile={userProfile}
        onUpdatePreferences={onUpdatePreferences}
      />

      <DynamicFeatures
        isOpen={state.isDynamicFeaturesOpen}
        onClose={() => onClose('isDynamicFeaturesOpen')}
        features={dynamicFeatures}
        onToggleFeature={onToggleFeature}
        onRemoveFeature={onRemoveFeature}
        onAddFeature={onAddFeature}
        onEditInIde={(feat) => {
          setFeatureToEditInIde(feat);
          onOpen('isIdeOpen');
        }}
        onExecuteCode={onExecuteCode}
      />

      <IdeModal
        isOpen={state.isIdeOpen}
        onClose={() => {
          onClose('isIdeOpen');
          setFeatureToEditInIde(null);
        }}
        featureToEdit={featureToEditInIde}
        onSaveFeature={onSaveFeature}
        onExecuteCode={onExecuteCode}
      />

      <AgentCallModal
        isOpen={state.isCallOpen}
        onClose={() => onClose('isCallOpen')}
        agents={agents}
        currentAgent={selectedAgent}
        onSelectAgent={onSelectAgent}
        onExecutePrompt={onExecutePrompt}
        userDisplayName={userProfile.displayName}
      />

      <WebAccessModal
        isOpen={state.isWebOpen}
        onClose={() => onClose('isWebOpen')}
        onAnalyzeContent={onAnalyzeWebContent}
        onMountToIde={onMountToIde}
        agents={agents}
        selectedAgentId={selectedAgent?.id || 'michael'}
      />

      <RepoExplorerModal
        isOpen={state.isReposOpen}
        onClose={() => onClose('isReposOpen')}
        onImportRepoTool={onImportRepoTool}
        onOpenIdeWithCode={onMountToIde}
      />

      <ContinuousDebuggerModal
        isOpen={state.isDebuggerOpen}
        onClose={() => onClose('isDebuggerOpen')}
        onTriggerHeal={onTriggerManualHeal}
        onOpenCrisisSimulation={() => onOpen('isCrisisSimulationOpen')}
        telemetry={{
          uptime: 3600,
          cyclesRun: 142,
          healthScore: 99.8,
          patchesApplied: 12,
          activeWorkers: 9,
          heapUsedMB: 114,
          heapTotalMB: 512,
          rssMB: 180,
          logs: []
        }}
      />

      <SystemModulesModal
        isOpen={state.isSystemModulesOpen}
        onClose={() => onClose('isSystemModulesOpen')}
        onOpenIdeWithCode={(code, name) => {
          setFeatureToEditInIde({
            id: `sys-${Date.now()}`,
            name,
            code,
            description: 'System module patch',
            icon: 'Zap',
            category: 'code',
            enabled: true,
            addedByAgent: 'Ruflo Auto Coder',
            createdAt: Date.now(),
          });
          onOpen('isIdeOpen');
        }}
      />

      {state.isAcademyOpen && (
        <CseAgentAcademyModal
          agents={agents}
          onUpdateAgent={onUpdateAgent}
          onAddTask={onAddTask}
          onClose={() => onClose('isAcademyOpen')}
        />
      )}

      <CompanyDatabaseModal
        isOpen={state.isCompanyDbOpen}
        onClose={() => onClose('isCompanyDbOpen')}
      />

      <ExecutiveAnalyticsModal
        isOpen={state.isAnalyticsOpen}
        onClose={() => onClose('isAnalyticsOpen')}
      />

      <GoogleWorkspaceHub
        isOpen={state.isWorkspaceOpen}
        onClose={() => onClose('isWorkspaceOpen')}
      />

      <TelegramHubModal
        isOpen={state.isTelegramOpen}
        onClose={() => onClose('isTelegramOpen')}
        onTriggerAgentTask={(prompt) => {
          if (onAddTask) {
            onAddTask({
              title: 'Telegram Autonomous Fleet Task',
              description: prompt,
              priority: 'high',
              status: 'queued',
            });
          }
        }}
      />

      <PublicApiHubModal
        isOpen={state.isPublicApiOpen}
        onClose={() => onClose('isPublicApiOpen')}
        agents={agents}
        onAddTask={onAddTask}
      />

      <SocialPluginModal
        isOpen={state.isSocialPluginOpen}
        onClose={() => onClose('isSocialPluginOpen')}
        agents={agents}
      />

      <MasterSelfEvolutionModal
        isOpen={state.isMasterEvolutionOpen}
        onClose={() => onClose('isMasterEvolutionOpen')}
      />

      <AdministratorOrchestratorModal
        isOpen={state.isAdminOrchestratorOpen}
        onClose={() => onClose('isAdminOrchestratorOpen')}
        agents={agents}
        userProfile={userProfile}
        onTaskCreated={onTaskCreated}
        onLogCreated={onLogCreated}
        onCodeApplied={onCodeApplied}
      />

      <AgentDetailDrawer
        isOpen={state.isAgentDetailOpen}
        onClose={() => onClose('isAgentDetailOpen')}
        agent={selectedAgent}
        tasks={tasks}
        agents={agents}
        onReassignTask={onReassignTask}
        onOpenWorkstation={() => {
          closeAll();
          onOpen('isWorkstationOpen');
        }}
        onOpenCall={() => {
          closeAll();
          onOpen('isCallOpen');
        }}
        onToggleTelegramSync={(agentId, enabled, channelId) => {
          const target = agents.find(a => a.id === agentId);
          if (target) {
            onUpdateAgent({
              ...target,
              telegramSyncEnabled: enabled,
              telegramChannelId: channelId,
            });
          }
        }}
      />

      <AgentWorkstationModal
        isOpen={state.isWorkstationOpen}
        onClose={() => onClose('isWorkstationOpen')}
        agent={selectedAgent}
      />

      <DeploymentPipelineModal
        isOpen={state.isDeploymentPipelineOpen}
        onClose={() => onClose('isDeploymentPipelineOpen')}
        agents={agents}
        onExecuteCode={onExecuteCode}
        onAddTask={onAddTask}
      />

      {state.isMunderdifflinDashboardOpen && (
        <div className="fixed inset-0 z-50 bg-[#1d2021]/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full max-w-7xl h-[92vh] rounded-xl overflow-hidden shadow-2xl border-4 border-[#bdae93]">
            <button
              onClick={() => onClose('isMunderdifflinDashboardOpen')}
              className="absolute top-3 right-3 z-50 w-8 h-8 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold flex items-center justify-center text-sm shadow-md"
              title="Close Dashboard"
            >
              ✕
            </button>
            <MunderdifflinDashboard
              agents={agents}
              tasks={tasks}
              onAddTask={onAddTask}
              onAddAgent={onAddAgent}
              onSelectAgent={onSelectAgent}
              selectedAgentId={selectedAgent?.id}
              initialTab={initialDashboardTab}
            />
          </div>
        </div>
      )}

      <DynamicKnowledgeBaseModal
        isOpen={state.isDynamicKbOpen}
        onClose={() => onClose('isDynamicKbOpen')}
      />

      <SupabaseDiagnosticModal
        isOpen={state.isSupabaseDiagnosticOpen}
        onClose={() => onClose('isSupabaseDiagnosticOpen')}
      />

      <ExecutiveSummaryModal
        isOpen={state.isExecutiveSummaryOpen}
        onClose={() => onClose('isExecutiveSummaryOpen')}
        runData={executiveSummaryRun}
        markdownContent={executiveSummaryMarkdown}
      />

      <PredictiveLoadBalancerModal
        isOpen={state.isPredictiveLoadBalancerOpen}
        onClose={() => onClose('isPredictiveLoadBalancerOpen')}
        agents={agents}
        onAddTask={onAddTask}
      />

      <FirebaseCrashalystHub
        isOpen={state.isCrashalystOpen}
        onClose={() => onClose('isCrashalystOpen')}
      />

      <OpenWebUIModal
        isOpen={!!state.isOpenWebUiOpen}
        onClose={() => onClose('isOpenWebUiOpen')}
        userProfile={userProfile}
        agents={agents}
        onAddTask={onAddTask}
        onExecuteCode={onExecuteCode}
      />

      <ApiGatewayMicroservicesModal
        isOpen={!!state.isApiGatewayMicroservicesOpen}
        onClose={() => onClose('isApiGatewayMicroservicesOpen')}
      />

      <CrisisSimulationModal
        isOpen={!!state.isCrisisSimulationOpen}
        onClose={() => onClose('isCrisisSimulationOpen')}
        onOpenIdeWithCode={(code, name) => {
          setFeatureToEditInIde({
            id: `sys-chaos-${Date.now()}`,
            name,
            code,
            description: 'Chaos Resilience Hotfix Patch',
            icon: 'Zap',
            category: 'code',
            enabled: true,
            addedByAgent: 'Rufflo Resilience Daemon',
            createdAt: Date.now(),
          });
          onOpen('isIdeOpen');
        }}
        onCodeApplied={onCodeApplied}
        onTriggerManualHeal={onTriggerManualHeal}
      />

      <ComposioHubModal
        isOpen={!!state.isComposioHubOpen}
        onClose={() => onClose('isComposioHubOpen')}
        agents={agents}
        onAddTask={onAddTask}
      />


      {autoApplyToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
          <div className="bg-[#1d2021] border-2 border-emerald-500 text-emerald-400 p-3.5 rounded-lg shadow-2xl flex items-start gap-3 max-w-md font-mono">
            <div className="p-1.5 bg-emerald-500/20 rounded text-emerald-400">
              <Zap className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⚡ CODE AUTO-APPLIED TO SYSTEM</span>
                <span className="text-[10px] bg-emerald-500 text-[#1d2021] px-1.5 py-0.2 rounded font-black">
                  HOT-PATCH LIVE
                </span>
              </div>
              <div className="text-[11px] text-[#ebdbb2] mt-0.5 truncate">
                {autoApplyToast.agentName} generated:{' '}
                <span className="font-bold text-[#fabd2f]">{autoApplyToast.moduleName}</span>
              </div>
            </div>
            <button
              onClick={onDismissToast}
              className="text-[#928374] hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};
