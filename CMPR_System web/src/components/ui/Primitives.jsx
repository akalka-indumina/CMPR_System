import { h } from '../../lib/h';
import { INP } from '../../lib/constants';
import { Ic } from './Icon';

export const Card=({t,children,cls=''})=>h`<div className=${'bg-cd border border-bd rounded-xl p-4 shadow-sm '+cls}>${t&&h`<h3 className="font-semibold mb-3 text-sm">${t}</h3>`}${children}</div>`;
export const Stat=({l,v,c='text-tx'})=>h`<div className="bg-cd border border-bd rounded-xl p-4"><div className="text-mu text-xs">${l}</div><div className=${'text-2xl font-bold mt-1 '+c}>${v}</div></div>`;
export const Grid=({children,n=4})=>h`<div className=${'grid gap-3 grid-cols-2 '+(n==6?'lg:grid-cols-3 xl:grid-cols-6':'lg:grid-cols-'+n)}>${children}</div>`;
export const Pg=({t,sub,children})=>h`<div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-xl font-bold">${t}</h1>${sub&&h`<p className="text-mu text-sm">${sub}</p>`}</div><div className="flex gap-2">${children}</div></div></div>`;
export const Sel=({v,set,opts,ph})=>h`<select className=${INP+' sm:w-auto'} value=${v} onChange=${e=>set(e.target.value)}>${ph!=null&&h`<option value="">${ph}</option>`}${opts.map(o=>h`<option key=${o}>${o}</option>`)}</select>`;
export const Bar=({q,sq,children})=>h`<div className="flex flex-wrap gap-2 mb-3"><input className=${INP+' sm:w-64'} placeholder="Search..." value=${q} onChange=${e=>sq(e.target.value)} onInput=${e=>sq(e.target.value)}/>${children}</div>`;
export const Modal=({t,close,children,w='max-w-2xl'})=>h`<div className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-3 overflow-y-auto" onClick=${close}><div className=${'bg-cd border border-bd rounded-xl w-full my-4 '+w} onClick=${e=>e.stopPropagation()}><div className="flex justify-between items-center p-4 border-b border-bd"><h2 className="font-semibold">${t}</h2><button onClick=${close} className="text-mu hover:text-tx p-1"><${Ic} n="x"/></button></div><div className="p-4">${children}</div></div></div>`;
export const Fld=({l,err,children})=>h`<label className="block text-sm"><span className="text-mu text-xs">${l}</span><div className="mt-1">${children}</div>${err&&h`<span className="text-red-400 text-xs">${err}</span>`}</label>`;
