// complaintRules.js - ALL the "who may see / do what" rules for complaints.
// Pure functions (no database, no Express) so they are easy to read and to test.

export const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota',
  'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle',
];
export const CATEGORIES = ['Theft', 'Fraud', 'Harassment', 'Assault', 'Property Damage', 'Cybercrime', 'Missing Person', 'Other'];
export const PROGRESS = ['In progress', 'Evidence collected', 'Witness interviewed', 'Suspect identified'];

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 10;

const STATION_REVIEW = ['Submitted', 'Received', 'Under Review', 'Additional Info Requested'];
const OFFICER_ACTIVE = ['Assigned', 'Under Investigation'];
const FINISHED = ['Resolved / Closed', 'Rejected'];

// Today's date in Sri Lanka time, as YYYY-MM-DD.
export const todayISO = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(now);

// ---------- WHO CAN SEE A COMPLAINT ----------
//  admin   -> every complaint
//  citizen -> only their own
//  station -> only complaints sent to their own police station
//  officer -> only complaints assigned to them (nothing before assignment)
export function canView(auth, complaint) {
  if (!auth || !complaint) return false;
  switch (auth.role) {
    case 'admin': return true;
    case 'citizen': return complaint.citizenId === auth.profile.id;
    case 'station': return Boolean(auth.profile.stationCode) && complaint.stationCode === auth.profile.stationCode;
    case 'officer': return Boolean(complaint.off) && complaint.off === auth.profile.id;
    default: return false;
  }
}

// The database filter that matches exactly what canView allows.
export function listFilter(auth) {
  switch (auth.role) {
    case 'admin': return {};
    case 'citizen': return { citizenId: auth.profile.id };
    case 'station': return { stationCode: auth.profile.stationCode || '__none__' };
    case 'officer': return { off: auth.profile.id };
    default: return { _id: '__none__' };
  }
}

// ---------- WHO CAN ADD EVIDENCE ----------
export function canAddEvidence(auth, complaint) {
  if (!canView(auth, complaint)) return false;
  if (auth.role === 'citizen' || auth.role === 'station') return !FINISHED.includes(complaint.status);
  if (auth.role === 'officer') return OFFICER_ACTIVE.includes(complaint.status);
  return false; // admin is read-only
}

// ---------- WHAT THE COMPLAINANT'S PERSONAL DETAILS LOOK LIKE FOR EACH ROLE ----------
export function buildCitizenDetails(profile, user) {
  if (!profile) return null;
  return {
    name: profile.name || '',
    tel: profile.tel || '',
    addr: profile.addr || '',
    district: profile.district || '',
    idType: profile.identityDocumentType || (profile.nic ? 'NIC' : ''),
    idNumber: profile.identityNumber || profile.nic || '',
    email: user?.email || '',
  };
}

export function citizenInfoFor(role, details) {
  if (!details) return null;
  if (role === 'admin' || role === 'station') return { ...details };       // full details
  if (role === 'officer') return { name: details.name, tel: details.tel };  // name + contact number ONLY
  return null;                                                              // citizens already know their own data
}

const normalizeEvidence = item => (typeof item === 'string'
  ? { id: '', name: item, type: '', size: 0 }
  : item);

// Turns a database record into what is safe to send to this user.
export function presentComplaint(complaint, auth, details) {
  const { _id, _order, ...rest } = complaint;
  const out = { ...rest, ev: (rest.ev || []).map(normalizeEvidence), hist: rest.hist || [] };
  if (auth.role === 'officer') delete out.citizenId; // officers must not get the citizen's internal ID
  const info = citizenInfoFor(auth.role, details);
  if (info) out.citizenInfo = info;
  return out;
}

// ---------- NEW COMPLAINT VALIDATION ----------
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function validateNewComplaint(body, now = new Date()) {
  const b = body && typeof body === 'object' ? body : {};
  const value = {
    title: text(b.title, 150),
    cat: text(b.cat, 50),
    incidentDistrict: text(b.incidentDistrict, 40),
    stationCode: text(b.stationCode, 100),
    incidentDate: text(b.incidentDate, 10),
    incidentTime: text(b.incidentTime, 5),
    loc: text(b.loc, 250),
    desc: text(b.desc, 5000),
    suspect: text(b.suspect, 500),
    witness: text(b.witness, 500),
  };
  if (!value.title) return { error: 'Complaint title is required.' };
  if (!CATEGORIES.includes(value.cat)) return { error: 'Select a valid category.' };
  if (!DISTRICTS.includes(value.incidentDistrict)) return { error: 'Select a valid incident district.' };
  if (!value.stationCode) return { error: 'Select a police station.' };
  const parsed = new Date(`${value.incidentDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.incidentDate) || Number.isNaN(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== value.incidentDate) {
    return { error: 'Enter a valid incident date.' };
  }
  if (value.incidentDate > todayISO(now)) return { error: 'The incident date cannot be in the future.' };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.incidentTime)) return { error: 'Enter a valid incident time.' };
  if (!value.loc) return { error: 'Incident location is required.' };
  if (value.desc.length < 20) return { error: 'The description needs at least 20 characters.' };
  return { value };
}

// ---------- WORKFLOW: what each role may do to a complaint ----------
const deny = (status, message) => ({ error: { status, message } });

export function planAction(auth, complaint, body, officer) {
  const action = body?.action;
  const note = text(body?.note, 1000);

  if (auth.role === 'station') {
    if (!canView(auth, complaint)) return deny(404, 'Complaint not found.');
    switch (action) {
      case 'accept':
        if (!STATION_REVIEW.includes(complaint.status)) return deny(409, 'This complaint cannot be accepted in its current status.');
        return { status: 'Accepted', note: note || 'Complaint validated and accepted' };
      case 'request_info':
        if (!STATION_REVIEW.includes(complaint.status)) return deny(409, 'Information cannot be requested in the current status.');
        if (!note) return deny(400, 'Enter a note before requesting information.');
        return { status: 'Additional Info Requested', note };
      case 'reject':
        if (!STATION_REVIEW.includes(complaint.status)) return deny(409, 'This complaint cannot be rejected in its current status.');
        if (!note) return deny(400, 'A rejection reason is required.');
        return { status: 'Rejected', note: `Rejected: ${note}` };
      case 'assign':
        if (complaint.status !== 'Accepted') return deny(409, 'Only accepted complaints can be assigned.');
        if (!officer || officer.active === false || officer.stationCode !== complaint.stationCode) {
          return deny(400, 'Choose an active officer from this station.');
        }
        return { status: 'Assigned', note: `Assigned to ${officer.name}`, set: { off: officer.id } };
      case 'close':
        if (complaint.status !== 'Investigation Completed') return deny(409, 'Only completed investigations can be closed.');
        return { status: 'Resolved / Closed', note: 'Reviewed and closed by station' };
      case 'return':
        if (complaint.status !== 'Investigation Completed') return deny(409, 'Only completed investigations can be returned.');
        return { status: 'Under Investigation', note: 'Returned to officer for more work' };
      default:
        return deny(400, 'Unknown action.');
    }
  }

  if (auth.role === 'officer') {
    if (!canView(auth, complaint)) return deny(404, 'Complaint not found.');
    if (!OFFICER_ACTIVE.includes(complaint.status)) return deny(409, 'This complaint is not open for investigation updates.');
    if (!note) return deny(400, 'Update description is required.');
    if (action === 'update') {
      const progress = PROGRESS.includes(body?.progress) ? body.progress : 'In progress';
      return { status: 'Under Investigation', note: `${progress}: ${note}` };
    }
    if (action === 'complete') return { status: 'Investigation Completed', note: `Investigation completed: ${note}` };
    return deny(400, 'Unknown action.');
  }

  return deny(403, 'You do not have permission to do this.');
}

// ---------- EVIDENCE FILES ----------
// Look at the first bytes of the file (not the name or the browser's claim).
export function detectEvidenceType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buffer.subarray(4, 8).toString('latin1') === 'ftyp') return 'video/mp4';
  return null;
}

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf', 'video/mp4': 'mp4' };

export function cleanFileName(raw, type) {
  let name = '';
  try { name = decodeURIComponent(String(raw || '')); } catch { name = String(raw || ''); }
  name = name.replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g, '').trim().slice(0, 120);
  return name || `evidence.${EXTENSIONS[type] || 'bin'}`;
}
