import { useState } from 'react';
import { h } from '../../lib/h';
import { Bars, Dn } from '../../components/ui/Charts';
import { Card, Pg } from '../../components/ui/Primitives';
import { INP } from '../../lib/constants';
import { gb, grp, on, sd } from '../../lib/helpers';

export function Reports({S,rows:R,title}){const[f,sf]=useState(''),[t,st]=useState('');const C=(R||S.C).filter(c=>(!f||c.date>=f)&&(!t||c.date<=t));const rate=gb(C,c=>c.station).map(([s])=>{const x=C.filter(c=>c.station==s);return[s,Math.round(x.filter(c=>c.status=='Resolved / Closed').length/x.length*100)]});
 return h`<${Pg} t=${title||'Reports and Analytics'} sub="Filter by date range"><input type="date" className=${INP+' w-auto'} value=${f} onChange=${e=>sf(e.target.value)}/><input type="date" className=${INP+' w-auto'} value=${t} onChange=${e=>st(e.target.value)}/><//><div className="grid lg:grid-cols-2 gap-3"><${Card} t="Monthly trend"><${Bars} d=${gb(C,c=>c.date.slice(0,7))}/><//><${Card} t="Status distribution"><${Dn} d=${sd(C)}/><//><${Card} t="By category"><${Bars} d=${gb(C,c=>c.cat)} c="bg-orange-500"/><//>${R?h`<${Card} t="Officer performance (completed)"><${Bars} d=${gb(C.filter(c=>c.off&&grp(c.status)>=3||c.status=='Investigation Completed'),c=>on(S,c.off))} c="bg-green-500"/><//><${Card} t="Daily complaints"><${Bars} d=${gb(C,c=>c.date).slice(-6)}/><//>`:h`<${Card} t="By district"><${Bars} d=${gb(C,c=>c.district)}/><//><${Card} t="Resolution rate by station (%)"><${Bars} d=${rate} c="bg-green-500"/><//><${Card} t="Station performance (complaints)"><${Bars} d=${gb(C,c=>c.station)} c="bg-sky-400"/><//>`}</div>`}
