import React, { useState, useRef, useEffect } from 'react';
import { Agent, FleetTask } from '../types';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { soundFx } from '../utils/speech';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionTaken?: {
    type: 'task_assigned' | 'knowledge_searched' | 'standup_called' | 'info';
    taskId?: string;
    agentName?: string;
    category?: string;
  };
  suggestedPrompts?: string[];
}

interface RuffloIntelligenceChatbotProps {
  agents: Agent[];
  tasks: FleetTask[];
  onExecutePrompt: (prompt: string) => Promise<void> | void;
  onOpenDashboard?: () => void;
  onOpenKnowledgeBase?: () => void;
  onAssignTask?: (task: Partial<FleetTask>) => void;
}

export const RuffloIntelligenceChatbot: React.FC<RuffloIntelligenceChatbotProps> = ({
  agents,
  tasks,
  onExecutePrompt,
  onOpenDashboard,
  onOpenKnowledgeBase,
  onAssignTask,
}) => {
  const [inputCommand, setInputCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: '✦ **Rufflo Intelligence Core Online.** I am your Scranton fleet orchestrator. Give me commands to decompose missions, assign tasks to agents (Dwight/Hacker, Pam/HR, Jim/Marketing, Kevin/Finance, Ryan/Social), or search the Dynamic Knowledge Base.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        '🛡️ Assign Dwight to run a security audit',
        '📢 Have Jim design a marketing funnel',
        '📊 Ask Kevin to check compute costs',
        '🧠 Search knowledge base for hacking',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendCommand = async (cmdText?: string) => {
    const textToSend = (cmdText || inputCommand).trim();
    if (!textToSend || isProcessing) return;

    soundFx.playClick();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputCommand('');
    setIsProcessing(true);

    const lower = textToSend.toLowerCase();

    // 1. Check for Knowledge Base Search Intent
    if (lower.includes('search') || lower.includes('knowledge') || lower.includes('kb') || lower.includes('look up')) {
      setTimeout(() => {
        const query = textToSend.replace(/search|knowledge|base|kb|look up|for/gi, '').trim();
        const results = knowledgeBaseService.search({ query: query || undefined });
        const count = results.length;

        let reply = `🔍 **Knowledge Base Query:** Found **${count}** verified entries matching "${query || 'all'}".\n\n`;
        if (count > 0) {
          results.slice(0, 3).forEach((r, idx) => {
            reply += `**${idx + 1}. [${r.category.toUpperCase()}] ${r.title}**\n> ${r.summary}\n*Actionable:* ${r.actionableInsight}\n\n`;
          });
          if (count > 3) {
            reply += `*(plus ${count - 3} more entries stored in the Dynamic Knowledge Base)*`;
          }
        } else {
          reply += `No exact matches. Agents continuously update the repository as missions complete.`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: { type: 'knowledge_searched', category: 'general' },
            suggestedPrompts: [
              '📋 Open Knowledge Base Explorer',
              '🛡️ Audit security vulnerabilities',
              '📊 Reconcile financial ledger',
            ],
          },
        ]);
        setIsProcessing(false);
        soundFx.playSuccess();
      }, 600);
      return;
    }

    // 2. Check for Agent Task Assignment Intents
    let targetAgent: Agent | undefined = undefined;
    let taskCategory: 'hacking' | 'marketing' | 'finance' | 'coding' | 'social_media' = 'coding';
    let taskTitle = '';

    if (lower.includes('dwight') || lower.includes('hack') || lower.includes('security') || lower.includes('audit') || lower.includes('pen-test')) {
      targetAgent = agents.find((a) => a.id === 'dwight') || agents[0];
      taskCategory = 'hacking';
      taskTitle = 'Perimeter Security & Vulnerability Scan';
    } else if (lower.includes('pam') || lower.includes('hr') || lower.includes('policy') || lower.includes('people') || lower.includes('onboard')) {
      targetAgent = agents.find((a) => a.id === 'pam') || agents[0];
      taskCategory = 'marketing';
      taskTitle = 'HR Policy & Team Compliance Memo';
    } else if (lower.includes('jim') || lower.includes('market') || lower.includes('funnel') || lower.includes('campaign') || lower.includes('client')) {
      targetAgent = agents.find((a) => a.id === 'jim') || agents[0];
      taskCategory = 'marketing';
      taskTitle = 'B2B Client Acquisition & Value Proposition';
    } else if (lower.includes('kevin') || lower.includes('finance') || lower.includes('cost') || lower.includes('budget') || lower.includes('ledger') || lower.includes('runway')) {
      targetAgent = agents.find((a) => a.id === 'kevin') || agents[0];
      taskCategory = 'finance';
      taskTitle = 'Cloud Compute Unit Economics & Ledger Audit';
    } else if (lower.includes('ryan') || lower.includes('social') || lower.includes('viral') || lower.includes('tiktok') || lower.includes('linkedin') || lower.includes('hook')) {
      targetAgent = agents.find((a) => a.id === 'ryan') || agents[0];
      taskCategory = 'social_media';
      taskTitle = 'Cross-Platform Viral Hook & Cadence Strategy';
    } else if (lower.includes('code') || lower.includes('engineer') || lower.includes('dev') || lower.includes('refactor') || lower.includes('typescript') || lower.includes('api')) {
      targetAgent = agents.find((a) => a.id.includes('code') || a.id.includes('coder')) || agents[0];
      taskCategory = 'coding';
      taskTitle = 'Production TypeScript & API Optimization';
    }

    if (targetAgent) {
      // Dispatch real task
      const newTaskId = `task-cmd-${Date.now()}`;
      if (onAssignTask) {
        onAssignTask({
          id: newTaskId,
          title: taskTitle,
          description: textToSend,
          assignedTo: targetAgent.id,
          priority: 'high',
          status: 'running',
          progress: 25,
          createdAt: Date.now(),
        });
      }

      // Also trigger execution prompt
      onExecutePrompt(textToSend);

      setTimeout(() => {
        const reply = `⚡ **Mission Dispatched to ${targetAgent.name} (${targetAgent.role})**\n\n- **Directive:** "${textToSend}"\n- **Domain:** ${taskCategory.toUpperCase()}\n- **Status:** Execution in progress. Sandbox initialized with zero-trust authority verification.\n- **Continuous Learning:** Resulting intelligence will be distilled into the Dynamic Knowledge Base upon completion.\n\n*Track real-time progress in the Munder Diffl.in Dashboard.*`;

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: {
              type: 'task_assigned',
              taskId: newTaskId,
              agentName: targetAgent.name,
              category: taskCategory,
            },
            suggestedPrompts: [
              '📋 Open Munder Diffl.in Dashboard',
              '⏱️ Check Active Task Progress',
              '🧠 Query Learned Knowledge',
            ],
          },
        ]);
        setIsProcessing(false);
        soundFx.playSuccess();
      }, 700);
      return;
    }

    // 3. General Rufflo Copilot Command execution via LLM / Agent loop
    try {
      await onExecutePrompt(textToSend);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: `✦ **Instruction executed across Rufflo Core.** The fleet evaluated the directive and logged operational telemetry to the system stream. You can inspect deliverables in the Munder Diffl.in Dashboard.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedPrompts: [
              '🛡️ Run zero-trust security audit',
              '📢 Generate B2B marketing campaign',
              '📊 Calculate monthly compute runway',
            ],
          },
        ]);
        setIsProcessing(false);
      }, 800);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Error during execution: ${e?.message || 'Unable to complete directive.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181615] text-[#ebdbb2] font-mono select-none">
      {/* HEADER */}
      <div className="px-3.5 py-2.5 border-b border-[#3c3836] bg-[#282828] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#fabd2f] text-[#1d2021] flex items-center justify-center font-bold text-xs shadow-xs">
            ✦
          </div>
          <div>
            <div className="text-xs font-black text-[#fabd2f] tracking-wide">
              Rufflo Intelligence
            </div>
            <div className="text-[9px] text-[#928374]">
              Autonomous Fleet Command & Chatbot
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#b8bb26] animate-pulse" />
          <span className="text-[10px] text-[#b8bb26] font-bold">READY</span>
        </div>
      </div>

      {/* QUICK SHORTCUT ACTION BAR */}
      <div className="px-3 py-1.5 bg-[#201e1c] border-b border-[#322e2b] flex items-center gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
        {onOpenDashboard && (
          <button
            onClick={() => { soundFx.playClick(); onOpenDashboard(); }}
            className="px-2 py-0.5 rounded bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] font-bold whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <span>📋</span> Munderdiffl.in Dashboard
          </button>
        )}
        {onOpenKnowledgeBase && (
          <button
            onClick={() => { soundFx.playClick(); onOpenKnowledgeBase(); }}
            className="px-2 py-0.5 rounded bg-[#b57614]/30 hover:bg-[#b57614]/50 text-[#fabd2f] font-bold whitespace-nowrap border border-[#b57614]/40 transition-colors flex items-center gap-1"
          >
            <span>🧠</span> Knowledge Base
          </button>
        )}
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] p-2.5 rounded-lg text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#fabd2f] text-[#1d2021] font-medium font-sans shadow-xs'
                    : 'bg-[#282828] text-[#ebdbb2] border border-[#3c3836] shadow-xs'
                }`}
              >
                {!isUser && (
                  <div className="text-[9px] font-bold text-[#fabd2f] mb-1 flex items-center justify-between">
                    <span>RUFFLO INTELLIGENCE</span>
                    <span className="text-[#928374] font-normal">{msg.timestamp}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.text}
                </div>

                {/* Action Card inside Bot Message */}
                {msg.actionTaken && (
                  <div className="mt-2 pt-2 border-t border-[#3c3836] flex items-center justify-between text-[10px]">
                    <span className="text-[#b8bb26] font-bold">
                      ✓ {msg.actionTaken.type === 'task_assigned' ? `Assigned to ${msg.actionTaken.agentName}` : 'Query Executed'}
                    </span>
                    {onOpenDashboard && (
                      <button
                        onClick={() => { soundFx.playClick(); onOpenDashboard(); }}
                        className="px-1.5 py-0.5 rounded bg-[#3c3836] hover:bg-[#504945] text-[#fabd2f] font-bold"
                      >
                        View Dashboard →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Suggested prompt chips */}
              {!isUser && msg.suggestedPrompts && (
                <div className="flex flex-wrap gap-1 mt-1.5 max-w-[95%]">
                  {msg.suggestedPrompts.map((prompt, pi) => (
                    <button
                      key={pi}
                      onClick={() => {
                        if (prompt.includes('Dashboard') && onOpenDashboard) {
                          onOpenDashboard();
                        } else if (prompt.includes('Knowledge') && onOpenKnowledgeBase) {
                          onOpenKnowledgeBase();
                        } else {
                          handleSendCommand(prompt);
                        }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#282828] hover:bg-[#3c3836] text-[#a89984] hover:text-[#fabd2f] border border-[#3c3836] transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-[#fabd2f] bg-[#282828] p-2 rounded border border-[#3c3836] max-w-[80%]">
            <span className="animate-spin text-sm">⌁</span>
            <span>Rufflo Intelligence evaluating command...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT COMMAND BOX */}
      <div className="p-2.5 bg-[#201e1c] border-t border-[#3c3836]">
        <div className="relative">
          <textarea
            rows={2}
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendCommand();
              }
            }}
            placeholder="Command Rufflo fleet or ask a question... (Enter to send)"
            className="w-full bg-[#181615] border border-[#3c3836] focus:border-[#fabd2f] rounded p-2 text-xs text-[#ebdbb2] outline-none resize-none font-sans"
          />
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <div className="text-[9px] text-[#7c6f64]">
            Try: <span className="text-[#a89984] cursor-pointer hover:underline" onClick={() => handleSendCommand('Assign Dwight to audit security')}>"Assign Dwight..."</span> or <span className="text-[#a89984] cursor-pointer hover:underline" onClick={() => handleSendCommand('Search knowledge base for marketing')}>"Search KB..."</span>
          </div>

          <button
            onClick={() => handleSendCommand()}
            disabled={!inputCommand.trim() || isProcessing}
            className="px-3 py-1 rounded bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>Execute</span>
            <span>↗</span>
          </button>
        </div>
      </div>
    </div>
  );
};
