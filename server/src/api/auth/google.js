import { Router } from 'express';
import {
  verifyGoogleIdToken,
  getAdminEmails,
  signToken,
  publicUser,
} from '../../auth.js';

export default function createGoogleAuthRouter(store) {
  const router = Router();

  router.post('/google', async (req, res) => {
    try {
      const { credential } = req.body || {};
      if (!credential) {
        return res.status(400).json({ error: 'credential required' });
      }
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID missing from process.env');
        return res.status(503).json({ error: 'GOOGLE_CLIENT_ID not configured' });
      }

      console.log('Verifying Google credential…');
      const profile = await verifyGoogleIdToken(credential);
      console.log(`Google auth OK for ${profile.email}`);
      const admins = getAdminEmails();
      const isAdmin = admins.includes(profile.email.toLowerCase()) ? 1 : 0;

      let user = store.users.findByGoogleSub.get(profile.googleSub);
      if (user) {
        // Keep display name and avatar preference; refresh Google email/picture/admin only.
        store.users.updateLogin.run(
          profile.email,
          profile.picture,
          isAdmin,
          user.id,
        );
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
      console.error('Google auth failed:', err.message);
      return res.status(401).json({ error: 'Google authentication failed' });
    }
  });

  return router;
}
