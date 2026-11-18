import { useState } from 'react';
import { h } from '../../lib/h';
import { Tl } from '../../components/complaints/Timeline';
import { Badge } from '../../components/ui/Badge';
import { Card, Pg, Sel } from '../../components/ui/Primitives';
import { mine } from '../../lib/helpers';

export function Track({S}){const m=mine(S);const[id,si]=useState(m[0]&&m[0].id);const c=m.find(x=>x.id==id);return h`<${Pg} t="Complaint tracking" sub="Follow each stage of your complaint"/><${Card}><div className="mb-4"><${Sel} v=${id} set=${si} opts=${m.map(x=>x.id)}/></div>${c?h`<div className="mb-3 text-sm">${c.title} <${Badge} s=${c.status}/></div><${Tl} c=${c}/>`:h`<p className="text-mu">No complaints yet.</p>`}<//>`}
