/**
 * Auth utilities: Google token verification and JWT generation.
 */

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from './mysql.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_DAYS = 90;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  pictureUrl: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
}

/**
 * Verify a Google ID token and extract user info.
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google token');

  return {
    googleId: payload.sub,
    email: payload.email || '',
    name: payload.name || '',
    pictureUrl: payload.picture || '',
  };
}

/**
 * Find or create a user from Google info.
 */
export async function findOrCreateUser(info: GoogleUserInfo): Promise<{ id: number; email: string; name: string; pictureUrl: string }> {
  const [rows] = await pool.execute(
    'SELECT id, email, name, picture_url FROM users WHERE google_id = ?',
    [info.googleId]
  );

  const existing = (rows as any[])[0];
  if (existing) {
    // Update profile info if changed
    if (existing.email !== info.email || existing.name !== info.name || existing.picture_url !== info.pictureUrl) {
      await pool.execute(
        'UPDATE users SET email = ?, name = ?, picture_url = ? WHERE id = ?',
        [info.email, info.name, info.pictureUrl, existing.id]
      );
    }
    return { id: existing.id, email: info.email, name: info.name, pictureUrl: info.pictureUrl };
  }

  const [result] = await pool.execute(
    'INSERT INTO users (google_id, email, name, picture_url) VALUES (?, ?, ?, ?)',
    [info.googleId, info.email, info.name, info.pictureUrl]
  );

  return {
    id: (result as any).insertId,
    email: info.email,
    name: info.name,
    pictureUrl: info.pictureUrl,
  };
}

/**
 * Generate a JWT access token.
 */
export function generateAccessToken(userId: number, email: string): string {
  return jwt.sign({ userId, email } as JwtPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify a JWT access token.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Generate a refresh token and store its hash in the database.
 */
export async function generateRefreshToken(userId: number, deviceName?: string): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, token_hash, device_name, expires_at) VALUES (?, ?, ?, ?)',
    [userId, tokenHash, deviceName || null, expiresAt]
  );

  return token;
}

/**
 * Validate a refresh token and return the user ID.
 */
export async function validateRefreshToken(token: string): Promise<{ userId: number; tokenId: number } | null> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const [rows] = await pool.execute(
    'SELECT id, user_id FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
    [tokenHash]
  );

  const row = (rows as any[])[0];
  if (!row) return null;

  return { userId: row.user_id, tokenId: row.id };
}

/**
 * Revoke a refresh token.
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await pool.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
}

/**
 * Revoke all refresh tokens for a user.
 */
export async function revokeAllRefreshTokens(userId: number): Promise<void> {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
}
