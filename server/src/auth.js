// auth.js - server-side login, sessions and the "who is calling?" check.
import { createHash, pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Router } from 'express';
import { getDb } from './db.js';
import { PORTAL_ROLES, PROFILE_COLLECTIONS } from './roles.js';

const pbkdf2Async = promisify(pbkdf2);
const HASH_ITERATIONS = 120000; // must match createAdmin.js and the browser's credentials.js
const SESSION_HOURS = 12;
const col = name => getDb().collection(name);
const sha256 = value => createHash('sha256').update(value).digest('hex');

export async function verifyPassword(password, user) {
  if (!user?.passwordSalt || !user?.passwordHash) return false;
  const hash = await pbkdf2Async(password, Buffer.from(user.passwordSalt, 'hex'), HASH_ITERATIONS, 32, 'sha256');
  const expected = Buffer.from(user.passwordHash, 'hex');
  return expected.length === hash.length && timingSafeEqual(hash, expected);
}

// Reads "Authorization: Bearer <token>" and returns { user, profile, role } or null.
export async function authenticate(req) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  if (!match) return null;
  const session = await col('sessions').findOne({ _id: sha256(match[1]) });
  if (!session || session.expiresAt < new Date()) return null;
  const user = await col('users').findOne({ _id: session.userId });
  if (!user || !user.active || user.role !== session.role) return null;
  const profile = await col(PROFILE_COLLECTIONS[user.role]).findOne({ _id: user.profileId });
  if (!profile) return null;
  if (user.role === 'citizen' && profile.status !== 'Approved') return null;
  if ((user.role === 'station' || user.role === 'officer') && profile.active === false) return null;
  return { user, profile, role: user.role, sessionId: session._id };
}

// Express middleware: requireAuth() = any signed-in user, requireAuth(['admin']) = only admins.
export const requireAuth = roles => async (req, res, next) => {
  try {
    const auth = await authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Please sign in again.' });
    if (roles && !roles.includes(auth.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this.' });
    }
    req.auth = auth;
    next();
  } catch (error) {
    next(error);
  }
};

// ---------- simple brute-force protection (per IP + sign-in name) ----------
const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const recent = key => (failures.get(key) || []).filter(time => Date.now() - time < WINDOW_MS);
const isBlocked = key => recent(key).length >= MAX_FAILURES;
const recordFailure = key => failures.set(key, [...recent(key), Date.now()]);

export const authRouter = Router();
const wrap = handler => (req, res, next) => handler(req, res, next).catch(next);

authRouter.post('/login', wrap(async (req, res) => {
  const { identifier, password, portal } = req.body || {};
  if (typeof identifier !== 'string' || typeof password !== 'string' || !PORTAL_ROLES[portal]) {
    return res.status(400).json({ error: 'Enter your sign-in name and password.' });
  }
  const name = identifier.trim().toLowerCase();
  const key = `${req.ip}|${name}`;
  if (isBlocked(key)) return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });

  const users = await col('users').find({ role: { $in: PORTAL_ROLES[portal] }, active: true }).toArray();
  let matched = null;
  for (const user of users) {
    // Station accounts sign in with their Account ID; everyone else with email or ID.
    const names = (user.role === 'station' ? [user.profileId] : [user.email, user.id])
      .filter(Boolean).map(value => String(value).trim().toLowerCase());
    if (names.includes(name) && await verifyPassword(password, user)) { matched = user; break; }
  }
  const profile = matched && await col(PROFILE_COLLECTIONS[matched.role]).findOne({ _id: matched.profileId });
  const allowed = profile
    && !(matched.role === 'citizen' && profile.status !== 'Approved')
    && !((matched.role === 'station' || matched.role === 'officer') && profile.active === false);
  if (!allowed) {
    recordFailure(key);
    return res.status(401).json({ error: 'Incorrect credentials. Check your sign-in name and password.' });
  }

  failures.delete(key);
  const token = randomBytes(32).toString('base64url');
  await col('sessions').insertOne({ // only the HASH of the token is stored
    _id: sha256(token),
    userId: matched.id,
    role: matched.role,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_HOURS * 3600 * 1000),
  });
  res.json({ token, user: { role: matched.role, id: matched.id } });
}));

authRouter.post('/logout', requireAuth(), wrap(async (req, res) => {
  await col('sessions').deleteOne({ _id: req.auth.sessionId });
  res.json({ ok: true });
}));
