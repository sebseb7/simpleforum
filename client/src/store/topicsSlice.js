import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api.js';

export const fetchSectionTopics = createAsyncThunk(
  'topics/fetchBySection',
  async (sectionId) => {
    const data = await api.getSectionTopics(sectionId);
    return data;
  },
);

export const fetchTopic = createAsyncThunk('topics/fetchOne', async (topicId) => {
  const data = await api.getTopic(topicId);
  return data;
});

export const createTopic = createAsyncThunk(
  'topics/create',
  async ({ sectionId, title, bodyHtml }) => {
    const { topic } = await api.createTopic(sectionId, { title, bodyHtml });
    return topic;
  },
);

export const closeTopic = createAsyncThunk('topics/close', async (topicId) => {
  const { topic } = await api.closeTopic(topicId);
  return topic;
});

export const updateTopic = createAsyncThunk(
  'topics/update',
  async ({ topicId, title, bodyHtml }) => {
    const { topic } = await api.updateTopic(topicId, { title, bodyHtml });
    return topic;
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
        const requestedId = Number(action.meta.arg);
        if (state.section?.id !== requestedId) {
          state.section = null;
          state.list = [];
        }
      })
      .addCase(fetchSectionTopics.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.section = action.payload.section;
        state.list = action.payload.topics;
      })
      .addCase(fetchSectionTopics.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchTopic.pending, (state, action) => {
        state.currentStatus = 'loading';
        state.error = null;
        const requestedId = Number(action.meta.arg);
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
      .addCase(createTopic.fulfilled, (state, action) => {
        if (state.section?.id === action.payload.sectionId) {
          state.list = [action.payload, ...state.list.filter((t) => t.id !== action.payload.id)];
        }
      })
      .addCase(closeTopic.fulfilled, (state, action) => {
        state.current = action.payload;
        const item = state.list.find((t) => t.id === action.payload.id);
        if (item) item.isClosed = true;
      })
      .addCase(updateTopic.fulfilled, (state, action) => {
        state.current = action.payload;
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx >= 0) {
          state.list[idx] = { ...state.list[idx], ...action.payload };
        }
      })
      .addCase(deleteTopic.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t.id !== action.payload.topicId);
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
