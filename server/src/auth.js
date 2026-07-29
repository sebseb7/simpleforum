import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

let googleClient;

function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyGoogleIdToken(idToken) {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Invalid Google token payload');
  }
  return {
    googleSub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || null,
  };
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, isAdmin: !!user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

export function publicUser(row) {
  if (!row) return null;
  const hideAvatar = !!row.hide_avatar;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: hideAvatar ? null : row.picture || null,
    hideAvatar,
    isAdmin: !!row.is_admin,
    createdAt: row.created_at,
  };
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      isAdmin: !!payload.isAdmin,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match) {
    try {
      const payload = jwt.verify(match[1], process.env.JWT_SECRET);
      req.user = {
        id: Number(payload.sub),
        email: payload.email,
        isAdmin: !!payload.isAdmin,
      };
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin required' });
  }
  return next();
}
