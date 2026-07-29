import { Router } from 'express';
import { getLinkPreview } from '../content/linkPreview.js';
import { createLogger } from '../logger.js';

const log = createLogger('link-preview');

export default function createLinkPreviewRouter() {
  const router = Router();

  router.get('/link-preview', async (req, res) => {
    const raw = req.query?.url;
    if (!raw || typeof raw !== 'string') {
      return res.status(400).json({ error: 'url_required' });
    }
    try {
      const preview = await getLinkPreview(raw);
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.json({ preview });
    } catch (err) {
      if (err?.code === 'invalid_url') {
        return res.status(400).json({ error: 'invalid_url' });
      }
      if (err?.code === 'blocked_host') {
        return res.status(400).json({ error: 'blocked_host' });
      }
      log.error('link-preview failed', err);
      return res.status(502).json({ error: 'preview_failed' });
    }
  });

  return router;
}
