import { h } from '../../lib/h';
import { Badge, Bd } from '../../components/ui/Badge';
import { Bars, Dn } from '../../components/ui/Charts';
import { Card, Grid, Pg, Stat } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { B1, B2 } from '../../lib/constants';
import { gb, grp, sd } from '../../lib/helpers';
import { maskNic } from '../../lib/registration';

export const AdDash=({S})=>h`<${Pg} t="Super Administrator Dashboard" sub="System-wide overview (demo data)"/>
<${Grid} n=${6}><${Stat} key="stations" l="Police stations" v=${S.STN.length}/><${Stat} key="accounts" l="Station accounts" v=${S.ACC.length}/><${Stat} key="officers" l="Police officers" v=${S.OFF.length}/><${Stat} key="complaints" l="Total complaints" v=${S.C.length}/><${Stat} key="pending" l="Pending" v=${S.C.filter(c=>grp(c.status)<2).length} c="text-yellow-400"/><${Stat} key="resolved" l="Resolved" v=${S.C.filter(c=>c.status=='Resolved / Closed').length} c="text-green-400"/><//>
<div className="grid lg:grid-cols-2 gap-3 mt-4"><${Card} t="Complaint status distribution"><${Dn} d=${sd(S.C)}/><//><${Card} t="Complaints by month"><${Bars} d=${gb(S.C,c=>c.date.slice(0,7))}/><//></div>
<div className="flex gap-2 flex-wrap my-4">${[['stations','View stations'],['accounts','Manage accounts'],['officers','Manage officers'],['audit','Open audit logs']].map(x=>h`<button key=${x[0]} className=${B1} onClick=${()=>S.go(x[0])}>${x[1]}</button>`)}</div>
<${Card} t="Citizen Registration Requests"><${Grid} n=${4}><${Stat} key="applications" l="Total Applications" v=${S.RA.length}/><${Stat} key="reviews" l="Pending Reviews" v=${S.RA.filter(a=>['Pending Review','Resubmitted'].includes(a.status)).length} c="text-orange-400"/><${Stat} key="approved" l="Approved Applications" v=${S.RA.filter(a=>a.status=='Approved').length} c="text-green-400"/><${Stat} key="rejected" l="Rejected Applications" v=${S.RA.filter(a=>a.status=='Rejected').length} c="text-red-400"/><//><div className="mt-4"><${Tbl} cols=${[['Applicant',a=>a.fullName],['Document Type',a=>a.documentType],['NIC',a=>maskNic(a.nic)],['Submitted',a=>new Date(a.submittedAt).toLocaleDateString()],['Status',a=>h`<${Bd} c=${a.status=='Approved'?'g':a.status=='Rejected'?'x':'o'} t=${a.status}/>`],['',a=>h`<button className=${B2} onClick=${()=>{S.setRegistrationReviewId(a.id);S.go('registrations')}}>Review</button>`]]} rows=${S.RA.slice(0,5)}/></div><//>
<div className="grid lg:grid-cols-3 gap-3"><div className="lg:col-span-2"><${Card} t="Recent complaints"><${Tbl} cols=${[['ID',c=>c.id],['Title',c=>c.title],['Station',c=>c.station],['Status',c=>h`<${Badge} s=${c.status}/>`]]} rows=${[...S.C].sort((a,b)=>a.date<b.date?1:-1).slice(0,5)}/><//></div><${Card} t="Recent system activities"><div className="space-y-2 text-xs">${S.AUD.slice(0,5).map(a=>h`<div key=${a.id}><b>${a.user}</b> \u00b7 ${a.desc}<div className="text-mu">${a.dt}</div></div>`)}</div><//></div>`;
