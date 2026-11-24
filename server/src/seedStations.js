// seedStations.js - loads all Sri Lankan police stations into MongoDB.
//
//   npm run seed:stations            add missing stations, never touch existing ones
//   npm run seed:stations -- --reset delete ALL existing stations first, then add the list
//   npm run seed:stations -- --contacts  also overwrite address/phone/email of existing stations
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { MongoClient } from 'mongodb';

const RESET = process.argv.includes('--reset');
const CONTACTS = process.argv.includes('--contacts');
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'cmpr';

const stations = JSON.parse(
  await readFile(new URL('./data/policeStations.json', import.meta.url), 'utf8'),
);
if (!Array.isArray(stations) || stations.length === 0) {
  throw new Error('data/policeStations.json is empty or not a list.');
}
const codes = new Set(stations.map(s => s.code));
if (codes.size !== stations.length) throw new Error('Duplicate station codes in the JSON file.');

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 5000 });
try {
  const db = (await client.connect()).db(DB_NAME);
  const collection = db.collection('stations');

  if (RESET) {
    const { deletedCount } = await collection.deleteMany({});
    console.log(`Removed ${deletedCount} existing station(s).`);
  }

  const result = await collection.bulkWrite(
    stations.map((station, index) => {
      const { addr, tel, email, ...rest } = station;
      return {
        updateOne: {
          filter: { _id: station.code },
          update: CONTACTS
            ? { $setOnInsert: { ...rest, _order: index }, $set: { addr, tel, email } }
            : { $setOnInsert: { ...rest, addr, tel, email, _order: index } },
          upsert: true,
        },
      };
    }),
    { ordered: false },
  );

  const total = await collection.countDocuments();
  const districts = (await collection.distinct('district')).length;
  console.log(`Added ${result.upsertedCount} new station(s); ${stations.length - result.upsertedCount} already existed.`);
  console.log(`Database "${DB_NAME}" now has ${total} stations in ${districts} districts.`);
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
