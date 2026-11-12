import { h } from '../../lib/h';
import { Card, Pg } from '../../components/ui/Primitives';
import { B2 } from '../../lib/constants';

export function Notifs({S}){const l=S.N.filter(n=>n.role==S.role);return h`<${Pg} t="Notifications"><button className=${B2} onClick=${()=>{S.setN(S.N.map(n=>n.role==S.role?{...n,read:true}:n));S.toast('All marked as read')}}>Mark all as read</button><//><${Card}><div className="divide-y divide-bd">${l.length?l.map(n=>h`<div key=${n.id} className="flex justify-between items-center gap-2 py-3 text-sm"><span className=${n.read?'text-mu':'font-medium'}>${!n.read&&h`<span className="inline-block w-2 h-2 rounded-full bg-pr mr-2"></span>`}${n.m}</span>${!n.read&&h`<button className=${B2} onClick=${()=>S.setN(S.N.map(x=>x.id==n.id?{...x,read:true}:x))}>Mark read</button>`}</div>`):h`<p className="text-mu py-4 text-center">You are all caught up.</p>`}</div><//>`}
