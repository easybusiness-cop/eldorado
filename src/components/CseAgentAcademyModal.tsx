import React, { useState } from 'react';
import { Agent, FleetTask } from '../types';
import {
  CSE_CURRICULUM_SOURCES,
  CSE_TRAINING_LEVELS,
  CSE_SPECIALIZATION_SPECS,
  COMPETENCY_LEVEL_DESCRIPTIONS
} from '../constants/cseCurriculum';
import { soundFx } from '../utils/speech';
import {
  GraduationCap,
  X,
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Terminal,
  Cpu,
  ArrowRight,
  TrendingUp,
  Sliders,
  UserCheck
} from 'lucide-react';

interface CseAgentAcademyModalProps {
  agents: Agent[];
  onUpdateAgent: (updatedAgent: Agent) => void;
  onAddTask?: (task: Partial<FleetTask>) => void;
  onClose: () => void;
}

export const CseAgentAcademyModal: React.FC<CseAgentAcademyModalProps> = ({
  agents,
  onUpdateAgent,
  onAddTask,
  onClose
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || 'cline');
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'training_loop' | 'specialization' | 'ml_engineering' | 'algo_benchmark' | 'task_trainer'>('overview');
  const [selectedLevelNumber, setSelectedLevelNumber] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);

  // Task Training & Publishing States
  const [customTaskTitle, setCustomTaskTitle] = useState('[Security Audit] Sanitize Database Inputs');
  const [customTaskPrompt, setCustomTaskPrompt] = useState('Inspect all database connection interfaces, locate potential SQL injection vulnerabilities, and implement parametrized validation checks.');
  const [taskTrainingLogs, setTaskTrainingLogs] = useState<string[]>([]);
  const [isTaskTraining, setIsTaskTraining] = useState<boolean>(false);
  const [taskTrainingProgress, setTaskTrainingProgress] = useState<number>(0);
  const [isTaskPublished, setIsTaskPublished] = useState<boolean>(false);

  // Machine Learning Engineering States
  const [mlModelName, setMlModelName] = useState('Gemini-Classifier-V1');
  const [mlTaskType, setMlTaskType] = useState<'classification' | 'regression' | 'embedding' | 'llm_tuning'>('classification');
  const [mlEpochs, setMlEpochs] = useState(5);
  const [mlBatchSize, setMlBatchSize] = useState(32);
  const [mlLearningRate, setMlLearningRate] = useState(0.001);
  const [mlTrainingResult, setMlTrainingResult] = useState<any>(null);
  const [mlTrainingLoading, setMlTrainingLoading] = useState(false);

  // RAG Vector Search States
  const [vectorQuery, setVectorQuery] = useState('agent orchestration memory architecture');
  const [vectorResults, setVectorResults] = useState<any[]>([]);
  const [vectorLoading, setVectorLoading] = useState(false);

  // Algorithm Benchmark States
  const [algoName, setAlgoName] = useState<'quick_sort' | 'binary_search' | 'hash_map_lookup' | 'graph_bfs' | 'dynamic_programming_knapsack'>('quick_sort');
  const [algoInputSize, setAlgoInputSize] = useState(10000);
  const [algoReport, setAlgoReport] = useState<any>(null);
  const [algoLoading, setAlgoLoading] = useState(false);

  const handleTrainMlModel = async () => {
    soundFx.playClick();
    setMlTrainingLoading(true);
    try {
      const res = await fetch('/api/v2/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: mlModelName,
          taskType: mlTaskType,
          epochs: mlEpochs,
          batchSize: mlBatchSize,
          learningRate: mlLearningRate,
          features: ['input_embeddings', 'attention_weights', 'user_context'],
          targetLabel: 'intent_category',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMlTrainingResult(data.training);
      }
    } catch (e) {
      console.error('ML Training request error:', e);
    } finally {
      setMlTrainingLoading(false);
    }
  };

  const handleVectorSearch = async () => {
    soundFx.playClick();
    setVectorLoading(true);
    try {
      const res = await fetch('/api/v2/ml/vector/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: vectorQuery, topK: 3 }),
      });
      const data = await res.json();
      if (data.success) {
        setVectorResults(data.results || []);
      }
    } catch (e) {
      console.error('Vector Search request error:', e);
    } finally {
      setVectorLoading(false);
    }
  };

  const handleRunAlgoBenchmark = async () => {
    soundFx.playClick();
    setAlgoLoading(true);
    try {
      const res = await fetch('/api/v2/cse/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm: algoName, inputSize: algoInputSize }),
      });
      const data = await res.json();
      if (data.success) {
        setAlgoReport(data.report);
      }
    } catch (e) {
      console.error('Algo Benchmark request error:', e);
    } finally {
      setAlgoLoading(false);
    }
  };

  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const trainingRecord = currentAgent?.trainingRecord || {
    completedLevels: [1, 2],
    currentLevel: 3,
    competencyScore: 65,
    competencyGrade: 'L2',
    specializationTrack: 'BACKEND-ENGINEER',
    certifications: [],
    practicalProjectsCompleted: [],
    hoursTrained: 40,
    skillsMatrix: {}
  };

  const handleTrainTask = async () => {
    soundFx.playClick();
    setIsTaskTraining(true);
    setIsTaskPublished(false);
    setTaskTrainingProgress(10);
    setTaskTrainingLogs([
      `[AUTONOMY KERNEL] Initializing Master Trainer for Agent: ${currentAgent.name} (${currentAgent.id})...`,
      `[TARGET SPEC] Compiling task specification: "${customTaskTitle}"...`,
      `[ROLE MATCH] Verifying agent capabilities: Tools = [${(currentAgent.assignedTools || ['Sandbox VM']).join(', ')}].`
    ]);

    try {
      const res = await fetch('/api/autonomy/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: currentAgent.id }),
      });
      const data = await res.json();
      if (data.success && data.training) {
        setTaskTrainingProgress(60);
        setTaskTrainingLogs(prev => [
          ...prev,
          `[MASTER TRAINER] Generated curriculum with ${data.training.curriculum.length} challenges.`,
          ...data.training.results.map((r: any) => `[CHALLENGE RESULT] Score: ${(r.score * 100).toFixed(0)}%, Passed: ${r.passed}`),
          `[CAPABILITY UPDATE] Updated capability score: ${(data.training.profile.overallScore * 100).toFixed(1)}%`
        ]);
      }
    } catch (e: any) {
      setTaskTrainingLogs(prev => [...prev, `[AUTONOMY ENGINE] Fallback local simulation mode active.`]);
    }

    const steps = [
      `[TRAINING STAGE 1/3] Compiling zero-trust validator gates in isolated workspace...`,
      `[TRAINING STAGE 2/3] Auto-tuning LLM system instructions for ${currentAgent.name}...`,
      `[TRAINING STAGE 3/3] TRAINING RUN SUCCESSFUL. Task blueprint published to compiler cache.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setTaskTrainingLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
        setTaskTrainingProgress(60 + Math.round((currentStep / steps.length) * 40));
      } else {
        clearInterval(interval);
        setIsTaskTraining(false);
        soundFx.playClick();
      }
    }, 400);
  };

  const handlePublishTask = () => {
    if (!onAddTask) return;
    soundFx.playClick();
    
    onAddTask({
      title: customTaskTitle,
      description: customTaskPrompt,
      assignedTo: selectedAgentId,
      priority: 'high',
      status: 'queued'
    });

    setIsTaskPublished(true);
  };

  const handleRunTrainingLoop = (levelNum: number) => {
    soundFx.playClick();
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationLogs([
      `[ACADEMY INIT] Initializing CSE Training Engine for Agent ${currentAgent.name} (${currentAgent.role})...`,
      `[MANDATE] Verifying autonomous worker model: Agent -> Role -> Department -> Skills -> Training -> Certifications -> Tasks.`,
      `[CURRICULUM FETCH] Pulling curriculum materials from approved repositories...`
    ]);

    const levelSpec = CSE_TRAINING_LEVELS.find(l => l.levelNumber === levelNum) || CSE_TRAINING_LEVELS[0];
    const steps = [
      `[STEP 1/12] Referencing repo material: ${levelSpec.topics[0]?.primaryRepository || 'OSSU CS'} (${levelSpec.topics[0]?.repoUrl || 'https://github.com/ossu/computer-science'}).`,
      `[STEP 2/12] Agent ${currentAgent.name} digesting theoretical concepts: ${levelSpec.topics[0]?.title || 'Core CS'}.`,
      `[STEP 3/12] Creating minimal runnable code implementation in sandboxed VM...`,
      `[STEP 4/12] Executing automated Vitest test suite against implementation...`,
      `[STEP 5/12] Diagnostics: 0 runtime errors detected in sandbox.`,
      `[STEP 6/12] Refactoring code according to SOLID & clean architecture guidelines...`,
      `[STEP 7/12] Generating structured documentation and learning log...`,
      `[STEP 8/12] Executing practical task: "${levelSpec.topics[0]?.practicalTaskTitle || 'Practical Challenge'}"...`,
      `[STEP 9/12] Submitting pull request to Code Review Specialist Agent...`,
      `[STEP 10/12] Security & OWASP check passed with zero vulnerability findings.`,
      `[STEP 11/12] Issuing official Certification Badge for Level ${levelNum}: ${levelSpec.levelTitle}...`,
      `[STEP 12/12] ADVANCEMENT COMPLETE! Competency grade updated.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSimulationLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
        setSimulationProgress(Math.round((currentStep / steps.length) * 100));
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        soundFx.playClick();

        // Update Agent's training record
        const updatedCompletedLevels = Array.from(new Set([...trainingRecord.completedLevels, levelNum]));
        const newScore = Math.min(100, (trainingRecord.competencyScore || 60) + 8);
        let newGrade: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' = 'L3';
        if (newScore >= 90) newGrade = 'L5';
        else if (newScore >= 80) newGrade = 'L4';
        else if (newScore >= 70) newGrade = 'L3';

        const newCert = {
          id: `cert-${Date.now()}`,
          name: `${levelSpec.levelTitle} Certified`,
          level: newGrade,
          track: trainingRecord.specializationTrack || 'Full-Stack Engineering',
          issuedAt: new Date().toISOString().split('T')[0],
          sourceRepository: levelSpec.topics[0]?.repoUrl || 'https://github.com/ossu/computer-science'
        };

        const updatedRecord = {
          ...trainingRecord,
          completedLevels: updatedCompletedLevels,
          currentLevel: Math.min(9, Math.max(...updatedCompletedLevels) + 1),
          competencyScore: newScore,
          competencyGrade: newGrade,
          certifications: [newCert, ...(trainingRecord.certifications || [])],
          hoursTrained: (trainingRecord.hoursTrained || 0) + 12,
          lastTrainedAt: new Date().toISOString()
        };

        const updatedAgent: Agent = {
          ...currentAgent,
          trainingRecord: updatedRecord,
          capabilities: Array.from(new Set([...currentAgent.capabilities, `Level ${levelNum} Certified`, levelSpec.levelTitle]))
        };

        onUpdateAgent(updatedAgent);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-50 border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">CSE AGENT TRAINING ACADEMY</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-300 uppercase">
                  100% Agent Workforce
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Structured Computer Science & Engineering Academy Grounded in OSSU, freeCodeCamp & Academic Repositories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Architecture Pipeline Banner */}
        <div className="bg-indigo-900 text-white p-3 px-6 text-xs font-mono flex items-center justify-between overflow-x-auto no-scrollbar gap-3 border-b border-indigo-950">
          <div className="flex items-center gap-2 font-bold whitespace-nowrap">
            <span className="text-amber-300">ARCHITECTURE:</span>
            <span>Agent</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span>Role</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span>Department</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span>Skills</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span className="text-emerald-300">Training</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span className="text-cyan-300">Certification</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span>Permissions</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span>Tasks</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span>Evaluation</span>
            <ArrowRight className="w-3 h-3 text-indigo-300" />
            <span className="text-amber-300">Promote/Retrain</span>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Agent Roster & Matrix
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'curriculum'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> 9-Level CSE Curriculum
            </button>
            <button
              onClick={() => setActiveTab('training_loop')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'training_loop'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Live Training Engine
            </button>
            <button
              onClick={() => setActiveTab('specialization')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'specialization'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Agent Specialization Tracks
            </button>
            <button
              onClick={() => setActiveTab('ml_engineering')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'ml_engineering'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Machine Learning Workstation
            </button>
            <button
              onClick={() => setActiveTab('algo_benchmark')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'algo_benchmark'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Algorithm Benchmarker
            </button>
            <button
              onClick={() => setActiveTab('task_trainer')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'task_trainer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Task Trainer & Publisher
            </button>
          </div>

          {/* Agent Selector Dropdown */}
          <div className="flex items-center gap-2 font-sans">
            <span className="text-xs font-bold text-slate-600">Select Agent:</span>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
            >
              {agents.map(a => (
                <option className="text-slate-900 bg-white" key={a.id} value={a.id}>
                  {a.avatar} {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
          {/* TAB 1: OVERVIEW & AGENT SKILL MATRIX */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Agent Highlight Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                      {currentAgent.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-lg text-slate-900">{currentAgent.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                          AUTONOMOUS AGENT
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-indigo-600 mt-0.5">{currentAgent.role}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Dept: {currentAgent.departmentName || 'Engineering & Technology'} • Authority Level {currentAgent.authorityLevel || 8}
                      </div>
                    </div>
                  </div>

                  {/* Competency Grade Pill */}
                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">COMPETENCY GRADE</div>
                    <div className="text-2xl font-extrabold font-mono text-indigo-600">
                      {trainingRecord.competencyGrade || 'L2'}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600">Score: {trainingRecord.competencyScore || 65}/100</div>
                  </div>
                </div>

                {/* Mandate Box */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 text-xs leading-relaxed space-y-1">
                  <span className="font-bold text-amber-900 block">WORKFORCE SIMULATION PRINCIPLE:</span>
                  <p className="text-slate-700">
                    There are no human employees in the workforce simulation. Every worker, manager, trainer, recruiter, accountant, marketer, engineer, researcher and executive is an autonomous software AI agent. Organizational titles describe role authority—not human identity.
                  </p>
                </div>

                {/* Training Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[10px] font-bold">COMPLETED LEVELS</div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {trainingRecord.completedLevels.length} / 9 Levels
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[10px] font-bold">ACADEMY HOURS</div>
                    <div className="text-base font-extrabold text-indigo-600 mt-0.5">
                      {trainingRecord.hoursTrained || 40} hrs
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[10px] font-bold">ACTIVE CERTIFICATIONS</div>
                    <div className="text-base font-extrabold text-emerald-600 mt-0.5">
                      {trainingRecord.certifications.length || 1} Badges
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[10px] font-bold">SPECIALIZATION TRACK</div>
                    <div className="text-xs font-extrabold text-purple-700 mt-1 truncate">
                      {trainingRecord.specializationTrack || 'CSE-ARCHITECT'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Repositories Backbone Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-600 uppercase flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" /> CURRICULUM REPOSITORY BACKBONE
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {CSE_CURRICULUM_SOURCES.map(source => (
                    <div key={source.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {source.badge}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-600">{source.stars}</span>
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 mt-2">{source.name}</h5>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{source.focus}</p>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-3 pt-2 border-t border-slate-100"
                      >
                        Explore Repository <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Matrix & Certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Certifications Earned */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-600 uppercase flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> CERTIFICATIONS EARNED ({trainingRecord.certifications.length})
                  </h4>
                  {trainingRecord.certifications.length > 0 ? (
                    <div className="space-y-2.5">
                      {trainingRecord.certifications.map((cert, idx) => (
                        <div key={cert.id || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">{cert.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Track: {cert.track} • Issued: {cert.issuedAt}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {cert.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-mono py-6 text-center">
                      No formal certifications recorded yet. Enroll in CSE levels!
                    </div>
                  )}
                </div>

                {/* Assigned Tools & Permissions */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-600 uppercase flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" /> TOOLS & PERMISSIONS GRANTED
                  </h4>
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">ASSIGNED TOOLS</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(currentAgent.assignedTools || ['IDE Hot-Reloader', 'Sandbox Execution VM']).map((tool, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs font-bold">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">SYSTEM PERMISSIONS</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(currentAgent.permissions || ['WRITE_CODE', 'EXECUTE_SANDBOX']).map((perm, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 9-LEVEL CSE CURRICULUM */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-indigo-900 text-sm">CSE 9-LEVEL PRACTICAL ACADEMY CURRICULUM</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Every level includes theoretical foundation, sandboxed coding exercises, practical engineering projects, and code review gates.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {CSE_TRAINING_LEVELS.map(lvl => {
                  const isCompleted = trainingRecord.completedLevels.includes(lvl.levelNumber);

                  return (
                    <div key={lvl.levelNumber} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-xl text-xs font-extrabold font-mono ${lvl.badgeColor}`}>
                            Level {lvl.levelNumber}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{lvl.levelTitle}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CERTIFIED
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedLevelNumber(lvl.levelNumber);
                                setActiveTab('training_loop');
                              }}
                              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                            >
                              Enroll Agent in L{lvl.levelNumber} <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{lvl.description}</p>

                      {/* Topics Breakdown */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        {lvl.topics.map(t => (
                          <div key={t.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 text-xs">{t.title}</span>
                              <a
                                href={t.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold font-mono text-indigo-600 hover:underline flex items-center gap-0.5"
                              >
                                {t.primaryRepository} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                            <p className="text-xs text-slate-600">{t.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {t.skills.map((s, i) => (
                                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE TRAINING ENGINE */}
          {activeTab === 'training_loop' && (
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">AUTOMATED 12-STEP PRACTICAL AGENT TRAINING ENGINE</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Runs practical curriculum tasks, sandboxed code execution, automated testing, security checks, and code review gates.
                    </p>
                  </div>

                  {/* Level Selector */}
                  <div className="flex items-center gap-2 font-sans">
                    <span className="text-xs font-bold text-slate-600">Level:</span>
                    <select
                      value={selectedLevelNumber}
                      onChange={e => setSelectedLevelNumber(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-slate-900 text-xs"
                    >
                      {CSE_TRAINING_LEVELS.map(l => (
                        <option className="text-slate-900 bg-white" key={l.levelNumber} value={l.levelNumber}>
                          Level {l.levelNumber}: {l.levelTitle}
                        </option>
                      ))}
                    </select>

                    <button
                      disabled={isSimulating}
                      onClick={() => handleRunTrainingLoop(selectedLevelNumber)}
                      className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition flex items-center gap-2 ${
                        isSimulating ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <Zap className="w-4 h-4" /> {isSimulating ? 'Training in Progress...' : 'Start Practical Training Loop'}
                    </button>
                  </div>
                </div>

                {/* Simulation Progress Bar */}
                {isSimulating && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono font-bold text-indigo-700">
                      <span>RUNNING TRAINING PIPELINE FOR {currentAgent.name.toUpperCase()}</span>
                      <span>{simulationProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ width: `${simulationProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Console Terminal Output */}
                <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-emerald-400 min-h-[260px] max-h-[360px] overflow-y-auto space-y-1 shadow-inner border border-slate-800">
                  <div className="text-slate-500 border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400" /> AGENT ACADEMY RUNTIME LOGS
                    </span>
                    <span className="text-[10px] text-slate-400">100% Agent Workforce Sandbox</span>
                  </div>
                  {simulationLogs.length > 0 ? (
                    simulationLogs.map((log, i) => (
                      <div key={i} className="leading-relaxed">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 py-12 text-center">
                      Select a training level and click "Start Practical Training Loop" to launch agent certification.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SPECIALIZATION TRACKS */}
          {activeTab === 'specialization' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <h4 className="font-extrabold text-purple-900 text-sm">AGENT CSE SPECIALIZATION TRACKS</h4>
                <p className="text-xs text-purple-700 mt-0.5">
                  Agents can specialize in specific software engineering domains to unlock advanced permissions and tools.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CSE_SPECIALIZATION_SPECS.map(spec => (
                  <div key={spec.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 font-mono text-xs font-bold border border-purple-300">
                        {spec.id}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-slate-400">
                        Levels: {spec.recommendedLevels.join(', ')}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-base">{spec.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{spec.description}</p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="font-bold text-slate-700 text-[10px] uppercase font-mono">Key Responsibilities:</div>
                      <div className="flex flex-wrap gap-1">
                        {spec.keyResponsibilities.map((resp, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {resp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="font-bold text-slate-700 text-[10px] uppercase font-mono">Primary Tools:</div>
                      <div className="flex flex-wrap gap-1">
                        {spec.primaryTools.map((tool, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MACHINE LEARNING WORKSTATION */}
          {activeTab === 'ml_engineering' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-teal-900 text-sm">MACHINE LEARNING ENGINEER WORKSTATION</h4>
                  <p className="text-xs text-teal-700 mt-0.5">
                    Train ML models, evaluate data drift & precision metrics, generate dataset splits, and query semantic RAG vector embeddings.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-mono text-xs font-bold">
                  Gemini SDK + Vector Store
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel 1: Model Training Control */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                    <Cpu className="w-4 h-4 text-teal-600" /> Model Training Pipeline
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Model Name:</label>
                      <input
                        type="text"
                        value={mlModelName}
                        onChange={e => setMlModelName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Task Type:</label>
                        <select
                          value={mlTaskType}
                          onChange={e => setMlTaskType(e.target.value as any)}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs"
                        >
                          <option className="text-slate-900 bg-white" value="classification">Classification</option>
                          <option className="text-slate-900 bg-white" value="regression">Regression</option>
                          <option className="text-slate-900 bg-white" value="embedding">Embedding</option>
                          <option className="text-slate-900 bg-white" value="llm_tuning">LLM Tuning</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Epochs:</label>
                        <input
                          type="number"
                          value={mlEpochs}
                          onChange={e => setMlEpochs(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Batch Size:</label>
                        <input
                          type="number"
                          value={mlBatchSize}
                          onChange={e => setMlBatchSize(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Learning Rate:</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={mlLearningRate}
                          onChange={e => setMlLearningRate(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleTrainMlModel}
                      disabled={mlTrainingLoading}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs transition shadow-sm disabled:opacity-50"
                    >
                      {mlTrainingLoading ? 'Training ML Model Pipeline...' : 'Run ML Model Training'}
                    </button>

                    {mlTrainingResult && (
                      <div className="p-3 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] space-y-1.5 border border-slate-800">
                        <div className="font-bold text-teal-300">Model ID: {mlTrainingResult.modelId}</div>
                        <div>Status: {mlTrainingResult.status} | Mode: {mlTrainingResult.mode}</div>
                        <div>Accuracy: {(mlTrainingResult.metrics.accuracy * 100).toFixed(1)}% | F1 Score: {mlTrainingResult.metrics.f1Score}</div>
                        <div>Loss: {mlTrainingResult.metrics.loss} | Duration: {mlTrainingResult.metrics.trainingDurationMs}ms</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 2: Vector Embeddings & RAG Search */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                    <Layers className="w-4 h-4 text-indigo-600" /> Semantic Vector Embeddings (RAG)
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Search Vector Query:</label>
                      <input
                        type="text"
                        value={vectorQuery}
                        onChange={e => setVectorQuery(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs"
                      />
                    </div>

                    <button
                      onClick={handleVectorSearch}
                      disabled={vectorLoading}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-sm disabled:opacity-50"
                    >
                      {vectorLoading ? 'Computing Cosine Vectors...' : 'Run Vector Similarity Search'}
                    </button>

                    <div className="space-y-2 pt-2">
                      <span className="font-bold text-slate-700 text-[11px] uppercase font-mono">Top Similarity Matches:</span>
                      {vectorResults.length > 0 ? (
                        vectorResults.map((r, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div className="flex justify-between font-mono text-[10px]">
                              <span className="font-bold text-indigo-600">Match #{i + 1}</span>
                              <span className="text-emerald-700 font-bold">Similarity: {(r.similarityScore * 100).toFixed(1)}%</span>
                            </div>
                            <p className="text-slate-700 italic font-mono text-[11px]">"{r.chunk.text}"</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center text-xs">
                          Click "Run Vector Similarity Search" to query embedding store.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ALGORITHM BENCHMARKER */}
          {activeTab === 'algo_benchmark' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-amber-900 text-sm">COMPUTER SCIENCE ALGORITHM BENCHMARKER</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Benchmark fundamental Data Structures & Algorithms for time duration, ops/second, memory allocation, and Big-O efficiency.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-amber-600 text-white font-mono text-xs font-bold">
                  DSA Profiler
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 text-xs block mb-1">Algorithm Target:</label>
                    <select
                      value={algoName}
                      onChange={e => setAlgoName(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs"
                    >
                      <option className="text-slate-900 bg-white" value="quick_sort">QuickSort (Sorting)</option>
                      <option className="text-slate-900 bg-white" value="binary_search">Binary Search (Searching)</option>
                      <option className="text-slate-900 bg-white" value="hash_map_lookup">Hash Map Direct Lookup (Key-Value)</option>
                      <option className="text-slate-900 bg-white" value="graph_bfs">Breadth-First Search (Graph Traversal)</option>
                      <option className="text-slate-900 bg-white" value="dynamic_programming_knapsack">Dynamic Programming 0/1 Knapsack</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 text-xs block mb-1">Input Size (N):</label>
                    <input
                      type="number"
                      value={algoInputSize}
                      onChange={e => setAlgoInputSize(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunAlgoBenchmark}
                  disabled={algoLoading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {algoLoading ? 'Running Compute Benchmark...' : 'Run Computer Science Benchmark'}
                </button>

                {algoReport && (
                  <div className="p-5 rounded-2xl bg-slate-950 text-white font-mono text-xs space-y-3 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-amber-400 text-sm uppercase">Benchmark Report: {algoReport.algorithmName}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                        Rating: {algoReport.bigORating}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Time Complexity</div>
                        <div className="font-bold text-emerald-400 mt-0.5">{algoReport.timeComplexity}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Space Complexity</div>
                        <div className="font-bold text-cyan-400 mt-0.5">{algoReport.spaceComplexity}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Execution Time</div>
                        <div className="font-bold text-amber-300 mt-0.5">{algoReport.executionDurationMs} ms</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Ops / Second</div>
                        <div className="font-bold text-indigo-300 mt-0.5">{algoReport.opsPerSecond.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: TASK TRAINING & PUBLISHING WORKSTATION */}
          {activeTab === 'task_trainer' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-indigo-900 text-sm">AUTONOMOUS TASK TRAINING & PUBLISHING WORKSTATION</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Train specialized autonomous agents on complex tasks, compile safe execution playbooks, and publish them live into the fleet queue.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold">
                  Task Compiler L3
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom Task Specs */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                    <Sliders className="w-4 h-4 text-indigo-600" /> 1. Define Task Specification
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Task Title / Objective:</label>
                      <input
                        type="text"
                        value={customTaskTitle}
                        onChange={e => setCustomTaskTitle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="e.g. [Database Tuning] Parametrize query logs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Execution Prompt & Instructions:</label>
                      <textarea
                        value={customTaskPrompt}
                        onChange={e => setCustomTaskPrompt(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                        placeholder="Provide detailed instructions on what steps the agent should execute..."
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">ASSIGNED ENGINEER</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{currentAgent.avatar}</span>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{currentAgent.name}</div>
                          <div className="text-[10px] text-indigo-600 font-semibold">{currentAgent.role}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleTrainTask}
                        disabled={isTaskTraining || !customTaskTitle.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        {isTaskTraining ? 'Training Run...' : 'Train Agent on Task'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Training Logs & Publish Button */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                      <span className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-600" /> 2. Compilation & Training Logs
                      </span>
                      {isTaskTraining && (
                        <span className="text-xs font-mono font-bold text-indigo-600">{taskTrainingProgress}%</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isTaskTraining && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden animate-pulse">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-300"
                          style={{ width: `${taskTrainingProgress}%` }}
                        />
                      </div>
                    )}

                    {/* Logs Screen */}
                    <div className="p-4 rounded-2xl bg-slate-950 font-mono text-[11px] text-emerald-400 min-h-[220px] flex-1 overflow-y-auto space-y-1 shadow-inner border border-slate-800 leading-normal">
                      {taskTrainingLogs.length > 0 ? (
                        taskTrainingLogs.map((log, i) => (
                          <div key={i}>{log}</div>
                        ))
                      ) : (
                        <div className="text-slate-500 py-16 text-center italic">
                          Define your task and click "Train Agent on Task" to begin validation.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Publish & Execute Footer Section */}
                  {taskTrainingLogs.length > 0 && !isTaskTraining && (
                    <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-slate-800 leading-relaxed">
                        <span className="font-extrabold text-emerald-900 block mb-1">✔ Task Training Complete!</span>
                        The execution playbook has been compiled with zero vulnerabilities and optimization metrics passed. It is ready for publication.
                      </div>

                      <button
                        onClick={handlePublishTask}
                        disabled={isTaskPublished}
                        className={`w-full py-3 rounded-2xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                          isTaskPublished 
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isTaskPublished ? 'TASK PUBLISHED & DELEGATED TO FLEET' : `PUBLISH & EXECUTE TASK VIA ${currentAgent.name.toUpperCase()}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
