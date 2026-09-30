import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Plus,
  Trash2,
  Settings,
  BookOpen,
  FileText,
  Code,
  Globe,
  Terminal,
  Paperclip,
  Check,
  Copy,
  Cpu,
  Layers,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Activity,
  Zap,
  Sliders,
  Play,
  Share2,
  Mic,
  MicOff,
} from 'lucide-react';
import { intelligenceService, QUANTUM_MODELS, IntelligenceModel } from '../utils/intelligenceService';
import { UserProfile, FleetTask, Agent } from '../types';

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  model: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    toolsUsed?: string[];
  }>;
}

interface Modelfile {
  id: string;
  name: string;
  baseModel: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
}

interface OpenWebUIModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  agents?: Agent[];
  onAddTask?: (task: Partial<FleetTask>) => void;
  onExecuteCode?: (code: string) => Promise<any>;
}

export const OpenWebUIModal: React.FC<OpenWebUIModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  agents = [],
  onAddTask,
  onExecuteCode,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'models' | 'knowledge' | 'settings'>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [enableBrowserUse, setEnableBrowserUse] = useState<boolean>(true);
  const [enableWebSearch, setEnableWebSearch] = useState<boolean>(true);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('open_webui_sessions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'session-default',
        title: 'Gemini Architecture Session',
        timestamp: new Date().toLocaleTimeString(),
        model: 'gemini-2.5-flash',
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            content:
              '**Welcome to Open WebUI (Rufflo OS Edition)** 🚀\n\nConnected directly to **Google Gemini Models**, **Rufflo Quantum Engine**, and the **Playwright Browser-Use Engine**.\n\n• **Real-time Streaming**: Instant token response with zero buffering\n• **Browser-Use Active**: Live Chromium web scraping, DOM analysis, and multi-hop navigation\n• **Modelfiles & RAG**: Customizable system instructions and integrated company knowledge\n\nHow can Open WebUI assist your enterprise operations today?',
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('session-default');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeToolNotification, setActiveToolNotification] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Settings State
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are Open WebUI powered by Google Gemini and Rufflo Autonomous OS. Provide rigorous, production-grade technical code, concise architectural analyses, and live browser extractions.'
  );
  const [temperature, setTemperature] = useState<number>(0.7);
  const [endpointUrl, setEndpointUrl] = useState<string>('/api/orchestrator/stream');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'error'>('connected');

  // Modelfiles List
  const [modelfiles, setModelfiles] = useState<Modelfile[]>([
    {
      id: 'mf-gemini-eng',
      name: 'Gemini 2.5 Lead Software Architect',
      baseModel: 'gemini-2.5-pro',
      systemPrompt: 'You are a Principal Software Architect. Output clean TypeScript, resilient modular code, and high-performance algorithms.',
      temperature: 0.4,
      topP: 0.9,
    },
    {
      id: 'mf-browser-research',
      name: 'Playwright Browser Researcher',
      baseModel: 'gemini-2.5-flash',
      systemPrompt: 'You are an autonomous web scraper and intelligence gatherer. Extract structural DOM elements and synthesize web findings.',
      temperature: 0.5,
      topP: 0.8,
    },
    {
      id: 'mf-quantum-agent',
      name: 'Rufflo Quantum Agent Directives',
      baseModel: 'rufflo-quantum-v2',
      systemPrompt: 'Execute the 4-Step Quantum Processing Loop: Deeper Context, Harder Analysis, Faster Execution, and Quantum Intelligence Upgrade.',
      temperature: 0.7,
      topP: 0.95,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isStreaming, activeToolNotification]);

  useEffect(() => {
    try {
      localStorage.setItem('open_webui_sessions', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // Test connection on mount
  useEffect(() => {
    if (isOpen) {
      intelligenceService.testConnection().then((res) => {
        setConnectionStatus(res.ok ? 'connected' : 'error');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `New Session (${selectedModel.split('-')[0].toUpperCase()})`,
      timestamp: new Date().toLocaleTimeString(),
      model: selectedModel,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `New chat session initialized on **${selectedModel}**. Browser-Use and Web Research capabilities are **ONLINE**.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) return;
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isStreaming) return;

    setInputPrompt('');
    const userMsgId = `msg-user-${Date.now()}`;
    const assistantMsgId = `msg-ai-${Date.now()}`;

    // Update Session with User Message & Empty Assistant Placeholder
    const updatedMessages = [
      ...currentSession.messages,
      {
        id: userMsgId,
        role: 'user' as const,
        content: text,
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: assistantMsgId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date().toLocaleTimeString(),
      },
    ];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: s.messages.length <= 1 ? text.slice(0, 30) + '...' : s.title,
              messages: updatedMessages,
            }
          : s
      )
    );

    setIsStreaming(true);
    setActiveToolNotification(null);

    try {
      await intelligenceService.streamResponse({
        prompt: text,
        messages: updatedMessages.slice(0, -1).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        model: selectedModel,
        systemPrompt,
        temperature,
        useBrowser: enableBrowserUse,
        onStepStart: (step) => {
          setActiveToolNotification(`[${step.role?.toUpperCase() || 'TOOL'}] ${step.objective}`);
        },
        onToken: (token) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== currentSession.id) return s;
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              if (last && last.id === assistantMsgId) {
                last.content += token;
              }
              return { ...s, messages: msgs };
            })
          );
        },
        onStepComplete: () => {
          setActiveToolNotification(null);
        },
        onComplete: () => {
          setIsStreaming(false);
          setActiveToolNotification(null);
        },
        onError: (err) => {
          setIsStreaming(false);
          setActiveToolNotification(null);
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== currentSession.id) return s;
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              if (last && last.id === assistantMsgId) {
                last.content += `\n\n*(Open WebUI Streaming Connection Error: ${err.message})*`;
              }
              return { ...s, messages: msgs };
            })
          );
        },
      });
    } catch {
      setIsStreaming(false);
      setActiveToolNotification(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[88vh] bg-[#1d2021] border border-[#3c3836] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#ebdbb2] font-sans">
        
        {/* Top Header Bar */}
        <div className="h-14 border-b border-[#3c3836] bg-[#282828] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-white">OPEN WEB UI</span>
                  <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ACTIVE v0.5.8
                  </span>
                </div>
                <div className="text-[10px] text-[#a89984]">
                  Gemini AI & Autonomous Browser Integration
                </div>
              </div>
            </div>

            {/* Model Selector Pill */}
            <div className="relative ml-4">
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  intelligenceService.setCurrentModel(e.target.value);
                }}
                className="bg-[#1d2021] border border-[#504945] text-xs font-semibold text-[#fabd2f] rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-[#fabd2f] cursor-pointer shadow-sm"
              >
                {QUANTUM_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.badge})
                  </option>
                ))}
                <option value="llama-3.3-70b">Llama 3.3 70B (Local Ollama)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#a89984] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[#1d2021] p-1 rounded-lg border border-[#3c3836]">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-[#3d6b4f] text-white shadow-sm'
                  : 'text-[#a89984] hover:text-[#ebdbb2]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'models'
                  ? 'bg-[#3d6b4f] text-white shadow-sm'
                  : 'text-[#a89984] hover:text-[#ebdbb2]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Modelfiles</span>
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'knowledge'
                  ? 'bg-[#3d6b4f] text-white shadow-sm'
                  : 'text-[#a89984] hover:text-[#ebdbb2]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Knowledge / RAG</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-[#3d6b4f] text-white shadow-sm'
                  : 'text-[#a89984] hover:text-[#ebdbb2]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>

          {/* Action Tools & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEnableBrowserUse(!enableBrowserUse)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                enableBrowserUse
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                  : 'bg-[#1d2021] border-[#504945] text-[#928374]'
              }`}
              title="Toggle Playwright Headless Browser Navigation & DOM Extraction"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{enableBrowserUse ? 'Browser-Use ON' : 'Browser-Use OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#32302f] hover:bg-[#458588] text-[#a89984] hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* TAB 1: CHAT */}
          {activeTab === 'chat' && (
            <>
              {/* Left Sidebar: Session List */}
              <div className="w-64 border-r border-[#3c3836] bg-[#242424] flex flex-col">
                <div className="p-3 border-b border-[#3c3836]">
                  <button
                    onClick={handleCreateNewChat}
                    className="w-full py-2 px-3 rounded-lg bg-[#3d6b4f] hover:bg-[#4d8664] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Chat Session</span>
                  </button>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <div className="text-[10px] font-bold text-[#7c6f64] px-2 py-1 uppercase tracking-wider">
                    Recent Conversations
                  </div>
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveSessionId(s.id)}
                      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        s.id === activeSessionId
                          ? 'bg-[#32302f] text-white font-medium border border-[#504945]'
                          : 'text-[#a89984] hover:bg-[#282828] hover:text-[#ebdbb2]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Bot className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                        <span className="truncate">{s.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-opacity"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Connected Agent Fleet Status */}
                <div className="p-3 border-t border-[#3c3836] bg-[#1d2021]/60 text-[11px] text-[#a89984] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quantum Gateway</span>
                  </div>
                  <span className="text-emerald-400 font-bold">ONLINE</span>
                </div>
              </div>

              {/* Center Chat Arena */}
              <div className="flex-1 flex flex-col bg-[#1d2021] overflow-hidden">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentSession.messages.map((m) => {
                    const isUser = m.role === 'user';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto justify-end' : 'mr-auto'}`}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl p-4 text-xs md:text-[13px] leading-relaxed max-w-[85%] ${
                            isUser
                              ? 'bg-[#3d6b4f] text-white rounded-tr-none shadow-md'
                              : 'bg-[#282828] text-[#ebdbb2] border border-[#3c3836] rounded-tl-none shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/10 text-[10px] opacity-75">
                            <span className="font-bold">
                              {isUser ? userProfile?.displayName || 'Operator' : selectedModel}
                            </span>
                            <span>{m.timestamp}</span>
                          </div>

                          <div className="whitespace-pre-wrap font-sans break-words">
                            {m.content}
                          </div>

                          {!isUser && m.content.includes('```') && (
                            <div className="mt-3 pt-2 border-t border-[#3c3836] flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(m.content, m.id)}
                                className="px-2 py-1 rounded bg-[#32302f] hover:bg-[#3c3836] text-[10px] font-bold text-[#fabd2f] flex items-center gap-1"
                              >
                                {copiedCodeId === m.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedCodeId === m.id ? 'Copied' : 'Copy Code'}</span>
                              </button>

                              {onExecuteCode && (
                                <button
                                  onClick={() => {
                                    const match = m.content.match(/```(?:typescript|javascript|ts|js)?([\s\S]*?)```/);
                                    if (match && match[1]) {
                                      onExecuteCode(match[1]);
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-800/60 hover:bg-emerald-700 text-[10px] font-bold text-white flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  <span>Execute in Sandbox</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Active Tool Step Notification Card */}
                  {activeToolNotification && (
                    <div className="flex items-center gap-2 p-3 bg-[#282828] border border-emerald-500/40 rounded-xl text-xs text-emerald-300 max-w-xl animate-pulse">
                      <Terminal className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold">Tool Execution: </span>
                        <span>{activeToolNotification}</span>
                      </div>
                    </div>
                  )}

                  {isStreaming && !activeToolNotification && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Streaming response from Quantum Intelligence...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested Action Chips */}
                <div className="px-4 py-1.5 bg-[#242424] border-t border-[#3c3836] flex items-center gap-2 overflow-x-auto text-[11px]">
                  <span className="text-[#7c6f64] font-bold whitespace-nowrap">Suggested:</span>
                  <button
                    onClick={() =>
                      handleSendMessage(
                        'Browse https://news.ycombinator.com and extract top autonomous AI breakthroughs'
                      )
                    }
                    disabled={isStreaming}
                    className="px-2.5 py-1 rounded-full bg-[#1d2021] hover:bg-[#32302f] border border-[#3c3836] text-[#8ec07c] whitespace-nowrap"
                  >
                    🌐 Scrape Hacker News Live
                  </button>
                  <button
                    onClick={() =>
                      handleSendMessage(
                        'Analyze current system architecture and write a TypeScript load balancer optimization'
                      )
                    }
                    disabled={isStreaming}
                    className="px-2.5 py-1 rounded-full bg-[#1d2021] hover:bg-[#32302f] border border-[#3c3836] text-[#fabd2f] whitespace-nowrap"
                  >
                    ⚡ Code Optimizer
                  </button>
                  <button
                    onClick={() =>
                      handleSendMessage(
                        'Synthesize an executive briefing for the Administrator and queue 3 high-priority fleet tasks'
                      )
                    }
                    disabled={isStreaming}
                    className="px-2.5 py-1 rounded-full bg-[#1d2021] hover:bg-[#32302f] border border-[#3c3836] text-[#83a598] whitespace-nowrap"
                  >
                    📋 Auto-Task Generation
                  </button>
                </div>

                {/* Input Area */}
                <div className="p-3 bg-[#242424] border-t border-[#3c3836]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex gap-2 items-center bg-[#1d2021] border border-[#504945] rounded-xl px-3 py-2 focus-within:border-[#fabd2f] transition-all">
                      <textarea
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={`Message ${selectedModel}... (Enter to send, Shift+Enter for new line)`}
                        rows={2}
                        className="flex-1 bg-transparent text-xs text-[#ebdbb2] placeholder-[#7c6f64] focus:outline-none resize-none font-sans"
                        disabled={isStreaming}
                      />
                      <button
                        type="submit"
                        disabled={isStreaming || !inputPrompt.trim()}
                        className="p-2 rounded-lg bg-[#3d6b4f] hover:bg-[#4d8664] disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-md"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#a89984] px-1">
                      <div className="flex items-center gap-3">
                        <span>Model: <strong className="text-[#fabd2f]">{selectedModel}</strong></span>
                        <span>•</span>
                        <span>Engine: <strong className="text-emerald-400">Playwright Chromium</strong></span>
                      </div>
                      <span>Open WebUI Rufflo Edition</span>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MODELFILES */}
          {activeTab === 'models' && (
            <div className="flex-1 p-6 overflow-y-auto bg-[#1d2021]">
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <span>Modelfiles & Custom Agent Personas</span>
                  </h2>
                  <p className="text-xs text-[#a89984] mt-1">
                    Configure and customize tailored system prompts, context parameters, and temperature bounds for Open WebUI models.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modelfiles.map((mf) => (
                    <div
                      key={mf.id}
                      className="p-4 rounded-xl bg-[#282828] border border-[#3c3836] hover:border-[#504945] transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-white">{mf.name}</span>
                          <span className="text-[10px] bg-[#3d6b4f] text-white px-2 py-0.5 rounded-full font-mono">
                            {mf.baseModel}
                          </span>
                        </div>
                        <p className="text-xs text-[#ebdbb2] bg-[#1d2021] p-3 rounded-lg border border-[#32302f] font-mono leading-relaxed mb-3">
                          {mf.systemPrompt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#3c3836] text-[11px] text-[#a89984]">
                        <span>Temp: {mf.temperature} · Top-P: {mf.topP}</span>
                        <button
                          onClick={() => {
                            setSelectedModel(mf.baseModel);
                            setSystemPrompt(mf.systemPrompt);
                            setTemperature(mf.temperature);
                            setActiveTab('chat');
                          }}
                          className="px-2.5 py-1 rounded bg-[#3d6b4f] hover:bg-[#4d8664] text-white text-[10px] font-bold flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Load Persona</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KNOWLEDGE / RAG */}
          {activeTab === 'knowledge' && (
            <div className="flex-1 p-6 overflow-y-auto bg-[#1d2021]">
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <span>Knowledge Base & Document Ingestion (RAG)</span>
                  </h2>
                  <p className="text-xs text-[#a89984] mt-1">
                    Connect documents, technical documentation, and web sources directly into Open WebUI vector context.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#282828] border border-[#3c3836] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#fabd2f]">Available Corporate Knowledge Collections</span>
                    <button
                      onClick={() => alert('Corporate Knowledge Indexing triggered.')}
                      className="px-3 py-1 bg-[#3d6b4f] hover:bg-[#4d8664] text-white text-xs font-bold rounded-lg"
                    >
                      + Ingest New Collection
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-[#1d2021] rounded-lg border border-[#3c3836] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#8ec07c]" />
                        <span className="font-semibold text-white">Rufflo Autonomous Company Operating Directives</span>
                      </div>
                      <span className="text-[10px] text-[#a89984]">42,500 Tokens Indexed</span>
                    </div>

                    <div className="p-3 bg-[#1d2021] rounded-lg border border-[#3c3836] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-[#fabd2f]" />
                        <span className="font-semibold text-white">Control Plane Tool Gateway & Playwright API Specs</span>
                      </div>
                      <span className="text-[10px] text-[#a89984]">88,100 Tokens Indexed</span>
                    </div>

                    <div className="p-3 bg-[#1d2021] rounded-lg border border-[#3c3836] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#83a598]" />
                        <span className="font-semibold text-white">Live Web Search & Scraping Vector Cache</span>
                      </div>
                      <span className="text-[10px] text-[#a89984]">Real-time Auto Ingestion</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="flex-1 p-6 overflow-y-auto bg-[#1d2021]">
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-400" />
                    <span>Open WebUI Pipeline & Endpoint Settings</span>
                  </h2>
                  <p className="text-xs text-[#a89984] mt-1">
                    Manage backend connections to Google Gemini, Ollama, OpenAI-compatible servers, and Quantum Orchestrator.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#282828] border border-[#3c3836] space-y-4 text-xs">
                  <div>
                    <label className="block text-[#a89984] font-bold mb-1">Quantum Intelligence Streaming Endpoint URL</label>
                    <input
                      type="text"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      className="w-full bg-[#1d2021] border border-[#504945] rounded-lg p-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[#a89984] font-bold mb-1">Default System Instruction Prompt</label>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-[#1d2021] border border-[#504945] rounded-lg p-2 text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#a89984] font-bold mb-1">Sampling Temperature ({temperature})</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#1d2021] rounded-lg border border-[#3c3836]">
                      <span>Connection Status</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OpenWebUIModal;
