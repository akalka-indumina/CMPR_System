import { useEffect, useState } from 'react';
import { h } from '../../lib/h';
import { Bd } from '../../components/ui/Badge';
import { Bar, Card, Grid, Modal, Pg, Sel, Stat } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { B1, B2, INP } from '../../lib/constants';
import { createUniqueId } from '../../lib/helpers';
import { REGISTRATION_STATUSES, maskNic } from '../../lib/registration';

const colorFor = status => status === 'Approved' ? 'g' : status === 'Rejected' ? 'x' : status === 'Resubmitted' ? 'y' : 'o';
const dateText = value => new Date(value).toLocaleString();
const reviewable = application => application.status === 'Pending Review' || application.status === 'Resubmitted';
const EMPTY_FILES = {};

export function CitizenRegistrationRequests({ S }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => S.RA.find(application => application.id === S.registrationReviewId) || null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [imageUrls, setImageUrls] = useState({});
  const [activeImage, setActiveImage] = useState('');
  const [zoomUrl, setZoomUrl] = useState('');
  const applications = S.RA;
  const files = selected ? S.registrationDocuments[selected.id] || EMPTY_FILES : EMPTY_FILES;

  useEffect(() => {
    const urls = Object.fromEntries(Object.entries(files).map(([slot, file]) => [slot, URL.createObjectURL(file)]));
    setImageUrls(urls);
    setActiveImage(Object.keys(urls)[0] || '');
    return () => Object.values(urls).forEach(url => URL.revokeObjectURL(url));
  }, [selected?.id, files]);

  const matched = applications.filter(application => (
    (!status || application.status === status)
    && (!from || application.submittedAt.slice(0, 10) >= from)
    && (!to || application.submittedAt.slice(0, 10) <= to)
    && `${application.referenceNumber} ${application.fullName} ${application.email} ${application.nic}`
      .toLowerCase().includes(query.toLowerCase())
  ));
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  const rows = matched.slice(page * pageSize, (page + 1) * pageSize);
  const pendingCount = applications.filter(application => reviewable(application)).length;
  const approvedCount = applications.filter(application => application.status === 'Approved').length;
  const rejectedCount = applications.filter(application => application.status === 'Rejected').length;
  const logAction = (application, action, reviewedAt, reviewer) => ({
    id: createUniqueId('ACT'),
    user: reviewer ? S.user.id : application.applicantId,
    userName: reviewer ? S.user.name : application.fullName,
    role: reviewer ? 'Super Administrator' : 'Citizen Applicant',
    action,
    desc: `${action}: ${application.referenceNumber}`,
    dt: reviewedAt,
    ip: 'local-demo',
    applicantId: application.applicantId,
    applicantName: application.fullName,
    relatedReference: application.referenceNumber,
    reviewedBy: reviewer ? S.user.id : '',
  });
  const updateApplication = (application, updates) => {
    const { historyEntry, ...changes } = updates;
    S.setRA(current => current.map(item => item.id === application.id
      ? { ...item, ...changes, reviewHistory: [...item.reviewHistory, historyEntry] }
      : item));
  };
  const closeReview = () => {
    setSelected(null);
    S.setRegistrationReviewId(null);
    setRejectionReason('');
    setReviewError('');
    setZoomUrl('');
  };

  const approve = () => {
    if (!selected || !reviewable(selected)) return;
    if (!selected.documentSlots.every(slot => imageUrls[slot])) {
      S.toast('Identity document previews are unavailable. Do not approve without reviewing the required images.', 'err');
      return;
    }
    S.ask(`Approve application ${selected.referenceNumber}?`, () => {
      const nic = selected.nic.trim().toUpperCase();
      const alreadyExists = [S.U.citizen, ...S.U.citizens].some(user => (
        user.nic?.trim().toUpperCase() === nic
        || user.email.trim().toLowerCase() === selected.email.trim().toLowerCase()
      ));
      if (alreadyExists) {
        S.toast('A matching Citizen account already exists. This application was not approved.', 'err');
        return;
      }
      const reviewedAt = new Date().toISOString();
      const citizen = {
        id: selected.applicantId,
        role: 'citizen',
        status: 'Approved',
        name: selected.fullName,
        nic: selected.nic,
        documentType: selected.documentType,
        dateOfBirth: selected.dateOfBirth,
        gender: selected.gender,
        email: selected.email,
        passwordSalt: selected.passwordSalt,
        passwordHash: selected.passwordHash,
        tel: selected.mobile,
        addr: selected.address,
        district: selected.district,
        registrationApplicationId: selected.id,
      };
      const historyEntry = {
        status: 'Approved',
        at: reviewedAt,
        actorId: S.user.id,
        actorName: S.user.name,
        note: 'Application approved by Super Administrator.',
      };
      S.setU(current => ({ ...current, citizens: [...(current.citizens || []), citizen] }));
      updateApplication(selected, {
        status: 'Approved',
        reviewedById: S.user.id,
        reviewedByName: S.user.name,
        reviewedAt,
        rejectionReason: '',
        historyEntry,
      });
      S.setN(current => [{
        id: createUniqueId('NTF'),
        role: 'citizen',
        userId: citizen.id,
        m: `Your registration application ${selected.referenceNumber} was approved.`,
        read: false,
      }, ...current]);
      S.setAUD(current => [logAction(selected, 'Registration approved', reviewedAt, true), ...current]);
      S.setRegistrationDocuments(current => {
        const next = { ...current };
        delete next[selected.id];
        return next;
      });
      S.toast(`Application ${selected.referenceNumber} approved.`);
      closeReview();
    });
  };

  const reject = () => {
    if (!selected || !reviewable(selected)) return;
    if (!rejectionReason.trim()) {
      setReviewError('A rejection reason is required.');
      return;
    }
    const reason = rejectionReason.trim();
    S.ask(`Reject application ${selected.referenceNumber}?`, () => {
      const reviewedAt = new Date().toISOString();
      const historyEntry = {
        status: 'Rejected',
        at: reviewedAt,
        actorId: S.user.id,
        actorName: S.user.name,
        note: reason,
      };
      updateApplication(selected, {
        status: 'Rejected',
        reviewedById: S.user.id,
        reviewedByName: S.user.name,
        reviewedAt,
        rejectionReason: reason,
        historyEntry,
      });
      S.setN(current => [{
        id: createUniqueId('NTF'),
        role: 'citizen',
        userId: selected.applicantId,
        m: `Your registration application ${selected.referenceNumber} was rejected. Check the application status for details.`,
        read: false,
      }, ...current]);
      S.setAUD(current => [logAction(selected, 'Registration rejected', reviewedAt, true), ...current]);
      S.setRegistrationDocuments(current => {
        const next = { ...current };
        delete next[selected.id];
        return next;
      });
      S.toast(`Application ${selected.referenceNumber} rejected.`);
      closeReview();
    });
  };

  const openReview = application => {
    setSelected(application);
    S.setRegistrationReviewId(application.id);
    setRejectionReason('');
    setReviewError('');
  };

  return h`<div className="space-y-4">
    <${Pg} t="Citizen Registration Requests" sub="Review frontend demonstration identity applications"/>
    <${Grid} n=${4}>
      <${Stat} l="Total Applications" v=${applications.length}/>
      <${Stat} l="Pending Reviews" v=${pendingCount} c="text-orange-400"/>
      <${Stat} l="Approved Applications" v=${approvedCount} c="text-green-400"/>
      <${Stat} l="Rejected Applications" v=${rejectedCount} c="text-red-400"/>
    <//>
    <${Card}>
      <${Bar} q=${query} sq=${value=>{setQuery(value);setPage(0)}}>
        <${Sel} v=${status} set=${value=>{setStatus(value);setPage(0)}} opts=${REGISTRATION_STATUSES} ph="All statuses"/>
        <input aria-label="Submitted from" type="date" className=${INP+' sm:w-auto'} value=${from} onChange=${event=>{setFrom(event.target.value);setPage(0)}}/>
        <input aria-label="Submitted to" type="date" className=${INP+' sm:w-auto'} value=${to} onChange=${event=>{setTo(event.target.value);setPage(0)}}/>
      <//>
      <${Tbl} cols=${[
        ['Applicant',application=>application.fullName],
        ['Document Type',application=>application.documentType],
        ['NIC',application=>maskNic(application.nic)],
        ['Submitted Date',application=>new Date(application.submittedAt).toLocaleDateString()],
        ['Status',application=>h`<${Bd} c=${colorFor(application.status)} t=${application.status}/>`],
        ['Action',application=>h`<button className=${B1} onClick=${()=>openReview(application)}>Review</button>`],
      ]} rows=${rows}/>
      ${matched.length>pageSize&&h`<div className="flex items-center justify-between mt-3 text-xs"><span className="text-mu">Page ${page+1} of ${pageCount}</span><div className="flex gap-2"><button className=${B2} disabled=${page==0} onClick=${()=>setPage(page-1)}>Previous</button><button className=${B2} disabled=${page+1>=pageCount} onClick=${()=>setPage(page+1)}>Next</button></div></div>`}
    <//>
    ${selected&&h`<${Modal} t=${'Review '+selected.referenceNumber} close=${closeReview} w="max-w-3xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">${selected.fullName}</h3><p className="text-xs text-mu">Application ID: ${selected.id} · Applicant ID: ${selected.applicantId}</p></div><${Bd} c=${colorFor(selected.status)} t=${selected.status}/></div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">${[
          ['Document Type',selected.documentType],['NIC Number',selected.nic],
          ['Date of Birth',selected.dateOfBirth],['Gender',selected.gender],['Email',selected.email],
          ['Mobile Number',selected.mobile],['Residential Address',selected.address],['District',selected.district],
          ['Submitted',dateText(selected.submittedAt)],['Reviewed By',selected.reviewedByName||'Not reviewed'],
        ].map(([label,value])=>h`<div key=${label}><div className="text-mu text-xs">${label}</div><div className="break-words">${value}</div></div>`)}</div>
        <div><h3 className="font-semibold text-sm mb-2">Identity Document</h3>${Object.keys(imageUrls).length?h`<div className="space-y-3"><div className="flex gap-2 flex-wrap">${Object.entries(imageUrls).map(([slot,url])=>h`<button key=${slot} className=${'px-3 py-1.5 rounded-lg text-xs border '+(activeImage==slot?'border-pr text-white':'border-bd text-mu')} onClick=${()=>setActiveImage(slot)}>${slot=='licence'?'Driving Licence':slot=='front'?'NIC Front':'NIC Back'}</button>`)}</div>${imageUrls[activeImage]&&h`<button className="block rounded-lg border border-bd bg-ip p-2" onClick=${()=>setZoomUrl(imageUrls[activeImage])}><img src=${imageUrls[activeImage]} alt="Uploaded identity document preview" className="max-h-72 max-w-full object-contain"/></button>`}<p className="text-xs text-mu">Select an image to enlarge. Images are temporary and are not persisted.</p></div>`:h`<p className="text-sm text-orange-300">Temporary document images are not available after the registration browser session ends. Do not approve identity without the required document review.</p>`}</div>
        ${selected.status=='Rejected'&&h`<p className="text-sm text-red-300">Rejection reason: ${selected.rejectionReason}</p>`}
        ${reviewable(selected)&&h`<div className="border-t border-bd pt-3 space-y-2"><label className="block text-xs text-mu">Rejection reason <textarea rows="2" className=${INP+' mt-1'} value=${rejectionReason} onChange=${event=>{setRejectionReason(event.target.value);setReviewError('')}}></textarea></label>${reviewError&&h`<p className="text-red-400 text-xs">${reviewError}</p>`}<div className="flex flex-wrap justify-end gap-2"><button className="px-3 py-1.5 rounded-lg text-xs border border-red-600 text-red-400 hover:bg-red-600/10" onClick=${reject}>Reject Application</button><button className=${B1} onClick=${approve}>Approve Application</button></div></div>`}
        ${selected.reviewHistory.length>0&&h`<div className="border-t border-bd pt-3"><h3 className="font-semibold text-sm mb-2">Review History</h3><div className="space-y-2 text-xs">${selected.reviewHistory.map((entry,index)=>h`<div key=${index} className="border-l border-bd pl-3"><div><${Bd} c=${colorFor(entry.status)} t=${entry.status}/> <span className="text-mu">${dateText(entry.at)} · ${entry.actorName}</span></div><p className="mt-1">${entry.note}</p></div>`)}</div></div>`}
      </div>
    <//>`}
    ${zoomUrl&&h`<${Modal} t="Identity document preview" close=${()=>setZoomUrl('')} w="max-w-4xl"><img src=${zoomUrl} alt="Enlarged identity document preview" className="max-h-[75vh] max-w-full mx-auto object-contain"/><///>`}
  </div>`;
}
