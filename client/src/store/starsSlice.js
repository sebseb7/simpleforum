import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api.js';

export const fetchMyStars = createAsyncThunk('stars/fetchMine', async () => {
  return api.getMyStars();
});

export const starItem = createAsyncThunk(
  'stars/star',
  async ({ targetType, targetId }) => {
    return api.star(targetType, targetId);
  },
);

export const unstarItem = createAsyncThunk(
  'stars/unstar',
  async ({ targetType, targetId }) => {
    return api.unstar(targetType, targetId);
  },
);

const starsSlice = createSlice({
  name: 'stars',
  initialState: {
    topics: [],
    posts: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyStars.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyStars.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.topics = action.payload.topics;
        state.posts = action.payload.posts;
      })
      .addCase(fetchMyStars.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default starsSlice.reducer;
