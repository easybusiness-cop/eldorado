/**
 * Google Chat API Client Service
 * Uses Google Chat API v1 to interact with Chat Spaces, Messages, and Reactions.
 */

export interface GoogleChatSpace {
  name: string; // "spaces/AAA..."
  type: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  displayName?: string;
  spaceThreadingState?: string;
  spaceDetails?: {
    description?: string;
    guidelines?: string;
  };
  membershipCount?: {
    joinedDirectHumanUserCount?: number;
    joinedGroupCount?: number;
  };
}

export interface GoogleChatMessage {
  name: string; // "spaces/AAA/messages/BBB"
  sender?: {
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    type?: 'HUMAN' | 'BOT';
  };
  text: string;
  createTime: string;
  thread?: {
    name?: string;
    retentionSettings?: any;
  };
  emojiReactionSummaries?: Array<{
    emoji?: { unicode?: string };
    reactionCount?: number;
  }>;
}

const SEED_SPACES: GoogleChatSpace[] = [
  {
    name: 'spaces/executive-command-center',
    type: 'SPACE',
    displayName: '🏛️ Executive AI Command Fleet',
    spaceDetails: {
      description: 'Primary communications hub for CEO, CMO, CTO autonomous agents and executive board.',
      guidelines: 'Post strategic initiatives, revenue OKRs, and corporate cascades.'
    },
    membershipCount: { joinedDirectHumanUserCount: 4, joinedGroupCount: 1 }
  },
  {
    name: 'spaces/engineering-triage',
    type: 'SPACE',
    displayName: '⚡ Engineering & Self-Evolution Triage',
    spaceDetails: {
      description: 'Live alerts from coding agents, test runners, and automated PR reviews.',
      guidelines: 'Track zero-downtime hotfixes and benchmark milestones.'
    },
    membershipCount: { joinedDirectHumanUserCount: 8, joinedGroupCount: 2 }
  },
  {
    name: 'spaces/enterprise-client-support',
    type: 'SPACE',
    displayName: '🤝 Enterprise Client Real-Time Dispatch',
    spaceDetails: {
      description: 'Customer success and autonomous SLA tracking channel.',
      guidelines: 'Resolve customer inquiries in under 1.2 seconds.'
    },
    membershipCount: { joinedDirectHumanUserCount: 12, joinedGroupCount: 3 }
  }
];

const SEED_MESSAGES: Record<string, GoogleChatMessage[]> = {
  'spaces/executive-command-center': [
    {
      name: 'spaces/executive-command-center/messages/msg-1',
      sender: {
        displayName: 'CEO Autonomous Lead (Rufflo)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
        type: 'BOT'
      },
      text: 'Corporate Cascade initiated: Q3 Autonomous Revenue Growth target set to +350%. HODs distributing sub-tasks now.',
      createTime: '2026-09-07T08:30:00Z',
      emojiReactionSummaries: [{ emoji: { unicode: '🚀' }, reactionCount: 6 }]
    },
    {
      name: 'spaces/executive-command-center/messages/msg-2',
      sender: {
        displayName: 'CTO Engineering Director',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
        type: 'BOT'
      },
      text: 'Self-Evolution Engine benchmarked at 99.8% test coverage across 14 new autonomous agent skills.',
      createTime: '2026-09-07T09:15:00Z',
      emojiReactionSummaries: [{ emoji: { unicode: '🔥' }, reactionCount: 4 }]
    }
  ],
  'spaces/engineering-triage': [
    {
      name: 'spaces/engineering-triage/messages/msg-3',
      sender: {
        displayName: 'Autonomous Code Reviewer #4',
        type: 'BOT'
      },
      text: 'PR #492 merged: Google Workspace (Chat, Sheets, Classroom, Gmail, Forms) unified integration deployed without downtime.',
      createTime: '2026-09-07T09:45:00Z',
      emojiReactionSummaries: [{ emoji: { unicode: '✅' }, reactionCount: 8 }]
    }
  ],
  'spaces/enterprise-client-support': [
    {
      name: 'spaces/enterprise-client-support/messages/msg-4',
      sender: {
        displayName: 'Client Success Dispatcher',
        type: 'BOT'
      },
      text: 'All 48 active enterprise client nodes reporting optimal SLA latency < 35ms.',
      createTime: '2026-09-07T10:00:00Z',
      emojiReactionSummaries: [{ emoji: { unicode: '✨' }, reactionCount: 5 }]
    }
  ]
};

/**
 * Fetch all chat spaces the user has joined
 */
export async function fetchChatSpaces(accessToken: string | null): Promise<GoogleChatSpace[]> {
  if (!accessToken) return SEED_SPACES;

  try {
    const res = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=20', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      console.warn('Chat API fetch spaces notice:', res.status, res.statusText);
      return SEED_SPACES;
    }
    const data = await res.json();
    if (data.spaces && data.spaces.length > 0) {
      return data.spaces;
    }
    return SEED_SPACES;
  } catch (err) {
    console.error('Failed to fetch Google Chat spaces:', err);
    return SEED_SPACES;
  }
}

/**
 * Fetch messages in a specific space
 */
export async function fetchChatMessages(accessToken: string | null, spaceName: string): Promise<GoogleChatMessage[]> {
  if (!accessToken || spaceName.startsWith('spaces/executive') || spaceName.startsWith('spaces/engineering') || spaceName.startsWith('spaces/enterprise')) {
    return SEED_MESSAGES[spaceName] || [];
  }

  try {
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=30`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      console.warn('Chat API fetch messages notice:', res.status);
      return SEED_MESSAGES[spaceName] || [];
    }
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error('Failed to fetch Google Chat messages:', err);
    return SEED_MESSAGES[spaceName] || [];
  }
}

/**
 * Send a message into a Google Chat space
 */
export async function sendChatMessage(
  accessToken: string | null,
  spaceName: string,
  text: string
): Promise<GoogleChatMessage> {
  if (accessToken && !spaceName.startsWith('spaces/executive') && !spaceName.startsWith('spaces/engineering') && !spaceName.startsWith('spaces/enterprise')) {
    const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to send message via Google Chat API');
    }
    return await res.json();
  }

  // Local state helper
  const newMsg: GoogleChatMessage = {
    name: `${spaceName}/messages/msg-${Date.now()}`,
    sender: {
      displayName: 'You (Autonomous Fleet Admin)',
      type: 'HUMAN'
    },
    text,
    createTime: new Date().toISOString()
  };

  if (!SEED_MESSAGES[spaceName]) {
    SEED_MESSAGES[spaceName] = [];
  }
  SEED_MESSAGES[spaceName].push(newMsg);
  return newMsg;
}

/**
 * Create a new Chat Space
 */
export async function createChatSpace(
  accessToken: string | null,
  displayName: string,
  description?: string
): Promise<GoogleChatSpace> {
  if (accessToken) {
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName,
          spaceType: 'SPACE',
          spaceDetails: {
            description: description || 'Autonomous multi-agent workspace space'
          }
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Create chat space API notice:', err);
    }
  }

  const newSpace: GoogleChatSpace = {
    name: `spaces/custom-${Date.now()}`,
    type: 'SPACE',
    displayName,
    spaceDetails: {
      description: description || 'Custom workspace space created by autonomous fleet'
    },
    membershipCount: { joinedDirectHumanUserCount: 1, joinedGroupCount: 0 }
  };
  SEED_SPACES.unshift(newSpace);
  SEED_MESSAGES[newSpace.name] = [
    {
      name: `${newSpace.name}/messages/seed-0`,
      sender: {
        displayName: 'Google Chat System Bot',
        type: 'BOT'
      },
      text: `Space "${displayName}" initialized successfully. Start messaging your team and autonomous agents!`,
      createTime: new Date().toISOString()
    }
  ];
  return newSpace;
}
