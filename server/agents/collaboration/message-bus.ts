export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  topic: string;
  payload: any;
  timestamp: string;
}

export class MessageBus {
  private static instance: MessageBus;
  private listeners: Record<string, ((msg: Message) => void)[]> = {};

  private constructor() {}

  public static getInstance(): MessageBus {
    if (!MessageBus.instance) {
      MessageBus.instance = new MessageBus();
    }
    return MessageBus.instance;
  }

  public subscribe(recipientId: string, listener: (msg: Message) => void) {
    if (!this.listeners[recipientId]) {
      this.listeners[recipientId] = [];
    }
    this.listeners[recipientId].push(listener);
  }

  public publish(msg: Omit<Message, 'id' | 'timestamp'>) {
    const fullMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };

    const targetListeners = this.listeners[msg.recipientId] || [];
    for (const listener of targetListeners) {
      try {
        listener(fullMsg);
      } catch (err) {
        console.error('Error dispatching message to listener:', err);
      }
    }
  }
}

export const messageBus = MessageBus.getInstance();
