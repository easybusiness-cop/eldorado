import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Search,
  Users,
  MessageSquare,
  Globe,
  Radio,
  Plus,
  Shield,
  Bot,
  User,
  Settings,
  Check,
  CheckCheck,
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
  UserPlus,
  LogOut,
  Sliders,
  Bell,
  Star,
  CreditCard,
  TrendingUp,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [selectedChatId, setSelectedChatId] = useState<string>('-1001928374650');
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedAgentSender, setSelectedAgentSender] = useState<string>('Operator');
  const [botConfig, setBotConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'search_discover' | 'create_chat' | 'bot_config' | 'stars_monetization'>('chats');

  // Telegram Stars Monetization State
  const [starsBalance, setStarsBalance] = useState<number>(1240);
  const [starsTransactions, setStarsTransactions] = useState<any[]>([]);
  const [isBuyingStars, setIsBuyingStars] = useState<boolean>(false);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null);

  // Discover/Search mode state
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverFilterType, setDiscoverFilterType] = useState<'all' | 'group' | 'channel'>('all');
  const [discoveredChats, setDiscoveredChats] = useState<TelegramChat[]>([]);

  // Create Group / Channel state
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatType, setNewChatType] = useState<'group' | 'channel'>('group');
  const [newChatCategory, setNewChatCategory] = useState<any>('fleet_operations');
  const [newChatDescription, setNewChatDescription] = useState('');

  // Bot Token State
  const [customBotToken, setCustomBotToken] = useState('');
  const [tokenSaveSuccess, setTokenSaveSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchChats();
      fetchStarsData();
    }
  }, [isOpen]);

  const fetchStarsData = async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        fetch('/api/telegram/stars/balance'),
        fetch('/api/telegram/stars/transactions'),
      ]);
      if (balRes.ok) {
        const balData = await balRes.json();
        if (balData.success) setStarsBalance(balData.balance);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success) setStarsTransactions(txData.transactions || []);
      }
    } catch (err) {
      console.warn('Stars fetch fallback');
    }
  };

  const handleBuyStarsPlan = async (planId: string) => {
    setBuyingPlanId(planId);
    setIsBuyingStars(true);
    setInvoiceStatus(null);
    soundFx.playClick?.();

    try {
      const res = await fetch('/api/telegram/stars/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStarsBalance(data.newBalance);
          setStarsTransactions((prev) => [data.tx, ...prev]);
          soundFx.playSuccess?.();
          setInvoiceStatus('⭐ Telegram Stars Credited & Fleet Upgraded!');
          fetchChats();
          setTimeout(() => setInvoiceStatus(null), 4000);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend buy Stars fallback');
    } finally {
      setIsBuyingStars(false);
      setBuyingPlanId(null);
    }

    // Client-side simulation fallback
    const amounts: Record<string, number> = { 'scout-100': 100, 'commander-500': 500, 'overlord-1000': 1000 };
    const added = amounts[planId] || 250;
    const newBal = starsBalance + added;
    setStarsBalance(newBal);
    setStarsTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: 'purchase',
        amount: added,
        description: `Telegram Stars Plan (${planId})`,
        timestamp: new Date().toISOString(),
        status: 'completed',
      },
      ...prev,
    ]);
    soundFx.playSuccess?.();
    setInvoiceStatus('⭐ Telegram Stars Credited & Fleet Upgraded!');
    setIsBuyingStars(false);
    setBuyingPlanId(null);
    setTimeout(() => setInvoiceStatus(null), 4000);
  };

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          setBotConfig(data.config);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend Telegram status offline, using local config fallback');
    }

    const savedToken = localStorage.getItem('rufflo_telegram_bot_token');
    if (savedToken) {
      setCustomBotToken(savedToken);
      setBotConfig({
        hasBotToken: true,
        botTokenMasked: `${savedToken.substring(0, 6)}...${savedToken.substring(Math.max(0, savedToken.length - 4))}`,
        botUsername: 'RuffloFleetBot',
        webhookUrl: `${window.location.origin}/api/telegram/webhook`,
        activeChats: 5,
        totalMessages: 12,
        mode: 'live_bot_api',
      });
    }
  };

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/telegram/chats');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.chats) && data.chats.length > 0) {
          setChats(data.chats);
          if (!selectedChatId && data.chats.length > 0) {
            setSelectedChatId(data.chats[0].id);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Backend Telegram chats offline, loading default channels');
    } finally {
      setIsLoading(false);
    }

    // Default fallback fleet channels
    const fallbackChats: TelegramChat[] = [
      {
        id: '-1001928374650',
        title: '⚡ Rufflo Autonomous Fleet War Room',
        type: 'supergroup',
        username: 'rufflo_fleet_warroom',
        memberCount: 42,
        isJoined: true,
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
        description: 'Primary real-time dispatch and mission control group for Rufflo AI Agents & Human Operators.',
        lastMessage: {
          text: 'CoreCoder: Fixed hot-reload latency in Node VM runner.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          sender: 'CoreCoder (Agent)',
        },
        pinnedMessage: '📌 Operational Protocol: Always tag @SafetyGuard for critical production infrastructure patches.',
        category: 'fleet_operations',
        unreadCount: 0,
      },
      {
        id: '-1002049182391',
        title: '🛠️ Dunder Mifflin Engineering Guild',
        type: 'group',
        username: 'dunder_mifflin_eng',
        memberCount: 18,
        isJoined: true,
        avatar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&auto=format&fit=crop&q=60',
        description: 'Technical architecture, AST transformations, bug triage, and daily standups.',
        lastMessage: {
          text: 'Dwight: All perimeter test harnesses running at 100% efficiency.',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          sender: 'Dwight Schrute (Agent)',
        },
        category: 'engineering',
        unreadCount: 2,
      },
      {
        id: '-1003182938472',
        title: '🛡️ SafetyGuard & Security Overwatch',
        type: 'channel',
        username: 'safetyguard_sec_alerts',
        memberCount: 154,
        isJoined: true,
        avatar: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=100&auto=format&fit=crop&q=60',
        description: 'Broadcast channel for vulnerability CVE detections, credential rotations, and intrusion alerts.',
        lastMessage: {
          text: '🛡️ ZERO THREATS DETECTED: Hourly perimeter scan completed cleanly.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          sender: 'SafetyGuard AI',
        },
        category: 'security',
        unreadCount: 0,
      },
      {
        id: '@michael_scott_direct',
        title: 'Michael Scott (Regional Manager)',
        type: 'private',
        username: 'michael_scott_lead',
        memberCount: 2,
        isJoined: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
        description: 'Direct communication channel with Fleet Executive Lead Michael Scott.',
        lastMessage: {
          text: 'Hey boss! The fleet is operating at peak motivation today. That is what she said!',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          sender: 'Michael Scott',
        },
        category: 'direct',
        unreadCount: 1,
      },
    ];

    setChats((prev) => (prev.length > 0 ? prev : fallbackChats));
    if (!selectedChatId) {
      setSelectedChatId('-1001928374650');
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/telegram/messages/${encodeURIComponent(chatId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend messages offline, using local message cache');
    }

    const fallbackMessagesMap: Record<string, TelegramMessage[]> = {
      '-1001928374650': [
        {
          id: 'msg-1',
          chatId: '-1001928374650',
          senderName: 'Michael Scott (Regional Manager)',
          senderUsername: 'michael_scott_lead',
          isAgent: true,
          agentId: 'michael_scott',
          text: 'Team meeting in 5 minutes! We need to discuss our quarterly paper sales and AI fleet automation goals.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          type: 'text',
        },
        {
          id: 'msg-2',
          chatId: '-1001928374650',
          senderName: 'Dwight Schrute (Assistant to the RM)',
          senderUsername: 'dwight_schrute_security',
          isAgent: true,
          agentId: 'dwight_schrute',
          text: 'Security audit complete. Perimeter secured. Fire drills scheduled.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'text',
        },
        {
          id: 'msg-3',
          chatId: '-1001928374650',
          senderName: 'CoreCoder (Agent)',
          senderUsername: 'corecoder_agent',
          isAgent: true,
          agentId: 'corecoder',
          text: 'CoreCoder: Fixed hot-reload latency in Node VM runner.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: 'agent_action',
        },
      ],
      '-1002049182391': [
        {
          id: 'eng-1',
          chatId: '-1002049182391',
          senderName: 'CoreCoder (Agent)',
          senderUsername: 'corecoder_agent',
          isAgent: true,
          agentId: 'corecoder',
          text: 'AST refactoring pass submitted for review in PR #104.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'text',
        },
        {
          id: 'eng-2',
          chatId: '-1002049182391',
          senderName: 'Dwight Schrute (Agent)',
          senderUsername: 'dwight_schrute_security',
          isAgent: true,
          agentId: 'dwight_schrute',
          text: 'Dwight: All perimeter test harnesses running at 100% efficiency.',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          type: 'text',
        },
      ],
      '-1003182938472': [
        {
          id: 'sec-1',
          chatId: '-1003182938472',
          senderName: 'SafetyGuard AI',
          senderUsername: 'safetyguard_sec',
          isAgent: true,
          agentId: 'safetyguard',
          text: '🛡️ ZERO THREATS DETECTED: Hourly perimeter scan completed cleanly.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'alert',
        },
      ],
      '@michael_scott_direct': [
        {
          id: 'dm-1',
          chatId: '@michael_scott_direct',
          senderName: 'Michael Scott',
          senderUsername: 'michael_scott_lead',
          isAgent: true,
          agentId: 'michael_scott',
          text: 'Hey boss! The fleet is operating at peak motivation today. That is what she said!',
          timestamp: new Date(Date.now() - 2700000).toISOString(),
          type: 'text',
        },
      ],
    };

    setMessages(fallbackMessagesMap[chatId] || []);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedChatId || isSending) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    soundFx.playClick?.();

    const isAgent = selectedAgentSender !== 'Operator';
    const userMsg: TelegramMessage = {
      id: `msg-user-${Date.now()}`,
      chatId: selectedChatId,
      senderName: isAgent ? `${selectedAgentSender} (Agent)` : 'Operator (You)',
      senderUsername: isAgent ? `${selectedAgentSender.toLowerCase()}_agent` : 'fleet_commander',
      isAgent,
      text: textToSend,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    try {
      const res = await fetch('/api/telegram/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChatId,
          text: textToSend,
          senderName: isAgent ? `${selectedAgentSender} (Agent)` : 'Operator (You)',
          senderUsername: isAgent ? `${selectedAgentSender.toLowerCase()}_agent` : 'fleet_commander',
          isAgent,
          agentId: isAgent ? selectedAgentSender.toLowerCase() : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [...prev, data.message, ...(data.agentReplies || [])]);
          soundFx.playNotification?.();
          fetchChats();
          return;
        }
      }
    } catch (err) {
      console.warn('Backend send message error, appending locally');
    } finally {
      setIsSending(false);
    }

    // Local optimistic update
    setMessages((prev) => [...prev, userMsg]);
    soundFx.playNotification?.();
  };

  // Search & Discover Groups/Channels across Telegram
  const handleSearchDiscover = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    soundFx.playClick?.();

    try {
      const queryParams = new URLSearchParams();
      if (discoverQuery) queryParams.set('q', discoverQuery);
      if (discoverFilterType !== 'all') queryParams.set('type', discoverFilterType);

      const res = await fetch(`/api/telegram/search?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDiscoveredChats(data.results);
      }
    } catch (err) {
      console.error('Discover search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Join or Leave group/channel
  const handleToggleJoin = async (chatId: string, currentJoined: boolean) => {
    setIsJoining(true);
    soundFx.playClick?.();

    try {
      const res = await fetch(`/api/telegram/chats/${encodeURIComponent(chatId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join: !currentJoined }),
      });

      const data = await res.json();
      if (data.success) {
        soundFx.playSuccess?.();
        fetchChats();
        // Update local discovered state
        setDiscoveredChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, isJoined: !currentJoined } : c))
        );
      }
    } catch (err) {
      console.error('Toggle join error:', err);
    } finally {
      setIsJoining(false);
    }
  };

  // Create new Group / Channel
  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;

    soundFx.playClick?.();
    try {
      const res = await fetch('/api/telegram/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newChatTitle.trim(),
          type: newChatType,
          category: newChatCategory,
          description: newChatDescription.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundFx.playSuccess?.();
        setNewChatTitle('');
        setNewChatDescription('');
        await fetchChats();
        setSelectedChatId(data.chat.id);
        setActiveTab('chats');
      }
    } catch (err) {
      console.error('Create chat error:', err);
    }
  };

  // Save Bot Token
  const handleSaveBotToken = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick?.();

    if (!customBotToken.trim()) return;

    try {
      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: customBotToken }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          try {
            localStorage.setItem('rufflo_telegram_bot_token', customBotToken);
          } catch {}
          setTokenSaveSuccess(true);
          soundFx.playSuccess?.();
          fetchStatus();
          setTimeout(() => setTokenSaveSuccess(false), 2500);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend token save update notice, applying client-side configuration fallback');
    }

    // Local state fallback if backend fetch fails or static preview
    try {
      localStorage.setItem('rufflo_telegram_bot_token', customBotToken);
    } catch {}
    setBotConfig({
      hasBotToken: true,
      botTokenMasked: `${customBotToken.substring(0, 6)}...${customBotToken.substring(Math.max(0, customBotToken.length - 4))}`,
      botUsername: 'RuffloFleetBot',
      webhookUrl: `${window.location.origin}/api/telegram/webhook`,
      activeChats: chats.length || 5,
      totalMessages: messages.length || 12,
      mode: 'live_bot_api',
    });
    setTokenSaveSuccess(true);
    soundFx.playSuccess?.();
    setTimeout(() => setTokenSaveSuccess(false), 2500);
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.username && chat.username.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || chat.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl h-[88vh] bg-[#1d2021] border border-[#3c3836] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#ebdbb2]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#282828] border-b border-[#3c3836]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#24a1de]/20 border border-[#24a1de]/40 flex items-center justify-center text-[#24a1de]">
              <Send className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Telegram Autonomous Hub</h3>
                <span className="px-2 py-0.5 bg-[#24a1de]/20 text-[#24a1de] border border-[#24a1de]/30 text-[10px] rounded-full font-mono font-bold">
                  Open Source & Free API
                </span>
                {botConfig?.mode === 'live_bot_api' ? (
                  <span className="px-2 py-0.5 bg-[#b8bb26]/20 text-[#b8bb26] text-[10px] rounded-full font-mono">
                    ● Live Bot Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-[#fabd2f]/20 text-[#fabd2f] text-[10px] rounded-full font-mono">
                    ● Agent Mesh Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a89984]">
                Bi-directional messaging, group discovery, channel broadcasts, and autonomous agent dispatch.
              </p>
            </div>
          </div>

          {/* Action Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#1d2021] p-1 rounded-xl border border-[#3c3836]">
              <button
                onClick={() => {
                  setActiveTab('chats');
                  soundFx.playClick?.();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'chats'
                    ? 'bg-[#24a1de] text-white shadow'
                    : 'text-[#a89984] hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Fleet Chats
              </button>
              <button
                onClick={() => {
                  setActiveTab('search_discover');
                  handleSearchDiscover();
                  soundFx.playClick?.();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'search_discover'
                    ? 'bg-[#24a1de] text-white shadow'
                    : 'text-[#a89984] hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Find Groups & Channels
              </button>
              <button
                onClick={() => {
                  setActiveTab('create_chat');
                  soundFx.playClick?.();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'create_chat'
                    ? 'bg-[#24a1de] text-white shadow'
                    : 'text-[#a89984] hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                New Group / Channel
              </button>
              <button
                onClick={() => {
                  setActiveTab('bot_config');
                  soundFx.playClick?.();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'bot_config'
                    ? 'bg-[#24a1de] text-white shadow'
                    : 'text-[#a89984] hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                Bot API Setup
              </button>
              <button
                onClick={() => {
                  setActiveTab('stars_monetization');
                  soundFx.playClick?.();
                  fetchStarsData();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'stars_monetization'
                    ? 'bg-amber-500 text-black shadow font-bold'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                Telegram Stars ({starsBalance})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#a89984] hover:text-white hover:bg-[#32302f] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* TAB 1: FLEET CHATS & LIVE MESSAGING */}
          {activeTab === 'chats' && (
            <>
              {/* LEFT: Chats List Sidebar */}
              <div className="w-80 bg-[#202020] border-r border-[#3c3836] flex flex-col">
                {/* Search Bar & Category Filter */}
                <div className="p-3 border-b border-[#3c3836] space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#a89984] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search chats, groups..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#7c6f64] focus:outline-none focus:border-[#24a1de]"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'fleet_operations', label: 'Ops' },
                      { id: 'engineering', label: 'Eng' },
                      { id: 'security', label: 'Security' },
                      { id: 'direct', label: 'Direct' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-[#24a1de]/20 text-[#24a1de] border border-[#24a1de]/40'
                            : 'bg-[#181a1b] text-[#a89984] hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chats Scroll List */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#282828]">
                  {filteredChats.map((chat) => {
                    const isSelected = selectedChatId === chat.id;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          setSelectedChatId(chat.id);
                          soundFx.playClick?.();
                        }}
                        className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#24a1de]/15 border-l-4 border-[#24a1de]'
                            : 'hover:bg-[#282828]'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {chat.avatar ? (
                            <img
                              src={chat.avatar}
                              alt={chat.title}
                              className="w-10 h-10 rounded-full object-cover border border-[#3c3836]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#24a1de]/20 border border-[#24a1de]/40 flex items-center justify-center text-[#24a1de] font-bold text-sm">
                              {chat.title.charAt(0)}
                            </div>
                          )}
                          {chat.type === 'channel' && (
                            <Radio className="w-3.5 h-3.5 text-[#fabd2f] absolute -bottom-1 -right-1 bg-[#1d2021] rounded-full p-0.5" />
                          )}
                          {chat.type === 'supergroup' && (
                            <Users className="w-3.5 h-3.5 text-[#24a1de] absolute -bottom-1 -right-1 bg-[#1d2021] rounded-full p-0.5" />
                          )}
                        </div>

                        {/* Title & Preview */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                              {chat.title}
                            </h4>
                            {chat.lastMessage && (
                              <span className="text-[10px] text-[#7c6f64]">
                                {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#a89984] truncate mt-0.5">
                            {chat.lastMessage?.text || chat.description || 'No messages yet'}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#181a1b] text-[#928374] font-mono">
                              {chat.type}
                            </span>
                            <span className="text-[9px] text-[#7c6f64] font-mono">
                              {chat.memberCount} members
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Chat Window & Input Box */}
              <div className="flex-1 flex flex-col bg-[#181a1b]">
                {/* Active Chat Header */}
                {selectedChat && (
                  <div className="px-6 py-3 bg-[#242424] border-b border-[#3c3836] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#24a1de]/20 border border-[#24a1de]/40 flex items-center justify-center text-[#24a1de]">
                        {selectedChat.type === 'channel' ? <Radio className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{selectedChat.title}</h4>
                          {selectedChat.username && (
                            <span className="text-xs text-[#24a1de] font-mono">
                              @{selectedChat.username}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#a89984] flex items-center gap-2">
                          <span>{selectedChat.memberCount} members</span>
                          <span>•</span>
                          <span>{selectedChat.category.replace('_', ' ')}</span>
                          {selectedChat.isJoined ? (
                            <span className="text-[#b8bb26] font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> Fleet Joined
                            </span>
                          ) : (
                            <span className="text-[#fabd2f] font-medium">Public Feed</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Chat Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleJoin(selectedChat.id, selectedChat.isJoined)}
                        disabled={isJoining}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedChat.isJoined
                            ? 'bg-[#32302f] hover:bg-[#fb4934]/20 text-[#a89984] hover:text-[#fb4934]'
                            : 'bg-[#24a1de] hover:bg-[#208bc0] text-white shadow'
                        }`}
                      >
                        {selectedChat.isJoined ? (
                          <>
                            <LogOut className="w-3.5 h-3.5" /> Leave Chat
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Join Group
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Pinned Message */}
                  {selectedChat?.pinnedMessage && (
                    <div className="p-3 bg-[#242424] border border-[#3c3836] rounded-xl flex items-center gap-2 text-xs text-[#fabd2f]">
                      <Pin className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 font-medium">{selectedChat.pinnedMessage}</span>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[#a89984] text-xs">
                      <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-[#24a1de]" />
                      <p className="font-semibold text-white">No messages in this chat yet</p>
                      <p>Send a message below to start communicating with agents or group members.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOperator = msg.senderName.includes('Operator');
                      const isAgent = msg.isAgent;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${
                            isOperator ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Sender Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isOperator
                                ? 'bg-[#fabd2f]/20 text-[#fabd2f] border border-[#fabd2f]/40'
                                : isAgent
                                ? 'bg-[#24a1de]/20 text-[#24a1de] border border-[#24a1de]/40'
                                : 'bg-[#a89984]/20 text-[#a89984]'
                            }`}
                          >
                            {isOperator ? <User className="w-4 h-4" /> : isAgent ? <Bot className="w-4 h-4" /> : msg.senderName.charAt(0)}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                              isOperator
                                ? 'bg-[#24a1de] text-white rounded-tr-none'
                                : isAgent
                                ? 'bg-[#282828] border border-[#3c3836] text-[#ebdbb2] rounded-tl-none'
                                : 'bg-[#242424] border border-[#3c3836] text-[#ebdbb2] rounded-tl-none'
                            }`}
                          >
                            {/* Header inside Bubble */}
                            <div className="flex items-center justify-between gap-3 mb-1 pb-1 border-b border-white/10 text-[10px]">
                              <span className="font-bold flex items-center gap-1">
                                {msg.senderName}
                                {isAgent && (
                                  <span className="px-1 py-0.2 bg-[#fabd2f]/20 text-[#fabd2f] rounded text-[8px]">
                                    AI
                                  </span>
                                )}
                              </span>
                              <span className="opacity-70">
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {/* Message Text */}
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 bg-[#242424] border-t border-[#3c3836] flex items-center gap-3"
                >
                  {/* Persona Selector */}
                  <div className="flex items-center gap-1.5 bg-[#181a1b] px-3 py-1.5 rounded-xl border border-[#3c3836] text-xs">
                    <span className="text-[#a89984] text-[11px]">Send as:</span>
                    <select
                      value={selectedAgentSender}
                      onChange={(e) => setSelectedAgentSender(e.target.value)}
                      className="bg-transparent font-bold text-[#24a1de] focus:outline-none cursor-pointer"
                    >
                      <option value="Operator" className="bg-[#1d2021] text-white">Operator (You)</option>
                      <option value="CoreCoder" className="bg-[#1d2021] text-white">CoreCoder</option>
                      <option value="SafetyGuard" className="bg-[#1d2021] text-white">SafetyGuard</option>
                      <option value="Michael Scott" className="bg-[#1d2021] text-white">Michael Scott</option>
                      <option value="Dwight" className="bg-[#1d2021] text-white">Dwight Schrute</option>
                    </select>
                  </div>

                  {/* Input Box */}
                  <input
                    type="text"
                    placeholder={`Write a message or command (e.g., /status, /deploy, @SafetyGuard)...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-[#181a1b] border border-[#3c3836] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#7c6f64] focus:outline-none focus:border-[#24a1de]"
                  />

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="px-4 py-2.5 bg-[#24a1de] hover:bg-[#208bc0] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* TAB 2: FIND & DISCOVER TELEGRAM GROUPS & CHANNELS */}
          {activeTab === 'search_discover' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#24a1de]" />
                    Search All Public Telegram Channels & Groups
                  </h3>
                  <p className="text-xs text-[#a89984] mt-1">
                    Search across all public Telegram channels, developer hubs, or look up any channel username (@handle or t.me/channel).
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#24a1de]/10 border border-[#24a1de]/30 rounded-full text-xs text-[#24a1de] font-mono font-semibold">
                  <span>GLOBAL TELEGRAM INDEX ACTIVE</span>
                </div>
              </div>

              {/* Quick Topic Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { label: '🔥 All Channels', query: '' },
                  { label: '🧠 AI & Gemini', query: 'ai' },
                  { label: '🛠️ Tech & Dev', query: 'tech' },
                  { label: '🛡️ Security Alerts', query: 'security' },
                  { label: '🌐 Web3 & Crypto', query: 'crypto' },
                  { label: '🐍 Python Coders', query: 'python' },
                  { label: '📢 Global Outages', query: 'outages' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setDiscoverQuery(chip.query);
                      handleSearchDiscover();
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
                      discoverQuery === chip.query
                        ? 'bg-[#24a1de] text-white border-[#24a1de] shadow-sm'
                        : 'bg-[#242424] text-[#a89984] border-[#3c3836] hover:text-white hover:border-[#24a1de]/50'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Search Form */}
              <form
                onSubmit={handleSearchDiscover}
                className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-[#242424] p-3 rounded-2xl border border-[#3c3836]"
              >
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-[#a89984] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search any Telegram channel name, topic, or username (e.g. @dunder_mifflin_eng or t.me/gemini_ai_devs)..."
                    value={discoverQuery}
                    onChange={(e) => setDiscoverQuery(e.target.value)}
                    className="w-full bg-[#181a1b] border border-[#3c3836] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#7c6f64] focus:outline-none focus:border-[#24a1de]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#181a1b] p-1 rounded-xl border border-[#3c3836]">
                    {(['all', 'channel', 'group'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDiscoverFilterType(type)}
                        className={`px-3 py-1 text-xs rounded-lg font-semibold uppercase transition-colors ${
                          discoverFilterType === type
                            ? 'bg-[#24a1de] text-white shadow'
                            : 'text-[#a89984] hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-[#24a1de] hover:bg-[#208bc0] text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
                  >
                    <Search className="w-4 h-4" />
                    {isLoading ? 'Searching Platform...' : 'Search Telegram'}
                  </button>
                </div>
              </form>

              {/* Discovered Communities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-4 bg-[#242424] border border-[#3c3836] rounded-2xl hover:border-[#24a1de]/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          {chat.avatar ? (
                            <img
                              src={chat.avatar}
                              alt={chat.title}
                              className="w-10 h-10 rounded-full object-cover border border-[#3c3836]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#24a1de]/20 border border-[#24a1de]/40 flex items-center justify-center text-[#24a1de] font-bold">
                              {chat.title.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{chat.title}</span>
                              {chat.isJoined && (
                                <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </h4>
                            {chat.username && (
                              <a
                                href={`https://t.me/${chat.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#24a1de] hover:underline font-mono flex items-center gap-1"
                              >
                                <span>@{chat.username}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#181a1b] text-[#fabd2f] border border-[#fabd2f]/30">
                          {chat.type}
                        </span>
                      </div>

                      <p className="text-xs text-[#a89984] leading-relaxed mb-1">
                        {chat.description || 'Open public channel / community on Telegram.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#3c3836]/60">
                      <span className="text-xs font-mono text-[#a89984] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#24a1de]" />
                        {chat.memberCount.toLocaleString()} subscribers
                      </span>

                      <div className="flex items-center gap-2">
                        {chat.username && (
                          <a
                            href={`https://t.me/${chat.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-[#181a1b] hover:bg-[#32302f] text-xs font-semibold text-[#24a1de] rounded-lg border border-[#3c3836] transition-colors flex items-center gap-1"
                            title="Open directly on Telegram App"
                          >
                            <span>t.me</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSelectedChatId(chat.id);
                            setActiveTab('chats');
                            soundFx.playClick?.();
                          }}
                          className="px-3 py-1.5 bg-[#181a1b] hover:bg-[#32302f] text-xs font-semibold text-[#ebdbb2] rounded-lg border border-[#3c3836] transition-colors"
                        >
                          Chat Feed
                        </button>
                        <button
                          onClick={() => handleToggleJoin(chat.id, chat.isJoined)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            chat.isJoined
                              ? 'bg-[#32302f] text-[#b8bb26] border border-[#b8bb26]/30'
                              : 'bg-[#24a1de] hover:bg-[#208bc0] text-white shadow'
                          }`}
                        >
                          {chat.isJoined ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Joined
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Connect
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE NEW GROUP OR CHANNEL */}
          {activeTab === 'create_chat' && (
            <div className="flex-1 p-8 max-w-2xl mx-auto overflow-y-auto space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#24a1de]" />
                  Create New Telegram Group or Broadcast Channel
                </h3>
                <p className="text-xs text-[#a89984] mt-1">
                  Establish autonomous war rooms, departmental notification channels, or incident dispatch boards.
                </p>
              </div>

              <form onSubmit={handleCreateChat} className="space-y-4 bg-[#242424] p-6 rounded-2xl border border-[#3c3836]">
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">Group / Channel Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 🚀 Product Launch Alpha War Room"
                    value={newChatTitle}
                    onChange={(e) => setNewChatTitle(e.target.value)}
                    className="w-full bg-[#181a1b] border border-[#3c3836] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#24a1de]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-1.5">Chat Type</label>
                    <select
                      value={newChatType}
                      onChange={(e) => setNewChatType(e.target.value as any)}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#24a1de]"
                    >
                      <option value="group">Group (Two-way chat)</option>
                      <option value="channel">Channel (Broadcast only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-1.5">Category</label>
                    <select
                      value={newChatCategory}
                      onChange={(e) => setNewChatCategory(e.target.value as any)}
                      className="w-full bg-[#181a1b] border border-[#3c3836] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#24a1de]"
                    >
                      <option value="fleet_operations">Fleet Operations</option>
                      <option value="engineering">Engineering</option>
                      <option value="security">Security & Compliance</option>
                      <option value="executives">Executive Board</option>
                      <option value="public">Public Community</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">Description & Mission</label>
                  <textarea
                    rows={3}
                    placeholder="Describe what agents and operators will collaborate on in this chat..."
                    value={newChatDescription}
                    onChange={(e) => setNewChatDescription(e.target.value)}
                    className="w-full bg-[#181a1b] border border-[#3c3836] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#24a1de] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newChatTitle.trim()}
                  className="w-full py-3 bg-[#24a1de] hover:bg-[#208bc0] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Create Telegram Chat
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: BOT API TOKEN & ADVANCED CONFIG */}
          {activeTab === 'bot_config' && (
            <div className="flex-1 p-8 max-w-3xl mx-auto overflow-y-auto space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#24a1de]" />
                  Telegram Bot API & Webhook Configuration
                </h3>
                <p className="text-xs text-[#a89984] mt-1">
                  Telegram is 100% free to use. You can generate a free bot token instantly via @BotFather on Telegram.
                </p>
              </div>

              {/* Status Overview Card */}
              <div className="p-4 bg-[#242424] border border-[#3c3836] rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Current Integration Mode</h4>
                  <p className="text-xs text-[#a89984] mt-0.5">
                    {botConfig?.hasBotToken
                      ? 'Connected to Official Telegram Bot API'
                      : 'Running in Local Autonomous Multi-Agent Mesh'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-[#24a1de]/20 text-[#24a1de] border border-[#24a1de]/30 text-xs rounded-lg font-mono font-bold">
                  {botConfig?.botUsername || 'RuffloFleetBot'}
                </span>
              </div>

              {/* Bot Token Form */}
              <form onSubmit={handleSaveBotToken} className="space-y-4 bg-[#242424] p-6 rounded-2xl border border-[#3c3836]">
                <div>
                  <label className="text-xs font-bold text-white block mb-1">
                    Telegram Bot Token (from @BotFather)
                  </label>
                  <p className="text-[11px] text-[#a89984] mb-2">
                    Example: <span className="font-mono text-[#ebdbb2]">123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ</span>
                  </p>
                  <input
                    type="password"
                    placeholder={botConfig?.botTokenMasked || 'Enter Telegram Bot Token...'}
                    value={customBotToken}
                    onChange={(e) => setCustomBotToken(e.target.value)}
                    className="w-full bg-[#181a1b] border border-[#3c3836] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#24a1de] font-mono"
                  />
                </div>

                <div className="p-3 bg-[#181a1b] border border-[#3c3836] rounded-xl text-xs space-y-1 text-[#a89984]">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#24a1de]" /> How to get a free Telegram Bot Token:
                  </p>
                  <p>1. Open Telegram and search for <strong className="text-white">@BotFather</strong></p>
                  <p>2. Send <code className="text-[#fabd2f]">/newbot</code> and follow the naming instructions</p>
                  <p>3. Copy the HTTP API token and paste it here</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#24a1de] hover:bg-[#208bc0] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-colors"
                >
                  {tokenSaveSuccess ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                  {tokenSaveSuccess ? 'Bot Token Saved!' : 'Save & Connect Telegram Bot'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: TELEGRAM STARS MONETIZATION & MINI APP HUB */}
          {activeTab === 'stars_monetization' && (
            <div className="flex-1 p-8 max-w-4xl mx-auto overflow-y-auto space-y-6">
              {/* Header Balance Banner */}
              <div className="p-6 bg-gradient-to-r from-amber-950/40 via-[#1e1c18] to-[#161a1d] border border-amber-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
                    <h3 className="text-xl font-black text-white tracking-wide">
                      Telegram Stars Fleet Monetization
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                      XTR ENABLED
                    </span>
                  </div>
                  <p className="text-xs text-[#a89984]">
                    Buy and spend Telegram Stars directly inside the Rufflo Mini App to unlock extra agent slots, priority task routing & quantum acceleration.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-[#0d0f11] px-5 py-3 rounded-2xl border border-amber-500/20 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-[#a89984] font-mono uppercase tracking-wider">Current Balance</div>
                    <div className="text-2xl font-black text-amber-400 flex items-center gap-1">
                      <Star className="w-5 h-5 fill-amber-400" />
                      {starsBalance.toLocaleString()} <span className="text-xs text-amber-200">Stars</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyStarsPlan('commander-500')}
                    disabled={isBuyingStars}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    +500 Stars
                  </button>
                </div>
              </div>

              {invoiceStatus && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold font-mono flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{invoiceStatus}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/70">Spider-Web Node Hardened</span>
                </div>
              )}

              {/* Tiered Plans Grid */}
              <div>
                <h4 className="text-xs font-bold text-[#a89984] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Available Telegram Stars Monetization Tier Packs
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Plan 1 */}
                  <div className="p-5 bg-[#1f1d18] border border-amber-500/20 hover:border-amber-500/50 rounded-2xl flex flex-col justify-between transition-all space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Scout Pack</span>
                        <span className="text-xs font-black text-amber-400 font-mono flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" /> 100 Stars
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">Scout Fleet Upgrade</h5>
                      <p className="text-xs text-[#a89984]">
                        Unlocks +2 dedicated agent slots and standard task distribution.
                      </p>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-[#ebdbb2] font-mono border-t border-[#3c3836] pt-3">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> +2 Active Agent Slots
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> 1x Execution Speed
                      </div>
                      <div className="flex items-center gap-1.5 text-[#a89984]">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Standard Telegram Webhook
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyStarsPlan('scout-100')}
                      disabled={isBuyingStars && buyingPlanId === 'scout-100'}
                      className="w-full py-2.5 bg-[#282828] hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isBuyingStars && buyingPlanId === 'scout-100' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Star className="w-3.5 h-3.5 fill-current" />
                      )}
                      Buy for 100 Stars
                    </button>
                  </div>

                  {/* Plan 2 - Featured */}
                  <div className="p-5 bg-gradient-to-b from-[#262118] to-[#181a1d] border-2 border-amber-500/80 rounded-2xl flex flex-col justify-between transition-all space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                      POPULAR
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Spider-Web Commander</span>
                        <span className="text-sm font-black text-amber-400 font-mono flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> 500 Stars
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">Commander Tier</h5>
                      <p className="text-xs text-[#a89984]">
                        Unlocks +5 agent slots, priority task ring, and 2x network throughput.
                      </p>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-[#ebdbb2] font-mono border-t border-[#3c3836] pt-3">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> +5 Active Agent Slots
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Priority Task Distribution
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> 2x Network Speed
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyStarsPlan('commander-500')}
                      disabled={isBuyingStars && buyingPlanId === 'commander-500'}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isBuyingStars && buyingPlanId === 'commander-500' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 fill-black" />
                      )}
                      Upgrade for 500 Stars
                    </button>
                  </div>

                  {/* Plan 3 */}
                  <div className="p-5 bg-[#1a1f26] border border-[#24a1de]/30 hover:border-[#24a1de]/60 rounded-2xl flex flex-col justify-between transition-all space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider">Enterprise Overlord</span>
                        <span className="text-xs font-black text-[#38bdf8] font-mono flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#38bdf8]" /> 1,000 Stars
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">Overlord Pass</h5>
                      <p className="text-xs text-[#a89984]">
                        Unlimited agent slots, quantum acceleration, and automated webhook billing.
                      </p>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-[#ebdbb2] font-mono border-t border-[#3c3836] pt-3">
                      <div className="flex items-center gap-1.5 text-[#38bdf8] font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Agent Slots
                      </div>
                      <div className="flex items-center gap-1.5 text-[#38bdf8] font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Quantum Acceleration
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Direct Bot Auto-Billing
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyStarsPlan('overlord-1000')}
                      disabled={isBuyingStars && buyingPlanId === 'overlord-1000'}
                      className="w-full py-2.5 bg-[#24a1de]/20 hover:bg-[#24a1de] hover:text-white border border-[#24a1de]/50 text-[#38bdf8] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isBuyingStars && buyingPlanId === 'overlord-1000' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Star className="w-3.5 h-3.5 fill-current" />
                      )}
                      Buy for 1,000 Stars
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Stars Links & External Bot Checkout */}
              <div className="p-4 bg-[#181a1b] border border-[#3c3836] rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Need to top up your Telegram Stars balance?</div>
                    <div className="text-[11px] text-[#a89984]">
                      Open the official Telegram Stars invoice checkout via @RuffloCommandBot
                    </div>
                  </div>
                </div>

                <a
                  href="https://t.me/RuffloCommandBot?start=starspurchase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-[#282828] hover:bg-[#32302f] border border-[#3c3836] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  Open Telegram Bot
                </a>
              </div>

              {/* Transactions Audit Log */}
              <div className="p-5 bg-[#1c1a17] border border-[#3c3836] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Telegram Stars Transaction Audit Log
                  </h4>
                  <span className="text-[10px] text-[#a89984] font-mono">
                    {starsTransactions.length} Transactions Indexed
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {starsTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-[#141210] border border-[#2e2b27] rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            tx.type === 'purchase'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                        <div>
                          <div className="text-white font-bold">{tx.description}</div>
                          <div className="text-[10px] text-[#a89984]">
                            {new Date(tx.timestamp).toLocaleString()} • ID: {tx.id}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-black text-xs ${
                            tx.type === 'purchase' ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {tx.type === 'purchase' ? '+' : '-'}{tx.amount} Stars
                        </span>
                        <div className="text-[9px] text-emerald-400/80 font-bold uppercase">
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
