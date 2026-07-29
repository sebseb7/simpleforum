import { Router } from 'express';
import { addClient, removeClient } from '../sse.js';

export default function createEventsRouter() {
  const router = Router();

  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: 'connected', payload: {} })}\n\n`);
    addClient(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
        removeClient(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      removeClient(res);
    });
  });

  return router;
}
