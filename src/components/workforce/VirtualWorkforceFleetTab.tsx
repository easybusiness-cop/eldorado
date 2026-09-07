import React, { useState, useEffect } from 'react';
import {
  Users,
  Cpu,
  Sparkles,
  Shield,
  Zap,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { soundFx } from '../../utils/speech';

export interface WorkforceRole {
  id: string;
  title: string;
  category: string;
  description: string;
  baseCapabilities: string[];
  systemPermissions: string[];
}

export interface WorkforceAgent {
  id: string;
  name: string;
  role: string;
  department: string;
  instructions: string;
  capabilities: string[];
  learnedCapabilities: string[];
  overallScore: number;
  scores: Record<
    string,
    {
      skill: string;
      score: number;
      confidence: number;
      attempts: number;
      successes: number;
      failures: number;
      evidence: string[];
      lastEvaluatedAt?: string;
      lastFailureReason?: string;
    }
  >;
  isDynamic: boolean;
}

export interface TaskAllocationResult {
  agentId: string;
  agentName: string;
  department: string;
  confidenceScore: number;
  reason: string;
  source: 'existing' | 'dynamically_spawned';
}

export const VirtualWorkforceFleetTab: React.FC = () => {
  const [agents, setAgents] = useState<WorkforceAgent[]>([]);
  const [roles, setRoles] = useState<WorkforceRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<WorkforceAgent | null>(null);

  // Spawning Form State
  const [isSpawningModalOpen, setIsSpawningModalOpen] = useState(false);
  const [spawnRoleId, setSpawnRoleId] = useState<string>('');
  const [spawnCustomName, setSpawnCustomName] = useState<string>('');
  const [spawnExtraCaps, setSpawnExtraCaps] = useState<string>('internet_research, data_analysis');
  const [spawnLoading, setSpawnLoading] = useState(false);

  // Task Solving / Matching State
  const [isSolvingModalOpen, setIsSolvingModalOpen] = useState(false);
  const [solveTaskDescription, setSolveTaskDescription] = useState('Analyze competitor market positioning and compile comparison brief');
  const [solveSkills, setSolveSkills] = useState('market_research, competitor_analysis');
  const [solveDept, setSolveDept] = useState('marketing');
  const [solveLoading, setSolveLoading] = useState(false);
  const [allocationResult, setAllocationResult] = useState<TaskAllocationResult | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadWorkforceData = async () => {
    setLoading(true);
    try {
      const [agentsRes, rolesRes] = await Promise.all([
        fetch('/api/autonomy/workforce/agents').then((r) => r.json()).catch(() => ({ agents: [] })),
        fetch('/api/autonomy/workforce/roles').then((r) => r.json()).catch(() => ({ roles: [] })),
      ]);

      if (agentsRes.agents) setAgents(agentsRes.agents);
      if (rolesRes.roles) {
        setRoles(rolesRes.roles);
        if (rolesRes.roles.length > 0 && !spawnRoleId) {
          setSpawnRoleId(rolesRes.roles[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load workforce data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkforceData();
  }, []);

  const handleSpawnEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spawnRoleId) return;
    soundFx.playClick();
    setSpawnLoading(true);

    try {
      const caps = spawnExtraCaps
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const res = await fetch('/api/autonomy/workforce/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: spawnRoleId,
          customName: spawnCustomName.trim() || undefined,
          extraCapabilities: caps,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage(`Spawned specialized employee: ${data.employee.name}`);
        setIsSpawningModalOpen(false);
        setSpawnCustomName('');
        await loadWorkforceData();
      } else {
        setActionMessage(`Failed to spawn: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Error spawning employee: ${err.message}`);
    } finally {
      setSpawnLoading(false);
      setTimeout(() => setActionMessage(null), 6000);
    }
  };

  const handleSolveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solveTaskDescription) return;
    soundFx.playClick();
    setSolveLoading(true);
    setAllocationResult(null);

    try {
      const caps = solveSkills
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const res = await fetch('/api/autonomy/workforce/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription: solveTaskDescription,
          requiredCapabilities: caps,
          preferredDepartment: solveDept || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAllocationResult(data.allocation);
        await loadWorkforceData();
      } else {
        setActionMessage(`Allocation failed: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Error matching employee: ${err.message}`);
    } finally {
      setSolveLoading(false);
    }
  };

  // Filtered employees
  const filteredAgents = agents.filter((ag) => {
    const matchesSearch =
      ag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = filterDept === 'all' || ag.department.toLowerCase() === filterDept.toLowerCase();

    return matchesSearch && matchesDept;
  });

  // Calculate fleet stats
  const dynamicCount = agents.filter((a) => a.isDynamic).length;
  const avgFleetScore =
    agents.length > 0
      ? (agents.reduce((acc, a) => acc + (a.overallScore || 0.7), 0) / agents.length) * 100
      : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fbf1c7] text-[#3c3836]">
      {/* HEADER CONTROLS */}
      <div className="bg-[#f9f5d7] border-b border-[#d5c4a1] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#b57614]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#282828]">
              Unlimited Virtual Workforce
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs border-l border-[#d5c4a1] pl-4 text-[#7c6f64]">
            <span>Active Fleet: <strong className="text-[#282828] font-black">{agents.length}</strong></span>
            <span>Dynamic Specialists: <strong className="text-[#427b58] font-black">{dynamicCount}</strong></span>
            <span>Fleet Capability Avg: <strong className="text-[#076678] font-black">{avgFleetScore.toFixed(0)}%</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { soundFx.playClick(); setIsSolvingModalOpen(true); }}
            className="px-3 py-1.5 rounded bg-[#076678] hover:bg-[#054b58] text-[#fbf1c7] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Match / Solve Task
          </button>

          <button
            onClick={() => { soundFx.playClick(); setIsSpawningModalOpen(true); }}
            className="px-3 py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + Spawn Specialized Employee
          </button>

          <button
            onClick={loadWorkforceData}
            title="Refresh Workforce"
            className="p-1.5 rounded hover:bg-[#ebdbb2] text-[#7c6f64] hover:text-[#282828] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS ALERT */}
      {actionMessage && (
        <div className="bg-[#b8bb26]/20 border-b border-[#98971a] px-6 py-2 text-xs font-bold text-[#282828] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#427b58]" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-[#ebdbb2] border-b border-[#d5c4a1] px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7c6f64]" />
          <input
            type="text"
            placeholder="Search virtual employee name, role, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-[#fbf1c7] border border-[#d5c4a1] rounded focus:outline-none focus:border-[#b57614] text-[#3c3836]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#7c6f64]">Department:</span>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-[#fbf1c7] border border-[#d5c4a1] rounded px-2 py-1 text-xs text-[#3c3836] font-bold focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="marketing">Marketing</option>
            <option value="research">Research</option>
            <option value="operations">Operations</option>
            <option value="executive">Executive</option>
            <option value="finance">Finance</option>
            <option value="legal">Legal</option>
            <option value="sales">Sales</option>
          </select>
        </div>
      </div>

      {/* FLEET ROSTER GRID */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {filteredAgents.map((agent) => {
            const scorePercent = Math.round((agent.overallScore || 0.7) * 100);
            return (
              <div
                key={agent.id}
                onClick={() => { soundFx.playClick(); setSelectedAgent(agent); }}
                className={`bg-[#f9f5d7] border rounded-lg p-4 shadow-sm hover:border-[#bdae93] transition-all cursor-pointer flex flex-col justify-between ${
                  selectedAgent?.id === agent.id ? 'border-[#b57614] ring-2 ring-[#b57614]/30' : 'border-[#d5c4a1]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-[#7c6f64] px-1.5 py-0.5 rounded bg-[#ebdbb2]">
                      {agent.id}
                    </span>
                    <div className="flex items-center gap-1">
                      {agent.isDynamic ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#b8bb26]/20 text-[#427b58] border border-[#98971a]">
                          Dynamic Specialist
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#ebdbb2] text-[#504945]">
                          Core Fleet
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-[#282828] mb-0.5">{agent.name}</h4>
                  <div className="text-xs font-bold text-[#b57614] uppercase mb-2">
                    {agent.role} · <span className="text-[#076678]">{agent.department}</span>
                  </div>

                  {/* CAPABILITY SCORE BAR */}
                  <div className="mb-3 bg-[#ebdbb2] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        scorePercent >= 80 ? 'bg-[#427b58]' : scorePercent >= 60 ? 'bg-[#b57614]' : 'bg-[#cc241d]'
                      }`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>

                  {/* CAPABILITIES BADGES */}
                  <div className="space-y-1.5 mb-3">
                    <div className="text-[10px] uppercase font-bold text-[#7c6f64]">
                      Assigned Capabilities ({agent.capabilities.length}):
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                      {agent.capabilities.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ebdbb2] text-[#3c3836]"
                        >
                          {c}
                        </span>
                      ))}
                      {agent.capabilities.length > 4 && (
                        <span className="text-[9px] font-bold text-[#7c6f64] px-1">
                          +{agent.capabilities.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* LEARNED CAPABILITIES FROM RADAR */}
                    {agent.learnedCapabilities && agent.learnedCapabilities.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[9px] uppercase font-bold text-[#427b58] flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Self-Taught via Web Radar ({agent.learnedCapabilities.length}):
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {agent.learnedCapabilities.map((lc) => (
                            <span
                              key={lc}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#b8bb26]/20 text-[#427b58] border border-[#98971a]/40"
                            >
                              {lc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#ebdbb2] text-[10px] text-[#7c6f64]">
                  <span>Score: <strong className="text-[#282828]">{scorePercent}%</strong></span>
                  <span className="text-[#076678] font-bold hover:underline flex items-center gap-0.5">
                    View Dossier <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: SPAWN SPECIALIZED VIRTUAL EMPLOYEE */}
      {isSpawningModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-xl max-w-lg w-full p-6 shadow-2xl font-mono text-[#3c3836]">
            <div className="flex items-center justify-between border-b-2 border-[#d5c4a1] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#b57614]" />
                <h3 className="text-sm font-black text-[#282828] uppercase">
                  Spawn Specialized Virtual Employee
                </h3>
              </div>
              <button
                onClick={() => setIsSpawningModalOpen(false)}
                className="w-7 h-7 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSpawnEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#282828] mb-1">Select Base Role Definition:</label>
                <select
                  value={spawnRoleId}
                  onChange={(e) => setSpawnRoleId(e.target.value)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs text-[#3c3836] font-bold"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.category.toUpperCase()}] {r.title}
                    </option>
                  ))}
                </select>
                {roles.find((r) => r.id === spawnRoleId) && (
                  <p className="text-[10px] text-[#7c6f64] mt-1 leading-normal">
                    {roles.find((r) => r.id === spawnRoleId)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#282828] mb-1">Custom Employee Designation (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Distributed Architect"
                  value={spawnCustomName}
                  onChange={(e) => setSpawnCustomName(e.target.value)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs text-[#3c3836]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#282828] mb-1">
                  Extra Capabilities (Comma-Separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. internet_research, software_development, data_analysis"
                  value={spawnExtraCaps}
                  onChange={(e) => setSpawnExtraCaps(e.target.value)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs text-[#3c3836]"
                />
              </div>

              <div className="pt-3 border-t border-[#d5c4a1] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSpawningModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={spawnLoading}
                  className="px-4 py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  {spawnLoading ? 'Spawning...' : 'Deploy Virtual Specialist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOLVE TASK / EMPLOYEE MATCHING */}
      {isSolvingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-xl max-w-lg w-full p-6 shadow-2xl font-mono text-[#3c3836]">
            <div className="flex items-center justify-between border-b-2 border-[#d5c4a1] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#076678]" />
                <h3 className="text-sm font-black text-[#282828] uppercase">
                  Match & Allocate Employee For Task
                </h3>
              </div>
              <button
                onClick={() => { setIsSolvingModalOpen(false); setAllocationResult(null); }}
                className="w-7 h-7 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSolveTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#282828] mb-1">Task Specification:</label>
                <textarea
                  rows={3}
                  value={solveTaskDescription}
                  onChange={(e) => setSolveTaskDescription(e.target.value)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs text-[#3c3836]"
                  placeholder="Describe the objective..."
                />
              </div>

              <div>
                <label className="block font-bold text-[#282828] mb-1">Required Capabilities (Comma-separated):</label>
                <input
                  type="text"
                  value={solveSkills}
                  onChange={(e) => setSolveSkills(e.target.value)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs text-[#3c3836]"
                  placeholder="e.g. software_development, debugging"
                />
              </div>

              <div>
                <label className="block font-bold text-[#282828] mb-1">Preferred Department (Optional):</label>
                <select
                  value={solveDept}
                  onChange={(e) => setSolveDept(e.target.value)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs text-[#3c3836]"
                >
                  <option value="">Any Department</option>
                  <option value="engineering">Engineering</option>
                  <option value="marketing">Marketing</option>
                  <option value="research">Research</option>
                  <option value="operations">Operations</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={solveLoading}
                  className="px-4 py-2 rounded bg-[#076678] hover:bg-[#054b58] text-[#fbf1c7] font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  {solveLoading ? 'Evaluating Fleet...' : 'Dispatch / Allocate Best Employee'}
                </button>
              </div>
            </form>

            {/* ALLOCATION RESULT CARD */}
            {allocationResult && (
              <div className="mt-4 pt-4 border-t-2 border-[#d5c4a1] bg-[#f9f5d7] p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#b8bb26]/20 text-[#427b58] border border-[#98971a]">
                    Allocated: {allocationResult.source === 'dynamically_spawned' ? 'Spawned Specialist' : 'Existing Employee'}
                  </span>
                  <span className="text-xs font-black text-[#076678]">
                    Confidence: {(allocationResult.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="text-xs font-black text-[#282828] mb-1">
                  {allocationResult.agentName} ({allocationResult.agentId})
                </div>
                <div className="text-[11px] text-[#504945] leading-relaxed mb-2">
                  {allocationResult.reason}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EMPLOYEE DOSSIER */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-xl max-w-2xl w-full p-6 shadow-2xl font-mono text-[#3c3836] flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b-2 border-[#d5c4a1] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-[#282828] uppercase">{selectedAgent.name}</h3>
                <span className="text-[10px] text-[#7c6f64] font-bold">
                  {selectedAgent.role} · Department: {selectedAgent.department.toUpperCase()} · ID: {selectedAgent.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="w-7 h-7 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-2">
              <div>
                <h5 className="font-black uppercase text-[#282828] mb-1 text-[11px]">System Instructions:</h5>
                <pre className="p-3 bg-[#f9f5d7] border border-[#d5c4a1] rounded whitespace-pre-wrap text-[10px] leading-relaxed text-[#504945]">
                  {selectedAgent.instructions}
                </pre>
              </div>

              <div>
                <h5 className="font-black uppercase text-[#282828] mb-1 text-[11px]">
                  All Capabilities & Scored History:
                </h5>
                <div className="space-y-2">
                  {selectedAgent.capabilities.map((cap) => {
                    const scoreData = selectedAgent.scores?.[cap];
                    return (
                      <div key={cap} className="bg-[#f9f5d7] border border-[#d5c4a1] p-2.5 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#282828]">{cap}</span>
                          <span className="font-bold text-[#076678]">
                            Score: {scoreData ? (scoreData.score * 100).toFixed(0) : '70'}%
                          </span>
                        </div>
                        {scoreData && (
                          <div className="flex gap-4 text-[10px] text-[#7c6f64]">
                            <span>Attempts: {scoreData.attempts}</span>
                            <span>Successes: {scoreData.successes}</span>
                            <span>Failures: {scoreData.failures}</span>
                            <span>Confidence: {(scoreData.confidence * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#d5c4a1] flex justify-end">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-1.5 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] text-xs font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
