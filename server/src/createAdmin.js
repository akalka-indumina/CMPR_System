import 'dotenv/config';
import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';

const HASH_ITERATIONS = 120000;
const stdin = process.stdin;
const stdout = process.stdout;

const prompt = (label, hidden = false) => new Promise((resolve, reject) => {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    reject(new Error('Run this command in an interactive terminal.'));
    return;
  }
  stdout.write(label);
  stdin.setEncoding('utf8');
  stdin.setRawMode(true);
  stdin.resume();
  let value = '';
  const finish = result => {
    stdin.setRawMode(false);
    stdin.pause();
    stdin.removeListener('data', onData);
    stdout.write('\n');
    resolve(result);
  };
  const onData = input => {
    for (const character of input) {
      if (character === '\u0003') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        reject(new Error('Administrator setup cancelled.'));
        return;
      }
      if (character === '\r' || character === '\n') {
        finish(value.trim());
        return;
      }
      if (character === '\u007f' || character === '\b') {
        value = value.slice(0, -1);
        if (!hidden) stdout.write('\b \b');
      } else {
        value += character;
        if (!hidden) stdout.write(character);
      }
    }
  };
  stdin.on('data', onData);
});

const salt = randomBytes(16);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const client = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  { serverSelectionTimeoutMS: 5000 },
);

try {
  const name = await prompt('Administrator name: ');
  const email = (await prompt('Administrator email: ')).toLowerCase();
  const tel = await prompt('Phone number: ');
  const addr = await prompt('Address: ');
  const password = await prompt('Password (minimum 8 characters, hidden): ', true);
  const confirmPassword = await prompt('Confirm password (hidden): ', true);

  if (!name || !tel || !addr || !emailPattern.test(email)) {
    throw new Error('Provide a name, valid email, phone number, and address.');
  }
  if (password.length < 8 || password !== confirmPassword) {
    throw new Error('Password must be at least 8 characters and both entries must match.');
  }

  const db = (await client.connect()).db(process.env.MONGODB_DB || 'cmpr');
  const existing = await db.collection('users').findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
  if (existing) throw new Error('An account already uses this email address.');

  const id = `ADM-${randomUUID()}`;
  const passwordSalt = salt.toString('hex');
  const passwordHash = pbkdf2Sync(password, salt, HASH_ITERATIONS, 32, 'sha256').toString('hex');
  const profile = { _id: id, id, name, tel, addr, _order: 0 };
  const user = {
    _id: id,
    id,
    email,
    passwordSalt,
    passwordHash,
    role: 'admin',
    profileId: id,
    active: true,
    _order: 0,
  };
  await db.collection('administrators').insertOne(profile);
  try {
    await db.collection('users').insertOne(user);
  } catch (error) {
    await db.collection('administrators').deleteOne({ _id: id });
    throw error;
  }
  console.log('Administrator account created. You can now sign in to the staff portal.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Administrator setup failed.');
  process.exitCode = 1;
} finally {
  await client.close();
}
