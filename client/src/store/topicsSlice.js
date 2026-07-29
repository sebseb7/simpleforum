import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api.js';

export const TOPICS_PAGE_SIZE = 20;
export const POSTS_PAGE_SIZE = 50;

export const fetchSectionTopics = createAsyncThunk(
  'topics/fetchBySection',
  async ({ sectionId, offset = 0, limit = TOPICS_PAGE_SIZE }) => {
    const data = await api.getSectionTopics(sectionId, { offset, limit });
    return data;
  },
);

export const fetchTopic = createAsyncThunk(
  'topics/fetchOne',
  async ({ topicId, offset = 0, limit = POSTS_PAGE_SIZE }) => {
    const data = await api.getTopic(topicId, { offset, limit });
    return data;
  },
);

export const createTopic = createAsyncThunk(
  'topics/create',
  async ({ sectionId, title, bodyHtml }, { dispatch }) => {
    const data = await api.createTopic(sectionId, { title, bodyHtml });
    await dispatch(
      fetchSectionTopics({ sectionId, offset: 0, limit: TOPICS_PAGE_SIZE }),
    );
    return data;
  },
);

export const closeTopic = createAsyncThunk('topics/close', async (topicId) => {
  const { topic } = await api.closeTopic(topicId);
  return topic;
});

export const updateTopic = createAsyncThunk(
  'topics/update',
  async ({ topicId, title, bodyHtml }) => {
    const data = await api.updateTopic(topicId, { title, bodyHtml });
    return data;
  },
);

export const deleteTopic = createAsyncThunk('topics/delete', async (topicId) => {
  const data = await api.deleteTopic(topicId);
  return data;
});

const topicsSlice = createSlice({
  name: 'topics',
  initialState: {
    section: null,
    list: [],
    listTotal: 0,
    listOffset: 0,
    listLimit: TOPICS_PAGE_SIZE,
    current: null,
    listStatus: 'idle',
    currentStatus: 'idle',
    error: null,
    deletedNavigate: null,
  },
  reducers: {
    applyTopicClosed(state, action) {
      const { topicId } = action.payload;
      if (state.current?.id === topicId) state.current.isClosed = true;
      const item = state.list.find((t) => t.id === topicId);
      if (item) item.isClosed = true;
    },
    applyTopicUpdated(state, action) {
      const topic = action.payload;
      if (state.current?.id === topic.id) {
        state.current = { ...state.current, ...topic };
      }
      const idx = state.list.findIndex((t) => t.id === topic.id);
      if (idx >= 0) state.list[idx] = { ...state.list[idx], ...topic };
    },
    applyTopicDeleted(state, action) {
      const { topicId, sectionId } = action.payload;
      state.list = state.list.filter((t) => t.id !== topicId);
      if (state.listTotal > 0) state.listTotal -= 1;
      if (state.current?.id === topicId) {
        state.current = null;
        state.deletedNavigate = { sectionId };
      }
    },
    clearDeletedNavigate(state) {
      state.deletedNavigate = null;
    },
    applyStarOnTopic(state, action) {
      const { targetId, starCount, starredByMe } = action.payload;
      if (state.current?.id === targetId) {
        state.current.starCount = starCount;
        if (starredByMe !== undefined) state.current.starredByMe = starredByMe;
      }
      const item = state.list.find((t) => t.id === targetId);
      if (item) {
        item.starCount = starCount;
        if (starredByMe !== undefined) item.starredByMe = starredByMe;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSectionTopics.pending, (state, action) => {
        state.listStatus = 'loading';
        state.error = null;
        const requestedId = Number(action.meta.arg.sectionId);
        if (state.section?.id !== requestedId) {
          state.section = null;
          state.list = [];
          state.listTotal = 0;
          state.listOffset = 0;
        }
      })
      .addCase(fetchSectionTopics.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.section = action.payload.section;
        state.list = action.payload.topics;
        state.listTotal = action.payload.total ?? 0;
        state.listOffset = action.payload.offset ?? 0;
        state.listLimit = action.payload.limit ?? TOPICS_PAGE_SIZE;
      })
      .addCase(fetchSectionTopics.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchTopic.pending, (state, action) => {
        state.currentStatus = 'loading';
        state.error = null;
        const requestedId = Number(action.meta.arg.topicId);
        if (state.current?.id !== requestedId) {
          state.current = null;
        }
      })
      .addCase(fetchTopic.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload.topic;
      })
      .addCase(fetchTopic.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(closeTopic.fulfilled, (state, action) => {
        state.current = action.payload;
        const item = state.list.find((t) => t.id === action.payload.id);
        if (item) item.isClosed = true;
      })
      .addCase(updateTopic.fulfilled, (state, action) => {
        const topic = action.payload.topic;
        state.current = topic;
        const idx = state.list.findIndex((t) => t.id === topic.id);
        if (idx >= 0) {
          state.list[idx] = { ...state.list[idx], ...topic };
        }
      })
      .addCase(deleteTopic.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t.id !== action.payload.topicId);
        if (state.listTotal > 0) state.listTotal -= 1;
        if (state.current?.id === action.payload.topicId) {
          state.current = null;
          state.deletedNavigate = { sectionId: action.payload.sectionId };
        }
      });
  },
});

export const {
  applyTopicClosed,
  applyTopicUpdated,
  applyTopicDeleted,
  clearDeletedNavigate,
  applyStarOnTopic,
} = topicsSlice.actions;

export default topicsSlice.reducer;
