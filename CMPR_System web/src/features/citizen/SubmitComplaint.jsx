import { useMemo, useState } from 'react';
import { h } from '../../lib/h';
import { Card, Fld, Pg } from '../../components/ui/Primitives';
import { B1, B2, INP } from '../../lib/constants';
import { createUniqueId } from '../../lib/helpers';
import { SRI_LANKA_DISTRICTS } from '../../lib/registration';
import { checkEvidenceFiles, EVIDENCE_ACCEPT, fileSize } from '../../lib/evidence';
import * as api from '../../lib/api';

const CATEGORIES = ['Theft', 'Fraud', 'Harassment', 'Assault', 'Property Damage', 'Cybercrime', 'Missing Person', 'Other'];
const EMPTY = { title: '', cat: '', incidentDistrict: '', stationCode: '', incidentDate: '', incidentTime: '', loc: '', desc: '', suspect: '', witness: '' };
const REQUIRED = ['title', 'cat', 'incidentDistrict', 'stationCode', 'incidentDate', 'incidentTime', 'loc', 'desc'];
const localToday = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

export function Submit({ S }) {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [fileProblem, setFileProblem] = useState('');
  const [progress, setProgress] = useState('');
  const [done, setDone] = useState(null);

  const set = key => event => { const value = event.target.value; setF(c => ({ ...c, [key]: value })); setErrors(c => ({ ...c, [key]: '' })); };
  // Changing the district clears the station, because stations belong to one district.
  const changeDistrict = event => { const value = event.target.value; setF(c => ({ ...c, incidentDistrict: value, stationCode: '' })); setErrors(c => ({ ...c, incidentDistrict: '', stationCode: '' })); };

  const stations = useMemo(
    () => S.STN.filter(s => s.district === f.incidentDistrict && s.active !== false).sort((a, b) => a.name.localeCompare(b.name)),
    [S.STN, f.incidentDistrict],
  );

  const addFiles = event => {
    const picked = [...event.target.files];
    event.target.value = '';
    const { accepted, problems } = checkEvidenceFiles(picked, files);
    setFiles(accepted);
    setFileProblem(problems.join(' '));
  };

  const submit = async () => {
    const next = {};
    REQUIRED.forEach(key => { if (!f[key].trim()) next[key] = 'Required'; });
    if (f.desc.trim() && f.desc.trim().length < 20) next.desc = 'Please give at least 20 characters';
    if (f.incidentDate > localToday()) next.incidentDate = 'The incident date cannot be in the future';
    setErrors(next);
    if (Object.keys(next).length) return S.toast('Please complete the required fields', 'err');

    setProgress('Submitting complaint...');
    try {
      const complaint = await api.createComplaint(f);
      const failed = [];
      for (let i = 0; i < files.length; i += 1) {
        setProgress(`Uploading evidence ${i + 1} of ${files.length}...`);
        try { await api.uploadEvidence(complaint.id, files[i]); } catch (error) { failed.push(`${files[i].name} (${error.message})`); }
      }
      await S.refreshComplaints();
      S.notify('station', `New complaint ${complaint.id} received`, { complaintId: complaint.id });
      S.setAUD(current => [{
        id: createUniqueId('ACT'), user: S.user.id, userName: S.user.name, role: 'Citizen', action: 'Complaint submitted',
        desc: `Complaint submitted: ${complaint.id} to ${complaint.station}`, dt: new Date().toISOString(), ip: '',
      }, ...current]);
      setDone({ id: complaint.id, station: complaint.station, failed });
      S.toast('Complaint submitted');
    } catch (error) {
      S.toast(error.message, 'err');
    } finally { setProgress(''); }
  };

  if (done) {
    return h`<${Card} cls="max-w-md mx-auto text-center py-8">
      <div className="text-green-400 text-4xl mb-2">\u2713</div>
      <h2 className="font-bold text-lg">Complaint submitted</h2>
      <p className="text-mu text-sm my-2">Sent to ${done.station} Police Station. Your complaint reference is</p>
      <p className="font-mono text-red-400 text-xl mb-4">${done.id}</p>
      ${done.failed.length > 0 && h`<p className="text-orange-300 text-xs mb-4">Some evidence files could not be uploaded: ${done.failed.join('; ')}. Open the complaint to add them again.</p>`}
      <div className="flex gap-2 justify-center">
        <button className=${B1} onClick=${() => S.go('my')}>View my complaints</button>
        <button className=${B2} onClick=${() => { setDone(null); setF(EMPTY); setFiles([]); setFileProblem(''); }}>Submit another</button>
      </div>
    <//>`;
  }

  const busy = Boolean(progress);
  const stationPlaceholder = !f.incidentDistrict ? 'Select district first' : stations.length ? 'Select police station' : 'No police stations available';

  return h`<${Pg} t="Submit a complaint" sub="Fields marked * are required"/>
  <${Card}><div className="grid sm:grid-cols-2 gap-3">
    <div className="sm:col-span-2"><${Fld} l="Complaint title *" err=${errors.title}><input className=${INP} value=${f.title} maxLength="150" onChange=${set('title')}/><//></div>
    <${Fld} l="Category *" err=${errors.cat}><select className=${INP} value=${f.cat} onChange=${set('cat')}><option value="">Select category</option>${CATEGORIES.map(o => h`<option key=${o}>${o}</option>`)}</select><//>
    <div></div>
    <${Fld} l="Incident District *" err=${errors.incidentDistrict}><select className=${INP} value=${f.incidentDistrict} onChange=${changeDistrict}><option value="">Select incident district</option>${SRI_LANKA_DISTRICTS.map(o => h`<option key=${o}>${o}</option>`)}</select><//>
    <${Fld} l="Police Station *" err=${errors.stationCode}><select className=${INP} value=${f.stationCode} disabled=${!f.incidentDistrict || stations.length === 0} onChange=${set('stationCode')}><option value="">${stationPlaceholder}</option>${stations.map(s => h`<option key=${s.code} value=${s.code}>${s.name}</option>`)}</select><//>
    <${Fld} l="Incident date *" err=${errors.incidentDate}><input type="date" className=${INP} max=${localToday()} value=${f.incidentDate} onChange=${set('incidentDate')}/><//>
    <${Fld} l="Incident time *" err=${errors.incidentTime}><input type="time" className=${INP} value=${f.incidentTime} onChange=${set('incidentTime')}/><//>
    <div className="sm:col-span-2"><${Fld} l="Incident location *" err=${errors.loc}><input className=${INP} value=${f.loc} maxLength="250" onChange=${set('loc')}/><//></div>
    <div className="sm:col-span-2"><${Fld} l="Description *" err=${errors.desc}><textarea rows="4" className=${INP} value=${f.desc} maxLength="5000" onChange=${set('desc')}></textarea><//></div>
    <${Fld} l="Suspect information (optional)"><input className=${INP} value=${f.suspect} maxLength="500" onChange=${set('suspect')}/><//>
    <${Fld} l="Witness information (optional)"><input className=${INP} value=${f.witness} maxLength="500" onChange=${set('witness')}/><//>
    <div className="sm:col-span-2"><${Fld} l="Evidence upload"><input type="file" multiple accept=${EVIDENCE_ACCEPT} className=${INP} onChange=${addFiles}/><//>
      <p className="text-mu text-xs mt-1">Accepted: JPG, PNG, PDF, MP4 (max 10 MB each, up to 10 files). Evidence is saved securely and can be seen only by the people handling your complaint.</p>
      ${fileProblem && h`<p className="text-red-400 text-xs mt-1">${fileProblem}</p>`}
      ${files.length > 0 && h`<div className="mt-2 space-y-1">${files.map(file => h`<div key=${file.name + file.size} className="flex items-center justify-between gap-2 bg-ip rounded-lg px-3 py-1.5 text-xs"><span className="break-all">${file.name} <span className="text-mu">\u00b7 ${fileSize(file.size)}</span></span><button type="button" className="text-red-400 hover:underline shrink-0" onClick=${() => setFiles(files.filter(x => x !== file))}>Remove</button></div>`)}</div>`}
    </div>
  </div>
  <div className="flex items-center justify-end gap-2 mt-4">${busy && h`<span className="text-mu text-xs mr-2">${progress}</span>`}<button className=${B2} disabled=${busy} onClick=${() => S.go('home')}>Cancel</button><button className=${B1} disabled=${busy} onClick=${submit}>${busy ? 'Please wait...' : 'Submit complaint'}</button></div><//>`;
}
