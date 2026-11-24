import { useState } from 'react';
import { h } from '../../lib/h';
import { B2, INP } from '../../lib/constants';
import * as api from '../../lib/api';
import { canAddEvidence, checkEvidenceFiles, EVIDENCE_ACCEPT, fileSize } from '../../lib/evidence';

const KIND = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'application/pdf': 'PDF', 'video/mp4': 'MP4' };
const ROLE = { citizen: 'Citizen', station: 'Station', officer: 'Officer' };

// Shows every evidence file of a complaint (visible to everyone who can see the complaint)
// and lets allowed roles add more.
export function EvidenceList({ S, complaint }) {
  const [opening, setOpening] = useState('');
  const [uploading, setUploading] = useState(false);
  const evidence = complaint.ev || [];
  const canAdd = canAddEvidence(S.role, complaint);

  const open = async item => {
    setOpening(item.id);
    try { await api.openEvidence(complaint.id, item); } catch (error) { S.toast(error.message, 'err'); } finally { setOpening(''); }
  };

  const add = async event => {
    const picked = [...event.target.files];
    event.target.value = '';
    const { accepted, problems } = checkEvidenceFiles(picked, [], evidence.length);
    if (problems.length) S.toast(problems[0], 'err');
    if (!accepted.length) return;
    setUploading(true);
    let added = 0;
    for (const file of accepted) {
      try {
        const updated = await api.uploadEvidence(complaint.id, file);
        S.setC(list => list.map(item => (item.id === updated.id ? updated : item)));
        added += 1;
      } catch (error) {
        S.toast(`${file.name}: ${error.message}`, 'err');
      }
    }
    setUploading(false);
    if (added) S.toast(`${added} evidence file(s) added.`);
  };

  return h`<div>
    <div className="text-mu text-xs mb-1">Evidence attachments (${evidence.length})</div>
    ${evidence.length ? h`<div className="space-y-1.5">${evidence.map((item, index) => h`<div key=${item.id || index} className="flex items-center justify-between gap-2 bg-ip rounded-lg px-3 py-2">
      <div className="min-w-0 text-xs">
        <span className="inline-block mr-2 px-1.5 py-0.5 rounded bg-bd text-[10px] font-semibold">${KIND[item.type] || 'FILE'}</span>
        <span className="break-all">${item.name}</span>
        <div className="text-mu mt-0.5">${item.size ? fileSize(item.size) : ''}${item.by ? ` \u00b7 added by ${item.by} (${ROLE[item.byRole] || item.byRole})` : ''}${item.at ? ` \u00b7 ${new Date(item.at).toLocaleDateString()}` : ''}</div>
      </div>
      ${item.id && h`<button type="button" className=${B2} disabled=${opening === item.id} onClick=${() => open(item)}>${opening === item.id ? 'Opening...' : 'Open'}</button>`}
    </div>`)}</div>` : h`<p className="text-xs text-mu">No evidence has been attached.</p>`}
    ${canAdd && h`<div className="mt-2"><input type="file" multiple accept=${EVIDENCE_ACCEPT} className=${INP} disabled=${uploading} onChange=${add}/><p className="text-mu text-xs mt-1">${uploading ? 'Uploading...' : 'Add JPG, PNG, PDF or MP4 files (max 10 MB each).'}</p></div>`}
  </div>`;
}
