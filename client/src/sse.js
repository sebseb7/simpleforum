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

let source = null;

export function startSse(store) {
  if (source) return;

  source = new EventSource('/api/events');

  source.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleEvent(store, msg);
    } catch (err) {
      console.error('SSE parse error', err);
    }
  };

  source.onerror = () => {
    // Browser auto-reconnects; no-op
  };
}

export function stopSse() {
  if (source) {
    source.close();
    source = null;
  }
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
