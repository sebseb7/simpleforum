import { Router } from 'express';
import {
  verifyGoogleIdToken,
  getAdminEmails,
  signToken,
  publicUser,
} from '../../auth.js';
import { createLogger } from '../../logger.js';

const log = createLogger('auth');

export default function createGoogleAuthRouter(store) {
  const router = Router();

  router.post('/google', async (req, res) => {
    try {
      const { credential } = req.body || {};
      if (!credential) {
        return res.status(400).json({ error: 'credential required' });
      }
      if (!process.env.GOOGLE_CLIENT_ID) {
        log.error('GOOGLE_CLIENT_ID missing from process.env');
        return res.status(503).json({ error: 'GOOGLE_CLIENT_ID not configured' });
      }

      log.info('Verifying Google credential…');
      const profile = await verifyGoogleIdToken(credential);
      log.info(`Google auth OK for ${profile.email}`);
      const admins = getAdminEmails();
      const isAdmin = admins.includes(profile.email.toLowerCase()) ? 1 : 0;

      let user = store.users.findByGoogleSub.get(profile.googleSub);
      if (user) {
        // Keep display name, avatar preference, and admin flag; refresh email/picture only.
        store.users.updateLogin.run(profile.email, profile.picture, user.id);
        user = store.users.findById.get(user.id);
      } else {
        const result = store.users.insert.run(
          profile.googleSub,
          profile.email,
          profile.name,
          profile.picture,
          isAdmin,
        );
        user = store.users.findById.get(result.lastInsertRowid);
      }

      const token = signToken(user);
      return res.json({ token, user: publicUser(user) });
    } catch (err) {
      log.error('Google auth failed:', err.message);
      return res.status(401).json({ error: 'Google authentication failed' });
    }
  });

  return router;
}
