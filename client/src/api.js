const TOKEN_KEY = 'romanum_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  return getToken();
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  loginWithGoogle(credential) {
    return request('/auth/google', {
      method: 'POST',
      body: { credential },
    });
  },

  getMe() {
    return request('/me');
  },

  updateMe(payload) {
    return request('/me', { method: 'PATCH', body: payload });
  },

  deleteAccount() {
    return request('/me', { method: 'DELETE' });
  },

  getSections({ lang, all } = {}) {
    if (all) return request('/sections?all=1');
    const q = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return request(`/sections${q}`);
  },

  createSection(payload) {
    return request('/sections', { method: 'POST', body: payload });
  },

  updateSection(id, payload) {
    return request(`/sections/${id}`, { method: 'PATCH', body: payload });
  },

  getSectionTopics(sectionId) {
    return request(`/sections/${sectionId}/topics`);
  },

  createTopic(sectionId, payload) {
    return request(`/sections/${sectionId}/topics`, {
      method: 'POST',
      body: payload,
    });
  },

  getTopic(topicId) {
    return request(`/topics/${topicId}`);
  },

  closeTopic(topicId) {
    return request(`/topics/${topicId}/close`, { method: 'PATCH' });
  },

  updateTopic(topicId, payload) {
    return request(`/topics/${topicId}`, { method: 'PATCH', body: payload });
  },

  deleteTopic(topicId) {
    return request(`/topics/${topicId}`, { method: 'DELETE' });
  },

  createPost(topicId, payload) {
    return request(`/topics/${topicId}/posts`, {
      method: 'POST',
      body: payload,
    });
  },

  updatePost(postId, payload) {
    return request(`/posts/${postId}`, { method: 'PATCH', body: payload });
  },

  deletePost(postId) {
    return request(`/posts/${postId}`, { method: 'DELETE' });
  },

  star(targetType, targetId) {
    return request('/stars', {
      method: 'POST',
      body: { targetType, targetId },
    });
  },

  unstar(targetType, targetId) {
    return request('/stars', {
      method: 'DELETE',
      body: { targetType, targetId },
    });
  },

  getMyStars() {
    return request('/stars/mine');
  },
};

export default api;
