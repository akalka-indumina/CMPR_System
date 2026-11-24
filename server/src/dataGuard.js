// dataGuard.js - protects the shared "/api/data" save (PUT) so that nobody can
// create admins, move officers between stations, etc. by sending a hand-made request.
import { isDeepStrictEqual } from 'node:util';
import { PROFILE_COLLECTIONS } from './roles.js';

// Only a Super Administrator may change these lists freely.
const PROTECTED = { users: 'id', administrators: 'id', citizens: 'id', accounts: 'id', officers: 'id', stations: 'code' };

// A signed-in user may edit just these fields of their OWN records (Profile page).
const OWN_PROFILE_FIELDS = new Set(['name', 'tel', 'addr', 'photo']);
const OWN_USER_FIELDS = new Set(['email']);

const changedKeys = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(key => !isDeepStrictEqual(a[key], b[key]));

export function checkDataWrite(auth, current, incoming) {
  if (auth?.role === 'admin') return null;
  for (const [name, keyField] of Object.entries(PROTECTED)) {
    const before = current[name] || [];
    const after = incoming[name] || [];
    if (isDeepStrictEqual(before, after)) continue;
    if (!auth) return `Sign in to change "${name}".`;
    if (before.length !== after.length) return `You are not allowed to add or remove "${name}".`;

    const beforeById = new Map(before.map(item => [item[keyField], item]));
    for (const item of after) {
      const old = beforeById.get(item[keyField]);
      if (!old) return `You are not allowed to add or remove "${name}".`;
      const keys = changedKeys(old, item);
      if (!keys.length) continue;
      const ownUser = name === 'users' && item.id === auth.user.id;
      const ownProfile = name === PROFILE_COLLECTIONS[auth.role] && item.id === auth.profile.id;
      const allowed = ownUser ? OWN_USER_FIELDS : ownProfile ? OWN_PROFILE_FIELDS : null;
      if (!allowed || keys.some(key => !allowed.has(key))) {
        return `You are not allowed to change this record in "${name}".`;
      }
    }
  }
  return null;
}
