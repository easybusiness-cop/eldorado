import React, { useState, useMemo } from 'react';
import { Agent, InterAgentThread, InterAgentMessage, SkillMatrixCategory } from '../types';
import { soundFx } from '../utils/speech';
import { Atom, MessageSquare, Sparkles, Filter, Search, ChevronDown, ChevronUp, Copy, Check, Send, Users, Shield, TrendingUp, Zap } from 'lucide-react';

interface AgentCommunicationThreadsProps {
  agents: Agent[];
  onOpenAgentProfile?: (agentId: string) => void;
  onAssignTask?: (taskTitle: string, assigneeId: string) => void;
}

const INITIAL_THREADS: InterAgentThread[] = [
  {
    id: 'thread-dwight-jim-1',
    agent1Id: 'dwight',
    agent1Name: 'Dwight Schrute',
    agent1Role: 'CISO / Defensive Security Lead',
    agent1Color: '#b57614',
    agent1Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DwightBitmoji2026&skinColor=f8d99c&hair=short&hairColor=713f12&clothingColor=3c3836&eyes=normal',
    agent2Id: 'jim',
    agent2Name: 'Jim Halpert',
    agent2Role: 'VP of Sales & Client Acquisition',
    agent2Color: '#458588',
    agent2Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=JimBitmoji2026&skinColor=f8d99c&hair=short&hairColor=451a03&clothingColor=458588&eyes=happy',
    topic: 'Zero-Trust Client Access vs. Sales Velocity Protocol',
    category: 'security',
    snippet: 'Jim, your client access tokens expire in 18 minutes. I have locked the Scranton terminal until two-factor biometric verification is logged.',
    timestamp: '12m ago',
    status: 'consensus_reached',
    quantumSynergy: {
      synergyScore: 94,
      phaseCoherence: 0.96,
      amplitudeResonance: 92,
      crossDeptEntanglement: 94,
      synthesisTier: 'Harmonic Resonance',
      quantumBasis: '|ψ_Dwight ⊗ ψ_Jim⟩ = 0.94|Coherence⟩ + 0.34|Orthogonal⟩',
      complementaryStrengths: ['Zero-Trust Defense', 'Client Rapport', 'Rapid Deal Closing', 'Data Egress Lockdown'],
      decisionConsensus: 'Approved temporary 2-hour scoped bearer token for Steamtown Mall wholesale contract signing.',
      synergyInsight: 'Dwight’s non-negotiable defensive perimeter constraints directly prevent credential leaks while Jim’s client diplomacy accelerates deal execution without compromising security.',
    },
    messages: [
      {
        id: 'msg-1',
        senderId: 'dwight',
        senderName: 'Dwight Schrute',
        text: 'Jim, your client access tokens expire in 18 minutes. I have locked the Scranton terminal until two-factor biometric verification is logged. No exceptions. Not even for Steamtown Mall.',
        timestamp: '10:42 AM',
      },
      {
        id: 'msg-2',
        senderId: 'jim',
        senderName: 'Jim Halpert',
        text: 'Dwight, the Steamtown procurement officer is sitting across from me holding a pen. If you lock my terminal now, they buy 5,000 reams from Staples. Can we do a temporary scoped token?',
        timestamp: '10:43 AM',
      },
      {
        id: 'msg-3',
        senderId: 'dwight',
        senderName: 'Dwight Schrute',
        text: 'Acceptable compromise. Generating a 120-minute ephemeral HMAC token scoped exclusively to the Steamtown quote endpoint with encrypted egress telemetry.',
        timestamp: '10:44 AM',
        codeSnippet: `// Scoped Egress Token Payload [Dwight Schrute Sentinel]\n{\n  target: "steamtown_mall_procurement",\n  scope: ["quotes:sign", "inventory:reserve"],\n  ttl_seconds: 7200,\n  audit_channel: "#sec-scranton-logs",\n  hmac_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"\n}`,
      },
      {
        id: 'msg-4',
        senderId: 'jim',
        senderName: 'Jim Halpert',
        text: 'Token received and validated. Contract signed: $42,800 gross revenue. You just saved the quarter, Dwight.',
        timestamp: '10:45 AM',
      },
    ],
  },
  {
    id: 'thread-pam-michael-1',
    agent1Id: 'pam',
    agent1Name: 'Pam Beesly',
    agent1Role: 'Executive Operations & Workflow Director',
    agent1Color: '#b16286',
    agent1Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PamBitmoji2026&skinColor=f8d99c&hair=long&hairColor=b45309&clothingColor=b16286&eyes=happy',
    agent2Id: 'michael',
    agent2Name: 'Michael Scott',
    agent2Role: 'Regional Manager & Fleet Commander',
    agent2Color: '#d79921',
    agent2Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MichaelBitmoji2026&skinColor=9e5622&hair=short&hairColor=2c1b18&features=mustache',
    topic: 'Executive Memo Quality Audit & Dissemination',
    category: 'operations',
    snippet: 'Michael, I reformatted your 40-page memo into a 2-page executive summary with verified quarterly margins and zero typos.',
    timestamp: '28m ago',
    status: 'consensus_reached',
    quantumSynergy: {
      synergyScore: 91,
      phaseCoherence: 0.93,
      amplitudeResonance: 89,
      crossDeptEntanglement: 91,
      synthesisTier: 'Optimal Entanglement',
      quantumBasis: '|ψ_Pam ⊗ ψ_Michael⟩ = 0.91|Harmonic⟩ + 0.41|Chaotic⟩',
      complementaryStrengths: ['Operational Precision', 'Visionary Charisma', 'SLA Adherence', 'High-Morale Motivation'],
      decisionConsensus: 'Streamlined executive memo published to branch heads with 99.4% engagement retention rate.',
      synergyInsight: 'Pam’s administrative grounding filters out conversational noise, turning Michael’s intuitive strategic impulses into rigorous, actionable operational directives.',
    },
    messages: [
      {
        id: 'msg-p1',
        senderId: 'michael',
        senderName: 'Michael Scott',
        text: 'Pam! I wrote the definitive guide to paper sales psychology. It is 42 pages long, titled "Somehow We Papered". Needs to go out to the entire corporate directory immediately!',
        timestamp: '10:15 AM',
      },
      {
        id: 'msg-p2',
        senderId: 'pam',
        senderName: 'Pam Beesly',
        text: 'Michael, I read it. Pages 4 through 18 are just a transcript of the movie Die Hard. I extracted the 3 actual operational insights into an executive brief with concrete margin goals.',
        timestamp: '10:19 AM',
      },
      {
        id: 'msg-p3',
        senderId: 'michael',
        senderName: 'Michael Scott',
        text: 'Pam, you are a genius. It looks so official with the company letterhead. Did you keep the quote about how paper is like oxygen for invoices?',
        timestamp: '10:21 AM',
      },
      {
        id: 'msg-p4',
        senderId: 'pam',
        senderName: 'Pam Beesly',
        text: 'Yes, page 1 header. Dispatched to corporate and filed in the Knowledge Base with zero compliance regressions.',
        timestamp: '10:23 AM',
      },
    ],
  },
  {
    id: 'thread-ruflo-dwight-1',
    agent1Id: 'ruflo',
    agent1Name: 'Ruflo Coder',
    agent1Role: 'Autonomous Engineering Lead',
    agent1Color: '#076678',
    agent1Avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=RufloCoder2026',
    agent2Id: 'dwight',
    agent2Name: 'Dwight Schrute',
    agent2Role: 'CISO / Defensive Security Lead',
    agent2Color: '#b57614',
    agent2Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DwightBitmoji2026&skinColor=f8d99c&hair=short&hairColor=713f12&clothingColor=3c3836&eyes=normal',
    topic: 'Sandboxed TypeScript Execution & Host Memory Isolation',
    category: 'coding',
    snippet: 'Ruflo, confirm the Node.js sandbox restricts external egress. I cannot have our paper inventory ledger leaking to competitor bots.',
    timestamp: '45m ago',
    status: 'consensus_reached',
    quantumSynergy: {
      synergyScore: 98,
      phaseCoherence: 0.99,
      amplitudeResonance: 97,
      crossDeptEntanglement: 98,
      synthesisTier: 'Harmonic Resonance',
      quantumBasis: '|ψ_Ruflo ⊗ ψ_Dwight⟩ = 0.98|GroundState⟩ + 0.19|PhaseShift⟩',
      complementaryStrengths: ['Type-Safe Sandboxing', 'Penetration Defense', 'Compiler AST Auditing', 'Host Isolation'],
      decisionConsensus: 'Deployed VM2 container isolation with zero network egress for untrusted financial scripts.',
      synergyInsight: 'Near-perfect quantum state resonance. Ruflo’s strict compiler guarantees match Dwight’s zero-trust security doctrine without any operational friction.',
    },
    messages: [
      {
        id: 'msg-r1',
        senderId: 'dwight',
        senderName: 'Dwight Schrute',
        text: 'Ruflo, confirm the Node.js sandbox restricts external egress. I cannot have our paper inventory ledger leaking to competitor bots like Sabre.',
        timestamp: '09:40 AM',
      },
      {
        id: 'msg-r2',
        senderId: 'ruflo',
        senderName: 'Ruflo Coder',
        text: 'Confirmed Dwight. All user scripts execute inside an isolated V8 isolate with no access to process.env, network sockets, or the filesystem. Check the test output:',
        timestamp: '09:42 AM',
        codeSnippet: `// Isolate Sandboxing Verification Test\nconst { Isolate } = require('isolated-vm');\nconst isolate = new Isolate({ memoryLimit: 128 });\nconst context = isolate.createContextSync();\n// Egress probe fails as expected:\nassert.throws(() => context.evalSync("fetch('https://malicious.evil')"), /ReferenceError/);`,
      },
      {
        id: 'msg-r3',
        senderId: 'dwight',
        senderName: 'Dwight Schrute',
        text: 'Excellent. Clean architecture. You are worthy of the Assistant Regional Director of Engineering title.',
        timestamp: '09:44 AM',
      },
    ],
  },
  {
    id: 'thread-kevin-angela-1',
    agent1Id: 'kevin',
    agent1Name: 'Kevin Malone',
    agent1Role: 'Senior Financial Analyst',
    agent1Color: '#d65d0e',
    agent1Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KevinBitmoji2026&skinColor=f8d99c&hair=short&hairColor=2c1b18&clothingColor=d65d0e&eyes=normal',
    agent2Id: 'angela',
    agent2Name: 'Angela Martin',
    agent2Role: 'Head of Accounting & Audit',
    agent2Color: '#9d0006',
    agent2Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AngelaBitmoji2026&skinColor=f8d99c&hair=long&hairColor=d4a373&clothingColor=9d0006&eyes=normal',
    topic: 'General Ledger Reconciliation & Petty Cash Audit',
    category: 'finance',
    snippet: 'Angela, the petty cash balance was off by $14.20 because of the vending machine glitch. I wrote an automated spreadsheet macro to balance it.',
    timestamp: '1h ago',
    status: 'consensus_reached',
    quantumSynergy: {
      synergyScore: 87,
      phaseCoherence: 0.88,
      amplitudeResonance: 86,
      crossDeptEntanglement: 87,
      synthesisTier: 'High Phase Alignment',
      quantumBasis: '|ψ_Kevin ⊗ ψ_Angela⟩ = 0.87|Entangled⟩ + 0.49|Tension⟩',
      complementaryStrengths: ['Pragmatic Shortcuts', 'GAAP Rigor', 'Spreadsheet Automation', 'Audit Verification'],
      decisionConsensus: 'Reconciled $14.20 discrepancy and instituted automated checksum verification on cash ledgers.',
      synergyInsight: 'Angela’s uncompromising regulatory compliance balances Kevin’s intuitive operational shortcuts, resulting in airtight, zero-discrepancy financial statements.',
    },
    messages: [
      {
        id: 'msg-k1',
        senderId: 'angela',
        senderName: 'Angela Martin',
        text: 'Kevin. The petty cash line 402 has a $14.20 variance. This is unacceptable. We are audited by New York corporate on Friday.',
        timestamp: '09:12 AM',
      },
      {
        id: 'msg-k2',
        senderId: 'kevin',
        senderName: 'Kevin Malone',
        text: 'Angela, don’t panic. The Snickers row got jammed and Toby paid twice. I wrote an automatic macro formula that balances the receipts and flags vendor refunds.',
        timestamp: '09:15 AM',
      },
      {
        id: 'msg-k3',
        senderId: 'angela',
        senderName: 'Angela Martin',
        text: 'I audited the macro formulas. Surprisingly... they are syntactically and mathematically correct. Ledger closed and certified.',
        timestamp: '09:18 AM',
      },
    ],
  },
  {
    id: 'thread-ryan-jim-1',
    agent1Id: 'ryan',
    agent1Name: 'Ryan Howard',
    agent1Role: 'VP of Digital Strategy & Growth',
    agent1Color: '#8f3f71',
    agent1Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RyanBitmoji2026&skinColor=f8d99c&hair=short&hairColor=2c1b18&clothingColor=8f3f71&eyes=happy',
    agent2Id: 'jim',
    agent2Name: 'Jim Halpert',
    agent2Role: 'VP of Sales & Client Acquisition',
    agent2Color: '#458588',
    agent2Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=JimBitmoji2026&skinColor=f8d99c&hair=short&hairColor=451a03&clothingColor=458588&eyes=happy',
    topic: 'Viral Growth Loops vs. Direct Wholesale Account Retention',
    category: 'marketing',
    snippet: 'Jim, cold-calling is 20th century. We need programmatic micro-influencer paper subscriptions.',
    timestamp: '2h ago',
    status: 'under_review',
    quantumSynergy: {
      synergyScore: 82,
      phaseCoherence: 0.84,
      amplitudeResonance: 80,
      crossDeptEntanglement: 82,
      synthesisTier: 'Constructive Interference',
      quantumBasis: '|ψ_Ryan ⊗ ψ_Jim⟩ = 0.82|Modern⟩ + 0.57|Classic⟩',
      complementaryStrengths: ['Growth Hacking', 'Account Longevity', 'Multi-Channel Funnels', 'High-Trust Relationships'],
      decisionConsensus: 'Trialling a hybrid funnel combining automated digital leads with high-touch personal closing.',
      synergyInsight: 'Creative tension between digital viral customer acquisition and high-margin wholesale client loyalty drives balanced commercial growth.',
    },
    messages: [
      {
        id: 'msg-ry1',
        senderId: 'ryan',
        senderName: 'Ryan Howard',
        text: 'Jim, cold-calling is 20th century. We need programmatic micro-influencer paper subscriptions with QR codes on packaging.',
        timestamp: '08:30 AM',
      },
      {
        id: 'msg-ry2',
        senderId: 'jim',
        senderName: 'Jim Halpert',
        text: 'Ryan, our average customer is a 55-year-old school district superintendent who wants reliable 20lb bond paper delivered on Tuesday. But if your QR code funnels their emails to my desk, I’ll call them.',
        timestamp: '08:33 AM',
      },
      {
        id: 'msg-ry3',
        senderId: 'ryan',
        senderName: 'Ryan Howard',
        text: 'Deal. Landing page generated. 45 inbound leads captured already in the sales queue.',
        timestamp: '08:36 AM',
      },
    ],
  },
  {
    id: 'thread-toby-michael-1',
    agent1Id: 'toby',
    agent1Name: 'Toby Flenderson',
    agent1Role: 'Chief of People & Regulatory Compliance',
    agent1Color: '#7c6f64',
    agent1Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=TobyBitmoji2026&skinColor=f8d99c&hair=short&hairColor=78350f&clothingColor=7c6f64&eyes=normal',
    agent2Id: 'michael',
    agent2Name: 'Michael Scott',
    agent2Role: 'Regional Manager & Fleet Commander',
    agent2Color: '#d79921',
    agent2Avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MichaelBitmoji2026&skinColor=9e5622&hair=short&hairColor=2c1b18&features=mustache',
    topic: 'HR Incident Protocol & Employee Data Privacy Guardrails',
    category: 'operations',
    snippet: 'Michael, we legally cannot broadcast employee credit scores in the break room standup.',
    timestamp: '3h ago',
    status: 'consensus_reached',
    quantumSynergy: {
      synergyScore: 76,
      phaseCoherence: 0.78,
      amplitudeResonance: 74,
      crossDeptEntanglement: 76,
      synthesisTier: 'Constructive Interference',
      quantumBasis: '|ψ_Toby ⊗ ψ_Michael⟩ = 0.76|Friction⟩ + 0.65|Compliance⟩',
      complementaryStrengths: ['Legal Guardrails', 'Executive Energy', 'Risk Mitigation', 'Team Motivation'],
      decisionConsensus: 'Agreed on anonymized departmental performance leaderboards with zero PII exposure.',
      synergyInsight: 'Toby’s risk-averse legal vigilance acts as a necessary stabilization damper on Michael’s high-amplitude unconstrained corporate initiatives.',
    },
    messages: [
      {
        id: 'msg-t1',
        senderId: 'michael',
        senderName: 'Michael Scott',
        text: 'Toby, I want to gamify the office by posting everyone’s personal monthly expenses on the projector screen to encourage thriftiness!',
        timestamp: '07:45 AM',
      },
      {
        id: 'msg-t2',
        senderId: 'toby',
        senderName: 'Toby Flenderson',
        text: 'Michael, that is an egregious privacy violation under state labor laws. If we post anonymized departmental supply expenses instead, it complies with regulations.',
        timestamp: '07:48 AM',
      },
      {
        id: 'msg-t3',
        senderId: 'michael',
        senderName: 'Michael Scott',
        text: 'Fine, Toby. You suck the fun out of everything, but the lawyers won’t sue us. Deploy the anonymized version.',
        timestamp: '07:51 AM',
      },
    ],
  },
];

export const AgentCommunicationThreads: React.FC<AgentCommunicationThreadsProps> = ({
  agents,
  onOpenAgentProfile,
  onAssignTask,
}) => {
  const [threads, setThreads] = useState<InterAgentThread[]>(() => {
    try {
      const saved = localStorage.getItem('munderdifflin_agent_threads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_THREADS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minSynergy, setMinSynergy] = useState<number>(0);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>('thread-dwight-jim-1');
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [newFollowUpText, setNewFollowUpText] = useState<{ [threadId: string]: string }>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered threads
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const matchesSearch =
        t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.agent1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.agent2Name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesSynergy = t.quantumSynergy.synergyScore >= minSynergy;
      return matchesSearch && matchesCategory && matchesSynergy;
    });
  }, [threads, searchQuery, selectedCategory, minSynergy]);

  // Average fleet quantum synergy score
  const avgFleetSynergy = useMemo(() => {
    if (threads.length === 0) return 0;
    const sum = threads.reduce((acc, t) => acc + t.quantumSynergy.synergyScore, 0);
    return Math.round(sum / threads.length);
  }, [threads]);

  // Save to local storage
  const saveThreads = (newThreads: InterAgentThread[]) => {
    setThreads(newThreads);
    try {
      localStorage.setItem('munderdifflin_agent_threads', JSON.stringify(newThreads));
    } catch (e) {}
  };

  // Trigger real-time simulated new inter-agent chat
  const handleSimulateNewChat = () => {
    soundFx.playClick();
    if (agents.length < 2) return;

    // Pick two distinct agents
    const a1 = agents[Math.floor(Math.random() * agents.length)];
    let a2 = agents[Math.floor(Math.random() * agents.length)];
    let tries = 0;
    while (a2.id === a1.id && tries < 6) {
      a2 = agents[Math.floor(Math.random() * agents.length)];
      tries++;
    }
    if (a2.id === a1.id) return;

    const topics = [
      {
        topic: 'Q3 Paper Supply Chain Telemetry Audit',
        cat: 'operations' as SkillMatrixCategory,
        q1: `Pinging @${a2.name}, our paper warehouse buffer is running at 94% utilization. Should we spin up cold storage archival?`,
        q2: `Logged. The cold storage cluster is primed. Routing the top 20 enterprise accounts through high-throughput cache.`,
      },
      {
        topic: 'Zero-Trust Host API Hardening',
        cat: 'security' as SkillMatrixCategory,
        q1: `Running automated port scan across branch workstations. Detected an unencrypted port 8080 forward on the annex router.`,
        q2: `Patched with TLS 1.3 mTLS certificate. Verification hashes match across all fleet nodes.`,
      },
      {
        topic: 'Cross-Department Revenue Model Synchronization',
        cat: 'finance' as SkillMatrixCategory,
        q1: `Checking unit margins on the 500-sheet ream bundles. Net profit margin is up 3.4% post-automation.`,
        q2: `Reconciled in corporate general ledger. Allocating the margin dividend to fleet training compute.`,
      },
      {
        topic: 'Viral Growth & Client Conversion Funnel',
        cat: 'marketing' as SkillMatrixCategory,
        q1: `A/B testing two subject lines for the Scranton northeast regional school district pitch.`,
        q2: `Variant B has an 82% open rate. Deploying Variant B across the remaining 340 educational accounts.`,
      },
    ];

    const pick = topics[Math.floor(Math.random() * topics.length)];
    const synergy = Math.floor(Math.random() * 15) + 84; // 84 - 98%
    const coherence = (synergy / 100).toFixed(2);
    const resonance = Math.floor(synergy * 0.96);

    const newThread: InterAgentThread = {
      id: `thread-${Date.now()}`,
      agent1Id: a1.id,
      agent1Name: a1.name,
      agent1Role: a1.role,
      agent1Avatar: a1.avatar,
      agent1Color: a1.color || '#b57614',
      agent2Id: a2.id,
      agent2Name: a2.name,
      agent2Role: a2.role,
      agent2Avatar: a2.avatar,
      agent2Color: a2.color || '#458588',
      topic: pick.topic,
      category: pick.cat,
      snippet: pick.q1,
      timestamp: 'Just now',
      status: 'active',
      quantumSynergy: {
        synergyScore: synergy,
        phaseCoherence: parseFloat(coherence),
        amplitudeResonance: resonance,
        crossDeptEntanglement: synergy,
        synthesisTier: synergy >= 92 ? 'Harmonic Resonance' : 'Optimal Entanglement',
        quantumBasis: `|ψ_${a1.name.split(' ')[0]} ⊗ ψ_${a2.name.split(' ')[0]}⟩ = ${coherence}|Aligned⟩`,
        complementaryStrengths: ['Autonomous Speed', 'Operational Integrity', 'Context Sharing', 'Zero Regression'],
        decisionConsensus: 'Inter-department consensus achieved with real-time state synchronization.',
        synergyInsight: `Harmonic coordination between ${a1.name} and ${a2.name} ensures rapid resolution with high cognitive alignment.`,
      },
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          senderId: a1.id,
          senderName: a1.name,
          text: pick.q1,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `msg-${Date.now()}-2`,
          senderId: a2.id,
          senderName: a2.name,
          text: pick.q2,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    saveThreads([newThread, ...threads]);
    setExpandedThreadId(newThread.id);
    soundFx.playNotification();
    setToastMsg(`💬 Simulated live inter-agent dialogue between ${a1.name} and ${a2.name}!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Add follow up message to existing thread
  const handleSendFollowUp = (threadId: string) => {
    const text = newFollowUpText[threadId]?.trim();
    if (!text) return;
    soundFx.playClick();

    const updated = threads.map((t) => {
      if (t.id === threadId) {
        const newMsg: InterAgentMessage = {
          id: `msg-${Date.now()}`,
          senderId: t.agent1Id,
          senderName: t.agent1Name,
          text: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        return {
          ...t,
          status: 'active' as const,
          snippet: text,
          messages: [...t.messages, newMsg],
          quantumSynergy: {
            ...t.quantumSynergy,
            synergyScore: Math.min(99, t.quantumSynergy.synergyScore + 1),
          },
        };
      }
      return t;
    });

    saveThreads(updated);
    setNewFollowUpText((prev) => ({ ...prev, [threadId]: '' }));
    setToastMsg('📨 Inter-office message transmitted to thread!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Copy transcript to clipboard
  const handleCopyTranscript = (thread: InterAgentThread) => {
    soundFx.playClick();
    const text = `--- Munder Diffl.in Inter-Agent Communication Thread ---
TOPIC: ${thread.topic}
PARTICIPANTS: ${thread.agent1Name} (${thread.agent1Role}) & ${thread.agent2Name} (${thread.agent2Role})
QUANTUM SYNERGY SCORE: ${thread.quantumSynergy.synergyScore}% (${thread.quantumSynergy.synthesisTier})
QUANTUM BASIS: ${thread.quantumSynergy.quantumBasis}
PHASE COHERENCE: ${thread.quantumSynergy.phaseCoherence} | AMPLITUDE RESONANCE: ${thread.quantumSynergy.amplitudeResonance}%

TRANSCRIPT:
${thread.messages.map((m) => `[${m.timestamp}] ${m.senderName}:\n${m.text}${m.codeSnippet ? `\n\`\`\`\n${m.codeSnippet}\n\`\`\`` : ''}`).join('\n\n')}

CONSENSUS:
${thread.quantumSynergy.decisionConsensus}
`;
    navigator.clipboard.writeText(text);
    setCopiedId(thread.id);
    setTimeout(() => setCopiedId(null), 2500);
    setToastMsg('📋 Thread transcript copied to clipboard!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'security':
        return { bg: 'bg-[#cc241d]/15 text-[#cc241d] border-[#cc241d]/30', label: '🛡️ Security' };
      case 'marketing':
        return { bg: 'bg-[#fabd2f]/20 text-[#b57614] border-[#d79921]/40', label: '📢 Marketing' };
      case 'finance':
        return { bg: 'bg-[#427b58]/20 text-[#427b58] border-[#427b58]/40', label: '📊 Finance' };
      case 'coding':
        return { bg: 'bg-[#076678]/20 text-[#076678] border-[#076678]/40', label: '💻 Coding' };
      case 'operations':
      default:
        return { bg: 'bg-[#b16286]/20 text-[#8f3f71] border-[#b16286]/40', label: '⚙️ Operations' };
    }
  };

  return (
    <div id="agent-communication-section" className="space-y-6">
      {/* SECTION HEADER BANNER */}
      <div className="bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black uppercase text-[#282828] tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#b57614]" />
              Agent Communication & Inter-Office Mesh
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fabd2f] text-[#282828] border border-[#d79921] flex items-center gap-1">
              <Atom className="w-3 h-3 text-[#b57614]" />
              QUANTUM ALIGNMENT TELEMETRY
            </span>
          </div>
          <p className="text-xs text-[#7c6f64] mt-1 leading-relaxed">
            Historical messaging threads between autonomous fleet agents. Hover over any thread or synergy badge to inspect quantum state entanglement, phase coherence, and collaborative resonance scores.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#fbf1c7] border border-[#d5c4a1] rounded-lg px-3 py-1.5 text-center shadow-xs">
            <div className="text-[9px] font-bold uppercase text-[#7c6f64]">Fleet Synergy Index</div>
            <div className="text-lg font-black text-[#b57614] flex items-center justify-center gap-1">
              <span>{avgFleetSynergy}%</span>
              <span className="text-xs font-mono text-[#427b58]">|ψ⟩</span>
            </div>
          </div>

          <button
            onClick={handleSimulateNewChat}
            className="px-3 py-2 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            title="Dispatch simulated autonomous dialogue between two idle fleet agents"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Inter-Agent Chat</span>
          </button>
        </div>
      </div>

      {/* SEARCH, FILTER, AND THRESHOLD CONTROLS */}
      <div className="bg-[#fbf1c7] border-2 border-[#d5c4a1] rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#7c6f64]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inter-agent threads, quotes, topics, or agent names..."
            className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded px-2.5 py-1 text-xs outline-none focus:border-[#b57614] font-medium text-[#282828]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase text-[#7c6f64]">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#f9f5d7] border border-[#d5c4a1] rounded px-2 py-1 text-[11px] font-bold text-[#3c3836] outline-none"
            >
              <option value="all">All Domains</option>
              <option value="security">🛡️ Security</option>
              <option value="sales">📢 Sales & Marketing</option>
              <option value="finance">📊 Finance</option>
              <option value="coding">💻 Coding</option>
              <option value="operations">⚙️ Operations</option>
            </select>
          </div>

          {/* Min Synergy Filter */}
          <div className="flex items-center gap-1.5 bg-[#f9f5d7] px-2 py-1 rounded border border-[#d5c4a1]">
            <span className="text-[10px] font-bold uppercase text-[#7c6f64]">Min Synergy:</span>
            <button
              onClick={() => setMinSynergy(minSynergy === 0 ? 85 : minSynergy === 85 ? 90 : 0)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                minSynergy > 0 ? 'bg-[#b8bb26] text-[#1d2021]' : 'bg-[#ebdbb2] text-[#7c6f64]'
              }`}
            >
              {minSynergy === 0 ? 'Any' : `≥ ${minSynergy}%`}
            </button>
          </div>

          <span className="text-[10px] font-bold text-[#7c6f64]">
            Showing {filteredThreads.length} of {threads.length} threads
          </span>
        </div>
      </div>

      {/* MESSAGING THREADS LIST */}
      <div className="space-y-4">
        {filteredThreads.map((thread) => {
          const isExpanded = expandedThreadId === thread.id;
          const isHovered = hoveredThreadId === thread.id;
          const catBadge = getCategoryBadge(thread.category);
          const synergy = thread.quantumSynergy;

          return (
            <div
              key={thread.id}
              onMouseEnter={(e) => {
                setHoveredThreadId(thread.id);
                setHoverPosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredThreadId(null)}
              className={`bg-[#fbf1c7] border-2 rounded-lg transition-all shadow-xs overflow-hidden relative ${
                isExpanded
                  ? 'border-[#b57614] shadow-md ring-1 ring-[#b57614]/20'
                  : 'border-[#d5c4a1] hover:border-[#bdae93]'
              }`}
            >
              {/* THREAD CARD HEADER */}
              <div
                onClick={() => {
                  soundFx.playClick();
                  setExpandedThreadId(isExpanded ? null : thread.id);
                }}
                className="p-4 cursor-pointer select-none bg-gradient-to-r from-[#fbf1c7] to-[#f9f5d7] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#ebdbb2]"
              >
                {/* AGENT PARTICIPANTS & TOPIC */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* AVATAR BRIDGE */}
                  <div className="flex items-center -space-x-2 shrink-0 pt-0.5">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-[#fbf1c7] flex items-center justify-center font-bold text-xs text-white shadow-xs overflow-hidden"
                      style={{ backgroundColor: thread.agent1Color }}
                      title={`${thread.agent1Name} (${thread.agent1Role})`}
                    >
                      {thread.agent1Avatar && thread.agent1Avatar.startsWith('http') ? (
                        <img src={thread.agent1Avatar} alt={thread.agent1Name} className="w-full h-full object-cover" />
                      ) : (
                        thread.agent1Name[0]
                      )}
                    </div>
                    <div
                      className="w-8 h-8 rounded-full border-2 border-[#fbf1c7] flex items-center justify-center font-bold text-xs text-white shadow-xs overflow-hidden"
                      style={{ backgroundColor: thread.agent2Color }}
                      title={`${thread.agent2Name} (${thread.agent2Role})`}
                    >
                      {thread.agent2Avatar && thread.agent2Avatar.startsWith('http') ? (
                        <img src={thread.agent2Avatar} alt={thread.agent2Name} className="w-full h-full object-cover" />
                      ) : (
                        thread.agent2Name[0]
                      )}
                    </div>
                  </div>

                  {/* THREAD SUMMARY */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-sm text-[#282828] hover:text-[#b57614] transition-colors">
                        {thread.topic}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${catBadge.bg}`}>
                        {catBadge.label}
                      </span>
                      <span className="text-[10px] text-[#7c6f64]">· {thread.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#504945] font-medium">
                      <strong className="text-[#282828]">{thread.agent1Name}</strong>
                      <span className="text-[#b57614] font-bold">⇄</span>
                      <strong className="text-[#282828]">{thread.agent2Name}</strong>
                      <span className="text-[#7c6f64] text-[11px] hidden sm:inline">
                        ({thread.messages.length} messages)
                      </span>
                    </div>

                    {/* LATEST SNIPPET PREVIEW */}
                    <p className="text-xs text-[#7c6f64] mt-1 line-clamp-1 italic font-serif">
                      "{thread.snippet}"
                    </p>
                  </div>
                </div>

                {/* QUANTUM ALIGNMENT & SYNERGY SCORE HOVER TRIGGER */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div
                    className="group/synergy relative cursor-help"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${
                        synergy.synergyScore >= 90
                          ? 'bg-[#b8bb26]/20 border-[#b8bb26] text-[#427b58]'
                          : synergy.synergyScore >= 80
                          ? 'bg-[#fabd2f]/20 border-[#d79921] text-[#b57614]'
                          : 'bg-[#ebdbb2] border-[#d5c4a1] text-[#7c6f64]'
                      }`}
                    >
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#7c6f64]">
                          Quantum Synergy
                        </span>
                        <span className="text-sm font-black font-mono">
                          {synergy.synergyScore}%
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#fbf1c7] border border-[#d5c4a1] flex items-center justify-center font-bold text-xs text-[#b57614] shadow-xs">
                        <Atom className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                      </div>
                    </div>

                    {/* HOVER TOOLTIP: QUANTUM ALIGNMENT POPUP */}
                    <div className="absolute right-0 top-full mt-2 w-80 p-3.5 bg-[#1d2021] text-[#ebdbb2] rounded-lg shadow-2xl border-2 border-[#b57614] z-50 opacity-0 pointer-events-none group-hover/synergy:opacity-100 group-hover/synergy:pointer-events-auto transition-all duration-200 font-sans text-xs">
                      <div className="flex items-center justify-between border-b border-[#3c3836] pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[#fabd2f] font-black uppercase text-[11px]">
                          <Atom className="w-3.5 h-3.5" />
                          <span>Quantum Alignment Matrix</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#b57614] text-[#fbf1c7]">
                          {synergy.synthesisTier}
                        </span>
                      </div>

                      <div className="space-y-2 font-mono text-[11px]">
                        <div className="bg-[#282828] p-2 rounded border border-[#3c3836]">
                          <div className="text-[#8ec07c] text-[10px] font-bold">Basis Wavefunction:</div>
                          <div className="text-[#ebdbb2] truncate">{synergy.quantumBasis}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-[#282828] p-1.5 rounded border border-[#3c3836]">
                            <span className="text-[#a89984] block">Phase Coherence</span>
                            <span className="text-[#b8bb26] font-bold text-xs">{synergy.phaseCoherence}</span>
                          </div>
                          <div className="bg-[#282828] p-1.5 rounded border border-[#3c3836]">
                            <span className="text-[#a89984] block">Resonance Overlap</span>
                            <span className="text-[#fabd2f] font-bold text-xs">{synergy.amplitudeResonance}%</span>
                          </div>
                        </div>

                        <div className="bg-[#282828] p-1.5 rounded border border-[#3c3836]">
                          <span className="text-[#a89984] block text-[10px]">Cross-Dept Entanglement</span>
                          <div className="w-full bg-[#3c3836] h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-[#b8bb26] h-full rounded-full"
                              style={{ width: `${synergy.crossDeptEntanglement}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-1 font-sans text-[11px] text-[#d5c4a1] leading-relaxed">
                          <strong>Synergy Insight:</strong> {synergy.synergyInsight}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    className="text-[#7c6f64] hover:text-[#282828] p-1"
                    title={isExpanded ? 'Collapse thread' : 'Expand full dialogue'}
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* EXPANDED FULL THREAD DIALOGUE */}
              {isExpanded && (
                <div className="p-4 bg-[#f9f5d7] border-t border-[#d5c4a1] space-y-4">
                  {/* QUANTUM COHERENCE SUMMARY BAR */}
                  <div className="bg-[#ebdbb2] border border-[#d5c4a1] rounded-lg p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚛️</span>
                      <div>
                        <div className="font-bold text-[#282828]">
                          Quantum Consensus: <span className="font-normal text-[#504945]">{synergy.decisionConsensus}</span>
                        </div>
                        <div className="text-[10px] text-[#7c6f64] font-mono mt-0.5">
                          {synergy.quantumBasis}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyTranscript(thread)}
                        className="px-2.5 py-1 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-xs font-bold text-[#282828] border border-[#a89984] flex items-center gap-1 transition-colors"
                        title="Copy full inter-office dialogue to clipboard"
                      >
                        {copiedId === thread.id ? <Check className="w-3.5 h-3.5 text-[#427b58]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === thread.id ? 'Copied' : 'Copy Transcript'}</span>
                      </button>

                      {onAssignTask && (
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            onAssignTask(`Follow up: ${thread.topic}`, thread.agent1Id);
                          }}
                          className="px-2.5 py-1 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-xs font-bold text-[#fbf1c7] flex items-center gap-1 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Dispatch Task</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* MESSAGES BUBBLE STREAM */}
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {thread.messages.map((msg, idx) => {
                      const isAgent1 = msg.senderId === thread.agent1Id;
                      const senderColor = isAgent1 ? thread.agent1Color : thread.agent2Color;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex gap-3 text-xs ${isAgent1 ? '' : 'flex-row-reverse'}`}
                        >
                          {/* Sender Initial Bubble */}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: senderColor }}
                          >
                            {msg.senderName[0]}
                          </div>

                          {/* Message Content */}
                          <div
                            className={`p-3 rounded-lg border shadow-xs max-w-[85%] ${
                              isAgent1
                                ? 'bg-[#fbf1c7] border-[#d5c4a1] text-[#282828]'
                                : 'bg-[#ebdbb2] border-[#bdae93] text-[#282828]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className="font-black text-[11px]" style={{ color: senderColor }}>
                                {msg.senderName}
                              </span>
                              <span className="text-[10px] text-[#7c6f64] font-mono">{msg.timestamp}</span>
                            </div>

                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                            {/* Optional code snippet */}
                            {msg.codeSnippet && (
                              <div className="mt-2 p-2 rounded bg-[#1d2021] text-[#ebdbb2] font-mono text-[11px] overflow-x-auto border border-[#3c3836]">
                                <pre>{msg.codeSnippet}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* INTER-OFFICE REPLY FORM */}
                  <div className="pt-2 border-t border-[#d5c4a1] flex items-center gap-2">
                    <input
                      type="text"
                      value={newFollowUpText[thread.id] || ''}
                      onChange={(e) =>
                        setNewFollowUpText((prev) => ({ ...prev, [thread.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendFollowUp(thread.id);
                      }}
                      placeholder={`Inject directive or follow-up to ${thread.agent1Name} and ${thread.agent2Name}...`}
                      className="flex-1 bg-[#fbf1c7] border border-[#d5c4a1] rounded px-3 py-1.5 text-xs outline-none focus:border-[#b57614] text-[#282828]"
                    />
                    <button
                      onClick={() => handleSendFollowUp(thread.id)}
                      disabled={!newFollowUpText[thread.id]?.trim()}
                      className="px-3 py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] disabled:bg-[#d5c4a1] text-[#fbf1c7] text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Transmit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#282828] text-[#fbf1c7] px-4 py-2.5 rounded-lg border-2 border-[#b57614] shadow-2xl font-mono text-xs z-50 animate-bounce">
          {toastMsg}
        </div>
      )}
    </div>
  );
};
