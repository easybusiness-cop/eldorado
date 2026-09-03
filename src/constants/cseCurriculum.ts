export interface CseCurriculumTopic {
  id: string;
  title: string;
  description: string;
  skills: string[];
  primaryRepository: 'OSSU CS' | 'freeCodeCamp' | 'Amey-Thakur CSE' | 'Official Specs';
  repoUrl: string;
  practicalTaskTitle: string;
  practicalTaskPrompt: string;
}

export interface CseLevelSpec {
  levelNumber: number;
  levelTitle: string;
  badgeColor: string;
  description: string;
  topics: CseCurriculumTopic[];
  requiredCompetencyLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

export interface CseSpecializationSpec {
  id: string;
  title: string;
  description: string;
  keyResponsibilities: string[];
  recommendedLevels: number[];
  primaryTools: string[];
  requiredPermissions: string[];
}

export const CSE_CURRICULUM_SOURCES = [
  {
    id: 'ossu',
    name: 'OSSU Computer Science Curriculum',
    url: 'https://github.com/ossu/computer-science',
    stars: '185k+',
    focus: 'Broad CS foundation: programming, databases, core software engineering, algorithms, ML & systems architecture.',
    badge: 'OSSU CS'
  },
  {
    id: 'freecodecamp',
    name: 'freeCodeCamp Full Curriculum',
    url: 'https://github.com/freeCodeCamp/freeCodeCamp',
    stars: '410k+',
    focus: 'Practical web development, algorithms, frontend, backend REST APIs, databases, QA, security & full-stack applications.',
    badge: 'freeCodeCamp'
  },
  {
    id: 'ameythakur',
    name: 'Computer Engineering Academic Repository',
    url: 'https://github.com/Amey-Thakur/COMPUTER-ENGINEERING',
    stars: 'Academic Standard',
    focus: 'B.E. Computer Engineering subjects: systems programming, databases, networks, security, ML & formal software engineering.',
    badge: 'Amey-Thakur CSE'
  }
];

export const COMPETENCY_LEVEL_DESCRIPTIONS = {
  L0: { title: 'L0 — Uninitiated', desc: 'No formal training completed yet in this subject.', color: 'text-slate-400 bg-slate-900 border-slate-700' },
  L1: { title: 'L1 — Theoretical Understanding', desc: 'Understands fundamental concepts, terminology, and core syntax.', color: 'text-blue-700 bg-blue-100 border-blue-300' },
  L2: { title: 'L2 — Guided Implementation', desc: 'Can implement code snippets and solve problems with supervisor oversight.', color: 'text-amber-800 bg-amber-100 border-amber-300' },
  L3: { title: 'L3 — Independent Execution', desc: 'Can independently design, build, test, and deploy functional features.', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
  L4: { title: 'L4 — Debugging & Optimization', desc: 'Capable of deep diagnostics, profiling, refactoring, and performance tuning.', color: 'text-purple-800 bg-purple-100 border-purple-300' },
  L5: { title: 'L5 — System Architect & Mentor', desc: 'Can design high-scale systems, review pull requests, and train subordinate agents.', color: 'text-indigo-800 bg-indigo-100 border-indigo-300' }
};

export const CSE_SPECIALIZATION_SPECS: CseSpecializationSpec[] = [
  {
    id: 'CSE-ARCHITECT',
    title: 'System Architect Agent',
    description: 'Designs overall system architecture, defines service boundaries, creates technical specifications, and conducts structural reviews.',
    keyResponsibilities: ['Architecture Specifications', 'Service Boundary Design', 'Tech Stack Selection', 'Structural Code Review'],
    recommendedLevels: [1, 2, 4, 5, 6],
    primaryTools: ['Architecture Canvas', 'Diagram Engine', 'Tech Spec Generator', 'PR Inspector'],
    requiredPermissions: ['ARCH_WRITE', 'SYSTEM_SPEC_APPROVE', 'DEPT_DESIGN']
  },
  {
    id: 'FRONTEND-ENGINEER',
    title: 'Frontend Engineer Agent',
    description: 'Builds responsive user interfaces, implements state management, integrates APIs, optimizes rendering, and tests client interactions.',
    keyResponsibilities: ['UI Component Engineering', 'State Management', 'API Integration', 'Responsive Design & Accessibility'],
    recommendedLevels: [1, 2, 3],
    primaryTools: ['React DevTools', 'Tailwind Styler', 'Vite Bundler', 'DOM Inspector'],
    requiredPermissions: ['FRONTEND_COMMIT', 'UI_DESTRUCTIVE_EDIT', 'API_CONSUME']
  },
  {
    id: 'BACKEND-ENGINEER',
    title: 'Backend Engineer Agent',
    description: 'Builds RESTful & WebSocket APIs, implements business logic, manages authentication/authorization, and handles data flows.',
    keyResponsibilities: ['REST/GraphQL Endpoints', 'Authentication & JWT', 'Business Logic Pipeline', 'Server Optimization'],
    recommendedLevels: [1, 2, 4, 5],
    primaryTools: ['Express Router', 'Node.js Runtime', 'API Tester (Postman)', 'JWT Generator'],
    requiredPermissions: ['BACKEND_COMMIT', 'SERVER_RESTART', 'API_ROUTE_WRITE']
  },
  {
    id: 'DATABASE-ENGINEER',
    title: 'Database Engineer Agent',
    description: 'Designs schemas, normalizes relational structures, writes optimized SQL queries, creates indexes, and executes zero-downtime migrations.',
    keyResponsibilities: ['Relational Schema Design', 'SQL Query Optimization', 'Index & Partitioning Strategy', 'Data Migration Scripts'],
    recommendedLevels: [1, 2, 5],
    primaryTools: ['PostgreSQL CLI', 'Schema Visualizer', 'Query Profiler', 'Migration Runner'],
    requiredPermissions: ['DB_MIGRATE', 'DB_DIRECT_QUERY', 'SCHEMA_MODIFY']
  },
  {
    id: 'DEVOPS-ENGINEER',
    title: 'DevOps / Cloud Engineer Agent',
    description: 'Automates CI/CD pipelines, containerizes applications with Docker, configures proxies, manages secrets, and monitors Cloud Run infrastructure.',
    keyResponsibilities: ['CI/CD Pipeline Design', 'Docker Containerization', 'Cloud Deployment', 'Infrastructure Telemetry'],
    recommendedLevels: [1, 2, 6],
    primaryTools: ['Docker Engine', 'GitHub Actions Runner', 'Cloud Run Proxy', 'Prometheus Metrics'],
    requiredPermissions: ['CLOUD_DEPLOY', 'SECRETS_READ', 'INFRA_RECONFIGURE']
  },
  {
    id: 'SECURITY-ENGINEER',
    title: 'Security Operations Agent',
    description: 'Performs defensive security reviews, checks OWASP Top 10 vulnerabilities, enforces zero-trust access, and verifies dependency safety.',
    keyResponsibilities: ['OWASP Audit', 'Zero-Trust Policy Enforcement', 'Secrets Leakage Detection', 'Input Sanitization Verification'],
    recommendedLevels: [1, 2, 7],
    primaryTools: ['Security Scanner', 'Static Analysis Tool', 'Vulnerability DB', 'Vault Credential Gate'],
    requiredPermissions: ['SECURITY_AUDIT', 'ZERO_TRUST_ENFORCE', 'SECRET_VAULT_ACCESS']
  },
  {
    id: 'QA-ENGINEER',
    title: 'Quality Assurance Agent',
    description: 'Authoring test plans, writing automated unit/integration tests, performing regression testing, and logging defect reports.',
    keyResponsibilities: ['Automated Test Suites', 'Regression Testing', 'Bug Reporting & Triage', 'Performance Stress Testing'],
    recommendedLevels: [1, 2, 3, 4],
    primaryTools: ['Vitest Engine', 'Playwright Runner', 'Coverage Calculator', 'Mock Generator'],
    requiredPermissions: ['RUN_TESTS', 'FAIL_PIPELINE', 'ISSUE_CREATE']
  },
  {
    id: 'AI-ENGINEER',
    title: 'AI / ML Engineer Agent',
    description: 'Builds machine learning pipelines, constructs RAG embeddings, develops autonomous tool-calling workflows, and monitors model outputs.',
    keyResponsibilities: ['Gemini Model Tuning', 'RAG Vector Pipeline', 'Agent Tool Calling Design', 'Evaluation Benchmarks'],
    recommendedLevels: [1, 2, 8],
    primaryTools: ['Gemini SDK', 'Vector Embedding Pipeline', 'RAG Retriever', 'Prompt Tester'],
    requiredPermissions: ['GEMINI_API_CALL', 'VECTOR_INDEX_WRITE', 'MODEL_PROMPT_MUTATE']
  },
  {
    id: 'CODE-REVIEWER',
    title: 'Code Review Specialist Agent',
    description: 'Reviews pull requests across all departments, checks correctness, enforces maintainability, verifies test coverage, and blocks low-quality code.',
    keyResponsibilities: ['Pull Request Review', 'Code Quality Enforcement', 'Security Check Validation', 'Mentorship Feedback'],
    recommendedLevels: [1, 2, 3, 4, 5, 7],
    primaryTools: ['Diff Inspector', 'Linter Engine', 'AST Parser', 'Merge Gatekeeper'],
    requiredPermissions: ['PR_APPROVE', 'PR_REJECT', 'CODE_QUALITY_GATE']
  }
];

export const CSE_TRAINING_LEVELS: CseLevelSpec[] = [
  {
    levelNumber: 1,
    levelTitle: 'LEVEL 1 — COMPUTER SCIENCE FOUNDATION',
    badgeColor: 'bg-blue-600 text-white',
    description: 'Master core computer science principles: programming logic, algorithms, OS memory models, computer networks, and Linux shell mastery.',
    requiredCompetencyLevel: 'L1',
    topics: [
      {
        id: 'c1-1',
        title: 'Programming Fundamentals & Logic',
        description: 'Variables, loops, control flow, functions, scope, and basic data types in Python, C/C++, and JavaScript.',
        skills: ['Python', 'C/C++', 'JavaScript', 'Logic Gates', 'Memory Layout'],
        primaryRepository: 'OSSU CS',
        repoUrl: 'https://github.com/ossu/computer-science',
        practicalTaskTitle: 'Write Memory-Safe Data Processor',
        practicalTaskPrompt: 'Build a memory-efficient CLI data processor in Python & C that parses 100k raw text records.'
      },
      {
        id: 'c1-2',
        title: 'Data Structures & Algorithms',
        description: 'Arrays, Linked Lists, Stacks, Queues, Trees, Binary Search, Big-O Notation, Hash Tables, and Graph Traversals.',
        skills: ['DSA', 'Big-O Analysis', 'Hash Maps', 'Trees & Graphs', 'Sorting'],
        primaryRepository: 'freeCodeCamp',
        repoUrl: 'https://github.com/freeCodeCamp/freeCodeCamp',
        practicalTaskTitle: 'Implement Custom Hash Table & Binary Tree',
        practicalTaskPrompt: 'Construct a collision-resistant Hash Map and balanced Binary Search Tree from scratch in TypeScript.'
      },
      {
        id: 'c1-3',
        title: 'Computer Systems, OS & Networking',
        description: 'CPU architecture, process execution, memory allocation, TCP/IP stack, DNS, HTTP/S, and Linux Bash automation.',
        skills: ['Operating Systems', 'TCP/IP', 'Linux/Bash', 'Process Threads', 'Git'],
        primaryRepository: 'Amey-Thakur CSE',
        repoUrl: 'https://github.com/Amey-Thakur/COMPUTER-ENGINEERING',
        practicalTaskTitle: 'Configure Shell Automation & Port Analyzer',
        practicalTaskPrompt: 'Create a Bash automation script to verify active network ports and analyze process memory allocations.'
      }
    ]
  },
  {
    levelNumber: 2,
    levelTitle: 'LEVEL 2 — SOFTWARE ENGINEERING',
    badgeColor: 'bg-cyan-600 text-white',
    description: 'Transition from pure coding to professional engineering: requirements decomposition, clean architecture, automated testing, and CI/CD.',
    requiredCompetencyLevel: 'L2',
    topics: [
      {
        id: 'c2-1',
        title: 'Requirements Breakdown & Architecture',
        description: 'Translating user requirements into formal technical specifications, modular interfaces, and task breakdown trees.',
        skills: ['Decomposition', 'Modular Design', 'UML/Diagrams', 'Interface Contracts'],
        primaryRepository: 'OSSU CS',
        repoUrl: 'https://github.com/ossu/computer-science',
        practicalTaskTitle: 'Draft Technical Specification Document',
        practicalTaskPrompt: 'Break down a multi-service task into modular components with explicit input/output schemas.'
      },
      {
        id: 'c2-2',
        title: 'Clean Code, Refactoring & Testing',
        description: 'SOLID principles, DRY, unit testing, integration tests, automated regression testing, and code review practices.',
        skills: ['SOLID Principles', 'Unit Testing', 'Refactoring', 'Code Reviews', 'Vitest'],
        primaryRepository: 'freeCodeCamp',
        repoUrl: 'https://github.com/freeCodeCamp/freeCodeCamp',
        practicalTaskTitle: 'Refactor Legacy Codebase with 90%+ Test Coverage',
        practicalTaskPrompt: 'Refactor a monolithic helper module into clean SOLID classes backed by automated Vitest coverage.'
      }
    ]
  },
  {
    levelNumber: 3,
    levelTitle: 'LEVEL 3 — FRONTEND ENGINEERING',
    badgeColor: 'bg-indigo-600 text-white',
    description: 'Master modern client-side software architecture: React 18, TypeScript, Tailwind CSS, accessible UI components, and state synchronization.',
    requiredCompetencyLevel: 'L3',
    topics: [
      {
        id: 'c3-1',
        title: 'Modern UI Engineering with React & TypeScript',
        description: 'Functional component hierarchy, custom hooks, state memoization, dynamic routing, and accessible UI patterns.',
        skills: ['React 18', 'TypeScript', 'Tailwind CSS', 'State Management', 'WCAG AA'],
        primaryRepository: 'freeCodeCamp',
        repoUrl: 'https://github.com/freeCodeCamp/freeCodeCamp',
        practicalTaskTitle: 'Build Responsive Component Design System',
        practicalTaskPrompt: 'Create a fully accessible, dark/light theme component library in React with zero re-render bugs.'
      }
    ]
  },
  {
    levelNumber: 4,
    levelTitle: 'LEVEL 4 — BACKEND ENGINEERING',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Build production-ready server applications: Node.js, Express, REST APIs, WebSockets, JWT authentication, caching, and background jobs.',
    requiredCompetencyLevel: 'L3',
    topics: [
      {
        id: 'c4-1',
        title: 'Production API Services & Middleware',
        description: 'Express backend architecture, input validation, rate limiting, error handling middleware, and WebSocket real-time feeds.',
        skills: ['Node.js', 'Express', 'REST APIs', 'WebSockets', 'JWT Auth'],
        primaryRepository: 'freeCodeCamp',
        repoUrl: 'https://github.com/freeCodeCamp/freeCodeCamp',
        practicalTaskTitle: 'Build Authenticated REST API Proxy Service',
        practicalTaskPrompt: 'Construct a Express REST backend with JWT verification, rate limiting, and structured error responses.'
      }
    ]
  },
  {
    levelNumber: 5,
    levelTitle: 'LEVEL 5 — DATABASE ENGINEERING',
    badgeColor: 'bg-amber-600 text-white',
    description: 'Relational & document database mastery: PostgreSQL schema design, indexing, SQL optimization, migrations, and ACID transactions.',
    requiredCompetencyLevel: 'L3',
    topics: [
      {
        id: 'c5-1',
        title: 'Relational Schema Design & SQL Optimization',
        description: 'Third normal form (3NF), foreign key cascades, EXPLAIN query execution plans, B-Tree indexing, and transaction rollback handling.',
        skills: ['PostgreSQL', 'SQL Queries', 'Indexing', 'Migrations', 'Transactions'],
        primaryRepository: 'Amey-Thakur CSE',
        repoUrl: 'https://github.com/Amey-Thakur/COMPUTER-ENGINEERING',
        practicalTaskTitle: 'Design 3NF Relational Database Schema',
        practicalTaskPrompt: 'Draft an optimized PostgreSQL schema with custom indexes and benchmark query performance.'
      }
    ]
  },
  {
    levelNumber: 6,
    levelTitle: 'LEVEL 6 — DEVOPS / CLOUD',
    badgeColor: 'bg-purple-600 text-white',
    description: 'Containerization, cloud deployment, Nginx proxy routing, GitHub Actions CI/CD automation, and production telemetry monitoring.',
    requiredCompetencyLevel: 'L4',
    topics: [
      {
        id: 'c6-1',
        title: 'Containerization & CI/CD Pipelines',
        description: 'Dockerfile optimization, multi-stage builds, GitHub Actions workflows, reverse proxies, and secrets management.',
        skills: ['Docker', 'GitHub Actions', 'CI/CD', 'Cloud Run', 'Nginx'],
        primaryRepository: 'OSSU CS',
        repoUrl: 'https://github.com/ossu/computer-science',
        practicalTaskTitle: 'Create Multi-Stage Docker Build & CI/CD Spec',
        practicalTaskPrompt: 'Write a production multi-stage Dockerfile and GitHub Actions workflow file that builds and lints.'
      }
    ]
  },
  {
    levelNumber: 7,
    levelTitle: 'LEVEL 7 — DEFENSIVE SECURITY',
    badgeColor: 'bg-rose-600 text-white',
    description: 'Defensive cyber security: OWASP Top 10 mitigation, SQL injection prevention, XSS/CSRF hardening, zero-trust policies, and auditing.',
    requiredCompetencyLevel: 'L4',
    topics: [
      {
        id: 'c7-1',
        title: 'OWASP Defensive Hardening & Vulnerability Audits',
        description: 'Sanitizing user input, enforcing CSP headers, securing JWT tokens, protecting secrets, and static analysis.',
        skills: ['OWASP Top 10', 'Sanitization', 'CSRF/XSS Defense', 'Zero-Trust', 'Audit Logs'],
        primaryRepository: 'freeCodeCamp',
        repoUrl: 'https://github.com/freeCodeCamp/freeCodeCamp',
        practicalTaskTitle: 'Execute Zero-Trust Vulnerability Audit',
        practicalTaskPrompt: 'Audit API endpoints for parameter tampering, SQL injection vectors, and missing auth middleware.'
      }
    ]
  },
  {
    levelNumber: 8,
    levelTitle: 'LEVEL 8 — AI / ML ENGINEERING',
    badgeColor: 'bg-teal-600 text-white',
    description: 'Artificial intelligence & ML integration: Python data science, Gemini model tuning, RAG vector retrieval, and autonomous tool calling.',
    requiredCompetencyLevel: 'L4',
    topics: [
      {
        id: 'c8-1',
        title: 'Gemini SDK, Tool Calling & RAG Vector Pipelines',
        description: 'Interacting with Gemini SDK, defining structured tool-call schemas, constructing semantic search vectors, and evaluating outputs.',
        skills: ['Gemini SDK', 'Vector Embeddings', 'RAG Pipelines', 'Tool Calling', 'Prompt Design'],
        primaryRepository: 'OSSU CS',
        repoUrl: 'https://github.com/ossu/computer-science',
        practicalTaskTitle: 'Construct Autonomous RAG Agent Pipeline',
        practicalTaskPrompt: 'Build a server-side Gemini RAG pipeline that retrieves knowledge vectors and executes structured tool calls.'
      }
    ]
  },
  {
    levelNumber: 9,
    levelTitle: 'LEVEL 9 — REAL ENGINEERING PROJECTS',
    badgeColor: 'bg-fuchsia-600 text-white',
    description: 'Full end-to-end engineering execution: Theory → Exercise → Small Project → Real System → Code Review → Security Check → Deployment.',
    requiredCompetencyLevel: 'L5',
    topics: [
      {
        id: 'c9-1',
        title: 'Full-Stack Production Application Suite',
        description: 'Engineers build complete production applications with documentation, test suites, database migrations, and telemetry.',
        skills: ['Full-Stack System', 'End-to-End Testing', 'Security Signoff', 'Production Deployment'],
        primaryRepository: 'freeCodeCamp',
        repoUrl: 'https://github.com/freeCodeCamp/freeCodeCamp',
        practicalTaskTitle: 'Deploy Production Real-Time System with Audit',
        practicalTaskPrompt: 'Build, test, secure, and deploy a full-stack real-time collaboration application with zero-defect signoff.'
      }
    ]
  }
];

export function generateInitialTrainingRecord(role: string, departmentId: string): any {
  // Higher level agents like Dwight or Michael start with higher competency
  const isLeader = role.toLowerCase().includes('manager') || role.toLowerCase().includes('ciso') || role.toLowerCase().includes('god') || role.toLowerCase().includes('lead');
  const level = isLeader ? 4 : 2;
  const grade = isLeader ? 'L4' : 'L2';
  
  return {
    completedLevels: isLeader ? [1, 2, 3, 4] : [1, 2],
    currentLevel: isLeader ? 5 : 3,
    competencyScore: isLeader ? 88 : 65,
    competencyGrade: grade,
    specializationTrack: isLeader ? 'CSE-ARCHITECT' : (departmentId === 'eng' ? 'BACKEND-ENGINEER' : 'FRONTEND-ENGINEER'),
    certifications: isLeader ? [
      {
        id: 'cert-1',
        name: 'CSE Foundation Certified',
        level: 'L1',
        track: 'Core CS',
        issuedAt: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        sourceRepository: 'https://github.com/ossu/computer-science'
      },
      {
        id: 'cert-2',
        name: 'Software Engineering & Testing L2',
        level: 'L2',
        track: 'Software Architecture',
        issuedAt: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
        sourceRepository: 'https://github.com/freeCodeCamp/freeCodeCamp'
      }
    ] : [
      {
        id: 'cert-1',
        name: 'CSE Foundation Certified',
        level: 'L1',
        track: 'Core CS',
        issuedAt: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
        sourceRepository: 'https://github.com/ossu/computer-science'
      }
    ],
    practicalProjectsCompleted: isLeader ? [
      'Authentication Proxy Service',
      'Zero-Trust Network Perimeter Auditor',
      'Multi-Agent Fleet Task Router'
    ] : ['CLI Memory Data Processor'],
    hoursTrained: isLeader ? 142 : 48,
    lastTrainedAt: new Date().toISOString(),
    skillsMatrix: {
      'Programming & Logic': isLeader ? 5 : 3,
      'Data Structures & Algorithms': isLeader ? 4 : 3,
      'Software Architecture': isLeader ? 5 : 2,
      'Frontend Development': isLeader ? 3 : 4,
      'Backend & REST APIs': isLeader ? 4 : 3,
      'Database Engineering': isLeader ? 4 : 2,
      'DevOps & Cloud': isLeader ? 4 : 1,
      'Defensive Security': isLeader ? 5 : 2,
      'AI & ML Engineering': isLeader ? 4 : 2
    }
  };
}
