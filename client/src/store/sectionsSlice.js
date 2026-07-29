import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api.js';

export const fetchSections = createAsyncThunk('sections/fetchAll', async () => {
  const { sections } = await api.getSections();
  return sections;
});

export const createSection = createAsyncThunk(
  'sections/create',
  async (payload) => {
    const { section } = await api.createSection(payload);
    return section;
  },
);

export const updateSection = createAsyncThunk(
  'sections/update',
  async ({ id, ...payload }) => {
    const { section } = await api.updateSection(id, payload);
    return section;
  },
);

const sectionsSlice = createSlice({
  name: 'sections',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSections.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      })
      .addCase(updateSection.fulfilled, (state, action) => {
        const idx = state.items.findIndex((s) => s.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        else state.items.push(action.payload);
        state.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      });
  },
});

export default sectionsSlice.reducer;
