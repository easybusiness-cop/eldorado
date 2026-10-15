import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Search,
  Globe,
  Radio,
  Shield,
  Bot,
  User,
  Settings,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Pin,
  Lock,
  Compass,
  Zap,
  Info,
  Key,
  X,
  Eye,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { soundFx } from '../utils/speech';
import { TelegramChat, TelegramMessage } from '../types/telegram';

interface TelegramHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAgentTask?: (prompt: string) => void;
}

export const TelegramHubModal: React.FC<TelegramHubModalProps> = ({
  isOpen,
  onClose,
  onTriggerAgentTask,
}) => {
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'live_channels' | 'search_discover' | 'bot_api'>('live_channels');

  // Search tab state
  const [searchTarget, setSearchTarget] = useState('durov');
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    chats: TelegramChat[];
    messages: TelegramMessage[];
  }>({ chats: [], messages: [] });
  const [searchError, setSearchError] = useState<string | null>(null);

  // Bot API Config state
  const [botStatus, setBotStatus] = useState<any>(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick preset verified Telegram channels
  const PRESET_CHANNELS = [
    { username: 'telegram', label: 'Telegram News' },
    { username: 'durov', label: 'Pavel Durov' },
    { username: 'techcrunch', label: 'TechCrunch' },
    { username: 'bloomberg', label: 'Bloomberg' },
    { username: 'reuters', label: 'Reuters' },
    { username: 'github', label: 'GitHub' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchChats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      if (data.success) {
        setBotStatus(data.status);
      }
    } catch {}
  };

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/telegram/chats');
      const data = await res.json();
      if (data.success && Array.isArray(data.chats)) {
        setChats(data.chats);
        if (!selectedChat && data.chats.length > 0) {
          setSelectedChat(data.chats[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Telegram channels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/telegram/messages/${encodeURIComponent(chatId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleFetchChannelLive = async (username: string) => {
    soundFx.playClick();
    setIsSearchingLive(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/telegram/channel/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.success && data.chat) {
        setSelectedChat(data.chat);
        setMessages(data.messages || []);
        setActiveTab('live_channels');
        fetchChats();
        soundFx.playNotification();
      } else {
        setSearchError(data.error || `Could not fetch channel @${username}`);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Network request failed');
    } finally {
      setIsSearchingLive(false);
    }
  };

  const handleSearchTelegram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTarget.trim()) return;

    soundFx.playClick();
    setIsSearchingLive(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/telegram/search?q=${encodeURIComponent(searchTarget.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults({
          chats: data.chats || [],
          messages: data.messages || [],
        });
        soundFx.playNotification();
      } else {
        setSearchError(data.error || 'Search returned no results');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Search request failed');
    } finally {
      setIsSearchingLive(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChat || isSending) return;

    soundFx.playClick();
    setIsSending(true);

    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          text: inputMessage.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInputMessage('');
        fetchMessages(selectedChat.id);
        soundFx.playNotification();
      }
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveBotToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim()) return;

    soundFx.playClick();
    setIsSavingToken(true);
    setTokenMessage(null);

    try {
      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botTokenInput.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setTokenMessage({
          type: 'success',
          text: data.message || 'Telegram Bot connected successfully!',
        });
        fetchStatus();
        soundFx.playNotification();
      } else {
        setTokenMessage({
          type: 'error',
          text: data.error || 'Failed to authenticate Telegram bot token',
        });
      }
    } catch (err: any) {
      setTokenMessage({
        type: 'error',
        text: err.message || 'Connection to Telegram API failed',
      });
    } finally {
      setIsSavingToken(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono select-none p-4">
      <div className="w-full max-w-6xl bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden flex flex-col h-[780px] max-h-[92vh] animate-in zoom-in-95 duration-200 text-[#ebdbb2]">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-[#fabd2f] animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
              REAL TELEGRAM INTELLIGENCE & OFFICIAL BOT GATEWAY
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {botStatus?.connected
                ? `Bot: @${botStatus.bot?.username} (Live API)`
                : 'Real Public Channels & Web Stream (t.me/s)'}
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 hover:text-red-400 rounded text-[#a89984] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#3c3836] text-xs bg-[#181615]">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('live_channels');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'live_channels'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Channels & Groups</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('search_discover');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'search_discover'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real Telegram Search</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('bot_api');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'bot_api'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#83a598]" />
            <span>Official Bot API Gateway</span>
          </button>
        </div>

        {/* Tab 1: Live Channels & Groups Feed */}
        {activeTab === 'live_channels' && (
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Sidebar: Channel Directory */}
            <div className="w-80 border-r border-[#3c3836] bg-[#181615] flex flex-col">
              {/* Presets Bar */}
              <div className="p-2.5 border-b border-[#3c3836] space-y-1.5">
                <div className="text-[10px] font-bold text-[#7c6f64] uppercase flex items-center justify-between">
                  <span>Verified Telegram Channels:</span>
                  <button
                    onClick={fetchChats}
                    className="hover:text-[#ebdbb2] flex items-center gap-1"
                    title="Refresh channels"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {PRESET_CHANNELS.map((p) => (
                    <button
                      key={p.username}
                      onClick={() => handleFetchChannelLive(p.username)}
                      className="px-2 py-0.5 rounded bg-[#282828] hover:bg-[#3c3836] text-[10px] text-[#ebdbb2] border border-[#3c3836] transition-colors"
                    >
                      @{p.username}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channels List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-xs text-[#a89984]">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                    Fetching real Telegram channels...
                  </div>
                ) : chats.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#7c6f64]">
                    No channels loaded. Pick a verified channel above.
                  </div>
                ) : (
                  chats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedChat(c);
                      }}
                      className={`w-full p-2.5 text-left border-b border-[#3c3836]/60 flex items-start gap-2.5 transition-colors ${
                        selectedChat?.id === c.id ? 'bg-[#282828] border-l-4 border-l-[#fabd2f]' : 'hover:bg-[#201d1c]'
                      }`}
                    >
                      <img
                        src={c.avatar}
                        alt={c.title}
                        className="w-9 h-9 rounded-full bg-[#3c3836] border border-[#504945] object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#ebdbb2] truncate">{c.title}</span>
                          {c.verified && (
                            <span className="text-[10px] text-sky-400 font-bold ml-1" title="Verified Channel">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#fabd2f] truncate">@{c.username}</div>
                        <div className="text-[10px] text-[#7c6f64] truncate mt-0.5">
                          {c.lastMessage?.text || c.description}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat/Channel View */}
            <div className="flex-1 flex flex-col bg-[#1d2021] overflow-hidden">
              {selectedChat ? (
                <>
                  {/* Channel Header */}
                  <div className="px-4 py-2.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={selectedChat.avatar}
                        alt={selectedChat.title}
                        className="w-8 h-8 rounded-full border border-[#fabd2f]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#ebdbb2]">{selectedChat.title}</span>
                          <span className="text-[10px] text-[#fabd2f]">@{selectedChat.username}</span>
                        </div>
                        <div className="text-[10px] text-[#a89984]">{selectedChat.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://t.me/s/${selectedChat.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-[#181615] hover:bg-[#3c3836] text-[10px] text-[#ebdbb2] font-bold flex items-center gap-1 border border-[#3c3836]"
                      >
                        <span>View on Telegram Web</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleFetchChannelLive(selectedChat.username || '')}
                        disabled={isSearchingLive}
                        className="p-1.5 rounded bg-[#181615] hover:bg-[#3c3836] text-[#a89984] hover:text-[#ebdbb2] border border-[#3c3836]"
                        title="Reload live posts"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSearchingLive ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#181615]">
                    {isLoadingMessages ? (
                      <div className="text-center py-10 text-xs text-[#a89984]">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                        Fetching live Telegram messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-xs text-[#7c6f64] space-y-2">
                        <div>💬</div>
                        <div>No messages indexed yet for @{selectedChat.username}. Click refresh above.</div>
                      </div>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-lg border max-w-2xl text-xs space-y-1.5 ${
                            m.isAgent
                              ? 'ml-auto bg-[#282828] border-[#fabd2f]/50 text-[#ebdbb2]'
                              : 'mr-auto bg-[#201d1c] border-[#3c3836] text-[#ebdbb2]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#7c6f64]">
                            <span className="font-bold text-[#fabd2f]">{m.senderName}</span>
                            <div className="flex items-center gap-2">
                              {m.views && (
                                <span className="flex items-center gap-0.5 text-[#a89984]">
                                  <Eye className="w-2.5 h-2.5" />
                                  {m.views}
                                </span>
                              )}
                              <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>

                          {m.mediaUrl && (
                            <img
                              src={m.mediaUrl}
                              alt="Telegram Media"
                              className="max-h-48 rounded border border-[#3c3836] object-contain my-1"
                            />
                          )}

                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                          {onTriggerAgentTask && (
                            <div className="pt-1 flex justify-end">
                              <button
                                onClick={() => {
                                  onClose();
                                  onTriggerAgentTask(
                                    `Analyze real Telegram intelligence from @${selectedChat.username}: ${m.text}`
                                  );
                                }}
                                className="px-2 py-0.5 rounded bg-[#fabd2f]/20 hover:bg-[#fabd2f] text-[#fabd2f] hover:text-[#1d2021] text-[9px] font-bold flex items-center gap-1 border border-[#fabd2f]/40 transition-colors"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Dispatch to Agent Fleet</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Bar */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-[#282828] border-t border-[#3c3836] flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={
                        botStatus?.connected
                          ? `Broadcast real message to @${selectedChat.username} via official Telegram Bot API...`
                          : `Send message or command to @${selectedChat.username} channel feed...`
                      }
                      className="flex-1 px-3 py-2 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputMessage.trim()}
                      className="px-4 py-2 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-[#7c6f64]">
                  Select a channel from the left sidebar to view real Telegram messages.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Real Telegram Search & Discovery */}
        {activeTab === 'search_discover' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-[#ebdbb2] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                SEARCH REAL PUBLIC TELEGRAM CHANNELS & CONTENT
              </h3>
              <p className="text-[11px] text-[#a89984]">
                Enter any public Telegram channel username (e.g. durov, techcrunch, openai, reuters) or topic keyword to scrape live data.
              </p>
            </div>

            <form onSubmit={handleSearchTelegram} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7c6f64]" />
                <input
                  type="text"
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value)}
                  placeholder="Enter Telegram username or topic keyword..."
                  className="w-full pl-9 pr-3 py-2 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingLive}
                className="px-5 py-2 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isSearchingLive ? 'Querying Telegram...' : 'Search Telegram'}</span>
              </button>
            </form>

            {searchError && (
              <div className="p-2.5 rounded bg-red-950/80 border border-red-700 text-red-300 text-xs">
                {searchError}
              </div>
            )}

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Channels Found */}
              {searchResults.chats.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#a89984] uppercase">Matching Channels:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {searchResults.chats.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-[#181615] border border-[#3c3836] hover:border-[#fabd2f] rounded-lg flex items-start gap-2.5 transition-all"
                      >
                        <img
                          src={c.avatar}
                          alt={c.title}
                          className="w-10 h-10 rounded-full border border-[#fabd2f] object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-[#ebdbb2] truncate">{c.title}</h4>
                          <div className="text-[10px] text-[#fabd2f]">@{c.username}</div>
                          <p className="text-[10px] text-[#a89984] line-clamp-2 mt-1">{c.description}</p>
                          <div className="mt-2 flex gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedChat(c);
                                setActiveTab('live_channels');
                              }}
                              className="px-2 py-0.5 rounded bg-[#fabd2f] text-[#1d2021] font-bold text-[10px]"
                            >
                              Open Live Feed
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Found */}
              {searchResults.messages.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#a89984] uppercase">Matching Real Messages:</div>
                  <div className="space-y-2">
                    {searchResults.messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-[#181615] border border-[#3c3836] rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#7c6f64]">
                          <span className="font-bold text-[#fabd2f]">
                            {m.senderName} (@{m.senderUsername})
                          </span>
                          <span>{new Date(m.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[#ebdbb2] leading-relaxed">{m.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isSearchingLive && searchResults.chats.length === 0 && searchResults.messages.length === 0 && (
                <div className="text-center py-16 text-[#7c6f64] text-xs space-y-2">
                  <Globe className="w-8 h-8 mx-auto text-[#504945]" />
                  <div>Enter any public Telegram username (e.g. durov, techcrunch, bloomberg) above.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Official Bot API Gateway */}
        {activeTab === 'bot_api' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-5 max-w-2xl mx-auto w-full">
            <div className="space-y-1 text-center">
              <Bot className="w-10 h-10 text-[#fabd2f] mx-auto animate-bounce" />
              <h3 className="font-bold text-sm text-[#ebdbb2]">OFFICIAL TELEGRAM BOT API CONFIGURATION</h3>
              <p className="text-xs text-[#a89984]">
                Connect your real Telegram Bot created via @BotFather to send and receive live messages.
              </p>
            </div>

            {/* Connection Status Card */}
            <div className="p-4 rounded-lg bg-[#181615] border border-[#3c3836] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ebdbb2]">Telegram Bot API Status:</span>
                {botStatus?.connected ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    CONNECTED: @{botStatus.bot?.username}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-700 text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Web Scraper Mode Active (Public Channels)
                  </span>
                )}
              </div>

              {botStatus?.bot && (
                <div className="p-2.5 rounded bg-[#282828] text-[11px] space-y-1 font-mono text-[#a89984]">
                  <div>Bot Name: <strong className="text-[#ebdbb2]">{botStatus.bot.first_name}</strong></div>
                  <div>Bot Username: <strong className="text-[#fabd2f]">@{botStatus.bot.username}</strong></div>
                  <div>Bot ID: <strong className="text-[#ebdbb2]">{botStatus.bot.id}</strong></div>
                  <div>Can Join Groups: {botStatus.bot.can_join_groups ? 'Yes' : 'No'}</div>
                </div>
              )}
            </div>

            {/* Bot Token Input Form */}
            <form onSubmit={handleSaveBotToken} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a89984]">
                  ENTER BOT TOKEN (FROM @BotFather):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                    className="flex-1 px-3 py-2 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] font-mono focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSavingToken || !botTokenInput.trim()}
                    className="px-5 py-2 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isSavingToken ? 'Validating...' : 'Connect Bot'}</span>
                  </button>
                </div>
              </div>

              {tokenMessage && (
                <div
                  className={`p-3 rounded text-xs ${
                    tokenMessage.type === 'success'
                      ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                      : 'bg-red-950 border border-red-700 text-red-300'
                  }`}
                >
                  {tokenMessage.text}
                </div>
              )}
            </form>

            <div className="p-3 rounded bg-[#181615] border border-[#3c3836] text-[11px] text-[#7c6f64] space-y-1.5">
              <div className="font-bold text-[#a89984] uppercase">How to create a free Telegram Bot:</div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Open Telegram and message <strong>@BotFather</strong>.</li>
                <li>Send <code>/newbot</code> and follow the prompts to choose a name and username.</li>
                <li>Copy the HTTP API token provided by BotFather and paste it above.</li>
                <li>Click "Connect Bot". Your fleet can now exchange real messages through Telegram!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
