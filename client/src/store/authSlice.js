import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getStoredToken, setStoredToken } from '../api.js';

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const token = getStoredToken();
  if (!token) return { token: null, user: null };
  try {
    const { user } = await api.getMe();
    return { token, user };
  } catch {
    setStoredToken(null);
    return { token: null, user: null };
  }
});

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (credential) => {
    const { token, user } = await api.loginWithGoogle(credential);
    setStoredToken(token);
    return { token, user };
  },
);

export const deleteAccount = createAsyncThunk('auth/deleteAccount', async () => {
  await api.deleteAccount();
  setStoredToken(null);
  return null;
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ name, hideAvatar }) => {
    const { user } = await api.updateMe({ name, hideAvatar });
    return user;
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: getStoredToken(),
    user: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      setStoredToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.status = 'failed';
        state.token = null;
        state.user = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
