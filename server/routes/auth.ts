import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SESSION_COOKIE = 'lp_session';

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] SESSION_SECRET not set – using dev fallback. Set SESSION_SECRET in .env.local for security.');
      return 'dev-only-secret-not-for-production';
    }
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  return secret;
}

// POST /api/auth/google  – verify Google ID token, issue session cookie
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) return res.status(400).json({ error: 'credential is required' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured on the server' });

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub) return res.status(401).json({ error: 'Invalid credential' });

    const user = {
      sub: payload.sub,
      email: payload.email ?? '',
      name: payload.name ?? '',
      picture: payload.picture ?? '',
    };

    const token = jwt.sign(user, getSessionSecret(), { expiresIn: '7d' });
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user });
  } catch (err) {
    console.error('[auth] Google verification failed:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me  – return current user (or default user if no session)
router.get('/me', (req: any, res) => {
  const defaultUser = {
    sub: 'local_user',
    email: 'user@lifepilot.local',
    name: 'LifePilot User',
    picture: '',
  };
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.json({ user: defaultUser });
  try {
    const decoded = jwt.verify(token, getSessionSecret()) as jwt.JwtPayload;
    const { sub, email, name, picture } = decoded;
    res.json({ user: { sub: sub || defaultUser.sub, email: email || defaultUser.email, name: name || defaultUser.name, picture: picture || '' } });
  } catch {
    res.json({ user: defaultUser });
  }
});

// POST /api/auth/demo  – quick guest sign-in for seamless local testing
router.post('/demo', (_req, res) => {
  const user = {
    sub: 'guest-user-pilot',
    email: 'guest@lifepilot.local',
    name: 'Guest Pilot',
    picture: '',
  };
  const token = jwt.sign(user, getSessionSecret(), { expiresIn: '7d' });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user });
});

// POST /api/auth/logout  – clear session cookie
router.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

export default router;
