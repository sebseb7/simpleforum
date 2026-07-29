import { Router } from 'express';
import { addClient, removeClient } from '../sse.js';

function writeSse(res, chunk) {
  try {
    res.write(chunk);
    // compression / some proxies expose flush; force bytes out for HTTP/2 keepalives
    if (typeof res.flush === 'function') res.flush();
  } catch {
    return false;
  }
  return true;
}

export default function createEventsRouter() {
  const router = Router();

  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, no-transform');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    if (!writeSse(res, `data: ${JSON.stringify({ type: 'connected', payload: {} })}\n\n`)) {
      return;
    }
    addClient(res);

    // Keep HTTP/2 / proxy connections warm (Chrome PING failures if idle too long).
    const heartbeat = setInterval(() => {
      if (!writeSse(res, `: ping ${Date.now()}\n\n`)) {
        clearInterval(heartbeat);
        removeClient(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      removeClient(res);
    });
  });

  return router;
}
