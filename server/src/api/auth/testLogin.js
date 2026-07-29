import { Router } from 'express';
import { getAdminEmails, signToken, publicUser } from '../../auth.js';

/**
 * Test-only auth. Enabled only when E2E_AUTH_SECRET is set.
 * POST /api/auth/test-login  { email, name?, isAdmin? }
 * Header: X-E2E-Secret: <E2E_AUTH_SECRET>
 */
export default function createTestLoginRouter(store) {
  const router = Router();
  const secret = process.env.E2E_AUTH_SECRET;

  if (!secret) {
    return router;
  }

  router.post('/test-login', (req, res) => {
    if (req.headers['x-e2e-secret'] !== secret) {
      return res.status(403).json({ error: 'Invalid E2E secret' });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    const name = String(req.body?.name || email.split('@')[0]);
    const admins = getAdminEmails();
    const forceAdmin = req.body?.isAdmin === true;
    const isAdmin = forceAdmin || admins.includes(email) ? 1 : 0;
    const googleSub = `e2e:${email}`;

    let user = store.users.findByGoogleSub.get(googleSub);
    if (user) {
      store.users.updateLogin.run(email, null, user.id);
      store.users.updateAdmin.run(isAdmin, user.id);
      store.users.updateSettings.run(name, user.hide_avatar, user.id);
      user = store.users.findById.get(user.id);
    } else {
      const result = store.users.insert.run(googleSub, email, name, null, isAdmin);
      user = store.users.findById.get(result.lastInsertRowid);
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  });

  return router;
}
