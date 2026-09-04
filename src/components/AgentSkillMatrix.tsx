import React, { useState, useMemo } from 'react';
import { Agent, SkillMatrixCategory, AgentSkillProfile, PersonalizedLearningModule } from '../types';
import { soundFx } from '../utils/speech';
import {
  GraduationCap,
  Sparkles,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Zap,
  BarChart2,
  Atom,
  Search,
  Filter,
  Check,
  Clock,
  Shield,
} from 'lucide-react';

interface AgentSkillMatrixProps {
  agents: Agent[];
  onOpenAgentProfile?: (agentId: string) => void;
  onRecordKnowledge?: (entry: { title: string; category: string; content: string }) => void;
}

const CATEGORY_METADATA: Record<
  SkillMatrixCategory,
  { label: string; icon: string; description: string; benchmark: number; color: string }
> = {
  marketing: {
    label: 'Marketing & Sales',
    icon: '📢',
    description: 'Wholesale client acquisition, retention loops, cold calling & digital funnels',
    benchmark: 75,
    color: '#fabd2f',
  },
  finance: {
    label: 'Finance & Accounting',
    icon: '📊',
    description: 'General ledger auditing, margin optimization, petty cash & GAAP compliance',
    benchmark: 75,
    color: '#427b58',
  },
  coding: {
    label: 'Coding & Engineering',
    icon: '💻',
    description: 'TypeScript, sandboxed execution, defensive middleware & compiler AST audits',
    benchmark: 75,
    color: '#076678',
  },
  security: {
    label: 'Security & Cyber Defense',
    icon: '🛡️',
    description: 'Zero-trust architecture, biometric verification, CVE patches & egress lockdown',
    benchmark: 75,
    color: '#cc241d',
  },
  operations: {
    label: 'Operations & Compliance',
    icon: '⚙️',
    description: 'Inter-office workflows, executive memo formatting, SLA tracking & HR guidelines',
    benchmark: 75,
    color: '#b16286',
  },
  quantum: {
    label: 'Quantum Superposition',
    icon: '⚛️',
    description: 'Grover amplitude amplification, multi-path evaluation & wavefunction collapse',
    benchmark: 75,
    color: '#b57614',
  },
};

const DEFAULT_AGENT_SCORES: Record<string, Record<SkillMatrixCategory, number>> = {
  michael: { marketing: 88, finance: 46, coding: 28, security: 42, operations: 72, quantum: 85 },
  dwight: { marketing: 65, finance: 76, coding: 88, security: 98, operations: 92, quantum: 91 },
  jim: { marketing: 96, finance: 72, coding: 44, security: 48, operations: 82, quantum: 78 },
  pam: { marketing: 79, finance: 74, coding: 52, security: 68, operations: 98, quantum: 82 },
  kevin: { marketing: 36, finance: 89, coding: 38, security: 44, operations: 66, quantum: 68 },
  ryan: { marketing: 93, finance: 44, coding: 78, security: 56, operations: 64, quantum: 76 },
  toby: { marketing: 32, finance: 74, coding: 46, security: 84, operations: 96, quantum: 54 },
  ruflo: { marketing: 48, finance: 72, coding: 99, security: 95, operations: 86, quantum: 98 },
};

const DEFAULT_CURRICULUM_CATALOG: Record<
  SkillMatrixCategory,
  { title: string; desc: string; xp: number; boost: number; time: number }
> = {
  coding: {
    title: 'Defensive TypeScript & Ledger Verifiers',
    desc: 'Interactive sandbox exercises on building non-blocking data verifiers, parameterized sanitizers, and unit testing suites.',
    xp: 450,
    boost: 24,
    time: 15,
  },
  finance: {
    title: 'GAAP Compliance & Unit Margin Engineering',
    desc: 'Audit real-world paper inventory balance sheets, spot double-spend ledger anomalies, and calculate cost-of-goods-sold.',
    xp: 420,
    boost: 22,
    time: 12,
  },
  marketing: {
    title: 'High-Value Client Diplomacy & Account Retention',
    desc: 'De-escalation playbooks, multi-channel wholesale contract negotiations, and empirical customer churn mitigation.',
    xp: 400,
    boost: 20,
    time: 10,
  },
  security: {
    title: 'Zero-Trust Perimeter Defense & Scoped Egress',
    desc: 'Configuring ephemeral HMAC bearer tokens, TLS 1.3 mutual handshake audits, and automated CVE remediation.',
    xp: 480,
    boost: 25,
    time: 14,
  },
  operations: {
    title: 'Executive Inter-Office SLA & Memo Dissemination',
    desc: 'Distilling high-entropy strategic visions into structured 2-page operational briefs with zero compliance regression.',
    xp: 380,
    boost: 21,
    time: 10,
  },
  quantum: {
    title: 'Quantum Wavefunction Superposition & Grover Search',
    desc: 'Evaluating 4 parallel software pathways in superposition, calculating phase amplitude shifts, and collapsing wavefunctions.',
    xp: 500,
    boost: 26,
    time: 18,
  },
};

export const AgentSkillMatrix: React.FC<AgentSkillMatrixProps> = ({
  agents,
  onOpenAgentProfile,
  onRecordKnowledge,
}) => {
  // Stored training levels in localStorage
  const [skillStore, setSkillStore] = useState<Record<string, Record<SkillMatrixCategory, number>>>(() => {
    try {
      const saved = localStorage.getItem('munderdifflin_agent_skills');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return DEFAULT_AGENT_SCORES;
  });

  const [selectedCategory, setSelectedCategory] = useState<SkillMatrixCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrainingModule, setActiveTrainingModule] = useState<PersonalizedLearningModule | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('munderdifflin_completed_modules');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Calculate full profiles for all agents in the fleet
  const agentProfiles: AgentSkillProfile[] = useMemo(() => {
    return agents.map((agent) => {
      const baseScores = skillStore[agent.id] || {
        marketing: Math.floor(Math.random() * 30) + 50,
        finance: Math.floor(Math.random() * 30) + 50,
        coding: Math.floor(Math.random() * 30) + 50,
        security: Math.floor(Math.random() * 30) + 50,
        operations: Math.floor(Math.random() * 30) + 50,
        quantum: Math.floor(Math.random() * 30) + 50,
      };

      const categories: SkillMatrixCategory[] = ['marketing', 'finance', 'coding', 'security', 'operations', 'quantum'];
      let lowestCat: SkillMatrixCategory = 'marketing';
      let lowestScore = 100;
      let total = 0;

      categories.forEach((cat) => {
        const score = baseScores[cat];
        total += score;
        if (score < lowestScore) {
          lowestScore = score;
          lowestCat = cat;
        }
      });

      const avg = Math.round(total / categories.length);
      const severity = lowestScore < 50 ? 'critical' : lowestScore < 70 ? 'medium' : 'low';

      return {
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
        agentAvatar: agent.avatar,
        agentColor: agent.color || '#b57614',
        department: agent.departmentName || agent.department || 'General Fleet',
        scores: baseScores,
        overallCompetency: avg,
        identifiedGapCategory: lowestCat,
        identifiedGapScore: lowestScore,
        gapSeverity: severity,
      };
    });
  }, [agents, skillStore]);

  // Generate personalized learning recommendations based on performance gaps
  const recommendedModules: PersonalizedLearningModule[] = useMemo(() => {
    return agentProfiles.map((profile) => {
      const gapCat = profile.identifiedGapCategory;
      const catalog = DEFAULT_CURRICULUM_CATALOG[gapCat];
      const modId = `mod-${profile.agentId}-${gapCat}`;

      return {
        id: modId,
        title: `${catalog.title}`,
        category: gapCat,
        targetAgentId: profile.agentId,
        targetAgentName: profile.agentName,
        gapIdentified: `${CATEGORY_METADATA[gapCat].label} currently at ${profile.identifiedGapScore}% (Benchmark: ${CATEGORY_METADATA[gapCat].benchmark}%)`,
        curriculumOverview: catalog.desc,
        xpReward: catalog.xp,
        durationMinutes: catalog.time,
        projectedProficiencyBoost: catalog.boost,
        projectedSynergyBoost: Math.round(catalog.boost * 0.6),
        isCompleted: completedModules.includes(modId),
      };
    });
  }, [agentProfiles, completedModules]);

  // Filtered agent profiles
  const filteredProfiles = useMemo(() => {
    return agentProfiles.filter((p) => {
      const matchesSearch =
        p.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.agentRole.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [agentProfiles, searchQuery]);

  // Execute Simulated Training Module
  const handleStartTraining = (module: PersonalizedLearningModule) => {
    soundFx.playClick();
    setActiveTrainingModule(module);
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([
      `[00:01] Enrolling ${module.targetAgentName} into "${module.title}"...`,
      `[00:02] Loading domain curriculum from Scranton CSE Repository...`,
      `[00:04] Initializing interactive sandbox environment...`,
    ]);

    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleFinishTraining(module);
          return 100;
        }

        const next = prev + 25;
        if (next === 50) {
          setTrainingLogs((logs) => [
            ...logs,
            `[00:08] Executing practical unit benchmark tests... All assertions green.`,
          ]);
        } else if (next === 75) {
          setTrainingLogs((logs) => [
            ...logs,
            `[00:12] Grover oracle amplifying domain amplitude coefficients (+${module.projectedProficiencyBoost}% boost)...`,
          ]);
        }
        return next;
      });
    }, 600);
  };

  const handleFinishTraining = (module: PersonalizedLearningModule) => {
    soundFx.playSuccessChime();
    setIsTraining(false);

    // 1. Update score in state and localStorage
    setSkillStore((prev) => {
      const agentScores = prev[module.targetAgentId] || { ...DEFAULT_AGENT_SCORES.michael };
      const currentVal = agentScores[module.category] || 50;
      const updatedVal = Math.min(99, currentVal + module.projectedProficiencyBoost);

      const updated = {
        ...prev,
        [module.targetAgentId]: {
          ...agentScores,
          [module.category]: updatedVal,
        },
      };

      try {
        localStorage.setItem('munderdifflin_agent_skills', JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    // 2. Mark module as completed
    const newCompleted = [...completedModules, module.id];
    setCompletedModules(newCompleted);
    try {
      localStorage.setItem('munderdifflin_completed_modules', JSON.stringify(newCompleted));
    } catch (e) {}

    // 3. Record certified milestone in Knowledge Base
    if (onRecordKnowledge) {
      onRecordKnowledge({
        title: `CERTIFICATION: ${module.targetAgentName} completed ${module.title}`,
        category: 'training',
        content: `${module.targetAgentName} has successfully completed the accelerated module "${module.title}" targeting their ${CATEGORY_METADATA[module.category].label} gap. Domain competency elevated by +${module.projectedProficiencyBoost}%.`,
      });
    }

    setTrainingLogs((logs) => [
      ...logs,
      `[00:15] Certified! ${module.targetAgentName} earned +${module.xpReward} XP. Skill matrix calibrated.`,
    ]);
  };

  // Helper for score badge styling
  const getScoreStyle = (score: number) => {
    if (score >= 90) return { bg: 'bg-[#b8bb26]/20 text-[#427b58] border-[#b8bb26]', label: 'Master' };
    if (score >= 75) return { bg: 'bg-[#fabd2f]/25 text-[#b57614] border-[#d79921]', label: 'Advanced' };
    if (score >= 55) return { bg: 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1]', label: 'Competent' };
    return { bg: 'bg-[#cc241d]/15 text-[#cc241d] border-[#cc241d]', label: 'Gap' };
  };

  return (
    <div id="agent-skill-matrix-section" className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black uppercase text-[#282828] tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#b57614]" />
              Scranton Agent Skill Matrix & Competency Heatmap
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#427b58] text-[#fbf1c7] border border-[#427b58] flex items-center gap-1">
              <Award className="w-3 h-3 text-[#b8bb26]" />
              PERFORMANCE GAP AUDITING ACTIVE
            </span>
          </div>
          <p className="text-xs text-[#7c6f64] mt-1 leading-relaxed">
            Multi-dimensional training matrix tracking autonomous agent competencies across Marketing, Finance, Coding, Security, Operations, and Quantum Reasoning. Personalized learning modules are curated automatically to eliminate performance bottlenecks.
          </p>
        </div>

        {/* TOP SUMMARY STATS */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-[#fbf1c7] border border-[#d5c4a1] rounded-lg px-3 py-1.5 text-center shadow-xs">
            <div className="text-[9px] font-bold uppercase text-[#7c6f64]">Certified Modules</div>
            <div className="text-lg font-black text-[#427b58] flex items-center justify-center gap-1">
              <span>{completedModules.length}</span>
              <span className="text-xs text-[#7c6f64]">/ {recommendedModules.length}</span>
            </div>
          </div>

          <div className="bg-[#fbf1c7] border border-[#d5c4a1] rounded-lg px-3 py-1.5 text-center shadow-xs">
            <div className="text-[9px] font-bold uppercase text-[#7c6f64]">Fleet Benchmark</div>
            <div className="text-lg font-black text-[#b57614]">75%</div>
          </div>
        </div>
      </div>

      {/* SEARCH AND CATEGORY FILTER */}
      <div className="bg-[#fbf1c7] border-2 border-[#d5c4a1] rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#7c6f64]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name or role title..."
            className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded px-2.5 py-1 text-xs outline-none focus:border-[#b57614] font-medium text-[#282828]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase text-[#7c6f64]">Highlight Domain:</span>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#b57614] text-[#fbf1c7] border-[#b57614]'
                  : 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1]'
              }`}
            >
              All (6)
            </button>
            {(Object.keys(CATEGORY_METADATA) as SkillMatrixCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-[#282828] text-[#fbf1c7] border-[#1d2021]'
                    : 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1]'
                }`}
              >
                <span>{CATEGORY_METADATA[cat].icon}</span>
                <span className="hidden sm:inline">{CATEGORY_METADATA[cat].label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MATRIX TABLE VIEW */}
      <div className="bg-[#fbf1c7] border-2 border-[#bdae93] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#ebdbb2] border-b-2 border-[#d5c4a1] text-[#282828] font-black uppercase text-[10px] tracking-wider">
                <th className="p-3.5 min-w-[180px]">Agent Profile</th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>📢</span>
                    <span>Marketing</span>
                  </div>
                </th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>📊</span>
                    <span>Finance</span>
                  </div>
                </th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>💻</span>
                    <span>Coding</span>
                  </div>
                </th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>🛡️</span>
                    <span>Security</span>
                  </div>
                </th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>⚙️</span>
                    <span>Operations</span>
                  </div>
                </th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>⚛️</span>
                    <span>Quantum</span>
                  </div>
                </th>
                <th className="p-3 text-center min-w-[140px]">Performance Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebdbb2]">
              {filteredProfiles.map((profile) => {
                const isLeader = profile.overallCompetency >= 80;
                return (
                  <tr
                    key={profile.agentId}
                    className="hover:bg-[#f9f5d7] transition-colors"
                  >
                    {/* AGENT IDENTITY CELL */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 overflow-hidden"
                          style={{ backgroundColor: profile.agentColor }}
                        >
                          {profile.agentAvatar && profile.agentAvatar.startsWith('http') ? (
                            <img src={profile.agentAvatar} alt={profile.agentName} className="w-full h-full object-cover" />
                          ) : (
                            profile.agentName[0]
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#282828] flex items-center gap-1.5">
                            <span>{profile.agentName}</span>
                            {isLeader && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#fabd2f] text-[#282828] font-bold">
                                Elite
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#7c6f64] truncate max-w-[140px]">
                            {profile.agentRole}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY SCORES */}
                    {(['marketing', 'finance', 'coding', 'security', 'operations', 'quantum'] as SkillMatrixCategory[]).map(
                      (cat) => {
                        const score = profile.scores[cat];
                        const style = getScoreStyle(score);
                        const isHighlighted = selectedCategory === cat;
                        const isLowest = profile.identifiedGapCategory === cat;

                        return (
                          <td
                            key={cat}
                            className={`p-2.5 text-center font-mono transition-all ${
                              isHighlighted ? 'bg-[#b57614]/10' : ''
                            }`}
                          >
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold border ${style.bg} ${
                                  isLowest ? 'ring-2 ring-[#cc241d]/40 animate-pulse' : ''
                                }`}
                                title={`${CATEGORY_METADATA[cat].label}: ${score}% (${style.label})`}
                              >
                                {score}%
                              </span>
                              <div className="w-12 bg-[#d5c4a1] h-1 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${
                                    score >= 75 ? 'bg-[#427b58]' : score >= 50 ? 'bg-[#b57614]' : 'bg-[#cc241d]'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        );
                      }
                    )}

                    {/* PERFORMANCE GAP SUMMARY CELL */}
                    <td className="p-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                            profile.gapSeverity === 'critical'
                              ? 'bg-[#cc241d]/15 text-[#cc241d] border-[#cc241d]/40'
                              : 'bg-[#fabd2f]/20 text-[#b57614] border-[#d79921]/40'
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          <span>{CATEGORY_METADATA[profile.identifiedGapCategory].label.split(' ')[0]}</span>
                          <span className="font-mono">({profile.identifiedGapScore}%)</span>
                        </span>
                        <span className="text-[9px] text-[#7c6f64] mt-0.5">
                          {CATEGORY_METADATA[profile.identifiedGapCategory].benchmark - profile.identifiedGapScore}% below benchmark
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PERSONALIZED LEARNING MODULE RECOMMENDATIONS SECTION */}
      <div className="bg-[#fbf1c7] border-2 border-[#bdae93] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#d5c4a1] pb-3">
          <div>
            <h3 className="text-base font-black text-[#282828] flex items-center gap-2 uppercase tracking-wide">
              <span>📚</span> Suggested Personalized Learning Modules
            </h3>
            <p className="text-xs text-[#7c6f64] mt-0.5">
              Targeted curriculum modules automatically generated based on detected agent performance gaps
            </p>
          </div>
          <span className="text-xs font-bold text-[#b57614] bg-[#f9f5d7] px-2.5 py-1 rounded border border-[#d5c4a1]">
            {recommendedModules.filter((m) => !m.isCompleted).length} Pending Enhancements
          </span>
        </div>

        {/* MODULE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedModules.map((mod) => {
            const meta = CATEGORY_METADATA[mod.category];
            const isFinished = mod.isCompleted;

            return (
              <div
                key={mod.id}
                className={`bg-[#ebdbb2] border-2 rounded-lg p-4 shadow-xs flex flex-col justify-between transition-all ${
                  isFinished
                    ? 'border-[#b8bb26] bg-[#f9f5d7]/50 opacity-80'
                    : 'border-[#d5c4a1] hover:border-[#b57614]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xl">{meta.icon}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                        isFinished
                          ? 'bg-[#b8bb26]/20 text-[#427b58] border-[#b8bb26]'
                          : 'bg-[#cc241d]/15 text-[#cc241d] border-[#cc241d]/30'
                      }`}
                    >
                      {isFinished ? '✓ Certified' : 'Performance Gap Detected'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#282828] leading-tight">
                    {mod.title}
                  </h4>

                  <div className="text-[11px] text-[#7c6f64] font-medium mt-1">
                    Target Agent: <strong className="text-[#3c3836]">{mod.targetAgentName}</strong>
                  </div>

                  <div className="text-[10px] text-[#cc241d] font-mono bg-[#fbf1c7] px-2 py-1 rounded border border-[#d5c4a1] my-2">
                    {mod.gapIdentified}
                  </div>

                  <p className="text-xs text-[#504945] leading-relaxed line-clamp-2">
                    {mod.curriculumOverview}
                  </p>
                </div>

                {/* MODULE FOOTER & ACTION */}
                <div className="pt-3 mt-3 border-t border-[#d5c4a1] flex items-center justify-between gap-2">
                  <div className="text-[10px] text-[#7c6f64] font-mono">
                    <span className="text-[#427b58] font-bold">+{mod.projectedProficiencyBoost}% Boost</span> · {mod.xpReward} XP
                  </div>

                  {isFinished ? (
                    <span className="text-xs font-bold text-[#427b58] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-[#b8bb26]" />
                      Certified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleStartTraining(mod)}
                      disabled={isTraining}
                      className="px-3 py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] disabled:opacity-50 text-[#fbf1c7] text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Enroll & Train</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TRAINING SIMULATION MODAL */}
      {isTraining && activeTrainingModule && (
        <div className="fixed inset-0 bg-[#1d2021]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#fbf1c7] border-4 border-[#b57614] rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#d5c4a1] pb-3">
              <div className="flex items-center gap-2">
                <Atom className="w-5 h-5 text-[#b57614] animate-spin" />
                <div>
                  <h3 className="text-sm font-black text-[#282828] uppercase">
                    Accelerated Agent Training
                  </h3>
                  <div className="text-[10px] text-[#7c6f64]">
                    {activeTrainingModule.targetAgentName} · {activeTrainingModule.title}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#b57614]">{trainingProgress}%</span>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-[#d5c4a1] h-3 rounded-full overflow-hidden p-0.5 border border-[#bdae93]">
              <div
                className="bg-[#b57614] h-full rounded-full transition-all duration-300"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>

            {/* LIVE SIMULATION LOGS */}
            <div className="bg-[#1d2021] text-[#ebdbb2] p-3 rounded font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto border border-[#3c3836]">
              {trainingLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#fabd2f]">›</span>
                  <span className={idx === trainingLogs.length - 1 ? 'text-[#b8bb26] font-bold' : 'text-[#a89984]'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center text-[10px] text-[#7c6f64] italic">
              Compiling exercises, validating unit test harnesses & recalculating quantum alignment...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
