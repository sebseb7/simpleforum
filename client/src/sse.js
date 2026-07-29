import {
  fetchSections,
} from './store/sectionsSlice.js';
import {
  fetchSectionTopics,
  fetchTopic,
  applyTopicClosed,
  applyTopicDeleted,
  applyStarOnTopic,
  TOPICS_PAGE_SIZE,
  POSTS_PAGE_SIZE,
} from './store/topicsSlice.js';
import { applyStarOnPost } from './store/postsSlice.js';
import { createLogger } from './logger.js';

const log = createLogger('sse');

/** If no event (incl. heartbeat) arrives, treat the HTTP/2 stream as dead. */
const STALE_MS = 45000;
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30000;

let source = null;
let storeRef = null;
let lastEventAt = 0;
let watchdogTimer = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let intentionalClose = false;

function clearTimers() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  if (intentionalClose || reconnectTimer) return;
  const delay = Math.min(
    RECONNECT_MAX_MS,
    RECONNECT_MIN_MS * 2 ** Math.min(reconnectAttempt, 5),
  );
  reconnectAttempt += 1;
  log.warn(`reconnect in ${delay}ms (attempt ${reconnectAttempt})`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openSource();
  }, delay);
}

function openSource() {
  if (intentionalClose || !storeRef) return;
  if (source) {
    try {
      source.close();
    } catch {
      // ignore
    }
    source = null;
  }

  lastEventAt = Date.now();
  source = new EventSource('/api/events');

  source.onmessage = (event) => {
    lastEventAt = Date.now();
    reconnectAttempt = 0;
    try {
      const msg = JSON.parse(event.data);
      if (msg?.type === 'heartbeat' || msg?.type === 'connected') return;
      handleEvent(storeRef, msg);
    } catch (err) {
      log.error('SSE parse error', err);
    }
  };

  source.onerror = () => {
    // EventSource auto-retries, but after ERR_HTTP2_PING_FAILED it can stick.
    // Force a clean reopen if the socket looks dead.
    if (!source) return;
    if (source.readyState === EventSource.CLOSED) {
      source = null;
      scheduleReconnect();
    }
  };

  if (!watchdogTimer) {
    watchdogTimer = setInterval(() => {
      if (intentionalClose) return;
      if (Date.now() - lastEventAt < STALE_MS) return;
      log.warn('stale stream — forcing reconnect');
      if (source) {
        try {
          source.close();
        } catch {
          // ignore
        }
        source = null;
      }
      scheduleReconnect();
    }, 10000);
  }
}

export function startSse(store) {
  storeRef = store;
  intentionalClose = false;
  if (source || reconnectTimer) return;
  openSource();

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }
}

function onVisibility() {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') {
    return;
  }
  if (intentionalClose || !storeRef) return;
  // Tab woke up: if stream went stale in background, reconnect now.
  if (!source || Date.now() - lastEventAt > STALE_MS) {
    log.info('tab visible — refreshing SSE');
    if (source) {
      try {
        source.close();
      } catch {
        // ignore
      }
      source = null;
    }
    reconnectAttempt = 0;
    openSource();
  }
}

export function stopSse() {
  intentionalClose = true;
  clearTimers();
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibility);
  }
  if (source) {
    source.close();
    source = null;
  }
  storeRef = null;
}

function refetchSectionTopics(store, sectionId) {
  const { listOffset, listLimit, section } = store.getState().topics;
  if (section?.id !== sectionId) return;
  store.dispatch(
    fetchSectionTopics({
      sectionId,
      offset: listOffset || 0,
      limit: listLimit || TOPICS_PAGE_SIZE,
    }),
  );
}

function refetchTopic(store, topicId) {
  const { current } = store.getState().topics;
  const win = store.getState().posts.window;
  if (current?.id !== topicId) return;
  store.dispatch(
    fetchTopic({
      topicId,
      offset: win?.topicId === topicId ? win.offset : 0,
      limit: win?.topicId === topicId ? win.limit : POSTS_PAGE_SIZE,
    }),
  );
}

function handleEvent(store, msg) {
  const { type, payload } = msg;
  const state = store.getState();

  switch (type) {
    case 'section.created':
    case 'section.updated':
      store.dispatch(fetchSections());
      break;

    case 'topic.created':
      if (state.topics.section?.id === payload.sectionId) {
        refetchSectionTopics(store, payload.sectionId);
      }
      store.dispatch(fetchSections());
      break;

    case 'topic.closed':
      store.dispatch(applyTopicClosed({ topicId: payload.topicId }));
      if (state.topics.section?.id === payload.sectionId) {
        refetchSectionTopics(store, payload.sectionId);
      }
      break;

    case 'topic.updated':
      if (state.topics.current?.id === payload.topicId) {
        refetchTopic(store, payload.topicId);
      }
      if (state.topics.section?.id === payload.sectionId) {
        refetchSectionTopics(store, payload.sectionId);
      }
      break;

    case 'topic.deleted':
      store.dispatch(
        applyTopicDeleted({
          topicId: payload.topicId,
          sectionId: payload.sectionId,
          sectionSlug: payload.sectionSlug,
        }),
      );
      if (state.topics.section?.id === payload.sectionId) {
        refetchSectionTopics(store, payload.sectionId);
      }
      store.dispatch(fetchSections());
      break;

    case 'post.created':
    case 'post.updated':
    case 'post.deleted':
      if (state.topics.current?.id === payload.topicId) {
        refetchTopic(store, payload.topicId);
      }
      if (state.topics.section?.id === payload.sectionId) {
        refetchSectionTopics(store, payload.sectionId);
      }
      break;

    case 'account.deleted':
      store.dispatch(fetchSections());
      if (payload.sectionIds?.length) {
        for (const sectionId of payload.sectionIds) {
          if (state.topics.section?.id === sectionId) {
            refetchSectionTopics(store, sectionId);
          }
        }
      }
      if (
        state.topics.current &&
        payload.topicIds?.includes(state.topics.current.id)
      ) {
        store.dispatch(
          applyTopicDeleted({
            topicId: state.topics.current.id,
            sectionId: state.topics.current.sectionId,
          }),
        );
      }
      break;

    case 'user.updated':
      if (state.topics.current) {
        refetchTopic(store, state.topics.current.id);
      }
      if (state.topics.section?.id) {
        refetchSectionTopics(store, state.topics.section.id);
      }
      break;

    case 'star.changed':
      if (payload.targetType === 'topic') {
        store.dispatch(
          applyStarOnTopic({
            targetId: payload.targetId,
            starCount: payload.starCount,
          }),
        );
      } else if (payload.targetType === 'post') {
        store.dispatch(
          applyStarOnPost({
            targetId: payload.targetId,
            starCount: payload.starCount,
          }),
        );
      }
      break;

    default:
      break;
  }
}
