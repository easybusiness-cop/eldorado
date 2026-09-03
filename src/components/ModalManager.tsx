import React from 'react';
import {
  Agent,
  AgentLog,
  FleetTask,
  DynamicFeature,
  UserProfile,
  AttachedFile,
} from '../types';
import { SearchModal } from './SearchModal';
import { AuthModal } from './AuthModal';
import { UserPreferencesDrawer } from './UserPreferencesDrawer';
import { DynamicFeatures } from './DynamicFeatures';
import { IdeModal } from './IdeModal';
import { AgentCallModal } from './AgentCallModal';
import { WebAccessModal } from './WebAccessModal';
import { RepoExplorerModal } from './RepoExplorerModal';
import { ContinuousDebuggerModal } from './ContinuousDebuggerModal';
import { SystemModulesModal } from './SystemModulesModal';
import { CseAgentAcademyModal } from './CseAgentAcademyModal';
import { CompanyDatabaseModal } from './CompanyDatabaseModal';
import { ExecutiveAnalyticsModal } from './ExecutiveAnalyticsModal';
import { GoogleWorkspaceHub } from './GoogleWorkspaceHub';
import { PublicApiHubModal } from './PublicApiHubModal';
import { SocialPluginModal } from './SocialPluginModal';
import { MasterSelfEvolutionModal } from './MasterSelfEvolutionModal';
import { AdministratorOrchestratorModal } from './AdministratorOrchestratorModal';
import { AgentDetailDrawer } from './AgentDetailDrawer';
import { AgentWorkstationModal } from './AgentWorkstationModal';
import { DeploymentPipelineModal } from './DeploymentPipelineModal';
import { MunderdifflinDashboard } from './MunderdifflinDashboard';
import { DynamicKnowledgeBaseModal } from './DynamicKnowledgeBaseModal';
import { Zap } from 'lucide-react';

export interface ModalManagerState {
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
  isPublicApiOpen: boolean;
  isSocialPluginOpen: boolean;
  isDeploymentPipelineOpen: boolean;
  isMunderdifflinDashboardOpen: boolean;
  isDynamicKbOpen: boolean;
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
  selectedAgent: Agent;
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
  onExecutePrompt: (prompt: string, attachedFile?: AttachedFile) => Promise<void>;
  onAnalyzeWebContent: (content: string, title: string) => void;
  onMountToIde: (code: string, title: string) => void;
  onImportRepoTool: (feature: Partial<DynamicFeature>) => void;
  onTriggerManualHeal: () => Promise<void>;
  onAddTask: (task: Partial<FleetTask>) => void;
  onUpdateAgent: (agent: Agent) => void;
  onTaskCreated: (task: any) => void;
  onLogCreated: (log: any) => void;
  onCodeApplied: (mod: any) => void;
  autoApplyToast: { show: boolean; agentName: string; moduleName: string } | null;
  onDismissToast: () => void;
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
  onUpdateAgent,
  onTaskCreated,
  onLogCreated,
  onCodeApplied,
  autoApplyToast,
  onDismissToast,
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
        onOpenWorkstation={() => {
          closeAll();
          onOpen('isWorkstationOpen');
        }}
        onOpenCall={() => {
          closeAll();
          onOpen('isCallOpen');
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
            />
          </div>
        </div>
      )}

      <DynamicKnowledgeBaseModal
        isOpen={state.isDynamicKbOpen}
        onClose={() => onClose('isDynamicKbOpen')}
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
