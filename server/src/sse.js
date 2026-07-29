import { scheduleRebuildForEvent } from './ssg/triggerBuild.js';

const clients = new Set();

export function addClient(res) {
  clients.add(res);
}

export function removeClient(res) {
  clients.delete(res);
}

export function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    try {
      res.write(data);
      if (typeof res.flush === 'function') res.flush();
    } catch {
      clients.delete(res);
    }
  }
  scheduleRebuildForEvent(event);
}
