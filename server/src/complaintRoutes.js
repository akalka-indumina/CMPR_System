// complaintRoutes.js - the complaint API. Every route checks WHO is calling (auth.js)
// and applies the rules from complaintRules.js, so the browser can never get data
// it is not allowed to see.
import express, { Router } from 'express';
import { Binary } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';
import { requireAuth } from './auth.js';
import * as rules from './complaintRules.js';

const col = name => getDb().collection(name);
const fail = (res, status, message) => res.status(status).json({ error: message });
const wrap = handler => (req, res, next) => handler(req, res, next).catch(next);
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

export const complaintRouter = Router();

// Attach the complainant's details (name, phone, address, ...) - the rules decide how much each role sees.
async function present(complaints, auth) {
  let details = new Map();
  const ids = [...new Set(complaints.map(c => c.citizenId).filter(Boolean))];
  if (auth.role !== 'citizen' && ids.length) {
    const [profiles, users] = await Promise.all([
      col('citizens').find({ _id: { $in: ids } }).toArray(),
      col('users').find({ _id: { $in: ids }, role: 'citizen' }).toArray(),
    ]);
    const byId = new Map(users.map(user => [user._id, user]));
    details = new Map(profiles.map(profile => [profile._id, rules.buildCitizenDetails(profile, byId.get(profile._id))]));
  }
  return complaints.map(c => rules.presentComplaint(c, auth, details.get(c.citizenId)));
}

// Loads :id and answers 404 (not 403) when the caller may not see it, so IDs cannot be probed.
const loadComplaint = wrap(async (req, res, next) => {
  if (!SAFE_ID.test(req.params.id)) return fail(res, 404, 'Complaint not found.');
  const complaint = await col('complaints').findOne({ _id: req.params.id });
  if (!complaint || !rules.canView(req.auth, complaint)) return fail(res, 404, 'Complaint not found.');
  req.complaint = complaint;
  next();
});

async function nextComplaintId() {
  const year = rules.todayISO().slice(0, 4);
  const counter = await col('counters').findOneAndUpdate(
    { _id: `complaint-${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' },
  );
  return `CMP-${year}-${String(counter.seq).padStart(4, '0')}`;
}

// ---------- LIST: only the complaints this user is allowed to see ----------
complaintRouter.get('/', requireAuth(), wrap(async (req, res) => {
  const complaints = await col('complaints').find(rules.listFilter(req.auth)).sort({ createdAt: -1, _id: -1 }).toArray();
  res.json({ complaints: await present(complaints, req.auth) });
}));

// ---------- CREATE (citizens only) ----------
complaintRouter.post('/', requireAuth(['citizen']), wrap(async (req, res) => {
  const { error, value } = rules.validateNewComplaint(req.body);
  if (error) return fail(res, 400, error);
  const station = await col('stations').findOne({ _id: value.stationCode });
  if (!station || station.active === false) return fail(res, 400, 'Select a valid, active police station.');
  if (station.district !== value.incidentDistrict) {
    return fail(res, 400, 'The selected police station is not in the selected district.');
  }

  const now = new Date();
  const date = rules.todayISO(now);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = await nextComplaintId();
    const complaint = {
      _id: id,
      id,
      title: value.title,
      cat: value.cat,
      cit: req.auth.profile.name,           // name at the time of submission
      citizenId: req.auth.profile.id,
      station: station.name,
      stationCode: station.code,            // <- this is what routes it to ONE station
      district: value.incidentDistrict,     // incident district
      incidentDate: value.incidentDate,
      incidentTime: value.incidentTime,
      loc: value.loc,
      desc: value.desc,
      suspect: value.suspect,
      witness: value.witness,
      date,
    
      status: 'Submitted',
      off: null,                            // nobody assigned yet -> no officer can see it
      ev: [],
      hist: [['Submitted', date, 'Complaint submitted online']],
      createdAt: now,
      updatedAt: now,
    };
    try {
      await col('complaints').insertOne(complaint);
      return res.status(201).json({ complaint: (await present([complaint], req.auth))[0] });
    } catch (insertError) {
      if (insertError.code !== 11000) throw insertError; // duplicate number -> try the next one
    }
  }
  fail(res, 500, 'Could not create a complaint number. Please try again.');
}));

// ---------- WORKFLOW ACTIONS (station accounts and officers) ----------
complaintRouter.post('/:id/actions', requireAuth(['station', 'officer']), loadComplaint, wrap(async (req, res) => {
  const body = req.body || {};
  const officer = body.action === 'assign' && SAFE_ID.test(String(body.officerId || ''))
    ? await col('officers').findOne({ _id: String(body.officerId) })
    : null;
  const plan = rules.planAction(req.auth, req.complaint, body, officer);
  if (plan.error) return fail(res, plan.error.status, plan.error.message);

  const updated = await col('complaints').findOneAndUpdate(
    { _id: req.complaint._id, status: req.complaint.status }, // fails if someone changed it meanwhile
    {
      $set: { status: plan.status, updatedAt: new Date(), ...(plan.set || {}) },
      $push: { hist: [plan.status, rules.todayISO(), plan.note] },
    },
    { returnDocument: 'after' },
  );
  if (!updated) return fail(res, 409, 'This complaint was just changed by someone else. It has been refreshed.');
  res.json({ complaint: (await present([updated], req.auth))[0] });
}));

// ---------- EVIDENCE: upload ----------
// The browser sends the raw file as the request body (no extra packages needed).
complaintRouter.post(
  '/:id/evidence',
  requireAuth(['citizen', 'station', 'officer']),
  loadComplaint,
  express.raw({ type: () => true, limit: rules.MAX_EVIDENCE_BYTES }),
  wrap(async (req, res) => {
    const complaint = req.complaint;
    if (!rules.canAddEvidence(req.auth, complaint)) return fail(res, 403, 'You cannot add evidence to this complaint now.');
    const buffer = req.body;
    if (!Buffer.isBuffer(buffer) || !buffer.length) return fail(res, 400, 'No file was received.');
    if ((complaint.ev || []).length >= rules.MAX_EVIDENCE_FILES) {
      return fail(res, 400, `A complaint can have at most ${rules.MAX_EVIDENCE_FILES} evidence files.`);
    }
    const type = rules.detectEvidenceType(buffer);
    if (!type) return fail(res, 415, 'Only JPG, PNG, PDF and MP4 files are accepted.');

    const id = `EV-${randomUUID()}`;
    const meta = {
      id,
      name: rules.cleanFileName(req.headers['x-file-name'], type),
      type,
      size: buffer.length,
      by: req.auth.profile.name,
      byRole: req.auth.role,
      at: new Date().toISOString(),
    };
    // the file itself lives in its own collection; the complaint keeps only the small description
    await col('complaintEvidence').insertOne({ _id: id, complaintId: complaint.id, ...meta, data: new Binary(buffer) });
    const updated = await col('complaints').findOneAndUpdate(
      { _id: complaint._id },
      { $push: { ev: meta }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
    res.status(201).json({ complaint: (await present([updated], req.auth))[0] });
  }),
);

// ---------- EVIDENCE: download / view (same visibility rule as the complaint) ----------
complaintRouter.get('/:id/evidence/:evidenceId', requireAuth(), loadComplaint, wrap(async (req, res) => {
  if (!SAFE_ID.test(req.params.evidenceId)) return fail(res, 404, 'Evidence file not found.');
  const doc = await col('complaintEvidence').findOne({ _id: req.params.evidenceId, complaintId: req.complaint.id });
  if (!doc) return fail(res, 404, 'Evidence file not found.');
  const buffer = Buffer.from(doc.data.buffer);
  res.set({
    'Content-Type': doc.type,
    'Content-Length': String(buffer.length),
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  });
  res.send(buffer);
}));
