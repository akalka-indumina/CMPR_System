import { h } from '../../lib/h';
import { Bd } from '../../components/ui/Badge';
import { Card, Pg } from '../../components/ui/Primitives';
import { B1, B2 } from '../../lib/constants';

const badgeColor = status => status === 'Approved' ? 'g' : status === 'Rejected' ? 'x' : 'o';

export function RegistrationStatus({ application, onLogin, onReapply }) {
  if (!application) {
    return h`<div className="min-h-screen flex items-center justify-center p-4"><${Card} cls="max-w-lg w-full"><h1 className="font-bold text-lg">Registration application not found</h1><p className="text-mu text-sm mt-2">Check the reference number and try again.</p><button className=${B2+' mt-4'} onClick=${onLogin}>Back to sign in</button><//></div>`;
  }

  const pending = application.status === 'Pending Review' || application.status === 'Resubmitted';
  const submitted = new Date(application.submittedAt).toLocaleString();
  return h`<div className="min-h-screen flex items-center justify-center p-4"><div className="w-full max-w-2xl space-y-4">
    <${Pg} t="Citizen registration status" sub="Frontend demonstration application"/>
    <${Card}>
      ${pending&&h`<div><h1 className="font-bold text-xl text-orange-400">UNDER REVIEW</h1><p className="text-sm mt-2">Your registration application has been submitted successfully. Your identity verification is currently under review by the Super Administrator.</p></div>`}
      ${application.status=='Approved'&&h`<div><h1 className="font-bold text-xl text-green-400">APPROVED</h1><p className="text-sm mt-2">Your identity verification is approved. You can now sign in to the Citizen portal.</p></div>`}
      ${application.status=='Rejected'&&h`<div><h1 className="font-bold text-xl text-red-400">APPLICATION REJECTED</h1><p className="text-sm mt-2">Your registration application was rejected.</p></div>`}
      <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
        <div><div className="text-mu text-xs">Reference Number</div><div className="font-mono text-red-400">${application.referenceNumber}</div></div>
        <div><div className="text-mu text-xs">Submitted Date</div><div>${submitted}</div></div>
        <div><div className="text-mu text-xs">Current Status</div><${Bd} c=${badgeColor(application.status)} t=${application.status}/></div>
        <div><div className="text-mu text-xs">Review Result</div><div>${application.reviewedAt?new Date(application.reviewedAt).toLocaleString():'Awaiting review'}</div></div>
        ${application.status=='Rejected'&&h`<div className="sm:col-span-2"><div className="text-mu text-xs">Rejection Reason</div><p className="text-red-300">${application.rejectionReason}</p></div>`}
      </div>
      <div className="flex flex-wrap gap-2 mt-5">${application.status=='Rejected'&&h`<button className=${B1} onClick=${()=>onReapply(application)}>Resubmit application</button>`}${application.status=='Approved'&&h`<button className=${B1} onClick=${onLogin}>Go to sign in</button>`}<button className=${B2} onClick=${onLogin}>Back to sign in</button></div>
    <//>
  </div></div>`;
}
