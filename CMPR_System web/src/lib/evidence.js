// evidence.js - evidence-file rules shared by the Submit page and the complaint window.
// (The server checks everything again - these checks are only for a quick, friendly message.)
export const EVIDENCE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'mp4'];
export const EVIDENCE_ACCEPT = '.jpg,.jpeg,.png,.pdf,.mp4';
export const MAX_EVIDENCE_FILES = 10;
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

export const fileSize = bytes => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Returns { accepted: [File], problems: [text] }. `existing` is how many files are already attached.
export function checkEvidenceFiles(picked, chosen = [], existing = 0) {
  const accepted = [...chosen];
  const problems = [];
  for (const file of picked) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!EVIDENCE_EXTENSIONS.includes(extension)) problems.push(`${file.name}: only JPG, PNG, PDF or MP4 files are accepted.`);
    else if (file.size === 0) problems.push(`${file.name}: the file is empty.`);
    else if (file.size > MAX_EVIDENCE_BYTES) problems.push(`${file.name}: larger than 10 MB.`);
    else if (accepted.some(item => item.name === file.name && item.size === file.size)) continue;
    else if (accepted.length + existing >= MAX_EVIDENCE_FILES) problems.push(`A complaint can have at most ${MAX_EVIDENCE_FILES} evidence files.`);
    else accepted.push(file);
  }
  return { accepted, problems: [...new Set(problems)] };
}

// Mirrors the server rule (complaintRules.canAddEvidence) so the button only shows when it can work.
export const canAddEvidence = (role, complaint) => {
  if (role === 'citizen' || role === 'station') return !['Resolved / Closed', 'Rejected'].includes(complaint.status);
  if (role === 'officer') return ['Assigned', 'Under Investigation'].includes(complaint.status);
  return false;
};
