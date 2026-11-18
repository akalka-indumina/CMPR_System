// index.js - starts the Express server and defines the URLs ("routes") React talks to.
import 'dotenv/config';
import express from 'express';
import { connectDb } from './db.js';
import {
  deleteDocuments, getDocuments, initialize, readAll, saveAll, saveDocuments, validateData,
} from './store.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'cmpr';

const app = express();
app.use(express.json({ limit: '25mb' })); // lets us read JSON sent by React (ID photos are big)

// Express 4 needs this small helper so errors inside async routes reach our error handler.
const route = handler => (req, res, next) => handler(req, res, next).catch(next);
const fail = (res, status, message) => res.status(status).json({ error: message });

// --- Check that the server is alive: open http://localhost:5000/api/health ---
app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- App data (complaints, users, stations, ...) ---
app.get('/api/data', route(async (req, res) => {
  const data = await readAll();
  if (!data) return fail(res, 404, 'Database is empty.'); // React then sends the initial application data
  res.json({ data });
}));

app.post('/api/data', route(async (req, res) => { // "first run" - initialize an empty database
  const problem = validateData(req.body?.data);
  if (problem) return fail(res, 400, problem);
  res.json({ data: await initialize(req.body.data) });
}));

app.put('/api/data', route(async (req, res) => { // save changes
  const problem = validateData(req.body?.data);
  if (problem) return fail(res, 400, problem);
  await saveAll(req.body.data);
  res.json({ data: req.body.data });
}));

// --- ID document photos sent with a citizen registration ---
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const IMAGE_PATTERN = /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+=*$/;
const MAX_IMAGE_LENGTH = 7 * 1024 * 1024;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validDocuments = documents => isObject(documents)
  && Object.values(documents).every(doc => isObject(doc)
    && typeof doc.name === 'string' && typeof doc.type === 'string'
    && typeof doc.dataUrl === 'string' && doc.dataUrl.length <= MAX_IMAGE_LENGTH
    && IMAGE_PATTERN.test(doc.dataUrl));

app.get('/api/documents/:id', route(async (req, res) => {
  if (!ID_PATTERN.test(req.params.id)) return fail(res, 400, 'Invalid application ID.');
  const documents = await getDocuments(req.params.id);
  if (!documents) return fail(res, 404, 'Registration documents are not available.');
  res.json({ documents });
}));

app.post('/api/documents/:id', route(async (req, res) => {
  if (!ID_PATTERN.test(req.params.id)) return fail(res, 400, 'Invalid application ID.');
  if (!validDocuments(req.body?.documents)) return fail(res, 400, 'Invalid registration document payload.');
  await saveDocuments(req.params.id, req.body.documents);
  res.json({ saved: true });
}));

app.delete('/api/documents/:id', route(async (req, res) => {
  if (!ID_PATTERN.test(req.params.id)) return fail(res, 400, 'Invalid application ID.');
  await deleteDocuments(req.params.id);
  res.json({ deleted: true });
}));

app.use('/api', (req, res) => fail(res, 404, 'Unknown API route.'));

// --- Any error ends up here ---
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('Request failed:', err.message);
  fail(res, err.status || 500, err.status === 413 ? 'Request is too large.' : 'Server error.');
});

try {
  await connectDb(MONGODB_URI, MONGODB_DB);
  console.log(`Connected to MongoDB (database "${MONGODB_DB}")`);
} catch (error) {
  console.error('\nCould not connect to MongoDB:', error.message);
  console.error('Is MongoDB running? Check MONGODB_URI in server/.env\n');
  process.exit(1);
}
app.listen(PORT, () => console.log(`CMPR API running at http://localhost:${PORT}`));
