import { Router } from 'express';
import { addClient, removeClient } from '../sse.js';
import { createLogger } from '../logger.js';

const log = createLogger('sse');

/** Keep under Chrome's HTTP/2 PING budget; comment-only pings never reach EventSource. */
const HEARTBEAT_MS = Number(process.env.SSE_HEARTBEAT_MS) || 10000;

function writeSse(res, chunk) {
  try {
    if (res.writableEnded || res.destroyed) return false;
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
    req.socket.setTimeout(0);
    req.socket.setNoDelay?.(true);
    req.socket.setKeepAlive?.(true, 10000);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, no-transform');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    // Disable nginx/http2 buffering hints; avoid transforming the stream.
    res.setHeader('Content-Encoding', 'identity');
    res.flushHeaders?.();

    if (
      !writeSse(
        res,
        `data: ${JSON.stringify({ type: 'connected', payload: {} })}\n\n`,
      )
    ) {
      return;
    }
    addClient(res);
    log.debug('client connected', `clients=${res.socket?.remoteAddress || '?'}`);

    // Real `data:` heartbeats (not SSE comments) so browsers/proxies keep the stream alive
    // and the client watchdog can detect a hung HTTP/2 connection.
    const heartbeat = setInterval(() => {
      const ok = writeSse(
        res,
        `data: ${JSON.stringify({ type: 'heartbeat', t: Date.now() })}\n\n`,
      );
      if (!ok) {
        clearInterval(heartbeat);
        removeClient(res);
      }
    }, HEARTBEAT_MS);

    const cleanup = () => {
      clearInterval(heartbeat);
      removeClient(res);
    };
    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('error', cleanup);
  });

  return router;
}
