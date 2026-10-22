import React, { useMemo, useState } from 'react';
import type { Agent } from '../types';
import { getAvatarInitials, isLocalAvatar } from '../utils/avatar';
import {
  ArrowUpRight,
  BrainCircuit,
  Code2,
  Layers3,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  ENGINEERING_AGENT_COMPETENCIES,
  PROGRAMMING_LANGUAGES,
  isEngineeringRelatedAgent,
} from '../constants/engineeringCompetencies';

interface AgentSkillMatrixProps {
  agents: Agent[];
  onOpenAgentProfile?: (agentId: string) => void;
}

const OOP_CONCEPTS = [
  'Classes and objects',
  'Constructors',
  'Encapsulation',
  'Abstraction',
  'Inheritance',
  'Polymorphism',
  'Composition',
];

const PROBLEM_SOLVING_CONCEPTS = [
  'Requirements decomposition',
  'Arrays and linked lists',
  'Stacks and queues',
  'Hash maps',
  'Trees and graphs',
  'Recursion',
  'Searching and sorting',
  'Big-O time and space analysis',
  'Edge cases and trade-offs',
];

const CORE_CAPABILITIES = new Set(ENGINEERING_AGENT_COMPETENCIES.map((item) => item.toLowerCase()));

function getAssignedSkills(agent: Agent): string[] {
  const skills = [
    ...(agent.skills || []).map((skill) => skill.name),
    ...(agent.secondarySkills || []),
    ...(agent.capabilities || []),
  ];
  const seen = new Set<string>();

  return skills.filter((skill) => {
    const normalized = skill.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

const SkillPills: React.FC<{ items: readonly string[] }> = ({ items }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((item) => (
      <span
        key={item}
        className="rounded-full border border-[#d5c4a1] bg-[#f9f5d7] px-2.5 py-1 text-[10px] font-semibold text-[#3c3836]"
      >
        {item}
      </span>
    ))}
  </div>
);

export const AgentSkillMatrix: React.FC<AgentSkillMatrixProps> = ({ agents, onOpenAgentProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllAgents, setShowAllAgents] = useState(false);

  const engineeringAgents = useMemo(
    () => agents.filter(isEngineeringRelatedAgent),
    [agents],
  );

  const filteredAgents = useMemo(() => {
    const source = showAllAgents ? agents : engineeringAgents;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return source;

    return source.filter((agent) => {
      const searchable = [
        agent.name,
        agent.role,
        agent.title,
        agent.departmentName,
        agent.department,
        ...getAssignedSkills(agent),
      ].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(query);
    });
  }, [agents, engineeringAgents, searchQuery, showAllAgents]);

  return (
    <div id="agent-skill-matrix-section" className="space-y-6">
      <section className="rounded-lg border-2 border-[#d5c4a1] bg-[#ebdbb2] p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#282828]">
                <Code2 className="h-4 w-4 text-[#076678]" />
                Agent Capability Profiles
              </h2>
              <span className="inline-flex items-center gap-1 rounded border border-[#427b58] bg-[#427b58] px-2 py-0.5 text-[10px] font-bold text-[#fbf1c7]">
                <ShieldCheck className="h-3 w-3" />
                Directly assigned
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#665c54]">
              Engineering competencies are attached to each relevant agent profile and included in its work instructions. They describe assigned coverage; they are not exam results, certifications, or measured performance scores.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 text-center">
              <div className="text-[9px] font-bold uppercase text-[#7c6f64]">Engineering agents</div>
              <div className="mt-0.5 flex items-center justify-center gap-1 text-lg font-black text-[#076678]">
                <Users className="h-4 w-4" />
                {engineeringAgents.length}
              </div>
            </div>
            <div className="rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 text-center">
              <div className="text-[9px] font-bold uppercase text-[#7c6f64]">Language coverage</div>
              <div className="mt-0.5 text-lg font-black text-[#b57614]">{PROGRAMMING_LANGUAGES.length}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#076678]">
              <Code2 className="h-3.5 w-3.5" /> Programming languages
            </h3>
            <SkillPills items={PROGRAMMING_LANGUAGES} />
          </div>
          <div className="rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#b57614]">
              <Layers3 className="h-3.5 w-3.5" /> Object-oriented programming
            </h3>
            <SkillPills items={OOP_CONCEPTS} />
          </div>
          <div className="rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#427b58]">
              <BrainCircuit className="h-3.5 w-3.5" /> Problem solving and DSA
            </h3>
            <SkillPills items={PROBLEM_SOLVING_CONCEPTS} />
          </div>
        </div>

      </section>

      <section className="overflow-hidden rounded-lg border-2 border-[#d5c4a1] bg-[#fbf1c7] shadow-xs">
        <div className="flex flex-col justify-between gap-3 border-b border-[#d5c4a1] p-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-[#282828]">Linked agents</h3>
            <p className="mt-0.5 text-[11px] text-[#7c6f64]">
              {showAllAgents ? 'Viewing the full agent roster and each profile’s saved skills.' : 'Engineering, research, security, infrastructure, and related work agents.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-[200px] items-center gap-2 rounded border border-[#d5c4a1] bg-[#f9f5d7] px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-[#7c6f64]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search agents or skills"
                className="w-full bg-transparent text-xs text-[#282828] outline-none placeholder:text-[#a89984]"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowAllAgents((current) => !current)}
              className="rounded border border-[#b57614] bg-[#b57614] px-3 py-1.5 text-[11px] font-bold text-[#fbf1c7] transition-colors hover:bg-[#8f5d0f]"
            >
              {showAllAgents ? 'Engineering only' : 'All agents'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {filteredAgents.map((agent) => {
            const related = isEngineeringRelatedAgent(agent);
            const assignedSkills = getAssignedSkills(agent);
            const profileSkills = related
              ? assignedSkills.filter((skill) => (
                !CORE_CAPABILITIES.has(skill.toLowerCase())
                && !skill.toLowerCase().startsWith('programming languages:')
              ))
              : assignedSkills;

            return (
              <article key={agent.id} className="rounded-lg border border-[#d5c4a1] bg-[#f9f5d7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: agent.color || '#076678' }}
                    >
                      {isLocalAvatar(agent.avatar) ? (
                        <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
                      ) : (
                        getAvatarInitials(agent.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-black text-[#282828]">{agent.name}</h4>
                      <p className="truncate text-[11px] text-[#665c54]">{agent.role || agent.title}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7c6f64]">
                        {agent.departmentName || agent.department || (related ? 'Engineering' : 'General workforce')}
                      </p>
                    </div>
                  </div>
                  {onOpenAgentProfile && (
                    <button
                      type="button"
                      onClick={() => onOpenAgentProfile(agent.id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded border border-[#d5c4a1] px-2 py-1 text-[10px] font-bold text-[#076678] hover:bg-[#ebdbb2]"
                    >
                      Profile <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {related ? (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1.5 text-[9px] font-black uppercase tracking-wider text-[#7c6f64]">Assigned profile capabilities</div>
                      <span className="inline-flex rounded-full border border-[#9d9d00] bg-[#b8bb26]/15 px-2.5 py-1 text-[10px] font-bold text-[#427b58]">
                        {ENGINEERING_AGENT_COMPETENCIES.length} core engineering competencies assigned
                      </span>
                      {profileSkills.length > 0 && (
                        <div className="mt-2">
                          <div className="mb-1.5 text-[9px] font-black uppercase tracking-wider text-[#7c6f64]">Additional profile skills</div>
                          <SkillPills items={profileSkills} />
                        </div>
                      )}
                    </div>
                    <p className="border-t border-[#e5d7b8] pt-2 text-[10px] leading-relaxed text-[#7c6f64]">
                      This agent receives the shared engineering playbook for repository analysis, algorithm trade-offs, OOP design, debugging, security, and focused verification.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="mb-1.5 text-[9px] font-black uppercase tracking-wider text-[#7c6f64]">Saved profile skills</div>
                    {profileSkills.length > 0 ? (
                      <SkillPills items={profileSkills} />
                    ) : (
                      <p className="text-[11px] text-[#7c6f64]">No saved skills on this profile yet.</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          {filteredAgents.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-[#bdae93] p-8 text-center text-xs text-[#7c6f64]">
              No matching agents found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
