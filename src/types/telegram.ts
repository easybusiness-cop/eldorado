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
  views?: string;
  type: 'text' | 'command' | 'alert' | 'agent_action' | 'media';
  status?: 'sent' | 'delivered' | 'read' | 'pending';
  replyToId?: string | number;
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

export interface TelegramChat {
  id: string;
  title: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  memberCount: number | string;
  isJoined: boolean;
  avatar?: string;
  description?: string;
  verified?: boolean;
  lastMessage?: {
    text: string;
    timestamp: string;
    sender: string;
  };
  pinnedMessage?: string;
  category: string;
  unreadCount?: number;
}

export interface TelegramSearchFilters {
  query?: string;
  type?: 'all' | 'group' | 'channel' | 'private';
  category?: string;
}

export interface TelegramBotConfig {
  botToken?: string;
  botUsername?: string;
  webhookUrl?: string;
  mode?: string;
  connected?: boolean;
  activeChannelsCount?: number;
}
