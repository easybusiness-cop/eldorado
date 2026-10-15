import { Router } from 'express';
import { composioRegistry } from '../integrations/composio/registry.ts';
import { toolGateway } from '../tools/gateway.ts';
import * as cheerio from 'cheerio';

export const integrationRouter = Router();

// Status of all active data-sharing integrations
integrationRouter.get('/status', async (req, res) => {
  try {
    await composioRegistry.sync();
  } catch (err) {
    console.error('Failed to sync Composio connections:', err);
  }
  res.json({
    success: true,
    ...composioRegistry.getStatusSummary(),
  });
});

// ArXiv Open Scientific Research Data Feed
integrationRouter.get('/arxiv', async (req, res) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : 'cat:cs.AI';
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 5, 20);

    const arxivUrl = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(
      query
    )}&start=0&max_results=${limit}&sortBy=submittedDate&sortOrder=descending`;

    const response = await fetch(arxivUrl);
    if (!response.ok) {
      throw new Error(`ArXiv responded with status ${response.status}`);
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const papers: any[] = [];
    $('entry').each((_, el) => {
      const id = $(el).find('id').text().trim();
      const title = $(el).find('title').text().replace(/\s+/g, ' ').trim();
      const summary = $(el).find('summary').text().replace(/\s+/g, ' ').trim();
      const published = $(el).find('published').text().trim();
      const updated = $(el).find('updated').text().trim();

      const authors: string[] = [];
      $(el).find('author name').each((_, a) => {
        authors.push($(a).text().trim());
      });

      papers.push({
        id,
        title,
        summary,
        authors,
        published,
        updated,
        pdfUrl: id.replace('/abs/', '/pdf/'),
      });
    });

    res.json({
      success: true,
      query,
      count: papers.length,
      papers,
      source: 'https://export.arxiv.org',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hacker News Live Stream Data Feed
integrationRouter.get('/hackernews', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 30);
    const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!hnRes.ok) {
      throw new Error('Hacker News API unreachable');
    }

    const storyIds: number[] = await hnRes.json();
    const targetIds = storyIds.slice(0, limit);

    const stories = await Promise.all(
      targetIds.map(async (id) => {
        try {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (itemRes.ok) return await itemRes.json();
        } catch {
          return null;
        }
      })
    );

    res.json({
      success: true,
      count: stories.filter(Boolean).length,
      stories: stories.filter(Boolean),
      source: 'https://hacker-news.firebaseio.com',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

integrationRouter.post('/tool/execute', async (req, res) => {
  const organizationId = (req as any).identity?.organizationId;
  if (!organizationId) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED_TENANT', message: 'Authentication / Organization tenant ID is required.' }
    });
  }

  const payload = {
    ...req.body,
    organizationId,
  };

  const result = await toolGateway.execute(payload);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});
