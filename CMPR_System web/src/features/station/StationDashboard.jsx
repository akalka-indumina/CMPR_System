import { h } from '../../lib/h';
import { Badge } from '../../components/ui/Badge';
import { Bars, Dn } from '../../components/ui/Charts';
import { Card, Grid, Pg, Stat } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { B1, B2 } from '../../lib/constants';
import { grp, mine, sd } from '../../lib/helpers';

export const StDash=({S})=>{const m=mine(S);const n=g=>m.filter(c=>grp(c.status)==g).length;const ofs=S.OFF.filter(o=>o.stationCode==S.user.stationCode);return h`<${Pg} t=${S.user.station+' Police Station'} sub="Station dashboard"/><${Grid} n=${5}><${Stat} l="Total received" v=${m.length}/><${Stat} l="Pending review" v=${n(0)+n(1)} c="text-yellow-400"/><${Stat} l="Under investigation" v=${m.filter(c=>['Assigned','Under Investigation'].includes(c.status)).length} c="text-red-400"/><${Stat} l="Completed" v=${n(3)+m.filter(c=>c.status=='Investigation Completed').length} c="text-green-400"/><${Stat} l="Rejected" v=${n(4)}/><//>
<div className="grid lg:grid-cols-2 gap-3 mt-4"><${Card} t="Complaint status"><${Dn} d=${sd(m)}/><//><${Card} t="Officer workload"><${Bars} d=${ofs.map(o=>[o.name,m.filter(c=>c.off==o.id&&['Assigned','Under Investigation'].includes(c.status)).length])} c="bg-orange-500"/><//></div><div className="flex gap-2 my-4 flex-wrap"><button className=${B1} onClick=${()=>S.go('validation')}>Review new complaints</button><button className=${B2} onClick=${()=>S.go('assigned')}>Monitor assignments</button></div><${Card} t="Recent complaints"><${Tbl} cols=${[['ID',c=>c.id],['Title',c=>c.title],['Status',c=>h`<${Badge} s=${c.status}/>`],['',c=>h`<button className=${B2} onClick=${()=>S.setM(c.id)}>Open</button>`]]} rows=${[...m].sort((a,b)=>a.date<b.date?1:-1).slice(0,5)}/><//>`};
