import 'dotenv/config';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';
import { validateData } from './store.js';

const APPLY = process.argv.includes('--apply');
const DATABASE = process.env.MONGODB_DB || 'cmpr';
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DATA_COLLECTIONS = [
  'complaints',
  'users',
  'administrators',
  'citizens',
  'accounts',
  'stations',
  'officers',
  'notifications',
  'audit',
  'registrationApplications',
];
const PROFILE_COLLECTIONS = {
  admin: 'administrators',
  station: 'accounts',
  officer: 'officers',
  citizen: 'citizens',
};
const SEEDED_PROFILE_IDS = new Set([
  'SA-001', 'SA-N01', 'SA-C01', 'SA-K01', 'SA-G01',
  'O-1001', 'O-1002', 'O-1003', 'O-1004', 'O-2001', 'O-3001',
  '199012345678',
]);
const SEEDED_COMPLAINT_IDS = new Set(
  Array.from({ length: 12 }, (_, index) => `CMP-2026-${String(index + 101).padStart(4, '0')}`),
);
const SEEDED_NOTIFICATION_IDS = new Set(['NTF-001', 'NTF-002', 'NTF-003', 'NTF-004', 'NTF-005', 'NTF-006']);
const SEEDED_AUDIT_IDS = new Set(['ACT-9001', 'ACT-9002', 'ACT-9003', 'ACT-9004', 'ACT-9005', 'ACT-9006', 'ACT-9007', 'ACT-9008']);
const LEGACY_SLOT_ROLES = new Set(['admin', 'station', 'officer', 'citizen', 'citizens']);
const HASH_ITERATIONS = 120000;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const cleanFields = (record, removed) => Object.fromEntries(
  Object.entries(record).filter(([key]) => !removed.has(key)),
);
const hashLegacyPassword = password => {
  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = pbkdf2Sync(password, Buffer.from(passwordSalt, 'hex'), HASH_ITERATIONS, 32, 'sha256').toString('hex');
  return { passwordSalt, passwordHash };
};
const getCredentials = record => {
  if (typeof record.passwordSalt === 'string' && record.passwordSalt
    && typeof record.passwordHash === 'string' && record.passwordHash) {
    return { passwordSalt: record.passwordSalt, passwordHash: record.passwordHash };
  }
  if (typeof record.password === 'string' && record.password) return hashLegacyPassword(record.password);
  return null;
};
const getProfileId = user => user.profileId || user.id;
const uniqueById = (records, field = 'id') => {
  const byId = new Map();
  for (const record of records) {
    const id = record[field];
    if (typeof id !== 'string' || !id) throw new Error(`Found a record without a valid "${field}".`);
    byId.set(id, { ...(byId.get(id) || {}), ...record });
  }
  return [...byId.values()];

};

function migrate(source) {
  const output = Object.fromEntries(DATA_COLLECTIONS.map(name => [name, []]));
  const profileMaps = Object.fromEntries(Object.values(PROFILE_COLLECTIONS).map(name => [name, new Map()]));
  const authUsers = new Map();
  const removed = { users: 0, accounts: 0, officers: 0, complaints: 0, notifications: 0, audit: 0 };
  let detachedComplaintReferences = 0;
  let hashedLegacyPasswords = 0;

  const saveProfile = (role, record) => {
    const collection = PROFILE_COLLECTIONS[role];
    if (!collection || !isObject(record) || typeof record.id !== 'string' || !record.id) return null;
    if (SEEDED_PROFILE_IDS.has(record.id)) return null;
    const removedFields = new Set([
      '_id', '_order', 'slot', 'role', 'email', 'password', 'passwordSalt', 'passwordHash',
    ]);
    if (role === 'station') removedFields.add('rank');
    const profile = cleanFields(record, removedFields);
    profileMaps[collection].set(profile.id, { ...(profileMaps[collection].get(profile.id) || {}), ...profile });
    return profileMaps[collection].get(profile.id);
  };

  const saveAuthUser = (role, profile, sourceUser = {}) => {
    if (!profile || !PROFILE_COLLECTIONS[role]) return;
    const email = String(sourceUser.email || profile.email || '').trim().toLowerCase();
    if (!email) return;
    const key = `${role}:${profile.id}`;
    const previous = authUsers.get(key);
    const credentials = getCredentials(sourceUser) || previous?.credentials;
    if (sourceUser.password && !sourceUser.passwordHash) hashedLegacyPasswords += 1;
    const active = Boolean(sourceUser.active ?? previous?.requestedActive ?? profile.active ?? role === 'citizen')
      && Boolean(credentials);
    authUsers.set(key, {
      id: previous?.id || sourceUser.id || profile.id,
      email,
      ...(credentials || {}),
      role,
      profileId: profile.id,
      active,
      requestedActive: active,
      credentials,
    });
  };

  for (const role of ['admin', 'citizen', 'station', 'officer']) {
    const collection = PROFILE_COLLECTIONS[role];
    for (const record of source[collection] || []) {
      const profile = saveProfile(role, record);
      if (profile) saveAuthUser(role, profile, record);
      else if (SEEDED_PROFILE_IDS.has(record.id)) removed[collection === 'administrators' ? 'users' : collection] += 1;
    }
  }

  for (const user of source.users || []) {
    if (isObject(user) && user.profileId && user.role && !user.slot) {
      const role = user.role;
      const profileId = getProfileId(user);
      if (SEEDED_PROFILE_IDS.has(profileId)) {
        removed.users += 1;
        continue;
      }
      const profile = profileMaps[PROFILE_COLLECTIONS[role]]?.get(profileId);
      if (!profile) throw new Error(`A user profile is missing for role "${role}".`);
      saveAuthUser(role, profile, user);
      continue;
    }

    if (!isObject(user) || !LEGACY_SLOT_ROLES.has(user.slot)) {
      removed.users += 1;
      continue;
    }
    const role = user.slot === 'citizens' ? 'citizen' : user.slot;
    if (SEEDED_PROFILE_IDS.has(user.id)) {
      removed.users += 1;
      continue;
    }
    const profile = saveProfile(role, user);
    if (profile) saveAuthUser(role, profile, user);
    else removed.users += 1;
  }

  for (const role of ['station', 'officer', 'citizen', 'admin']) {
    const collection = PROFILE_COLLECTIONS[role];
    for (const profile of profileMaps[collection].values()) {
      const sourceProfile = (source[collection] || []).find(item => item.id === profile.id) || {};
      const sourceUser = (source.users || []).find(item => (
        isObject(item) && (item.profileId === profile.id || item.id === profile.id)
        && (item.role === role || item.slot === role || item.slot === 'citizens')
      )) || sourceProfile;
      saveAuthUser(role, profile, sourceUser);
    }
  }

  output.users = [...authUsers.values()].map(({ requestedActive, credentials, ...user }) => user);
  for (const [collection, records] of Object.entries(profileMaps)) {
    output[collection] = [...records.values()];
  }
  output.accounts = output.accounts.filter(account => {
    if (SEEDED_PROFILE_IDS.has(account.id)) {
      removed.accounts += 1;
      return false;
    }
    return true;
  });
  output.officers = output.officers.filter(officer => {
    if (SEEDED_PROFILE_IDS.has(officer.id)) {
      removed.officers += 1;
      return false;
    }
    return true;
  });

  output.complaints = (source.complaints || [])
    .filter(complaint => {
      if (SEEDED_COMPLAINT_IDS.has(complaint.id)) {
        removed.complaints += 1;
        return false;
      }
      return true;
    })
    .map(complaint => {
      if (SEEDED_PROFILE_IDS.has(complaint.citizenId)) {
        detachedComplaintReferences += 1;
        return { ...complaint, citizenId: '' };
      }
      return complaint;
    });
  output.notifications = (source.notifications || []).filter(notification => {
    if (SEEDED_NOTIFICATION_IDS.has(notification.id)) {
      removed.notifications += 1;
      return false;
    }
    return true;
  });
  output.audit = (source.audit || []).filter(entry => {
    if (SEEDED_AUDIT_IDS.has(entry.id)) {
      removed.audit += 1;
      return false;
    }
    return true;
  });
  for (const name of ['stations', 'registrationApplications']) {
    output[name] = source[name] || [];
  }

  for (const name of DATA_COLLECTIONS) {
    output[name] = uniqueById(output[name], name === 'stations' ? 'code' : 'id').map((record, index) => ({
      ...record,
      _id: record.id || record.code,
      _order: index,
    }));
  }

  const cleanOutput = Object.fromEntries(DATA_COLLECTIONS.map(name => [
    name,
    output[name].map(({ _id, _order, ...record }) => record),
  ]));
  const validationError = validateData(cleanOutput);
  if (validationError) throw new Error(`Migrated data failed validation: ${validationError}`);

  return {
    output,
    summary: {
      removed,
      detachedComplaintReferences,
      hashedLegacyPasswords,
      authenticationUsers: {
        byRole: Object.fromEntries([...new Set(output.users.map(user => user.role))]
          .map(role => [role, output.users.filter(user => user.role === role).length])),
        enabled: output.users.filter(user => user.active).length,
        requiringPassword: output.users.filter(user => !user.passwordHash).length,
      },
      collections: Object.fromEntries(DATA_COLLECTIONS.map(name => [name, output[name].length])),
    },
  };
}

async function backupDatabase(db) {
  const backupName = `backup-before-migration-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const backupDir = resolve('..', 'exported collections', backupName);
  await mkdir(backupDir, { recursive: false });
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const counts = {};
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    const path = resolve(backupDir, `${name}.ejson`);
    await writeFile(path, EJSON.stringify(docs, { relaxed: false, indent: 2 }), { flag: 'wx' });
    const verified = EJSON.parse(await readFile(path, 'utf8'));
    if (verified.length !== docs.length) throw new Error(`Backup verification failed for "${name}".`);
    counts[name] = docs.length;
  }
  return { backupDir, counts };
}

async function writeCollections(db, collections) {
  for (const [name, records] of Object.entries(collections)) {
    const collection = db.collection(name);
    if (records.length) {
      await collection.bulkWrite(
        records.map(record => ({
          replaceOne: { filter: { _id: record._id }, replacement: record, upsert: true },
        })),
        { ordered: false },
      );
    }
    await collection.deleteMany({ _id: { $nin: records.map(record => record._id) } });
  }
}

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const db = client.db(DATABASE);
  const collectionNames = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map(collection => collection.name),
  );
  const source = Object.fromEntries(await Promise.all(DATA_COLLECTIONS.map(async name => [
    name,
    collectionNames.has(name) ? await db.collection(name).find({}).toArray() : [],
  ])));
  const { output, summary } = migrate(source);

  if (!APPLY) {
    console.log(JSON.stringify({ mode: 'dry-run', database: DATABASE, ...summary }, null, 2));
    console.log('No database records were changed. Re-run with --apply to back up and apply this migration.');
  } else {
    const backup = await backupDatabase(db);
    await writeCollections(db, output);
    console.log(JSON.stringify({
      mode: 'applied',
      database: DATABASE,
      backup,
      ...summary,
    }, null, 2));
  }
} finally {
  await client.close();
}
