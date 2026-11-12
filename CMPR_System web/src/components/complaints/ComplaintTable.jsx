import { useState } from 'react';
import { h } from '../../lib/h';
import { Badge, Bd } from '../ui/Badge';
import { Bar, Card, Sel } from '../ui/Primitives';
import { Tbl } from '../ui/Table';
import { B1, PC, ST } from '../../lib/constants';
import { on } from '../../lib/helpers';

export const CK=S=>({id:['Complaint ID',c=>h`<span className="font-mono text-xs text-red-400">${c.id}</span>`,'id'],title:['Title',c=>h`<span className="block max-w-[220px] truncate">${c.title}</span>`,'title'],cat:['Category',c=>c.cat,'cat'],cit:['Citizen',c=>c.cit,'cit'],stn:['Police Station',c=>c.station,'station'],date:['Submitted',c=>c.date,'date'],prio:['Priority',c=>h`<${Bd} c=${PC[c.prio]} t=${c.prio}/>`,'prio'],status:['Status',c=>h`<${Badge} s=${c.status}/>`,'status'],off:['Officer',c=>on(S,c.off),'off'],ad:['Assigned',c=>(c.hist.find(x=>x[0]=='Assigned')||[])[1]||'\u2014'],upd:['Last Update',c=>c.hist[c.hist.length-1][1]]});
export function CT({S,rows,keys,btn='View Details'}){const[q,sq]=useState(''),[st,ss]=useState('');const K=CK(S);const f=rows.filter(c=>(c.id+c.title+c.cit+c.cat).toLowerCase().includes(q.toLowerCase())&&(!st||c.status==st));return h`<${Card}><${Bar} q=${q} sq=${sq}><${Sel} v=${st} set=${ss} opts=${ST} ph="All statuses"/><//><${Tbl} cols=${[...keys.map(k=>K[k]),['Actions',c=>h`<button className=${B1} onClick=${()=>S.setM(c.id)}>${btn}</button>`]]} rows=${f}/><//>`}
