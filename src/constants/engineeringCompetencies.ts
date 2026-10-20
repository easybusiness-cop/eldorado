import type { AgentSkill } from '../types';

const ENGINEERING_DEPARTMENT_IDS = new Set([
  'eng',
  'engineering',
  'eng_labs',
  'ai_research',
  'cloud_ops',
  'datacenter',
  'database',
  'database_engineering',
  'infrastructure',
  'machine_learning',
  'quality_assurance',
  'qa',
  'reliability',
  'research',
  'rnd',
  'sec',
  'security',
  'security_operations',
  'sre',
  'support',
]);

const ENGINEERING_DEPARTMENT_LABELS = [
  'ai & machine learning',
  'ai research',
  'cloud infrastructure',
  'cybersecurity',
  'database engineering',
  'data center',
  'engineering',
  'infrastructure',
  'reliability',
  'research & intelligence',
  'security operations',
  'software',
  'sre',
  'technical support',
];

const ENGINEERING_ROLE_TERMS = [
  'architect',
  'automation qa',
  'backend',
  'coder',
  'code reviewer',
  'database engineer',
  'developer',
  'devops',
  'engineer',
  'frontend',
  'incident responder',
  'qa engineer',
  'research scientist',
  'security analyst',
  'security engineer',
  'software',
  'sre',
  'systems',
  'technical support',
  'vulnerability analyst',
];

export const PROGRAMMING_LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'Dart',
  'Scala',
  'R',
  'Julia',
  'MATLAB',
  'SQL',
  'Bash',
  'PowerShell',
  'HTML',
  'CSS',
  'Lua',
  'Perl',
  'Haskell',
  'Elixir',
  'Erlang',
  'Clojure',
  'F#',
  'Objective-C',
  'Visual Basic .NET',
  'COBOL',
] as const;

export const ENGINEERING_AGENT_COMPETENCIES = [
  'Cross-language engineering: adapt to the requested language ecosystem by inspecting repository conventions and authoritative documentation',
  `Programming languages: ${PROGRAMMING_LANGUAGES.join(', ')}`,
  'Object-oriented programming: classes, objects, constructors, encapsulation, abstraction, inheritance, polymorphism, and composition',
  'Data structures and algorithms: arrays, linked lists, stacks, queues, hash maps, trees, graphs, recursion, searching, and sorting',
  'Problem solving: requirements decomposition, algorithm design, Big-O time and space analysis, edge-case analysis, and trade-off evaluation',
  'Software design: SOLID principles, useful design patterns, modular architecture, API contracts, and maintainable abstractions',
  'Software quality: debugging, root-cause analysis, automated tests, code review, secure coding, performance, and reliability',
] as const;

export const ENGINEERING_AGENT_PLAYBOOK = `ENGINEERING EXECUTION PLAYBOOK
- Inspect the repository, existing conventions, runtime, and dependency versions before choosing an implementation.
- Prefer the project's established language and framework. For unfamiliar languages, verify syntax and APIs against repository examples and authoritative documentation; do not claim unsupported language coverage.
- Convert the request into observable acceptance criteria, then choose data structures and algorithms that fit the input scale and state their time and space trade-offs.
- Use classes and inheritance when they clarify domain behavior; prefer composition when it keeps responsibilities simpler. Apply encapsulation, polymorphism, SOLID principles, and patterns only where they solve a real design problem.
- Make the smallest complete change, handle invalid input and failure paths, and preserve existing interfaces unless the task requires a migration.
- Check security, permissions, privacy, concurrency, performance, accessibility, and compatibility where relevant. Never bypass repository safeguards or an agent's assigned permissions.
- Verify changed behavior with focused checks available in the project, inspect the final diff, and report what ran, what changed, and any unresolved limitation. Never invent results or certifications.`;

export interface EngineeringAgentProfile {
  departmentId?: string;
  department?: string;
  departmentName?: string;
  role?: string;
  title?: string;
  primaryRole?: string;
  name?: string;
  skills?: unknown;
  secondarySkills?: string[];
  capabilities?: string[];
  systemPrompt?: string;
  jobDescription?: string;
}

export function isEngineeringRelatedAgent(profile: EngineeringAgentProfile): boolean {
  const departmentKey = (profile.departmentId || profile.department || '').trim().toLowerCase();
  const departmentText = `${profile.department || ''} ${profile.departmentName || ''}`.toLowerCase();
  const roleText = `${profile.role || ''} ${profile.title || ''} ${profile.primaryRole || ''}`.toLowerCase();

  return ENGINEERING_DEPARTMENT_IDS.has(departmentKey)
    || ENGINEERING_DEPARTMENT_LABELS.some((label) => departmentText.includes(label))
    || ENGINEERING_ROLE_TERMS.some((term) => roleText.includes(term));
}

function mergeUnique(current: string[] | undefined, additions: readonly string[]): string[] {
  const existing = current || [];
  const seen = new Set(existing.map((item) => item.toLowerCase()));
  const merged = [...existing];
  for (const item of additions) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.length === existing.length ? existing : merged;
}

function appendPlaybook(current: string | undefined): string | undefined {
  if (!current) return current;
  if (current.includes('ENGINEERING EXECUTION PLAYBOOK')) return current;
  return `${current.trim()}\n\n${ENGINEERING_AGENT_PLAYBOOK}`;
}

function createEngineeringSkillRecord(name: string): AgentSkill {
  return {
    id: `engineering-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
    category: 'technical',
    proficiency: 88,
    experiencePoints: 0,
    certified: false,
  };
}

export function applyEngineeringCompetencies<T extends EngineeringAgentProfile>(profile: T): T {
  if (!isEngineeringRelatedAgent(profile)) return profile;

  const next: EngineeringAgentProfile = { ...profile };
  if (next.secondarySkills) {
    next.secondarySkills = mergeUnique(next.secondarySkills, ENGINEERING_AGENT_COMPETENCIES);
  }
  if (next.capabilities) {
    next.capabilities = mergeUnique(next.capabilities, ENGINEERING_AGENT_COMPETENCIES);
  }

  if (Array.isArray(next.skills)) {
    if (next.skills.every((skill) => typeof skill === 'string')) {
      next.skills = mergeUnique(next.skills as string[], ENGINEERING_AGENT_COMPETENCIES);
    } else {
      const existingNames = new Set(next.skills
        .map((skill) => (skill as { name?: string }).name?.toLowerCase())
        .filter((name): name is string => Boolean(name)));
      const additions = ENGINEERING_AGENT_COMPETENCIES
        .filter((name) => !existingNames.has(name.toLowerCase()))
        .map(createEngineeringSkillRecord);
      if (additions.length > 0) next.skills = [...next.skills, ...additions];
    }
  } else {
    next.skills = ENGINEERING_AGENT_COMPETENCIES.map(createEngineeringSkillRecord);
  }

  next.systemPrompt = appendPlaybook(next.systemPrompt);
  next.jobDescription = appendPlaybook(next.jobDescription);

  const changed = next.secondarySkills !== profile.secondarySkills
    || next.capabilities !== profile.capabilities
    || next.skills !== profile.skills
    || next.systemPrompt !== profile.systemPrompt
    || next.jobDescription !== profile.jobDescription;

  return changed ? next as T : profile;
}
