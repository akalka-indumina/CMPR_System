import { useState } from 'react';
import { h } from '../../lib/h';
import { Badge } from '../ui/Badge';
import { Modal, Sel } from '../ui/Primitives';
import { Tbl } from '../ui/Table';
import { EvidenceList } from './EvidenceList';
import { B1, B2, INP } from '../../lib/constants';
import { on } from '../../lib/helpers';
import * as api from '../../lib/api';
import { checkEvidenceFiles, EVIDENCE_ACCEPT } from '../../lib/evidence';

const REVIEW = ['Submitted', 'Received', 'Under Review', 'Additional Info Requested'];
const dash = value => value || '\u2014';

// What the complainant's details look like depends on the viewer (the SERVER decides what to send):
//   station account / super admin -> full details,  assigned officer -> name + contact number only
function ComplainantCard({ role, info }) {
  const full = role !== 'officer';
  const rows = full
    ? [['Name', info.name], ['Contact number', info.tel], ['Address', info.addr], ['District', info.district],
      ['ID number', info.idNumber ? `${info.idType ? `${info.idType} \u00b7 ` : ''}${info.idNumber}` : ''], ['Email', info.email]]
    : [['Name', info.name], ['Contact number', info.tel]];
  return h`<div className="rounded-lg border border-bd bg-ip/40 p-3">
    <div className="text-xs font-semibold mb-2">Complainant details${full ? '' : ' (limited view)'}</div>
    <div className="grid sm:grid-cols-2 gap-3">${rows.map(([label, value]) => h`<div key=${label}><div className="text-mu text-xs">${label}</div><div className="break-words">${dash(value)}</div></div>`)}</div>
  </div>`;
}

export function CM({ S, id }) {
  const c = S.C.find(x => x.id === id);
  const r = S.role;
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState('In progress');
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!c) return null;

  const close = () => S.setM(null);
  const workload = officerId => S.C.filter(x => x.off === officerId && ['Assigned', 'Under Investigation'].includes(x.status)).length;
  const need = (value, message) => (value.trim() ? (setErr(''), true) : (setErr(message), false));

  // All status changes go to the server, which re-checks that this user is allowed to do them.
  const run = async (action, payload, notifyRole) => {
    if (busy) return;
    setBusy(true);
    try { await S.act(c.id, action, payload, notifyRole); } finally { setBusy(false); }
  };

  const saveProgress = async () => {
    if (!need(note, 'Update description is required.')) return;
    setBusy(true);
    try {
      if (file) { // evidence first, so it is stored even if the status update is refused
        const updated = await api.uploadEvidence(c.id, file);
        S.setC(list => list.map(x => (x.id === updated.id ? updated : x)));
      }
      if (await S.act(c.id, 'update', { note: note.trim(), progress })) { setNote(''); setFile(null); }
    } catch (error) {
      S.toast(error.message, 'err');
    } finally { setBusy(false); }
  };

  const pickFile = event => {
    const picked = event.target.files[0];
    event.target.value = '';
    if (!picked) return setFile(null);
    const { accepted, problems } = checkEvidenceFiles([picked], [], c.ev.length);
    if (problems.length) { setErr(problems[0]); return setFile(null); }
    setErr('');
    setFile(accepted[0]);
  };

  return h`<${Modal} t=${`${c.id} \u2013 ${c.title}`} close=${close}>
  <div className="space-y-4 text-sm">
    <div className="flex gap-2 flex-wrap"><${Badge} s=${c.status}/></div>

    <div className="grid sm:grid-cols-2 gap-3">${[
      ['Category', c.cat], ['Complaint submitted', c.date],
      ['Incident date and time', c.incidentDate ? `${c.incidentDate}${c.incidentTime ? ` at ${c.incidentTime}` : ''}` : ''],
      ['Incident district', c.district], ['Police station', c.station], ['Incident location', c.loc],
      ['Assigned officer', on(S, c.off)],
    ].map(([label, value]) => h`<div key=${label}><div className="text-mu text-xs">${label}</div>${dash(value)}</div>`)}</div>

    ${c.citizenInfo && h`<${ComplainantCard} role=${r} info=${c.citizenInfo}/>`}

    <div><div className="text-mu text-xs">Description</div><p className="whitespace-pre-wrap">${c.desc}</p></div>
    ${(c.suspect || c.witness) && h`<div className="grid sm:grid-cols-2 gap-3">
      ${c.suspect && h`<div><div className="text-mu text-xs">Suspect information</div>${c.suspect}</div>`}
      ${c.witness && h`<div><div className="text-mu text-xs">Witness information</div>${c.witness}</div>`}
    </div>`}

    <${EvidenceList} S=${S} complaint=${c}/>

    <div><div className="text-mu text-xs mb-2">${r === 'officer' ? 'Investigation history' : 'Status history'}</div><div className="space-y-2 border-l border-bd pl-3">${c.hist.map((x, i) => h`<div key=${i}><${Badge} s=${x[0]}/> <span className="text-mu text-xs">${x[1]}</span><div className="text-xs mt-0.5">${x[2]}</div></div>`)}</div></div>

    ${err && h`<p className="text-red-400 text-xs">${err}</p>`}

    ${r === 'station' && REVIEW.includes(c.status) && h`<div className="border-t border-bd pt-3 space-y-2">
      <textarea className=${INP} rows="2" placeholder="Rejection reason or note to citizen" value=${reason} onChange=${e => setReason(e.target.value)}></textarea>
      <div className="flex gap-2 flex-wrap">
        <button className=${B1} disabled=${busy} onClick=${() => run('accept', {})}>Accept complaint</button>
        <button className=${B2} disabled=${busy} onClick=${() => need(reason, 'Enter a note before requesting information.') && run('request_info', { note: reason })}>Request additional information</button>
        <button className="px-3 py-1.5 rounded-lg text-xs border border-red-600 text-red-400 hover:bg-red-600/10" disabled=${busy} onClick=${() => need(reason, 'A rejection reason is required.') && S.ask(`Reject ${c.id}?`, () => run('reject', { note: reason }))}>Reject complaint</button>
      </div>
    </div>`}

    ${r === 'station' && c.status === 'Accepted' && h`<div className="border-t border-bd pt-3">
      <div className="font-medium mb-2">Assign to an officer (${c.station} station only)</div>
      <${Tbl} cols=${[['Officer ID', o => o.id], ['Name', o => o.name], ['Workload', o => `${workload(o.id)} active`],
        ['', o => h`<button className=${B1} disabled=${busy} onClick=${() => run('assign', { officerId: o.id }, 'officer')}>Assign</button>`]]}
        rows=${S.OFF.filter(o => o.stationCode === c.stationCode && o.active)}/>
    </div>`}

    ${r === 'station' && c.status === 'Investigation Completed' && h`<div className="border-t border-bd pt-3 flex gap-2 flex-wrap">
      <button className=${B1} disabled=${busy} onClick=${() => S.ask(`Close ${c.id} as resolved?`, () => run('close', {}))}>Close complaint</button>
      <button className=${B2} disabled=${busy} onClick=${() => run('return', {}, 'officer')}>Return to officer</button>
    </div>`}

    ${r === 'officer' && ['Assigned', 'Under Investigation'].includes(c.status) && h`<div className="border-t border-bd pt-3 space-y-2">
      <div className="font-medium">Add investigation update</div>
      <textarea className=${INP} rows="3" placeholder="Update description" value=${note} onChange=${e => setNote(e.target.value)}></textarea>
      <div className="grid sm:grid-cols-2 gap-2">
        <${Sel} v=${progress} set=${setProgress} opts=${['In progress', 'Evidence collected', 'Witness interviewed', 'Suspect identified']}/>
        <input type="file" accept=${EVIDENCE_ACCEPT} className=${INP} onChange=${pickFile}/>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className=${B1} disabled=${busy} onClick=${saveProgress}>Save progress</button>
        <button className=${B2} disabled=${busy} onClick=${() => need(note, 'Describe the findings before completing.') && S.ask('Send to station for review? You cannot close complaints.', () => run('complete', { note: note.trim() }, 'station'))}>Mark investigation as completed</button>
      </div>
      <p className="text-mu text-xs">Officers cannot close complaints. Completed work goes to the station account for final review.</p>
    </div>`}
  </div><//>`;
}
