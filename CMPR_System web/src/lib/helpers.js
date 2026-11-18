import { GC, GL } from './constants';

export const grp=s=>['Submitted','Received'].includes(s)?0:['Under Review','Additional Info Requested','Accepted'].includes(s)?1:['Assigned','Under Investigation','Investigation Completed'].includes(s)?2:s=='Resolved / Closed'?3:4;
export const sd=r=>GL.map((l,i)=>[l,r.filter(c=>grp(c.status)==i).length,GC[i]]);
export const gb=(a,f)=>Object.entries(a.reduce((m,x)=>(m[f(x)]=(m[f(x)]||0)+1,m),{})).sort();
export const on=(S,id)=>(S.OFF.find(o=>o.id==id)||{}).name||'\u2014';
export const mine=S=>S.role=='station'?S.C.filter(c=>c.stationCode==S.user.stationCode):S.role=='officer'?S.C.filter(c=>c.off==S.user.id):S.C.filter(c=>c.citizenId==S.user.id);
export const createUniqueId=prefix=>`${prefix}-${globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}`;
export const nextComplaintId=complaints=>{const year=new Date().getFullYear(),prefix=`CMP-${year}-`,used=new Set(complaints.map(c=>c.id)),max=complaints.reduce((n,c)=>{if(!c.id.startsWith(prefix))return n;const value=Number(c.id.slice(prefix.length));return Number.isSafeInteger(value)?Math.max(n,value):n},0);let number=max+1,id=prefix+String(number).padStart(4,'0');while(used.has(id))id=prefix+String(++number).padStart(4,'0');return id};
