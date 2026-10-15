import { Router, Request, Response } from 'express';
import { telegramService } from '../integrations/telegram/telegram.service.ts';

export const telegramRouter = Router();

// GET /api/telegram/status - Get real status & bot connection
telegramRouter.get('/status', (req: Request, res: Response) => {
  try {
    const status = telegramService.getStatus();
    res.json({
      success: true,
      status,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/telegram/config - Connect & validate real Telegram Bot Token
telegramRouter.post('/config', async (req: Request, res: Response) => {
  try {
    const { botToken } = req.body;
    if (!botToken) {
      return res.status(400).json({ success: false, error: 'botToken is required' });
    }

    const verification = await telegramService.validateBotToken(botToken);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: verification.error || 'Failed to authenticate with Telegram Bot API',
      });
    }

    res.json({
      success: true,
      message: `Authenticated successfully with Telegram Bot: @${verification.bot?.username}`,
      bot: verification.bot,
      status: telegramService.getStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/telegram/chats - List all real Telegram channels/chats
telegramRouter.get('/chats', (req: Request, res: Response) => {
  try {
    const chats = telegramService.getChats();
    res.json({ success: true, count: chats.length, chats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/telegram/channel/:username - Scrape and fetch real channel live
telegramRouter.get('/channel/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const result = await telegramService.fetchRealChannel(username);
    res.json({
      success: true,
      chat: result.chat,
      messages: result.messages,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/telegram/search - Search across real public Telegram channels and message texts
telegramRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await telegramService.searchRealTelegram(query);
    res.json({
      success: true,
      query,
      chatsCount: results.chats.length,
      messagesCount: results.messages.length,
      chats: results.chats,
      messages: results.messages,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/telegram/messages/:chatId - Get real messages for chat/channel
telegramRouter.get('/messages/:chatId', (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const messages = telegramService.getMessages(chatId);
    res.json({ success: true, chatId, count: messages.length, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/telegram/send - Send real message via Telegram Bot API or channel relay
telegramRouter.post(['/send', '/messages'], async (req: Request, res: Response) => {
  try {
    const { chatId, text } = req.body;
    if (!chatId || !text) {
      return res.status(400).json({ success: false, error: 'chatId and text are required' });
    }

    const result = await telegramService.sendRealMessage(chatId, text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
