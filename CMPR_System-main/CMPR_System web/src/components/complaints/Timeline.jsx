import { h } from '../../lib/h';
import { IDX } from '../../lib/constants';
import { Ic } from '../ui/Icon';

export function Tl({c}){const i=IDX[c.status]??-1;const D=['Submitted','Received by police station','Under review','Assigned to police officer','Under investigation','Investigation completed','Closed'];return h`<div>${c.status=='Rejected'&&h`<p className="text-red-400 text-sm mb-2">This complaint was rejected: ${c.hist[c.hist.length-1][2]}</p>`}<div className="space-y-3">${D.map((d,k)=>{const e=c.hist.find(x=>IDX[x[0]]==k);return h`<div key=${k} className="flex gap-3"><div className=${'w-5 h-5 rounded-full shrink-0 flex items-center justify-center '+(k<=i?'bg-pr text-white':'bg-ip border border-bd')}>${k<=i&&h`<${Ic} n="check" s=${12}/>`}</div><div className=${k<=i?'':'text-mu'}><div className="text-sm font-medium">${d}</div>${e&&h`<div className="text-xs text-mu">${e[1]} \u00b7 ${e[2]}</div>`}</div></div>`})}</div></div>`}
