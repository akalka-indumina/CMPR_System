import { GC, GL } from './constants';

export const grp=s=>['Submitted','Received'].includes(s)?0:['Under Review','Additional Info Requested','Accepted'].includes(s)?1:['Assigned','Under Investigation','Investigation Completed'].includes(s)?2:s=='Resolved / Closed'?3:4;
export const sd=r=>GL.map((l,i)=>[l,r.filter(c=>grp(c.status)==i).length,GC[i]]);
export const gb=(a,f)=>Object.entries(a.reduce((m,x)=>(m[f(x)]=(m[f(x)]||0)+1,m),{})).sort();
export const on=(S,id)=>(S.OFF.find(o=>o.id==id)||{}).name||'\u2014';
export const mine=S=>S.role=='station'?S.C.filter(c=>c.station==S.user.station):S.role=='officer'?S.C.filter(c=>c.off==S.user.id):S.C.filter(c=>c.cit==S.user.name);
