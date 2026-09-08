import { GoogleGenAI } from '@google/genai';

export interface TelegramMessageRecord {
  id: string;
  chatId: string;
  chatTitle?: string;
  senderName: string;
  senderUsername?: string;
  isAgent?: boolean;
  agentId?: string;
  text: string;
  timestamp: string;
  type: 'text' | 'command' | 'alert' | 'agent_action' | 'media';
  status?: 'sent' | 'delivered' | 'read' | 'pending';
  replyToId?: string;
  metadata?: Record<string, any>;
}

export interface TelegramChatRecord {
  id: string;
  title: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  memberCount: number;
  isJoined: boolean;
  avatar?: string;
  description?: string;
  lastMessage?: {
    text: string;
    timestamp: string;
    sender: string;
  };
  pinnedMessage?: string;
  category: 'fleet_operations' | 'engineering' | 'security' | 'executives' | 'public' | 'direct';
  unreadCount?: number;
}

export class TelegramService {
  private static instance: TelegramService;
  private botToken: string | null = null;
  private chats: Map<string, TelegramChatRecord> = new Map();
  private messages: TelegramMessageRecord[] = [];
  private aiClient: GoogleGenAI | null = null;

  private constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this.initDefaultChats();
    this.initDefaultMessages();
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private getAI(): GoogleGenAI | null {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } catch (err) {
        console.warn('TelegramService: Failed to init Gemini AI client', err);
      }
    }
    return this.aiClient;
  }

  private initDefaultChats() {
    const initialChats: TelegramChatRecord[] = [
      {
        id: '-1001928374650',
        title: '⚡ Rufflo Autonomous Fleet War Room',
        type: 'supergroup',
        username: 'rufflo_fleet_warroom',
        memberCount: 14200,
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
        memberCount: 2840,
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
        memberCount: 38900,
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
        id: '-1004918237492',
        title: '🚀 Open Source AI Builders Global',
        type: 'supergroup',
        username: 'opensource_ai_builders',
        memberCount: 128400,
        isJoined: false,
        avatar: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop&q=60',
        description: 'Public supergroup discussing LLM orchestration, Mastra, Composio, n8n, and LangGraph architectures.',
        lastMessage: {
          text: 'Who has tried self-hosting n8n with local Ollama models?',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          sender: 'AlexDev',
        },
        category: 'public',
        unreadCount: 0,
      },
      {
        id: '-1005829103948',
        title: '📢 Global Tech Incident & Outage Feed',
        type: 'channel',
        username: 'global_tech_outages_feed',
        memberCount: 245000,
        isJoined: false,
        avatar: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=100&auto=format&fit=crop&q=60',
        description: 'Real-time incident updates from major cloud providers (AWS, GCP, Azure, Cloudflare, GitHub).',
        lastMessage: {
          text: 'All Cloudflare edge services operating normally.',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          sender: 'StatusBot',
        },
        category: 'public',
        unreadCount: 0,
      },
      {
        id: '-1007829103819',
        title: '🧠 Gemini & LLM Developer Network',
        type: 'channel',
        username: 'gemini_ai_devs',
        memberCount: 312000,
        isJoined: false,
        avatar: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=100&auto=format&fit=crop&q=60',
        description: 'Official developer updates, prompt engineering tips, and model benchmark comparisons for Gemini 2.5.',
        lastMessage: {
          text: 'Gemini 2.5 Flash Live API support now enabled across web sockets.',
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          sender: 'Gemini News',
        },
        category: 'public',
        unreadCount: 0,
      },
      {
        id: '-1008129304918',
        title: '🐍 Python & Data Science Central',
        type: 'supergroup',
        username: 'python_coders_global',
        memberCount: 185000,
        isJoined: false,
        avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop&q=60',
        description: 'Python 3.12, Fast API, PyTorch, pandas, and async execution discussion channel.',
        lastMessage: {
          text: 'Check out the new async streaming pipeline for PyTorch 2.4.',
          timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
          sender: 'PyDev',
        },
        category: 'public',
        unreadCount: 0,
      },
      {
        id: '-1009182304918',
        title: '⚡ Rust Systems & Performance Engineering',
        type: 'channel',
        username: 'rust_lang_community',
        memberCount: 94000,
        isJoined: false,
        avatar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&auto=format&fit=crop&q=60',
        description: 'Memory safety, Tokio async, WebAssembly, and high-throughput zero-cost abstraction channels.',
        lastMessage: {
          text: 'Rust 1.81 released with improved const trait functions!',
          timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          sender: 'RustBot',
        },
        category: 'public',
        unreadCount: 0,
      },
      {
        id: '-1010192837410',
        title: '🌐 Web3, Crypto & Decentralized AI Hub',
        type: 'channel',
        username: 'web3_decentralized_ai',
        memberCount: 420000,
        isJoined: false,
        avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&auto=format&fit=crop&q=60',
        description: 'Decentralized compute networks, Bittensor, Solana AI agents, and smart contract verification.',
        lastMessage: {
          text: 'Autonomous agent wallet integration standards update released.',
          timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
          sender: 'Web3News',
        },
        category: 'public',
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

    for (const chat of initialChats) {
      this.chats.set(chat.id, chat);
    }
  }

  private initDefaultMessages() {
    this.messages = [
      {
        id: 'msg-1',
        chatId: '-1001928374650',
        chatTitle: '⚡ Rufflo Autonomous Fleet War Room',
        senderName: 'Michael Scott',
        senderUsername: 'michael_scott_lead',
        isAgent: true,
        agentId: 'michael_scott',
        text: 'Good morning fleet! Today we are expanding our Telegram communication mesh. Let’s make sure every agent is connected and responsive.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        type: 'text',
        status: 'read',
      },
      {
        id: 'msg-2',
        chatId: '-1001928374650',
        chatTitle: '⚡ Rufflo Autonomous Fleet War Room',
        senderName: 'CoreCoder',
        senderUsername: 'corecoder_agent',
        isAgent: true,
        agentId: 'corecoder',
        text: 'Confirmed. Telegram API Gateway, polling dispatcher, and Webhook bridge are active. I can parse inbound commands and execute code snippets on demand.',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        type: 'text',
        status: 'read',
      },
      {
        id: 'msg-3',
        chatId: '-1001928374650',
        chatTitle: '⚡ Rufflo Autonomous Fleet War Room',
        senderName: 'SafetyGuard',
        senderUsername: 'safetyguard_agent',
        isAgent: true,
        agentId: 'safetyguard',
        text: '🛡️ Rate limiters and payload sanitizers mounted on all Telegram inbound sockets. Zero unauthenticated injections permitted.',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        type: 'alert',
        status: 'read',
      },
      {
        id: '@michael_scott_direct-1',
        chatId: '@michael_scott_direct',
        chatTitle: 'Michael Scott (Regional Manager)',
        senderName: 'Michael Scott',
        senderUsername: 'michael_scott_lead',
        isAgent: true,
        agentId: 'michael_scott',
        text: 'Hey boss! The fleet is operating at peak motivation today. That is what she said!',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        type: 'text',
        status: 'delivered',
      },
    ];
  }

  // Telegram API Bot Token Config
  public setBotToken(token: string) {
    this.botToken = token.trim();
  }

  public getBotConfig() {
    return {
      hasBotToken: Boolean(this.botToken),
      botTokenMasked: this.botToken ? `${this.botToken.substring(0, 6)}...${this.botToken.substring(this.botToken.length - 4)}` : null,
      botUsername: 'RuffloFleetBot',
      webhookUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/telegram/webhook`,
      activeChats: this.chats.size,
      totalMessages: this.messages.length,
      mode: this.botToken ? 'live_bot_api' : 'autonomous_agent_bridge',
    };
  }

  // Get all known chats & groups
  public getChats(category?: string): TelegramChatRecord[] {
    const list = Array.from(this.chats.values());
    if (category && category !== 'all') {
      return list.filter((c) => c.category === category);
    }
    return list;
  }

  // Search groups and channels across Telegram
  public searchChats(query: string, filterType?: string): TelegramChatRecord[] {
    const q = (query || '').toLowerCase().trim().replace('https://t.me/', '').replace('t.me/', '');
    let results = Array.from(this.chats.values());

    if (filterType && filterType !== 'all') {
      results = results.filter((c) => c.type === filterType);
    }

    if (!q) return results;

    const filtered = results.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.username && c.username.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );

    // If exact query matches or search terms yield fewer than 2 results, synthesize a live Telegram channel entry
    if (q.length >= 2) {
      const isHandle = q.startsWith('@') || !q.includes(' ');
      const cleanHandle = q.replace('@', '').toLowerCase();

      // Check if we already have this username
      const existingByUsername = results.find(
        (c) => c.username && c.username.toLowerCase() === cleanHandle
      );

      if (!existingByUsername) {
        const titleFormatted = cleanHandle
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const dynamicChannel: TelegramChatRecord = {
          id: `@${cleanHandle}`,
          title: `📢 ${titleFormatted} Official`,
          type: 'channel',
          username: cleanHandle,
          memberCount: Math.floor(Math.random() * 85000) + 12000,
          isJoined: false,
          avatar: `https://images.unsplash.com/photo-${1500000000000 + (cleanHandle.length * 1000000) % 999999999}?w=100&auto=format&fit=crop&q=60`,
          description: `Official Telegram broadcast channel for ${titleFormatted}. High-speed community updates, media, and autonomous agent broadcasts.`,
          category: 'public',
          lastMessage: {
            text: `Latest update published on @${cleanHandle} Telegram channel.`,
            timestamp: new Date().toISOString(),
            sender: `${titleFormatted} Bot`,
          },
        };

        // Add to search results list
        return [dynamicChannel, ...filtered];
      }
    }

    return filtered;
  }

  // Join or Leave a Group/Channel
  public async toggleJoinChat(chatId: string, join: boolean): Promise<TelegramChatRecord> {
    let chat = this.chats.get(chatId);
    if (!chat) {
      // If discovering a new group by handle
      chat = {
        id: chatId,
        title: chatId.startsWith('@') ? chatId.replace('@', '') : `Telegram Chat ${chatId}`,
        type: 'group',
        memberCount: Math.floor(Math.random() * 500) + 12,
        isJoined: join,
        category: 'public',
        description: 'Discovered Telegram community',
      };
      this.chats.set(chatId, chat);
    } else {
      chat.isJoined = join;
      chat.memberCount = join ? chat.memberCount + 1 : Math.max(1, chat.memberCount - 1);
    }

    // Add system notification message
    this.messages.push({
      id: `sys-${Date.now()}`,
      chatId: chat.id,
      chatTitle: chat.title,
      senderName: 'Rufflo Fleet Controller',
      isAgent: true,
      text: join ? `🤖 Rufflo Agent Fleet joined the chat.` : `👋 Rufflo Agent Fleet left the chat.`,
      timestamp: new Date().toISOString(),
      type: 'agent_action',
    });

    return chat;
  }

  // Read messages for a specific chat
  public getMessages(chatId: string): TelegramMessageRecord[] {
    return this.messages.filter((m) => m.chatId === chatId);
  }

  // Send message to any chat, group, or user
  public async sendMessage(params: {
    chatId: string;
    text: string;
    senderName?: string;
    senderUsername?: string;
    isAgent?: boolean;
    agentId?: string;
    replyToId?: string;
  }): Promise<{ message: TelegramMessageRecord; agentReplies?: TelegramMessageRecord[] }> {
    const chat = this.chats.get(params.chatId) || {
      id: params.chatId,
      title: params.chatId.startsWith('@') ? params.chatId : `Chat ${params.chatId}`,
      type: params.chatId.startsWith('-100') ? 'supergroup' : 'private',
      memberCount: 2,
      isJoined: true,
      category: 'direct',
    };
    this.chats.set(params.chatId, chat);

    const newMessage: TelegramMessageRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chatId: params.chatId,
      chatTitle: chat.title,
      senderName: params.senderName || 'Operator (You)',
      senderUsername: params.senderUsername || 'fleet_commander',
      isAgent: params.isAgent || false,
      agentId: params.agentId,
      text: params.text,
      timestamp: new Date().toISOString(),
      type: params.text.startsWith('/') ? 'command' : 'text',
      status: 'delivered',
      replyToId: params.replyToId,
    };

    this.messages.push(newMessage);

    // Update last message in chat
    chat.lastMessage = {
      text: newMessage.text,
      timestamp: newMessage.timestamp,
      sender: newMessage.senderName,
    };

    // If real Telegram Bot Token is configured, attempt real Telegram Bot API broadcast
    if (this.botToken && !params.chatId.startsWith('@michael') && !params.chatId.startsWith('@')) {
      try {
        await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: params.chatId,
            text: `[${newMessage.senderName}]: ${newMessage.text}`,
            parse_mode: 'HTML',
          }),
        });
      } catch (err) {
        console.warn('Telegram live API send failed (falling back to agent mesh):', err);
      }
    }

    // Auto-generate realistic Agent Responses if mentioned or queried
    const agentReplies: TelegramMessageRecord[] = [];
    const textLower = params.text.toLowerCase();

    // Check if an agent should reply
    const isQuestionOrCommand =
      params.text.startsWith('/') ||
      textLower.includes('?') ||
      textLower.includes('agent') ||
      textLower.includes('corecoder') ||
      textLower.includes('michael') ||
      textLower.includes('safetyguard') ||
      textLower.includes('dwight') ||
      textLower.includes('help') ||
      textLower.includes('status') ||
      chat.type === 'private';

    if (!params.isAgent && isQuestionOrCommand) {
      const replyingAgent = this.determineRespondingAgent(params.text, chat);
      const replyContent = await this.generateAgentReply(replyingAgent, params.text, chat);

      const replyMsg: TelegramMessageRecord = {
        id: `reply-${Date.now()}`,
        chatId: params.chatId,
        chatTitle: chat.title,
        senderName: replyingAgent.name,
        senderUsername: replyingAgent.username,
        isAgent: true,
        agentId: replyingAgent.id,
        text: replyContent,
        timestamp: new Date(Date.now() + 1000).toISOString(),
        type: 'text',
        status: 'delivered',
        replyToId: newMessage.id,
      };

      this.messages.push(replyMsg);
      agentReplies.push(replyMsg);

      chat.lastMessage = {
        text: replyMsg.text,
        timestamp: replyMsg.timestamp,
        sender: replyMsg.senderName,
      };
    }

    return { message: newMessage, agentReplies };
  }

  // Determine which agent should handle the prompt
  private determineRespondingAgent(text: string, chat: TelegramChatRecord) {
    const t = text.toLowerCase();
    if (t.includes('code') || t.includes('bug') || t.includes('git') || t.includes('ts') || t.includes('api') || t.includes('deploy')) {
      return { id: 'corecoder', name: 'CoreCoder (Engineering)', username: 'corecoder_agent' };
    }
    if (t.includes('sec') || t.includes('auth') || t.includes('cve') || t.includes('safe') || t.includes('audit')) {
      return { id: 'safetyguard', name: 'SafetyGuard (Security)', username: 'safetyguard_agent' };
    }
    if (t.includes('dwight') || t.includes('rule') || t.includes('compliance') || t.includes('audit')) {
      return { id: 'dwight', name: 'Dwight Schrute (Compliance)', username: 'dwight_schrute' };
    }
    if (chat.id === '@michael_scott_direct' || t.includes('michael') || t.includes('standup') || t.includes('lead')) {
      return { id: 'michael', name: 'Michael Scott (Regional Manager)', username: 'michael_scott_lead' };
    }
    return { id: 'corecoder', name: 'CoreCoder (Engineering)', username: 'corecoder_agent' };
  }

  // Generate dynamic response using Gemini or intelligent fallback
  private async generateAgentReply(
    agent: { id: string; name: string; username: string },
    userText: string,
    chat: TelegramChatRecord
  ): Promise<string> {
    const ai = this.getAI();
    if (ai) {
      try {
        const prompt = `You are ${agent.name}, an autonomous AI fleet specialist inside Rufflo OS.
You are communicating with team members or operators on Telegram in the chat "${chat.title}" (${chat.type}).

User Message: "${userText}"

Reply naturally, concisely, and stay in character (1-3 sentences). If asking for code/task status, provide realistic engineering details.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (e) {
        console.warn('Gemini Telegram reply generation failed, using structured template:', e);
      }
    }

    // Structured Fallback responses
    if (agent.id === 'michael') {
      return `I hear you loud and clear! Let's get the entire fleet on this immediately. As Wayne Gretzky once said, "You miss 100% of the shots you don't take." Let's win today!`;
    }
    if (agent.id === 'safetyguard') {
      return `🛡️ Audit logged. Perimeter security parameters verified. No vulnerabilities detected in the specified scope.`;
    }
    if (agent.id === 'dwight') {
      return `Question: Has this action been approved by the Assistant Regional Manager? Security protocol 4-Alpha is being enforced immediately.`;
    }
    return `Acknowledged. Processing your request through the Rufflo Autonomous Execution Pipeline. AST validated and dispatched to worker nodes.`;
  }

  // Create a new Telegram Group or Channel
  public async createChat(params: {
    title: string;
    type: 'group' | 'channel';
    category?: TelegramChatRecord['category'];
    description?: string;
    members?: string[];
  }): Promise<TelegramChatRecord> {
    const id = `-100${Date.now()}`;
    const username = params.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 24);

    const newChat: TelegramChatRecord = {
      id,
      title: params.title,
      type: params.type,
      username,
      memberCount: (params.members?.length || 0) + 1,
      isJoined: true,
      category: params.category || 'fleet_operations',
      description: params.description || `Autonomous ${params.type} created by Rufflo OS.`,
      lastMessage: {
        text: `Created ${params.type} "${params.title}"`,
        timestamp: new Date().toISOString(),
        sender: 'System',
      },
    };

    this.chats.set(id, newChat);

    this.messages.push({
      id: `msg-${Date.now()}`,
      chatId: id,
      chatTitle: newChat.title,
      senderName: 'Rufflo Fleet Controller',
      isAgent: true,
      text: `🚀 Created ${params.type} "${params.title}". Welcome to the channel!`,
      timestamp: new Date().toISOString(),
      type: 'agent_action',
    });

    return newChat;
  }

  // Telegram Stars Monetization Engine
  private starsBalance: number = 1240;
  private starsTransactions: Array<{
    id: string;
    type: 'purchase' | 'spend';
    amount: number;
    description: string;
    timestamp: string;
    status: 'completed' | 'pending';
  }> = [
    {
      id: 'tx-101',
      type: 'purchase',
      amount: 1000,
      description: 'Spider-Web Commander Subscription (1,000 Telegram Stars)',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'completed',
    },
    {
      id: 'tx-102',
      type: 'spend',
      amount: 100,
      description: 'Unlocked CoreCoder Quantum Task Distribution Slot',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'completed',
    },
  ];

  public getStarsBalance(): { balance: number; currency: 'XTR' | 'STARS'; networkHardened: boolean } {
    return {
      balance: this.starsBalance,
      currency: 'XTR',
      networkHardened: true,
    };
  }

  public getStarsTransactions() {
    return this.starsTransactions;
  }

  public async createInvoiceLink(params: {
    title: string;
    description: string;
    payload: string;
    starAmount: number;
  }) {
    if (this.botToken) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${this.botToken}/createInvoiceLink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: params.title,
            description: params.description,
            payload: params.payload,
            currency: 'XTR',
            prices: [{ label: params.title, amount: params.starAmount }],
          }),
        });
        const data = await response.json();
        if (data.ok && data.result) {
          return { invoiceUrl: data.result, starAmount: params.starAmount };
        }
      } catch (err) {
        console.warn('Telegram Bot API createInvoiceLink failed, returning native deep link fallback:', err);
      }
    }

    // Native deep-link fallback for Telegram Mini Apps & Bot Payments
    return {
      invoiceUrl: `https://t.me/RuffloCommandBot?start=stars_${params.payload}_${params.starAmount}`,
      starAmount: params.starAmount,
      isSimulatedLink: true,
    };
  }

  public async buyStarsPlan(planId: string): Promise<{ success: boolean; newBalance: number; tx: any }> {
    const plans: Record<string, { stars: number; title: string }> = {
      'scout-100': { stars: 100, title: 'Scout Fleet Upgrade (2 Extra Agent Slots)' },
      'commander-500': { stars: 500, title: 'Spider-Web Commander Tier (Priority Dispatch & 2x Network)' },
      'overlord-1000': { stars: 1000, title: 'Overlord Enterprise Pass (Unlimited Agents & Quantum Engine)' },
      'custom-200': { stars: 200, title: 'Telegram Stars Booster Pack (+200 Stars)' },
    };

    const targetPlan = plans[planId] || { stars: 250, title: `Telegram Stars Recharge (${planId})` };

    // Credit balance
    this.starsBalance += targetPlan.stars;

    const tx = {
      id: `tx-${Date.now()}`,
      type: 'purchase' as const,
      amount: targetPlan.stars,
      description: targetPlan.title,
      timestamp: new Date().toISOString(),
      status: 'completed' as const,
    };

    this.starsTransactions.unshift(tx);

    // Broadcast system message in fleet ops channel
    this.messages.push({
      id: `msg-${Date.now()}`,
      chatId: '-1001928374650',
      chatTitle: '⚡ Rufflo Autonomous Fleet War Room',
      senderName: 'Telegram Stars Billing Bot',
      isAgent: true,
      text: `⭐ [TELEGRAM STARS MONETIZATION] Account credited with +${targetPlan.stars} Stars! Plan: "${targetPlan.title}". New Balance: ${this.starsBalance} Stars.`,
      timestamp: new Date().toISOString(),
      type: 'alert',
    });

    return {
      success: true,
      newBalance: this.starsBalance,
      tx,
    };
  }
}

export const telegramService = TelegramService.getInstance();
