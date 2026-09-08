import { Router, Request, Response } from 'express';
import { telegramService } from '../integrations/telegram/telegram.service.ts';

export const telegramRouter = Router();

// GET /api/telegram/status - Get status & bot config
telegramRouter.get('/status', (req: Request, res: Response) => {
  try {
    const config = telegramService.getBotConfig();
    res.json({
      success: true,
      config,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/telegram/config - Update Telegram Bot Token
telegramRouter.post('/config', (req: Request, res: Response) => {
  try {
    const { botToken } = req.body;
    if (botToken !== undefined) {
      telegramService.setBotToken(botToken);
    }
    const config = telegramService.getBotConfig();
    res.json({
      success: true,
      message: 'Telegram Bot configuration updated successfully',
      config,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/telegram/chats - List all chats/groups
telegramRouter.get('/chats', (req: Request, res: Response) => {
  try {
    const { category, search, type } = req.query;
    if (search || type) {
      const results = telegramService.searchChats(
        typeof search === 'string' ? search : '',
        typeof type === 'string' ? type : undefined
      );
      return res.json({ success: true, chats: results });
    }

    const chats = telegramService.getChats(typeof category === 'string' ? category : undefined);
    res.json({ success: true, chats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/telegram/search - Search across groups, channels, and public handles
telegramRouter.get('/search', (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const results = telegramService.searchChats(query, type);
    res.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/telegram/chats - Create new group or channel
telegramRouter.post('/chats', async (req: Request, res: Response) => {
  try {
    const { title, type, category, description, members } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Chat title is required' });
    }
    const newChat = await telegramService.createChat({
      title,
      type: type === 'channel' ? 'channel' : 'group',
      category,
      description,
      members,
    });
    res.json({ success: true, chat: newChat });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/telegram/chats/:id/join - Join or leave a chat/channel
telegramRouter.post('/chats/:id/join', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { join = true } = req.body;
    const updated = await telegramService.toggleJoinChat(id, Boolean(join));
    res.json({ success: true, chat: updated, action: join ? 'JOINED' : 'LEFT' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/telegram/messages/:chatId - Get messages for chat
telegramRouter.get('/messages/:chatId', (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const messages = telegramService.getMessages(chatId);
    res.json({ success: true, chatId, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/telegram/messages & /api/telegram/send - Send message to any chat/user/group
const handleSendMessageRoute = async (req: Request, res: Response) => {
  try {
    const { chatId, text, senderName, senderUsername, isAgent, agentId, replyToId } = req.body;
    if (!chatId || !text) {
      return res.status(400).json({ success: false, error: 'chatId and text are required' });
    }

    const result = await telegramService.sendMessage({
      chatId,
      text,
      senderName: senderName || 'Rufflo Agent',
      senderUsername: senderUsername || (agentId ? `${agentId}_agent` : 'operator'),
      isAgent: isAgent !== undefined ? isAgent : true,
      agentId,
      replyToId,
    });

    res.json({
      success: true,
      message: result.message,
      agentReplies: result.agentReplies || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

telegramRouter.post('/messages', handleSendMessageRoute);
telegramRouter.post('/send', handleSendMessageRoute);

// POST /api/telegram/webhook - Webhook receiver for live Telegram Bot updates
telegramRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    console.log('📬 Inbound Telegram Webhook received:', JSON.stringify(update).substring(0, 200));

    if (update.message && update.message.text) {
      const chatId = String(update.message.chat.id);
      const text = update.message.text;
      const senderName = update.message.from.first_name || update.message.from.username || 'Telegram User';

      await telegramService.sendMessage({
        chatId,
        text,
        senderName,
        senderUsername: update.message.from.username,
        isAgent: false,
      });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/telegram/stars/balance - Get Telegram Stars balance
telegramRouter.get('/stars/balance', (req: Request, res: Response) => {
  res.json({ success: true, ...telegramService.getStarsBalance() });
});

// GET /api/telegram/stars/transactions - Get Telegram Stars purchase/spend audit log
telegramRouter.get('/stars/transactions', (req: Request, res: Response) => {
  res.json({ success: true, transactions: telegramService.getStarsTransactions() });
});

// POST /api/telegram/stars/invoice - Create invoice link for Telegram Stars
telegramRouter.post('/stars/invoice', async (req: Request, res: Response) => {
  try {
    const { title, description, payload, starAmount } = req.body;
    const result = await telegramService.createInvoiceLink({
      title: title || 'Rufflo Fleet Pro Upgrade',
      description: description || 'Extra agent slots & priority task distribution',
      payload: payload || 'pro_pack',
      starAmount: Number(starAmount) || 500,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/telegram/stars/buy - Buy Stars plan or simulate instant upgrade
telegramRouter.post('/stars/buy', async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const result = await telegramService.buyStarsPlan(planId || 'commander-500');
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
