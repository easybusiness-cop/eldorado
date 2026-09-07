import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Plus,
  RefreshCw,
  Users,
  ShieldCheck,
  Bot,
  Sparkles,
  Hash,
  Smile,
  CheckCircle,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import {
  type GoogleChatSpace,
  type GoogleChatMessage,
  fetchChatSpaces,
  fetchChatMessages,
  sendChatMessage,
  createChatSpace,
} from '../../utils/googleChatService';

interface GoogleChatTabProps {
  token: string | null;
  onSignIn: () => void;
  statusMsg?: string | null;
  setStatusMsg: (msg: string | null) => void;
}

export function GoogleChatTab({ token, onSignIn, setStatusMsg }: GoogleChatTabProps) {
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSpaces();
  }, [token]);

  useEffect(() => {
    if (selectedSpace) {
      loadMessages(selectedSpace.name);
    }
  }, [selectedSpace, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSpaces = async () => {
    setIsLoadingSpaces(true);
    try {
      const data = await fetchChatSpaces(token);
      setSpaces(data);
      if (data.length > 0 && !selectedSpace) {
        setSelectedSpace(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading chat spaces:', err);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const loadMessages = async (spaceName: string) => {
    setIsLoadingMessages(true);
    try {
      const data = await fetchChatMessages(token, spaceName);
      setMessages(data);
    } catch (err: any) {
      console.error('Error loading chat messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim() || !selectedSpace || isSending) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      const created = await sendChatMessage(token, selectedSpace.name, textToSend);
      setMessages((prev) => [...prev, created]);
      setStatusMsg('Message sent to Google Chat!');
    } catch (err: any) {
      setStatusMsg(`Failed to send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    try {
      const created = await createChatSpace(token, newSpaceName.trim(), newSpaceDesc.trim());
      setSpaces((prev) => [created, ...prev]);
      setSelectedSpace(created);
      setIsCreateModalOpen(false);
      setNewSpaceName('');
      setNewSpaceDesc('');
      setStatusMsg(`Space "${created.displayName}" created in Google Chat!`);
    } catch (err: any) {
      setStatusMsg(`Failed to create space: ${err.message}`);
    }
  };

  const handleAgentBroadcast = async () => {
    if (!selectedSpace) return;
    const broadcastText = `🤖 [Autonomous Fleet Status] All 18 virtual employee agents operating at 100% throughput. Live radar intelligence grounded with 0 errors. Corporate cascade sync complete.`;
    setMessageInput(broadcastText);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#181615]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#1d2021]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Google Chat Enterprise Fleet Hub
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                Google Chat API v1
              </span>
            </h3>
            <p className="text-xs text-[#a89984]">
              Real-time multi-agent communication, Chat Spaces, Direct Messages, and executive broadcasts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!token && (
            <button
              onClick={onSignIn}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              Sign In with Google
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Space</span>
          </button>
          <button
            onClick={loadSpaces}
            disabled={isLoadingSpaces}
            className="p-1.5 text-[#a89984] hover:text-white bg-[#282828] hover:bg-[#3c3836] border border-[#3c3836] rounded-lg transition-colors"
            title="Refresh Spaces"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Spaces List */}
        <div className="w-72 border-r border-[#3c3836] bg-[#141211] flex flex-col">
          <div className="p-3 border-b border-[#3c3836]/60 flex items-center justify-between text-[11px] font-bold text-[#a89984] tracking-wider uppercase">
            <span>Chat Spaces ({spaces.length})</span>
            <button
              onClick={handleAgentBroadcast}
              className="text-teal-400 hover:text-teal-300 text-[10px] flex items-center gap-1 normal-case"
              title="Quick Agent Broadcast"
            >
              <Sparkles className="w-3 h-3" /> Broadcast
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {spaces.map((space) => {
              const isSelected = selectedSpace?.name === space.name;
              return (
                <button
                  key={space.name}
                  onClick={() => setSelectedSpace(space)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                      : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 p-1 rounded ${isSelected ? 'bg-teal-500/20 text-teal-300' : 'bg-[#282828] text-[#a89984]'}`}>
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-white">
                      {space.displayName || space.name.replace('spaces/', '')}
                    </div>
                    {space.spaceDetails?.description && (
                      <p className="text-[11px] text-[#a89984] line-clamp-1 mt-0.5">
                        {space.spaceDetails.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[#7c6f64]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {space.membershipCount?.joinedDirectHumanUserCount || 2} members
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Live Auth Status */}
          <div className="p-3 border-t border-[#3c3836] bg-[#1d2021] text-[11px] text-[#a89984] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {token ? 'Google Chat OAuth Active' : 'Demo Mode (Sign-in for Live Sync)'}
            </span>
          </div>
        </div>

        {/* Right Column: Chat Stream & Message Input */}
        <div className="flex-1 flex flex-col bg-[#121110]">
          {selectedSpace ? (
            <>
              {/* Space Header */}
              <div className="px-6 py-3 border-b border-[#3c3836] bg-[#181615] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Hash className="w-4 h-4 text-teal-400" />
                    {selectedSpace.displayName || selectedSpace.name}
                  </h4>
                  {selectedSpace.spaceDetails?.description && (
                    <p className="text-xs text-[#a89984] mt-0.5">
                      {selectedSpace.spaceDetails.description}
                    </p>
                  )}
                </div>
                <a
                  href="https://chat.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  <span>Open in Google Chat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-48 text-xs text-[#a89984]">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2 text-teal-400" />
                    Loading space messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-[#a89984] space-y-2">
                    <MessageCircle className="w-10 h-10 mx-auto text-[#504945]" />
                    <p className="text-xs">No messages yet in this space.</p>
                    <p className="text-[11px] text-[#7c6f64]">Send a message below to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isBot = msg.sender?.type === 'BOT';
                    return (
                      <div key={msg.name} className="flex items-start gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-teal-400 overflow-hidden">
                          {msg.sender?.avatarUrl ? (
                            <img src={msg.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : isBot ? (
                            <Bot className="w-4 h-4 text-teal-300" />
                          ) : (
                            <Users className="w-4 h-4 text-amber-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-white">
                              {msg.sender?.displayName || 'Workspace Member'}
                            </span>
                            {isBot && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono font-bold">
                                BOT
                              </span>
                            )}
                            <span className="text-[10px] text-[#7c6f64]">
                              {new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-[#ebdbb2] leading-relaxed bg-[#1d2021] border border-[#3c3836] rounded-xl p-3 inline-block max-w-2xl">
                            {msg.text}
                          </div>
                          {msg.emojiReactionSummaries && msg.emojiReactionSummaries.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              {msg.emojiReactionSummaries.map((rx, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2 py-0.5 rounded-full bg-[#282828] border border-[#3c3836] text-[#ebdbb2] flex items-center gap-1"
                                >
                                  <span>{rx.emoji?.unicode || '👍'}</span>
                                  <span className="text-[10px] text-[#a89984]">{rx.reactionCount || 1}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#3c3836] bg-[#181615]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message ${selectedSpace.displayName || 'space'}...`}
                    className="flex-1 bg-[#121110] border border-[#3c3836] focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#7c6f64] focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !messageInput.trim()}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#a89984]">
              Select a space on the left to view messages
            </div>
          )}
        </div>
      </div>

      {/* Create Space Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-400" />
                Create Google Chat Space
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#a89984] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">
                  Space Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g. 🚀 Q4 Autonomous Roadmap"
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-teal-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">
                  Description & Guidelines
                </label>
                <textarea
                  rows={3}
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  placeholder="Purpose of this space, participating agents, and SLAs..."
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-teal-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSpaceName.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
