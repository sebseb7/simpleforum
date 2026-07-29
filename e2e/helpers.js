import { API_URL, e2eEnv } from './env.js';

const SECRET = e2eEnv.E2E_AUTH_SECRET;

export async function testLogin({ email, name, isAdmin = false }) {
  const res = await fetch(`${API_URL}/api/auth/test-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-E2E-Secret': SECRET,
    },
    body: JSON.stringify({ email, name, isAdmin }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`test-login failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function apiRequest(token, method, path, body) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `API ${method} ${path} → ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Inject JWT so hydrateAuth picks it up on first load. */
export async function loginAs(page, user) {
  const { token, user: profile } = await testLogin(user);
  await page.addInitScript((t) => {
    localStorage.setItem('romanum_token', t);
  }, token);
  return { token, user: profile };
}

export async function fillQuill(page, text) {
  const editor = page.locator('.ql-editor').first();
  await editor.click();
  await editor.fill(text);
}
