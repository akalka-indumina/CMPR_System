// db.js - opens ONE connection to MongoDB and lets the other files reuse it.
import { MongoClient } from 'mongodb';

let client = null;
let db = null;

export async function connectDb(uri, dbName) {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  db = client.db(dbName); // MongoDB creates the database the first time we save something
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database is not connected yet.');
  return db;
}

export async function closeDb() {
  if (client) await client.close();
  client = null;
  db = null;
}
