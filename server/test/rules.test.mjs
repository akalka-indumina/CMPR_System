import assert from 'node:assert/strict';
import * as r from '../src/complaintRules.js';
import { checkDataWrite } from '../src/dataGuard.js';

const A = role => ({ role, profile: {}, user: {} });
const admin = A('admin');
const stKU = { role: 'station', profile: { id: 'SA-KU', stationCode: 'kurunegala' }, user: { id: 'u1' } };
const stCO = { role: 'station', profile: { id: 'SA-CO', stationCode: 'colombo-fort' }, user: { id: 'u2' } };
const off1 = { role: 'officer', profile: { id: 'O-1', stationCode: 'kurunegala' }, user: { id: 'o1' } };
const off2 = { role: 'officer', profile: { id: 'O-2', stationCode: 'kurunegala' }, user: { id: 'o2' } };
const cit  = { role: 'citizen', profile: { id: 'C-1' }, user: { id: 'C-1' } };
const cit2 = { role: 'citizen', profile: { id: 'C-2' }, user: { id: 'C-2' } };

let c = { id: 'CMP-1', citizenId: 'C-1', stationCode: 'kurunegala', off: null, status: 'Submitted', ev: [] };
// visibility BEFORE assignment
assert(r.canView(admin, c) && r.canView(cit, c) && r.canView(stKU, c));
assert(!r.canView(stCO, c), 'other station must not see');
assert(!r.canView(off1, c), 'officer must not see before assignment');
assert(!r.canView(cit2, c), 'other citizen must not see');
// assign
const plan = r.planAction(stKU, { ...c, status: 'Accepted' }, { action: 'assign', officerId: 'O-1' }, { id: 'O-1', name: 'Perera', active: true, stationCode: 'kurunegala' });
assert.equal(plan.status, 'Assigned'); assert.equal(plan.set.off, 'O-1');
// officer from another station cannot be assigned
assert(r.planAction(stKU, { ...c, status: 'Accepted' }, { action: 'assign' }, { id: 'O-9', name: 'X', stationCode: 'colombo-fort' }).error);
assert(r.planAction(stCO, { ...c, status: 'Accepted' }, { action: 'accept' }, null).error.status === 404, 'other station cannot act');
c = { ...c, off: 'O-1', status: 'Assigned' };
assert(r.canView(off1, c)); assert(!r.canView(off2, c), 'other officer must not see');
// filters
assert.deepEqual(r.listFilter(stKU), { stationCode: 'kurunegala' });
assert.deepEqual(r.listFilter(off1), { off: 'O-1' });
// citizen details per role
const d = r.buildCitizenDetails({ name: 'Kasun', tel: '077', addr: 'Kandy', district: 'Kandy', identityDocumentType: 'NIC', identityNumber: '2005', nic: '2005' }, { email: 'k@x.lk' });
let p = r.presentComplaint(c, stKU, d); assert.equal(p.citizenInfo.email, 'k@x.lk'); assert.equal(p.citizenInfo.idNumber, '2005'); assert.equal(p.citizenInfo.addr, 'Kandy');
p = r.presentComplaint(c, off1, d); assert.deepEqual(p.citizenInfo, { name: 'Kasun', tel: '077' }); assert(!('citizenId' in p));
p = r.presentComplaint(c, cit, d); assert(!('citizenInfo' in p));
p = r.presentComplaint(c, admin, d); assert.equal(p.citizenInfo.email, 'k@x.lk');
// evidence permissions
assert(r.canAddEvidence(cit, { ...c, status: 'Submitted' }) && !r.canAddEvidence(admin, c) && r.canAddEvidence(off1, c));
assert(!r.canAddEvidence(off2, c) && !r.canAddEvidence(stCO, c) && !r.canAddEvidence(off1, { ...c, status: 'Investigation Completed' }));
// file sniffing
assert.equal(r.detectEvidenceType(Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0]), Buffer.alloc(20)])), 'image/jpeg');
assert.equal(r.detectEvidenceType(Buffer.from('%PDF-1.7 hello world')), 'application/pdf');
assert.equal(r.detectEvidenceType(Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(8)])), 'video/mp4');
assert.equal(r.detectEvidenceType(Buffer.from('<script>alert(1)</script>')), null, 'html/svg rejected');
assert.equal(r.cleanFileName('..%2F..%2Fevil.jpg', 'image/jpeg'), '....evil.jpg');
// new complaint validation
const ok = { title: 'Bike stolen', cat: 'Theft', incidentDistrict: 'Kandy', stationCode: 'kandy-x', incidentDate: '2026-11-20', incidentTime: '14:30', loc: 'Main St', desc: 'x'.repeat(30) };
assert(r.validateNewComplaint(ok, new Date('2026-11-24T05:00:00Z')).value);
assert(r.validateNewComplaint({ ...ok, incidentDate: '2027-01-01' }, new Date('2026-11-24T05:00:00Z')).error);
assert(r.validateNewComplaint({ ...ok, incidentDistrict: 'Narnia' }).error);
assert(r.validateNewComplaint({ ...ok, desc: 'short' }).error);
// workflow guards
assert(r.planAction(off1, { ...c, status: 'Under Investigation' }, { action: 'complete', note: 'done' }).status === 'Investigation Completed');
assert(r.planAction(off1, c, { action: 'close', note: 'x' }).error, 'officers cannot close');
assert(r.planAction(stKU, { ...c, status: 'Investigation Completed' }, { action: 'close' }).status === 'Resolved / Closed');
assert(r.planAction(cit, c, { action: 'accept' }).error.status === 403);
// data guard
const cur = { users: [{ id: 'C-1', email: 'a@x', role: 'citizen', active: true }], officers: [{ id: 'O-1', name: 'P', stationCode: 'kurunegala' }], stations: [], administrators: [], citizens: [], accounts: [] };
const clone = x => JSON.parse(JSON.stringify(x));
assert.equal(checkDataWrite(null, cur, clone(cur)), null);
let bad = clone(cur); bad.users.push({ id: 'EVIL', role: 'admin', active: true });
assert(checkDataWrite(null, cur, bad) && checkDataWrite(cit, cur, bad) && checkDataWrite(admin, cur, bad) === null);
bad = clone(cur); bad.officers[0].stationCode = 'colombo-fort';
assert(checkDataWrite(off1, cur, bad), 'officer cannot move station');
bad = clone(cur); bad.officers[0].name = 'New'; assert.equal(checkDataWrite(off1, cur, bad), null, 'own profile edit ok');
bad = clone(cur); bad.users[0].role = 'admin'; assert(checkDataWrite(cit, cur, bad), 'cannot escalate role');
bad = clone(cur); bad.users[0].email = 'new@x'; assert.equal(checkDataWrite(cit, cur, bad), null);
console.log('ALL RULE TESTS PASSED');
