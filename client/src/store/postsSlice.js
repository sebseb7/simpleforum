import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api.js';
import { fetchTopic, POSTS_PAGE_SIZE } from './topicsSlice.js';

export const createPost = createAsyncThunk(
  'posts/create',
  async ({ topicId, bodyHtml }, { dispatch, getState }) => {
    const data = await api.createPost(topicId, { bodyHtml });
    const win = getState().posts.window;
    const limit = win?.topicId === topicId ? win.limit : POSTS_PAGE_SIZE;
    // Newest-first: land on the first page so the new reply is visible.
    await dispatch(fetchTopic({ topicId, offset: 0, limit }));
    return data;
  },
);

export const updatePost = createAsyncThunk(
  'posts/update',
  async ({ postId, bodyHtml }) => {
    const data = await api.updatePost(postId, { bodyHtml });
    return data;
  },
);

export const deletePost = createAsyncThunk('posts/delete', async (postId) => {
  const data = await api.deletePost(postId);
  return data;
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    byTopicId: {},
    window: null, // { topicId, total, offset, limit }
    status: 'idle',
    error: null,
  },
  reducers: {
    applyStarOnPost(state, action) {
      const { targetId, starCount, starredByMe } = action.payload;
      for (const posts of Object.values(state.byTopicId)) {
        const post = posts.find((p) => p.id === targetId);
        if (post) {
          post.starCount = starCount;
          if (starredByMe !== undefined) post.starredByMe = starredByMe;
        }
      }
    },
    applyPostUpdated(state, action) {
      const post = action.payload;
      const list = state.byTopicId[post.topicId];
      if (!list) return;
      const idx = list.findIndex((p) => p.id === post.id);
      if (idx >= 0) list[idx] = post;
    },
    applyPostDeleted(state, action) {
      const { postId, topicId } = action.payload;
      const list = state.byTopicId[topicId];
      if (!list) return;
      state.byTopicId[topicId] = list.filter((p) => p.id !== postId);
      if (state.window?.topicId === topicId && state.window.total > 0) {
        state.window.total -= 1;
      }
    },
    clearTopicPosts(state, action) {
      delete state.byTopicId[action.payload];
      if (state.window?.topicId === action.payload) state.window = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopic.fulfilled, (state, action) => {
        const topicId = action.payload.topic.id;
        state.byTopicId[topicId] = action.payload.posts;
        state.window = {
          topicId,
          total: action.payload.total ?? 0,
          offset: action.payload.offset ?? 0,
          limit: action.payload.limit ?? POSTS_PAGE_SIZE,
        };
        state.status = 'succeeded';
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const post = action.payload.post;
        const list = state.byTopicId[post.topicId];
        if (!list) return;
        const idx = list.findIndex((p) => p.id === post.id);
        if (idx >= 0) list[idx] = post;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const { postId, topicId } = action.payload;
        const list = state.byTopicId[topicId];
        if (!list) return;
        state.byTopicId[topicId] = list.filter((p) => p.id !== postId);
        if (state.window?.topicId === topicId && state.window.total > 0) {
          state.window.total -= 1;
        }
      });
  },
});

export const {
  applyStarOnPost,
  applyPostUpdated,
  applyPostDeleted,
  clearTopicPosts,
} = postsSlice.actions;

export default postsSlice.reducer;
