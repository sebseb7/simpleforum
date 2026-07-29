import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api.js';
import { fetchTopic } from './topicsSlice.js';

export const createPost = createAsyncThunk(
  'posts/create',
  async ({ topicId, bodyHtml }) => {
    const { post } = await api.createPost(topicId, { bodyHtml });
    return post;
  },
);

export const updatePost = createAsyncThunk(
  'posts/update',
  async ({ postId, bodyHtml }) => {
    const { post } = await api.updatePost(postId, { bodyHtml });
    return post;
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
    },
    clearTopicPosts(state, action) {
      delete state.byTopicId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopic.fulfilled, (state, action) => {
        state.byTopicId[action.payload.topic.id] = action.payload.posts;
        state.status = 'succeeded';
      })
      .addCase(createPost.fulfilled, (state, action) => {
        const topicId = action.payload.topicId;
        const list = state.byTopicId[topicId] || [];
        if (!list.some((p) => p.id === action.payload.id)) {
          state.byTopicId[topicId] = [...list, action.payload];
        }
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const post = action.payload;
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
