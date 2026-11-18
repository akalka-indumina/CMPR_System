import { useState } from 'react';
import { h } from '../../lib/h';
import { Bd } from '../../components/ui/Badge';
import { Card, Pg, Sel } from '../../components/ui/Primitives';
import { Tbl } from '../../components/ui/Table';
import { INP } from '../../lib/constants';

export function Audit({S}){const[u,su]=useState(''),[r,sr]=useState(''),[a,sa]=useState(''),[f,sf]=useState(''),[t,st]=useState('');const rows=S.AUD.filter(x=>(!u||x.user==u)&&(!r||x.role==r)&&(!a||x.action==a)&&(!f||x.dt.slice(0,10)>=f)&&(!t||x.dt.slice(0,10)<=t));const u2=k=>[...new Set(S.AUD.map(x=>x[k]))];
 return h`<${Pg} t="Audit Logs" sub="Read-only record of system activity"/><${Card}><div className="flex flex-wrap gap-2 mb-3"><${Sel} v=${u} set=${su} opts=${u2('user')} ph="All users"/><${Sel} v=${r} set=${sr} opts=${u2('role')} ph="All roles"/><${Sel} v=${a} set=${sa} opts=${u2('action')} ph="All actions"/><input type="date" className=${INP+' sm:w-auto'} value=${f} onChange=${e=>sf(e.target.value)}/><input type="date" className=${INP+' sm:w-auto'} value=${t} onChange=${e=>st(e.target.value)}/></div><${Tbl} cols=${[['Activity ID',x=>x.id],['User',x=>x.user,'user'],['Role',x=>x.role],['Action',x=>h`<${Bd} c="s" t=${x.action}/>`],['Description',x=>x.desc],['Date and time',x=>x.dt,'dt'],['IP address',x=>x.ip]]} rows=${rows}/><//>`}
