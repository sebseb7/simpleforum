import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import sectionsReducer from './sectionsSlice.js';
import topicsReducer from './topicsSlice.js';
import postsReducer from './postsSlice.js';
import starsReducer from './starsSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    sections: sectionsReducer,
    topics: topicsReducer,
    posts: postsReducer,
    stars: starsReducer,
  },
});

export default store;
