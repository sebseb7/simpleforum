import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api.js';
import { getStoredLang } from '../i18n/index.js';

function normalizeListMode(mode) {
  if (!mode) return { lang: getStoredLang() };
  if (mode.all) return { all: true };
  const lang = String(mode.lang || getStoredLang()).toLowerCase().slice(0, 2);
  return { lang: lang === 'de' ? 'de' : 'en' };
}

export const fetchSections = createAsyncThunk(
  'sections/fetchAll',
  async (mode, { getState }) => {
    const listMode = normalizeListMode(mode ?? getState().sections.listMode);
    const data = await api.getSections(listMode);
    return {
      sections: data.sections,
      welcomeTopic: listMode.all ? null : (data.welcomeTopic ?? null),
      siteName: data.siteName ?? '',
      listMode,
    };
  },
);

export const fetchSettings = createAsyncThunk('sections/fetchSettings', async () => {
  return api.getSettings();
});

export const updateSettings = createAsyncThunk(
  'sections/updateSettings',
  async (payload) => {
    return api.updateSettings(payload);
  },
);

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
    welcomeTopic: null,
    siteName: '',
    rootDe: null,
    rootEn: null,
    listMode: { lang: getStoredLang() },
    status: 'idle',
    settingsStatus: 'idle',
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
        state.items = action.payload.sections;
        state.listMode = action.payload.listMode;
        if (action.payload.siteName != null) {
          state.siteName = action.payload.siteName;
        }
        if (!action.payload.listMode.all) {
          state.welcomeTopic = action.payload.welcomeTopic ?? null;
        }
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settingsStatus = 'succeeded';
        if (action.payload.siteName != null) {
          state.siteName = action.payload.siteName;
        }
        state.rootDe = action.payload.rootDe || null;
        state.rootEn = action.payload.rootEn || null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        if (action.payload.siteName != null) {
          state.siteName = action.payload.siteName;
        }
        state.rootDe = action.payload.rootDe || null;
        state.rootEn = action.payload.rootEn || null;
      })
      .addCase(createSection.fulfilled, (state, action) => {
        const section = action.payload;
        const mode = state.listMode;
        const matches =
          mode.all || !mode.lang || section.lang === mode.lang;
        if (!matches) return;
        state.items.push(section);
        state.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      })
      .addCase(updateSection.fulfilled, (state, action) => {
        const section = action.payload;
        const mode = state.listMode;
        const matches =
          mode.all || !mode.lang || section.lang === mode.lang;
        const idx = state.items.findIndex((s) => s.id === section.id);
        if (!matches) {
          if (idx >= 0) state.items.splice(idx, 1);
          return;
        }
        if (idx >= 0) state.items[idx] = section;
        else state.items.push(section);
        state.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      });
  },
});

export default sectionsSlice.reducer;
