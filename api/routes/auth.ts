/**
 * Auth routes: Google login, token refresh, logout, user info.
 */

import { Router } from 'express';
import {
  verifyGoogleToken,
  findOrCreateUser,
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
} from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';
import pool from '../lib/mysql.js';

export const authRouter = Router();

/**
 * POST /api/auth/google
 * Exchange a Google ID token for JWT access + refresh tokens.
 */
authRouter.post('/google', async (req, res) => {
  try {
    const { idToken, deviceName } = req.body;
    if (!idToken) {
      res.status(400).json({ error: 'Missing idToken' });
      return;
    }

    const googleInfo = await verifyGoogleToken(idToken);
    const user = await findOrCreateUser(googleInfo);
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id, deviceName);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        pictureUrl: user.pictureUrl,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Exchange a refresh token for a new access token.
 */
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Missing refreshToken' });
      return;
    }

    const result = await validateRefreshToken(refreshToken);
    if (!result) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Get user email for token
    const [rows] = await pool.execute('SELECT email FROM users WHERE id = ?', [result.userId]);
    const user = (rows as any[])[0];
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const accessToken = generateAccessToken(result.userId, user.email);
    res.json({ accessToken });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Revoke the refresh token.
 */
authRouter.post('/logout', requireAuth, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info.
 */
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, name, picture_url FROM users WHERE id = ?',
      [req.user!.userId]
    );

    const user = (rows as any[])[0];
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      pictureUrl: user.picture_url,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});
