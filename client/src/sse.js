import {
  fetchSections,
} from './store/sectionsSlice.js';
import {
  fetchSectionTopics,
  fetchTopic,
  applyTopicClosed,
  applyTopicDeleted,
  applyStarOnTopic,
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
        store.dispatch(fetchSectionTopics(payload.sectionId));
      }
      store.dispatch(fetchSections());
      break;

    case 'topic.closed':
      store.dispatch(applyTopicClosed({ topicId: payload.topicId }));
      if (state.topics.section?.id === payload.sectionId) {
        store.dispatch(fetchSectionTopics(payload.sectionId));
      }
      break;

    case 'topic.updated':
      if (state.topics.current?.id === payload.topicId) {
        store.dispatch(fetchTopic(payload.topicId));
      }
      if (state.topics.section?.id === payload.sectionId) {
        store.dispatch(fetchSectionTopics(payload.sectionId));
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
        store.dispatch(fetchSectionTopics(payload.sectionId));
      }
      store.dispatch(fetchSections());
      break;

    case 'post.created':
    case 'post.updated':
    case 'post.deleted':
      if (state.topics.current?.id === payload.topicId) {
        store.dispatch(fetchTopic(payload.topicId));
      }
      if (state.topics.section?.id === payload.sectionId) {
        store.dispatch(fetchSectionTopics(payload.sectionId));
      }
      break;

    case 'account.deleted':
      store.dispatch(fetchSections());
      if (payload.sectionIds?.length) {
        for (const sectionId of payload.sectionIds) {
          if (state.topics.section?.id === sectionId) {
            store.dispatch(fetchSectionTopics(sectionId));
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
        store.dispatch(fetchTopic(state.topics.current.id));
      }
      if (state.topics.section?.id) {
        store.dispatch(fetchSectionTopics(state.topics.section.id));
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
