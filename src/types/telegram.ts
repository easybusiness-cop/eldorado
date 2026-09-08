export interface TelegramMessage {
  id: string | number;
  chatId: string | number;
  chatTitle?: string;
  senderName: string;
  senderUsername?: string;
  isAgent?: boolean;
  agentId?: string;
  text: string;
  timestamp: string;
  type: 'text' | 'command' | 'alert' | 'agent_action' | 'media';
  status?: 'sent' | 'delivered' | 'read' | 'pending';
  replyToId?: string | number;
  metadata?: Record<string, any>;
}

export interface TelegramChat {
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

export interface TelegramSearchFilters {
  query?: string;
  type?: 'all' | 'group' | 'channel' | 'private';
  category?: string;
}

export interface TelegramBotConfig {
  botToken?: string;
  botUsername: string;
  webhookUrl?: string;
  mode: 'live_bot_api' | 'autonomous_agent_bridge';
  autoReplyAgents: boolean;
  allowedChannels: string[];
}
