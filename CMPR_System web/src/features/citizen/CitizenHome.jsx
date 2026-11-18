import { h } from '../../lib/h';
import { Tl } from '../../components/complaints/Timeline';
import { Badge } from '../../components/ui/Badge';
import { Card, Grid, Pg, Stat } from '../../components/ui/Primitives';
import { B1 } from '../../lib/constants';
import { grp, mine } from '../../lib/helpers';

export function CitHome({S}){const m=mine(S),l=m[0];return h`<${Pg} t=${'Hello, '+S.user.name.split(' ')[0]} sub="Track and manage your complaints"><button className=${B1} onClick=${()=>S.go('submit')}>+ Submit complaint</button><//><${Grid}><${Stat} l="Total complaints" v=${m.length}/><${Stat} l="Pending" v=${m.filter(c=>grp(c.status)<2).length} c="text-yellow-400"/><${Stat} l="Under investigation" v=${m.filter(c=>grp(c.status)==2).length} c="text-red-400"/><${Stat} l="Resolved" v=${m.filter(c=>c.status=='Resolved / Closed').length} c="text-green-400"/><//><div className="grid lg:grid-cols-2 gap-3 mt-4"><${Card} t="Recent complaints"><div className="space-y-2">${m.map(c=>h`<div key=${c.id} className="flex justify-between items-center gap-2 text-sm"><span className="truncate">${c.title}</span><${Badge} s=${c.status}/></div>`)}</div><//>${l&&h`<${Card} t=${'Latest status: '+l.id}><${Tl} c=${l}/><//>`}</div>`}
