import { h } from '../../lib/h';
import { Badge } from '../../components/ui/Badge';
import { Bars, Dn } from '../../components/ui/Charts';
import { Card, Grid, Pg, Stat } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { B1 } from '../../lib/constants';
import { gb, grp, sd } from '../../lib/helpers';

export const AdDash=({S})=>h`<${Pg} t="Super Administrator Dashboard" sub="System-wide overview (demo data)"/>
<${Grid} n=${6}><${Stat} l="Police stations" v=${S.STN.length}/><${Stat} l="Station accounts" v=${S.ACC.length}/><${Stat} l="Police officers" v=${S.OFF.length}/><${Stat} l="Total complaints" v=${S.C.length}/><${Stat} l="Pending" v=${S.C.filter(c=>grp(c.status)<2).length} c="text-yellow-400"/><${Stat} l="Resolved" v=${S.C.filter(c=>c.status=='Resolved / Closed').length} c="text-green-400"/><//>
<div className="grid lg:grid-cols-2 gap-3 mt-4"><${Card} t="Complaint status distribution"><${Dn} d=${sd(S.C)}/><//><${Card} t="Complaints by month"><${Bars} d=${gb(S.C,c=>c.date.slice(0,7))}/><//></div>
<div className="flex gap-2 flex-wrap my-4">${[['stations','View stations'],['accounts','Manage accounts'],['officers','Manage officers'],['audit','Open audit logs']].map(x=>h`<button key=${x[0]} className=${B1} onClick=${()=>S.go(x[0])}>${x[1]}</button>`)}</div>
<div className="grid lg:grid-cols-3 gap-3"><div className="lg:col-span-2"><${Card} t="Recent complaints"><${Tbl} cols=${[['ID',c=>c.id],['Title',c=>c.title],['Station',c=>c.station],['Status',c=>h`<${Badge} s=${c.status}/>`]]} rows=${[...S.C].sort((a,b)=>a.date<b.date?1:-1).slice(0,5)}/><//></div><${Card} t="Recent system activities"><div className="space-y-2 text-xs">${S.AUD.slice(0,5).map(a=>h`<div key=${a.id}><b>${a.user}</b> \u00b7 ${a.desc}<div className="text-mu">${a.dt}</div></div>`)}</div><//></div>`;
