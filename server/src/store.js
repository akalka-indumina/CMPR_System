// store.js - all the code that reads from and writes to MongoDB.
//
// The React app keeps its data as one object with 10 collections, each stored
// here as its own MongoDB collection.
// Here every part becomes its own MongoDB "collection" (like a table) and every
// item inside it becomes one "document" (like a row). The order of the items is
// kept in a hidden field called _order, so the lists come back in the same order.
import { isDeepStrictEqual } from 'node:util';
import { getDb } from './db.js';

// collection name -> the field that makes each item unique
const LISTS = {
  complaints: 'id',
  users: 'id',
  administrators: 'id',
  citizens: 'id',
  accounts: 'id',
  stations: 'code',
  officers: 'id',
  notifications: 'id',
  audit: 'id',
  registrationApplications: 'id',
};
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const col = name => getDb().collection(name);
// remove the hidden helper fields before sending data back to React
const clean = ({ _id, _order, ...record }) => record;

// ---------- checking what React sends us ----------
export function validateData(data) {
  if (!isObject(data)) return 'Data must be an object.';
  for (const [name, keyField] of Object.entries(LISTS)) {
    const list = data[name];
    if (!Array.isArray(list)) return `"${name}" must be a list.`;
    const keys = list.map(item => (isObject(item) ? item[keyField] : undefined));
    if (keys.some(key => typeof key !== 'string' || key === '')) {
      return `Every item in "${name}" needs a text "${keyField}".`;
    }
    if (new Set(keys).size !== keys.length) return `"${name}" has a duplicate "${keyField}".`;
  }
  const users = data.users;
  const roles = new Set(['admin', 'station', 'officer', 'citizen']);
  if (users.some(user => !isObject(user)
    || typeof user.email !== 'string' || !user.email.trim()
    || !roles.has(user.role)
    || typeof user.profileId !== 'string' || !user.profileId
    || typeof user.active !== 'boolean'
    || Object.hasOwn(user, 'password')
    || ((user.passwordSalt === undefined) !== (user.passwordHash === undefined))
    || (user.active && user.passwordHash === undefined)
    || (user.passwordSalt !== undefined
      && (typeof user.passwordSalt !== 'string' || !user.passwordSalt
        || typeof user.passwordHash !== 'string' || !user.passwordHash)))) {
    return 'Every user needs an email, role, profile reference, active flag, and hashed credentials if set.';
  }
  const emails = users.map(user => user.email.trim().toLowerCase());
  if (new Set(emails).size !== emails.length) return '"users" has a duplicate email.';
  const profileCollections = {
    admin: 'administrators',
    station: 'accounts',
    officer: 'officers',
    citizen: 'citizens',
  };
  for (const user of users) {
    if (!data[profileCollections[user.role]].some(profile => profile.id === user.profileId)) {
      return `User "${user.id}" has no matching ${profileCollections[user.role]} profile.`;
    }
  }
  return null;
}

// ---------- READ ----------
const isSeeded = async () => Boolean(await col('meta').findOne({ _id: 'seeded' }));

// Returns the whole app data, or null if the database is still empty.
export async function readAll() {
  if (!(await isSeeded())) return null;
  const data = {};
  for (const name of Object.keys(LISTS)) {
    const docs = await col(name).find().sort({ _order: 1 }).toArray();
    data[name] = docs.map(clean);
  }
  return data;
}

// ---------- WRITE ----------
// Make a MongoDB collection match `docs` exactly: add/replace what is in the
// list and delete what is not.
async function syncCollection(name, docs) {
  const collection = col(name);
  if (docs.length) {
    await collection.bulkWrite(
      docs.map(doc => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } })),
      { ordered: false },
    );
  }
  await collection.deleteMany({ _id: { $nin: docs.map(doc => doc._id) } });
}

async function writeAll(data) {
  for (const [name, keyField] of Object.entries(LISTS)) {
    const docs = data[name].map((item, index) => ({ ...item, _id: item[keyField], _order: index }));
    await syncCollection(name, docs);
  }
  await col('meta').updateOne({ _id: 'seeded' }, { $set: { at: new Date() } }, { upsert: true });
}

// Only one write runs at a time, so two browsers can never mix their writes.
let queue = Promise.resolve();
const enqueue = task => {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
};

let lastSaved = null;

// Save everything React sends. Skips the work if nothing changed.
export const saveAll = data => enqueue(async () => {
  if (lastSaved && isDeepStrictEqual(lastSaved, data) && (await isSeeded())) return;
  await writeAll(data);
  lastSaved = data;
});

// First start only: initialize the empty database with application data from React.
export const initialize = data => enqueue(async () => {
  if (!(await isSeeded())) {
    await writeAll(data);
    lastSaved = data;
  }
  return readAll();
});

// ---------- ID document photos (registration) ----------
export const getDocuments = async applicationId => {
  const doc = await col('registrationDocuments').findOne({ _id: applicationId });
  return doc ? doc.documents : null;
};
export const saveDocuments = (applicationId, documents) => col('registrationDocuments').replaceOne(
  { _id: applicationId },
  { _id: applicationId, documents, savedAt: new Date() },
  { upsert: true },
);
export const deleteDocuments = applicationId => col('registrationDocuments').deleteOne({ _id: applicationId });
